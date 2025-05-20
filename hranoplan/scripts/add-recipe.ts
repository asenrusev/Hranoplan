import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

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
  is_breakfast: boolean;
  is_lunch: boolean;
  is_dinner: boolean;
  is_snack?: boolean;
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
        is_breakfast: recipe.is_breakfast,
        is_lunch: recipe.is_lunch,
        is_dinner: recipe.is_dinner,
        is_snack: recipe.is_snack,
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

async function main() {
  // const testRecipesPath = join(__dirname, "test-recipes.json");
  // console.log("Starting recipe import...");
  // await addRecipesFromFile(testRecipesPath);
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
  is_breakfast: false,
  is_lunch: false,
  is_dinner: false,
};

// For adding multiple recipes inline:
export const recipeList: Recipe[] = [
  {
    name: "Таратор",
    description:
      "Класическа българска студена супа с кисело мляко, краставици и копър.",
    ingredients: [
      { name: "Кисело мляко", amount: 400, unit: "г" },
      { name: "Краставица", amount: 1, unit: "брой" },
      { name: "Чесън", amount: 1, unit: "скилидка" },
    ],
    instructions: [
      "Обелете и нарежете краставицата на малки кубчета.",
      "Смесете киселото мляко с водата, разбъркайте добре.",
      "Добавете нарязаната краставица, счукания чесън, копъра, орехите и солта.",
      "Разбъркайте всичко и добавете зехтина.",
      "Охладете и сервирайте студено.",
    ],
    prep_time: 10,
    cook_time: 0,
    servings: 2,
    image_url: null,
    tags: ["супа", "традиционна", "лято"],
    is_breakfast: false,
    is_lunch: true,
    is_dinner: true,
    is_snack: false,
  },
];

async function addRecipeList(recipes: Recipe[]) {
  let successCount = 0;
  let failureCount = 0;
  for (const recipe of recipes) {
    const success = await addRecipe(recipe);
    if (success) successCount++;
    else failureCount++;
  }
  console.log(`\nInline import complete:`);
  console.log(`Successfully added: ${successCount} recipes`);
  console.log(`Failed to add: ${failureCount} recipes`);
}

// Uncomment to run inline import:
addRecipeList(recipeList);

// For importing from a file:
// addRecipesFromFile(path.join(__dirname, "recipes.json"));

// main().catch(console.error);
