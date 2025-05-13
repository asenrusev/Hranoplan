import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase";

interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
}

interface Recipe {
  id: string;
  ingredients: Ingredient[];
  // Add other recipe fields as needed
}

interface MealPlanRecipe {
  recipes: Recipe;
  day_of_week: number;
  id: string;
  meal_type: string;
}

interface MealPlan {
  id: string;
  days: number;
  servingsPerDay: number;
  meal_plan_recipes: MealPlanRecipe[];
  excludedProducts?: string[];
  // Add other meal plan fields as needed
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const planId = id;

    // Fetch meal plan with recipes in a single query
    const { data, error } = await supabase
      .from("meal_plans")
      .select(
        `
        *,
        meal_plan_recipes (
          *,
          recipes (*)
        )
      `
      )
      .eq("id", planId)
      .single();

    if (error) {
      console.error("Error fetching meal plan:", error);
      throw error;
    }

    const typedData = data as MealPlan;

    // Extract plan data and recipes
    const planData = {
      id: typedData.id,
      days: typedData.days,
      servingsPerDay: typedData.servingsPerDay,
      excludedProducts: typedData.excludedProducts ?? [],
      // ... copy other meal_plans fields you need
    };

    // Flat, ordered array of valid recipes
    const mealPlan = Array.isArray(typedData.meal_plan_recipes)
      ? typedData.meal_plan_recipes
          .map((row: { recipes: Recipe; meal_type: string }) => {
            if (!row.recipes || !Array.isArray(row.recipes.ingredients))
              return null;
            return {
              recipe: row.recipes,
              slotType: row.meal_type as "breakfast" | "lunch" | "dinner",
            };
          })
          .filter(
            (
              r: {
                recipe: Recipe;
                slotType: "breakfast" | "lunch" | "dinner";
              } | null
            ): r is {
              recipe: Recipe;
              slotType: "breakfast" | "lunch" | "dinner";
            } => !!r
          )
      : [];

    // Ensure planData has days and servingsPerDay
    if (
      typeof planData.days !== "number" ||
      typeof planData.servingsPerDay !== "number"
    ) {
      return NextResponse.json(
        {
          error: "Meal plan is missing days or servingsPerDay metadata.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        plan: planData,
        mealPlan,
      },
    });
  } catch (error) {
    console.error("Error fetching meal plan:", error);
    return NextResponse.json(
      { error: "Failed to fetch meal plan" },
      { status: 500 }
    );
  }
}
