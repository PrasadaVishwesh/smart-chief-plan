import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Seo from "./components/Seo";

const Recipes = lazy(() => import("./pages/Recipes"));
const RecipeDetail = lazy(() => import("./pages/RecipeDetail"));
const MealPlanner = lazy(() => import("./pages/MealPlanner"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Assistant = lazy(() => import("./pages/Assistant"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<div className="container mx-auto px-4 py-12 text-center" role="status">Loading Smart Chief…</div>}>
          <Routes>
            <Route path="/" element={<Layout><Recipes /></Layout>} />
            <Route path="/recipes/:slug" element={<Layout><RecipeDetail /></Layout>} />
            <Route path="/meal-planner" element={<><Seo title="Weekly Meal Planner | Smart Chief" description="Plan your meals for the week and build an organized shopping list." canonicalPath="/meal-planner" noIndex /><Layout><MealPlanner /></Layout></>} />
            <Route path="/favorites" element={<><Seo title="Saved Recipes | Smart Chief" description="Browse the recipes you have saved to your favorites." canonicalPath="/favorites" noIndex /><Layout><Favorites /></Layout></>} />
            <Route path="/assistant" element={<><Seo title="Cooking Assistant | Smart Chief" description="Get help with cooking tips, recipe ideas, and ingredient substitutions." canonicalPath="/assistant" noIndex /><Layout><Assistant /></Layout></>} />
            <Route path="*" element={<><Seo title="Page not found | Smart Chief" description="The requested page could not be found." noIndex /><NotFound /></>} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
