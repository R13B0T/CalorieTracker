import { z } from 'zod';

export const ConfidenceSchema = z.enum(['high', 'medium', 'low']);

export const NutrientsSchema = z.object({
  kcal: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  fibre: z.number(),
});

export const MealItemSchema = z.object({
  name: z.string(),
  grams: z.number(),
  nutrients: NutrientsSchema,
  confidence: ConfidenceSchema,
  assumptions: z.array(z.string()),
});

export const MealAnalysisSchema = z.object({
  title: z.string(),
  items: z.array(MealItemSchema),
  notes: z.string(),
  overall_confidence: ConfidenceSchema,
  needs_clarification: z.string().nullable(),
});
export type MealAnalysis = z.infer<typeof MealAnalysisSchema>;
export type MealItemAnalysis = z.infer<typeof MealItemSchema>;

export const ExerciseEstimateSchema = z.object({
  activity: z.string(),
  minutes: z.number(),
  kcal: z.number(),
  met: z.number(),
  confidence: ConfidenceSchema,
  notes: z.string(),
});
export type ExerciseEstimate = z.infer<typeof ExerciseEstimateSchema>;
