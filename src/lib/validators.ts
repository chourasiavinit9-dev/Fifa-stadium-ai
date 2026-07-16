// src/lib/validators.ts
import { z } from "zod";

export const AnomalyReportSchema = z.object({
  incidentTitle: z
    .string()
    .min(3, "Title min 3 chars")
    .max(200, "Title max 200 chars"),
  severity: z.enum(["Low", "Medium", "High Priority", "Safety Hazard"]),
  location: z
    .string()
    .min(2, "Location required")
    .max(100, "Location max 100 chars"),
  description: z.string().max(1000, "Max 1000 characters"),
});

export const GeminiChatSchema = z.object({
  message: z
    .string()
    .min(1, "Message required")
    .max(500, "Max 500 characters"),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "model"]),
        parts: z.array(z.object({ text: z.string() })),
      })
    )
    .max(6, "Max 6 history turns")
    .optional()
    .default([]),
  matchContext: z.string().max(3000).optional(),
});

export const GeminiOpsSchema = z.object({
  sectorName: z.string().min(2).max(100),
  density: z.number().min(0).max(100),
  adjacentDensities: z.record(z.string(), z.number().min(0).max(100)),
  activeIncidents: z.number().int().min(0),
  activeOperations: z.array(z.string().max(200)).max(10),
});

export const WorldCupMatchSchema = z.object({
  round: z.string(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  time: z.string().optional(),
  team1: z.string().min(1),
  team2: z.string().min(1),
  score: z
    .object({
      ft: z.tuple([z.number().int().min(0), z.number().int().min(0)]),
      ht: z
        .tuple([z.number().int().min(0), z.number().int().min(0)])
        .optional(),
      et: z
        .tuple([z.number().int().min(0), z.number().int().min(0)])
        .optional(),
      p: z
        .tuple([z.number().int().min(0), z.number().int().min(0)])
        .optional(),
    })
    .optional(),
  goals1: z
    .array(z.object({ name: z.string(), minute: z.string() }))
    .optional(),
  goals2: z
    .array(z.object({ name: z.string(), minute: z.string() }))
    .optional(),
  group: z.string().optional(),
  ground: z.string(),
});

export const WorldCupDataSchema = z.object({
  name: z.string(),
  matches: z.array(WorldCupMatchSchema),
});

export const JourneyPlanSchema = z.object({
  origin: z.string().min(2, "Please enter your starting location").max(200),
  matchInfo: z.string().max(500).optional(),
});

export type AnomalyReport = z.infer<typeof AnomalyReportSchema>;
export type GeminiChat = z.infer<typeof GeminiChatSchema>;
export type GeminiOps = z.infer<typeof GeminiOpsSchema>;
export type WorldCupMatch = z.infer<typeof WorldCupMatchSchema>;
export type WorldCupDataType = z.infer<typeof WorldCupDataSchema>;
export type JourneyPlan = z.infer<typeof JourneyPlanSchema>;

export function sanitizeText(input: string): string {
  return input
    .replace(/(<([^>]+)>)/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 500);
}

export function containsMaliciousPattern(input: string): boolean {
  return (
    /<script/i.test(input) ||
    /javascript:/i.test(input) ||
    /<iframe/i.test(input) ||
    /<object/i.test(input) ||
    /onerror\s*=/i.test(input) ||
    /onload\s*=/i.test(input) ||
    /eval\s*\(/i.test(input)
  );
}
