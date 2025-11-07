import { Recipe } from "@/types/recipe";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Clock, Users, Flame } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RecipeDetailModal = ({ recipe, open, onOpenChange }: RecipeDetailModalProps) => {
  if (!recipe) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        <div className="relative aspect-video overflow-hidden">
          <img
            src={recipe.image}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
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
