import { useState, useEffect } from "react";
import { Recipe } from "@/types/recipe";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Clock, Users, Flame, ImageOff, ChefHat, Minus, Plus, RotateCcw, Sparkles, Loader2 } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { getFallbackImage } from "@/utils/recipeImages";
import CookModeModal from "./CookModeModal";
import { useRecipeScaling } from "@/hooks/useRecipeScaling";
import { useAIImage } from "@/hooks/useAIImage";
import { toast } from "sonner";

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RecipeDetailModal = ({ recipe, open, onOpenChange }: RecipeDetailModalProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [cookModeOpen, setCookModeOpen] = useState(false);
  
  // Recipe scaling
  const scaling = useRecipeScaling(recipe);
  
  // AI Image generation
  const { aiImageUrl, isGenerating, error: aiError, generateImage, clearAIImage } = useAIImage();

  // Reset states when recipe changes
  useEffect(() => {
    if (recipe) {
      scaling.resetServings();
      clearAIImage();
      setImageError(false);
      setImageLoading(true);
    }
  }, [recipe?.id]);

  // Handle AI error
  useEffect(() => {
    if (aiError) {
      toast.error(aiError);
    }
  }, [aiError]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setImageError(false);
      setImageLoading(true);
      clearAIImage();
    }
    onOpenChange(isOpen);
  };

  const handleGenerateAIImage = () => {
    if (recipe) {
      generateImage(recipe.name, recipe.cuisine);
    }
  };

  if (!recipe) return null;

  const imageSrc = aiImageUrl || (imageError ? getFallbackImage(recipe.cuisine, recipe.name) : recipe.image);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
        <ScrollArea className="max-h-[90vh]">
          {/* Image Section - Fixed Height, No Overlap */}
          <div className="relative w-full h-56 sm:h-64 md:h-72 overflow-hidden bg-muted flex-shrink-0">
            {(imageLoading || isGenerating) && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  {isGenerating && <span className="text-sm text-muted-foreground">Generating AI image...</span>}
                </div>
              </div>
            )}
            <img
              src={imageSrc}
              alt={recipe.name}
              className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoading || isGenerating ? 'opacity-0' : 'opacity-100'}`}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
              onLoad={() => setImageLoading(false)}
            />
            
            {/* AI Generate Button */}
            <Button
              size="sm"
              variant="secondary"
              className="absolute top-3 right-3 gap-1.5 bg-background/80 backdrop-blur-sm hover:bg-background/90"
              onClick={handleGenerateAIImage}
              disabled={isGenerating}
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span className="hidden sm:inline">{isGenerating ? "Generating..." : "AI Image"}</span>
            </Button>
            
            {aiImageUrl && !isGenerating && (
              <div className="absolute bottom-3 left-3 bg-primary/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-primary-foreground flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                <span>AI Generated</span>
              </div>
            )}
            {imageError && !imageLoading && !aiImageUrl && (
              <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-muted-foreground flex items-center gap-1.5">
                <ImageOff className="w-3 h-3" />
                <span>Fallback image</span>
              </div>
            )}
          </div>

          {/* Content Section - Separate Container with Slide-Up Effect */}
          <div className="relative bg-background rounded-t-2xl -mt-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] animate-fade-in">
            <div className="p-6 space-y-6">
              {/* Header */}
              <DialogHeader className="space-y-2">
                <DialogTitle className="text-2xl font-bold leading-tight">{recipe.name}</DialogTitle>
                <p className="text-muted-foreground text-sm leading-relaxed">{recipe.description}</p>
              </DialogHeader>

              {/* Quick Stats with Scaling */}
              <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">Prep: {recipe.prepTime} min</div>
                    <div className="text-muted-foreground text-xs">Cook: {recipe.cookTime} min</div>
                  </div>
                </div>
                
                {/* Servings with Scaling Controls */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="w-6 h-6 rounded-full"
                      onClick={scaling.decrementServings}
                      disabled={scaling.targetServings <= 1}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <div className="text-sm font-medium min-w-[70px] text-center">
                      {scaling.targetServings} servings
                    </div>
                    <Button
                      size="icon"
                      variant="outline"
                      className="w-6 h-6 rounded-full"
                      onClick={scaling.incrementServings}
                      disabled={scaling.targetServings >= 20}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    {scaling.isScaled && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-6 h-6"
                        onClick={scaling.resetServings}
                        title="Reset to original"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Flame className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">{recipe.nutrition.calories} cal</div>
                  </div>
                </div>
              </div>
              
              {/* Scaling indicator */}
              {scaling.isScaled && (
                <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg text-sm">
                  <span className="text-primary font-medium">
                    Scaled from {recipe.servings} to {scaling.targetServings} servings ({scaling.scaleFactor.toFixed(2)}x)
                  </span>
                </div>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-primary/90 hover:bg-primary">{recipe.cuisine}</Badge>
                {recipe.dietaryTags.map((tag) => (
                  <Badge key={tag} variant="outline" className="capitalize">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Ingredients & Nutrition Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3 p-4 bg-card rounded-xl border shadow-sm">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-primary rounded-full"></span>
                    Ingredients
                    {scaling.isScaled && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        Scaled
                      </Badge>
                    )}
                  </h3>
                  <ul className="space-y-2">
                    {scaling.scaledIngredients.map((ingredient, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-1">•</span>
                        <span className={scaling.isScaled ? "text-primary font-medium" : ""}>{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3 p-4 bg-card rounded-xl border shadow-sm">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-primary rounded-full"></span>
                    Nutrition (per serving)
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted/70 p-3 rounded-lg text-center">
                      <div className="text-xs text-muted-foreground">Calories</div>
                      <div className="text-lg font-bold text-primary">{recipe.nutrition.calories}</div>
                    </div>
                    <div className="bg-muted/70 p-3 rounded-lg text-center">
                      <div className="text-xs text-muted-foreground">Protein</div>
                      <div className="text-lg font-bold">{recipe.nutrition.protein}g</div>
                    </div>
                    <div className="bg-muted/70 p-3 rounded-lg text-center">
                      <div className="text-xs text-muted-foreground">Carbs</div>
                      <div className="text-lg font-bold">{recipe.nutrition.carbs}g</div>
                    </div>
                    <div className="bg-muted/70 p-3 rounded-lg text-center">
                      <div className="text-xs text-muted-foreground">Fat</div>
                      <div className="text-lg font-bold">{recipe.nutrition.fat}g</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-4 p-4 bg-card rounded-xl border shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-primary rounded-full"></span>
                    Instructions
                  </h3>
                  <Button
                    onClick={() => setCookModeOpen(true)}
                    className="gap-2"
                    size="sm"
                  >
                    <ChefHat className="w-4 h-4" />
                    Cook Mode
                  </Button>
                </div>
                <ol className="space-y-4">
                  {recipe.instructions.map((instruction, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold shadow-sm">
                        {index + 1}
                      </span>
                      <span className="text-sm leading-relaxed pt-1">{instruction}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Cook Mode Modal */}
        <CookModeModal
          recipe={recipe}
          open={cookModeOpen}
          onOpenChange={setCookModeOpen}
        />
      </DialogContent>
    </Dialog>
  );
};

export default RecipeDetailModal;