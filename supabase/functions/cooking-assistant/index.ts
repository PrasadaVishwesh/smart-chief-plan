import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authorizeAndLimit, corsHeadersForRequest, isAllowedOrigin } from "../_shared/security.ts";
import { validateAssistantMessages } from "../_shared/assistantInput.ts";

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
    const authorization = await authorizeAndLimit(req, 'cooking-assistant', 12);
    if ('error' in authorization) {
      const status = authorization.error === 'Rate limit exceeded' ? 429 : 401;
      return new Response(JSON.stringify({ error: authorization.error }), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Parse and validate input
    const rawBody = await req.json();
    const messages = validateAssistantMessages(rawBody);
    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: 'A non-empty user message is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(JSON.stringify({ error: 'Service temporarily unavailable' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing ${messages.length} messages`);

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
            content: 'You are a helpful cooking assistant and nutritionist. Help users with recipe questions, cooking techniques, ingredient substitutions, meal planning advice, dietary recommendations, and nutritional information. Be friendly, concise, and practical in your advice.'
          },
          ...messages
        ],
        stream: true,
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
      const errorBody = await response.text();
      console.error('AI gateway error status:', response.status);
      return new Response(JSON.stringify({ error: response.status === 401 ? 'AI service configuration error' : response.status === 403 ? 'AI request was denied' : response.status === 404 ? 'AI service is unavailable' : response.status >= 500 ? 'AI service is temporarily unavailable' : 'Unable to process request', detail: errorBody.slice(0, 500) }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
      },
    });
  } catch (error) {
    console.error('Error in cooking-assistant function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isValidationError = errorMessage.includes('Invalid') || errorMessage.includes('must be') || errorMessage.includes('cannot be') || errorMessage.includes('Too many');
    
    return new Response(
      JSON.stringify({ error: isValidationError ? errorMessage : 'An error occurred' }),
      {
        status: isValidationError ? 400 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
