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
  excludedProducts: string[];
  anonymousUserId: string;
}

export default function PlanPage() {
  const [days, setDays] = useState<number>(1);
  const [servingsPerDay, setServingsPerDay] = useState<number>(1);
  const [prepTime, setPrepTime] = useState<string>("15");
  const [excludedProducts, setExcludedProducts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showExclusions, setShowExclusions] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const savedSettings = localStorage.getItem("mealPlanSettings");
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setDays(parsedSettings.days || 1);
      setServingsPerDay(parsedSettings.servingsPerDay || 1);
      setPrepTime(parsedSettings.prepTime || "15");
      setExcludedProducts(parsedSettings.excludedProducts || []);
    }
  }, []);

  const productCategories = [
    {
      name: "Зеленчуци",
      items: [
        "Гъби",
        "Патладжан",
        "Чушки",
        "Лук",
        "Чесън",
        "Домати",
        "Краставици",
        "Моркови",
        "Тиквички",
        "Картофи",
        "Зеле",
        "Целина",
      ],
    },
    {
      name: "Месо",
      items: ["Говеждо", "Свинско", "Пилешко", "Риба", "Агнешко", "Кайма"],
    },
    {
      name: "Млечни продукти",
      items: ["Сирене", "Кашкавал", "Кисело мляко", "Яйца"],
    },
    {
      name: "Подправки",
      items: ["Сол", "Черен пипер", "Магданоз", "Копър", "Мента"],
    },
    {
      name: "Други",
      items: [
        "Брашно",
        "Ориз",
        "Олио",
        "Зехтин",
        "Оцет",
        "Захар",
        "Фиде",
        "Орехи",
      ],
    },
  ];

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    // Clear all meal plan related items from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("mealPlan-")) {
        localStorage.removeItem(key);
      }
    });

    const planData: MealPlanFormData = {
      days,
      servingsPerDay,
      prepTime,
      excludedProducts,
      anonymousUserId: getAnonymousUserId(),
    };

    // Save settings for future use
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
        throw new Error("Failed to generate meal plan");
      }

      const mealPlan = await response.json();
      // Only track in production
      if (!isDevelopment) {
        track("click", {
          element: "generate_meal_plan",
        });
      }

      // Navigate to the plan page using the saved plan ID from the API
      router.push(`/plan/${mealPlan.data.savedPlanId}`);
    } catch (error) {
      console.error("Error generating meal plan:", error);
      setIsLoading(false);
    }
  };

  const toggleProduct = (product: string) => {
    setExcludedProducts((prev) =>
      prev.includes(product)
        ? prev.filter((p) => p !== product)
        : [...prev, product]
    );
  };

  const toggleCategory = (categoryName: string) => {
    const category = productCategories.find((cat) => cat.name === categoryName);
    if (!category) return;

    const allCategoryProductsSelected = category.items.every((item) =>
      excludedProducts.includes(item)
    );

    if (allCategoryProductsSelected) {
      // If all products are selected, remove them all
      setExcludedProducts((prev) =>
        prev.filter((product) => !category.items.includes(product))
      );
    } else {
      // If not all products are selected, add all products from the category
      setExcludedProducts((prev) => {
        const newProducts = [...prev];
        category.items.forEach((item) => {
          if (!newProducts.includes(item)) {
            newProducts.push(item);
          }
        });
        return newProducts;
      });
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
                Изключете Продукти
              </label>
              <button
                type="button"
                onClick={() => setShowExclusions((prev) => !prev)}
                className="w-full mb-2 py-2 px-4 rounded-lg border border-[#E6F4EA] bg-[#F9FAF8] text-[#2E5E4E] font-semibold shadow-sm hover:bg-[#E6F4EA] transition-colors"
                aria-expanded={showExclusions}
                aria-controls="exclusion-list"
              >
                {showExclusions
                  ? "Скрий списъка с продукти"
                  : "Покажи списъка с продукти"}
              </button>
              <div
                id="exclusion-list"
                className={`transition-all duration-300 ${
                  showExclusions
                    ? "max-h-[1000px] opacity-100"
                    : "max-h-0 opacity-0 overflow-hidden"
                }`}
              >
                <div className="rounded-xl border border-[#E6F4EA] bg-[#F9FAF8] p-4 mt-2 shadow-inner">
                  <div className="space-y-4">
                    {productCategories.map((category) => (
                      <div key={category.name} className="space-y-2">
                        <button
                          type="button"
                          onClick={() => toggleCategory(category.name)}
                          className={`w-full text-left font-medium text-[#2E5E4E] hover:text-[#21806A] transition-colors duration-150 ${
                            category.items.every((item) =>
                              excludedProducts.includes(item)
                            )
                              ? "text-[#B94A48]"
                              : ""
                          }`}
                        >
                          {category.name}
                        </button>
                        <div className="flex flex-wrap gap-2">
                          {category.items.map((item) => (
                            <button
                              key={item}
                              type="button"
                              onClick={() => toggleProduct(item)}
                              className={`px-3 py-1 rounded-full text-sm border transition-colors duration-150 ${
                                excludedProducts.includes(item)
                                  ? "bg-[#F9E6E6] text-[#B94A48] border-[#B94A48]"
                                  : "bg-gray-100 text-[#2E5E4E] border-[#E6F4EA] hover:bg-[#E6F4EA]"
                              }`}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
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
