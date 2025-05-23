"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  generateShoppingList,
  ShoppingListItem,
  MealPlanSlot,
} from "@/utils/recipeUtils";
import Link from "next/link";
import { track } from "@vercel/analytics";

// Helper function to check if we're in development
const isDevelopment = process.env.NODE_ENV === "development";

// Softer Bulgarian-inspired colors
const pastelGreen = "#E6F4EA";
const blushRed = "#F9E6E6";
const lightBg = "#F9FAF8";
const accentGreen = "#2E5E4E";
const accentRed = "#B94A48";

const mealSlotLabels: Record<string, string> = {
  breakfast: "Закуска",
  lunch: "Обяд",
  dinner: "Вечеря",
  snack: "Снак",
};
function getMealSlotLabel(slotType: string) {
  return mealSlotLabels[slotType] || slotType;
}

interface MealPlan {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  days: number;
  servingsPerDay: number;
  prepTime: string;
  meals: MealPlanSlot[];
}

export default function MealPlanPage() {
  const params = useParams();
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Collapsible state
  const [shoppingOpen, setShoppingOpen] = useState(false);
  const [openDays, setOpenDays] = useState<{ [day: number]: boolean }>({});
  const [openMeals, setOpenMeals] = useState<{ [key: string]: boolean }>({});
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    const fetchMealPlan = async () => {
      try {
        const planId = params.id as string;
        const response = await fetch(`/api/mealplan/${planId}`);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to fetch meal plan");
        }

        const { data } = await response.json();
        setMealPlan({
          ...data.plan,
          prepTime: data.plan.prepTime ?? "",
          meals: Array.isArray(data.mealPlan) ? data.mealPlan : [],
        });
      } catch (error) {
        console.error("Error fetching meal plan:", error);
        setError("Грешка при зареждане на плана");
      } finally {
        setLoading(false);
      }
    };

    fetchMealPlan();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">{error}</h1>
          <Link
            href="/plan"
            className="text-emerald-500 hover:text-emerald-600"
          >
            Върнете се към създаването на план
          </Link>
        </div>
      </div>
    );
  }

  if (!mealPlan) {
    return null;
  }

  // Log the meals array before grouping
  console.log("Frontend mealPlan.meals:", mealPlan.meals);

  // Aggregate shopping list from all meals
  const shoppingList: ShoppingListItem[] = generateShoppingList(
    Array.isArray(mealPlan.meals)
      ? mealPlan.meals.map((slot) => slot.recipe)
      : []
  );

  // Handlers for toggling
  const toggleDay = (dayIndex: number) => {
    setOpenDays((prev) => ({ ...prev, [dayIndex]: !prev[dayIndex] }));
  };
  const toggleMeal = (dayIndex: number, mealIndex: number) => {
    const key = `${dayIndex}-${mealIndex}`;
    setOpenMeals((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Function to copy shopping list to clipboard
  const copyShoppingList = () => {
    const text = shoppingList
      .map((item) => `${item.name} - ${item.amount} ${item.unit}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);

    // Only track in production
    if (!isDevelopment) {
      track("click", {
        element: "copy_shopping_list",
      });
    }
  };

  // Function to share shopping list
  const shareShoppingList = async () => {
    const text = shoppingList
      .map((item) => `${item.name} - ${item.amount} ${item.unit}`)
      .join("\n");

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Списък за пазаруване",
          text: text,
        });
        // Only track in production
        if (!isDevelopment) {
          track("click", {
            element: "share_shopping_list",
          });
        }
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      copyShoppingList();
    }
  };

  // Set CSS variables for the new palette
  if (typeof window !== "undefined") {
    document.documentElement.style.setProperty("--pastelGreen", pastelGreen);
    document.documentElement.style.setProperty("--blushRed", blushRed);
    document.documentElement.style.setProperty("--lightBg", lightBg);
    document.documentElement.style.setProperty("--accentGreen", accentGreen);
    document.documentElement.style.setProperty("--accentRed", accentRed);
  }

  return (
    <main
      className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto pb-16"
      style={{ background: lightBg }}
    >
      {/* Shopping List Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <button
            className="text-2xl md:text-3xl font-bold focus:outline-none flex items-center rounded-2xl bg-white border border-[var(--pastelGreen)] hover:bg-[var(--pastelGreen)] transition-colors duration-200 shadow-sm px-4 py-3"
            style={{ borderColor: pastelGreen, color: accentGreen }}
            onClick={() => setShoppingOpen((open) => !open)}
          >
            <span>Списък за пазаруване</span>
            <span className="ml-2 text-2xl">{shoppingOpen ? "▲" : "▼"}</span>
          </button>
          <div className="flex gap-2">
            <button
              onClick={copyShoppingList}
              className="px-4 py-2 bg-[var(--pastelGreen)] text-[var(--accentGreen)] rounded-lg hover:bg-[var(--pastelGreen)]/80 transition-colors duration-200"
              style={{ background: pastelGreen, color: accentGreen }}
            >
              {copySuccess ? "Копирано!" : "Копирай"}
            </button>
            <button
              onClick={shareShoppingList}
              className="px-4 py-2 bg-[var(--blushRed)] text-[var(--accentRed)] rounded-lg hover:bg-[var(--blushRed)]/80 transition-colors duration-200"
              style={{ background: blushRed, color: accentRed }}
            >
              Сподели
            </button>
          </div>
        </div>
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden ${
            shoppingOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          {shoppingList.length > 0 ? (
            <ul className="bg-white p-4 rounded-2xl shadow divide-y divide-gray-100 mt-2 border border-[var(--pastelGreen)]">
              {shoppingList.map((item) => (
                <li
                  key={item.name + item.unit}
                  className="flex justify-between py-2 text-lg"
                >
                  <span
                    className="font-medium text-[var(--accentGreen)]"
                    style={{ color: accentGreen }}
                  >
                    {item.name}
                  </span>
                  <span className="text-gray-700">
                    {item.amount} {item.unit}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">Няма продукти за пазаруване</p>
          )}
        </div>
      </div>
      <div className="mb-8">
        <h1
          className="text-4xl font-extrabold mb-4 text-center text-[var(--accentGreen)]"
          style={{ color: accentGreen }}
        >
          Вашият Хранителен План
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow border border-[var(--pastelGreen)]">
            <h2
              className="text-lg font-semibold mb-2 text-[var(--accentGreen)]"
              style={{ color: accentGreen }}
            >
              Детайли на плана
            </h2>
            {mealPlan.days ? (
              <>
                <p className="text-[#222]">Брой дни: {mealPlan.days}</p>
                <p className="text-[#222]">
                  Порции на ден: {mealPlan.servingsPerDay}
                </p>
                <p className="text-[#222]">
                  Време за приготвяне:{" "}
                  {mealPlan.prepTime === "any" || !mealPlan.prepTime
                    ? "Няма значение"
                    : `${mealPlan.prepTime} минути`}
                </p>
              </>
            ) : (
              <p className="text-gray-500 italic">
                Няма налични детайли за този план
              </p>
            )}
          </div>
        </div>
      </div>
      {/* Collapsible Daily Plan */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-[var(--pastelGreen)]">
        <h2
          className="text-2xl font-bold mb-4 text-[var(--accentRed)]"
          style={{ color: accentRed }}
        >
          Дневен план
        </h2>
        {mealPlan.meals && mealPlan.meals.length > 0 ? (
          <div className="space-y-4">
            {Array.from({ length: mealPlan.days }, (_, dayIndex) => {
              const slotOrder = ["breakfast", "lunch", "dinner", "snack"];
              const dayMeals = mealPlan.meals.filter(
                (m) => m.dayIndex === dayIndex
              );
              const slotMap = Object.fromEntries(
                dayMeals.map((m) => [m.slotType.trim().toLowerCase(), m])
              );
              const sortedDayMeals = slotOrder.map(
                (type) => slotMap[type] || null
              );
              return (
                <div
                  key={dayIndex}
                  className="border-b border-gray-100 pb-6 last:border-b-0"
                >
                  <button
                    className="w-full text-left text-2xl font-semibold mb-4 focus:outline-none flex items-center justify-between rounded-lg bg-[var(--pastelGreen)] hover:bg-[var(--pastelGreen)]/80 transition-colors duration-200 px-4 py-2 text-[var(--accentGreen)]"
                    style={{ background: pastelGreen, color: accentGreen }}
                    onClick={() => toggleDay(dayIndex)}
                  >
                    <span>Ден {dayIndex + 1}</span>
                    <span className="ml-2">
                      {openDays[dayIndex] ? "▲" : "▼"}
                    </span>
                  </button>
                  <div
                    className={`transition-all duration-500 ease-in-out ${
                      openDays[dayIndex]
                        ? "opacity-100"
                        : "max-h-0 opacity-0 overflow-hidden"
                    }`}
                  >
                    {openDays[dayIndex] && (
                      <div className="space-y-3">
                        {sortedDayMeals.map((mealSlot, mealIndex) =>
                          mealSlot ? (
                            <div
                              key={`${dayIndex}-${mealSlot.slotType}-${mealSlot.recipe.id}`}
                              className="bg-[var(--pastelGreen)]/60 p-4 rounded-lg shadow-sm"
                            >
                              <button
                                className="w-full text-left text-xl font-semibold mb-2 focus:outline-none flex items-center justify-between rounded-md bg-[var(--blushRed)] hover:bg-[var(--blushRed)]/80 transition-colors duration-200 px-3 py-2 text-[var(--accentRed)]"
                                style={{
                                  background: blushRed,
                                  color: accentRed,
                                }}
                                onClick={() => toggleMeal(dayIndex, mealIndex)}
                              >
                                <span>
                                  {getMealSlotLabel(mealSlot.slotType)}:{" "}
                                  {mealSlot.recipe.name}
                                </span>
                                <span className="ml-2">
                                  {openMeals[`${dayIndex}-${mealIndex}`]
                                    ? "▲"
                                    : "▼"}
                                </span>
                              </button>
                              <div
                                className={`transition-all duration-500 ease-in-out ${
                                  openMeals[`${dayIndex}-${mealIndex}`]
                                    ? "opacity-100"
                                    : "max-h-0 opacity-0 overflow-hidden"
                                }`}
                              >
                                {openMeals[`${dayIndex}-${mealIndex}`] && (
                                  <div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <h5 className="font-medium mb-2 text-[#222]">
                                          Съставки:
                                        </h5>
                                        <ul className="list-disc list-inside text-[#222]">
                                          {Array.isArray(
                                            mealSlot.recipe.ingredients
                                          )
                                            ? mealSlot.recipe.ingredients.map(
                                                (ingredient, i) => {
                                                  if (
                                                    ingredient &&
                                                    typeof ingredient ===
                                                      "object" &&
                                                    !Array.isArray(
                                                      ingredient
                                                    ) &&
                                                    "name" in ingredient
                                                  ) {
                                                    return (
                                                      <li key={i}>
                                                        {
                                                          (
                                                            ingredient as {
                                                              name: string;
                                                            }
                                                          ).name
                                                        }
                                                      </li>
                                                    );
                                                  }
                                                  return null;
                                                }
                                              )
                                            : null}
                                        </ul>
                                      </div>
                                      <div>
                                        <h5 className="font-medium mb-2 text-[#222]">
                                          Инструкции:
                                        </h5>
                                        <ol className="list-decimal list-inside text-[#222]">
                                          {mealSlot.recipe.instructions.map(
                                            (
                                              instruction: string,
                                              i: number
                                            ) => (
                                              <li key={i}>{instruction}</li>
                                            )
                                          )}
                                        </ol>
                                      </div>
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                      <div className="bg-white p-2 rounded border border-[var(--pastelGreen)] text-[#222]">
                                        <p className="text-sm text-gray-600">
                                          Време за приготвяне
                                        </p>
                                        <p className="font-medium">
                                          {mealSlot.recipe.prep_time ?? "?"} мин
                                        </p>
                                      </div>
                                      <div className="bg-white p-2 rounded border border-[var(--pastelGreen)] text-[#222]">
                                        <p className="text-sm text-gray-600">
                                          Време за готвене
                                        </p>
                                        <p className="font-medium">
                                          {mealSlot.recipe.cook_time ?? "?"} мин
                                        </p>
                                      </div>
                                      <div className="bg-white p-2 rounded border border-[var(--pastelGreen)] text-[#222]">
                                        <p className="text-sm text-gray-600">
                                          Общо време
                                        </p>
                                        <p className="font-medium">
                                          {mealSlot.recipe.prep_time != null &&
                                          mealSlot.recipe.cook_time != null
                                            ? mealSlot.recipe.prep_time +
                                              mealSlot.recipe.cook_time
                                            : "?"}{" "}
                                          мин
                                        </p>
                                      </div>
                                      <div className="bg-white p-2 rounded border border-[var(--pastelGreen)] text-[#222]">
                                        <p className="text-sm text-gray-600">
                                          Порции
                                        </p>
                                        <p className="font-medium">
                                          {mealSlot.recipe.servings}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div
                              key={`${dayIndex}-${slotOrder[mealIndex]}`}
                              className="bg-gray-100 p-4 rounded-lg shadow-sm text-gray-400 italic"
                            >
                              {getMealSlotLabel(slotOrder[mealIndex])}: Няма
                              избрана рецепта
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              Все още няма генерирани ястия за този план
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
