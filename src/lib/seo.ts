import type { Recipe } from "@/types/recipe";

export interface PageSeo {
  title: string;
  description: string;
}

export const getWebsiteStructuredData = (url: string) => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Smart Chief",
  url,
  description: "Discover recipes, plan weekly meals, and organize your shopping list.",
});

const slugify = (name: string) => name
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

export const getRecipeSlug = (recipe: Recipe, allRecipes: Recipe[]) => {
  const baseSlug = slugify(recipe.name);
  const duplicateCount = allRecipes.filter((candidate) => slugify(candidate.name) === baseSlug).length;
  return duplicateCount > 1 ? `${baseSlug}-${recipe.id}` : baseSlug;
};

export const getRecipeSeo = (recipe: Recipe): PageSeo => ({
  title: `${recipe.name} Recipe | Smart Chief`,
  description: `${recipe.description} Make this ${recipe.cuisine.toLowerCase()} recipe in ${recipe.prepTime + recipe.cookTime} minutes. See ingredients and step-by-step instructions.`,
});

export const getRecipeStructuredData = (recipe: Recipe, url: string) => ({
  "@context": "https://schema.org",
  "@type": "Recipe",
  name: recipe.name,
  description: recipe.description,
  image: [recipe.image],
  recipeCuisine: recipe.cuisine,
  recipeCategory: "Main course",
  recipeYield: `${recipe.servings} servings`,
  prepTime: `PT${recipe.prepTime}M`,
  cookTime: `PT${recipe.cookTime}M`,
  totalTime: `PT${recipe.prepTime + recipe.cookTime}M`,
  recipeIngredient: recipe.ingredients,
  recipeInstructions: recipe.instructions.map((text, index) => ({
    "@type": "HowToStep",
    position: index + 1,
    text,
  })),
  nutrition: {
    "@type": "NutritionInformation",
    calories: `${recipe.nutrition.calories} calories`,
    proteinContent: `${recipe.nutrition.protein} g`,
    carbohydrateContent: `${recipe.nutrition.carbs} g`,
    fatContent: `${recipe.nutrition.fat} g`,
  },
  url,
});
