import { Router, type Request, type Response } from 'express';
import { cardRepository } from '../services/repositories/cardRepository.ts';
import { settingsRepository } from '../services/repositories/settingsRepository.ts';
import { calculateNextReview, canShowNewCards } from '../services/fsrs/index.ts';
import { statsScheduler } from '../services/statsScheduler.ts';
import {
  calculateAvailableCards,
  updateProgressAfterReview,
  getDailyStats,
  isNewCard,
  calculateGlobalAvailableCards,
} from '../services/limitService.ts';
import { ReviewCardSchema } from '../schemas/card.ts';
import { Rating } from 'ts-fsrs';
import { ZodError } from 'zod';
import type { Card } from '../services/database/schema.ts';

const router = Router();

/**
 * GET /api/courses/:courseId/due-cards
 * Получить карточки для повторения с учётом лимитов
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
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    if (currentMinutes < settings.trainingStartTime || currentMinutes >= settings.trainingEndTime) {
      return res.json({
        cards: [],
        message: 'Outside training hours',
      });
    }

    // Проверяем, можно ли предлагать новые карточки (по времени)
    const showNew = canShowNewCards(settings, now);

    // Получаем карточки с учётом лимитов
    const sessionMode = req.query.session === 'true';
    const result = await calculateAvailableCards(courseId, sessionMode);

    // Если слишком близко к концу дня, фильтруем новые карточки
    if (!showNew && result.cards.length > 0 && result.cards.some((c) => isNewCard(c.state))) {
      return res.json({
        cards: result.cards.filter((c) => !isNewCard(c.state)),
        limits: result.limits,
        canShowNewCards: false,
        message: 'Too close to end of day for new cards',
      });
    }

    res.json({
      cards: result.cards,
      limits: result.limits,
      canShowNewCards: result.canShowNewCards && showNew,
    });
  } catch (error) {
    console.error('Error fetching due cards:', error);
    res.status(500).json({ error: 'Failed to fetch due cards' });
  }
});

/**
 * GET /api/training/global/due-cards
 * Получить карточки для глобальной тренировки из всех курсов
 * Параметры: ?timezone=UTC
 */
router.get('/training/global/due-cards', async (req: Request, res: Response) => {
  try {
    const timezone = (req.query.timezone as string) || 'UTC';

    // Получаем mixed queue из всех курсов
    const result = await calculateGlobalAvailableCards(timezone);

    res.json({
      cards: result.cards,
      limits: result.limits,
    });
  } catch (error) {
    console.error('Error fetching global due cards:', error);
    res.status(500).json({ error: 'Failed to fetch global due cards' });
  }
});

/**
 * POST /api/training/review
 * Отправить результат повторения
 */
router.post('/training/review', async (req: Request, res: Response) => {
  let card: Card | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let updates: any | null = null;
  let wasNew: boolean = false;
  try {
    // Валидация
    const validatedData = ReviewCardSchema.parse(req.body);

    const cardId = validatedData.cardId;
    const rating = validatedData.rating as Rating;

    // Получаем карточку
    card = await cardRepository.getCardById(cardId);
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Запоминаем, была ли карточка новой (до обновления)
    wasNew = isNewCard(card.state);

    // Получаем настройки
    const settings = await settingsRepository.getEffectiveSettings(card.courseId);

    // Рассчитываем следующий интервал
    const now = new Date();
    updates = calculateNextReview(card, rating, settings, now);

    // Обновляем карточку
    const updatedCard = await cardRepository.updateCard(cardId, updates);

    // Обновляем прогресс за день (с учетом timezone)
    const timezone = validatedData.timezone || 'UTC';
    await updateProgressAfterReview(cardId, wasNew, timezone);

    // Broadcast обновлённую статистику всем SSE клиентам
    await statsScheduler.broadcastStats();

    res.json({
      card: updatedCard,
      message: 'Review submitted successfully',
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.issues });
    }
    console.error('Error submitting review:', wasNew, card, updates, error);
    res.status(500).json({ error: 'Failed to submit review', card });
  }
});

/**
 * GET /api/training/stats
 * Получить статистику за день (глобальную и по курсам)
 * Параметры: ?timezone=Asia/Shanghai
 */
router.get('/training/stats', async (req: Request, res: Response) => {
  try {
    // Получаем timezone из query параметра
    const timezone = (req.query.timezone as string) || 'UTC';

    // Получаем статистику за день
    const stats = await getDailyStats(timezone);

    // Получаем общее количество новых карточек
    const totalNewCards = await cardRepository.getGlobalNewCardsCount();

    // Объединяем результат
    res.json({
      ...stats,
      totalNewCards,
    });
  } catch (error) {
    console.error('Error fetching daily stats:', error);
    res.status(500).json({ error: 'Failed to fetch daily stats' });
  }
});

export default router;
