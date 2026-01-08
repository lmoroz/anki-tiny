import { db } from './database';
import { Card } from './database/schema';
import { cardRepository } from './repositories/cardRepository';
import { settingsRepository } from './repositories/settingsRepository';
import { progressRepository } from './repositories/progressRepository';

/**
 * Форматировать дату в YYYY-MM-DD для конкретного часового пояса
 * @param date - Date объект
 * @param timezone - IANA timezone (например, 'Asia/Shanghai', 'UTC')
 * @returns строка в формате YYYY-MM-DD
 */
export function formatDate(date: Date, timezone = 'UTC'): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((p) => p.type === 'year')!.value;
  const month = parts.find((p) => p.type === 'month')!.value;
  const day = parts.find((p) => p.type === 'day')!.value;

  return `${year}-${month}-${day}`;
}

/**

 * Проверить, является ли карточка новой
 */
export function isNewCard(state: number): boolean {
  return state === 0; // CardState.NEW
}

/**
 * Результат расчёта доступных карточек
 */
export interface AvailableCardsResult {
  cards: Card[];
  limits: {
    newCardsInSession: number;
    reviewsInSession: number;
    newCardsRemaining: number;
    reviewsRemaining: number;
    globalNewRemaining: number;
    globalReviewsRemaining: number;
  };
  canShowNewCards: boolean;
}

/**
 * Статистика за день
 */
export interface DailyStats {
  today: string;
  courses: Array<{
    courseId: number;
    courseName: string;
    newCardsStudied: number;
    reviewsCompleted: number;
    limits: {
      newCardsPerDay: number;
      maxReviewsPerDay: number;
    };
  }>;
  global: {
    newCardsStudied: number;
    reviewsCompleted: number;
    limits: {
      globalNewCardsPerDay: number;
      globalMaxReviewsPerDay: number;
    };
  };
}

/**
 * Рассчитать доступные карточки с учётом всех уровней лимитов
 */
export async function calculateAvailableCards(courseId: number, sessionMode: boolean): Promise<AvailableCardsResult> {
  // 1. Получаем настройки
  const globalSettings = await settingsRepository.getGlobalSettings();

  // 2. Получаем прогресс за сегодня
  const today = formatDate(new Date());
  const courseProgress = await progressRepository.getProgress(today, courseId);
  const globalProgress = await progressRepository.getGlobalProgress(today);

  // 3. Вычисляем оставшиеся глобальные лимиты
  const globalNewRemaining = Math.max(0, globalSettings.globalNewCardsPerDay - globalProgress.newCardsStudied);
  const globalReviewsRemaining = Math.max(0, globalSettings.globalMaxReviewsPerDay - globalProgress.reviewsCompleted);

  // 4. Получаем настройки курса для лимитов (fallback к дефолтам)
  const courseSettings = await settingsRepository.getCourseSettings(courseId);
  const newCardsPerDay = courseSettings?.newCardsPerDay ?? 20;
  const maxReviewsPerDay = courseSettings?.maxReviewsPerDay ?? 200;
  const newCardsPerSession = courseSettings?.newCardsPerSession ?? 10;
  const maxReviewsPerSession = courseSettings?.maxReviewsPerSession ?? 50;

  // 5. Вычисляем оставшиеся курсовые лимиты
  const courseNewRemaining = Math.max(0, newCardsPerDay - (courseProgress?.newCardsStudied ?? 0));
  const courseReviewsRemaining = Math.max(0, maxReviewsPerDay - (courseProgress?.reviewsCompleted ?? 0));

  // 6. Применяем сессионные лимиты (если запрашивается сессия)
  let newLimit: number;
  let reviewLimit: number;

  if (sessionMode) {
    newLimit = Math.min(newCardsPerSession, courseNewRemaining, globalNewRemaining);
    reviewLimit = Math.min(maxReviewsPerSession, courseReviewsRemaining, globalReviewsRemaining);
  } else {
    newLimit = Math.min(courseNewRemaining, globalNewRemaining);
    reviewLimit = Math.min(courseReviewsRemaining, globalReviewsRemaining);
  }

  // 7. Получаем карточки из БД
  const now = new Date();
  const canShowNew = newLimit > 0;
  const allDueCards = await cardRepository.getDueCards(courseId, now, !canShowNew);

  // 8. Распределяем по типам и применяем лимиты
  const newCards = allDueCards.filter((c) => isNewCard(c.state)).slice(0, newLimit);
  const reviews = allDueCards.filter((c) => !isNewCard(c.state)).slice(0, reviewLimit);

  // 9. Объединяем карточки
  const cards = [...newCards, ...reviews];

  return {
    cards,
    limits: {
      newCardsInSession: newCards.length,
      reviewsInSession: reviews.length,
      newCardsRemaining: courseNewRemaining,
      reviewsRemaining: courseReviewsRemaining,
      globalNewRemaining,
      globalReviewsRemaining,
    },
    canShowNewCards: canShowNew,
  };
}

