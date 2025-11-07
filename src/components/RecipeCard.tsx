import { useState, useEffect } from "react";
import { Recipe } from "@/types/recipe";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Heart, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  return (
    <Card 
      className="overflow-hidden cursor-pointer transition-all hover:shadow-[var(--shadow-hover)] hover:-translate-y-1 group"
      onClick={onCardClick}
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={recipe.image}
          alt={recipe.name}
          className="w-full h-full object-cover transition-transform group-hover:scale-110"
        />
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
