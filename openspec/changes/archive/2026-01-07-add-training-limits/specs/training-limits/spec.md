# Spec: Training Limits

## Overview

**Training Limits** — система многоуровневых ограничений (лимитов) на количество карточек в тренировочных сессиях.
Предотвращает перегрузку пользователя и обеспечивает управляемый процесс обучения.

## Context

Система интервального повторения эффективна только при разумной дозировке нагрузки. Без лимитов пользователь может
столкнуться с сотнями накопленных карточек, что приведёт к когнитивной перегрузке и выгоранию.

Лимиты применяются на четырёх уровнях:

1. **Глобальные дневные** — по всем курсам за день
2. **Курсовые дневные** — для конкретного курса за день
3. **Сессионные** — за одну тренировочную сессию
4. **Временные** — учёт времени дня (уже реализовано в `settings-global-management`)

## ADDED Requirements

### Requirement: Global Daily Limits SHALL Aggregate Across All Courses

**Priority:** MUST  
**Rationale:** Предотвращение перегрузки при изучении нескольких курсов одновременно

#### Scenario: User Studies Multiple Courses

**GIVEN** пользователь имеет глобальный лимит `globalNewCardsPerDay = 30`  
**AND** пользователь изучил 20 новых карточек из Курса A  
**WHEN** пользователь начинает тренировку в Курсе B  
**THEN** система ДОЛЖНА предложить не более 10 новых карточек (30 - 20 = 10)

#### Scenario: Global Limit Reached

**GIVEN** глобальный лимит `globalNewCardsPerDay = 20`  
**AND** пользователь уже изучил 20 новых карточек сегодня (любые курсы)  
**WHEN** пользователь запрашивает карточки в любом курсе  
**THEN** система НЕ ДОЛЖНА предлагать новые карточки  
**AND** система МОЖЕТ предлагать карточки на повторение (reviews)

---

### Requirement: Course Daily Limits SHALL Override and Constrain Global Limits

**Priority:** MUST  
**Rationale:** Пользователь может хотеть ограничить конкретный курс сильнее, чем глобально

#### Scenario: Course Limit Lower Than Global

**GIVEN** глобальный лимит `globalNewCardsPerDay = 50`  
**AND** курсовой лимит `newCardsPerDay = 10`  
**AND** сегодня из этого курса не изучено ни одной карточки  
**WHEN** пользователь начинает тренировку  
**THEN** система ДОЛЖНА предложить не более 10 новых карточек (минимум из двух)

#### Scenario: Course Limit Inheritance

**GIVEN** курсовой лимит `newCardsPerDay = NULL` (не установлен)  
**AND** глобальный лимит `globalNewCardsPerDay = 20`  
**WHEN** система вычисляет доступные карточки  
**THEN** система ДОЛЖНА использовать глобальное значение 20 как курсовой лимит

---

### Requirement: Session Limits SHALL Partition Daily Limits Into Manageable Chunks

**Priority:** MUST  
**Rationale:** Одна сессия не должна истощать весь дневной лимит

#### Scenario: Session Limit Smaller Than Remaining Daily Limit

**GIVEN** курсовой дневной лимит `newCardsPerDay = 20`  
**AND** сессионный лимит `newCardsPerSession = 10`  
**AND** сегодня из курса изучено 5 новых карточек (осталось 15)  
**WHEN** пользователь начинает новую сессию  
**THEN** система ДОЛЖНА предложить не более 10 новых карточек

#### Scenario: Remaining Daily Limit Smaller Than Session Limit

**GIVEN** сессионный лимит `newCardsPerSession = 10`  
**AND** дневной лимит `newCardsPerDay = 20`  
**AND** сегодня уже изучено 17 карточек (осталось 3)  
**WHEN** пользователь начинает сессию  
**THEN** система ДОЛЖНА предложить не более 3 новых карточек

---

### Requirement: Daily Progress SHALL Be Tracked Per Course and Globally

**Priority:** MUST  
**Rationale:** Необходимо знать, сколько карточек изучено, чтобы применить лимиты

#### Scenario: Progress Increments After Each Review

**GIVEN** пользователь начал тренировку курса A  
**AND** текущий прогресс: `newCardsStudied = 5`, `reviewsCompleted = 10`  
**WHEN** пользователь повторяет новую карточку (state = NEW) с rating "Good"  
**THEN** `newCardsStudied` ДОЛЖНО увеличиться до 6  
**AND** глобальный счётчик новых карточек ДОЛЖЕН увеличиться на 1

#### Scenario: Progress Persists Across Sessions

**GIVEN** пользователь изучил 10 карточек в первой сессии  
**WHEN** пользователь закрывает приложение и открывает снова в тот же день  
**AND** начинает новую сессию  
**THEN** система ДОЛЖНА помнить, что уже изучено 10 карточек  
**AND** оставшийся лимит ДОЛЖЕН быть уменьшен соответственно

