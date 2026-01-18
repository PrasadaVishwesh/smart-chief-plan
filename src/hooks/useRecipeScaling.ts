import { useState, useMemo, useCallback } from "react";
import { Recipe } from "@/types/recipe";

// Parse ingredient string to extract quantity and unit
const parseIngredient = (ingredient: string): { quantity: number | null; unit: string; item: string } => {
  // Match patterns like "2 cups", "1/2 tsp", "1.5 kg", "3-4 cloves"
  const fractionMap: Record<string, number> = {
    "½": 0.5, "⅓": 0.333, "⅔": 0.667, "¼": 0.25, "¾": 0.75,
    "⅕": 0.2, "⅖": 0.4, "⅗": 0.6, "⅘": 0.8, "⅙": 0.167,
    "⅚": 0.833, "⅛": 0.125, "⅜": 0.375, "⅝": 0.625, "⅞": 0.875
  };

  // Replace unicode fractions
  let processedIngredient = ingredient;
  for (const [fraction, value] of Object.entries(fractionMap)) {
    processedIngredient = processedIngredient.replace(fraction, value.toString());
  }

  // Match number patterns (including fractions like 1/2)
  const match = processedIngredient.match(/^(\d+(?:\/\d+)?(?:\.\d+)?(?:\s*-\s*\d+(?:\/\d+)?(?:\.\d+)?)?)\s*([\w.]+)?\s*(.*)$/i);
  
  if (match) {
    let quantityStr = match[1];
    
    // Handle ranges like "3-4" by taking average
    if (quantityStr.includes("-")) {
      const [min, max] = quantityStr.split("-").map(s => {
        const trimmed = s.trim();
        if (trimmed.includes("/")) {
          const [num, den] = trimmed.split("/").map(Number);
          return num / den;
        }
        return parseFloat(trimmed);
      });
      return {
        quantity: (min + max) / 2,
        unit: match[2] || "",
        item: match[3] || ""
      };
    }
    
    // Handle fractions like "1/2"
    if (quantityStr.includes("/")) {
      const [num, den] = quantityStr.split("/").map(Number);
      return {
        quantity: num / den,
        unit: match[2] || "",
        item: match[3] || ""
      };
    }
    
    return {
      quantity: parseFloat(quantityStr),
      unit: match[2] || "",
      item: match[3] || ""
    };
  }
  
  // No quantity found - ingredient is descriptive like "Salt to taste"
  return { quantity: null, unit: "", item: ingredient };
};

// Format number nicely (avoid ugly decimals)
const formatQuantity = (num: number): string => {
  // Check for common fractions
  const fractions: [number, string][] = [
    [0.125, "⅛"], [0.25, "¼"], [0.333, "⅓"], [0.375, "⅜"],
    [0.5, "½"], [0.625, "⅝"], [0.667, "⅔"], [0.75, "¾"], [0.875, "⅞"]
  ];
  
  const whole = Math.floor(num);
  const decimal = num - whole;
  
  // Check if decimal matches a common fraction
  for (const [value, symbol] of fractions) {
    if (Math.abs(decimal - value) < 0.05) {
      return whole > 0 ? `${whole} ${symbol}` : symbol;
    }
  }
  
  // Round to 1 decimal place if needed
  if (Number.isInteger(num)) {
    return num.toString();
  }
  
  const rounded = Math.round(num * 10) / 10;
  return rounded.toString();
};

// Scale an ingredient
const scaleIngredient = (ingredient: string, scaleFactor: number): string => {
  const { quantity, unit, item } = parseIngredient(ingredient);
  
  if (quantity === null) {
    return ingredient; // Non-quantifiable ingredient
  }
  
  const scaledQuantity = quantity * scaleFactor;
  const formattedQuantity = formatQuantity(scaledQuantity);
  
  return `${formattedQuantity} ${unit} ${item}`.trim().replace(/\s+/g, " ");
};

export const useRecipeScaling = (recipe: Recipe | null) => {
  const originalServings = recipe?.servings ?? 4;
  const [targetServings, setTargetServings] = useState(originalServings);
  
  // Reset when recipe changes
  const recipeId = recipe?.id;
  useState(() => {
    if (recipeId) {
      setTargetServings(recipe?.servings ?? 4);
    }
  });
  
  const scaleFactor = useMemo(() => 
    targetServings / originalServings, 
    [targetServings, originalServings]
  );
  
  const scaledIngredients = useMemo(() => 
    (recipe?.ingredients ?? []).map(ing => scaleIngredient(ing, scaleFactor)),
    [recipe?.ingredients, scaleFactor]
  );
  
  const scaledNutrition = useMemo(() => ({
    calories: Math.round((recipe?.nutrition?.calories ?? 0)),
    protein: Math.round((recipe?.nutrition?.protein ?? 0)),
    carbs: Math.round((recipe?.nutrition?.carbs ?? 0)),
    fat: Math.round((recipe?.nutrition?.fat ?? 0)),
  }), [recipe?.nutrition]);
  
  const incrementServings = useCallback(() => {
    setTargetServings(prev => Math.min(prev + 1, 20));
  }, []);
  
  const decrementServings = useCallback(() => {
    setTargetServings(prev => Math.max(prev - 1, 1));
  }, []);
  
  const resetServings = useCallback(() => {
    setTargetServings(originalServings);
  }, [originalServings]);
  
  return {
    targetServings,
    setTargetServings,
    scaleFactor,
    scaledIngredients,
    scaledNutrition,
    incrementServings,
    decrementServings,
    resetServings,
    isScaled: targetServings !== originalServings
  };
};
