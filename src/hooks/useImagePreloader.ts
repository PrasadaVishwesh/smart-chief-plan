import { useEffect, useRef } from 'react';
import { preloadImages, preloadVisibleRecipeImages, getRecipeImage } from '@/utils/recipeImages';

interface Recipe {
  name: string;
  cuisine: string;
  image?: string;
}

// Hook to preload recipe images as user scrolls
export const useImagePreloader = (
  recipes: Recipe[],
  currentPage: number = 1,
  recipesPerPage: number = 12
) => {
  const preloadedPagesRef = useRef<Set<number>>(new Set());
  
  useEffect(() => {
    if (recipes.length === 0) return;
    
    // Preload current page
    const startIndex = (currentPage - 1) * recipesPerPage;
    const endIndex = Math.min(startIndex + recipesPerPage, recipes.length);
    const currentPageRecipes = recipes.slice(startIndex, endIndex);
    
    // Also preload next page
    const nextPageStart = endIndex;
    const nextPageEnd = Math.min(nextPageStart + recipesPerPage, recipes.length);
    const nextPageRecipes = recipes.slice(nextPageStart, nextPageEnd);
    
    const recipesToPreload = [...currentPageRecipes, ...nextPageRecipes];
    
    if (!preloadedPagesRef.current.has(currentPage)) {
      preloadedPagesRef.current.add(currentPage);
      
      // Use Intersection Observer-like approach with idle callback
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          const urls = recipesToPreload.map(recipe => getRecipeImage(recipe));
          preloadImages(urls, 6);
        }, { timeout: 2000 });
      } else {
        setTimeout(() => {
          const urls = recipesToPreload.map(recipe => getRecipeImage(recipe));
          preloadImages(urls, 6);
        }, 100);
      }
    }
  }, [recipes, currentPage, recipesPerPage]);
};

// Hook to preload initial batch of images on mount
export const useInitialImagePreloader = (recipes: Recipe[]) => {
  useEffect(() => {
    if (recipes.length === 0) return;
    
    // Preload first batch of visible recipes
    preloadVisibleRecipeImages(recipes, 16);
    
    // Preload more in the background
    const timeout = setTimeout(() => {
      const additionalUrls = recipes
        .slice(16, 48)
        .map(recipe => getRecipeImage(recipe));
      preloadImages(additionalUrls, 2);
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, [recipes]);
};

export default useImagePreloader;
