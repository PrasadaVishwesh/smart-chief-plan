import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation
interface FavoriteItem {
  recipe_data: {
    cuisine?: string;
    dietaryTags?: string[];
  };
  rating?: number | null;
}

function validateFavorites(data: unknown): FavoriteItem[] {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid request body');
  }
  
  const body = data as Record<string, unknown>;
  
  if (!Array.isArray(body.favorites)) {
    throw new Error('Favorites must be an array');
  }
  
  if (body.favorites.length === 0) {
    throw new Error('Favorites array cannot be empty');
  }
  
  if (body.favorites.length > 100) {
    throw new Error('Too many favorites (max 100)');
  }
  
  const validatedFavorites: FavoriteItem[] = [];
  
  for (const fav of body.favorites) {
    if (!fav || typeof fav !== 'object') {
      throw new Error('Each favorite must be an object');
    }
    
    const favorite = fav as Record<string, unknown>;
    
    if (!favorite.recipe_data || typeof favorite.recipe_data !== 'object') {
      throw new Error('Each favorite must have recipe_data');
    }
    
    const recipeData = favorite.recipe_data as Record<string, unknown>;
    
    validatedFavorites.push({
      recipe_data: {
        cuisine: typeof recipeData.cuisine === 'string' ? recipeData.cuisine : undefined,
        dietaryTags: Array.isArray(recipeData.dietaryTags) 
          ? recipeData.dietaryTags.filter((t): t is string => typeof t === 'string')
          : undefined
      },
      rating: typeof favorite.rating === 'number' ? favorite.rating : null
    });
  }
  
  return validatedFavorites;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate input
    const rawBody = await req.json();
    const favorites = validateFavorites(rawBody);
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Analyze user's favorites to understand preferences
    const cuisinePrefs = new Map<string, number>();
    const dietaryPrefs = new Set<string>();
    let avgRating = 0;
    let ratedCount = 0;

    favorites.forEach((fav) => {
      const recipe = fav.recipe_data;
      
      // Count cuisines
      if (recipe.cuisine) {
        cuisinePrefs.set(recipe.cuisine, (cuisinePrefs.get(recipe.cuisine) || 0) + 1);
      }
      
      // Collect dietary tags
      recipe.dietaryTags?.forEach((tag) => dietaryPrefs.add(tag));
      
      // Calculate average rating
      if (fav.rating) {
        avgRating += fav.rating;
        ratedCount++;
      }
    });

    if (ratedCount > 0) avgRating /= ratedCount;

    // Get top cuisines
    const topCuisines = Array.from(cuisinePrefs.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cuisine]) => cuisine);

    const dietaryList = Array.from(dietaryPrefs);

    console.log("User preferences:", { topCuisines, dietaryList, avgRating });

    // Call AI to get recommendations
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a recipe recommendation expert. Analyze user preferences and suggest similar recipes they might enjoy.'
          },
          {
            role: 'user',
            content: `Based on these preferences, suggest 6 recipe IDs from the available recipes (IDs 1-30):
            
Favorite cuisines: ${topCuisines.join(', ')}
Dietary preferences: ${dietaryList.join(', ') || 'None'}
Average rating given: ${avgRating.toFixed(1)}/5

Available recipes (IDs 1-30):
1-4: Italian (Carbonara, Margherita Pizza, Risotto, Lasagna)
5-9: Asian (Pad Thai, Teriyaki, Pho, Ramen, Bibimbap)
10-12: Mexican (Fish Tacos, Beef Enchiladas, Guacamole)
13-16: Indian (Chickpea Curry, Tikka Masala, Palak Paneer, Biryani)
17-19: International (Greek Moussaka, French Coq au Vin, Spanish Paella)
20-30: Global cuisines (Moroccan, Brazilian, Lebanese, Swedish, Vietnamese, Ethiopian, Polish, Jamaican, Turkish, Malaysian, Argentine)

Respond with ONLY a JSON array of 6 recipe IDs that match their preferences: ["1", "5", "13", ...]`
          }
        ],
        tools: [
          {
            type: "function",
            name: "suggest_recipes",
            description: "Return recipe IDs that match user preferences",
            parameters: {
              type: "object",
              properties: {
                recipe_ids: {
                  type: "array",
                  items: { type: "string" },
                  description: "Array of 6 recipe IDs"
                }
              },
              required: ["recipe_ids"],
              additionalProperties: false
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_recipes" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'AI gateway error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResponse = await response.json();
    console.log("AI response:", JSON.stringify(aiResponse, null, 2));

    let recipeIds: string[] = [];
    
    // Extract recipe IDs from tool call
    if (aiResponse.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      const args = JSON.parse(aiResponse.choices[0].message.tool_calls[0].function.arguments);
      recipeIds = args.recipe_ids || [];
    }

    console.log("Recommended recipe IDs:", recipeIds);

    // Import all recipes to map IDs to full recipe objects
    const allRecipes = await import("../../../src/data/recipes.ts");
    const recipes = allRecipes.recipes;

    const recommendations = recipeIds
      .map(id => recipes.find(r => r.id === id))
      .filter(r => r !== undefined)
      .slice(0, 6);

    console.log("Final recommendations:", recommendations.map(r => r?.name));

    return new Response(
      JSON.stringify({ recommendations }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in get-recommendations function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const status = errorMessage.includes('Invalid') || errorMessage.includes('must be') ? 400 : 500;
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
