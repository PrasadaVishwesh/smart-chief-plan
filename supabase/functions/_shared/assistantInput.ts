export interface AssistantMessage {
  role: "user";
  content: string;
}

function sanitizeUserInput(content: string): string {
  return content
    .replace(/\b(system|assistant|user)\s*:/gi, "")
    .replace(/ignore\s+(previous|all|earlier|above|prior)\s+(instructions|prompts|context)/gi, "")
    .replace(/\[INST\]|\[\/INST\]|<\|im_start\|>|<\|im_end\|>|<\|endoftext\|>/g, "")
    .replace(/<<SYS>>|<<\/SYS>>|<\|system\|>/g, "")
    .replace(/###\s*(instruction|system|user|assistant)/gi, "")
    .trim();
}

export function validateAssistantMessages(data: unknown): AssistantMessage[] {
  if (!data || typeof data !== "object" || !Array.isArray((data as Record<string, unknown>).messages)) {
    throw new Error("Messages must be an array");
  }

  const messages = (data as { messages: unknown[] }).messages;
  if (messages.length === 0 || messages.length > 20) {
    throw new Error("Messages must contain between 1 and 20 items");
  }

  return messages.map((value) => {
    if (!value || typeof value !== "object") throw new Error("Each message must be an object");
    const message = value as Record<string, unknown>;
    if (message.role !== "user") throw new Error("Only user messages are accepted");
    if (typeof message.content !== "string" || message.content.length > 2000) {
      throw new Error("Message content must be a string of at most 2000 characters");
    }

    const content = sanitizeUserInput(message.content);
    if (!content) throw new Error("A non-empty user message is required");
    return { role: "user", content };
  });
}