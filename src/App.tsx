import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Layout from "./components/Layout";
import Seo from "./components/Seo";

const Home = lazy(() => import("./pages/Home"));
const Recipes = lazy(() => import("./pages/Recipes"));
const RecipeDetail = lazy(() => import("./pages/RecipeDetail"));
const MealPlanner = lazy(() => import("./pages/MealPlanner"));
const About = lazy(() => import("./pages/About"));
const Faq = lazy(() => import("./pages/Faq"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Assistant = lazy(() => import("./pages/Assistant"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <HelmetProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<div className="container mx-auto space-y-4 px-4 py-12" role="status" aria-label="Loading page">
            <div className="h-10 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => <div key={item} className="h-48 animate-pulse rounded-xl bg-muted" />)}
            </div>
          </div>}>
            <Routes>
              <Route path="/" element={<Layout><Home /></Layout>} />
              <Route path="/recipes" element={<Layout><Recipes /></Layout>} />
              <Route path="/recipes/:slug" element={<Layout><RecipeDetail /></Layout>} />
              <Route path="/meal-planner" element={<Layout><MealPlanner /></Layout>} />
              <Route path="/about" element={<Layout><About /></Layout>} />
              <Route path="/faq" element={<Layout><Faq /></Layout>} />
              <Route path="/favorites" element={<><Seo title="Saved Recipes | Smart Chief" description="Browse recipes you have saved to your Smart Chief favorites." canonicalPath="/favorites" noIndex /><Layout><Favorites /></Layout></>} />
              <Route path="/assistant" element={<Layout><Assistant /></Layout>} />
              <Route path="*" element={<><Seo title="Page not found | Smart Chief" description="The requested page could not be found." noIndex /><NotFound /></>} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </HelmetProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
