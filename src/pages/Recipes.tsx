import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { recipes } from "@/data/recipes";
import RecipeCard from "@/components/RecipeCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Search } from "lucide-react";
import Seo from "@/components/Seo";
import { getRecipeSlug } from "@/lib/seo";
import { trackEvent } from "@/lib/analytics";

const cuisines = ["All", ...new Set(recipes.map((recipe) => recipe.cuisine).sort())];
const dietaryFilters = ["vegetarian", "vegan", "gluten-free", "dairy-free", "keto"];
const PAGE_SIZE = 24;

const Recipes = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedCuisine, setSelectedCuisine] = useState("All");
  const [selectedDietaryFilters, setSelectedDietaryFilters] = useState<string[]>([]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearchQuery(searchQuery), 250);
    return () => window.clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [debouncedSearchQuery, selectedCuisine, selectedDietaryFilters]);

  const toggleDietaryFilter = (filter: string) => {
    setSelectedDietaryFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter]
    );
  };

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      recipe.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    
    const matchesCuisine = selectedCuisine === "All" || recipe.cuisine === selectedCuisine;
    
    const matchesDietary = selectedDietaryFilters.length === 0 ||
      selectedDietaryFilters.every((filter) => recipe.dietaryTags.includes(filter));

    return matchesSearch && matchesCuisine && matchesDietary;
  });

  const visibleRecipes = filteredRecipes.slice(0, visibleCount);

  useEffect(() => {
    trackEvent("recipe_search", {
      hasQuery: Boolean(debouncedSearchQuery.trim()),
      resultCount: filteredRecipes.length,
      cuisine: selectedCuisine,
      dietaryFilterCount: selectedDietaryFilters.length,
    });
  }, [debouncedSearchQuery, filteredRecipes.length, selectedCuisine, selectedDietaryFilters.length]);

  return (
    <>
      <Seo title="Browse Recipes | Smart Chief" description={`Search and filter ${recipes.length} recipes by dish, cuisine, and dietary preferences with Smart Chief.`} canonicalPath="/recipes/" />
      <main className="container mx-auto px-4 py-8">
        <nav aria-label="Breadcrumb" className="mb-5 text-sm"><Link to="/">Home</Link> / <span aria-current="page">Recipes</span></nav>
        <h1 className="mb-3 text-4xl font-bold">Explore recipes</h1>
        <p className="mb-8 max-w-3xl text-muted-foreground">Search {recipes.length} recipes by dish, explore cuisines, or filter by dietary preferences. Open a recipe for ingredients and step-by-step instructions.</p>
        <div className="mb-8 space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search recipes..."
              aria-label="Search recipes"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-3">
              <Label className="text-base font-semibold">Cuisine</Label>
              <div className="flex flex-wrap gap-2">
                {cuisines.map((cuisine) => (
                  <button
                    key={cuisine}
                    onClick={() => setSelectedCuisine(cuisine)}
                    aria-pressed={selectedCuisine === cuisine}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedCuisine === cuisine
                        ? "bg-primary text-primary-foreground shadow-[var(--shadow-card)]"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {cuisine}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <Label className="text-base font-semibold">Dietary Preferences</Label>
              <div className="grid grid-cols-2 gap-3">
                {dietaryFilters.map((filter) => (
                  <div key={filter} className="flex items-center space-x-2">
                    <Checkbox
                      id={filter}
                      checked={selectedDietaryFilters.includes(filter)}
                      onCheckedChange={() => toggleDietaryFilter(filter)}
                    />
                    <label
                      htmlFor={filter}
                      className="text-sm font-medium capitalize cursor-pointer"
                    >
                      {filter}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-muted-foreground">
            {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? "s" : ""} found
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visibleRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              recipeUrl={`/recipes/${getRecipeSlug(recipe, recipes)}/`}
            />
          ))}
        </div>

        {filteredRecipes.length === 0 && (
          <div className="text-center py-12" role="status">
            <p className="text-muted-foreground text-lg">
              No recipes found. Try adjusting your filters.
            </p>
          </div>
        )}
        {visibleCount < filteredRecipes.length && (
          <div className="mt-8 text-center">
            <button type="button" className="rounded-lg border px-5 py-3 font-semibold" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
              Show more recipes
            </button>
          </div>
        )}
      </main>
    </>
  );
};

export default Recipes;