---

### Requirement: Daily Limits SHALL Reset Based on Training Start Time

**Priority:** MUST  
**Rationale:** "Новый день" для тренировок начинается не в полночь, а в `trainingStartTime`

#### Scenario: Limit Reset After Training Start Time

**GIVEN** пользователь изучил 20 новых карточек вчера  
**AND** `trainingStartTime = 480` (08:00)  
**AND** текущее время: сегодня 08:30  
**WHEN** пользователь запрашивает карточки  
**THEN** система ДОЛЖНА считать это новым днём  
**AND** лимиты ДОЛЖНЫ быть сброшены  
**AND** доступны все карточки в пределах дневного лимита

#### Scenario: Same Day Before Training Start Time

**GIVEN** пользователь изучал карточки вчера в 21:00  
**AND** `trainingStartTime = 480` (08:00)  
**AND** текущее время: сегодня 06:00 (до trainingStartTime)  
**WHEN** пользователь запрашивает карточки  
**THEN** система ДОЛЖНА считать это продолжением вчерашнего дня  
**AND** использовать вчерашний прогресс

#### Scenario: App Reopened After Training Start Time

**GIVEN** приложение было закрыто вчера в 20:00  
**AND** пользователь изучил 15 карточек вчера  
**AND** `trainingStartTime = 480` (08:00)  
**AND** приложение открыто today в 14:00 (после сегодняшнего 08:00)  
**WHEN** пользователь запрашивает карточки  
**THEN** система ДОЛЖНА определить, что это новый день  
**AND** лимиты ДОЛЖНЫ быть сброшены

#### Scenario: Progress Stored With Timestamp

**GIVEN** пользователь изучает карточки  
**WHEN** система сохраняет прогресс в `dailyProgress`  
**THEN** ДОЛЖНО сохраняться поле `updatedAt` с точным временем (ISO timestamp)  
**AND** при проверке "нового дня" система сравнивает `updatedAt` с последним `trainingStartTime`

#### Scenario: Determination of New Day Algorithm

**GIVEN** система проверяет, является ли запрос "новым днём"  
**WHEN** вычисляется логика сброса  
**THEN** алгоритм ДОЛЖЕН быть:

1. Получить последний `updatedAt` из `dailyProgress` для курса
2. Вычислить последний прошедший `trainingStartTime`:
   - Если сейчас >= `trainingStartTime` сегодня → `trainingStartTime` сегодня
   - Если сейчас < `trainingStartTime` сегодня → `trainingStartTime` вчера
3. Если `updatedAt` < последний `trainingStartTime` → это новый день, сбросить лимиты
4. Иначе → продолжение текущего дня, использовать существующий прогресс

---

### Requirement: API SHALL Return Limit Metadata With Batched Cards

**Priority:** MUST  
**Rationale:** Frontend должен знать, почему получил N карточек, а не M

#### Scenario: Limits Metadata in Response

**GIVEN** пользователь запрашивает карточки для тренировки  
**WHEN** API возвращает ответ  
**THEN** ответ ДОЛЖЕН содержать поля:

- `newCardsInSession: number` — сколько новых карточек в этой выборке
- `reviewsInSession: number` — сколько повторений в выборке
- `newCardsRemaining: number` — осталось новых на сегодня (курс)
- `reviewsRemaining: number` — осталось повторений на сегодня (курс)
- `globalNewRemaining: number` — осталось новых глобально
- `globalReviewsRemaining: number` — осталось повторений глобально

#### Scenario: Empty Result With Metadata

**GIVEN** все лимиты исчерпаны  
**WHEN** пользователь запрашивает карточки  
**THEN** API ДОЛЖЕН вернуть `cards: []` (пустой массив)  
**AND** метаданные ДОЛЖНЫ показывать `newCardsRemaining: 0`, `reviewsRemaining: 0`

---

### Requirement: UI SHALL Display Remaining Limits to User

**Priority:** MUST  
**Rationale:** Прозрачность мотивирует и помогает планировать обучение

#### Scenario: Limits Displayed on Course Page

**GIVEN** пользователь находится на странице курса  
**WHEN** страница загружается  
**THEN** UI ДОЛЖЕН показывать текст вида: "Осталось на сегодня: 15 новых / 120 повторений"

#### Scenario: Session Progress During Training

**GIVEN** пользователь в процессе тренировки  
**AND** сессионный лимит 50 карточек  
**AND** пользователь повторил 23 карточки  
**WHEN** UI обновляется  
**THEN** ДОЛЖЕН отображаться прогресс сессии: "23 / 50 карточек"

---

### Requirement: Settings UI SHALL Allow Configuring All Limit Types

