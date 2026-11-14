import type { MealPlan } from "@/types/recipe";

const STORAGE_KEY = "smart-chief:local-meal-plans";

type MealPlanStorage = Pick<Storage, "getItem" | "setItem">;

const isMealPlan = (value: unknown): value is MealPlan => {
  if (!value || typeof value !== "object") return false;
  const plan = value as Record<string, unknown>;
  const recipe = plan.recipe_data;
  return (
    typeof plan.id === "string" &&
    typeof plan.user_id === "string" &&
    typeof plan.date === "string" &&
    typeof plan.meal_type === "string" &&
    typeof plan.recipe_id === "string" &&
    !!recipe &&
    typeof recipe === "object" &&
    typeof (recipe as Record<string, unknown>).name === "string" &&
    Array.isArray((recipe as Record<string, unknown>).ingredients)
  );
};

export const readLocalMealPlans = (storage: MealPlanStorage): MealPlan[] => {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw === null) return [];

  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value) || !value.every(isMealPlan)) {
    throw new Error("Saved local meal plans have an invalid format");
  }
  return value;
};

export const writeLocalMealPlans = (plans: MealPlan[], storage: MealPlanStorage): void => {
  storage.setItem(STORAGE_KEY, JSON.stringify(plans));
};

export const upsertLocalMealPlan = (plans: MealPlan[], plan: MealPlan): MealPlan[] => [
  ...plans.filter((existing) => existing.date !== plan.date || existing.meal_type !== plan.meal_type),
  plan,
];
