import { NextResponse } from "next/server";
import { generateMealPlan } from "@/utils/recipeUtils";

interface MealPlanRequestData {
  days: number;
  servingsPerDay: number;
  prepTime: string;
  excludedProducts: string[];
}

export async function POST(request: Request) {
  try {
    const data: MealPlanRequestData = await request.json();
    // Validate the input data
    if (!data.days || !data.servingsPerDay || !data.prepTime) {
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

    const response = {
      success: true,
      message: "Meal plan generated successfully",
      data: {
        mealPlan: mealPlan,
        requestParams: data,
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
