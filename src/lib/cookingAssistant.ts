import { supabase } from "@/integrations/supabase/client";

export interface CookingChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface CookingAssistantResponse {
  error?: string;
}

export async function streamCookingAssistant(
  history: CookingChatMessage[],
  onChunk: (text: string) => void,
) {
  const messages = history
    .filter((message) => message.role === "user")
    .slice(-20)
    .map((message) => ({ role: "user" as const, content: message.content }));
  if (!messages.length) throw new Error("Enter a question before sending.");

  const { data, error } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (error || !accessToken) throw new Error("Please sign in again to use the cooking assistant.");

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cooking-assistant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    const details = await response.json().catch(() => ({})) as CookingAssistantResponse;
    throw new Error(details.error || "Unable to reach the cooking assistant.");
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("The cooking assistant returned no response.");

  const decoder = new TextDecoder();
  let pending = "";
  while (true) {
    const { done, value } = await reader.read();
    pending += decoder.decode(value, { stream: !done });
    const lines = pending.split("\n");
    pending = done ? "" : lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const event = JSON.parse(payload);
        const text = event.choices?.[0]?.delta?.content;
        if (typeof text === "string") onChunk(text);
      } catch {
        // Ignore malformed or non-content streaming events.
      }
    }
    if (done) break;
  }
}