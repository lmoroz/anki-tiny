import { z } from 'zod';

export const createCourseSchema = z.object({
  name: z.string().min(1, 'Course name is required').max(255, 'Course name is too long'),
  description: z.string().max(1000, 'Description is too long').optional().nullable(),
});

export const updateCourseSchema = z.object({
  name: z.string().min(1, 'Course name is required').max(255, 'Course name is too long').optional(),
  description: z.string().max(1000, 'Description is too long').optional().nullable(),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
