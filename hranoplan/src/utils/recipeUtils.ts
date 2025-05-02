import recipesData from "../data/recipes.json";

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string; // metric units, e.g., 'g', 'ml', 'pcs'
}

export interface Recipe {
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

export interface ShoppingListItem {
  name: string;
  quantity: number;
  unit: string;
}

export function getRecipes(): Recipe[] {
  // Ensure instructions are always string[]
  return recipesData.recipes.map((recipe: unknown) => {
    const r = recipe as Omit<Recipe, "instructions"> & {
      instructions: unknown;
    };
    return {
      ...r,
      instructions: Array.isArray(r.instructions)
        ? r.instructions.map((inst) =>
            typeof inst === "string" ? inst : JSON.stringify(inst)
          )
        : [],
    };
  });
}

export function getRecipeById(id: string): Recipe | undefined {
  return getRecipes().find((recipe) => recipe.id === id);
}

export function filterRecipesByPrepTime(maxPrepTime: string): Recipe[] {
  if (maxPrepTime === "any") {
    return getRecipes();
  }
  const maxTime = parseInt(maxPrepTime);
  return getRecipes().filter((recipe) => parseInt(recipe.prepTime) <= maxTime);
}

export function filterRecipesByServings(servings: number): Recipe[] {
  return getRecipes().filter((recipe) => recipe.servings >= servings);
}

export function filterRecipesByTags(tags: string[]): Recipe[] {
  return getRecipes().filter((recipe) =>
    tags.some((tag) => recipe.tags.includes(tag))
  );
}

export function generateMealPlan(
  days: number,
  servingsPerDay: number,
  prepTime: string,
  excludedProducts: string[] = []
): Recipe[] {
  console.log("Starting meal plan generation with:", {
    days,
    servingsPerDay,
    prepTime,
    excludedProducts,
  });
  let availableRecipes = getRecipes();
  console.log("Initial recipes count:", availableRecipes.length);

  // Filter out recipes with excluded products
  if (excludedProducts.length > 0) {
    availableRecipes = availableRecipes.filter(
      (recipe) =>
        !recipe.ingredients.some((ingredient) =>
          excludedProducts.some((excluded) =>
            ingredient.name.toLowerCase().includes(excluded.toLowerCase())
          )
        )
    );
    console.log("After excluding products:", availableRecipes.length);
  }

  // Filter by prep time (using prepTime instead of totalTime)
  availableRecipes = filterRecipesByPrepTime(prepTime);
  console.log("After prep time filter:", availableRecipes.length, "recipes");

  // If no recipes match the criteria, return all recipes
  if (availableRecipes.length === 0) {
    console.warn("No recipes match the specified criteria, using all recipes");
    availableRecipes = getRecipes();
  }

  // Calculate total number of meals needed
  const totalMealsNeeded = days * servingsPerDay;
  console.log("Total meals needed:", totalMealsNeeded);

  // Randomly select recipes for the meal plan
  const selectedRecipes: Recipe[] = [];

  // Create a copy of available recipes to avoid modifying the original array
  let remainingRecipes = [...availableRecipes];

  while (selectedRecipes.length < totalMealsNeeded) {
    if (remainingRecipes.length === 0) {
      // If we've used all recipes, start over with the full list
      remainingRecipes = [...availableRecipes];
    }

    const randomIndex = Math.floor(Math.random() * remainingRecipes.length);
    const recipe = remainingRecipes[randomIndex];

    // Remove the selected recipe from remaining recipes
    remainingRecipes.splice(randomIndex, 1);

    // Add the recipe to selected recipes
    selectedRecipes.push(recipe);
  }

  console.log("Final selected recipes:", selectedRecipes.length);
  return selectedRecipes;
}

export function aggregateShoppingList(recipes: Recipe[]): ShoppingListItem[] {
  const itemMap = new Map<string, ShoppingListItem>();
  for (const recipe of recipes) {
    for (const ingredient of recipe.ingredients) {
      const key = `${ingredient.name.toLowerCase()}|${ingredient.unit}`;
      if (itemMap.has(key)) {
        itemMap.get(key)!.quantity += ingredient.quantity;
      } else {
        itemMap.set(key, { ...ingredient });
      }
    }
  }
  return Array.from(itemMap.values());
}
