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
      name: "Зеленчуци",
      items: ["Гъби", "Патладжан", "Чушки", "Лук", "Чесън"],
    },
    {
      name: "Месо",
      items: ["Говеждо", "Свинско", "Пилешко", "Риба", "Агнешко"],
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
        Създайте Вашия Хранителен План
      </h1>
      <p className="text-lg text-center mb-8 text-gray-600 dark:text-gray-300">
        Кажете ни вашите предпочитания и ще създадем персонализиран хранителен
        план, който отговаря на вашите нужди
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="days" className="block text-sm font-medium mb-2">
              Брой дни за приготвяне на храна
            </label>
            <select
              id="days"
              name="days"
              required
              className="w-full p-2 border rounded-lg bg-transparent"
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
              className="w-full p-2 border rounded-lg bg-transparent"
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
              className="w-full p-2 border rounded-lg bg-transparent"
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
          Генерирай Хранителен План
        </button>
      </form>
    </main>
  );
}
