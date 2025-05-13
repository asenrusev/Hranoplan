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
      const filtered = data.filter((recipe) => {
        const ingredients = recipe.ingredients as unknown as Ingredient[];
        return !ingredients.some((ingredient) =>
          options.excludedProducts!.some((excluded) =>
            ingredient.name.toLowerCase().includes(excluded.toLowerCase())
          )
        );
      });
      return filtered;
    }

    return data;
  } catch (error) {
    console.error("Error in fetchRecipes:", error);
    return [];
  }
}

type MealType = "breakfast" | "lunch" | "dinner";

function getOrderedMealSlots(servingsPerDay: number): MealType[] {
  const baseOrder: MealType[] = ["breakfast", "lunch", "dinner"];
  const slots: MealType[] = [];
  for (let i = 0; i < servingsPerDay; i++) {
    slots.push(baseOrder[i % baseOrder.length]);
  }
  return slots;
}

function getMealTypeField(type: MealType): keyof Recipe {
  switch (type) {
    case "breakfast":
      return "is_breakfast";
    case "lunch":
      return "is_lunch";
    case "dinner":
      return "is_dinner";
  }
}

export type MealSlotType = "breakfast" | "lunch" | "dinner";

export interface MealPlanSlot {
  recipe: Recipe;
  slotType: MealSlotType;
}

export async function generateMealPlan(
  days: number,
  servingsPerDay: number,
  prepTime: string,
  excludedProducts: string[] = []
): Promise<MealPlanSlot[]> {
  try {
    // Fetch all recipes that match the criteria
    const recipes = await fetchRecipes({ prepTime, excludedProducts });

    if (recipes.length === 0) {
      throw new Error("No recipes found matching the criteria");
    }

    const mealPlan: MealPlanSlot[] = [];
    const mealSlotsPerDay = getOrderedMealSlots(servingsPerDay);

    for (let day = 0; day < days; day++) {
      for (const slotType of mealSlotsPerDay) {
        const mealTypeField = getMealTypeField(slotType);
        // Get available recipes for this meal type (main or supplementary)
        const availableRecipes = recipes.filter(
          (recipe) => recipe[mealTypeField]
        );
        if (availableRecipes.length === 0) {
          throw new Error(`No recipes found for meal type: ${slotType}`);
        }
        // Try to find a recipe that hasn't been used in the last 2 days
        const recentMealPlan = mealPlan.slice(-servingsPerDay * 2);
        const unusedRecipes = availableRecipes.filter(
          (recipe) => !recentMealPlan.some((r) => r.recipe.id === recipe.id)
        );
        // Select a main meal (prefer non-supplementary)
        const mainCandidates = (
          unusedRecipes.length > 0 ? unusedRecipes : availableRecipes
        ).filter((r) => !r.is_supplementary);
        let selectedRecipe: Recipe;
        if (mainCandidates.length > 0) {
          selectedRecipe =
            mainCandidates[Math.floor(Math.random() * mainCandidates.length)];
        } else {
          // If no main, fallback to any available (including supplementary)
          selectedRecipe = (
            unusedRecipes.length > 0 ? unusedRecipes : availableRecipes
          )[0];
        }
        mealPlan.push({ recipe: selectedRecipe, slotType });
        // Optionally add a supplementary meal
        const supplementaryMeals = availableRecipes.filter(
          (recipe) => recipe.is_supplementary && recipe.id !== selectedRecipe.id
        );
        if (supplementaryMeals.length > 0 && Math.random() < 0.5) {
          const unusedSupplementary = supplementaryMeals.filter(
            (recipe) => !recentMealPlan.some((r) => r.recipe.id === recipe.id)
          );
          const supplementaryMeal =
            unusedSupplementary.length > 0
              ? unusedSupplementary[
                  Math.floor(Math.random() * unusedSupplementary.length)
                ]
              : supplementaryMeals[
                  Math.floor(Math.random() * supplementaryMeals.length)
                ];
          mealPlan.push({ recipe: supplementaryMeal, slotType });
        }
      }
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
