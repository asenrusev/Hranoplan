"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface MealPlanFormData {
  days: number;
  servingsPerDay: number;
  prepTime: string;
  excludedProducts: string[];
}

export default function PlanPage() {
  // Load settings from localStorage if available
  const savedSettings =
    typeof window !== "undefined" && localStorage.getItem("mealPlanSettings")
      ? JSON.parse(localStorage.getItem("mealPlanSettings")!)
      : null;

  const [days, setDays] = useState<number>(savedSettings?.days || 1);
  const [servingsPerDay, setServingsPerDay] = useState<number>(
    savedSettings?.servingsPerDay || 1
  );
  const [prepTime, setPrepTime] = useState<string>(
    savedSettings?.prepTime || "15"
  );
  const [excludedProducts, setExcludedProducts] = useState<string[]>(
    savedSettings?.excludedProducts || []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showExclusions, setShowExclusions] = useState<boolean>(false);
  const router = useRouter();

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
        "Вермишели",
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
      // Generate a unique ID for the plan (using timestamp + random string)
      const planId = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`;

      // Store the plan in localStorage (since we don't have a database)
      localStorage.setItem(`mealPlan-${planId}`, JSON.stringify(mealPlan));

      // Navigate to the plan page
      router.push(`/plan/${planId}`);
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
          Кажете ни вашите предпочитания и ще създадем персонализиран хранителен
          план, който отговаря на вашите нужди
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
                  ? "Скрий списъка за изключване"
                  : "Покажи списъка за изключване"}
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
