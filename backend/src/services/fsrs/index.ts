import { Card as FSRSCard, FSRS, Rating, State, generatorParameters, Grade } from 'ts-fsrs';
import { Card } from '../database/schema';

/**
 * Enum для состояний карточки (синхронизирован с FSRS)
 */
export enum CardState {
  NEW = 0,
  LEARNING = 1,
  REVIEW = 2,
  RELEARNING = 3,
}

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
    elapsed_days: card.elapsedDays,
    scheduled_days: card.scheduledDays,
    learning_steps: card.stepIndex,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state as State,
    last_review: card.lastReview ? new Date(card.lastReview) : undefined,
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
    elapsedDays: fsrsCard.elapsed_days,
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
    enable_fuzz: settings.enableFuzz,
    enable_short_term: true,
    learning_steps: steps.map((m) => `${m}m` as `${number}m`),
    relearning_steps: ['10m'],
  });

  return new FSRS(params);
}

/**
 * Обработка Learning Steps для NEW и LEARNING карточек
 */
function handleLearningSteps(card: Card, rating: Rating, settings: FSRSSettings, now: Date): Partial<Card> {
  const steps = parseLearningSteps(settings.learningSteps);
  const currentStep = card.stepIndex;

  if (rating === Rating.Again) {
    // Возврат к первому шагу
    const nextDue = new Date(now.getTime() + steps[0] * 60 * 1000);
    return {
      stepIndex: 0,
      due: nextDue.toISOString(),
      state: CardState.LEARNING,
      lapses: card.lapses + 1,
      reps: card.reps + 1,
      lastReview: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  }

  if (rating === Rating.Good || rating === Rating.Easy) {
    const nextStepIndex = currentStep + 1;

    if (nextStepIndex >= steps.length) {
      // Завершили все шаги обучения - переводим в REVIEW
      // Используем FSRS для расчета первого интервала в REVIEW
      const fsrs = initializeFSRS(settings);
      const fsrsCard = toFSRSCard({
        ...card,
        state: CardState.REVIEW,
        stepIndex: 0,
      });

      const scheduledCard = fsrs.next(fsrsCard, now, Rating.Good as Grade);
      return fromFSRSCard(scheduledCard.card, card);
    }

    // Переход к следующему шагу
    const nextDue = new Date(now.getTime() + steps[nextStepIndex] * 60 * 1000);
    return {
      stepIndex: nextStepIndex,
      due: nextDue.toISOString(),
      state: CardState.LEARNING,
      reps: card.reps + 1,
      lastReview: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  }

  if (rating === Rating.Hard) {
    // Hard - повторяем текущий шаг
    const nextDue = new Date(now.getTime() + steps[currentStep] * 60 * 1000);
    return {
      due: nextDue.toISOString(),
      reps: card.reps + 1,
      lastReview: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  }

  // Fallback (не должно происходить)
  return {};
}

/**
 * Расчет следующего интервала повторения после ответа пользователя
 */
export function calculateNextReview(card: Card, rating: Rating, settings: FSRSSettings, now: Date): Partial<Card> {
  // Для NEW и LEARNING карточек используем кастомные learning steps
  if (card.state === CardState.NEW || card.state === CardState.LEARNING) {
    return handleLearningSteps(card, rating, settings, now);
  }

  // Для REVIEW и RELEARNING используем FSRS
  if (card.state === CardState.REVIEW || card.state === CardState.RELEARNING) {
    const fsrs = initializeFSRS(settings);
    const fsrsCard = toFSRSCard(card);
    const scheduledCard = fsrs.next(fsrsCard, now, rating as Grade);

    return fromFSRSCard(scheduledCard.card, card);
  }

  // Fallback
  return {};
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
export function initializeNewCard(front: string, back: string, courseId: number, settings: FSRSSettings): Card {
  const now = new Date();
  const steps = parseLearningSteps(settings.learningSteps);

  // Первая карточка сразу готова к изучению
  const firstStepDue = new Date(now.getTime() + steps[0] * 60 * 1000);

  return {
    id: 0, // Will be set by database
    courseId,
    front,
    back,
    due: firstStepDue.toISOString(),
    stability: 0.0,
    difficulty: 5.0,
    elapsedDays: 0,
    scheduledDays: 0,
    reps: 0,
    lapses: 0,
    state: CardState.NEW,
    lastReview: null,
    stepIndex: 0,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}
