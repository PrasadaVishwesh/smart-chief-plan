import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authorizeAndLimit, corsHeadersForRequest, isAllowedOrigin, readJsonWithLimit } from "../_shared/security.ts";

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
  const corsHeaders = corsHeadersForRequest(req);
  if (req.method === "OPTIONS") {
    return isAllowedOrigin(req.headers.get("origin"))
      ? new Response("ok", { headers: corsHeaders })
      : new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  if (!isAllowedOrigin(req.headers.get("origin"))) {
    return new Response(JSON.stringify({ error: "Forbidden origin" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authorization = await authorizeAndLimit(req, "generate-recipe-image", 6);
    if ("error" in authorization) {
      const status = authorization.error === "Rate limit exceeded" ? 429 : 401;
      return new Response(JSON.stringify({ error: authorization.error }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await readJsonWithLimit(req, 4_096);
    const { dishName, cuisine } = body && typeof body === "object" ? body : {};
    
    // Validate inputs
    const validation = validateInput(dishName, cuisine);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: "Invalid image request" }), {
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
      console.error("AI gateway request failed with status:", response.status);
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
    console.error("generate-recipe-image error:", error instanceof Error ? error.message : "Unknown error");
    const isTooLarge = error instanceof Error && error.message.includes("too large");
    const isInvalid = error instanceof Error && error.message.includes("Invalid");
    return new Response(JSON.stringify({ error: "An error occurred" }), {
      status: isTooLarge ? 413 : isInvalid ? 400 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
