import { useState, useEffect } from "react";
import { Recipe } from "@/types/recipe";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Heart, Clock, ImageOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Fallback food images by cuisine type
const getFallbackImage = (cuisine: string, name: string) => {
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

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const imageSrc = imageError ? getFallbackImage(recipe.cuisine, recipe.name) : recipe.image;

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
          src={imageSrc}
          alt={recipe.name}
          className={`w-full h-full object-cover transition-all group-hover:scale-110 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading="lazy"
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

export default RecipeCard;
