import { Router, type Request, type Response } from 'express';
import { statsScheduler } from '../services/statsScheduler.ts';
import { logger } from '../utils/logger.ts';

const router = Router();

/**
 * SSE endpoint для потоковой передачи статистики
 */
router.get('/stream', async (req: Request, res: Response) => {
  logger.info('[SSE] New client connection request');

  // Установить SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Добавить клиента в scheduler
  statsScheduler.addClient(res);

  // Отправить initial stats
  await statsScheduler.sendToClient(res);

  // Обработать disconnect
  req.on('close', () => {
    statsScheduler.removeClient(res);
  });
});

export default router;
