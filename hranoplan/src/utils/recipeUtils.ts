import { supabase, type Database } from "./supabase";

export type Recipe = Database["public"]["Tables"]["recipes"]["Row"];

export interface Ingredient {
  name: string;
  quantity: number;
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
    if (options.prepTime) {
      const maxPrepTime =
        options.prepTime === "quick"
          ? 30
          : options.prepTime === "medium"
          ? 60
          : 120;
      query = query.lte("prep_time", maxPrepTime);
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

export function generateShoppingList(recipes: Recipe[]): ShoppingListItem[] {
  const ingredientMap = new Map<string, ShoppingListItem>();

  recipes.forEach((recipe) => {
    const ingredients = recipe.ingredients as unknown as Ingredient[];
    ingredients.forEach((ingredient) => {
      const key = `${ingredient.name}-${ingredient.unit}`;
      if (ingredientMap.has(key)) {
        const item = ingredientMap.get(key)!;
        item.quantity += ingredient.quantity;
        item.recipes.push(recipe.name);
      } else {
        ingredientMap.set(key, {
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          recipes: [recipe.name],
        });
      }
    });
  });

  return Array.from(ingredientMap.values());
}
