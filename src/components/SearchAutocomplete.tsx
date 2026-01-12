import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, X, TrendingUp } from "lucide-react";
import { recipes } from "@/data/recipes";

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (value: string) => void;
}

const SearchAutocomplete = ({ value, onChange, onSelect }: SearchAutocompleteProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Popular searches - diverse global cuisines
  const popularSearches = ["Biryani", "Pasta", "Butter Chicken", "Tacos", "Sushi", "Dosa", "Ramen", "Pizza"];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (value.length < 2) {
      setSuggestions([]);
      return;
    }

    const searchLower = value.toLowerCase();
    const matches = new Set<string>();

    recipes.forEach(recipe => {
      // Match by name
      if (recipe.name.toLowerCase().includes(searchLower)) {
        matches.add(recipe.name);
      }
      // Match by cuisine
      if (recipe.cuisine.toLowerCase().includes(searchLower)) {
        matches.add(recipe.cuisine);
      }
      // Match by ingredients
      recipe.ingredients.forEach(ing => {
        if (ing.toLowerCase().includes(searchLower)) {
          matches.add(recipe.name);
        }
      });
      // Match by tags
      recipe.dietaryTags.forEach(tag => {
        if (tag.toLowerCase().includes(searchLower)) {
          matches.add(tag);
        }
      });
    });

    // Fuzzy matching for misspellings
    const allNames = recipes.map(r => r.name);
    allNames.forEach(name => {
      if (fuzzyMatch(searchLower, name.toLowerCase())) {
        matches.add(name);
      }
    });

    setSuggestions(Array.from(matches).slice(0, 8));
  }, [value]);

  // Simple fuzzy matching
  const fuzzyMatch = (search: string, target: string): boolean => {
    if (search.length < 3) return false;
    let searchIdx = 0;
    for (let i = 0; i < target.length && searchIdx < search.length; i++) {
      if (target[i] === search[searchIdx]) {
        searchIdx++;
      }
    }
    return searchIdx >= search.length * 0.7;
  };

  const handleSelect = (item: string) => {
    onChange(item);
    onSelect?.(item);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search dishes, cuisines, ingredients..."
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-12 pr-10 h-14 text-lg rounded-2xl border-2 focus:border-primary bg-card shadow-lg"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border-2 rounded-xl shadow-xl z-50 overflow-hidden">
          {suggestions.length > 0 ? (
            <ul className="py-2">
              {suggestions.map((item, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => handleSelect(item)}
                    className="w-full px-4 py-3 text-left hover:bg-muted flex items-center gap-3 transition-colors"
                  >
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <span>{item}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : value.length < 2 ? (
            <div className="p-4">
              <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Popular Searches
              </p>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((search) => (
                  <button
                    key={search}
                    onClick={() => handleSelect(search)}
                    className="px-3 py-1.5 bg-muted rounded-full text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              No results found for "{value}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
