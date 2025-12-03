import { useState, useMemo } from "react";
import { recipes, cuisines, dietaryFilters } from "@/data/recipes";
import SearchAutocomplete from "@/components/SearchAutocomplete";
import TrendingSection from "@/components/TrendingSection";
import AdvancedFilters from "@/components/AdvancedFilters";
import RecipeCard from "@/components/RecipeCard";
import RecipeDetailModal from "@/components/RecipeDetailModal";
import { Recipe } from "@/types/recipe";
import { Badge } from "@/components/ui/badge";
import heroImage from "@/assets/hero-image.jpg";

interface Filters {
  cuisines: string[];
  dietary: string[];
  maxTime: number;
  maxCalories: number;
  difficulty: string[];
}

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [filters, setFilters] = useState<Filters>({
    cuisines: [],
    dietary: [],
    maxTime: 180,
    maxCalories: 1000,
    difficulty: []
  });

  const getDifficulty = (prepTime: number, cookTime: number): string => {
    const total = prepTime + cookTime;
    if (total <= 30) return "Easy";
    if (total <= 60) return "Medium";
    return "Hard";
  };

  const filteredRecipes = useMemo(() => {
    return recipes.filter(recipe => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = recipe.name.toLowerCase().includes(query);
        const matchesCuisine = recipe.cuisine.toLowerCase().includes(query);
        const matchesIngredients = recipe.ingredients.some(ing => 
          ing.toLowerCase().includes(query)
        );
        const matchesTags = recipe.dietaryTags.some(tag => 
          tag.toLowerCase().includes(query)
        );
        if (!matchesName && !matchesCuisine && !matchesIngredients && !matchesTags) {
          return false;
        }
      }

      // Cuisine filter
      if (filters.cuisines.length > 0 && !filters.cuisines.includes(recipe.cuisine)) {
        return false;
      }

      // Dietary filter
      if (filters.dietary.length > 0) {
        const hasAllTags = filters.dietary.every(tag => 
          recipe.dietaryTags.includes(tag)
        );
        if (!hasAllTags) return false;
      }

      // Time filter
      const totalTime = recipe.prepTime + recipe.cookTime;
      if (totalTime > filters.maxTime) return false;

      // Calories filter
      if (recipe.nutrition.calories > filters.maxCalories) return false;

      // Difficulty filter
      if (filters.difficulty.length > 0) {
        const recipeDifficulty = getDifficulty(recipe.prepTime, recipe.cookTime);
        if (!filters.difficulty.includes(recipeDifficulty)) return false;
      }

      return true;
    });
  }, [searchQuery, filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.cuisines.length > 0) count++;
    if (filters.dietary.length > 0) count++;
    if (filters.maxTime < 180) count++;
    if (filters.maxCalories < 1000) count++;
    if (filters.difficulty.length > 0) count++;
    return count;
  }, [filters]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Global Food Explorer
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Discover 1000+ recipes from around the world. From Italian pasta to Indian curries, 
            find your next culinary adventure.
          </p>
          
          <div className="max-w-2xl mx-auto">
            <SearchAutocomplete 
              value={searchQuery} 
              onChange={setSearchQuery}
              onSelect={setSearchQuery}
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {cuisines.slice(1, 8).map(cuisine => (
              <Badge 
                key={cuisine}
                variant="secondary"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => setSearchQuery(cuisine)}
              >
                {cuisine}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Section */}
      <section className="container mx-auto px-4 py-12">
        <TrendingSection onRecipeClick={setSelectedRecipe} />
      </section>

      {/* All Recipes Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold">All Recipes</h2>
            <p className="text-muted-foreground">
              {filteredRecipes.length} recipes found
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <SearchAutocomplete 
              value={searchQuery} 
              onChange={setSearchQuery}
              onSelect={setSearchQuery}
            />
            <AdvancedFilters 
              filters={filters}
              onFiltersChange={setFilters}
              activeFilterCount={activeFilterCount}
            />
          </div>
        </div>

        {filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRecipes.map(recipe => (
              <RecipeCard 
                key={recipe.id} 
                recipe={recipe} 
                onCardClick={() => setSelectedRecipe(recipe)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-2xl font-semibold mb-2">No recipes found</p>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}
      </section>

      {/* Recipe Detail Modal */}
      <RecipeDetailModal 
        recipe={selectedRecipe}
        open={!!selectedRecipe}
        onOpenChange={(open) => !open && setSelectedRecipe(null)}
      />
    </div>
  );
};

export default Index;