import { createClient } from "npm:@supabase/supabase-js@2";
import { createRateLimiter } from "./rateLimit.ts";

const allowedOrigins = new Set([
  "https://smart-chief-plan.lovable.app",
  "https://id-preview--736be95f-5483-4306-803e-4ba9d69ac7d3.lovable.app",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
]);

const limits = new Map<string, (key: string) => boolean>();

export function isAllowedOrigin(origin: string | null) {
  return origin === null || allowedOrigins.has(origin);
}

export function corsHeadersForRequest(req: Request) {
  const origin = req.headers.get("origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
  if (origin && allowedOrigins.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

export async function authorizeAndLimit(req: Request, bucket: string, maxRequests = 12) {
  const authorization = req.headers.get("Authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!token || !supabaseUrl || !anonKey) {
    return { error: "Unauthorized" as const };
  }

  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getClaims(token);
  const userId = data?.claims?.sub;
  if (error || typeof userId !== "string") return { error: "Unauthorized" as const };

  const limiterKey = `${bucket}:${maxRequests}`;
  let allowRequest = limits.get(limiterKey);
  if (!allowRequest) {
    allowRequest = createRateLimiter(maxRequests, 60_000);
    limits.set(limiterKey, allowRequest);
  }
  if (!allowRequest(userId)) return { error: "Rate limit exceeded" as const };

  return { client, userId };
}