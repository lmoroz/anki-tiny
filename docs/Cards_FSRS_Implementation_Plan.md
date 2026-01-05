# План реализации: Система карточек и FSRS

## Описание задачи

Реализация одной из самых сложных частей приложения Repetitio — системы управления карточками для обучения с использованием алгоритма интервального повторения FSRS (Free Spaced Repetition Scheduler).

### Цели реализации

1. **Backend**: Создать полноценный API для работы с карточками, включая CRUD операции
2. **FSRS Integration**: Интегрировать библиотеку `ts-fsrs` для расчета оптимальных интервалов повторения
3. **Learning Steps**: Реализовать кастомную логику обучения (первый шаг — 4 часа)
4. **Training System**: Создать систему тренировок с отслеживанием прогресса
5. **Settings**: Реализовать глобальные и индивидуальные настройки курсов
6. **Frontend**: Создать UI для управления карточками и прохождения тренировок

---

## Требования к FSRS

> [!IMPORTANT]
> Библиотека `ts-fsrs` требует хранения специфичных полей для каждой карточки.
> Эти поля критически важны для корректной работы алгоритма.

### Обязательные поля FSRS

| Поле            | Тип       | Описание                                           |
|-----------------|-----------|---------------------------------------------------|
| `due`           | Timestamp | Дата и время следующего показа                     |
| `stability`     | Double    | Параметр стабильности памяти (ключевой)            |
| `difficulty`    | Double    | Текущая сложность карты                            |
| `elapsed_days`  | Integer   | Дней с последнего успешного повторения             |
| `scheduled_days`| Integer   | На какой интервал карта была отправлена            |
| `reps`          | Integer   | Общее количество повторений                        |
| `lapses`        | Integer   | Количество забываний (нажатий "Again")             |
| `state`         | Integer   | Состояние: 0=New, 1=Learning, 2=Review, 3=Relearning |
| `last_review`   | Timestamp | Время последнего ответа                            |

---

## Предлагаемые изменения

### Backend: Database Schema

#### [MODIFY] [schema.ts](file:///e:/Develop/anki-tiny/backend/src/services/database/schema.ts)

Добавить интерфейсы для новых таблиц:

```typescript
// Таблица cards
export interface CardsTable {
  id: Generated<number>;
  courseId: number;
  front: string;
  back: string;
  
  // FSRS поля
  due: string;  // ISO timestamp
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: number;  // 0=New, 1=Learning, 2=Review, 3=Relearning
  lastReview: string | null;  // ISO timestamp
  
  // Для Learning Steps
  stepIndex: number;  // Текущий шаг обучения
  
  createdAt: Generated<string>;
  updatedAt: Generated<string>;
}

export type Card = Selectable<CardsTable>;
export type NewCard = Insertable<CardsTable>;
export type CardUpdate = Updateable<CardsTable>;

// Таблица settings
export interface SettingsTable {
  id: Generated<number>;
  trainingStartHour: number;  // 8 по умолчанию
  trainingEndHour: number;    // 22 по умолчанию
  minTimeBeforeEnd: number;   // 4 часа
  notificationsEnabled: number;  // SQLite boolean (0/1)
  learningSteps: string;      // JSON массив, например "[10, 240]" (минуты)
  enableFuzz: number;         // SQLite boolean
  createdAt: Generated<string>;
  updatedAt: Generated<string>;
}

// Таблица course_settings
export interface CourseSettingsTable {
  id: Generated<number>;
  courseId: number;
  trainingStartHour: number | null;
  trainingEndHour: number | null;
  minTimeBeforeEnd: number | null;
  notificationsEnabled: number | null;
  learningSteps: string | null;
  enableFuzz: number | null;
  createdAt: Generated<string>;
  updatedAt: Generated<string>;
}

// Обновить Database interface
export interface Database {
  courses: CoursesTable;
  cards: CardsTable;
  settings: SettingsTable;
  courseSettings: CourseSettingsTable;
}
```

---

#### [NEW] [migrations/002_create_cards_table.sql](file:///e:/Develop/anki-tiny/backend/src/services/database/migrations/002_create_cards_table.sql)

