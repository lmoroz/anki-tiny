import { type Card as FSRSCard, FSRS, Rating, State, generatorParameters, type Grade, createEmptyCard } from 'ts-fsrs';
import type { Card } from '../database/schema.js';

/**
 * Enum для состояний карточки (синхронизирован с FSRS)
 */
export const CardState = {
  NEW: 0,
  LEARNING: 1,
  REVIEW: 2,
  RELEARNING: 3,
};

/**
 * Настройки для FSRS алгоритма
 */
export interface FSRSSettings {
  trainingStartTime: number; // Minutes from midnight (0-1439)
  trainingEndTime: number; // Minutes from midnight (0-1439)
  minTimeBeforeEnd: number; // Hours
  notificationsEnabled: boolean;
  learningSteps: string; // JSON массив, например "[10, 240]" (минуты)
  enableFuzz: boolean;
  requestRetention: number; // 0.70-1.00, default: 0.9
}

/**
 * Парсинг learning steps из JSON строки
 */
function parseLearningSteps(stepsJson: string): number[] {
  try {
    const steps = JSON.parse(stepsJson);
    if (Array.isArray(steps) && steps.every((s) => typeof s === 'number' && s > 0)) {
      return steps;
    }
  } catch {
    // ignore
  }
  // Дефолт: 10 минут, 4 часа (240 минут)
  return [10, 240];
}

/**
 * Преобразование карточки из БД в FSRS Card
 */
function toFSRSCard(card: Card): FSRSCard {
  return {
    due: new Date(card.due),
    stability: card.stability,
    difficulty: card.difficulty,
    scheduled_days: card.scheduledDays,
    learning_steps: card.stepIndex,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state as State,
    last_review: card.lastReview ? new Date(card.lastReview) : undefined,
    elapsed_days: 0,
  };
}

/**
 * Обновление карточки БД из FSRS Card
 */
function fromFSRSCard(fsrsCard: FSRSCard, _originalCard: Card): Partial<Card> {
  return {
    due: fsrsCard.due.toISOString(),
    stability: fsrsCard.stability,
    difficulty: fsrsCard.difficulty,
    scheduledDays: fsrsCard.scheduled_days,
    stepIndex: fsrsCard.learning_steps,
    reps: fsrsCard.reps,
    lapses: fsrsCard.lapses,
    state: fsrsCard.state,
    lastReview: fsrsCard.last_review ? fsrsCard.last_review.toISOString() : null,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Инициализация FSRS с параметрами
 */
function initializeFSRS(settings: FSRSSettings): FSRS {
  const steps = parseLearningSteps(settings.learningSteps);

  const params = generatorParameters({
    request_retention: settings.requestRetention,
    enable_fuzz: settings.enableFuzz,
    enable_short_term: true,
    learning_steps: steps.map((m) => `${m}m` as `${number}m`),
    relearning_steps: ['10m'],
  });

  return new FSRS(params);
}

/**
 * Расчет следующего интервала повторения после ответа пользователя
 */
export function calculateNextReview(card: Card, rating: Rating, settings: FSRSSettings, now: Date): Partial<Card> {
  const fsrs = initializeFSRS(settings);
  const fsrsCard = toFSRSCard(card);
  const scheduledCard = fsrs.next(fsrsCard, now, rating as Grade);

  return fromFSRSCard(scheduledCard.card, card);
}

/**
 * Проверка, можно ли предлагать новые карточки
 * (до конца дня должно оставаться минимум minTimeBeforeEnd часов)
 */
export function canShowNewCards(settings: FSRSSettings, now: Date): boolean {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Проверка времени тренировок
  if (currentMinutes < settings.trainingStartTime || currentMinutes >= settings.trainingEndTime) return false;

  // Проверка времени до конца дня
  const minutesUntilEnd = settings.trainingEndTime - currentMinutes;
  const hoursUntilEnd = minutesUntilEnd / 60;

  return hoursUntilEnd >= settings.minTimeBeforeEnd;
}

/**
 * Инициализация новой карточки с дефолтными FSRS значениями
 */
export function initializeNewCard(front: string, back: string, courseId: number): Card {
  const now = new Date();
  // const fsrs = initializeFSRS(settings);
  const card: FSRSCard = createEmptyCard(new Date());

  return {
    id: 0, // Will be set by database
    courseId,
    front,
    back,
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    scheduledDays: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: CardState.NEW,
    lastReview: null,
    stepIndex: 0,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}
