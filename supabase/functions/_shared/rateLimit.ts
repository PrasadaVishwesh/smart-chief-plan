import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retry_after_seconds: number;
};

export async function getVerifiedUserId(request: Request): Promise<string | null> {
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return null;

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anonKey) {
    throw new Error("Supabase authentication is not configured");
  }

  const token = authorization.slice("Bearer ".length);
  const supabase = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase.auth.getClaims(token);

  if (error || typeof data?.claims?.sub !== "string") return null;
  return data.claims.sub;
}

export async function enforceRateLimit(
  userId: string,
  endpoint: string,
  limit: number,
  windowSeconds: number,
  corsHeaders: Record<string, string>,
): Promise<Response | null> {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) {
    console.error("Rate limiting is not configured");
    return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase.rpc("consume_api_rate_limit", {
    p_endpoint: endpoint,
    p_user_id: userId,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error("Rate limit check failed:", error.message);
    return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const result = data as RateLimitResult | null;
  if (!result || typeof result.allowed !== "boolean") {
    console.error("Rate limit check returned an invalid response");
    return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (result.allowed) return null;

  const retryAfter = Math.max(1, result.retry_after_seconds || windowSeconds);
  return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
    status: 429,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Retry-After": String(retryAfter),
      "RateLimit-Limit": String(result.limit),
      "RateLimit-Remaining": String(result.remaining),
    },
  });
}
