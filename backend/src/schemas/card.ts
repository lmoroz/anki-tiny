import { z } from 'zod';

// Схема для создания карточки
export const CreateCardSchema = z.object({
  front: z.string().min(1, 'Front is required').max(10000, 'Front is too long'),
  back: z.string().min(1, 'Back is required').max(10000, 'Back is too long'),
});

// Схема для обновления карточки
export const UpdateCardSchema = z.object({
  front: z.string().min(1).max(10000).optional(),
  back: z.string().min(1).max(10000).optional(),
});

// Схема для отправки результата повторения
export const ReviewCardSchema = z.object({
  cardId: z.number().int().positive('Card ID must be positive'),
  rating: z.enum(['1', '2', '3', '4'], {
    message: 'Rating must be 1 (Again), 2 (Hard), 3 (Good), or 4 (Easy)',
  }),
});

// Типы для TypeScript
export type CreateCardInput = z.infer<typeof CreateCardSchema>;
export type UpdateCardInput = z.infer<typeof UpdateCardSchema>;
export type ReviewCardInput = z.infer<typeof ReviewCardSchema>;
