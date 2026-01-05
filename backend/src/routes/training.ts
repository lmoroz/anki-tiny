import { Router, Request, Response } from 'express';
import { cardRepository } from '../services/repositories/cardRepository';
import { settingsRepository } from '../services/repositories/settingsRepository';
import { calculateNextReview, canShowNewCards } from '../services/fsrs';
import { ReviewCardSchema } from '../schemas/card';
import { Rating } from 'ts-fsrs';
import { ZodError } from 'zod';

const router = Router();

/**
 * GET /api/courses/:courseId/due-cards
 * Получить карточки для повторения
 */
router.get('/courses/:courseId/due-cards', async (req: Request, res: Response) => {
  try {
    const courseId = parseInt(req.params.courseId, 10);

    if (isNaN(courseId)) {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    const now = new Date();
    const settings = await settingsRepository.getEffectiveSettings(courseId);

    // Проверяем время тренировок
    const currentHour = now.getHours();
    if (currentHour < settings.trainingStartHour || currentHour >= settings.trainingEndHour) {
      return res.json({
        cards: [],
        message: 'Outside training hours',
      });
    }

    // Проверяем, можно ли предлагать новые карточки
    const showNew = canShowNewCards(settings, now);
    const cards = await cardRepository.getDueCards(courseId, now, !showNew);

    if (!showNew && cards.length > 0 && cards.some((c) => c.state === 0)) {
      return res.json({
        cards: cards.filter((c) => c.state !== 0),
        message: 'Too close to end of day for new cards',
      });
    }

    res.json({
      cards,
      canShowNewCards: showNew,
    });
  } catch (error) {
    console.error('Error fetching due cards:', error);
    res.status(500).json({ error: 'Failed to fetch due cards' });
  }
});

/**
 * POST /api/training/review
 * Отправить результат повторения
 */
router.post('/training/review', async (req: Request, res: Response) => {
  try {
    // Валидация
    const validatedData = ReviewCardSchema.parse(req.body);

    const cardId = validatedData.cardId;
    const rating = parseInt(validatedData.rating, 10) as Rating;

    // Получаем карточку
    const card = await cardRepository.getCardById(cardId);
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Получаем настройки
    const settings = await settingsRepository.getEffectiveSettings(card.courseId);

    // Рассчитываем следующий интервал
    const now = new Date();
    const updates = calculateNextReview(card, rating, settings, now);

    // Обновляем карточку
    const updatedCard = await cardRepository.updateCard(cardId, updates);

    res.json({
      card: updatedCard,
      message: 'Review submitted successfully',
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.issues });
    }
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

export default router;
