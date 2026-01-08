import { z } from 'zod';

// Схема для глобальных настроек
export const GlobalSettingsSchema = z.object({
  trainingStartHour: z.number().int().min(0).max(23).optional(), // DEPRECATED
  trainingEndHour: z.number().int().min(0).max(23).optional(), // DEPRECATED
  trainingStartTime: z.number().int().min(0).max(1439).optional(), // Minutes from midnight
  trainingEndTime: z.number().int().min(0).max(1439).optional(), // Minutes from midnight
  minTimeBeforeEnd: z.number().int().min(1).max(12).optional(),
  notificationsEnabled: z.boolean().optional(),
  learningSteps: z
    .string()
    .refine(
      (val) => {
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) && parsed.every((n) => typeof n === 'number' && n > 0);
        } catch {
          return false;
        }
      },
      { message: 'Learning steps must be a valid JSON array of positive numbers' }
    )
    .optional(),
  enableFuzz: z.boolean().optional(),
  requestRetention: z.number().min(0.7).max(1.0).optional(),
  globalNewCardsPerDay: z.number().int().min(0).optional(),
  globalMaxReviewsPerDay: z.number().int().min(0).optional(),
  // New fields for default course limits (will be added in migration 007)
  defaultNewCardsPerDay: z.number().int().min(0).optional(),
  defaultMaxReviewsPerDay: z.number().int().min(0).optional(),
  defaultNewCardsPerSession: z.number().int().min(0).optional(),
  defaultMaxReviewsPerSession: z.number().int().min(0).optional(),
});

// Схема для настроек курса (все поля optional, т.к. наследуются из глобальных)
export const CourseSettingsSchema = z.object({
  trainingStartHour: z.number().int().min(0).max(23).nullable().optional(), // DEPRECATED
  trainingEndHour: z.number().int().min(0).max(23).nullable().optional(), // DEPRECATED
  trainingStartTime: z.number().int().min(0).max(1439).nullable().optional(), // Minutes from midnight
  trainingEndTime: z.number().int().min(0).max(1439).nullable().optional(), // Minutes from midnight
  minTimeBeforeEnd: z.number().int().min(1).max(12).nullable().optional(),
  notificationsEnabled: z.boolean().nullable().optional(),
  learningSteps: z
    .string()
    .refine(
      (val) => {
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) && parsed.every((n) => typeof n === 'number' && n > 0);
        } catch {
          return false;
        }
      },
      { message: 'Learning steps must be a valid JSON array of positive numbers' }
    )
    .nullable()
    .optional(),
  enableFuzz: z.boolean().nullable().optional(),
  requestRetention: z.number().min(0.7).max(1.0).nullable().optional(),
  newCardsPerDay: z.number().int().min(0).nullable().optional(),
  maxReviewsPerDay: z.number().int().min(0).nullable().optional(),
  newCardsPerSession: z.number().int().min(0).nullable().optional(),
  maxReviewsPerSession: z.number().int().min(0).nullable().optional(),
});

// Типы для TypeScript
export type GlobalSettingsInput = z.infer<typeof GlobalSettingsSchema>;
export type CourseSettingsInput = z.infer<typeof CourseSettingsSchema>;