```sql
CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    courseId INTEGER NOT NULL,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    
    -- FSRS поля
    due TEXT NOT NULL,
    stability REAL NOT NULL DEFAULT 0.0,
    difficulty REAL NOT NULL DEFAULT 5.0,
    elapsedDays INTEGER NOT NULL DEFAULT 0,
    scheduledDays INTEGER NOT NULL DEFAULT 0,
    reps INTEGER NOT NULL DEFAULT 0,
    lapses INTEGER NOT NULL DEFAULT 0,
    state INTEGER NOT NULL DEFAULT 0,
    lastReview TEXT,
    stepIndex INTEGER NOT NULL DEFAULT 0,
    
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    
    FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE INDEX idx_cards_courseId ON cards(courseId);
CREATE INDEX idx_cards_due ON cards(due);
CREATE INDEX idx_cards_state ON cards(state);
```

#### [NEW] [migrations/003_create_settings_table.sql](file:///e:/Develop/anki-tiny/backend/src/services/database/migrations/003_create_settings_table.sql)

```sql
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trainingStartHour INTEGER NOT NULL DEFAULT 8,
    trainingEndHour INTEGER NOT NULL DEFAULT 22,
    minTimeBeforeEnd INTEGER NOT NULL DEFAULT 4,
    notificationsEnabled INTEGER NOT NULL DEFAULT 1,
    learningSteps TEXT NOT NULL DEFAULT '[10, 240]',
    enableFuzz INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Вставить дефолтную запись
INSERT INTO settings (id) VALUES (1);
```

#### [NEW] [migrations/004_create_course_settings_table.sql](file:///e:/Develop/anki-tiny/backend/src/services/database/migrations/004_create_course_settings_table.sql)

```sql
CREATE TABLE IF NOT EXISTS courseSettings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    courseId INTEGER NOT NULL UNIQUE,
    trainingStartHour INTEGER,
    trainingEndHour INTEGER,
    minTimeBeforeEnd INTEGER,
    notificationsEnabled INTEGER,
    learningSteps TEXT,
    enableFuzz INTEGER,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    
    FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE INDEX idx_course_settings_courseId ON courseSettings(courseId);
```

---

### Backend: FSRS Service

#### [NEW] [services/fsrs/index.ts](file:///e:/Develop/anki-tiny/backend/src/services/fsrs/index.ts)

Сервис для работы с алгоритмом FSRS:

**Ключевые функции:**

1. **`initializeFSRS(settings)`** — инициализация FSRS с параметрами из настроек
2. **`calculateNextReview(card, rating, settings)`** — расчет следующего интервала повторения
3. **`handleLearningSteps(card, rating, settings)`** — обработка шагов обучения (NEW, LEARNING)
4. **`transitionToReview(card)`** — переход карты в состояние REVIEW
5. **`getDueCards(courseId, currentSettings)`** — получение карт для повторения с учетом времени

**Логика Learning Steps:**

```typescript
// Псевдокод
if (card.state === CardState.NEW || card.state === CardState.LEARNING) {
  const steps = parseSteps(settings.learningSteps); // [10, 240] минут
  
  if (rating === Rating.GOOD || rating === Rating.EASY) {
    card.stepIndex++;
    
    if (card.stepIndex >= steps.length) {
      // Завершили все шаги, переводим в REVIEW
      transitionToReview(card);
    } else {
      // Переходим к следующему шагу
      const nextStepMinutes = steps[card.stepIndex];
      card.due = new Date(Date.now() + nextStepMinutes * 60 * 1000);
      card.state = CardState.LEARNING;
    }
  } else if (rating === Rating.AGAIN) {
    // Возврат к первому шагу
    card.stepIndex = 0;
    card.due = new Date(Date.now() + steps[0] * 60 * 1000);
    card.lapses++;
  }
} else {
  // Card в состоянии REVIEW - используем FSRS
  const fsrs = initializeFSRS(settings);
  const result = fsrs.calculate(card, rating);
  updateCardFromFSRS(card, result);
}
```

---

### Backend: Repositories

#### [NEW] [repositories/cardRepository.ts](file:///e:/Develop/anki-tiny/backend/src/repositories/cardRepository.ts)

CRUD операции для карточек:

