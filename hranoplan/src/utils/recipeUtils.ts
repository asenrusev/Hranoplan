import { supabase, type Database } from "./supabase";

export type Recipe = Database["public"]["Tables"]["recipes"]["Row"] & {
  is_snack?: boolean;
};

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface ShoppingListItem extends Ingredient {
  recipes: string[];
}

export type MealSlotType = "breakfast" | "lunch" | "dinner" | "snack";

export interface MealPlanSlot {
  recipe: Recipe;
  slotType: MealSlotType;
  dayIndex: number;
}

export async function fetchRecipes(
  selectedRecipeIds: string[]
): Promise<Recipe[]> {
  try {
    let query = supabase.from("recipes").select("*");
    if (selectedRecipeIds && selectedRecipeIds.length > 0) {
      query = query.in("id", selectedRecipeIds);
    }
    const { data, error } = await query;
    if (error) {
      console.error("Error fetching recipes:", error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error("Error in fetchRecipes:", error);
    return [];
  }
}

export async function generateMealPlan(
  days: number,
  servingsPerDay: number, // ignored
  prepTime: string, // ignored
  selectedRecipeIds?: string[]
): Promise<MealPlanSlot[]> {
  const recipes = await fetchRecipes(selectedRecipeIds || []);
  if (!recipes.length) throw new Error("No recipes found");
  const mealPlan: MealPlanSlot[] = [];
  const mainSlots: MealSlotType[] = ["breakfast", "lunch", "dinner"];
  // Pre-group recipes by slot
  const slotRecipes: Record<MealSlotType, Recipe[]> = {
    breakfast: recipes.filter((r) => r.is_breakfast),
    lunch: recipes.filter((r) => r.is_lunch),
    dinner: recipes.filter((r) => r.is_dinner),
    snack: recipes.filter((r) => r.is_snack),
  };
  for (let day = 0; day < days; day++) {
    // Main slots
    for (const slotType of mainSlots) {
      const available = slotRecipes[slotType];
      if (available.length === 0) {
        throw new Error(`No recipes for slot ${slotType}`);
      }
      // Try to avoid repetition from previous day
      const prev = mealPlan.find(
        (m) => m.dayIndex === day - 1 && m.slotType === slotType
      );
      const nonRepeat = available.filter(
        (r) => !prev || r.id !== prev.recipe.id
      );
      const selected =
        nonRepeat.length > 0
          ? nonRepeat[Math.floor(Math.random() * nonRepeat.length)]
          : available[Math.floor(Math.random() * available.length)];
      mealPlan.push({ recipe: selected, slotType, dayIndex: day });
    }
    // Snack (optional)
    const snacks = slotRecipes.snack;
    if (snacks.length > 0) {
      const prevSnack = mealPlan.find(
        (m) => m.dayIndex === day - 1 && m.slotType === "snack"
      );
      const nonRepeatSnacks = snacks.filter(
        (r) => !prevSnack || r.id !== prevSnack.recipe.id
      );
      const snack =
        nonRepeatSnacks.length > 0
          ? nonRepeatSnacks[Math.floor(Math.random() * nonRepeatSnacks.length)]
          : snacks[Math.floor(Math.random() * snacks.length)];
      mealPlan.push({ recipe: snack, slotType: "snack", dayIndex: day });
    }
  }
  return mealPlan;
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
