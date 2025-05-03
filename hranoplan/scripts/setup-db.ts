import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

interface Recipe {
  id: string;
  name: string;
  prepTime: string;
  cookTime: string;
  totalTime: string;
  servings: number;
  ingredients: Ingredient[];
  instructions: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  tags: string[];
}

interface RecipesData {
  recipes: Recipe[];
}

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(
  /['"]/g,
  ""
).replace(/;$/, "");
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(
  /['"]/g,
  ""
).replace(/;$/, "");

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env file");
  process.exit(1);
}

console.log("Connecting to Supabase at:", supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to wait
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to split SQL statements properly
function splitSQLStatements(sql: string): string[] {
  const statements: string[] = [];
  let currentStatement = "";
  let inDollarQuote = false;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextChar = sql[i + 1];

    // Handle dollar quoting
    if (char === "$" && nextChar === "$") {
      if (!inDollarQuote) {
        // Start of dollar quote
        inDollarQuote = true;
        currentStatement += "$$";
        i++; // Skip next $
      } else {
        // End of dollar quote
        inDollarQuote = false;
        currentStatement += "$$";
        i++; // Skip next $
      }
      continue;
    }

    // Handle semicolons
    if (char === ";" && !inDollarQuote) {
      currentStatement += ";";
      if (currentStatement.trim()) {
        statements.push(currentStatement.trim());
      }
      currentStatement = "";
      continue;
    }

    currentStatement += char;
  }

  // Add any remaining statement
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }

  return statements;
}

// Helper function to verify schema cache
async function verifySchemaCache(retries = 5, delay = 5000): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    console.log(`Verifying schema cache (attempt ${i + 1}/${retries})...`);

    // First check if we can just select from the table
    const { error: existsError } = await supabase
      .from("recipes")
      .select("id")
      .limit(1);

    if (!existsError) {
      console.log("Schema cache verified successfully");
      return true;
    }

    if (
      !existsError.message?.includes('relation "recipes" does not exist') &&
      !existsError.message?.includes("schema cache")
    ) {
      console.error("Unexpected error:", existsError);
      return false;
    }

    if (i < retries - 1) {
      console.log(`Waiting ${delay / 1000} seconds before next attempt...`);
      await wait(delay);
    }
  }

  console.error("Failed to verify schema cache after all retries");
  return false;
}

async function setupDatabase() {
  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync(
      path.resolve(__dirname, "../supabase/migrations/002_create_tables.sql"),
      "utf-8"
    );

    // Split the SQL content into individual statements
    const statements = splitSQLStatements(sqlContent);

    // Execute each statement
    for (const statement of statements) {
      const { error } = await supabase.rpc("exec_sql", {
        sql_statement: statement,
      });

      if (error) {
        // If the error is about the function not existing, create it first
        if (
          error.message?.includes("Could not find the function public.exec_sql")
        ) {
          console.log("Creating exec_sql function...");
          const createFunctionSQL = `
            CREATE OR REPLACE FUNCTION exec_sql(sql_statement text)
            RETURNS void AS $$
            BEGIN
              EXECUTE sql_statement;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
          `;

          const { error: createFunctionError } = await supabase.rpc(
            "exec_sql",
            {
              sql_statement: createFunctionSQL,
            }
          );

          if (createFunctionError) {
            console.error(
              "Error creating exec_sql function:",
              createFunctionError
            );
            return;
          }

          // Try the original statement again
          const { error: retryError } = await supabase.rpc("exec_sql", {
            sql_statement: statement,
          });

          if (retryError) {
            console.error("Error executing SQL statement:", retryError);
            return;
          }
        } else {
          console.error("Error executing SQL statement:", error);
          return;
        }
      }
    }

    console.log("Database tables created successfully");

    // Wait for schema cache to update with retries
    if (!(await verifySchemaCache())) {
      return;
    }
  } catch (error) {
    console.error("Error setting up database:", error);
  }
}

async function importRecipes() {
  try {
    const recipesData = JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, "../src/data/recipes.json"),
        "utf-8"
      )
    ) as RecipesData;

    // Import recipes in batches to avoid overwhelming the database
    const batchSize = 50;
    const recipes = recipesData.recipes.map((recipe: Recipe) => ({
      name: recipe.name,
      description: "", // You can add descriptions later
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      prep_time: parseInt(recipe.prepTime),
      cook_time: parseInt(recipe.cookTime),
      servings: recipe.servings,
      image_url: null, // You can add image URLs later
      tags: recipe.tags,
    }));

    for (let i = 0; i < recipes.length; i += batchSize) {
      const batch = recipes.slice(i, i + batchSize);
      const { error } = await supabase.from("recipes").insert(batch);

      if (error) {
        console.error(
          `Error importing recipes batch ${i / batchSize + 1}:`,
          error
        );
        return;
      }

      console.log(
        `Imported batch ${i / batchSize + 1} of ${Math.ceil(
          recipes.length / batchSize
        )}`
      );

      // Small delay between batches
      if (i + batchSize < recipes.length) {
        await wait(1000);
      }
    }

    console.log(`Successfully imported all ${recipes.length} recipes`);
  } catch (error) {
    console.error("Error importing recipes:", error);
  }
}

async function main() {
  await setupDatabase();
  await importRecipes();
}

main().catch(console.error);
