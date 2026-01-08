import { db } from '../database';
import { Card, CardUpdate } from '../database/schema';
import { initializeNewCard } from '../fsrs';

/**
 * Repository для работы с карточками
 */
export class CardRepository {
  /**
   * Получить все карточки курса
   */
  async getCardsByCourseId(courseId: number): Promise<Card[]> {
    return db.selectFrom('cards').where('courseId', '=', courseId).orderBy('createdAt', 'desc').selectAll().execute();
  }

  /**
   * Получить карточку по ID
   */
  async getCardById(id: number): Promise<Card | null> {
    const card = await db.selectFrom('cards').where('id', '=', id).selectAll().executeTakeFirst();
    return card || null;
  }

  /**
   * Создать новую карточку
   */
  async createCard(front: string, back: string, courseId: number): Promise<Card> {
    // Инициализируем карточку с FSRS значениями
    const newCardData = initializeNewCard(front, back, courseId);

    const result = await db
      .insertInto('cards')
      .values({
        courseId: newCardData.courseId,
        front: newCardData.front,
        back: newCardData.back,
        due: newCardData.due,
        stability: newCardData.stability,
        difficulty: newCardData.difficulty,
        scheduledDays: newCardData.scheduledDays,
        reps: newCardData.reps,
        lapses: newCardData.lapses,
        state: newCardData.state,
        lastReview: newCardData.lastReview,
        stepIndex: newCardData.stepIndex,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  }

  /**
   * Обновить карточку
   */
  async updateCard(id: number, data: CardUpdate): Promise<Card> {
    const result = await db
      .updateTable('cards')
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  }

  /**
   * Удалить карточку
   */
  async deleteCard(id: number): Promise<void> {
    await db.deleteFrom('cards').where('id', '=', id).execute();
  }

  /**
   * Удалить несколько карточек одной транзакцией
   */
  async deleteCardsBatch(ids: number[], courseId: number): Promise<number> {
    const result = await db.deleteFrom('cards').where('id', 'in', ids).where('courseId', '=', courseId).executeTakeFirst();

    return Number(result.numDeletedRows ?? 0);
  }

  /**
   * Удалить все карточки курса
   */
  async deleteAllCards(courseId: number): Promise<number> {
    const result = await db.deleteFrom('cards').where('courseId', '=', courseId).executeTakeFirst();

    return Number(result.numDeletedRows ?? 0);
  }

  /**
   * Получить карточки, готовые к повторению
   */
  async getDueCards(courseId: number, now: Date, excludeNew = false): Promise<Card[]> {
    let query = db.selectFrom('cards').where('courseId', '=', courseId).where('due', '<=', now.toISOString()).orderBy('due', 'asc');

    if (excludeNew) {
      // Исключаем NEW карточки (когда до конца дня < 4 часов)
      query = query.where('state', '!=', 0);
    }

    return query.selectAll().execute();
  }

  /**
   * Получить статистику по курсу
   */
  async getCourseStats(courseId: number): Promise<{
    total: number;
    newCards: number;
    learningCards: number;
    reviewCards: number;
    dueToday: number;
  }> {
    const allCards = await db.selectFrom('cards').where('courseId', '=', courseId).selectAll().execute();

    const now = new Date().toISOString();

    return {
      total: allCards.length,
      newCards: allCards.filter((c) => c.state === 0).length,
      learningCards: allCards.filter((c) => c.state === 1).length,
      reviewCards: allCards.filter((c) => c.state === 2 || c.state === 3).length,
      dueToday: allCards.filter((c) => c.due <= now).length,
    };
  }
}

// Singleton instance
export const cardRepository = new CardRepository();
