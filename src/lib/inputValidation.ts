import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(128),
  displayName: z.string().trim().max(80).optional(),
});

export const signUpSchema = signInSchema.extend({
  password: z.string().min(12).max(128),
  displayName: z.string().trim().min(1).max(80),
});

export const assistantMessageSchema = z.string().trim().min(1).max(2000);
export const mealNotesSchema = z.string().trim().max(500);