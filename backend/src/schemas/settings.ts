import { z } from 'zod';

// Схема для глобальных настроек
export const GlobalSettingsSchema = z.object({
  trainingStartHour: z.number().int().min(0).max(23).optional(),
  trainingEndHour: z.number().int().min(0).max(23).optional(),
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
});

// Схема для настроек курса (все поля optional, т.к. наследуются из глобальных)
export const CourseSettingsSchema = z.object({
  trainingStartHour: z.number().int().min(0).max(23).nullable().optional(),
  trainingEndHour: z.number().int().min(0).max(23).nullable().optional(),
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
});

// Типы для TypeScript
export type GlobalSettingsInput = z.infer<typeof GlobalSettingsSchema>;
export type CourseSettingsInput = z.infer<typeof CourseSettingsSchema>;
