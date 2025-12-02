import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SlidersHorizontal, X } from "lucide-react";
import { cuisines, dietaryFilters } from "@/data/recipes";

interface Filters {
  cuisines: string[];
  dietary: string[];
  maxTime: number;
  maxCalories: number;
  difficulty: string[];
}

interface AdvancedFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  activeFilterCount: number;
}

const difficulties = ["Easy", "Medium", "Hard"];

const AdvancedFilters = ({ filters, onFiltersChange, activeFilterCount }: AdvancedFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleCuisine = (cuisine: string) => {
    if (cuisine === "All") {
      onFiltersChange({ ...filters, cuisines: [] });
    } else {
      const newCuisines = filters.cuisines.includes(cuisine)
        ? filters.cuisines.filter(c => c !== cuisine)
        : [...filters.cuisines, cuisine];
      onFiltersChange({ ...filters, cuisines: newCuisines });
    }
  };

  const toggleDietary = (diet: string) => {
    const newDietary = filters.dietary.includes(diet)
      ? filters.dietary.filter(d => d !== diet)
      : [...filters.dietary, diet];
    onFiltersChange({ ...filters, dietary: newDietary });
  };

  const toggleDifficulty = (diff: string) => {
    const newDifficulty = filters.difficulty.includes(diff)
      ? filters.difficulty.filter(d => d !== diff)
      : [...filters.difficulty, diff];
    onFiltersChange({ ...filters, difficulty: newDifficulty });
  };

  const clearFilters = () => {
    onFiltersChange({
      cuisines: [],
      dietary: [],
      maxTime: 180,
      maxCalories: 1000,
      difficulty: []
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2 relative">
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Filters</SheetTitle>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-destructive">
                <X className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Cuisines */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Cuisine</Label>
            <div className="flex flex-wrap gap-2">
              {cuisines.filter(c => c !== "All").slice(0, 15).map((cuisine) => (
                <Badge
                  key={cuisine}
                  variant={filters.cuisines.includes(cuisine) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleCuisine(cuisine)}
                >
                  {cuisine}
                </Badge>
              ))}
            </div>
          </div>

          {/* Dietary */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Dietary Preferences</Label>
            <div className="grid grid-cols-2 gap-3">
              {dietaryFilters.map((diet) => (
                <div key={diet} className="flex items-center space-x-2">
                  <Checkbox
                    id={diet}
                    checked={filters.dietary.includes(diet)}
                    onCheckedChange={() => toggleDietary(diet)}
                  />
                  <label htmlFor={diet} className="text-sm capitalize cursor-pointer">
                    {diet}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Cooking Time */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Max Cooking Time: {filters.maxTime} min
            </Label>
            <Slider
              value={[filters.maxTime]}
              onValueChange={([value]) => onFiltersChange({ ...filters, maxTime: value })}
              max={180}
              min={15}
              step={15}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>15 min</span>
              <span>3 hours</span>
            </div>
          </div>

          {/* Calories */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Max Calories: {filters.maxCalories} cal
            </Label>
            <Slider
              value={[filters.maxCalories]}
              onValueChange={([value]) => onFiltersChange({ ...filters, maxCalories: value })}
              max={1000}
              min={100}
              step={50}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>100 cal</span>
              <span>1000 cal</span>
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Difficulty</Label>
            <div className="flex gap-2">
              {difficulties.map((diff) => (
                <Badge
                  key={diff}
                  variant={filters.difficulty.includes(diff) ? "default" : "outline"}
                  className="cursor-pointer flex-1 justify-center py-2"
                  onClick={() => toggleDifficulty(diff)}
                >
                  {diff}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <Button className="w-full mt-6" onClick={() => setIsOpen(false)}>
          Apply Filters
        </Button>
      </SheetContent>
    </Sheet>
  );
};

export default AdvancedFilters;
