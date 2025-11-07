import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MealPlan } from "@/types/recipe";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Download } from "lucide-react";
import { format, startOfWeek, addDays } from "date-fns";

const ShoppingList = () => {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMealPlans();
  }, []);

  const fetchMealPlans = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);

    const { data, error } = await supabase
      .from("meal_plans")
      .select("*")
      .eq("user_id", session.user.id)
      .gte("date", format(weekStart, "yyyy-MM-dd"))
      .lte("date", format(weekEnd, "yyyy-MM-dd"));

    if (!error && data) {
      setMealPlans(data as any);
    }
    setLoading(false);
  };

  const toggleItem = (item: string) => {
    setCheckedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(item)) {
        newSet.delete(item);
      } else {
        newSet.add(item);
      }
      return newSet;
    });
  };

  const allIngredients = mealPlans.flatMap((mp) => 
    mp.recipe_data.ingredients.map((ing) => ({
      ingredient: ing,
      recipe: mp.recipe_data.name
    }))
  );

  const groupedIngredients = allIngredients.reduce((acc, { ingredient, recipe }) => {
    if (!acc[ingredient]) {
      acc[ingredient] = [];
    }
    acc[ingredient].push(recipe);
    return acc;
  }, {} as Record<string, string[]>);

  const downloadList = () => {
    const text = Object.entries(groupedIngredients)
      .map(([ingredient, recipes]) => 
        `☐ ${ingredient}\n  (for ${recipes.join(", ")})`
      )
      .join("\n\n");

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shopping-list.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">Loading shopping list...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[var(--gradient-secondary)] rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-secondary-foreground" />
            </div>
            <h1 className="text-4xl font-bold">Shopping List</h1>
          </div>
          {Object.keys(groupedIngredients).length > 0 && (
            <Button onClick={downloadList} className="gap-2">
              <Download className="w-4 h-4" />
              Download List
            </Button>
          )}
        </div>
        <p className="text-muted-foreground">
          Generated from your weekly meal plan
        </p>
      </div>

      {Object.keys(groupedIngredients).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No items yet</h2>
            <p className="text-muted-foreground">
              Add recipes to your meal planner to generate a shopping list
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {Object.keys(groupedIngredients).length} ingredients needed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(groupedIngredients).map(([ingredient, recipes]) => (
                <div
                  key={ingredient}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <Checkbox
                    id={ingredient}
                    checked={checkedItems.has(ingredient)}
                    onCheckedChange={() => toggleItem(ingredient)}
                    className="mt-1"
                  />
                  <label
                    htmlFor={ingredient}
                    className={`flex-1 cursor-pointer ${
                      checkedItems.has(ingredient) ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    <div className="font-medium">{ingredient}</div>
                    <div className="text-sm text-muted-foreground">
                      For {recipes.join(", ")}
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ShoppingList;
