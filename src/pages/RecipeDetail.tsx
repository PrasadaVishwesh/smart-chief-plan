import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Minus, Plus, RotateCcw, Sparkles } from "lucide-react";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import CookModeModal from "@/components/CookModeModal";
import { recipes } from "@/data/recipes";
import { getBreadcrumbStructuredData, getRecipeSeo, getRecipeSlug, getRecipeStructuredData, getStructuredDataGraph } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site";
import { getWebpImageUrl } from "@/utils/imageFormat";
import { getRecipeImage, getRecipeImageCredit } from "@/utils/recipeImages";
import RecipeImageCredit from "@/components/RecipeImageCredit";
import { useRecipeScaling } from "@/hooks/useRecipeScaling";
import { useAIImage } from "@/hooks/useAIImage";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";

const RecipeDetail = () => {
  const { slug = "" } = useParams();
  const recipe = useMemo(() => recipes.find((item) => getRecipeSlug(item, recipes) === slug), [slug]);
  const [cookModeOpen, setCookModeOpen] = useState(false);
  const scaling = useRecipeScaling(recipe ?? null);
  const { resetServings } = scaling;
  const { aiImageUrl, isGenerating, error, generateImage } = useAIImage();

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    if (recipe) trackEvent("recipe_view", { recipeId: recipe.id });
    resetServings();
  }, [recipe, resetServings]);

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
  const recipeWithImage = { ...recipe, image: getRecipeImage(recipe) };
  const canonicalPath = `/recipes/${getRecipeSlug(recipe, recipes)}/`;
  const siteUrl = getSiteUrl(import.meta.env.VITE_SITE_URL);
  const structuredData = getStructuredDataGraph(
    getRecipeStructuredData(recipeWithImage, new URL(canonicalPath, `${siteUrl}/`).href),
    getBreadcrumbStructuredData([
      { name: "Home", path: "/" },
      { name: "Recipes", path: "/recipes/" },
      { name: recipe.name, path: canonicalPath },
    ], siteUrl),
  );

  return (
    <>
      <Seo {...seo} canonicalPath={canonicalPath} structuredData={structuredData} />
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm"><Link to="/">Home</Link> / <Link to="/recipes">Recipes</Link> / <span aria-current="page">{recipe.name}</span></nav>
        <Link to="/recipes" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> All recipes
        </Link>
        <article>
          <header className="mb-6">
            <p className="text-sm text-primary font-medium">{recipe.cuisine} cuisine</p>
            <h1 className="text-4xl font-bold mt-2">{recipe.name}</h1>
            <p className="text-lg text-muted-foreground mt-3">{recipe.description}</p>
            <p className="text-sm mt-4">{recipe.prepTime + recipe.cookTime} minutes · {recipe.servings} servings · {recipe.nutrition.calories} calories per serving</p>
          </header>
          <div className="relative">
            <picture className="block w-full">
              {!aiImageUrl && <source srcSet={getWebpImageUrl(recipeWithImage.image)} type="image/webp" />}
              <img src={aiImageUrl ?? recipeWithImage.image} alt={`${recipe.name}, a ${recipe.cuisine} recipe`} className="w-full max-h-[28rem] object-cover rounded-xl" width={800} height={600} fetchPriority="high" decoding="async" />
            </picture>
            <RecipeImageCredit credit={getRecipeImageCredit(recipe.name, recipe.imageCredit)} className="mt-2" />
            <Button className="absolute right-3 top-3 gap-2" variant="secondary" onClick={() => generateImage(recipe.name, recipe.cuisine)} disabled={isGenerating}>
              <Sparkles className="h-4 w-4" />{isGenerating ? "Generating image…" : "Generate image"}
            </Button>
          </div>
          <div className="grid gap-8 md:grid-cols-[1fr_1.5fr] mt-8">
            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold">Ingredients</h2>
                <div className="flex items-center gap-2" aria-label="Adjust recipe servings">
                  <Button size="icon" variant="outline" aria-label="Decrease servings" onClick={scaling.decrementServings} disabled={scaling.targetServings <= 1}><Minus className="h-4 w-4" /></Button>
                  <span>{scaling.targetServings} servings</span>
                  <Button size="icon" variant="outline" aria-label="Increase servings" onClick={scaling.incrementServings} disabled={scaling.targetServings >= 20}><Plus className="h-4 w-4" /></Button>
                  {scaling.isScaled && <Button size="icon" variant="ghost" aria-label="Reset servings" onClick={scaling.resetServings}><RotateCcw className="h-4 w-4" /></Button>}
                </div>
              </div>
              <ul className="list-disc pl-5 space-y-2">
                {scaling.scaledIngredients.map((ingredient) => <li key={ingredient}>{ingredient}</li>)}
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
          <div className="mt-8 flex flex-wrap gap-4">
            <Button onClick={() => setCookModeOpen(true)}>Start cook mode</Button>
            <Link className="self-center text-primary underline" to="/meal-planner">Plan this meal</Link>
          </div>
        </article>
      </main>
      <CookModeModal recipe={recipe} open={cookModeOpen} onOpenChange={setCookModeOpen} />
    </>
  );
};

export default RecipeDetail;
