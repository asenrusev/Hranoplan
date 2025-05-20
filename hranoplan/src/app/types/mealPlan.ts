import type { MealPlanSlot } from "@/utils/recipeUtils";

export interface MealPlan {
  days: number;
  servingsPerDay: number;
  prepTime: string;
  meals: MealPlanSlot[];
}
