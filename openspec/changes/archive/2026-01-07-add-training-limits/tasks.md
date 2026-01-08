# Tasks: Add Training Limits

## Phase 1: Database Schema & Migration (Backend)

- [ ] **1.1** Create migration file `003_add_training_limits.ts`
  - Add `globalNewCardsPerDay` to `settings` table (integer, default 20)
  - Add `globalMaxReviewsPerDay` to `settings` table (integer, default 200)
  - Add `newCardsPerDay` to `courseSettings` table (integer, nullable)
  - Add `maxReviewsPerDay` to `courseSettings` table (integer, nullable)
  - Add `newCardsPerSession` to `courseSettings` table (integer, nullable)
  - Add `maxReviewsPerSession` to `courseSettings` table (integer, nullable)

- [ ] **1.2** Create `dailyProgress` table
  - Fields: id, date, courseId, newCardsStudied, reviewsCompleted, createdAt, updatedAt
  - Add foreign key constraint to courses table
  - Add unique constraint on (date, courseId)
  - Create index on `date`
  - Create index on `courseId`

- [ ] **1.3** Update TypeScript schema definitions
  - Update `SettingsTable` interface with new fields
  - Update `CourseSettingsTable` interface with new fields
  - Create `DailyProgressTable` interface
  - Add types: `DailyProgress`, `NewDailyProgress`, `DailyProgressUpdate`

- [ ] **1.4** Run migration and verify schema
  - Execute migration via `npm run migrate`
  - Verify all columns created
  - Verify default values set

## Phase 2: Backend Services & Repositories

- [ ] **2.1** Create `progressRepository.ts`
  - Method: `getProgress(date: string, courseId: number): Promise<DailyProgress | null>`
  - Method: `getGlobalProgress(date: string): Promise<GlobalProgress>`
  - Method: `create(data: NewDailyProgress): Promise<DailyProgress>`
  - Method: `increment(id: number, field: 'newCardsStudied' | 'reviewsCompleted'): Promise<void>`
  - Method: `cleanup(daysToKeep: number): Promise<number>` (удаление старых записей)

- [ ] **2.2** Create `limitService.ts`
  - Function: `calculateAvailableCards(courseId, sessionMode): Promise<AvailableCardsResult>`
  - Function: `updateProgressAfterReview(cardId, wasNew): Promise<void>`
  - Function: `getDailyStats(): Promise<DailyStats>`
  - Helper: `formatDate(date: Date): string` (YYYY-MM-DD)
  - Helper: `isNewCard(card: Card): boolean`

- [ ] **2.3** Update `settingsRepository.ts`
  - Update `getGlobalSettings()` to return new fields with defaults
  - Update `getEffectiveSettings()` to include all 4 limit fields
  - Add default values for new fields in `FSRSSettings` interface

- [ ] **2.4** Update validation schemas in `schemas/settings.ts`
  - Add validation for `globalNewCardsPerDay` (min: 0, max: 500)
  - Add validation for `globalMaxReviewsPerDay` (min: 0, max: 1000)
  - Add validation for course limit fields (nullable, min: 0)

## Phase 3: Backend API Routes

- [ ] **3.1** Update `routes/training.ts` — GET `/api/courses/:courseId/due-cards`
  - Accept query param `session=true` for session mode
  - Call `limitService.calculateAvailableCards()`
  - Return cards with limit metadata
  - Handle case when limits exhausted (return empty array with metadata)

- [ ] **3.2** Update `routes/training.ts` — POST `/api/training/review`
  - After updating card, call `limitService.updateProgressAfterReview()`
  - Return progress stats in response
  - Handle errors in progress tracking

- [ ] **3.3** Create new route — GET `/api/training/stats`
  - Implement handler calling `limitService.getDailyStats()`
  - Return global and per-course statistics
  - Add route to router in `routes/index.ts`

## Phase 4: Frontend — Settings UI

- [ ] **4.1** Update `SettingsForm.vue` (global settings)
  - Add section "Дневные лимиты (по всем курсам)"
  - Add number input for `globalNewCardsPerDay` (default 20)
  - Add number input for `globalMaxReviewsPerDay` (default 200)
  - Add validation (min: 0)
  - Add help text explaining global limits

