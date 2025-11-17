import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MealPlan, Recipe } from "@/types/recipe";
import { recipes } from "@/data/recipes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, X, Search, Download, Copy, TrendingUp, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { format, startOfWeek, addDays } from "date-fns";
import jsPDF from "jspdf";

const mealTypes = ["Breakfast", "Lunch", "Dinner"];
const cuisineCategories = ["All", "Italian", "Asian", "Mexican", "Indian"];

const MealPlanner = () => {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; mealType: string } | null>(null);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("All");
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [targetWeekStart, setTargetWeekStart] = useState<Date | null>(null);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [selectedMealPlan, setSelectedMealPlan] = useState<MealPlan | null>(null);
  const [notes, setNotes] = useState("");

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

  const openEditDialog = (date: Date, mealType: string) => {
    openAddDialog(date, mealType);
  };

  const openNotesDialog = (mealPlan: MealPlan) => {
    setSelectedMealPlan(mealPlan);
    setNotes(mealPlan.notes || "");
    setNotesDialogOpen(true);
  };

  const saveNotes = async () => {
    if (!selectedMealPlan) return;

    const { error } = await supabase
      .from("meal_plans")
      .update({ notes })
      .eq("id", selectedMealPlan.id);

    if (error) {
      toast.error("Failed to save notes");
    } else {
      toast.success("Notes saved");
      setNotesDialogOpen(false);
      fetchMealPlans();
    }
  };

  const duplicateWeek = async () => {
    if (!targetWeekStart) {
      toast.error("Please select a target week");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const targetWeekEnd = addDays(targetWeekStart, 6);

    // Delete existing meals in target week
    await supabase
      .from("meal_plans")
      .delete()
      .eq("user_id", session.user.id)
      .gte("date", format(targetWeekStart, "yyyy-MM-dd"))
      .lte("date", format(targetWeekEnd, "yyyy-MM-dd"));

    // Copy meals from current week to target week
    const dayDifference = Math.floor((targetWeekStart.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
    
    const newMealPlans = mealPlans.map((meal) => {
      const originalDate = new Date(meal.date + "T00:00:00");
      const newDate = addDays(originalDate, dayDifference);
      return {
        user_id: session.user.id,
        date: format(newDate, "yyyy-MM-dd"),
        meal_type: meal.meal_type,
        recipe_id: meal.recipe_id,
        recipe_data: meal.recipe_data as any
      };
    });

    if (newMealPlans.length > 0) {
      const { error } = await supabase
        .from("meal_plans")
        .insert(newMealPlans);

      if (error) {
        toast.error("Failed to duplicate meal plan");
      } else {
        toast.success("Meal plan duplicated successfully");
        setDuplicateDialogOpen(false);
        setTargetWeekStart(null);
      }
    } else {
      toast.error("No meals to duplicate");
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(20);
    doc.text("Weekly Meal Plan", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.text(`Week of ${format(weekStart, "MMM d, yyyy")}`, pageWidth / 2, 30, { align: "center" });
    
    let yPosition = 45;
    
    weekDays.forEach((day, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.text(`${format(day, "EEEE, MMM d")}`, 15, yPosition);
      yPosition += 8;
      
      mealTypes.forEach((mealType) => {
        const meal = getMealForSlot(day, mealType);
        doc.setFontSize(11);
        doc.setFont(undefined, "normal");
        doc.text(`${mealType}:`, 20, yPosition);
        doc.setFont(undefined, "italic");
        doc.text(meal ? meal.recipe_data.name : "Not planned", 50, yPosition);
        yPosition += 6;
      });
      
      yPosition += 5;
    });
    
    doc.save(`meal-plan-${format(weekStart, "yyyy-MM-dd")}.pdf`);
    toast.success("Meal plan exported to PDF");
  };

  const getMealForSlot = (date: Date, mealType: string) => {
    return mealPlans.find(
      (mp) => mp.date === format(date, "yyyy-MM-dd") && mp.meal_type === mealType
    );
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.cuisine.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCuisine = selectedCuisine === "All" || recipe.cuisine === selectedCuisine;
    return matchesSearch && matchesCuisine;
  });

  const weeklyNutrition = mealPlans.reduce(
    (acc, meal) => {
      const nutrition = meal.recipe_data.nutrition;
      return {
        calories: acc.calories + (nutrition?.calories || 0),
        protein: acc.protein + (nutrition?.protein || 0),
        carbs: acc.carbs + (nutrition?.carbs || 0),
        fat: acc.fat + (nutrition?.fat || 0),
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
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
              <Button variant="outline" onClick={exportToPDF}>
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={() => setDuplicateDialogOpen(true)}>
                <Copy className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={() => setWeekStart(addDays(weekStart, -7))}>
                Previous
              </Button>
              <Button variant="outline" onClick={() => setWeekStart(addDays(weekStart, 7))}>
                Next
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground">
            Week of {format(weekStart, "MMM d, yyyy")}
          </p>
        </div>

        {mealPlans.length > 0 && (
          <Card className="mb-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Weekly Nutrition Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{weeklyNutrition.calories}</p>
                  <p className="text-sm text-muted-foreground">Total Calories</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{weeklyNutrition.protein}g</p>
                  <p className="text-sm text-muted-foreground">Protein</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{weeklyNutrition.carbs}g</p>
                  <p className="text-sm text-muted-foreground">Carbs</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{weeklyNutrition.fat}g</p>
                  <p className="text-sm text-muted-foreground">Fat</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                          <div 
                            className="text-xs font-medium line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                            onClick={() => openEditDialog(day, mealType)}
                          >
                            {meal.recipe_data.name}
                          </div>
                          {meal.notes && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                              {meal.notes}
                            </p>
                          )}
                          <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                openNotesDialog(meal);
                              }}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="destructive"
                              className="h-6 w-6"
                              onClick={() => removeMealPlan(meal.id)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
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
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search recipes by name or cuisine..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {cuisineCategories.map((cuisine) => (
                <Badge
                  key={cuisine}
                  variant={selectedCuisine === cuisine ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedCuisine(cuisine)}
                >
                  {cuisine}
                </Badge>
              ))}
            </div>
          </div>
          <ScrollArea className="max-h-[50vh]">
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

      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Meal Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Copy the current week's meal plan to another week. This will replace any existing meals in the target week.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Select target week:</label>
              <div className="grid grid-cols-2 gap-2">
                {[-2, -1, 1, 2, 3, 4].map((offset) => {
                  const targetWeek = addDays(weekStart, offset * 7);
                  const isCurrentWeek = offset === 0;
                  return (
                    <Button
                      key={offset}
                      variant={targetWeekStart && format(targetWeekStart, "yyyy-MM-dd") === format(targetWeek, "yyyy-MM-dd") ? "default" : "outline"}
                      disabled={isCurrentWeek}
                      onClick={() => setTargetWeekStart(targetWeek)}
                      className="justify-start"
                    >
                      {offset < 0 ? `${Math.abs(offset)} week${Math.abs(offset) > 1 ? 's' : ''} ago` : `In ${offset} week${offset > 1 ? 's' : ''}`}
                    </Button>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDuplicateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={duplicateWeek} disabled={!targetWeekStart}>
                Duplicate Week
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MealPlanner;