- `getCardsByCourseId(courseId: number): Promise<Card[]>`
- `getCardById(id: number): Promise<Card | null>`
- `createCard(data: NewCard): Promise<Card>`
- `updateCard(id: number, data: CardUpdate): Promise<Card>`
- `deleteCard(id: number): Promise<void>`
- `getDueCards(courseId: number, currentTime: Date, settings: Settings): Promise<Card[]>`

#### [NEW] [repositories/settingsRepository.ts](file:///e:/Develop/anki-tiny/backend/src/repositories/settingsRepository.ts)

- `getGlobalSettings(): Promise<Settings>`
- `updateGlobalSettings(data: Partial<Settings>): Promise<Settings>`
- `getCourseSettings(courseId: number): Promise<CourseSettings | null>`
- `updateCourseSettings(courseId: number, data: Partial<CourseSettings>): Promise<CourseSettings>`
- `deleteCourseSettings(courseId: number): Promise<void>`
- `getEffectiveSettings(courseId: number): Promise<Settings>` — возвращает настройки курса или глобальные

---

### Backend: Validation Schemas

#### [NEW] [schemas/card.ts](file:///e:/Develop/anki-tiny/backend/src/schemas/card.ts)

```typescript
import { z } from 'zod';

export const CreateCardSchema = z.object({
  front: z.string().min(1, 'Front is required'),
  back: z.string().min(1, 'Back is required'),
});

export const UpdateCardSchema = z.object({
  front: z.string().min(1).optional(),
  back: z.string().min(1).optional(),
});

export const ReviewCardSchema = z.object({
  cardId: z.number().int().positive(),
  rating: z.enum(['1', '2', '3', '4']), // Again, Hard, Good, Easy
});
```

#### [NEW] [schemas/settings.ts](file:///e:/Develop/anki-tiny/backend/src/schemas/settings.ts)

```typescript
export const GlobalSettingsSchema = z.object({
  trainingStartHour: z.number().int().min(0).max(23).optional(),
  trainingEndHour: z.number().int().min(0).max(23).optional(),
  minTimeBeforeEnd: z.number().int().min(1).max(12).optional(),
  notificationsEnabled: z.boolean().optional(),
  learningSteps: z.string().optional(), // JSON массив
  enableFuzz: z.boolean().optional(),
});

export const CourseSettingsSchema = GlobalSettingsSchema;
```

---

### Backend: API Routes

#### [NEW] [routes/cards.ts](file:///e:/Develop/anki-tiny/backend/src/routes/cards.ts)

- `GET /api/courses/:courseId/cards` — список карточек курса
- `POST /api/courses/:courseId/cards` — создание новой карточки
- `GET /api/cards/:id` — получение карточки по ID
- `PUT /api/cards/:id` — обновление карточки
- `DELETE /api/cards/:id` — удаление карточки

#### [NEW] [routes/training.ts](file:///e:/Develop/anki-tiny/backend/src/routes/training.ts)

- `GET /api/courses/:courseId/due-cards` — получение карточек для повторения
- `POST /api/training/review` — отправка результата повторения (rating)

**Логика `/due-cards`:**

```typescript
// Псевдокод
const settings = await getEffectiveSettings(courseId);
const now = new Date();
const currentHour = now.getHours();

// Проверка времени тренировок
if (currentHour < settings.trainingStartHour || currentHour >= settings.trainingEndHour) {
  return { cards: [], message: 'Outside training hours' };
}

// Проверка "4 часа до конца дня"
const endTime = new Date();
endTime.setHours(settings.trainingEndHour, 0, 0, 0);
const hoursUntilEnd = (endTime.getTime() - now.getTime()) / (1000 * 60 * 60);

if (hoursUntilEnd < settings.minTimeBeforeEnd) {
  // Исключаем NEW карточки, возвращаем только DUE
  const dueCards = await getDueCards(courseId, now, settings, { excludeNew: true });
  return { cards: dueCards, message: 'Too close to end of day for new cards' };
}

// Нормальная ситуация - возвращаем все due карты
const dueCards = await getDueCards(courseId, now, settings);
return { cards: dueCards };
```

#### [NEW] [routes/settings.ts](file:///e:/Develop/anki-tiny/backend/src/routes/settings.ts)

- `GET /api/settings` — получение глобальных настроек
- `PUT /api/settings` — обновление глобальных настроек

