import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Favorite, Recipe } from "@/types/recipe";
import RecipeCard from "@/components/RecipeCard";
import RecipeDetailModal from "@/components/RecipeDetailModal";
import { Heart } from "lucide-react";

const Favorites = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((favorite) => (
              <RecipeCard
                key={favorite.id}
                recipe={favorite.recipe_data}
                onCardClick={() => handleRecipeClick(favorite.recipe_data)}
              />
            ))}
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

export default Favorites;
