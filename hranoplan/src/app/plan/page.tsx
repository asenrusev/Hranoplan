"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAnonymousUserId } from "@/utils/anonymousUser";
import { track } from "@vercel/analytics";

// Helper function to check if we're in development
const isDevelopment = process.env.NODE_ENV === "development";

interface MealPlanFormData {
  days: number;
  servingsPerDay: number;
  prepTime: string;
  anonymousUserId: string;
  selectedRecipeIds: string[];
}

interface Recipe {
  id: string;
  name: string;
  is_snack: boolean;
  is_lunch: boolean;
  is_breakfast: boolean;
  is_dinner: boolean;
}

export default function PlanPage() {
  const [days, setDays] = useState<number>(1);
  const [servingsPerDay, setServingsPerDay] = useState<number>(1);
  const [prepTime, setPrepTime] = useState<string>("15");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const savedSettings = localStorage.getItem("mealPlanSettings");
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setDays(parsedSettings.days || 1);
      setServingsPerDay(parsedSettings.servingsPerDay || 1);
      setPrepTime(parsedSettings.prepTime || "15");
      setSelectedRecipeIds(parsedSettings.selectedRecipeIds || []);
    }
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const res = await fetch("/api/recipes");
      const data = await res.json();
      setRecipes(data || []);
      // Select all if not already selected
      setSelectedRecipeIds((prev) =>
        prev.length === 0 ? (data || []).map((r: Recipe) => r.id) : prev
      );
    } catch (err) {
      console.error("Грешка при зареждане на рецептите:", err);
    }
  };

  const groupedRecipes = {
    breakfast: recipes.filter((r) => r.is_breakfast),
    lunch: recipes.filter((r) => r.is_lunch),
    dinner: recipes.filter((r) => r.is_dinner),
    snack: recipes.filter((r) => r.is_snack),
  };

  const toggleRecipe = (id: string) => {
    setSelectedRecipeIds((prev) =>
      prev.includes(id) ? prev.filter((rid) => rid !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("mealPlan-")) {
        localStorage.removeItem(key);
      }
    });
    const planData: MealPlanFormData = {
      days,
      servingsPerDay,
      prepTime,
      anonymousUserId: getAnonymousUserId(),
      selectedRecipeIds,
    };
    localStorage.setItem("mealPlanSettings", JSON.stringify(planData));
    try {
      const response = await fetch("/api/mealprep", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(planData),
      });
      if (!response.ok) {
        throw new Error("Неуспешно генериране на хранителен план");
      }
      const mealPlan = await response.json();
      if (!isDevelopment) {
        track("click", {
          element: "generate_meal_plan",
        });
      }
      if (mealPlan?.data?.savedPlanId) {
        localStorage.setItem("lastMealPlanId", mealPlan.data.savedPlanId);
      }
      router.push(`/plan/${mealPlan.data.savedPlanId}`);
    } catch (error) {
      console.error("Грешка при генериране на хранителен план:", error);
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto bg-white text-[#222]">
      <div className="w-full bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center">
        <h1 className="text-4xl font-extrabold mb-4 text-center text-[#2E5E4E]">
          Създайте Вашия Хранителен План
        </h1>
        <p className="text-lg text-center mb-8 text-gray-700">
          Изберете какво обичате да ядете и ще ви направим план за хранене
        </p>
        <form onSubmit={handleSubmit} className="space-y-6 w-full">
          <div className="space-y-4">
            <div>
              <label htmlFor="days" className="block text-sm font-medium mb-2">
                Брой дни за приготвяне на храна
              </label>
              <select
                id="days"
                name="days"
                required
                className="w-full p-2 border rounded-lg bg-white"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
              >
                <option value="1">1 ден</option>
                <option value="2">2 дни</option>
                <option value="3">3 дни</option>
                <option value="4">4 дни</option>
                <option value="5">5 дни</option>
                <option value="6">6 дни</option>
                <option value="7">7 дни</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="servings"
                className="block text-sm font-medium mb-2"
              >
                Порции на ден
              </label>
              <select
                id="servings"
                name="servings"
                required
                className="w-full p-2 border rounded-lg bg-white"
                value={servingsPerDay}
                onChange={(e) => setServingsPerDay(Number(e.target.value))}
              >
                <option value="1">1 порция</option>
                <option value="2">2 порции</option>
                <option value="3">3 порции</option>
                <option value="4">4 порции</option>
                <option value="5">5 порции</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="prepTime"
                className="block text-sm font-medium mb-2"
              >
                Максимално време за приготвяне
              </label>
              <select
                id="prepTime"
                name="prepTime"
                required
                className="w-full p-2 border rounded-lg bg-white"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
              >
                <option value="15">15 минути</option>
                <option value="30">30 минути</option>
                <option value="60">1 час</option>
                <option value="any">Няма значение</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Изберете рецепти за включване в плана
              </label>
              {Object.entries({
                Закуска: groupedRecipes.breakfast,
                Обяд: groupedRecipes.lunch,
                Вечеря: groupedRecipes.dinner,
                Снак: groupedRecipes.snack,
              }).map(([category, recs]) => (
                <div key={category} className="mb-4">
                  <div className="font-semibold text-[#2E5E4E] mb-2">
                    {category}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recs.length === 0 ? (
                      <span className="text-gray-400">Няма рецепти</span>
                    ) : (
                      recs.map((recipe) => (
                        <button
                          key={recipe.id}
                          type="button"
                          onClick={() => toggleRecipe(recipe.id)}
                          className={`px-3 py-1 rounded-full text-sm border transition-colors duration-150 ${
                            selectedRecipeIds.includes(recipe.id)
                              ? "bg-[#E6F4EA] text-[#2E5E4E] border-[#2E5E4E]"
                              : "bg-gray-100 text-[#2E5E4E] border-[#E6F4EA] hover:bg-[#E6F4EA]"
                          }`}
                        >
                          {recipe.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#2E5E4E] hover:bg-[#21806A] text-white font-semibold py-3 px-6 rounded-lg transition-colors text-lg shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Генериране...
              </div>
            ) : (
              "Генерирай план"
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
