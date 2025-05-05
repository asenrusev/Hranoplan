import { supabase, type Database } from "./supabase";

export type Recipe = Database["public"]["Tables"]["recipes"]["Row"];

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface ShoppingListItem extends Ingredient {
  recipes: string[];
}

export async function fetchRecipes(
  options: {
    prepTime?: string;
    excludedProducts?: string[];
  } = {}
): Promise<Recipe[]> {
  try {
    let query = supabase.from("recipes").select("*");

    // Filter by prep time if specified
    if (options.prepTime && options.prepTime !== "any") {
      const maxPrepTime = Number(options.prepTime);
      if (!isNaN(maxPrepTime)) {
        query = query.lte("prep_time", maxPrepTime);
      }
    }

    // Execute the query
    const { data, error } = await query;

    if (error) {
      console.error("Error fetching recipes:", error);
      return [];
    }

    if (!data) {
      return [];
    }

    // Filter out recipes with excluded products
    if (options.excludedProducts && options.excludedProducts.length > 0) {
      return data.filter((recipe) => {
        const ingredients = recipe.ingredients as unknown as Ingredient[];
        return !ingredients.some((ingredient) =>
          options.excludedProducts!.some((excluded) =>
            ingredient.name.toLowerCase().includes(excluded.toLowerCase())
          )
        );
      });
    }

    return data;
  } catch (error) {
    console.error("Error in fetchRecipes:", error);
    return [];
  }
}

export async function generateMealPlan(
  days: number,
  servingsPerDay: number,
  prepTime: string,
  excludedProducts: string[] = []
): Promise<Recipe[]> {
  try {
    // Fetch recipes that match the criteria
    const recipes = await fetchRecipes({ prepTime, excludedProducts });

    if (recipes.length === 0) {
      throw new Error("No recipes found matching the criteria");
    }

    // Randomly select recipes for the meal plan
    const mealPlan: Recipe[] = [];
    const totalMealsNeeded = days * servingsPerDay;

    // First, try to use unique recipes
    const uniqueRecipes = [...recipes];

    while (mealPlan.length < totalMealsNeeded && uniqueRecipes.length > 0) {
      const randomIndex = Math.floor(Math.random() * uniqueRecipes.length);
      mealPlan.push(uniqueRecipes[randomIndex]);
      uniqueRecipes.splice(randomIndex, 1);
    }

    // If we still need more meals, reuse recipes from the original pool
    while (mealPlan.length < totalMealsNeeded) {
      const randomIndex = Math.floor(Math.random() * recipes.length);
      mealPlan.push(recipes[randomIndex]);
    }

    return mealPlan;
  } catch (error) {
    console.error("Error generating meal plan:", error);
    throw error;
  }
}

export function generateShoppingList(
  recipes: Recipe[] | undefined | null
): ShoppingListItem[] {
  if (!Array.isArray(recipes)) {
    console.error("generateShoppingList: recipes is not an array", recipes);
    return [];
  }
  const ingredientMap = new Map<string, ShoppingListItem>();

  recipes.forEach((recipe) => {
    if (!Array.isArray(recipe.ingredients)) {
      console.error("Recipe missing ingredients array:", recipe);
      return;
    }
    const ingredients = recipe.ingredients as unknown as Ingredient[];
    ingredients.forEach((ingredient) => {
      const key = `${ingredient.name}-${ingredient.unit}`;
      if (ingredientMap.has(key)) {
        const item = ingredientMap.get(key)!;
        item.amount += ingredient.amount;
        item.recipes.push(recipe.name);
      } else {
        ingredientMap.set(key, {
          name: ingredient.name,
          amount: ingredient.amount,
          unit: ingredient.unit,
          recipes: [recipe.name],
        });
      }
    });
  });

  return Array.from(ingredientMap.values());
}
