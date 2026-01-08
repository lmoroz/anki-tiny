import { Router, Request, Response } from 'express';
import { cardRepository } from '../services/repositories/cardRepository';

const router = Router();

/**
 * GET /api/stats/global
 * Получить общую статистику по всем курсам
 */
router.get('/stats/global', async (req: Request, res: Response) => {
  try {
    const totalNewCards = await cardRepository.getGlobalNewCardsCount();
    res.json({ totalNewCards });
  } catch (error) {
    console.error('Error fetching global stats:', error);
    res.status(500).json({ error: 'Failed to fetch global stats' });
  }
});

export default router;