/**
 * Обновить прогресс после повторения карточки
 * @param cardId - ID карточки
 * @param wasNew - была ли карточка новой
 * @param timezone - IANA timezone для определения "сегодня"
 */
export async function updateProgressAfterReview(cardId: number, wasNew: boolean, timezone = 'UTC'): Promise<void> {
  // 1. Получаем карточку для определения курса
  const card = await cardRepository.getCardById(cardId);
  if (!card) return;

  // 2. Форматируем дату с учетом timezone
  const today = formatDate(new Date(), timezone);

  // 3. Обновляем или создаём запись прогресса
  const progress = await progressRepository.getProgress(today, card.courseId);

  if (progress) {
    // Инкрементируем счётчик
    if (wasNew) await progressRepository.increment(progress.id, 'newCardsStudied');
    else await progressRepository.increment(progress.id, 'reviewsCompleted');
  } else {
    // Создаём новую запись
    await progressRepository.create({
      date: today,
      courseId: card.courseId,
      newCardsStudied: wasNew ? 1 : 0,
      reviewsCompleted: wasNew ? 0 : 1,
    });
  }
}

/**
 * Получить статистику за день
 * @param timezone - IANA timezone (например, 'Asia/Shanghai')
 */
export async function getDailyStats(timezone = 'UTC'): Promise<DailyStats> {
  const today = formatDate(new Date(), timezone);
  const globalSettings = await settingsRepository.getGlobalSettings();
  const globalProgress = await progressRepository.getGlobalProgress(today);

  // Получаем все курсы
  const courses = await db.selectFrom('courses').selectAll().execute();

  // Получаем статистику по каждому курсу
  const courseStats = await Promise.all(
    courses.map(async (course) => {
      const progress = await progressRepository.getProgress(today, course.id);
      const courseSettings = await settingsRepository.getCourseSettings(course.id);

      return {
        courseId: course.id,
        courseName: course.name,
        newCardsStudied: progress?.newCardsStudied ?? 0,
        reviewsCompleted: progress?.reviewsCompleted ?? 0,
        limits: {
          newCardsPerDay: courseSettings?.newCardsPerDay ?? globalSettings.defaultNewCardsPerDay ?? 20,
          maxReviewsPerDay: courseSettings?.maxReviewsPerDay ?? globalSettings.defaultMaxReviewsPerDay ?? 200,
        },
      };
    })
  );

  return {
    today,
    courses: courseStats,
    global: {
      newCardsStudied: globalProgress.newCardsStudied,
      reviewsCompleted: globalProgress.reviewsCompleted,
      limits: {
        globalNewCardsPerDay: globalSettings.globalNewCardsPerDay,
        globalMaxReviewsPerDay: globalSettings.globalMaxReviewsPerDay,
      },
    },
  };
}
