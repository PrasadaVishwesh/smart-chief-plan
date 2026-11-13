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

export const getOrganizationStructuredData = (url: string) => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Smart Chief",
  url,
  logo: new URL("/og-image.png", url).href,
});

export const getBreadcrumbStructuredData = (items: Array<{ name: string; path: string }>, siteUrl: string) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: new URL(item.path, `${siteUrl}/`).href,
  })),
});

export const getFaqStructuredData = (items: Array<{ question: string; answer: string }>) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: { "@type": "Answer", text: answer },
  })),
});

export const getStructuredDataGraph = (...items: Record<string, unknown>[]) => ({
  "@context": "https://schema.org",
  "@graph": items.map(({ "@context": _context, ...item }) => item),
});

const truncate = (text: string, limit: number) => (
  text.length <= limit ? text : `${text.slice(0, limit - 1).trimEnd()}…`
);

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

export const getRecipeSeo = (recipe: Recipe): PageSeo => {
  const suffix = " Recipe | Smart Chief";
  return {
    title: `${truncate(recipe.name, 59 - suffix.length)}${suffix}`,
    description: truncate(
      `${recipe.description} Make this ${recipe.cuisine.toLowerCase()} recipe in ${recipe.prepTime + recipe.cookTime} minutes. See ingredients and step-by-step instructions.`,
      159,
    ),
  };
};

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
