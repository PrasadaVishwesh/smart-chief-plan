import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation for dish name and cuisine
function validateInput(dishName: unknown, cuisine: unknown): { valid: boolean; error?: string } {
  if (!dishName || typeof dishName !== 'string') {
    return { valid: false, error: 'Invalid dishName' };
  }
  if (!cuisine || typeof cuisine !== 'string') {
    return { valid: false, error: 'Invalid cuisine' };
  }
  // Length limits
  if (dishName.length > 100) {
    return { valid: false, error: 'Dish name too long (max 100 characters)' };
  }
  if (cuisine.length > 50) {
    return { valid: false, error: 'Cuisine too long (max 50 characters)' };
  }
  // Character whitelist (alphanumeric, spaces, hyphens, basic punctuation for international dishes)
  const safePattern = /^[a-zA-Z0-9\s\-',.()áéíóúñüÁÉÍÓÚÑÜàèìòùÀÈÌÒÙâêîôûÂÊÎÔÛäëïöüÄËÏÖÜçÇ]+$/;
  if (!safePattern.test(dishName)) {
    return { valid: false, error: 'Invalid characters in dish name' };
  }
  if (!safePattern.test(cuisine)) {
    return { valid: false, error: 'Invalid characters in cuisine' };
  }
  return { valid: true };
}

// Sanitize inputs before using in prompt
function sanitizeForPrompt(text: string): string {
  return text
    .replace(/["'`]/g, '') // Remove quotes
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    console.log(`Image generation request from user: ${userId}`);

    const { dishName, cuisine } = await req.json();
    
    // Validate inputs
    const validation = validateInput(dishName, cuisine);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize inputs for prompt
    const safeDishName = sanitizeForPrompt(dishName);
    const safeCuisine = sanitizeForPrompt(cuisine);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use sanitized inputs in structured prompt format
    const prompt = [
      "Generate a high-quality, appetizing food photography image.",
      `Dish: ${safeDishName}`,
      `Cuisine: ${safeCuisine}`,
      "Style requirements:",
      "- Professional food photography style",
      "- Well-lit with natural lighting",
      "- Showing the dish beautifully plated on an appropriate plate/bowl",
      "- Top-down or 45-degree angle view",
      "- Garnished appropriately for the dish",
      "- Ultra high resolution",
      "- No text, watermarks, or logos"
    ].join('\n');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to generate image" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "No image generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-recipe-image error:", error);
    return new Response(JSON.stringify({ error: "An error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
