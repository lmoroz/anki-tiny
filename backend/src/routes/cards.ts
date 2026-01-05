import { Router, Request, Response } from 'express';
import { cardRepository } from '../services/repositories/cardRepository';
import { settingsRepository } from '../services/repositories/settingsRepository';
import { CreateCardSchema, UpdateCardSchema } from '../schemas/card';
import { ZodError } from 'zod';

const router = Router();

/**
 * GET /api/courses/:courseId/cards
 * Получить все карточки курса
 */
router.get('/courses/:courseId/cards', async (req: Request, res: Response) => {
  try {
    const courseId = parseInt(req.params.courseId, 10);

    if (isNaN(courseId)) {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    const cards = await cardRepository.getCardsByCourseId(courseId);
    res.json({ cards });
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
});

/**
 * POST /api/courses/:courseId/cards
 * Создать новую карточку
 */
router.post('/courses/:courseId/cards', async (req: Request, res: Response) => {
  try {
    const courseId = parseInt(req.params.courseId, 10);

    if (isNaN(courseId)) {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    // Валидация
    const validatedData = CreateCardSchema.parse(req.body);

    // Получаем настройки курса для инициализации FSRS
    const settings = await settingsRepository.getEffectiveSettings(courseId);

    // Создаем карточку с FSRS значениями
    const card = await cardRepository.createCard(validatedData.front, validatedData.back, courseId, settings);

    res.status(201).json({ card });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.issues });
    }
    console.error('Error creating card:', error);
    res.status(500).json({ error: 'Failed to create card' });
  }
});

/**
 * GET /api/cards/:id
 * Получить карточку по ID
 */
router.get('/cards/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid card ID' });
    }

    const card = await cardRepository.getCardById(id);

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    res.json({ card });
  } catch (error) {
    console.error('Error fetching card:', error);
    res.status(500).json({ error: 'Failed to fetch card' });
  }
});

/**
 * PUT /api/cards/:id
 * Обновить карточку
 */
router.put('/cards/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid card ID' });
    }

    // Валидация
    const validatedData = UpdateCardSchema.parse(req.body);

    // Проверяем существование карточки
    const existingCard = await cardRepository.getCardById(id);
    if (!existingCard) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Обновляем
    const card = await cardRepository.updateCard(id, validatedData);

    res.json({ card });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.issues });
    }
    console.error('Error updating card:', error);
    res.status(500).json({ error: 'Failed to update card' });
  }
});

/**
 * DELETE /api/cards/:id
 * Удалить карточку
 */
router.delete('/cards/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid card ID' });
    }

    // Проверяем существование
    const existingCard = await cardRepository.getCardById(id);
    if (!existingCard) {
      return res.status(404).json({ error: 'Card not found' });
    }

    await cardRepository.deleteCard(id);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting card:', error);
    res.status(500).json({ error: 'Failed to delete card' });
  }
});

/**
 * GET /api/courses/:courseId/stats
 * Получить статистику по курсу
 */
router.get('/courses/:courseId/stats', async (req: Request, res: Response) => {
  try {
    const courseId = parseInt(req.params.courseId, 10);

    if (isNaN(courseId)) {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    const stats = await cardRepository.getCourseStats(courseId);
    res.json({ stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
