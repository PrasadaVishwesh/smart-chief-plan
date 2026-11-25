import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authorizeAndLimit, corsHeadersForRequest, isAllowedOrigin, readJsonWithLimit } from "../_shared/security.ts";

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
        cuisine: typeof recipeData.cuisine === 'string' ? recipeData.cuisine.slice(0, 80) : undefined,
        dietaryTags: Array.isArray(recipeData.dietaryTags) 
          ? recipeData.dietaryTags.filter((t): t is string => typeof t === 'string').slice(0, 20).map((tag) => tag.slice(0, 50))
          : undefined
      },
      rating: typeof favorite.rating === 'number' && Number.isFinite(favorite.rating) && favorite.rating >= 1 && favorite.rating <= 5 ? favorite.rating : null
    });
  }
  
  return validatedFavorites;
}

serve(async (req) => {
  const corsHeaders = corsHeadersForRequest(req);
  if (req.method === 'OPTIONS') {
    return isAllowedOrigin(req.headers.get('origin'))
      ? new Response('ok', { headers: corsHeaders })
      : new Response('Forbidden', { status: 403, headers: corsHeaders });
  }

  if (!isAllowedOrigin(req.headers.get('origin'))) {
    return new Response(JSON.stringify({ error: 'Forbidden origin' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const authorization = await authorizeAndLimit(req, 'get-recommendations', 12);
    if ('error' in authorization) {
      const status = authorization.error === 'Rate limit exceeded' ? 429 : 401;
      return new Response(JSON.stringify({ error: authorization.error }), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const rawBody = await readJsonWithLimit(req, 128_000);
    const favorites = validateFavorites(rawBody);
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(JSON.stringify({ error: 'Service temporarily unavailable' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
      console.error('AI gateway request failed with status:', response.status);
      return new Response(JSON.stringify({ error: 'Unable to process request' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResponse = await response.json();

    let recipeIds: string[] = [];
    
    // Extract recipe IDs from tool call
    if (aiResponse.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      const args = JSON.parse(aiResponse.choices[0].message.tool_calls[0].function.arguments);
      recipeIds = Array.isArray(args.recipe_ids) ? args.recipe_ids.slice(0, 6) : [];
    }

    // Import all recipes to map IDs to full recipe objects
    const allRecipes = await import("../../../src/data/recipes.ts");
    const recipes = allRecipes.recipes;

    const recommendations = recipeIds
      .filter((id): id is string => typeof id === "string" && id.length <= 80)
      .map(id => recipes.find(r => r.id === id))
      .filter(r => r !== undefined)
      .slice(0, 6);

    return new Response(
      JSON.stringify({ recommendations }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in get-recommendations function:', error instanceof Error ? error.message : 'Unknown error');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isValidationError = errorMessage.includes('Invalid') || errorMessage.includes('must be') || errorMessage.includes('cannot be') || errorMessage.includes('Too many');
    const status = errorMessage.includes('too large') ? 413 : isValidationError ? 400 : 500;
    
    return new Response(
      JSON.stringify({ error: isValidationError ? errorMessage : 'Unable to process request' }),
      {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
