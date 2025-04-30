"use client";

import { useState } from "react";

interface MealPlanFormData {
  days: number;
  servingsPerDay: number;
  prepTime: string;
  excludedProducts: string[];
}

export default function PlanPage() {
  const [excludedProducts, setExcludedProducts] = useState<string[]>([]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const planData: MealPlanFormData = {
      days: Number(formData.get("days")),
      servingsPerDay: Number(formData.get("servings")),
      prepTime: formData.get("prepTime") as string,
      excludedProducts: excludedProducts,
    };

    console.log("Form submitted with data:", planData);
    // TODO: Handle the meal plan generation
  };

  const productCategories = [
    {
      name: "Vegetables",
      items: ["Mushrooms", "Eggplant", "Bell Peppers", "Onions", "Garlic"],
    },
    {
      name: "Meat",
      items: ["Beef", "Pork", "Chicken", "Fish", "Lamb"],
    },
  ];

  const toggleProduct = (product: string) => {
    setExcludedProducts((prev) =>
      prev.includes(product)
        ? prev.filter((p) => p !== product)
        : [...prev, product]
    );
  };

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-4 text-center">
        Create Your Meal Plan
      </h1>
      <p className="text-lg text-center mb-8 text-gray-600 dark:text-gray-300">
        Tell us your preferences and we&apos;ll create a personalized meal plan
        that fits your needs
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="days" className="block text-sm font-medium mb-2">
              Number of Days to Meal Prep
            </label>
            <select
              id="days"
              name="days"
              required
              className="w-full p-2 border rounded-lg bg-transparent"
            >
              <option value="1">1 day</option>
              <option value="2">2 days</option>
              <option value="3">3 days</option>
              <option value="4">4 days</option>
              <option value="5">5 days</option>
              <option value="6">6 days</option>
              <option value="7">7 days</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="servings"
              className="block text-sm font-medium mb-2"
            >
              Servings per Day
            </label>
            <select
              id="servings"
              name="servings"
              required
              className="w-full p-2 border rounded-lg bg-transparent"
            >
              <option value="1">1 serving</option>
              <option value="2">2 servings</option>
              <option value="3">3 servings</option>
              <option value="4">4 servings</option>
              <option value="5">5 servings</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="prepTime"
              className="block text-sm font-medium mb-2"
            >
              Maximum Preparation Time
            </label>
            <select
              id="prepTime"
              name="prepTime"
              required
              className="w-full p-2 border rounded-lg bg-transparent"
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="any">Doesn&apos;t matter</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Exclude Products
            </label>
            <div className="space-y-4">
              {productCategories.map((category) => (
                <div key={category.name} className="space-y-2">
                  <h3 className="font-medium">{category.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    {category.items.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleProduct(item)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          excludedProducts.includes(item)
                            ? "bg-red-500 text-white"
                            : "bg-gray-200 dark:bg-gray-700"
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

        <button
          type="submit"
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Generate Meal Plan
        </button>
      </form>
    </main>
  );
}
