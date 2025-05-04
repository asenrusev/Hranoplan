import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const planId = id;

    // Fetch meal plan details
    const { data: planData, error: planError } = await supabase
      .from("meal_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError) {
      console.error("Error fetching meal plan:", planError);
      throw planError;
    }

    // Fetch meal plan recipes
    const { data: recipesData, error: recipesError } = await supabase
      .from("meal_plan_recipes")
      .select(
        `
        *,
        recipes (*)
      `
      )
      .eq("meal_plan_id", planId)
      .order("day_of_week", { ascending: true })
      .order("id", { ascending: true }); // Ensure deterministic order

    if (recipesError) {
      console.error("Error fetching meal plan recipes:", recipesError);
      throw recipesError;
    }

    // Flat, ordered array of valid recipes
    const mealPlan = Array.isArray(recipesData)
      ? recipesData
          .map((row) => row.recipes)
          .filter((r) => !!r && Array.isArray(r.ingredients))
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
