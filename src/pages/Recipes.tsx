import { useState } from "react";
import { recipes } from "@/data/recipes";
import RecipeCard from "@/components/RecipeCard";
import RecipeDetailModal from "@/components/RecipeDetailModal";
import { Recipe } from "@/types/recipe";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Search } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const cuisines = ["All", "Italian", "Asian", "Mexican", "Indian"];
const dietaryFilters = ["vegetarian", "vegan", "gluten-free", "dairy-free", "keto"];

const Recipes = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("All");
  const [selectedDietaryFilters, setSelectedDietaryFilters] = useState<string[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const toggleDietaryFilter = (filter: string) => {
    setSelectedDietaryFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter]
    );
  };

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCuisine = selectedCuisine === "All" || recipe.cuisine === selectedCuisine;
    
    const matchesDietary = selectedDietaryFilters.length === 0 ||
      selectedDietaryFilters.every((filter) => recipe.dietaryTags.includes(filter));

    return matchesSearch && matchesCuisine && matchesDietary;
  });

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setModalOpen(true);
  };

  return (
    <>
      <div className="relative h-[40vh] overflow-hidden">
        <img
          src={heroImage}
          alt="Meal planning hero"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent flex items-end">
          <div className="container mx-auto px-4 pb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">
              Discover Delicious Recipes
            </h1>
            <p className="text-lg text-muted-foreground">
              Browse thousands of recipes and plan your perfect meals
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search recipes..."
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
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onCardClick={() => handleRecipeClick(recipe)}
            />
          ))}
        </div>

        {filteredRecipes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No recipes found. Try adjusting your filters.
            </p>
          </div>
        )}
      </div>

      <RecipeDetailModal
        recipe={selectedRecipe}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
};

export default Recipes;