- [ ] **4.2** Update `CourseSettingsModal.vue` (course settings)
  - Add section "Дневные лимиты"
  - Add number input for `newCardsPerDay` (placeholder: inherits from global)
  - Add number input for `maxReviewsPerDay` (placeholder: inherits from global)
  - Add section "Сессионные лимиты"
  - Add number input for `newCardsPerSession` (default 10)
  - Add number input for `maxReviewsPerSession` (default 50)
  - Show inherited values from global settings as hints

- [ ] **4.3** Update `shared/api/settings.js`
  - Ensure new fields included in API requests
  - Update TypeScript types if needed

- [ ] **4.4** Update `entities/settings/model/useSettingsStore.js`
  - Add new fields to store state
  - Update fetch/save methods to handle new fields

## Phase 5: Frontend — Training Page Integration

- [ ] **5.1** Update `TrainingPage.vue` — data fetching
  - Add `session=true` query param to API call
  - Store limit metadata from API response
  - Handle case when no cards available (show limits info)

- [ ] **5.2** Update `TrainingPage.vue` — UI display
  - Add session progress indicator (e.g., "15/50 карточек")
  - Add remaining limits display (e.g., "Осталось: 5 новых / 35 повторений")
  - Add visual progress bar for session

- [ ] **5.3** Update `TrainingPage.vue` — session completion
  - Show summary when all cards reviewed
  - Show statistics: "Изучено X новых, Y повторений"
  - Add "Продолжить" button if more cards available today
  - Add "Завершить" button to return to course page

- [ ] **5.4** Update `TrainingPage.vue` — limits reached state
  - Show message "Дневной лимит достигнут"
  - Display current limits and progress
  - Offer to adjust limits (link to settings)

## Phase 6: Frontend — Course Page Enhancement

- [ ] **6.1** Update `CoursePage.vue` — stats display
  - Call `/api/training/stats` on mount
  - Show "Осталось на сегодня: X новых / Y повторений" below course stats
  - Add visual indicator if limits nearly exhausted

- [ ] **6.2** Update "Начать тренировку" button
  - Disable button if daily limits reached (not just dueToday === 0)
  - Update button text to reflect limit state

## Phase 7: Testing & Validation

- [ ] **7.1** Backend unit tests
  - Test `calculateAvailableCards()` with various limit combinations
  - Test `updateProgressAfterReview()` creates/updates records correctly
  - Test limit enforcement edge cases (0 limit, null course settings)

- [ ] **7.2** API integration tests
  - Test GET `/due-cards` respects session limits
  - Test GET `/due-cards` respects course limits
  - Test GET `/due-cards` respects global limits
  - Test POST `/review` increments progress correctly
  - Test GET `/stats` returns accurate data

- [ ] **7.3** Manual E2E testing
  - Create 2 courses with 50+ cards each
  - Set global limit to 30/day
  - Verify limits applied across courses
  - Complete one session, verify stats update
  - Start new session, verify remaining limits
  - Test limit reset on new day (change system date)

## Phase 8: Documentation & Cleanup

- [ ] **8.1** Update `docs/Walkthrough.md`
  - Document new limit system
  - Explain global vs course vs session limits
  - Add examples of limit calculations

- [ ] **8.2** Update `docs/Changelog.md`
  - Add entry for new version
  - List all new features
  - Mention breaking changes if any

- [ ] **8.3** Update `README.md`
  - Add training limits to features list
  - Update data structure documentation

- [ ] **8.4** Code cleanup
  - Remove TODOs related to limit implementation
  - Ensure consistent naming conventions
  - Run linter and fix all issues

## Dependencies

- Phase 2 depends on Phase 1 (DB schema must exist)
- Phase 3 depends on Phase 2 (services must exist)
- Phase 4, 5, 6 can run in parallel after Phase 3 is complete
- Phase 7 depends on all previous phases
- Phase 8 is final

## Notes

- Default values: 20 new/day, 200 reviews/day globally; 10 new/session, 50 reviews/session per course
- Use lazy reset strategy (check date on fetch, no cron job needed)
- Global limits aggregate across all courses
- Null course settings inherit from global
