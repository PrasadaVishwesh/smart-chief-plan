export interface Recipe {
  id: string;
  name: string;
  description: string;
  image: string;
  cuisine: string;
  dietaryTags: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  ingredients: string[];
  instructions: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface MealPlan {
  id: string;
  user_id: string;
  date: string;
  meal_type: string;
  recipe_id: string;
  recipe_data: Recipe;
}

export interface Favorite {
  id: string;
  user_id: string;
  recipe_id: string;
  recipe_data: Recipe;
  created_at: string;
}
