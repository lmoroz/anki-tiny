# Design: Training Limits System

## Architecture Overview

Система лимитов состоит из трёх компонентов:

1. **Settings Layer** — хранение и управление лимитами
2. **Progress Tracking** — отслеживание прогресса за день
3. **Limit Enforcement** — применение лимитов при выборке карточек

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (TrainingPage, Settings)                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  API Layer (training.ts)                                    │
│  - GET /api/courses/:id/due-cards (with limits)             │
│  - POST /api/training/review (update progress)              │
│  - GET /api/training/stats (daily stats)                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Business Logic (limitService.ts)                           │
│  - calculateAvailableCards()                                │
│  - updateDailyProgress()                                    │
│  - resetDailyLimits()                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
┌──────────────────┐   ┌────────────────────┐
│  settingsRepo    │   │  progressRepo      │
│  - get limits    │   │  - track progress  │
└──────────────────┘   └────────────────────┘
```

---

## Data Model

### 1. Settings Extensions

#### Global Settings (`settings` table)

```typescript
interface Settings {
  // ... existing fields
  globalNewCardsPerDay: number; // default: 20
  globalMaxReviewsPerDay: number; // default: 200
}
```

#### Course Settings (`courseSettings` table)

```typescript
interface CourseSettings {
  // ... existing fields
  newCardsPerDay: number | null; // default: 20
  maxReviewsPerDay: number | null; // default: 200
  newCardsPerSession: number | null; // default: 10
  maxReviewsPerSession: number | null; // default: 50
}
```

### 2. Daily Progress Tracking

**Новая таблица: `dailyProgress`**

```sql
CREATE TABLE dailyProgress
(
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    date             TEXT    NOT NULL, -- YYYY-MM-DD format
    courseId         INTEGER NOT NULL,
    newCardsStudied  INTEGER DEFAULT 0,
    reviewsCompleted INTEGER DEFAULT 0,
    createdAt        TEXT    NOT NULL,
    updatedAt        TEXT    NOT NULL,
    FOREIGN KEY (courseId) REFERENCES courses (id) ON DELETE CASCADE,
    UNIQUE (date, courseId)
);

