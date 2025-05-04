import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env file");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

interface Recipe {
  name: string;
  description: string | null;
  ingredients: Ingredient[];
  instructions: string[];
  prep_time: number | null;
  cook_time: number | null;
  servings: number | null;
  image_url: string | null;
  tags: string[] | null;
}

function validateRecipe(recipe: Recipe): string[] {
  const errors: string[] = [];

  if (!recipe.name) errors.push("Recipe name is required");
  if (
    !recipe.ingredients ||
    !Array.isArray(recipe.ingredients) ||
    recipe.ingredients.length === 0
  ) {
    errors.push("Recipe must have at least one ingredient");
  }
  if (
    !recipe.instructions ||
    !Array.isArray(recipe.instructions) ||
    recipe.instructions.length === 0
  ) {
    errors.push("Recipe must have at least one instruction");
  }

  // Validate ingredients
  recipe.ingredients?.forEach((ingredient, index) => {
    if (!ingredient.name)
      errors.push(`Ingredient ${index + 1} is missing a name`);
    if (typeof ingredient.amount !== "number")
      errors.push(`Ingredient ${index + 1} must have a numeric amount`);
    if (!ingredient.unit)
      errors.push(`Ingredient ${index + 1} is missing a unit`);
  });

  return errors;
}

async function addRecipe(recipe: Recipe) {
  const errors = validateRecipe(recipe);
  if (errors.length > 0) {
    console.error("Validation errors:", errors);
    return false;
  }

  try {
    const { error } = await supabase
      .from("recipes")
      .insert({
        name: recipe.name,
        description: recipe.description,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        prep_time: recipe.prep_time,
        cook_time: recipe.cook_time,
        servings: recipe.servings,
        image_url: recipe.image_url,
        tags: recipe.tags,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding recipe:", error);
      return false;
    }

    console.log(`Successfully added recipe: ${recipe.name}`);
    return true;
  } catch (error) {
    console.error("Error adding recipe:", error);
    return false;
  }
}

async function addRecipesFromFile(filePath: string) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const recipes = JSON.parse(content);

    if (!Array.isArray(recipes)) {
      console.error("File must contain an array of recipes");
      return;
    }

    let successCount = 0;
    let failureCount = 0;

    for (const recipe of recipes) {
      const success = await addRecipe(recipe);
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    console.log(`\nImport complete:`);
    console.log(`Successfully added: ${successCount} recipes`);
    console.log(`Failed to add: ${failureCount} recipes`);
  } catch (error) {
    console.error("Error reading or parsing file:", error);
  }
}

async function main() {
  const testRecipesPath = join(__dirname, "test-recipes.json");
  console.log("Starting recipe import...");
  await addRecipesFromFile(testRecipesPath);
}

// Run the script
main().catch(console.error);

// Example usage:
// For a single recipe:
export const singleRecipe: Recipe = {
  name: "Test Recipe",
  description: "A test recipe",
  ingredients: [{ name: "Test Ingredient", amount: 1, unit: "piece" }],
  instructions: ["Test instruction"],
  prep_time: 10,
  cook_time: 20,
  servings: 2,
  image_url: null,
  tags: ["test"],
};

// For importing from a file:
// addRecipesFromFile(path.join(__dirname, "recipes.json"));

// Uncomment one of these to run:
// addRecipe(singleRecipe);
// addRecipesFromFile(path.join(__dirname, "recipes.json"));
