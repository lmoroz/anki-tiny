import { Generated, Insertable, Selectable, Updateable } from 'kysely';

// Таблица courses
export interface CoursesTable {
  id: Generated<number>;
  name: string;
  description: string | null;
  createdAt: Generated<string>;
  updatedAt: Generated<string>;
}

// Типы для работы с курсами
export type Course = Selectable<CoursesTable>;
export type NewCourse = Insertable<CoursesTable>;
export type CourseUpdate = Updateable<CoursesTable>;

// Таблица cards
export interface CardsTable {
  id: Generated<number>;
  courseId: number;
  front: string;
  back: string;

  // FSRS поля
  due: string; // ISO timestamp
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: number; // 0=New, 1=Learning, 2=Review, 3=Relearning
  lastReview: string | null; // ISO timestamp

  // Для Learning Steps
  stepIndex: number; // Текущий шаг обучения

  createdAt: Generated<string>;
  updatedAt: Generated<string>;
}

// Типы для работы с карточками
export type Card = Selectable<CardsTable>;
export type NewCard = Insertable<CardsTable>;
export type CardUpdate = Updateable<CardsTable>;

// Таблица settings (глобальные настройки)
export interface SettingsTable {
  id: Generated<number>;
  trainingStartHour: number; // 8 по умолчанию (DEPRECATED: use trainingStartTime)
  trainingEndHour: number; // 22 по умолчанию (DEPRECATED: use trainingEndTime)
  trainingStartTime: number; // Minutes from midnight (0-1439), default: 480 (8:00)
  trainingEndTime: number; // Minutes from midnight (0-1439), default: 1320 (22:00)
  minTimeBeforeEnd: number; // 4 часа
  notificationsEnabled: number; // SQLite boolean (0/1)
  learningSteps: string; // JSON массив, например "[10, 240]" (минуты)
  enableFuzz: number; // SQLite boolean (0/1)
  createdAt: Generated<string>;
  updatedAt: Generated<string>;
}

// Типы для работы с настройками
export type Settings = Selectable<SettingsTable>;
export type NewSettings = Insertable<SettingsTable>;
export type SettingsUpdate = Updateable<SettingsTable>;

// Таблица courseSettings (индивидуальные настройки курса)
export interface CourseSettingsTable {
  id: Generated<number>;
  courseId: number;
  trainingStartHour: number | null; // DEPRECATED: use trainingStartTime
  trainingEndHour: number | null; // DEPRECATED: use trainingEndTime
  trainingStartTime: number | null; // Minutes from midnight (0-1439)
  trainingEndTime: number | null; // Minutes from midnight (0-1439)
  minTimeBeforeEnd: number | null;
  notificationsEnabled: number | null;
  learningSteps: string | null;
  enableFuzz: number | null;
  createdAt: Generated<string>;
  updatedAt: Generated<string>;
}

// Типы для работы с настройками курса
export type CourseSettings = Selectable<CourseSettingsTable>;
export type NewCourseSettings = Insertable<CourseSettingsTable>;
export type CourseSettingsUpdate = Updateable<CourseSettingsTable>;

// Интерфейс всей базы данных
export interface Database {
  courses: CoursesTable;
  cards: CardsTable;
  settings: SettingsTable;
  courseSettings: CourseSettingsTable;
}
