import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MealPlan, Recipe } from "@/types/recipe";
import { recipes } from "@/data/recipes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Plus, X, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { format, startOfWeek, addDays } from "date-fns";

const mealTypes = ["Breakfast", "Lunch", "Dinner"];

const MealPlanner = () => {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; mealType: string } | null>(null);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchMealPlans();
  }, [weekStart]);

  const fetchMealPlans = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

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

  const openAddDialog = (date: Date, mealType: string) => {
    setSelectedSlot({
      date: format(date, "yyyy-MM-dd"),
      mealType
    });
    setAddDialogOpen(true);
  };

  const addMealPlan = async (recipe: Recipe) => {
    if (!selectedSlot) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from("meal_plans")
      .upsert({
        user_id: session.user.id,
        date: selectedSlot.date,
        meal_type: selectedSlot.mealType,
        recipe_id: recipe.id,
        recipe_data: recipe as any
      }, {
        onConflict: "user_id,date,meal_type"
      });

    if (error) {
      toast.error("Failed to add meal");
    } else {
      toast.success("Meal added to plan");
      setAddDialogOpen(false);
      fetchMealPlans();
    }
  };

  const removeMealPlan = async (mealPlanId: string) => {
    const { error } = await supabase
      .from("meal_plans")
      .delete()
      .eq("id", mealPlanId);

    if (error) {
      toast.error("Failed to remove meal");
    } else {
      toast.success("Meal removed from plan");
      fetchMealPlans();
    }
  };

  const getMealForSlot = (date: Date, mealType: string) => {
    return mealPlans.find(
      (mp) => mp.date === format(date, "yyyy-MM-dd") && mp.meal_type === mealType
    );
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.cuisine.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">Loading meal plans...</p>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[var(--gradient-primary)] rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-4xl font-bold">Meal Planner</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setWeekStart(addDays(weekStart, -7))}>
                Previous Week
              </Button>
              <Button variant="outline" onClick={() => setWeekStart(addDays(weekStart, 7))}>
                Next Week
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground">
            Week of {format(weekStart, "MMM d, yyyy")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
          {weekDays.map((day) => (
            <Card key={day.toString()} className="overflow-hidden">
              <CardHeader className="pb-3 bg-muted">
                <CardTitle className="text-center text-sm font-medium">
                  {format(day, "EEE")}
                  <br />
                  {format(day, "MMM d")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-2">
                {mealTypes.map((mealType) => {
                  const meal = getMealForSlot(day, mealType);
                  return (
                    <div
                      key={mealType}
                      className="border rounded-lg p-2 min-h-[100px] relative group"
                    >
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        {mealType}
                      </div>
                      {meal ? (
                        <>
                          <div className="text-xs font-medium line-clamp-2">
                            {meal.recipe_data.name}
                          </div>
                          <Button
                            size="icon"
                            variant="destructive"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeMealPlan(meal.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-full h-full"
                          onClick={() => openAddDialog(day, mealType)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Choose a recipe</DialogTitle>
          </DialogHeader>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search recipes by name or cuisine..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <ScrollArea className="max-h-[60vh]">
            <div className="grid grid-cols-2 gap-4 p-4">
              {filteredRecipes.map((recipe) => (
                <Card
                  key={recipe.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => addMealPlan(recipe)}
                >
                  <img
                    src={recipe.image}
                    alt={recipe.name}
                    className="w-full h-32 object-cover rounded-t-lg"
                  />
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm">{recipe.name}</h3>
                    <p className="text-xs text-muted-foreground">{recipe.cuisine}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MealPlanner;
