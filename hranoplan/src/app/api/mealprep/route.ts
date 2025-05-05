import { NextResponse } from "next/server";
import { generateMealPlan } from "@/utils/recipeUtils";
import { supabase } from "@/utils/supabase";

interface MealPlanRequestData {
  days: number;
  servingsPerDay: number;
  prepTime: string;
  excludedProducts: string[];
  anonymousUserId: string;
}

export async function POST(request: Request) {
  try {
    const data: MealPlanRequestData = await request.json();

    // Validate the input data
    if (
      !data.days ||
      !data.servingsPerDay ||
      !data.prepTime ||
      !data.anonymousUserId
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate meal plan using our utility function
    const mealPlan = await generateMealPlan(
      data.days,
      data.servingsPerDay,
      data.prepTime,
      data.excludedProducts
    );

    // Calculate start and end dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + data.days - 1);

    // Save meal plan to database
    const { data: savedMealPlan, error: mealPlanError } = await supabase
      .from("meal_plans")
      .insert({
        name: `Meal Plan ${startDate.toLocaleDateString()}`,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        user_id: data.anonymousUserId,
        days: data.days,
        servingsPerDay: data.servingsPerDay,
        prepTime: data.prepTime,
      })
      .select()
      .single();

    if (mealPlanError) {
      console.error("Error saving meal plan:", mealPlanError);
      throw mealPlanError;
    }

    // Save meal plan recipes
    const mealPlanRecipes = mealPlan.map((recipe, index) => ({
      meal_plan_id: savedMealPlan.id,
      recipe_id: recipe.id,
      day_of_week: Math.floor(index / data.servingsPerDay),
      meal_type: "main", // TODO: Add support for different meal types
    }));

    const { error: recipesError } = await supabase
      .from("meal_plan_recipes")
      .insert(mealPlanRecipes);

    if (recipesError) {
      console.error("Error saving meal plan recipes:", recipesError);
      throw recipesError;
    }

    const response = {
      success: true,
      message: "Meal plan generated and saved successfully",
      data: {
        mealPlan: mealPlan,
        requestParams: data,
        savedPlanId: savedMealPlan.id,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error generating meal plan:", error);
    return NextResponse.json(
      { error: "Failed to generate meal plan" },
      { status: 500 }
    );
  }
}
