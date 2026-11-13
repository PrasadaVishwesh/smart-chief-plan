import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import RecipeDetailModal from "@/components/RecipeDetailModal";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { recipes } from "@/data/recipes";
import { getRecipeSeo, getRecipeSlug, getRecipeStructuredData } from "@/lib/seo";
import { getWebpImageUrl } from "@/utils/imageFormat";

const RecipeDetail = () => {
  const { slug = "" } = useParams();
  const recipe = useMemo(() => recipes.find((item) => getRecipeSlug(item, recipes) === slug), [slug]);
  const [toolsOpen, setToolsOpen] = useState(false);

  if (!recipe) {
    return (
      <main className="container mx-auto px-4 py-16 text-center">
        <Seo title="Recipe not found | Smart Chief" description="This recipe could not be found." noIndex />
        <h1 className="text-3xl font-bold mb-4">Recipe not found</h1>
        <Link to="/" className="text-primary underline">Browse all recipes</Link>
      </main>
    );
  }

  const seo = getRecipeSeo(recipe);
  const canonicalPath = `/recipes/${getRecipeSlug(recipe, recipes)}/`;
  const structuredData = getRecipeStructuredData(recipe, new URL(canonicalPath, window.location.origin).href);

  return (
    <>
      <Seo {...seo} canonicalPath={canonicalPath} image={recipe.image} structuredData={structuredData} />
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> All recipes
        </Link>
        <article>
          <header className="mb-6">
            <p className="text-sm text-primary font-medium">{recipe.cuisine} cuisine</p>
            <h1 className="text-4xl font-bold mt-2">{recipe.name}</h1>
            <p className="text-lg text-muted-foreground mt-3">{recipe.description}</p>
            <p className="text-sm mt-4">{recipe.prepTime + recipe.cookTime} minutes · {recipe.servings} servings · {recipe.nutrition.calories} calories per serving</p>
          </header>
          <picture className="block w-full">
            <source srcSet={getWebpImageUrl(recipe.image)} type="image/webp" />
            <img src={recipe.image} alt={`${recipe.name}, a ${recipe.cuisine} recipe`} className="w-full max-h-[28rem] object-cover rounded-xl" width={800} height={600} fetchPriority="high" decoding="async" />
          </picture>
          <div className="grid gap-8 md:grid-cols-[1fr_1.5fr] mt-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Ingredients</h2>
              <ul className="list-disc pl-5 space-y-2">
                {recipe.ingredients.map((ingredient) => <li key={ingredient}>{ingredient}</li>)}
              </ul>
            </section>
            <section>
              <h2 className="text-2xl font-semibold mb-4">Instructions</h2>
              <ol className="list-decimal pl-5 space-y-3">
                {recipe.instructions.map((instruction, index) => <li key={`${index}-${instruction}`}>{instruction}</li>)}
              </ol>
            </section>
          </div>
          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-3">Nutrition per serving</h2>
            <p>{recipe.nutrition.calories} calories · {recipe.nutrition.protein}g protein · {recipe.nutrition.carbs}g carbohydrates · {recipe.nutrition.fat}g fat</p>
          </section>
          <div className="flex flex-wrap gap-3 mt-8">
            <Button onClick={() => setToolsOpen(true)}>Open cooking tools</Button>
            <Button variant="outline" asChild><Link to="/meal-planner">Plan this meal</Link></Button>
          </div>
        </article>
      </main>
      <RecipeDetailModal recipe={recipe} open={toolsOpen} onOpenChange={setToolsOpen} />
    </>
  );
};

export default RecipeDetail;
