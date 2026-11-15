import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(12).max(128),
  displayName: z.string().trim().max(80).optional(),
});

export const assistantMessageSchema = z.string().trim().min(1).max(2000);