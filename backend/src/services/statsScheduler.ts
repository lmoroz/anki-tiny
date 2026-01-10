import { type Response } from 'express';
import { cardRepository } from './repositories/cardRepository.js';
import { getDailyStats } from './limitService.js';
import { logger } from '../utils/logger.js';

/**
 * Сервис для управления планированием и отправкой статистики через SSE
 */
export class StatsScheduler {
  private clients: Set<Response> = new Set();
  private nextDueTimer: NodeJS.Timeout | null = null;

  /**
   * Добавить клиента в список подписчиков
   */
  addClient(client: Response): void {
    this.clients.add(client);
    logger.info(`[SSE] Client connected. Total clients: ${this.clients.size}`);

    // Если это первый клиент — запускаем планирование
    if (this.clients.size === 1) this.scheduleNextUpdate();
  }

  /**
   * Удалить клиента из списка подписчиков
   */
  removeClient(client: Response): void {
    this.clients.delete(client);
    logger.info(`[SSE] Client disconnected. Total clients: ${this.clients.size}`);

    // Если клиентов не осталось — отменяем таймер
    if (this.clients.size === 0) {
      if (this.nextDueTimer) {
        clearTimeout(this.nextDueTimer);
        this.nextDueTimer = null;
        logger.info('[SSE] No clients left, timer cancelled');
      }
    }
  }

  /**
   * Запланировать следующее обновление на момент ближайшей due карточки
   */
  async scheduleNextUpdate(): Promise<void> {
    // Очистить текущий таймер
    if (this.nextDueTimer) {
      clearTimeout(this.nextDueTimer);
      this.nextDueTimer = null;
    }

    // Если нет клиентов — не планируем
    if (this.clients.size === 0) return;

    try {
      // Запросить следующую due карточку
      const nextCard = await cardRepository.getNextDueCard();

      if (nextCard) {
        const dueTime = new Date(nextCard.due).getTime();
        const now = Date.now();
        let delay = dueTime - now;

        // Если due в прошлом или сейчас — немедленно отправить обновление
        if (delay <= 0) {
          logger.info('[SSE] Due card is already overdue, broadcasting immediately');
          await this.broadcastStats();
          await this.scheduleNextUpdate(); // Повторно запланировать
          return;
        }

        // Ограничить максимальный интервал до 1 часа для периодической валидации
        const maxInterval = 60 * 60 * 1000; // 1 час
        if (delay > maxInterval) delay = maxInterval;

        logger.info(`[SSE] Scheduling next update in ${Math.round(delay / 1000)}s (due: ${nextCard.due})`);

        // Установить таймер
        this.nextDueTimer = setTimeout(async () => {
          logger.info('[SSE] Timer fired, broadcasting stats');
          await this.broadcastStats();
          await this.scheduleNextUpdate(); // Рекурсивно запланировать следующее
        }, delay);
      } else {
        // Нет карточек с due в будущем — fallback на 1 час
        const fallbackDelay = 60 * 60 * 1000; // 1 час
        logger.info('[SSE] No future due cards, setting fallback timer for 1 hour');

        this.nextDueTimer = setTimeout(async () => {
          await this.scheduleNextUpdate(); // Проверить снова
        }, fallbackDelay);
      }
    } catch (error) {
      logger.error({ err: error }, '[SSE] Error scheduling next update');
    }
  }

  /**
   * Отправить обновлённую статистику всем подключённым клиентам
   */
  async broadcastStats(): Promise<void> {
    try {
      // Запросить статистику по всем курсам
      const statsMap = await cardRepository.getAllCoursesStats();

      // Преобразовать Map в массив для JSON
      const courses = Array.from(statsMap.entries()).map(([courseId, stats]) => ({
        courseId,
        stats,
      }));

      // Получить глобальную статистику (используем UTC timezone по умолчанию)
      const dailyStats = await getDailyStats('UTC');
      const totalNewCards = await cardRepository.getGlobalNewCardsCount();

      const globalStats = {
        ...dailyStats,
        totalNewCards,
      };

      // Сформировать SSE сообщение с полной статистикой
      const message = `event: stats-update\ndata: ${JSON.stringify({ courses, globalStats })}\n\n`;

      // Отправить всем клиентам
      const deadClients: Response[] = [];

      for (const client of this.clients) {
        try {
          client.write(message);
        } catch (_error) {
          logger.warn('[SSE] Failed to send to client, marking for removal');
          deadClients.push(client);
        }
      }

      // Удалить недоступных клиентов
      for (const client of deadClients) this.removeClient(client);

      logger.info(`[SSE] Broadcasted stats to ${this.clients.size} clients`);
    } catch (error) {
      logger.error({ err: error }, '[SSE] Error broadcasting stats');
    }
  }

  /**
   * Отправить статистику конкретному клиенту (initial state)
   */
  async sendToClient(client: Response): Promise<void> {
    try {
      const statsMap = await cardRepository.getAllCoursesStats();

      const courses = Array.from(statsMap.entries()).map(([courseId, stats]) => ({
        courseId,
        stats,
      }));

      // Получить глобальную статистику
      const dailyStats = await getDailyStats('UTC');
      const totalNewCards = await cardRepository.getGlobalNewCardsCount();

      const globalStats = {
        ...dailyStats,
        totalNewCards,
      };

      const message = `event: stats-update\ndata: ${JSON.stringify({ courses, globalStats })}\n\n`;

      client.write(message);
      logger.info('[SSE] Sent initial stats to client');
    } catch (error) {
      logger.error({ err: error }, '[SSE] Error sending to client');
    }
  }

  /**
   * Graceful shutdown — очистить все ресурсы
   */
  shutdown(): void {
    logger.info('[SSE] Shutting down StatsScheduler');

    // Очистить таймер
    if (this.nextDueTimer) {
      clearTimeout(this.nextDueTimer);
      this.nextDueTimer = null;
    }

    // Закрыть все соединения
    for (const client of this.clients) {
      try {
        client.end();
      } catch (error) {
        logger.warn({ err: error }, '[SSE] Error closing client connection');
      }
    }

    // Очистить список клиентов
    this.clients.clear();

    logger.info('[SSE] Shutdown complete');
  }
}

// Singleton instance
export const statsScheduler = new StatsScheduler();
