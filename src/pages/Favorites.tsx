import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Favorite, Recipe } from "@/types/recipe";
import RecipeCard from "@/components/RecipeCard";
import RecipeDetailModal from "@/components/RecipeDetailModal";
import { Heart, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

const Favorites = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<Recipe[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("favorites")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setFavorites(data as any);
    }
    setLoading(false);
  };

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setModalOpen(true);
  };

  const updateRating = async (favoriteId: string, rating: number) => {
    const { error } = await supabase
      .from("favorites")
      .update({ rating })
      .eq("id", favoriteId);

    if (error) {
      toast.error("Failed to update rating");
    } else {
      toast.success("Rating updated");
      fetchFavorites();
    }
  };

  const getRecommendations = async () => {
    setLoadingRecs(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-recommendations", {
        body: { favorites }
      });

      if (error) throw error;

      setRecommendations(data.recommendations || []);
      toast.success("Recommendations generated!");
    } catch (error) {
      console.error("Error getting recommendations:", error);
      toast.error("Failed to get recommendations");
    } finally {
      setLoadingRecs(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">Loading favorites...</p>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-[var(--gradient-primary)] rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-primary-foreground fill-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold">My Favorites</h1>
          </div>
          <p className="text-muted-foreground">
            Your saved recipes in one place
          </p>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No favorites yet</h2>
            <p className="text-muted-foreground">
              Start exploring recipes and save your favorites!
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex justify-end">
              <Button onClick={getRecommendations} disabled={loadingRecs}>
                <Sparkles className="w-4 h-4 mr-2" />
                {loadingRecs ? "Getting Recommendations..." : "Get AI Recommendations"}
              </Button>
            </div>

            {recommendations.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-primary" />
                  Recommended for You
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                  {recommendations.map((recipe) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      onCardClick={() => handleRecipeClick(recipe)}
                    />
                  ))}
                </div>
              </div>
            )}

            <h2 className="text-2xl font-bold mb-4">Your Favorites</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favorites.map((favorite) => (
                <div key={favorite.id} className="space-y-2">
                  <RecipeCard
                    recipe={favorite.recipe_data}
                    onCardClick={() => handleRecipeClick(favorite.recipe_data)}
                  />
                  <Card>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Rate this:</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Button
                              key={star}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => updateRating(favorite.id, star)}
                            >
                              <Star
                                className={`w-5 h-5 ${
                                  favorite.rating && favorite.rating >= star
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted-foreground"
                                }`}
                              />
                            </Button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </>
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

export default Favorites;