#### [NEW] [routes/course-settings.ts](file:///e:/Develop/anki-tiny/backend/src/routes/course-settings.ts)

- `GET /api/courses/:courseId/settings` — получение настроек курса
- `PUT /api/courses/:courseId/settings` — обновление настроек курса
- `DELETE /api/courses/:courseId/settings` — сброс к глобальным настройкам

---

### Frontend: Entity Layer

#### [NEW] [entities/card/model/types.ts](file:///e:/Develop/anki-tiny/frontend/src/entities/card/model/types.ts)

```typescript
export enum CardState {
  NEW = 0,
  LEARNING = 1,
  REVIEW = 2,
  RELEARNING = 3,
}

export enum Rating {
  AGAIN = 1,
  HARD = 2,
  GOOD = 3,
  EASY = 4,
}

export interface Card {
  id: number;
  courseId: number;
  front: string;
  back: string;
  due: string;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: CardState;
  lastReview: string | null;
  stepIndex: number;
  createdAt: string;
  updatedAt: string;
}
```

#### [NEW] [entities/card/api/cardApi.ts](file:///e:/Develop/anki-tiny/frontend/src/entities/card/api/cardApi.ts)

HTTP клиент для работы с cards API:

- `fetchCardsByCourseId(courseId)`
- `createCard(courseId, data)`
- `updateCard(id, data)`
- `deleteCard(id)`

#### [NEW] [entities/card/model/cardStore.ts](file:///e:/Develop/anki-tiny/frontend/src/entities/card/model/cardStore.ts)

Pinia store для управления состоянием карточек.

---

### Frontend: Widgets

#### [NEW] [widgets/card-list/CardList.vue](file:///e:/Develop/anki-tiny/frontend/src/widgets/card-list/CardList.vue)

Компонент для отображения списка карточек:

- Группировка по состоянию (New, Learning, Review)
- Пагинация или виртуальный скроллинг
- Empty state
- Loading state

#### [NEW] [widgets/card-list/CardItem.vue](file:///e:/Develop/anki-tiny/frontend/src/widgets/card-list/CardItem.vue)

Отдельная карточка в списке:

- Отображение front/back (сокращенно)
- Badge со статусом
- Кнопки Edit/Delete

#### [NEW] [widgets/card-editor/CardEditor.vue](file:///e:/Develop/anki-tiny/frontend/src/widgets/card-editor/CardEditor.vue)

Modal для создания/редактирования карточки:

- Textarea для front
- Textarea для back
- Валидация
- Кнопки Save/Cancel

#### [NEW] [widgets/card-editor/QuickAddCard.vue](file:///e:/Develop/anki-tiny/frontend/src/widgets/card-editor/QuickAddCard.vue)

Компактная форма для быстрого добавления карточек:

- Inline форма
- Enter для сохранения
- Автоочистка после добавления

---

### Frontend: Pages

#### [MODIFY] [pages/course/CoursePage.vue](file:///e:/Develop/anki-tiny/frontend/src/pages/course/CoursePage.vue)

Интеграция управления карточками:

- Header с названием курса и статистикой
- QuickAddCard widget
- CardList widget с кнопками управления
- Кнопка "Начать тренировку"
- Кнопка "Настройки курса"

#### [MODIFY] [pages/training/TrainingPage.vue](file:///e:/Develop/anki-tiny/frontend/src/pages/training/TrainingPage.vue)

Интерфейс тренировки:

- Загрузка due cards при старте
- Отображение текущей карточки (front → back при клике)
- Кнопки оценки: Again, Hard, Good, Easy
- Прогресс-бар (X из Y)
- Завершение сессии с поздравлением
- Empty states

#### [MODIFY] [pages/settings/SettingsPage.vue](file:///e:/Develop/anki-tiny/frontend/src/pages/settings/SettingsPage.vue)

Глобальные настройки:

- Time pickers для часов тренировок
- Input для minTimeBeforeEnd
- Toggle для уведомлений
- Input для Learning Steps (JSON массив)
- Toggle для Enable Fuzz

---

## План верификации

### Automated Tests

#### 1. Backend Unit Tests: FSRS Service

**Файл:** `backend/tests/services/fsrs.test.ts`

**Тесты:**

