import { db } from '../database/index.js';
import type { DailyProgress, NewDailyProgress } from '../database/schema.js';

/**
 * Repository для работы с дневным прогрессом
 */
export class ProgressRepository {
  /**
   * Получить прогресс для конкретного курса за конкретную дату
   */
  async getProgress(date: string, courseId: number): Promise<DailyProgress | null> {
    const progress = await db
      .selectFrom('dailyProgress')
      .where('date', '=', date)
      .where('courseId', '=', courseId)
      .selectAll()
      .executeTakeFirst();

    return progress || null;
  }

  /**
   * Получить глобальный прогресс (сумма по всем курсам) за дату
   */
  async getGlobalProgress(date: string): Promise<{ newCardsStudied: number; reviewsCompleted: number }> {
    const result = await db
      .selectFrom('dailyProgress')
      .where('date', '=', date)
      .select((eb) => [
        eb.fn.sum<number>('newCardsStudied').as('newCardsStudied'),
        eb.fn.sum<number>('reviewsCompleted').as('reviewsCompleted'),
      ])
      .executeTakeFirst();

    return {
      newCardsStudied: result?.newCardsStudied ?? 0,
      reviewsCompleted: result?.reviewsCompleted ?? 0,
    };
  }

  /**
   * Создать новую запись прогресса
   */
  async create(data: NewDailyProgress): Promise<DailyProgress> {
    const result = await db
      .insertInto('dailyProgress')
      .values({
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  }

  /**
   * Инкрементировать счётчик (newCardsStudied или reviewsCompleted)
   */
  async increment(id: number, field: 'newCardsStudied' | 'reviewsCompleted'): Promise<void> {
    await db
      .updateTable('dailyProgress')
      .set((eb) => ({
        [field]: eb(field, '+', 1),
        updatedAt: new Date().toISOString(),
      }))
      .where('id', '=', id)
      .execute();
  }

  /**
   * Удалить старые записи (для очистки)
   * @param daysToKeep — сколько дней хранить (например, 30)
   */
  async cleanup(daysToKeep: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0]; // YYYY-MM-DD

    const result = await db.deleteFrom('dailyProgress').where('date', '<', cutoffDateStr).executeTakeFirst();

    return Number(result.numDeletedRows ?? 0);
  }
}

// Singleton instance
export const progressRepository = new ProgressRepository();
