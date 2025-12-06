import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function validateMessages(data: unknown): ChatMessage[] {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid request body');
  }
  
  const body = data as Record<string, unknown>;
  
  if (!Array.isArray(body.messages)) {
    throw new Error('Messages must be an array');
  }
  
  if (body.messages.length === 0) {
    throw new Error('Messages array cannot be empty');
  }
  
  if (body.messages.length > 50) {
    throw new Error('Too many messages (max 50)');
  }
  
  const validatedMessages: ChatMessage[] = [];
  
  for (const msg of body.messages) {
    if (!msg || typeof msg !== 'object') {
      throw new Error('Each message must be an object');
    }
    
    const message = msg as Record<string, unknown>;
    
    if (message.role !== 'user' && message.role !== 'assistant') {
      throw new Error('Message role must be "user" or "assistant"');
    }
    
    if (typeof message.content !== 'string') {
      throw new Error('Message content must be a string');
    }
    
    if (message.content.length > 10000) {
      throw new Error('Message content too long (max 10000 characters)');
    }
    
    validatedMessages.push({
      role: message.role,
      content: message.content.trim()
    });
  }
  
  return validatedMessages;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate input
    const rawBody = await req.json();
    const messages = validateMessages(rawBody);
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
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
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'AI gateway error' }), {
        status: 500,
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