- Расчет интервала для NEW карточки с Learning Steps
- Переход между шагами обучения (LEARNING → REVIEW)
- Обработка LAPSES (Again → reset to step 0)
- Корректность применения enable_fuzz
- Расчет интервала для REVIEW карточки через ts-fsrs

**Команда запуска:**

```bash
cd backend
npm run test -- --testPathPattern=fsrs.test.ts
```

#### 2. Backend Unit Tests: Card Repository

**Файл:** `backend/tests/repositories/cardRepository.test.ts`

**Тесты:**

- Создание карточки с дефолтными FSRS полями
- Получение карточек по courseId
- Обновление FSRS полей после review
- getDueCards с фильтрацией по времени

**Команда запуска:**

```bash
cd backend
npm run test -- --testPathPattern=cardRepository.test.ts
```

#### 3. E2E Tests: Cards CRUD

**Файл:** `tests/e2e/cards.spec.ts` (Playwright)

**Тесты:**

- Создание карточки через Quick Add
- Редактирование карточки через CardEditor
- Удаление карточки с подтверждением
- Отображение списка карточек с группировкой

**Команда запуска:**

```bash
npx playwright test cards.spec.ts
```

#### 4. E2E Tests: Training Flow

**Файл:** `tests/e2e/training.spec.ts`

**Тесты:**

- Загрузка due cards для курса
- Flip карточки (front → back)
- Нажатие кнопок оценки (Good)
- Завершение сессии с поздравлением

**Команда запуска:**

```bash
npx playwright test training.spec.ts
```

---

### Manual Verification

#### 1. Проверка FSRS алгоритма

**Шаги:**

1. Создать курс и добавить несколько карточек
2. Запустить тренировку через UI
3. Ответить "Good" на первую карточку (NEW)
4. Проверить в БД: `SELECT due, state, stepIndex FROM cards WHERE id = X`
   - Ожидаемый результат: `state = 1` (LEARNING), `stepIndex = 1`, `due` через 10 минут
5. Подождать 10 минут (или вручную изменить due в БД на текущее время)
6. Снова открыть тренировку, ответить "Good"
7. Проверить в БД:
   - Ожидаемый результат: `state = 2` (REVIEW), `stepIndex = 2`, `due` рассчитан через FSRS

#### 2. Проверка временных ограничений

**Шаги:**

1. Открыть Settings, установить `trainingEndHour = 18`
2. Изменить системное время на 17:00
3. Создать курс с NEW карточками
4. Попытаться начать тренировку
5. Ожидаемый результат: Новые карточки не предлагаются (до конца дня < 4 часов)
6. Изменить время на 13:00
7. Снова начать тренировку
8. Ожидаемый результат: Новые карточки доступны

#### 3. Проверка индивидуальных настроек курса

**Шаги:**

1. Создать курс
2. Открыть настройки курса, изменить `learningSteps` на `[5, 120]`
3. Добавить карточку и начать тренировку
4. Ответить "Good" на NEW карточку
5. Проверить в БД: `due` должно быть через 5 минут (не 10)

---

## Риски и ограничения

> [!WARNING]
> **Сложность FSRS алгоритма**
> Библиотека `ts-fsrs` требует точного соблюдения контракта данных.
> Неправильное хранение/обновление полей может привести к некорректным расчетам.

> [!WARNING]
> **Временные зоны**
> Необходимо учитывать временную зону пользователя при расчете `trainingStartHour` и `trainingEndHour`.
> Все timestamp в БД хранятся в UTC, преобразование в локальное время должно происходить на frontend.

> [!CAUTION]
> **Миграции БД**
> Добавление новых таблиц требует запуска миграций. Если пользователь установил старую версию,
> необходимо обеспечить совместимость схемы БД.

> [!NOTE]
> **Learning Steps**
> Значения Learning Steps хранятся как JSON string в БД. Необходима валидация при парсинге.

---

## Следующие шаги после реализации

После успешной реализации Cards и FSRS:

1. **Система уведомлений** — интеграция Electron Notification API
2. **Tray Integration** — сворачивание в системный трей
3. **Статистика** — dashboard с прогрессом обучения
4. **Импорт/Экспорт** — совместимость с Anki (опционально)
5. **Медиа в карточках** — поддержка изображений и аудио