CREATE INDEX idx_dailyProgress_date ON dailyProgress (date);
CREATE INDEX idx_dailyProgress_courseId ON dailyProgress (courseId);
```

---

## Business Logic

### 1. Limit Calculation Algorithm

**Функция: `calculateAvailableCards(courseId: number, sessionMode: boolean)`**

```typescript
interface AvailableCards {
  newCards: Card[];
  reviews: Card[];
  limits: {
    newCardsAvailable: number; // Сколько можно показать новых
    reviewsAvailable: number; // Сколько можно показать повторений
    newCardsRemaining: number; // Осталось на сегодня (курс)
    reviewsRemaining: number; // Осталось на сегодня (курс)
    globalNewRemaining: number; // Осталось на сегодня (глобально)
    globalReviewsRemaining: number; // Осталось на сегодня (глобально)
  };
}
```

**Алгоритм:**

```typescript
function calculateAvailableCards(courseId: number, sessionMode: boolean): AvailableCards {
  // 1. Получаем настройки
  const globalSettings = await settingsRepo.getGlobalSettings();
  const courseSettings = await settingsRepo.getEffectiveSettings(courseId);

  // 2. Получаем прогресс за сегодня
  const today = formatDate(new Date());
  const courseProgress = await progressRepo.getProgress(today, courseId);
  const globalProgress = await progressRepo.getGlobalProgress(today);

  // 3. Вычисляем оставшиеся глобальные лимиты
  const globalNewRemaining = globalSettings.globalNewCardsPerDay - globalProgress.newCardsStudied;
  const globalReviewsRemaining = globalSettings.globalMaxReviewsPerDay - globalProgress.reviewsCompleted;

  // 4. Вычисляем оставшиеся курсовые лимиты
  const courseNewRemaining = courseSettings.newCardsPerDay - courseProgress.newCardsStudied;
  const courseReviewsRemaining = courseSettings.maxReviewsPerDay - courseProgress.reviewsCompleted;

  // 5. Применяем сессионные лимиты (если запрашивается сессия)
  let newLimit, reviewLimit;

  if (sessionMode) {
    newLimit = Math.min(courseSettings.newCardsPerSession, courseNewRemaining, globalNewRemaining);

    reviewLimit = Math.min(courseSettings.maxReviewsPerSession, courseReviewsRemaining, globalReviewsRemaining);
  } else {
    newLimit = Math.min(courseNewRemaining, globalNewRemaining);
    reviewLimit = Math.min(courseReviewsRemaining, globalReviewsRemaining);
  }

  // 6. Получаем карточки из БД
  const allDueCards = await cardRepo.getDueCards(courseId, new Date());

  // 7. Распределяем по типам
  const newCards = allDueCards.filter((c) => c.state === CardState.NEW).slice(0, newLimit);
  const reviews = allDueCards.filter((c) => c.state !== CardState.NEW).slice(0, reviewLimit);

  return {
    newCards,
    reviews,
    limits: {
      newCardsAvailable: newCards.length,
      reviewsAvailable: reviews.length,
      newCardsRemaining: courseNewRemaining,
      reviewsRemaining: courseReviewsRemaining,
      globalNewRemaining,
      globalReviewsRemaining,
    },
  };
}
```

### 2. Progress Update Algorithm

**Функция: `updateDailyProgress(cardId: number, isNew: boolean)`**

```typescript
async function updateDailyProgress(cardId: number, isNew: boolean): Promise<void> {
  // 1. Получаем карточку для определения курса
  const card = await cardRepo.getCardById(cardId);

  // 2. Форматируем дату
  const today = formatDate(new Date());

  // 3. Обновляем или создаём запись прогресса
  const progress = await progressRepo.getProgress(today, card.courseId);

  if (progress) {
    // Инкрементируем счётчик
    if (isNew) {
      await progressRepo.increment(progress.id, "newCardsStudied");
    } else {
      await progressRepo.increment(progress.id, "reviewsCompleted");
    }
  } else {
    // Создаём новую запись
    await progressRepo.create({
      date: today,
      courseId: card.courseId,
      newCardsStudied: isNew ? 1 : 0,
      reviewsCompleted: isNew ? 0 : 1,
    });
  }
}
```

### 3. Daily Reset Mechanism

**Два подхода:**

**Вариант A: Lazy Reset (рекомендуется)**

- При запросе карточек проверяем, соответствует ли дата в `dailyProgress` сегодняшнему дню
- Если нет — считаем лимиты сброшенными автоматически
- Преимущество: не нужен cron/scheduler

**Вариант B: Active Reset**

- Background task в Electron main process
- Каждый день в `trainingStartTime` очищает старые записи
- Преимущество: явная очистка данных

**Рекомендуем Вариант A** для простоты.

---

## API Design

### 1. GET /api/courses/:courseId/due-cards

**Query Parameters:**

- `session=true` — запрос сессии (применяет сессионные лимиты)

**Response:**

```typescript
{
  cards: Card[],           // Все карточки (new + reviews)
    canShowNewCards
:
  boolean,
    limits
:
  {
    newCardsInSession: number,      // Новых карточек в этой выборке
      reviewsInSession
  :
    number,       // Повторений в этой выборке
      newCardsRemaining
  :
    number,      // Осталось на сегодня (курс)
      reviewsRemaining
  :
    number,       // Осталось на сегодня (курс)
      globalNewRemaining
  :
    number,     // Осталось глобально
      globalReviewsRemaining
  :
    number  // Осталось глобально
  }
}
```

### 2. POST /api/training/review

**Request:**

```typescript
{
  cardId: number,
    rating
:
  '1' | '2' | '3' | '4'
}
```

**Response:**

```typescript
{
  card: Card,           // обновлённая карточка
    progress
:
  {
    newCardsToday: number,      // Сколько новых изучено сегодня (курс)
      reviewsToday
  :
    number,       // Сколько повторений сегодня (курс)
      globalNewToday
  :
    number,     // Сколько новых глобально
      globalReviewsToday
  :
    number  // Сколько повторений глобально
  }
}
```

### 3. GET /api/training/stats (новый endpoint)

**Response:**

```typescript
{
  today: string,  // YYYY-MM-DD
    courses
:
  Array<{
    courseId: number,
    courseName: string,
    newCardsStudied: number,
    reviewsCompleted: number,
    limits: {
      newCardsPerDay: number,
      maxReviewsPerDay: number
    }
  }>,
    global
:
  {
    newCardsStudied: number,
      reviewsCompleted
  :
    number,
      limits
  :
    {
      globalNewCardsPerDay: number,
        globalMaxReviewsPerDay
    :
      number
    }
  }
}
```

---

## Database Migration

**Migration file: `003_add_training_limits.ts`**

```typescript
export async function up(db: Kysely<Database>): Promise<void> {
  // 1. Добавляем глобальные лимиты
  await db.schema
    .alterTable("settings")
    .addColumn("globalNewCardsPerDay", "integer", (col) => col.notNull().defaultTo(20))
    .addColumn("globalMaxReviewsPerDay", "integer", (col) => col.notNull().defaultTo(200))
    .execute();

  // 2. Добавляем курсовые лимиты
  await db.schema
    .alterTable("courseSettings")
    .addColumn("newCardsPerDay", "integer")
    .addColumn("maxReviewsPerDay", "integer")
    .addColumn("newCardsPerSession", "integer")
    .addColumn("maxReviewsPerSession", "integer")
    .execute();

  // 3. Создаём таблицу прогресса
  await db.schema
    .createTable("dailyProgress")
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("date", "text", (col) => col.notNull())
    .addColumn("courseId", "integer", (col) => col.notNull().references("courses.id").onDelete("cascade"))
    .addColumn("newCardsStudied", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("reviewsCompleted", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("createdAt", "text", (col) => col.notNull())
    .addColumn("updatedAt", "text", (col) => col.notNull())
    .execute();

  // 4. Индексы
  await db.schema.createIndex("idx_dailyProgress_date").on("dailyProgress").column("date").execute();
  await db.schema.createIndex("idx_dailyProgress_courseId").on("dailyProgress").column("courseId").execute();

  // 5. Уникальный индекс
  await db.schema
    .createIndex("idx_dailyProgress_unique")
    .on("dailyProgress")
    .columns(["date", "courseId"])
    .unique()
    .execute();
}
```

---

## Frontend Integration

### 1. Settings Form Updates

**GlobalSettingsForm.vue:**

```vue
<template>
  <!-- Existing fields -->

  <div class="settings-section">
    <h3>Дневные лимиты (по всем курсам)</h3>

    <FormField label="Новых карточек в день">
      <Input v-model.number="settings.globalNewCardsPerDay" type="number" min="0" />
    </FormField>

    <FormField label="Повторений в день">
      <Input v-model.number="settings.globalMaxReviewsPerDay" type="number" min="0" />
    </FormField>
  </div>
</template>
```

**CourseSettingsModal.vue:**

```vue
<template>
  <!-- Existing fields -->

  <div class="settings-section">
    <h3>Дневные лимиты</h3>

    <FormField label="Новых карточек в день" :hint="`По умолчанию: ${globalSettings.newCardsPerDay}`">
      <Input v-model.number="settings.newCardsPerDay" type="number" min="0" placeholder="Наследуется" />
    </FormField>

    <FormField label="Повторений в день" :hint="`По умолчанию: ${globalSettings.maxReviewsPerDay}`">
      <Input v-model.number="settings.maxReviewsPerDay" type="number" min="0" placeholder="Наследуется" />
    </FormField>
  </div>

  <div class="settings-section">
    <h3>Сессионные лимиты</h3>

    <FormField label="Новых карточек за сессию">
      <Input v-model.number="settings.newCardsPerSession" type="number" min="0" placeholder="10" />
    </FormField>

    <FormField label="Повторений за сессию">
      <Input v-model.number="settings.maxReviewsPerSession" type="number" min="0" placeholder="50" />
    </FormField>
  </div>
</template>
```

### 2. Training Page Updates

**TrainingPage.vue:**

```vue
<template>
  <div class="training-page">
    <!-- Progress bar -->
    <div class="session-progress">
      <span>Сессия: {{ currentIndex + 1 }} / {{ totalCards }}</span>
      <ProgressBar :value="(currentIndex / totalCards) * 100" />
    </div>

    <!-- Limits info -->
    <div class="limits-info">
      <span>Осталось сегодня: {{ limits.newCardsRemaining }} новых / {{ limits.reviewsRemaining }} повторений</span>
    </div>

    <!-- Card display -->
    <Card v-if="currentCard">
      <!-- ... -->
    </Card>

    <!-- Session complete -->
    <div v-if="sessionComplete" class="session-complete">
      <h2>Сессия завершена!</h2>
      <p>Изучено: {{ stats.newInSession }} новых, {{ stats.reviewsInSession }} повторений</p>

      <Button v-if="hasMoreCards" @click="startNewSession"> Продолжить тренировку </Button>
      <Button @click="handleBack"> Завершить </Button>
    </div>
  </div>
</template>
```

---

## Edge Cases & Error Handling

### 1. Лимит достигнут в середине сессии

**Проблема:** Пользователь начал сессию, но глобальный лимит исчерпан другим курсом

**Решение:**

- Карточки, полученные в начале сессии, **остаются валидными**
- Следующая сессия учтёт новые лимиты

### 2. Изменение лимитов в процессе дня

**Проблема:** Пользователь изменил лимит с 20 на 50 после того, как уже изучил 20 карточек

**Решение:**

- Изменение применяется **немедленно**
- Доступно ещё 30 карточек (50 - 20)

### 3. Midnight boundary

**Проблема:** Что считать "следующим днём" — полночь или `trainingStartTime`?

**Решение:**

- Используем **календарный день** (YYYY-MM-DD в UTC)
- Прогресс сбрасывается в 00:00 по местному времени
- `trainingStartTime` влияет только на показ новых карточек

### 4. Несколько курсов одновременно

**Проблема:** Два курса борются за глобальный лимит

**Решение:**

- **First-come, first-served**: кто первый начал сессию, тот и получает карточки
- Альтернатива (для будущего): приоритеты курсов

---

## Performance Considerations

1. **Индексация** — добавлены индексы на `date` и `courseId` в `dailyProgress`
2. **Кеширование** — глобальные настройки можно закешировать (меняются редко)
3. **Batch updates** — прогресс обновляется после каждого review (не батчится)
4. **Old data cleanup** — периодически удалять записи `dailyProgress` старше 30 дней

---

## Testing Strategy

1. **Unit tests:**
   - `calculateAvailableCards()` с различными комбинациями лимитов
   - `updateDailyProgress()` с созданием/обновлением записей

2. **Integration tests:**
   - GET `/due-cards` с применением всех уровней лимитов
   - POST `/review` с обновлением прогресса
   - Проверка сброса лимитов на следующий день

3. **Manual testing:**
   - Сценарий с несколькими курсами
   - Достижение глобального лимита
   - Изменение лимитов в UI

---

## Future Enhancements (не в этом PR)

1. **Course priorities** — приоритеты курсов для распределения глобальных лимитов
2. **Smart pacing** — автоматический подбор оптимальных лимитов на основе истории
3. **Weekly limits** — недельные лимиты вместо дневных
4. **Unlimited mode** — опция "без лимитов" через специальное значение (-1)
5. **Progress charts** — визуализация прогресса за неделю/месяц
