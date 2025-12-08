import { useState } from "react";
import { Recipe } from "@/types/recipe";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Clock, Users, Flame, ImageOff } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

// Fallback food images by cuisine type
const getFallbackImage = (cuisine: string) => {
  const cuisineImages: Record<string, string> = {
    "Italian": "https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=800",
    "Indian": "https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&w=800",
    "Asian": "https://images.pexels.com/photos/2347311/pexels-photo-2347311.jpeg?auto=compress&cs=tinysrgb&w=800",
    "Mexican": "https://images.pexels.com/photos/2092507/pexels-photo-2092507.jpeg?auto=compress&cs=tinysrgb&w=800",
    "Thai": "https://images.pexels.com/photos/699953/pexels-photo-699953.jpeg?auto=compress&cs=tinysrgb&w=800",
    "Japanese": "https://images.pexels.com/photos/357756/pexels-photo-357756.jpeg?auto=compress&cs=tinysrgb&w=800",
    "Chinese": "https://images.pexels.com/photos/955137/pexels-photo-955137.jpeg?auto=compress&cs=tinysrgb&w=800",
    "Korean": "https://images.pexels.com/photos/5773968/pexels-photo-5773968.jpeg?auto=compress&cs=tinysrgb&w=800",
    "Vietnamese": "https://images.pexels.com/photos/1907228/pexels-photo-1907228.jpeg?auto=compress&cs=tinysrgb&w=800",
    "Middle Eastern": "https://images.pexels.com/photos/6544378/pexels-photo-6544378.jpeg?auto=compress&cs=tinysrgb&w=800",
    "French": "https://images.pexels.com/photos/3026808/pexels-photo-3026808.jpeg?auto=compress&cs=tinysrgb&w=800",
    "Spanish": "https://images.pexels.com/photos/4871119/pexels-photo-4871119.jpeg?auto=compress&cs=tinysrgb&w=800",
    "Greek": "https://images.pexels.com/photos/1211887/pexels-photo-1211887.jpeg?auto=compress&cs=tinysrgb&w=800",
    "American": "https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=800",
    "Brazilian": "https://images.pexels.com/photos/7613568/pexels-photo-7613568.jpeg?auto=compress&cs=tinysrgb&w=800",
    "African": "https://images.pexels.com/photos/5638527/pexels-photo-5638527.jpeg?auto=compress&cs=tinysrgb&w=800",
    "British": "https://images.pexels.com/photos/6941028/pexels-photo-6941028.jpeg?auto=compress&cs=tinysrgb&w=800",
    "German": "https://images.pexels.com/photos/4518655/pexels-photo-4518655.jpeg?auto=compress&cs=tinysrgb&w=800",
    "Mediterranean": "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800",
  };
  return cuisineImages[cuisine] || "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800";
};

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RecipeDetailModal = ({ recipe, open, onOpenChange }: RecipeDetailModalProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Reset image state when recipe changes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setImageError(false);
      setImageLoading(true);
    }
    onOpenChange(isOpen);
  };

  if (!recipe) return null;

  const imageSrc = imageError ? getFallbackImage(recipe.cuisine) : recipe.image;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        <div className="relative aspect-video overflow-hidden bg-muted">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <img
            src={imageSrc}
            alt={recipe.name}
            className={`w-full h-full object-cover transition-opacity ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
            onLoad={() => setImageLoading(false)}
          />
          {imageError && !imageLoading && (
            <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm rounded px-2 py-1 text-xs text-muted-foreground flex items-center gap-1">
              <ImageOff className="w-3 h-3" />
              <span>Fallback image</span>
            </div>
          )}
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-6 space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl">{recipe.name}</DialogTitle>
              <p className="text-muted-foreground">{recipe.description}</p>
            </DialogHeader>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <div className="text-sm">
                  <div className="font-medium">Prep: {recipe.prepTime} min</div>
                  <div className="text-muted-foreground">Cook: {recipe.cookTime} min</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <div className="text-sm">
                  <div className="font-medium">{recipe.servings} servings</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-primary" />
                <div className="text-sm">
                  <div className="font-medium">{recipe.nutrition.calories} cal</div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge>{recipe.cuisine}</Badge>
              {recipe.dietaryTags.map((tag) => (
                <Badge key={tag} variant="outline" className="capitalize">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Ingredients</h3>
                <ul className="space-y-2">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span className="text-sm">{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Nutrition (per serving)</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Calories</div>
                    <div className="text-lg font-semibold">{recipe.nutrition.calories}</div>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Protein</div>
                    <div className="text-lg font-semibold">{recipe.nutrition.protein}g</div>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Carbs</div>
                    <div className="text-lg font-semibold">{recipe.nutrition.carbs}g</div>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Fat</div>
                    <div className="text-lg font-semibold">{recipe.nutrition.fat}g</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Instructions</h3>
              <ol className="space-y-3">
                {recipe.instructions.map((instruction, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="text-sm pt-0.5">{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default RecipeDetailModal;