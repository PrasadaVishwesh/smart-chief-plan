import type { MealPlan } from "@/types/recipe";

export const getShoppingListItems = (mealPlans: Array<Pick<MealPlan, "recipe_data">>): string[] => {
  const ingredients = new Map<string, string>();

  for (const meal of mealPlans) {
    for (const ingredient of meal.recipe_data.ingredients) {
      const label = ingredient.trim();
      if (!label) continue;

      const key = label.toLowerCase();
      if (!ingredients.has(key)) ingredients.set(key, label);
    }
  }

  return [...ingredients.values()].sort((first, second) => first.localeCompare(second));
};