**Priority:** MUST  
**Rationale:** Пользователь должен иметь полный контроль над лимитами

#### Scenario: Global Limits in Settings Page

**GIVEN** пользователь открывает глобальные настройки  
**WHEN** раздел "Дневные лимиты" отображается  
**THEN** ДОЛЖНЫ быть поля:

- "Новых карточек в день (по всем курсам)" — число, default 20
- "Повторений в день (по всем курсам)" — число, default 200

#### Scenario: Course Limits in Course Settings Modal

**GIVEN** пользователь открывает настройки курса  
**WHEN** разделы лимитов отображаются  
**THEN** ДОЛЖНЫ быть поля:

- **Дневные лимиты:**
  - "Новых карточек в день" — nullable, placeholder показывает глобальное значение
  - "Повторений в день" — nullable, placeholder показывает глобальное значение
- **Сессионные лимиты:**
  - "Новых карточек за сессию" — число, default 10
  - "Повторений за сессию" — число, default 50

---

### Requirement: System SHALL Handle Edge Cases Gracefully

**Priority:** MUST  
**Rationale:** Предотвращение неожиданного поведения

#### Scenario: Zero Limit Blocks All Cards

**GIVEN** курсовой лимит `newCardsPerDay = 0`  
**WHEN** система вычисляет доступные карточки  
**THEN** система НЕ ДОЛЖНА предлагать новые карточки  
**BUT** МОЖЕТ предлагать повторения (если их лимит > 0)

#### Scenario: Limit Changed Mid-Day Takes Effect Immediately

**GIVEN** дневной лимит был 20, пользователь изучил 15 карточек  
**WHEN** пользователь увеличивает лимит до 50  
**THEN** следующая сессия ДОЛЖНА учесть новый лимит  
**AND** доступно ещё 35 карточек (50 - 15)

#### Scenario: Multiple Concurrent Sessions (Same Course)

**GIVEN** пользователь открыл два окна приложения (edge case)  
**AND** начал тренировку в обоих  
**WHEN** оба окна отправляют review одновременно  
**THEN** система ДОЛЖНА корректно инкрементировать прогресс без race conditions  
**AND** оба окна ДОЛЖНЫ видеть обновлённый прогресс после следующего запроса

---

## Data Model

```typescript
// Глобальные настройки
interface GlobalSettings {
  globalNewCardsPerDay: number; // default: 20
  globalMaxReviewsPerDay: number; // default: 200
}

// Курсовые настройки
interface CourseSettings {
  newCardsPerDay: number | null; // default: наследуется от global
  maxReviewsPerDay: number | null; // default: наследуется от global
  newCardsPerSession: number | null; // default: 10
  maxReviewsPerSession: number | null; // default: 50
}

// Дневной прогресс
interface DailyProgress {
  id: number;
  date: string; // YYYY-MM-DD
  courseId: number;
  newCardsStudied: number; // сколько новых изучено
  reviewsCompleted: number; // сколько повторений выполнено
  createdAt: string;
  updatedAt: string;
}
```

## API Contracts

### GET /api/courses/:courseId/due-cards?session=true

**Response:**

```json
{
  "cards": [
    /* Card[] */
  ],
  "canShowNewCards": true,
  "limits": {
    "newCardsInSession": 10,
    "reviewsInSession": 40,
    "newCardsRemaining": 15,
    "reviewsRemaining": 160,
    "globalNewRemaining": 18,
    "globalReviewsRemaining": 175
  }
}
```

### POST /api/training/review

**Response:**

```json
{
  "card": {
    /* updated Card */
  },
  "progress": {
    "newCardsToday": 11,
    "reviewsToday": 41,
    "globalNewToday": 23,
    "globalReviewsToday": 89
  }
}
```

### GET /api/training/stats

**Response:**

```json
{
  "today": "2026-01-07",
  "courses": [
    {
      "courseId": 1,
      "courseName": "Spanish",
      "newCardsStudied": 10,
      "reviewsCompleted": 25,
      "limits": {
        "newCardsPerDay": 20,
        "maxReviewsPerDay": 100
      }
    }
  ],
  "global": {
    "newCardsStudied": 23,
    "reviewsCompleted": 89,
    "limits": {
      "globalNewCardsPerDay": 50,
      "globalMaxReviewsPerDay": 200
    }
  }
}
```

## Related Specs

- **Extends:** `settings-global-management` — adds global limit fields
- **Extends:** `settings-course-management` — adds course limit fields
- **Uses:** `course-ui` — displays limit info on course page
- **Uses:** training page (not yet spec'd) — enforces limits during training

## Success Metrics

- User can complete a training session without feeling overwhelmed (subjective)
- Daily limits prevent accumulation of 100+ cards in one session
- Multiple courses share global limits fairly
- Settings are intuitive and discoverable
