import { useState, useEffect, memo, useCallback } from "react";
import { Recipe } from "@/types/recipe";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Heart, Clock, ImageOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getRecipeImage, isImagePreloaded } from "@/utils/recipeImages";

interface RecipeCardProps {
  recipe: Recipe;
  onCardClick: () => void;
}

const RecipeCard = ({ recipe, onCardClick }: RecipeCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkFavoriteStatus();
  }, [recipe.id]);

  const checkFavoriteStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("recipe_id", recipe.id)
      .maybeSingle();

    setIsFavorite(!!data);
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please sign in to save favorites");
      setLoading(false);
      return;
    }

    if (isFavorite) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", session.user.id)
        .eq("recipe_id", recipe.id);

      if (error) {
        toast.error("Failed to remove favorite");
      } else {
        setIsFavorite(false);
        toast.success("Removed from favorites");
      }
    } else {
      const { error } = await supabase
        .from("favorites")
        .insert({
          user_id: session.user.id,
          recipe_id: recipe.id,
          recipe_data: recipe as any
        });

      if (error) {
        toast.error("Failed to add favorite");
      } else {
        setIsFavorite(true);
        toast.success("Added to favorites");
      }
    }

    setLoading(false);
  };

  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  
  // Get the best available image using the optimized function
  const primaryImage = getRecipeImage(recipe);
  const [currentSrc, setCurrentSrc] = useState(primaryImage);

  const handleImageError = useCallback(() => {
    if (!imageError) {
      setImageError(true);
      setImageLoading(false);
      // Try fallback if primary fails
      const fallback = getRecipeImage({ ...recipe, image: undefined });
      if (fallback !== currentSrc) {
        setCurrentSrc(fallback);
        setImageLoading(true);
      }
    }
  }, [imageError, currentSrc, recipe]);

  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
  }, []);

  // Check if image is already preloaded
  useEffect(() => {
    if (isImagePreloaded(primaryImage)) {
      setImageLoading(false);
    }
  }, [primaryImage]);

  return (
    <Card 
      className="overflow-hidden cursor-pointer transition-all hover:shadow-[var(--shadow-hover)] hover:-translate-y-1 group"
      onClick={onCardClick}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <img
          src={currentSrc}
          alt={recipe.name}
          className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-110 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading="lazy"
          decoding="async"
          fetchPriority="low"
        />
        {imageError && !imageLoading && (
          <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm rounded px-2 py-1 text-xs text-muted-foreground flex items-center gap-1">
            <ImageOff className="w-3 h-3" />
            <span>Fallback image</span>
          </div>
        )}
        <Button
          size="icon"
          variant="secondary"
          className="absolute top-2 right-2 rounded-full shadow-lg"
          onClick={toggleFavorite}
          disabled={loading}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavorite ? "fill-destructive text-destructive" : ""
            }`}
          />
        </Button>
      </div>
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg mb-1">{recipe.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {recipe.description}
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{recipe.prepTime + recipe.cookTime} min</span>
          <span>•</span>
          <span>{recipe.servings} servings</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{recipe.cuisine}</Badge>
          {recipe.dietaryTags.map((tag) => (
            <Badge key={tag} variant="outline" className="capitalize">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(RecipeCard);
