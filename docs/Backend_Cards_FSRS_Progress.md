# Walkthrough: Backend Implementation of Cards and FSRS

## Current Progress

### ✅ Completed

#### 1. Database Schema

**Files:**

- [schema.ts](file:///e:/Develop/anki-tiny/backend/src/services/database/schema.ts)
- [migrations.ts](file:///e:/Develop/anki-tiny/backend/src/services/database/migrations.ts)

**Changes:**

- Added 3 new tables: `cards`, `settings`, `courseSettings`
- `cards` table contains all FSRS fields: `stability`, `difficulty`, `elapsedDays`, `scheduledDays`, `reps`, `lapses`,
  `state`, `lastReview`, `stepIndex`
- Created indices for query optimization: `courseId`, `due`, `state`
- Configured foreign keys with cascade deletion

#### 2. FSRS Service

**File:** [fsrs/index.ts](file:///e:/Develop/anki-tiny/backend/src/services/fsrs/index.ts)

**Implemented:**

- Integration of `ts-fsrs` library
- Custom Learning Steps (first step — 4 hours)
- State transition logic (NEW → LEARNING → REVIEW)
- LAPSES handling (post-lapse behavior)
- Time constraints verification (`canShowNewCards`)
- Initialization of new cards with FSRS values

#### 3. Validation Schemas

**Files:**

- [schemas/card.ts](file:///e:/Develop/anki-tiny/backend/src/schemas/card.ts)
- [schemas/settings.ts](file:///e:/Develop/anki-tiny/backend/src/schemas/settings.ts)

**Created:**

- `CreateCardSchema` — card creation validation
- `UpdateCardSchema` — update validation
- `ReviewCardSchema` — review submission validation (rating)
- `GlobalSettingsSchema` — global settings with JSON learning steps validation
- `CourseSettingsSchema` — individual course settings

#### 4. Repositories

**Files:**

- [repositories/cardRepository.ts](file:///e:/Develop/anki-tiny/backend/src/services/repositories/cardRepository.ts)
- [repositories/settingsRepository.ts](file:///e:/Develop/anki-tiny/backend/src/services/repositories/settingsRepository.ts)

**Card Repository Methods:**

- `getCardsByCourseId()` — get all course cards
- `getCardById()` — get card by ID
- `createCard()` — create card with FSRS initialization
- `updateCard()` — update card
- `deleteCard()` — delete card
- `getDueCards()` — get due cards (with NEW filter)
- `getCourseStats()` — course statistics (total, new, learning, review, due)

**Settings Repository Methods:**

- `getGlobalSettings()` — global settings
- `updateGlobalSettings()` — update global settings
- `getCourseSettings()` — specific course settings
- `updateCourseSettings()` — create/update course settings
- `deleteCourseSettings()` — reset to global
- `getEffectiveSettings()` — get effective settings (considering inheritance)

#### 5. API Routes

**Files:**

- [routes/cards.ts](file:///e:/Develop/anki-tiny/backend/src/routes/cards.ts)
- [routes/training.ts](file:///e:/Develop/anki-tiny/backend/src/routes/training.ts)
- [routes/settings.ts](file:///e:/Develop/anki-tiny/backend/src/routes/settings.ts)
- [routes/index.ts](file:///e:/Develop/anki-tiny/backend/src/routes/index.ts) (updated)

**Cards API:**

- `GET /api/courses/:courseId/cards` — card list
- `POST /api/courses/:courseId/cards` — creation
- `GET /api/cards/:id` — get card
- `PUT /api/cards/:id` — update
- `DELETE /api/cards/:id` — deletion
- `GET /api/courses/:courseId/stats` — statistics

**Training API:**

- `GET /api/courses/:courseId/due-cards` — due cards
- `POST /api/training/review` — submit review result

**Settings API:**

- `GET /api/settings` — global settings
- `PUT /api/settings` — update global
- `GET /api/courses/:courseId/settings` — course settings
- `PUT /api/courses/:courseId/settings` — update course settings
- `DELETE /api/courses/:courseId/settings` — reset to global

---

## ⚠️ TypeScript Issues and Errors

### Critical Errors (Require fixing)

1. **FSRS Type Compatibility Issue:**
   - `Rating` type from ts-fsrs is named `Grade`
   - Need to change imports in `fsrs/index.ts` and `training.ts`

2. **Zod enum errorMap:**
   - Incorrect syntax for errorMap is used in `schemas/card.ts`
   - Need to use `{ invalid_type_error: '...' }` instead of `errorMap`

3. **ZodError.errors:**
   - Routes files use `error.errors`, but correct property is `error.issues`

4. **Prettier formatting:**
   - Multiple formatting errors (extra line breaks)
   - Need to run `npm run format` in backend

### Non-critical (warning)

- Unused imports (`NewCard` in cardRepository)
- `any` types in Proxy for db export
- Unused parameter `originalCard` in FSRS

---

## 📋 Correction Plan

### 1. Fix FSRS imports

```typescript
// In fsrs/index.ts and training.ts
import {Grade} from 'ts-fsrs'; // instead of Rating

export function calculateNextReview(card: Card, rating: Grade, ...) {
  // ...
}
```

### 2. Fix Zod schema

```typescript
// In schemas/card.ts
rating: z.enum(['1', '2', '3', '4'], {
  invalid_type_error: 'Rating must be 1 (Again), 2 (Hard), 3 (Good), or 4 (Easy)',
}),
```

### 3. Fix ZodError handling

```typescript
// In all routes
if (error instanceof ZodError) {
  return res.status(400).json({ error: "Validation error", details: error.issues });
}
```

### 4. Run formatting

```bash
cd backend
npm run format
```

---

## 🎯 Next Steps

1. **Fix TypeScript errors** (5-10 minutes)
2. **Test DB migrations** — run application and verify table creation
3. **Test API endpoints via Postman/curl**
4. **Frontend integration:**
   - Entity layer (Card types, API, Store)
   - Widgets (CardList, CardEditor, QuickAddCard)
   - Pages (CoursePage, TrainingPage, SettingsPage)

---

## 📊 Statistics

- **New files:** 8
- **Updated files:** 3
- **Lines of code:** ~1200+
- **API endpoints:** 12
- **DB tables:** 3 (cards, settings, courseSettings)
- **State machine states:** 4 (NEW, LEARNING, REVIEW, RELEARNING)
