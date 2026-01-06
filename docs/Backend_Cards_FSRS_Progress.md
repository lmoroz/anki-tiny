# Walkthrough: Backend реализация Cards и FSRS

## Текущий прогресс

### ✅ Завершено

#### 1. Database Schema

**Файлы:**

- [schema.ts](file:///e:/Develop/anki-tiny/backend/src/services/database/schema.ts)
- [migrations.ts](file:///e:/Develop/anki-tiny/backend/src/services/database/migrations.ts)

**Изменения:**

- Добавлены 3 новые таблицы: `cards`, `settings`, `courseSettings`
- Таблица `cards` содержит все FSRS поля: `stability`, `difficulty`, `elapsedDays`, `scheduledDays`, `reps`, `lapses`, `state`, `lastReview`, `stepIndex`
- Созданы индексы для оптимизации запросов: `courseId`, `due`, `state`
- Настроены foreign keys с каскадным удалением

#### 2. FSRS Service

**Файл:** [fsrs/index.ts](file:///e:/Develop/anki-tiny/backend/src/services/fsrs/index.ts)

**Реализовано:**

- Интеграция библиотеки `ts-fsrs`
- Кастомные Learning Steps (первый шаг — 4 часа)
- Логика переходов между состояниями (NEW → LEARNING → REVIEW)
- Обработка LAPSES (забываний)
- Проверка временных ограничений (`canShowNewCards`)
- Инициализация новых карточек с FSRS значениями

#### 3. Validation Schemas

**Файлы:**

- [schemas/card.ts](file:///e:/Develop/anki-tiny/backend/src/schemas/card.ts)
- [schemas/settings.ts](file:///e:/Develop/anki-tiny/backend/src/schemas/settings.ts)

**Создано:**

- `CreateCardSchema` — валидация создания карточки
- `UpdateCardSchema` — валидация обновления
- `ReviewCardSchema` — валидация отправки review (rating)
- `GlobalSettingsSchema` — глобальные настройки с валидацией JSON learning steps
- `CourseSettingsSchema` — индивидуальные настройки курса

#### 4. Repositories

**Файлы:**

- [repositories/cardRepository.ts](file:///e:/Develop/anki-tiny/backend/src/services/repositories/cardRepository.ts)
- [repositories/settingsRepository.ts](file:///e:/Develop/anki-tiny/backend/src/services/repositories/settingsRepository.ts)

**Методы Card Repository:**

- `getCardsByCourseId()` — получить все карточки курса
- `getCardById()` — получить карточку по ID
- `createCard()` — создать карточку с FSRS инициализацией
- `updateCard()` — обновить карточку
- `deleteCard()` — удалить карточку
- `getDueCards()` — получить карточки для повторения (с фильтром NEW)
- `getCourseStats()` — статистика курса (total, new, learning, review, due)

**Методы Settings Repository:**

- `getGlobalSettings()` — глобальные настройки
- `updateGlobalSettings()` — обновление глобальных
- `getCourseSettings()` — настройки конкретного курса
- `updateCourseSettings()` — создание/обновление настроек курса
- `deleteCourseSettings()` — сброс к глобальным
- `getEffectiveSettings()` — получение эффективных настроек (с учетом наследования)

#### 5. API Routes

**Файлы:**

- [routes/cards.ts](file:///e:/Develop/anki-tiny/backend/src/routes/cards.ts)
- [routes/training.ts](file:///e:/Develop/anki-tiny/backend/src/routes/training.ts)
- [routes/settings.ts](file:///e:/Develop/anki-tiny/backend/src/routes/settings.ts)
- [routes/index.ts](file:///e:/Develop/anki-tiny/backend/src/routes/index.ts) (обновлен)

**Cards API:**

- `GET /api/courses/:courseId/cards` — список карточек
- `POST /api/courses/:courseId/cards` — создание
- `GET /api/cards/:id` — получение карточки
- `PUT /api/cards/:id` — обновление
- `DELETE /api/cards/:id` — удаление
- `GET /api/courses/:courseId/stats` — статистика

**Training API:**

- `GET /api/courses/:courseId/due-cards` — карточки для повторения
- `POST /api/training/review` — отправка результата review

**Settings API:**

- `GET /api/settings` — глобальные настройки
- `PUT /api/settings` — обновление глобальных
- `GET /api/courses/:courseId/settings` — настройки курса
- `PUT /api/courses/:courseId/settings` — обновление настроек курса
- `DELETE /api/courses/:courseId/settings` — сброс к глобальным

---

## ⚠️ Проблемы и ошибки TypeScript

### Критические ошибки (требуют исправления)

1. **FSRS Type Compatibility Issue:**
   - `Rating` type из ts-fsrs называется `Grade`
   - Нужно изменить импорты в `fsrs/index.ts` и `training.ts`

2. **Zod enum errorMap:**
   - В `schemas/card.ts` используется неверный синтаксис для errorMap
   - Нужно использовать `{ invalid_type_error: '...' }` вместо `errorMap`

3. **ZodError.errors:**
   - В routes файлах используется `error.errors`, но правильное свойство — `error.issues`

4. **Prettier форматирование:**
   - Множественные ошибки форматирования (extra line breaks)
   - Нужно запустить `npm run format` в backend

### Некритические (warning)

- Неиспользуемые импорты (`NewCard` в cardRepository)
- `any` types в Proxy для db экспорта
- Неиспользуемый параметр `originalCard` в FSRS

---

## 📋 План исправлений

### 1. Исправить FSRS импорты

```typescript
// В fsrs/index.ts и training.ts
import { Grade } from 'ts-fsrs'; // вместо Rating

export function calculateNextReview(card: Card, rating: Grade, ...) {
  // ...
}
```

### 2. Исправить Zod схему

```typescript
// В schemas/card.ts
rating: z.enum(['1', '2', '3', '4'], {
  invalid_type_error: 'Rating must be 1 (Again), 2 (Hard), 3 (Good), or 4 (Easy)',
}),
```

### 3. Исправить ZodError обработку

```typescript
// В всех routes
if (error instanceof ZodError) {
  return res.status(400).json({ error: 'Validation error', details: error.issues });
}
```

### 4. Запустить форматирование

```bash
cd backend
npm run format
```

---

## 🎯 Следующие шаги

1. **Исправить TypeScript ошибки** (5-10 минут)
2. **Протестировать миграции БД** — запустить приложение и проверить создание таблиц
3. **Протестировать API endpoints через Postman/curl**
4. **Frontend интеграция:**
   - Entity layer (Card types, API, Store)
   - Widgets (CardList, CardEditor, QuickAddCard)
   - Pages (CoursePage, TrainingPage, SettingsPage)

---

## 📊 Статистика

- **Новые файлы:** 8
- **Обновленные файлы:** 3
- **Строк кода:** ~1200+
- **API endpoints:** 12
- **Таблицы БД:** 3 (cards, settings, courseSettings)
- **State machine states:** 4 (NEW, LEARNING, REVIEW, RELEARNING)
