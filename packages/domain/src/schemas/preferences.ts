import { z } from 'zod';

export const DENSITIES = ['comfortable', 'compact'] as const;
export const ACCENTS = ['indigo', 'blue', 'violet', 'teal', 'rose', 'graphite'] as const;
export const MOTION_PREFERENCES = ['system', 'reduce'] as const;

export const preferencesSchema = z.object({
  accent: z.enum(ACCENTS).default('indigo'),
  density: z.enum(DENSITIES).default('comfortable'),
  weekStart: z.number().int().min(0).max(6).default(1),
  dateFormat: z.string().max(16).default('MMM d'),
  language: z.string().max(32).default('en'),
  timezone: z.string().max(64).default('UTC'),
  motion: z.enum(MOTION_PREFERENCES).default('system'),
  homeRoute: z.string().max(32).default('home'),
});

export type Preferences = z.infer<typeof preferencesSchema>;

export const updatePreferencesInputSchema = z
  .object({
    accent: z.enum(ACCENTS),
    density: z.enum(DENSITIES),
    weekStart: z.number().int().min(0).max(6),
    dateFormat: z.string().max(16),
    language: z.string().max(32),
    timezone: z.string().max(64),
    motion: z.enum(MOTION_PREFERENCES),
    homeRoute: z.string().max(32),
  })
  .partial();

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesInputSchema>;
