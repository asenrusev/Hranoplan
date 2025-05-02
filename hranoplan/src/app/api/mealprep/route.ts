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
    console.log("API received data:", data);

    // Validate the input data
    if (!data.days || !data.servingsPerDay || !data.prepTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate meal plan using our utility function
    const mealPlan = generateMealPlan(
      data.days,
      data.servingsPerDay,
      data.prepTime,
      data.excludedProducts
    );
    console.log("Generated meal plan:", JSON.stringify(mealPlan, null, 2));

    const response = {
      success: true,
      message: "Meal plan generated successfully",
      data: {
        mealPlan: mealPlan,
        requestParams: data,
      },
    };
    console.log("API response:", JSON.stringify(response, null, 2));

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error generating meal plan:", error);
    return NextResponse.json(
      { error: "Failed to generate meal plan" },
      { status: 500 }
    );
  }
}
