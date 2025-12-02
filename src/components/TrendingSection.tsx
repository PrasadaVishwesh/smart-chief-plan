import { recipes } from "@/data/recipes";
import { Recipe } from "@/types/recipe";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Flame, ChefHat, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface TrendingSectionProps {
  onRecipeClick: (recipe: Recipe) => void;
}

const TrendingSection = ({ onRecipeClick }: TrendingSectionProps) => {
  const [randomRecipe, setRandomRecipe] = useState<Recipe | null>(null);

  // Get featured recipes (simulated trending)
  const trendingRecipes = recipes.slice(0, 4);
  const weeklyPicks = recipes.slice(10, 14);
  const quickMeals = recipes.filter(r => r.prepTime + r.cookTime <= 30).slice(0, 4);

  const getRandomRecipe = () => {
    const random = recipes[Math.floor(Math.random() * recipes.length)];
    setRandomRecipe(random);
    onRecipeClick(random);
  };

  const RecipePreviewCard = ({ recipe }: { recipe: Recipe }) => (
    <Card 
      className="overflow-hidden cursor-pointer group hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      onClick={() => onRecipeClick(recipe)}
    >
      <div className="relative h-32 overflow-hidden">
        <img
          src={recipe.image}
          alt={recipe.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="absolute bottom-2 left-2 right-2">
          <h4 className="font-semibold text-sm line-clamp-1">{recipe.name}</h4>
          <p className="text-xs text-muted-foreground">{recipe.cuisine}</p>
        </div>
      </div>
      <CardContent className="p-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{recipe.prepTime + recipe.cookTime}m</span>
          <Users className="w-3 h-3 ml-2" />
          <span>{recipe.servings}</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Try Something New */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Shuffle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Feeling Adventurous?</h3>
              <p className="text-sm text-muted-foreground">Let us pick a random recipe for you</p>
            </div>
          </div>
          <Button onClick={getRandomRecipe} className="gap-2">
            <Shuffle className="w-4 h-4" />
            Surprise Me
          </Button>
        </div>
      </div>

      {/* Trending Now */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">Trending Now</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {trendingRecipes.map((recipe) => (
            <RecipePreviewCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </div>

      {/* Weekly Picks */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ChefHat className="w-5 h-5 text-secondary" />
          <h3 className="font-bold text-lg">Chef's Weekly Picks</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {weeklyPicks.map((recipe) => (
            <RecipePreviewCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </div>

      {/* Quick Meals */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">Quick Meals (Under 30 min)</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickMeals.map((recipe) => (
            <RecipePreviewCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </div>

      {/* Cuisine Explorer */}
      <div className="bg-card rounded-2xl p-6 border">
        <h3 className="font-bold text-lg mb-4">Explore Cuisines</h3>
        <div className="flex flex-wrap gap-2">
          {["Italian", "Indian", "Japanese", "Mexican", "Thai", "Chinese", "Middle Eastern", "African", "French", "Korean"].map((cuisine) => (
            <Badge 
              key={cuisine} 
              variant="outline" 
              className="px-4 py-2 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              {cuisine}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrendingSection;
