# Changelog

All notable changes to the Repetitio project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.4.10] - 2026-01-08 21:22

### Added

#### Feature: Course Statistics on Home Page

Добавлена минимизированная статистика в подвал карточек курсов на главной странице приложения для быстрого
обзора состояния обучения.

- **Backend Implementation**:
    - **cardRepository.ts** — новый метод `getAllCoursesStats()`:
        - Возвращает `Map<courseId, {total, newCards, lastTraining}>`
        - Одним запросом получает все карточки и группирует статистику по курсам
        - Эффективное вычисление даты последней тренировки (max `lastReview` по курсу)
    - **courses.ts** — расширен эндпоинт `GET /api/courses`:
        - Теперь возвращает курсы вместе со статистикой: `{...course, stats: {total, newCards, lastTraining}}`
        - Автоматически добавляет пустую статистику для курсов без карточек

- **Frontend Implementation**:
    - **CourseCard.vue** — обновлен footer карточки курса:
        - Показывает количество карточек с правильным склонением (`карточка/карточки/карточек`)
        - Показывает количество новых карточек (если есть) с иконкой `bi-plus-circle`
        - Показывает дату последней тренировки в формате:
            - "сегодня" / "вчера" для недавних тренировок
            - "N дней назад" для прошедшей недели
            - "дд мес" для более старых дат
        - Fallback: если статистики нет, показывает дату обновления курса (как раньше)
    - **Стилизация**:
        - Новая секция `.course-stats` с flexbox-лейаутом
        - Элементы `.stat-item` с иконками Bootstrap Icons
        - Специальное выделение для новых карточек (`.stat-new`) цветом `--color-primary`
        - Адаптивная сетка с `flex-wrap` и gap 12px

### Changed

- **API Contract**: `GET /api/courses` теперь всегда возвращает объект `stats` для каждого курса
- **CourseCard.vue**: footer теперь отображает статистику вместо или вместе с датой обновления

### Technical Details

- **Files Modified**: 3
    - Backend (2): `cardRepository.ts`, `courses.ts`
    - Frontend (1): `CourseCard.vue`

- **Data Flow**:

    ```text
    Frontend (HomePage) → GET /api/courses → Backend:
      ├→ courseRepository.findAll()
      ├→ cardRepository.getAllCoursesStats()
      └→ merge courses + stats
    ```

- **Performance**: Одним запросом получаем всю статистику для всех курсов (оптимально)

- **User Experience**:
    - ✅ Быстрый обзор состояния каждого курса без перехода на страницу курса
    - ✅ Визуальное выделение новых карточек для привлечения внимания
    - ✅ Понятная информация о последней тренировке ("сегодня", "вчера", "3 дня назад")
    - ✅ Правильное склонение русских слов ("карточка", "карточки", "карточек")


## [0.4.9] - 2026-01-08 15:50

### Changed

#### UI: Training Page Complete Redesign (Manual Changes)

- **TrainingPage.vue — Полная переработка интерфейса тренировок**
  - Реализован новый дизайн карточек с анимациями переворота
  - Добавлены кнопки оценки ответа: "Снова" (danger), "Сложно" (secondary), "Хорошо" (primary), "Легко" (success)
  - Добавлены state-индикаторы: loading, session complete, empty state
  - Добавлен счетчик лимитов сессии (badge-стили для new/review карточек)
  - Улучшена структура компонента: card-content, card-front/back, flip-hint
  - Добавлена кнопка возврата к курсу при завершении сессии
  - Styling: CSS variables integration, smooth transitions, responsive design

#### UI: Button Component Extensions

- **Button.vue — Расширение функциональности**
  - Добавлен размер `xs` (4px/8px padding, text-body-xs-size)
  - Добавлен вариант `success` (green theme с тенями)
  - Добавлен вариант `ghost` для вторичных кнопок (прозрачный фон, border)
  - Улучшены тени для всех вариантов: `box-shadow: 0 10px 20px -5px` (более глубокие)
  - Все размеры теперь используют CSS-переменные (`--text-body-*-size`)

#### Backend: Data Model Simplification

- **Removed `elapsedDays` field from Card schema**
  - `backend/src/services/database/schema.ts` — удалено поле из таблицы `cards`
  - `backend/src/services/fsrs/index.ts` — удалено из FSRS-логики
  - `backend/src/services/repositories/cardRepository.ts` — удалено из репозитория
  - `backend/src/routes/cards.ts` — удалено из API-маршрутов
  - `backend/src/routes/training.ts` — удалено из training API
  
- **Frontend Card Type Updated**
  - `frontend/src/shared/types/card.ts` — удалено `elapsedDays` из интерфейса `Card`
  - Упрощена типизация, убран избыточный параметр FSRS

### Added

- **Global Styles for Training UI**
  - `.badge` styles (new/review с цветами)
  - `.empty-state`, `.loading-state`, `.complete-state`
  - `.answer-buttons`, `.flip-hint`, `.card-label`, `.card-text`
  - Spinner animation (`@keyframes spin`)

### Technical Details

- **Files Modified**: 10
  - Backend (5): `cards.ts`, `training.ts`, `schema.ts`, `fsrs/index.ts`, `cardRepository.ts`  
  - Frontend (5): `styles.css`, `SettingsPage.vue`, `TrainingPage.vue`, `card.ts`, `Button.vue`

- **User Experience**:
  - ✅ Полностью переработанный UI тренировок с карточками
  - ✅ Визуальная обратная связь (flip hint, card states)
  - ✅ Расширенные варианты кнопок для разных контекстов
  - ✅ Упрощенная модель данных (меньше избыточных полей)

## [0.4.8] - 2026-01-08 03:57

### Added

#### Feature: Training Limits System (4-Level Limits)

Implemented comprehensive training limits system with global, course-level, and session-based constraints to prevent user overload and enable controlled learning.

- **Backend Implementation**:
  - **Database Migration 006**: Added `dailyProgress` table and limit fields to `settings`/`courseSettings`
  - **Database Migration 007**: Added default course limit fields to `settings` table
  - **New Repositories**: `progressRepository.ts` for daily progress tracking
  - **New Services**: `limitService.ts` with limit calculation and enforcement logic
  - **API Enhancements**:
    - `GET /api/courses/:courseId/due-cards?session=true` — returns cards with limit metadata
    - `POST /api/training/review` — updates daily progress
    - `GET /api/training/stats` — retrieves daily statistics per course and globally
  - **Validation Schemas**: Added Zod schemas for all limit fields in `settings.ts`

- **Frontend Implementation**:
  - **API Layer**: Created `src/shared/api/training.js` with centralized training endpoints
  - **Pinia Store**: Created `src/entities/training/model/useTrainingStore.js` for session state management
  - **TrainingPage.vue**: Integrated session limits, progress display, and completion handling
  - **CoursePage.vue**: Added daily stats widget showing remaining limits
  - **SettingsForm.vue**: Added UI for configuring:
    - Global daily limits (shared across all courses)
    - Default course limits (fallbacks for courses without custom settings)
    - Course-specific daily limits (per-course overrides)
    - Session limits (per-training-session caps)

- **Limit Hierarchy** (from highest to lowest priority):
  1. **Global Daily Limits**: `globalNewCardsPerDay`, `globalMaxReviewsPerDay` (aggregate across all courses)
  2. **Course Daily Limits**: `newCardsPerDay`, `maxReviewsPerDay` (per-course, inherits from defaults if null)
  3. **Session Limits**: `newCardsPerSession`, `maxReviewsPerSession` (per-training-session)
  4. **Daily Progress Tracking**: Persisted in `dailyProgress` table, resets based on `trainingStartTime`

- **Default Values**:
  - Global daily: 20 new cards, 200 reviews (total across all courses)
  - Default course daily: 20 new cards, 200 reviews (per course)
  - Default session: 10 new cards, 50 reviews (per session)

### Changed

- **Settings Architecture**: Refactored to support 4-level limit system
- **Training Flow**: Cards are now fetched with session awareness and limit enforcement
- **Progress Tracking**: Daily progress persists across app restarts and resets at `trainingStartTime`

### Fixed

- **Schema Validation**: Fixed missing Zod schemas causing limit fields to be lost on save
- **Default Fallbacks**: Updated `limitService.ts` to use global defaults when course settings are null
- **Migration 007**: Split column additions into separate statements for SQLite compatibility

### Technical Details

- **Files Created**: 4
  - `backend/src/services/limitService.ts`
  - `backend/src/services/repositories/progressRepository.ts`
  - `frontend/src/shared/api/training.js`
  - `frontend/src/entities/training/model/useTrainingStore.js`

- **Files Modified**: 19 (schemas, migrations, repositories, API routes, UI components)

- **OpenSpec Status**:
  - ✅ Change `add-training-limits` archived as `2026-01-07-add-training-limits`
  - ✅ Spec `training-limits` created (9 requirements)
  - ✅ Specs `settings-global-management` and `settings-course-management` updated
  - ✅ All specs validated with `--strict` mode

- **Architecture Improvements**:
  - Proper separation of concerns: API layer → Store → Components
  - No direct axios calls in Vue components
  - Centralized business logic in `limitService.ts`
  - Efficient progress tracking with compound indexes

## [0.4.7] - 2026-01-07 23:49

### Added

#### OpenSpec: Training Limits Proposal

Created comprehensive OpenSpec proposal for implementing four-tier training limits system to prevent user overload and
enable controlled learning process.

- **OpenSpec Change Created**: `add-training-limits`
    - Proposal for multi-level limit system (global daily, course daily, session, time-based)
    - Motivation: current implementation returns ALL due cards without limits (potential 100+ cards overload)
    - Solution: 4-tier limit system with inheritance and progress tracking

- **Proposal Structure** (`openspec/changes/add-training-limits/`)
    - **proposal.md** (8.1 KB)
        - Problem: overload risk, no control, multi-course issues, no new/review distinction
        - Solution: global daily limits (aggregate), course daily limits (per-course), session limits (per session)
        - User value: controlled load, burnout prevention, multi-course fairness, Anki compatibility
        - Success criteria: 6 points including trainingStartTime-based reset logic
    - **design.md** (19.7 KB)
        - Architecture: Settings Layer + Progress Tracking + Limit Enforcement
        - Data model: `dailyProgress` table (date, courseId, newCardsStudied, reviewsCompleted)
        - Business logic: `calculateAvailableCards()` algorithm with multi-tier min() operations
        - API design: GET `/due-cards?session=true`, POST `/review`, GET `/stats` (new)
        - Daily reset mechanism: lazy reset based on trainingStartTime (NOT midnight)
        - New day algorithm: compare `updatedAt` with last `trainingStartTime` occurrence
    - **tasks.md** (9.2 KB, 60+ tasks in 8 phases)
        - Phase 1: Database schema & migration (4 tasks)
        - Phase 2: Backend services & repositories (4 tasks: progressRepo, limitService)
        - Phase 3: Backend API routes (3 tasks: update `/due-cards`, `/review`, add `/stats`)
        - Phase 4: Frontend settings UI (4 tasks: global + course limits)
        - Phase 5: Frontend training page (4 tasks: session progress, limits display)
        - Phase 6: Frontend course page (2 tasks: stats display, button state)
        - Phase 7: Testing & validation (3 tasks: unit, integration, E2E)
        - Phase 8: Documentation & cleanup (4 tasks)
    - **specs/training-limits/spec.md** (NEW spec, 15.4 KB)
        - 8 requirements with SHALL/MUST keywords
        - Global daily limits aggregate across all courses (2 scenarios)
        - Course daily limits override and constrain global (2 scenarios)
        - Session limits partition daily limits (2 scenarios)
        - Daily progress tracked per course and globally (2 scenarios)
        - **Daily limits reset based on trainingStartTime** (5 scenarios)
        - API returns limit metadata (2 scenarios)
        - UI displays remaining limits (2 scenarios)
        - Settings UI configures all limit types (2 scenarios)
        - Edge cases handled gracefully (3 scenarios)
    - **specs/settings-global-management/spec.md** (delta, 2.9 KB)
        - ADDED: Global Settings SHALL Include Daily Training Limits
        - 3 scenarios: database storage, API access, validation
    - **specs/settings-course-management/spec.md** (delta, 4.4 KB)
        - ADDED: Course Settings SHALL Include Per-Course Training Limits
        - 7 scenarios: database, null inheritance, API, UI with placeholders, validation

- **Key Features Documented**
    - **Four Limit Levels**:
        - Global daily: `globalNewCardsPerDay` (20), `globalMaxReviewsPerDay` (200)
        - Course daily: `newCardsPerDay` (null=inherit), `maxReviewsPerDay` (null=inherit)
        - Session: `newCardsPerSession` (10), `maxReviewsPerSession` (50)
        - Time-based: uses existing `trainingStartTime`/`trainingEndTime` from settings
    - **Progress Tracking**:
        - New table `dailyProgress` (date, courseId, newCardsStudied, reviewsCompleted)
        - Tracks per-course and global progress
        - Persists across app restarts
    - **trainingStartTime-Based Reset** (KEY FEATURE):
        - "New day" starts at `trainingStartTime` (e.g., 08:00), NOT midnight
        - Algorithm: compare last `updatedAt` with most recent `trainingStartTime`
        - If user studies at 02:00 (before 08:00) → continues previous day
        - If app reopened after 08:00 → automatic reset
        - Advantages: matches real sleep/wake cycle, no background processes needed
    - **Limit Calculation**:
        - Formula: `availableCards = min(sessionLimit, courseRemaining, globalRemaining)`
        - Applied separately for new cards and reviews
        - First-come first-served between courses
    - **API Metadata**:
        - Returns: `newCardsInSession`, `reviewsInSession`, `*Remaining` counts
        - Frontend knows exact limits and progress

- **Default Values**
    - Global: 20 new/day, 200 reviews/day (across all courses)
    - Course: inherit from global (null), or custom override
    - Session: 10 new, 50 reviews (per single training session)

- **User Adjustments During Design**
    - ✅ Confirmed pропорциональное распределение between courses (simple approach)
    - ✅ Confirmed UI подсказки о лимитах (transparency)
    - ✅ CRITICAL: Changed reset logic from midnight to `trainingStartTime`-based
        - Reason: better matches user's actual day cycle
        - Implementation: lazy check on each request, no cron needed
        - Edge case: 02:00 study session continues previous day until 08:00

### Technical Details

- **OpenSpec Validation**: ✅ Passed `npx @fission-ai/openspec validate add-training-limits --strict`
- **Change Status**: 0/60+ tasks (proposal stage, ready for user review and approval)
- **Files Created**: 6
    - `openspec/changes/add-training-limits/proposal.md`
    - `openspec/changes/add-training-limits/design.md`
    - `openspec/changes/add-training-limits/tasks.md`
    - `openspec/changes/add-training-limits/specs/training-limits/spec.md` (NEW spec)
    - `openspec/changes/add-training-limits/specs/settings-global-management/spec.md` (delta)
    - `openspec/changes/add-training-limits/specs/settings-course-management/spec.md` (delta)
- **No Code Changes**: Pure planning/proposal phase
- **Complexity**: High (60+ tasks, 8 phases, new table, new service layer)
- **Estimated Effort**: 8-12 hours full implementation

### Architecture Highlights

```
Frontend (TrainingPage)
  ↓ GET /courses/:id/due-cards?session=true
API Layer (training.ts)
  ↓ calculateAvailableCards()
limitService
  ├→ progressRepo (dailyProgress table)
  ├→ settingsRepo (effective settings with inheritance)
  └→ isNewTrainingDay() (trainingStartTime-based)
```

### Next Steps

- User review and approval of proposal
- Implementation via `/openspec-apply add-training-limits` after approval
- New spec `training-limits` will be created upon archiving
- Extensions to `settings-global-management` and `settings-course-management` specs

## [0.4.7] - 2026-01-07 23:10

### Added

#### Feature: Custom Dialogs and Notifications System

Implemented custom UI components to replace native `alert()` and `confirm()` dialogs, providing a consistent design
system integration and better user experience.

- **Toast Notifications** (`vue3-toastify`)
    - Global configuration in `main.js` with auto-theme support
    - Position: top-right, autoClose: 3000ms
    - Custom CSS variables integration (`--toastify-color-success`, `--toastify-color-error`, etc.)
    - Usage: `toast.success()`, `toast.error()`
    - Replaced 4 `alert()` usages across SettingsPage.vue and HomePage.vue

- **Custom ConfirmDialog Component** (`shared/ui/ConfirmDialog.vue`)
    - Modal dialog with backdrop and animations (fadeIn/slideIn, 300ms ease)
    - Props: `title`, `message`, `confirmText`, `cancelText`
    - Styled with project CSS variables (`--color-bg-modal`, `--color-text-primary`, etc.)
    - Closes on: backdrop click, Escape key, button clicks
    - Accessibility: `role="dialog"`, `aria-modal="true"`, keyboard navigation

- **useConfirm Composable** (`shared/lib/useConfirm.js`)
    - Promise-based API: `const {confirm} = useConfirm(); const result = await confirm(message | options)`
    - Returns: Promise<boolean> (true = confirmed, false = cancelled)
    - Dynamic mounting/unmounting of dialog instances
    - Supports simple string messages and advanced options (custom title, button texts)
    - Replaced 5 `confirm()` usages across 3 components

### Changed

- **Migration from Native Dialogs**
    - `SettingsPage.vue`: 2 alerts → toasts (success/error)
    - `HomePage.vue`: 2 alerts → toasts, 1 confirm → custom dialog with options
    - `CourseSettingsModal.vue`: 1 confirm → custom dialog
    - `CoursePage.vue`: 3 confirms → custom dialogs (simple + advanced with custom buttons)

- **Styling Integration**
    - Added toast color variables to `styles.css`
    - All components auto-adapt to light/dark theme via CSS variables
    - Consistent button styles (`.btn-primary`, `.btn-secondary`)

### Technical Details

- **Files Created**: 2
    - `frontend/src/shared/ui/ConfirmDialog.vue` (177 lines)
    - `frontend/src/shared/lib/useConfirm.js` (41 lines)

- **Files Modified**: 5
    - `frontend/src/app/main.js` — vue3-toastify initialization
    - `frontend/src/app/assets/css/styles.css` — toast CSS variables
    - `frontend/src/pages/settings/SettingsPage.vue` — toast integration
    - `frontend/src/pages/home/HomePage.vue` — toast + useConfirm integration
    - `frontend/src/widgets/course-settings-modal/CourseSettingsModal.vue` — useConfirm integration
    - `frontend/src/pages/course/CoursePage.vue` — useConfirm integration (3 dialogs)

- **Code Quality**:
    - ✅ Lint passed (0 errors)
    - ✅ All system dialogs replaced (verified via grep)
    - ✅ Consistent coding style maintained

- **User Experience**:
    - ✅ Non-blocking notifications (no UI freeze)
    - ✅ Smooth animations and transitions
    - ✅ Theme-aware styling
    - ✅ Keyboard navigation support
    - ✅ Accessible dialogs (ARIA attributes, Escape key)

- **OpenSpec Status**:
    - Change: `replace-dialogs`
    - Tasks completed: 48/53 (Phases 1-3, 5.1 fully done)
    - Remaining: 4.2 (Theme testing), 5.2 (Walkthrough update), focus trap implementation
    - Total implementation time: ~2 hours

### Notes

- All async methods now use `await` for confirm dialogs
- Custom dialogs support both simple (string) and advanced (options object) usage patterns
- No breaking changes to existing functionality
- Legacy `alert()` and `confirm()` fully removed from codebase

## [0.4.6] - 2026-01-07 22:15

### Added

#### OpenSpec: Replace System Dialogs Proposal

- **OpenSpec Change Created**: `replace-dialogs`
    - Comprehensive proposal for replacing native `alert()` and `confirm()` dialogs with custom UI components
    - Motivation: native dialogs block UI, lack customization, don't match design system, are hard to test

- **Proposal Structure** (`openspec/changes/replace-dialogs/`)
    - **proposal.md** (3.9 KB)
        - Problem: 4 issues with system dialogs (inconsistent UX, blocking behavior, limited customization, testing)
        - Solution: vue3-toastify for alerts + custom ConfirmDialog for confirmations
        - Current usages documented: 4× `alert()`, 5× `confirm()`
        - Benefits: consistent styling, theme support, better accessibility, testability
    - **design.md** (17.5 KB)
        - Architecture: Mermaid diagram showing flow (toast vs confirm)
        - Toast setup: global configuration in `main.ts`, theme: 'auto', 3s autoClose
        - ConfirmDialog component: 20+ props, animations (fadeIn/slideIn 300ms), backdrop support
        - useConfirm composable: Promise-based API, dynamic mounting, cleanup after close
        - Migration strategy: 3 phases (setup, replace alert, replace confirm)
        - Migration tables: 4 files for alert(), 5 files for confirm() with line numbers and code examples
    - **tasks.md** (9.2 KB, 5 phases, 15+ subtasks)
        - Phase 1: Setup Components (configure toast, create ConfirmDialog, create useConfirm)
        - Phase 2: Replace alert() (SettingsPage.vue, HomePage.vue)
        - Phase 3: Replace confirm() (CourseSettingsModal.vue, HomePage.vue, CoursePage.vue)
        - Phase 4: Enhancement & Accessibility (ARIA, focus trap, Escape key, theme testing)
        - Phase 5: Documentation & Cleanup (lint, remove legacy code)
    - **specs/ui-notifications/spec.md** (NEW spec, 13.9 KB)
        - 5 requirements with SHALL keywords
        - Toast Notifications: 3 scenarios (success, error, dark theme)
        - Confirm Dialog: 6 scenarios (basic, advanced, backdrop close, Escape, light/dark theme)
        - Accessibility: 3 scenarios (ARIA, focus trap, keyboard navigation)
        - API Integration: 2 requirements (global toast config, useConfirm composable)

- **Key Features Documented**
    - **vue3-toastify** (already installed in package.json)
        - Position: top-right
        - AutoClose: 3000ms
        - Theme: auto (adapts to prefers-color-scheme)
        - Usage: `toast.success()`, `toast.error()`
    - **ConfirmDialog.vue**
        - Props: title, message, confirmText, cancelText, resolve, close
        - Animations: fadeIn (backdrop), slideIn (content), 300ms ease
        - Styling: CSS variables from design system (`--color-background`, `--color-text`)
        - Closes on: backdrop click, Escape key, button click
    - **useConfirm() composable**
        - API: `const {confirm} = useConfirm(); const result = await confirm('message' | options)`
        - Returns: Promise<boolean> (true = confirmed, false = cancelled)
        - Dynamic mounting: creates/destroys DOM container on each call
        - Cleanup: removes VNode and container after close

- **Migration Plan**
    - **alert() replacements (4 places)**:
        - `SettingsPage.vue:48` → `toast.success('Глобальные настройки сохранены!')`
        - `SettingsPage.vue:50` → `toast.error('Ошибка сохранения: ' + error.message)`
        - `HomePage.vue:40` → `toast.error('Ошибка при удалении курса...')`
        - `HomePage.vue:58` → `toast.error('Ошибка при сохранении курса...')`
    - **confirm() replacements (5 places)**:
        - `CourseSettingsModal.vue:81` → `await useConfirm().confirm('Сбросить настройки к глобальным?')`
        - `HomePage.vue:34` → `await useConfirm().confirm({title: 'Удаление курса', ...})`
        - `CoursePage.vue:117` → `await useConfirm().confirm('Удалить карточку?')`
        - `CoursePage.vue:142` → `await useConfirm().confirm({title: 'Удаление карточек', ...})`
        - `CoursePage.vue:156` → `await useConfirm().confirm({title: 'Удаление всех карточек', ...})`

### Technical Details

- **OpenSpec Validation**: ✅ Passed `npx @fission-ai/openspec validate replace-dialogs --strict`
- **Change Status**: 0/15+ tasks (proposal stage, ready for user review and approval)
- **Files Created**: 4
    - `openspec/changes/replace-dialogs/proposal.md`
    - `openspec/changes/replace-dialogs/design.md`
    - `openspec/changes/replace-dialogs/tasks.md`
    - `openspec/changes/replace-dialogs/specs/ui-notifications/spec.md` (NEW spec)
- **No Code Changes Yet**: Pure planning/proposal phase
- **User Formatting**: Applied code style fixes (indentation, line wrapping) to all OpenSpec documents

### Next Steps

- User review and approval of proposal
- Implementation via `/openspec-apply` workflow after approval
- New spec `ui-notifications` will be created upon archiving

## [0.4.6] - 2026-01-07 21:32

### Added

#### Feature: Batch Card Delete

- **Selection Mode UI**
    - Custom checkbox component (`CardCheckbox.vue`) with gradient styling on selection
    - Selection mode toggle button in card list header (desktop & mobile)
    - Visual feedback: selected cards have 0.6 opacity
    - Cards don't flip when clicked in selection mode (clicks toggle selection instead)
    - "Delete Selected (N)" button (disabled when N=0)
    - "Cancel" button to exit selection mode
    - Checkbox positioned in top-right corner (replaces Edit/Delete buttons in selection mode)

- **Delete All Cards**
    - "Clear" button in card list header (red/danger variant)
    - Confirmation dialog with warning message
    - Single operation to delete all cards in a course

- **Backend API**
    - `DELETE /api/courses/:courseId/cards/batch` — batch delete endpoint
        - Request body: `{ cardIds: number[] }`
        - Validation: min 1, max 100 cards per batch
        - Transactional deletion (all or nothing)
        - Returns `{ success: true, deletedCount: number }`
    - `DELETE /api/courses/:courseId/cards` — delete all cards endpoint
        - Deletes all cards for specified course
        - Returns deleted count
    - Zod validation schema: `BatchDeleteSchema` with limits enforcement

- **Frontend Implementation**
    - `CardCheckbox.vue` component (20x20px, custom design)
        - Gradient background when checked: `linear-gradient(135deg, var(--color-primary), var(--color-accent))`
        - ARIA labels for accessibility
        - Keyboard navigation support (Space key toggle)
        - Dark theme compatible
    - `CardItem.vue` enhancements
        - New props: `selectionMode`, `selected`
        - Conditional rendering: checkbox vs Edit/Delete buttons
        - Click handler switches between flip and selection toggle
        - Opacity transition (200ms ease)
    - `CardList.vue` updates
        - Pass-through selection props to CardItem
        - New emit: `toggle-select`
    - `CoursePage.vue` state management
        - `isSelectionMode` ref (boolean)
        - `selectedCardIds` ref (Set for O(1) operations)
        - Handlers: `handleToggleCardSelection`, `handleBatchDelete`, `handleDeleteAllCards`, `exitSelectionMode`
        - Selection UI in both desktop section header and mobile panel
    - `cardsApi` methods
        - `deleteBatch(courseId, cardIds)` — POST with data payload
        - `deleteAll(courseId)` — DELETE all
    - `useCardStore` actions
        - `deleteBatchCards(ids, courseId)` — removes from local state, fetches fresh stats
        - `deleteAllCards(courseId)` — clears local array, updates stats

### Changed

- **Card Repository** (`cardRepository.ts`)
    - Added `deleteCardsBatch(ids, courseId)` — SQL WHERE IN with transaction
    - Added `deleteAllCards(courseId)` — single DELETE query
    - Both methods return deleted count via `numDeletedRows`

### Fixed

- Initial implementation issues:
    - Removed TypeScript syntax from CardCheckbox (project uses JavaScript)
    - Removed i18n `$t()` call (internationalization not implemented)
    - Added missing "Clear" button to UI (was implemented as handler only)

### Technical Details

- **OpenSpec Status**:
    - ✅ All 30+ implementation tasks completed
    - ✅ All 7 testing tasks completed
    - ✅ All 4 UI/UX polish tasks completed
    - ✅ Change archived as `2026-01-07-add-batch-card-delete`
    - ✅ Spec `course-ui` updated: +3 requirements (Batch Delete, Delete All, Custom Checkbox)

- **Files Modified**: 9
    - Backend (3): `cardRepository.ts`, `cards.ts`, `card.ts` (schemas)
    - Frontend (6): `CardCheckbox.vue` (new), `CardItem.vue`, `CardList.vue`, `CoursePage.vue`, `cards.js` (API),
      `useCardStore.js`

- **Code Quality**:
    - ✅ No lint errors
    - ✅ Transactional database operations
    - ✅ Proper state synchronization (local + server)
    - ✅ Accessibility features (ARIA labels, keyboard navigation)

- **User Experience**:
    - ✅ Works on desktop and mobile (slide-out panel)
    - ✅ Real-time counter in "Delete (N)" button
    - ✅ Confirmation dialogs prevent accidental deletions
    - ✅ Statistics auto-update after deletion
    - ✅ Smooth animations and visual feedback

## [0.4.5] - 2026-01-07 20:30

### Added

#### OpenSpec: Batch Card Delete Proposal

- **OpenSpec Change Created**: `add-batch-card-delete`
    - Comprehensive proposal for batch card deletion functionality
    - Motivation: inefficient to delete cards one by one when cleaning up course content

- **Proposal Structure** (`openspec/changes/add-batch-card-delete/`)
    - **proposal.md** (2.4 KB)
        - Overview: batch card deletion with checkboxes + delete all cards feature
        - Motivation: current one-by-one deletion is inconvenient for bulk operations
        - Goals: selection mode, visual feedback, batch delete, delete all
        - Success criteria: 7 points covering selection, deletion, backend support
    - **design.md** (15.2 KB)
        - Backend API: two endpoints for batch delete and delete all
            - `DELETE /api/courses/:courseId/cards/batch` (with cardIds array)
            - `DELETE /api/courses/:courseId/cards` (delete all cards)
        - Frontend UI: selection mode with custom checkboxes
            - `CardCheckbox.vue` component (20x20px, gradient when checked)
            - `CardItem.vue` changes: selectionMode prop, opacity 0.6 when selected
            - `CoursePage.vue`: selection state, toggle/batch delete handlers
        - UX considerations: visual feedback, transitions, accessibility
        - Error handling: SQL transactions, network errors
    - **tasks.md** (3.8 KB, 8 phases, 30+ subtasks)
        - Phase 1: Backend API endpoints (5 tasks)
        - Phase 2: Frontend UI components for selection mode (6 tasks)
        - Phase 3: CoursePage selection mode (7 tasks)
        - Phase 4: Delete all cards feature (4 tasks)
        - Phase 5: API client integration (4 tasks)
        - Phase 6: Testing (7 tasks)
        - Phase 7: UI/UX polish (4 tasks)
    - **specs/course-ui/spec.md** (delta)
        - ADDED requirements:
            - Batch Card Delete (4 scenarios: entering mode, selecting, deleting, exiting)
            - Delete All Cards (2 scenarios: accessing, deleting)
            - Custom Checkbox Component (3 scenarios: unchecked, checked, dark theme)
        - MODIFIED requirements:
            - Enhanced Card Statistics: added selection mode behavior

- **Key Features Documented**
    - **Selection Mode**:
        - Custom checkboxes (not native browser checkboxes)
        - Selected cards have reduced opacity (0.6)
        - Cards don't flip in selection mode
        - "Delete selected (N)" button (disabled when N=0)
        - "Cancel" button to exit selection mode
    - **Delete All**:
        - Separate "Delete all cards" button
        - Confirmation dialog with warning
        - Single operation to clear entire course
    - **Backend**:
        - Transactional batch delete (all or nothing)
        - Validation: max 100 cards per batch, cards belong to course
        - Returns deleted count in response

### Technical Details

- **OpenSpec Validation**: ✅ Passed `npx @fission-ai/openspec validate add-batch-card-delete --strict`
- **Change Status**: 0/30+ tasks (proposal stage, ready for user review and approval)
- **Files Created**: 4
    - `openspec/changes/add-batch-card-delete/proposal.md`
    - `openspec/changes/add-batch-card-delete/design.md`
    - `openspec/changes/add-batch-card-delete/tasks.md`
    - `openspec/changes/add-batch-card-delete/specs/course-ui/spec.md`
- **No Code Changes Yet**: Pure planning/proposal phase

### Next Steps

- User review and approval of proposal
- Implementation via `/openspec-apply` workflow after approval

## [0.4.5] - 2026-01-07 19:37

### Added

#### Feature: Visual Feedback for Card Edit/Create

- **Visual feedback after card creation/edit**: automatic scroll to card with bounce animation
- **Card progress reset on edit**: card becomes "new" with fresh FSRS metrics (state, stability, difficulty, reps,
  lapses reset)
- **CardList.vue now exposes `scrollToCardWithBounce()` method**:
    - Scrolls to card using `scrollIntoView({ behavior: 'smooth', block: 'start' })`
    - Applies `bounce-in-bck` CSS animation (2s duration)
    - Handles edge cases (card not found, respects `prefers-reduced-motion`)
- **CoursePage.vue now triggers scroll and animation** after card save/create
    - `handleQuickAdd`: scrolls to newly added card with bounce
    - `handleSaveCard`: scrolls to edited card with bounce and resets progress
    - Auto-opens mobile panel when creating/editing cards on mobile devices

### Changed

- **Card update endpoint now supports `resetProgress` parameter**:
    - `PUT /api/cards/:id` accepts `{ front, back, resetProgress?: boolean }`
    - When `resetProgress=true`, backend resets: state (→ New), stability (→ 0.0), difficulty (→ 5.0), reps (→ 0),
      lapses (→ 0), due (→ now + first learning step)
    - Schema updated: `UpdateCardSchema` includes optional `resetProgress` field
    - Settings-based interval: uses first learning step from course/global settings (default: 10 minutes)

- **Code refactoring (by user)**:
    - Extracted scroll and highlight logic to `useScrollAndHighlight` composable
    - Improved animation with opacity changes (0.5 at 55% keyframe)
    - Enhanced z-index handling for animated cards
    - Code style improvements: consistent `else` formatting

### Technical Details

- **Files Modified**:
    - Backend (3 files):
        - `backend/src/routes/cards.ts` (+28 lines): resetProgress logic
        - `backend/src/schemas/card.ts` (+1 line): add resetProgress to schema
    - Frontend (4 files):
        - `frontend/src/widgets/card-list/CardList.vue` (refactored): useScrollAndHighlight composable integration
        - `frontend/src/widgets/card-list/composables/useScrollAndHighlight.js` (new): extracted scroll/highlight logic
        - `frontend/src/pages/course/CoursePage.vue` (+35 lines): refs, scrollToCardWithBounce wrapper, mobile panel
          auto-open
        - `frontend/src/pages/course/CoursePage.vue`: conditional course description rendering

- **Code Quality**:
    - ✅ Backend lint passed (0 errors, 5 pre-existing warnings)
    - ✅ Frontend lint passed (0 errors, auto-fixed)
    - ✅ TypeScript: Proper types (Partial&lt;Card&gt;), no any usage in new code

- **Animation Details**:
    - `bounce-in-bck`: 2s duration, 7 keyframes (scale from 7 to 1 with bounces, opacity fade)
    - Accessibility: respects `prefers-reduced-motion: reduce`
    - 500ms delay before animation to allow scroll completion
    - Enhanced z-index (99) for better visual layering

- **OpenSpec**:
    - ✅ Change `card-edit-form` archived as `2026-01-07-card-edit-form`
    - ✅ Spec `course-ui` updated: +2 requirements (Card Management Interface, Progress Reset on Edit)
    - ✅ All tasks completed (9/9), including manual testing on desktop and mobile

## [0.4.4] - 2026-01-07 17:28

### Added

#### OpenSpec: Card Edit Visual Feedback Proposal

- **OpenSpec Change Created**: `card-edit-form`
    - Proposal for adding visual feedback when editing/creating cards
    - Motivation: users need clear confirmation of which card was edited/created

- **Proposal Structure** (`openspec/changes/card-edit-form/`)
    - **proposal.md** (5.8 KB)
        - Context: identifying UX issues (no visual feedback, poor mobile experience)
        - Solution: use existing `CardEditorModal` + scroll to card + bounce animation
        - Success criteria: 7 points covering edit/create flows
        - Open questions answered: progress reset fields, animation type, scroll parameters
        - Alternatives considered: inline form rejected in favor of existing modal
    - **design.md** (12 KB)
        - Component changes: `CardList.vue`, `CoursePage.vue`
        - New method: `scrollToCardWithBounce(cardId)`
        - CSS animation: `bounce-in-bck` (1s duration, 7 keyframes)
        - API changes: `PUT /cards/:id` with `resetProgress` parameter
        - Data flow diagrams for edit and create scenarios
        - Edge cases: card not found, dual CardList instances (desktop/mobile)
    - **tasks.md** (8.5 KB, 9 tasks, ~2.5 hours)
        - Task 1: Backend support for progress reset (15 min)
        - Task 2: CardList scroll + animation method (30 min)
        - Tasks 3-4: CoursePage integration (35 min)
        - Tasks 5-7: Manual testing (50 min)
        - Tasks 8-9: Documentation + validation (20 min)
    - **specs/course-ui/spec.md** (7 KB)
        - MODIFIED requirements: Card Management Interface (4 scenarios)
        - ADDED requirements: Progress Reset on Edit (2 scenarios)
        - Implementation notes: API contract, CSS animation, data flow

- **Key Features Documented**
    - **Visual Feedback**:
        - Automatic scroll to edited/created card: `scrollIntoView({ behavior: 'smooth', block: 'start' })`
        - Bounce animation: `bounce-in-bck` (1s, transform scale from 7 to 1 with intermediate bounces)
        - Accessibility: respects `prefers-reduced-motion: reduce`
    - **Progress Reset**:
        - When editing card: reset `state`, `stability`, `difficulty`, `reps`, `lapses`, `due`
        - Card becomes "new" (state = New, due = now + 4h)
        - Automatic on save (cannot be disabled)
    - **Minimal Changes**:
        - No new components (uses existing `CardEditorModal`)
        - Only 3 files modified: `CardList.vue`, `CoursePage.vue`, `backend/src/routes/cards.ts`
        - Complexity reduced: Low (1-2 hours) vs original Medium (3-5 hours)

- **User Adjustments** (post-proposal)
    - Animation timeout increased from 1000ms to 2000ms for better visibility
    - Decision to use existing modal instead of creating new inline form
    - All open questions resolved with specific implementation details

### Technical Details

- **OpenSpec Validation**: ✅ Passed `npx @fission-ai/openspec validate card-edit-form --strict`
- **Change Status**: 0/9 tasks (proposal stage, ready for user review and approval)
- **Files Created**: 4
    - `openspec/changes/card-edit-form/proposal.md`
    - `openspec/changes/card-edit-form/design.md`
    - `openspec/changes/card-edit-form/tasks.md`
    - `openspec/changes/card-edit-form/specs/course-ui/spec.md`
- **No Code Changes Yet**: Pure planning/proposal phase

### Next Steps

- User review and approval of proposal
- Implementation via `/openspec-apply` workflow after approval

## [0.4.4] - 2026-01-07 15:59

### Changed

#### UI: Enhanced Card List with Scroll Indicators (Manual Changes)

- **CardList.vue — Плавные градиентные индикаторы прокрутки**
    - Реализованы fade-эффекты (градиенты) сверху и снизу списка карточек
    - Градиенты динамически появляются/исчезают в зависимости от позиции скролла
    - Добавлено отслеживание скролла через `useTemplateRef` и обработчик `checkScroll`
    - Улучшен layout с использованием Tailwind CSS utility classes (`flex`, `overflow-y-auto`, `snap-y`)
    - Удален избыточный prop `compact` для упрощения API компонента

- **QuickAddCard.vue — Адаптивная высота textarea**
    - Textarea в batch-режиме теперь адаптируется к размеру экрана
    - Используется `@vueuse/core` (`useMediaQuery`) для определения устройства
    - Высота textarea:
        - Desktop (≥1025px): 8 строк
        - Tablet (769-1024px): 5 строк
        - Mobile (≤768px): 3 строки
    - Убран фиксированный label для более чистого UI
    - Оптимизированы gap-классы для разных breakpoints
    - Удалены дублирующие CSS-правила

### Technical Details

- **Files Modified**: 7
    - `frontend/src/widgets/card-list/CardList.vue` (major refactoring)
    - `frontend/src/widgets/card-list/CardItem.vue` (minor styling)
    - `frontend/src/widgets/quick-add-card/QuickAddCard.vue` (adaptive textarea)
    - `frontend/src/pages/course/CoursePage.vue` (minor)
    - `frontend/src/shared/ui/Card.vue` (minor)
    - `frontend/src/shared/ui/Input.vue` (minor)
    - `frontend/src/app/assets/css/styles.css` (minor)

- **User Experience**:
    - ✅ Визуальная индикация возможности прокрутки списка карточек
    - ✅ Улучшенная адаптивность интерфейса добавления карточек
    - ✅ Более эргономичное использование экрана на мобильных устройствах

## [0.4.4] - 2026-01-07 13:23

### Added

- **Course Page Redesign**:
    - Implemented responsive two-column layout for desktop (≥1024px).
    - Added slide-out cards panel for mobile/tablet (<1024px).
    - Integrated full FSRS statistics on cards (Stability, Difficulty, Reps, Lapses).
    - Added timestamps (Created, Last Review, Due) to card items.
    - Implemented `focus-trap` for better accessibility in mobile panel.
    - Added smooth scrolling to "Quick Add Card" widget when creating a new card.

### Fixed

- Fixed mobile panel header overlap with application header.
- Fixed desktop cards column overflow issue.
- Fixed "Create Card" button functionality in mobile panel.

## [0.4.3] - 2026-01-07 12:08

### Added

#### OpenSpec: Course Layout Redesign Proposal

- **OpenSpec Change Created**: `redesign-course-layout`
    - Comprehensive proposal for redesigning course page with adaptive layout and enhanced card statistics
    - Motivation: efficient screen space usage on desktop, better mobile UX, transparency of FSRS algorithm

- **Proposal Structure** (`openspec/changes/redesign-course-layout/`)
    - **proposal.md** (6 KB)
        - Overview: two-column layout (desktop) + slide-out panel (mobile)
        - Motivation: current issues (wasted space, hidden metrics) and expected improvements
        - Why section: need for transparency and efficient layout
        - Scope: in/out of scope clearly defined
        - User Review Required: breakpoint (1024px) and statistics format (inline)
        - Dependencies, Rollout Plan, Alternatives Considered
    - **design.md** (14 KB)
        - Architecture: component structure, responsive layouts (desktop/tablet/mobile)
        - Desktop: grid-cols-[2fr_1fr], 60%/40% split
        - Mobile/Tablet: slide-out panel from right (85% tablet width, 100% mobile), FAB button
        - Card Statistics Display: 8 metrics (state, stability, difficulty, reps, lapses, created, last review, due)
        - Icons mapping (Bootstrap Icons), tooltips, compact mode for desktop right column
        - Accessibility, performance, testing strategy
    - **tasks.md** (7 KB, 6 phases, ~40 subtasks)
        - Phase 1: Desktop Two-Column Layout (2 tasks)
        - Phase 2: Mobile Slide-Out Panel (4 tasks with FAB, panel, focus trap)
        - Phase 3: Enhanced Card Statistics (3 tasks for metrics display)
        - Phase 4: Accessibility Enhancements (2 tasks)
        - Phase 5: Testing & Verification (3 tasks for responsive/functional/performance)
        - Phase 6: Documentation (2 tasks)
        - Dependencies graph and estimated effort: 11-17 hours
    - **specs/course-ui/spec.md** (11 KB)
        - 4 requirements with SHALL/MUST keywords
        - 8 scenarios: desktop/mobile layouts, panel opening/closing, statistics display, accessibility
        - GIVEN/WHEN/THEN format with AND clauses
        - Rationale for each requirement

- **Key Features Documented**
    - **Responsive Breakpoint**: 1024px (desktop ≥1024px, mobile/tablet \u003c1024px)
    - **Desktop Layout**: Two columns (course info left, compact cards list right)
    - **Mobile Layout**: Single column + FAB + slide-out panel (hardware-accelerated transitions)
    - **Enhanced Statistics**: 8 metrics per card
        - FSRS: stability, difficulty, reps, lapses
        - Timestamps: created, last review, due
        - Icons: Bootstrap Icons with tooltips
        - Compact mode: smaller font, 2-line text clamp in right column
    - **Accessibility**: ARIA labels, tooltips (300ms hover), screen reader support, focus trap in panel

- **User Adjustments** (post-proposal)
    - Panel width clarified: 85% on tablet (max 400px), 100% on mobile
    - Tooltips decision: for all metrics (resolved in design.md)
    - Partial English translation of documents (proposal, spec, tasks, design)

### Technical Details

- **OpenSpec Validation**: ✅ Passed `npx @fission-ai/openspec validate redesign-course-layout --strict`
- **Change Status**: 0/40 tasks (proposal stage, ready for user review and approval)
- **Files Created**: 4
    - `openspec/changes/redesign-course-layout/proposal.md`
    - `openspec/changes/redesign-course-layout/design.md`
    - `openspec/changes/redesign-course-layout/tasks.md`
    - `openspec/changes/redesign-course-layout/specs/course-ui/spec.md`
- **No Code Changes Yet**: Pure planning/proposal phase

### Next Steps

- User review and approval of proposal
- Verify breakpoint (1024px) and statistics format preferences
- Implementation via `/openspec-apply` workflow after approval

## [0.4.3] - 2026-01-07 11:31

### Added

#### Settings: Learning Steps Parameter in UI

- **Frontend Enhancement**
    - Added `learningSteps` field to `SettingsForm.vue`
    - User-friendly input format: comma-separated minutes (e.g., "10, 240")
    - Automatic conversion between user format and JSON backend format
    - Helper functions: `parseLearningStepsForDisplay()`, `formatLearningStepsForBackend()`
    - Computed property `displayLearningSteps` for bidirectional conversion
    - Real-time validation: checks for positive numbers and valid JSON format
    - Help text: "Интервалы для новых карточек в минутах, разделённые запятой"
    - Error messages for invalid input format

- **Backend Support**
    - Parameter `learningSteps` already existed in backend:
        - Database schema (SettingsTable, CourseSettingsTable)
        - Zod validation: JSON string with array of positive numbers
        - Settings repository with default value `'[10, 240]'`
        - FSRS integration for interval calculation

- **User Experience**
    - Available in both global settings page and course settings modal
    - Seamless conversion: user types "10, 240" → backend receives `"[10, 240]"`
    - Validation errors display inline with descriptive messages

### Technical Details

- **Files Modified**: 1
    - `frontend/src/widgets/settings-form/SettingsForm.vue` (+54 lines)
- **Validation Logic**:
    - Checks if input is valid JSON array
    - Verifies all elements are positive numbers
    - Displays user-friendly error messages
- **Format Conversion**:
    - Display: `"[10, 240]"` → `"10, 240"`
    - Save: `"10, 240"` → `"[10, 240]"`

## [0.4.3] - 2026-01-07 01:30

### Added

#### OpenSpec: Replace Time Selects Implementation

- **Features**:
    - Implemented `vue-scroll-picker` for precise time selection (hours and minutes).
    - Migrated database and API to use minute-based time format (0-1439 minutes) instead of hours.
    - Redesigned time pickers with a modern, "airy" aesthetic (gradients, horizontal lines).
    - Updated `SettingsForm` with real-time validation for minute-based ranges.
    - Full support for 0-59 minutes range with 1-minute step.

- **Backend**:
    - Added migration `005_convert_time_to_minutes`.
    - Updated `SettingsTable`, `CourseSettingsTable` schemas.
    - Updated Zod validation logic.
    - Updated FSRS time calculation logic.

## [0.4.2] - 2026-01-06 23:26 (AMENDED)

### Added

#### OpenSpec: Replace Time Selects Proposal (UPDATED)

**Amendment**: Расширен scope для поддержки **часов И минут** (вместо только часов)

- **OpenSpec Change Updated**: `replace-time-selects`
    - **ИЗМЕНЕНИЕ**: Универсальный `ScrollTimePicker` компонент (hours + minutes)
        - Props: `min`, `max`, `step`, `suffix`, `formatDigits` для гибкости
        - Использование: часы (0-23), минуты с шагом (0,15,30,45), минуты все (0-59)
    - **ИЗМЕНЕНИЕ**: `TimeRangePicker` теперь использует **4 scroll picker'а** (hours+minutes x2)
        - Start Hours + Start Minutes
        - End Hours + End Minutes
    - **ИЗМЕНЕНИЕ**: Формат данных — время в **минутах с начала дня** (0-1439)
        - Вместо `trainingStartHour`/`trainingEndHour` → `trainingStartTime`/`trainingEndTime`
    - **ДОБАВЛЕНО в scope**: Backend изменения
        - Database migration для конвертации часов в минуты
        - Zod schema updates (validation 0-1439 minutes)
        - API endpoints updates

- **Proposal Structure** (updated)
    - **proposal.md** (9 KB → updated)
        - Implementation Approach: добавлен backend migration step
        - User Value: добавлена "Точность выбора времени" (15-минутный шаг)
        - In Scope: добавлены backend changes (БД, schemas, API)
        - Out of Scope: уточнён (no data migration, пользователи пересохранят настройки)
    - **tasks.md** (3.5 KB → updated, **9 tasks** instead of 8)
        - Task 2: Universal ScrollTimePicker (generic для hours/minutes)
        - **Task 3: Backend migration (NEW)**
        - Tasks 4-9: renumbered
    - **design.md** (11.6 KB → 14+ KB)
        - Updated ScrollTimePicker implementation (min/max/step props)
        - Updated TimeRangePicker (4 pickers, internal state conversion)
        - Added Breaking Change note (API теперь в минутах)
        - Visual Range calculation для минут
    - **specs/settings-ui/spec.md** (unchanged)

- **Breaking Changes Documented**
    - TimeRangePicker API: props теперь в minutes вместо hours
    - Backend: Database schema change (trainingStartTime/trainingEndTime)
    - Migration strategy: users must re-save settings

### Technical Details

- **OpenSpec Validation**: ✅ Passed `npx @fission-ai/openspec validate replace-time-selects --strict` (after amendment)
- **Change Status**: 0/9 tasks (proposal stage, ready for implementation)
- **Files Modified**: 3
    - `openspec/changes/replace-time-selects/proposal.md` (updated scope)
    - `openspec/changes/replace-time-selects/tasks.md` (added Task 3 for backend)
    - `openspec/changes/replace-time-selects/design.md` (major updates for 4 pickers)
- **Scope Change**: Medium → Large (добавлены backend changes)
- **Timeline**: Остался прежним (~2 hours) — backend migration простая

### User Value Improvements

- **Точность**: 15-минутный шаг вместо 1 час
- **Гибкость**: Можно легко изменить шаг минут (5, 10, 15, 30)
- **Универсальность**: Один компонент для всех use cases

## [0.4.2] - 2026-01-06 23:17

### Added

#### OpenSpec: Replace Time Selects Proposal

- **OpenSpec Change Created**: `replace-time-selects`
    - Comprehensive proposal for replacing HTML `<select>` elements in `TimeRangePicker` component
    - Migration to `vue-scroll-picker` library for iOS-style scroll picker UI
    - Motivation: improved UX, mobile-friendly interaction, premium UI quality

- **Documentation Research**
    - Studied official `vue-scroll-picker` documentation and API
    - Analyzed GitHub examples (ExampleMultiple.vue)
    - Identified correct API usage pattern with `options` array format
    - Found critical requirement: CSS import (`vue-scroll-picker/style.css`) is mandatory

- **Proposal Structure** (`openspec/changes/replace-time-selects/`)
    - **proposal.md** (9 KB)
        - Problem statement with 4 identified issues
        - Why section: UX enhancement, design system alignment, future-proofing
        - Proposed solution with `vue-scroll-picker` integration
        - Scope (in/out), dependencies, risks & mitigations
        - Success criteria (7 points), timeline estimate (1-2 hours)
    - **tasks.md** (3.5 KB, 8 tasks)
        - Task 1: Install dependency with CSS import note
        - Task 2: Create `ScrollTimePicker.vue` wrapper with concrete code examples
        - Tasks 3-8: Integration, testing, cleanup
        - Each task includes validation criteria
    - **design.md** (11.6 KB)
        - Complete architecture with component hierarchy
        - DetailedScrollTimePicker.vue` implementation (imports, API, template)
        - Correct `vue-scroll-picker` API usage with options format
        - UI/UX design with visual mockups
        - Technical decisions (why vue-scroll-picker, wrapper pattern justification)
        - Performance considerations, testing approach, migration strategy
    - **specs/settings-ui/spec.md** — spec delta with modified requirements
        - 5 scenarios for scroll picker behavior
        - Design rationale, backward compatibility guarantee
        - Testing strategy

- **Implementation Details Documented**
    - Correct imports: `import { VueScrollPicker } from 'vue-scroll-picker'`
    - CSS requirement: `import 'vue-scroll-picker/style.css'` (CRITICAL)
    - Options format:

    ```js
    const options = computed(() =>
      Array.from({ length: 24 }, (_, i) => ({
        name: i.toString().padStart(2, '0') + ':00',
        value: i
      }))
    );
    ```

    - V-model binding via `modelValue` and `update:modelValue` event

### Technical Details

- **OpenSpec Validation**: ✅ Passed `npx @fission-ai/openspec validate replace-time-selects --strict`
- **Change Status**: 0/8 tasks (proposal stage, ready for implementation)
- **Files Created**: 4
    - `openspec/changes/replace-time-selects/proposal.md`
    - `openspec/changes/replace-time-selects/tasks.md`
    - `openspec/changes/replace-time-selects/design.md`
    - `openspec/changes/replace-time-selects/specs/settings-ui/spec.md`
- **Markdown Linting**: Warnings present (line length, list formatting) but not blocking
- **No Code Changes**: Pure documentation/proposal phase

### Next Steps

- Review and approve proposal
- Implementation via `/openspec-apply` workflow
- Create `ScrollTimePicker.vue` wrapper component
- Refactor `TimeRangePicker.vue` to use scroll pickers
- Integration testing in SettingsForm and CourseSettingsModal

## [0.4.2] - 2026-01-06 23:01

### Added

#### Settings: Enable Fuzz Parameter in UI

- **Frontend Enhancement**
    - Added `enableFuzz` checkbox to `SettingsForm.vue`
    - User-facing label: "Включить размытие интервалов (fuzz)"
    - Help text: "Добавляет случайную вариацию к интервалам повторения для более естественного
      распределения карточек"
    - Available in both global settings page and course settings modal

- **Backend Support**
    - Parameter `enableFuzz` already existed in backend:
        - Database schema (SettingsTable, CourseSettingsTable)
        - Zod validation schemas
        - Settings repository
        - FSRS integration
    - Default value: `true` (enabled)

### Fixed

- **Code Quality**
    - Removed duplicate comment in `CourseSettingsModal.vue`
    - Removed duplicate CSS rule `.radio-label input[type='radio']` in `CourseSettingsModal.vue`

### Technical Details

- **Files Modified**: 2
    - `frontend/src/widgets/settings-form/SettingsForm.vue` (+12 lines)
    - `frontend/src/widgets/course-settings-modal/CourseSettingsModal.vue` (-7 lines cleanup)
- **User Experience**:
    - ✅ Global settings — checkbox on /settings page
    - ✅ Course settings — checkbox in modal window
    - ✅ Save/load works automatically via existing API

## [0.4.2] - 2026-01-06 22:45

### Documentation

- **Internationalization (i18n)**
    - Full translation of project documentation from Russian to English.
    - Updated `readme.md`, `openspec` docs, and all files in `docs/`.
    - Maintained original formatting, diagrams, and code blocks.

- **Readme Updates**
    - Actualized Architecture, Features, and Current Status sections.
    - Fixed Installation and Development Mode instructions based on actual `package.json` scripts.

### Technical Details

- **Version Bump**: 0.4.1 → 0.4.2 across all workspaces.

## [0.4.1] - 2026-01-06 21:57

### Fixed

#### Settings Page: Fix course settings buttons

- **Issue**: "Configure" buttons on the settings page were not working
    - `openCourseSettings()` function was a stub implementation (console.log only)
    - `CourseSettingsModal` existed but was not connected to `SettingsPage`

- **Solution**:
    - Added modal open/close logic to `SettingsPage.vue`
    - Reactive variables: `showCourseModal`, `selectedCourseId`, `selectedCourse`
    - Functions: `openCourseSettings()`, `closeCourseModal()`
    - Connected existing `CourseSettingsModal` component in template

#### Settings Store: Critical fix for API response handling

- **Root Cause**: Incorrect handling of backend response structure
    - Store expected wrapped data `{ settings: {...} }`, but API returned data directly
    - `effectiveSettings` returned `undefined` due to accessing `response.settings`
    - Modal displayed incorrect values (":00", "NaN:00")

- **Fixes in `useSettingsStore.js`**:
    - `fetchGlobalSettings()` — changed from `response.settings` to `response`
    - `updateGlobalSettings()` — changed from `response.settings` to `response`
    - `fetchCourseSettings()` — correct handling of `{ courseSettings, effectiveSettings }`
    - `updateCourseSettings()` — changed from `response.settings` to `response`

- **Files**:
    - `frontend/src/entities/settings/model/useSettingsStore.js` (4 methods fixed)
    - `frontend/src/pages/settings/SettingsPage.vue` (added modal logic)
    - `frontend/src/widgets/course-settings-modal/CourseSettingsModal.vue` (improved initialization)

#### Modal Component: Slot support for header

- **User Fixes**:
    - `Modal.vue` — added fallback to `header` slot if `title` prop is not set
    - `CourseSettingsModal.vue` — changed `courseId` type from String to Number
    - `CoursePage.vue` — removed `String()` casting for courseId

### Technical Details

- **Verification**:
    - ✅ Modal opens when clicking "Configure"
    - ✅ Header displays course name
    - ✅ Correct radio button selected (Global/Custom)
    - ✅ All fields populated with correct values
    - ✅ "Current Schedule" shows valid data

- **Debugging**:
    - Temporary logging of API responses helped identify data structure mismatch
    - All debug code removed after fixing the issue

## [0.4.0] - 2026-01-06 20:49

### Changed

#### OpenSpec: Archiving add-settings-page change

- **Archiving completed**
    - `add-settings-page` change successfully archived as `2026-01-06-add-settings-page`
    - Change status before archiving: ✓ Complete
    - All tasks completed, code implemented and tested

- **Spec Creation**
    - Automatically created 3 new specs from delta sections:
        - `settings-ui` (7 requirements) — UI components and settings page
        - `settings-course-management` (6 requirements) — course settings management
        - `settings-global-management` (5 requirements) — global application settings
    - Total **18 new requirements** added to project knowledge base

- **Spec Structure**
    - Each spec contains Requirements in Given/When/Then format
    - Covered scenarios: data loading, validation, modals, keyboard navigation
    - Includes requirements for responsiveness and notifications

### Documentation

- **Updated OpenSpec specs**
    - `openspec/specs/settings-ui/spec.md` (172 lines, 7 requirements)
    - `openspec/specs/settings-course-management/spec.md` (6 requirements)
    - `openspec/specs/settings-global-management/spec.md` (5 requirements)

### Technical Details

- **Current Specs State**: 4 active specs
    - `styling-system` (6 requirements)
    - `settings-ui` (7 requirements)
    - `settings-course-management` (6 requirements)
    - `settings-global-management` (5 requirements)

- **OpenSpec CLI commands used**:
    - `npx @fission-ai/openspec list` — check status
    - `npx @fission-ai/openspec archive add-settings-page --yes` — archive
    - `npx @fission-ai/openspec list --specs` — confirm spec creation

## [0.4.0] - 2026-01-06 20:45

### Added

#### Feature: Systemized Styling

- **Unified Styling System**
    - Implemented CSS variables system for colors (`--color-primary`, `--color-bg-modal`, etc.)
    - Implemented typography system (`--text-page-title-size`, etc.)
    - Entire UI migrated to use these variables for full theme support
    - Removed all hardcoded hex colors (`#1a73e8`, `#e9ecef`) from components

- **Component Refactoring**
    - `Button.vue`, `Input.vue`, `Modal.vue`, `Card.vue` fully updated
    - `QuickAddCard.vue`, `CardItem.vue`, `CourseCard.vue` and other widgets updated
    - Removed duplicate styles (e.g., buttons in `CourseSettingsModal.vue` now use shared `Button.vue`)
    - Fixed visibility issues (dropdowns, buttons) in dark theme

### Fixed

- **UI Consistency Issues**
    - Fixed unreadable options in `TimeRangePicker` (white text on white background)
    - Fixed style of "Current Schedule" block in settings (now matches course description style)
    - Unified button styles across all modal windows
    - Fixed excessive brightness of action buttons

## [0.3.0] - 2026-01-06 18:19

### Fixed

#### Frontend: Text Contrast on Home Page

- **Issue**: Text in empty state component was unreadable on blue card background
    - `.empty-state-title` used dark color `#202124`
    - `.empty-state-text` used dark color `#5f6368`
    - "No courses" text and description were practically invisible on blue background

- **Solution**:
    - `.empty-state-title` changed to white: `#ffffff`
    - `.empty-state-text` changed to light gray: `#e9ecef`
    - Excellent contrast ensured against blue card background

- **Files**:
    - Changed: `frontend/src/pages/home/HomePage.vue` (2 CSS lines)

- **Verification**:
    - ✅ "No courses" text displays in white
    - ✅ Description is readable on blue background
    - ✅ Contrast meets accessibility requirements

## [0.3.0] - 2026-01-06 18:14

### Fixed

#### Frontend: Tailwind CSS v4 Theme Configuration

- **Issue with `rounded-*` classes**
    - Diagnosed reason for non-working `rounded-xl` classes in Button.vue and Card.vue
    - Root cause: missing `--radius-xl` CSS variable in Tailwind CSS v4 theme
    - Dynamic class generation via string interpolation `` `rounded-${props.rounded}` ``
      was not detected by Tailwind static analysis

- **Solution 1: Theme Definition via `@theme` block**
    - Created `@theme` block in `frontend/src/app/assets/css/styles.css`
    - Defined all radius variables: sm, md, lg, xl, 2xl, 3xl, full
    - `--radius-xl: 0.75rem` (12px) for correct corner rounding
    - **Important**: in Tailwind v4, `@theme` block must be in the same file as `@import 'tailwindcss'`

- **Solution 2: Safelist for Dynamic Classes**
    - Created `frontend/tailwind.config.js` with safelist array
    - Explicitly specified all `rounded-*` classes to guarantee generation
    - Necessity: Tailwind v4 does not detect classes from string interpolations

### Added

- **frontend/tailwind.config.js** — configuration with safelist for dynamically generated classes
- **@theme block** in styles.css with full set of `--radius-*` variables (7 values)

### Technical Details

- **Verification**:
    - ✅ `rounded-xl` applies `border-radius: 12px`
    - ✅ CSS variable `--radius-xl: 0.75rem` available in document
    - ✅ All components (Button, Card) correctly display rounded corners
    - ✅ Dev server restarted to apply changes

- **Files**:
    - Changed: `frontend/src/app/assets/css/styles.css` (+10 lines @theme)
    - Created: `frontend/tailwind.config.js` (15 lines)

## [0.3.0] - 2026-01-06 17:40

### Added

#### Feature: Settings Management System

**Entity Layer:**

- `frontend/src/shared/api/settings.js` — API client for settings endpoints
    - `getGlobalSettings()`, `updateGlobalSettings()`
    - `getCourseSettings()`, `updateCourseSettings()`, `resetCourseSettings()`
- `frontend/src/shared/types/settings.ts` — TypeScript interfaces for settings
    - GlobalSettings, CourseSettings, UpdateSettingsDTO, SettingsValidation
- `frontend/src/entities/settings/model/useSettingsStore.js` — Pinia store with inheritance logic
    - State: globalSettings, courseSettings (Map)
    - Getters: getEffectiveSettings(), hasCustomSettings()
    - Actions: fetch/update/reset for global and course settings
    - Fallback pattern: courses use global settings by default

**UI Components:**

- `frontend/src/shared/ui/TimeRangePicker.vue` — time range selection component
    - Two selectors (start/end of day) 0-23 hours
    - Visual timeline scale with active range
    - Time labels: 0:00, 6:00, 12:00, 18:00, 24:00

**Widgets:**

- `frontend/src/widgets/settings-form/SettingsForm.vue` — settings edit form
    - TimeRangePicker integration
    - Real-time validation of time ranges
    - Input for minTimeBeforeEnd (1-12 hours)
    - Checkbox for system notifications
    - Preview section with effective schedule calculation
- `frontend/src/widgets/course-settings-modal/CourseSettingsModal.vue` — course settings modal
    - Switch: "Global" / "Individual"
    - SettingsForm integration (readonly in global mode)
    - "Reset to global" button

**Pages:**

- `frontend/src/pages/settings/SettingsPage.vue` — main settings page
    - Global settings section with SettingsForm
    - Course list with badges (Global/Custom)
    - "Configure" button for each course
    - Loading states and error handling

### Changed

- `frontend/src/pages/course/CoursePage.vue` — added course settings integration
    - "Course Settings" button in header next to "Back"
    - CourseSettingsModal integration
    - Handlers: handleOpenSettings(), handleCloseSettings(), handleSettingsSaved()
    - Updated page-header styles for flex layout

### Documentation

- **docs/SettingsPage_Walkthrough.md** — comprehensive documentation
    - Overview of implemented components
    - Entity Layer, UI Components, Widgets, Pages
    - Architecture highlights (Settings Inheritance Pattern, Validation Logic)
    - Testing summary (Code Quality, Manual Testing Checklist)
    - Files created/modified (~951 lines of Vue/JS/TS code)
    - Known limitations and next steps

### Technical Details

**Validation Rules:**

- `trainingStartHour` < `trainingEndHour`
- `minTimeBeforeEnd` from 1 to 12 hours
- Training range >= `minTimeBeforeEnd`

**Settings Inheritance Pattern:**

```javascript
getEffectiveSettings: (state) => (courseId) => {
    if (!courseId) return state.globalSettings
    return state.courseSettings.get(courseId) || state.globalSettings
}
```

**Code Quality:**

- ✅ ESLint passed
- ✅ No TypeScript errors
- ✅ All imports use `@` alias
- ✅ Vue components auto-imported

## [0.2.1] - 2026-01-06 15:49

### Added

#### Documentation: OpenSpec Workflow Guide

- **openspec-workflow.md** — created full guide on OpenSpec methodology
    - Description of spec-driven development approach
    - Three development stages: Proposal → Implementation → Archive
    - Roles in process (developer vs AI agent)
    - Useful commands for working with OpenSpec
    - `openspec/` directory structure
    - Examples of full cycle from request to archiving
    - Spec format with proper Scenarios
    - Operations with Requirements: ADDED, MODIFIED, REMOVED, RENAMED
    - Best Practices: Simplicity First, Complexity Triggers
    - Troubleshooting for common errors
    - Additional resources and links

- **openspec/project.md** — filled with detailed project information
    - Project goals (7 key points)
    - Full technology stack (Frontend, Backend, Tooling)
    - Code conventions (formatting, conditionals, imports)
    - Architectural patterns (FSD, Layered Architecture)
    - Testing strategy (current and planned)
    - Git Workflow (semantic commits, development process)
    - Domain context (FSRS, data structures)
    - Key constraints (technical, business logic, process)
    - External dependencies (MCP servers, libraries, system integrations)
    - Project status (implemented, in progress, planned)

### Changed

- **readme.md** — added "Development Workflow" section with link to OpenSpec Workflow Guide
- **readme.md** — fixed long lines to comply with markdown linting (max 120 chars)
- **readme.md** — fixed bare URL for ts-fsrs library

### Fixed

- **Markdown Linting**
    - Fixed all MD013 (line-length) errors in readme.md
    - Fixed MD034 (no-bare-urls) error in readme.md
    - Removed trailing punctuation (colons) from headers in openspec-workflow.md (MD026)
    - Replaced emphasis-headers with proper headings in openspec-workflow.md (MD036)
    - Added language for code block in openspec/project.md (MD040)

### Technical Details

- **Files created**: 1 (openspec-workflow.md, 453 lines)
- **Files updated**: 3 (openspec/project.md, readme.md, docs/Changelog.md)
- **Markdown linting**: all files pass check without errors

---

## [0.2.1] - 2026-01-06 14:30

### Changed

#### Code Style: Large-scale refactoring of UI and formatting

- **New Coding Rules**
    - Created `.agent/rules/CODE_STYLE.md` with mandatory JS/TS formatting rules
    - Conditional style: `else` on new line, single statements without braces
    - Updated `.agent/rules/vite-imports-and-components-rule.md`: priority of `<script setup>` over `<template>`
    - Updated `.agent/rules/workflow.md`: clarified session summary procedures
    - Updated `.agent/rules/using-console-commands.md`: terminal operation rules

- **UI Refactoring (12 files)**
    - Affected files:
        - App.vue, HomePage.vue, CoursePage.vue
        - Button.vue, Card.vue, Input.vue, StackedCardsIcon.vue (new)
        - TitleBar.vue, CourseCard.vue, CardItem.vue, QuickAddCard.vue

- **Frontend Dependencies Expansion**
    - Added `markdown-it` for Markdown rendering
    - Added `highlight.js` for syntax highlighting
    - Added `@types/markdown-it` for TypeScript types

### Removed

- **Old Rules Cleanup**
    - Removed `.agent/rules/use-vitejs-at-rule.md` (obsolete)
    - Removed `.agent/rules/vue-structure-preference-rule.md` (replaced by vite-imports-and-components-rule)
    - Removed `docs/Changelog_session.md` (duplicate)

### Fixed

- **Documentation**
    - Fixed typos in `docs/Backend_Cards_FSRS_Progress.md`
    - Fixed typos in `docs/Backend_Cards_FSRS_Walkthrough.md`
    - Updated `docs/Cards_FSRS_Tasks.md` with actual task status
    - Added missing lines in `docs/Migration_System_Walkthrough.md`
    - Removed extra empty line in `docs/Testing_API.md`

### Technical Details

- **Files affected**: 29
- **Frontend changes**: ~2,116 insertions, ~1,977 deletions
- **New agent rules**: CODE_STYLE.md (143 lines)
- **Consistency**: All components now follow unified style
- **Semantics**: `<script setup>` first for better code navigation

---

## [0.2.1] - 2026-01-05 23:44

### Changed

#### UI: Light Theme Redesign

- **Global Color Scheme**
    - Switch from dark to light theme
    - App background: `#fafbfc` (almost white)
    - Primary text color: `#202124` (dark gray)
    - Accent color: `#1a73e8` (Google Blue)
    - Secondary text: `#5f6368` (medium gray)

- **Components (Light Theme)**
    - `App.vue` — background `#fafbfc`
    - `styles.css` — added CSS variables for light mode
    - `Card.vue` — white cards with light shadows
    - `Button.vue` — flat colors instead of gradients
    - `Input.vue` — white background, dark text
    - `TitleBar.vue` — white panel
    - `HomePage.vue` — updated colors
    - `CoursePage.vue` — light stats cards
    - `CourseCard.vue` — light hover effects
    - `CardItem.vue` — white flip cards

- **QuickAddCard — Exact Match to References**
    - Mode switcher with **blue border** (`border: 2px solid #1a73e8`) on active button
    - All buttons have gray border (`border: 1px solid #dadce0`)
    - Transparent background for switcher (not gray container)
    - Info block with blue background `#e8f0fe` and text `#1967d2`

- **Stats Cards (CoursePage)**
    - **Light Blue Background** `#e8f0fe` (was gray #f8f9fa)
    - Blue border `#d2e3fc`
    - Highlighted "Today" card: `#d2e3fc` with `2px` border
    - Hover: more saturated blue `#d2e3fc`

### Technical Details

- Removed all glassmorphism effects (`backdrop-filter: blur()`)
- Removed gradients, applied flat colors
- Soft shadows: `0 1px 3px rgba(0, 0, 0, 0.08)`
- State badges (cards): light backgrounds instead of gradient
    - New: `#e8f0fe` / `#1a73e8`
    - Learning: `#fef7e0` / `#f9ab00`
    - Review: `#e6f4ea` / `#0f9d58`
    - Relearning: `#fce8e6` / `#d93025`

### Design Philosophy

- Minimalist, clean design
- Adherence to Material Design principles
- Improved readability
- Compliance with provided UI references

---

## [0.2.0] - 2026-01-05 23:04

### Added

#### Frontend: Batch Card Import

- **QuickAddCard Component Enhancement**
    - Added mode switcher: "Single Card" / "Batch Add"
    - Batch add mode via textarea
    - Input format: `question | answer` (each line is a new card)
    - Parsing and validation of batch data:
        - Check for separator `|` presence
        - Check format correctness (exactly 1 separator per line)
        - Check for empty front/back values
        - Informative error messages with line number
    - Sequential card submission via existing emit mechanism
    - 50ms delay between cards for smoothness
    - Auto-clear textarea after successful addition

- **Premium UI Design**
    - Premium redesign of QuickAddCard component
    - Rich glassmorphism effect (backdrop-filter: blur(16px))
    - Multi-layer box-shadows for depth and volume
    - Increased typography: title 20px (was 16px), font-weight 700
    - Glowing icons with drop-shadow effect (#60a5fa)
    - Premium toggle buttons with gradient background (135deg, #3b82f6 → #2563eb)
    - Smooth animations with cubic-bezier timing function
    - Transform effects on hover (translateY + scale)
    - Increased spacing: padding 32px (was 20px), border-radius 16px (was 12px)
    - Elegant info panel with gradient background
    - Stylized code element with monospace font and border
    - Responsive design with adaptive padding for mobile

### Documentation

- **docs/features/batch-add-cards.md** — full functionality documentation:
    - Overview of batch import capabilities
    - Input format and usage examples
    - Technical implementation details
    - Description of parsing and validation functions
    - Benefits and compatibility

- **docs/features/ui-improvements.md** — detailed UI improvements description:
    - Before/After comparison for all elements
    - CSS techniques and effects
    - Color palette and spacing
    - Performance and accessibility

### Technical Details

- **New functions in QuickAddCard.vue**:
    - `parseBatchInput(text)` — parse textarea into `{front, back}[]` array
    - `validateBatchInput()` — batch data validation with detailed errors
    - `handleBatchAdd()` — sequential card submission
    - `switchMode(newMode)` — mode switching with error clearing

- **CSS Improvements**:
    - Multi-layered box-shadows
    - Advanced gradients (145deg angle)
    - Filter effects (drop-shadow for glow)
    - Transform animations (GPU-accelerated)
    - Inset shadows for depth
    - Improved color contrasts (#60a5fa, #cbd5e1, #f1f5f9)

### Verified

- ✅ ESLint frontend check passed (Exit code: 0)
- ✅ Markdownlint documentation check passed
- ✅ Component fully backward compatible
- ✅ No backend changes required

---

## [0.2.0] - 2026-01-05 22:34

### Added

#### Frontend: Cards Management

- **Entity Layer**
    - API service for cards (`shared/api/cards.js`) with full CRUD functionality
    - TypeScript types (`shared/types/card.ts`): CardState enum, Card interface, DTOs, CourseStats
    - Pinia store (`entities/card/model/useCardStore.js`) with reactive state management
    - Getters: `getCardsByCourse`, `getCourseStats`
    - Actions: `fetchCardsByCourse`, `fetchCourseStats`, `createCard`, `updateCard`, `deleteCard`
    - Auto-update statistics after create/delete operations

- **Widgets**
    - `CardItem.vue` — card with CSS 3D flip animation (question ↔ answer)
    - State badges (New, Learning, Review, Relearning) with color indication
    - Due date formatting ("Today", "Tomorrow", "In N days")
    - Line clamp for long text truncation
    - Hover effects for Edit/Delete buttons
    - `CardList.vue` — card list with loading skeleton and empty state
    - `CardEditorModal.vue` — create/edit modal with validation
    - Character counters for front/back (max 10000 chars)
    - `QuickAddCard.vue` — inline quick add form
    - Auto-clear form after successful addition
    - Responsive grid layout (desktop: 2 cols, mobile: 1 col)

- **Pages Integration**
    - Full CoursePage integration with card management
    - Stats Grid: Total, New, Review, Due Today
    - Training button with dynamic text and disabled state
    - CRUD handlers with confirm dialogs for deletion
    - Dual mode support: Quick Add + Modal Editor

### Fixed

- **Backend Routes Conflict**
    - Fixed route conflict in `routes/index.ts`
    - Added `/courses` prefix for coursesRouter
    - `GET /api/courses` is now correctly handled without "Invalid course ID" error
    - Route registration order: courses → cards → training → settings

### Changed

- **CoursePage.vue**
    - Switch from mock data to real API requests
    - Integration of useCourseStore and useCardStore
    - Computed properties for reactive data
    - Loading states and error handling
    - Stats display with hover effects

### Documentation

- **Cards_Frontend_Implementation_Plan.md** — detailed frontend implementation plan for cards
- **Cards_Frontend_Walkthrough.md** — comprehensive walkthrough describing all components
    - Overview of 8 created files
    - API endpoints integration
    - Architecture highlights (Feature-Sliced Design)
    - Manual testing plan
    - UX Features description

### Verified

- ✅ ESLint check passed (Exit code: 0)
- ✅ TypeScript compilation successful
- ✅ Frontend dev server running (Vite on localhost:5173)
- ✅ Backend routes fixed and compiled

### Technical Details

- Files created: 8 (3 Entity Layer + 4 Widgets + 1 Page integration)
- API endpoints used: 5 (getByCourseId, create, update, delete, getCourseStats)
- Feature-Sliced Design adhered to in all layers
- State management: Pinia stores with local state auto-update

---

## [0.2.0] - 2026-01-05 21:35

### Added

#### Backend: Cards and FSRS System

- **Database Schema extended for FSRS**
    - `CardsTable` — cards with full set of FSRS fields:
        - `due`, `stability`, `difficulty`, `elapsedDays`, `scheduledDays`
        - `reps`, `lapses`, `state`, `lastReview`, `stepIndex`
    - `SettingsTable` — global application settings
    - `CourseSettingsTable` — individual course settings
    - Indexes for optimization: `courseId`, `due`, `state`

- **Migration System with tracking**
    - `_migrations` table to track applied migrations
    - 4 separate migrations: courses, cards, settings, courseSettings
    - `runMigrations()` function — automatic application of missing migrations
    - Idempotency: `.ifNotExists()` for all `createTable()` and `createIndex()`
    - Migration process logging

- **FSRS Service (`services/fsrs/index.ts`)**
    - Integration of `ts-fsrs` spaced repetition library
    - Custom Learning Steps: 10 minutes → 4 hours → REVIEW
    - State Machine: NEW → LEARNING → REVIEW → RELEARNING
    - `calculateNextReview()` — interval calculation considering Rating
    - `canShowNewCards()` — time constraint check (4 hours till end of day)
    - `initializeNewCard()` — create card with default FSRS values

- **Repositories**
    - `CardRepository` — CRUD + getDueCards + getCourseStats
    - `SettingsRepository` — global + course + getEffectiveSettings
    - Singleton instances for convenient usage

- **Validation Schemas (Zod)**
    - `schemas/card.ts`: CreateCard, UpdateCard, ReviewCard (Rating 1-4)
    - `schemas/settings.ts`: GlobalSettings, CourseSettings with JSON validation

- **REST API Endpoints (13 endpoints)**
    - **Cards API** (`routes/cards.ts`):
        - `GET /api/courses/:courseId/cards` — card list
        - `POST /api/courses/:courseId/cards` — create
        - `GET /api/cards/:id` — get
        - `PUT /api/cards/:id` — update
        - `DELETE /api/cards/:id` — delete
        - `GET /api/courses/:courseId/stats` — statistics
    - **Training API** (`routes/training.ts`):
        - `GET /api/courses/:courseId/due-cards` — cards due
        - `POST /api/training/review` — submit review result
    - **Settings API** (`routes/settings.ts`):
        - `GET /api/settings` — global settings
        - `PUT /api/settings` — update global
        - `GET /api/courses/:courseId/settings` — course settings
        - `PUT /api/courses/:courseId/settings` — update course settings
        - `DELETE /api/courses/:courseId/settings` — reset to global

### Changed

- **backend/src/services/database/index.ts**
    - Changed DB initialization logic: migrations applied always, not just for new DB
    - Replaced `up(dbInstance)` with `runMigrations(dbInstance)`

- **backend/src/services/database/migrations.ts**
    - Full transition to migration tracking system
    - Split into separate migrations instead of one monolithic `up()` function
    - Added `rollbackAllMigrations()` function for testing

- **backend/src/routes/index.ts**
    - Registered new routes: cards, training, settings

### Fixed

- **TypeScript errors**
    - FSRS imports: usage of `Rating` enum from ts-fsrs (with `as any` type cast for compatibility)
    - Zod schema syntax: fixed `ReviewCardSchema` (removed `errorMap`, used `message`)
    - ZodError handling: replaced `.errors` with `.issues` in all routes
    - Removed unused imports (`NewCard` in cardRepository)

- **Code Formatting**
    - Applied prettier to all backend files
    - Fixed line breaks and indentation

### Documentation

- **Backend_Cards_FSRS_Walkthrough.md** — comprehensive walkthrough of implementation
    - Overview of all created files
    - 13 API endpoints with examples
    - Database schema with FSRS fields
    - Detailed FSRS State Machine description
    - Verification and compilation results

- **Migration_System_Walkthrough.md** — detailed migration system documentation
    - Tracking system architecture
    - List of migrations and their content
    - Fixed issues (ifNotExists)
    - Testing results on existing DB
    - Guide for adding new migrations

- **Cards_FSRS_Implementation_Plan.md** — technical implementation plan
- **Cards_FSRS_Architecture.md** — Mermaid architecture diagrams
- **Cards_FSRS_Tasks.md** — detailed checklist
- **docs/Task.md** — updated progress (Phase 4 Backend completed)

### Verified

- ✅ TypeScript compilation without errors
- ✅ Prettier formatting applied
- ✅ Migration system works on existing DB (4 migrations applied successfully)
- ✅ Server starts and listens on dynamic port
- ✅ Tables created: `_migrations`, `courses`, `cards`, `settings`, `courseSettings`
- ✅ Indexes created for all necessary fields

### Dependencies

- Added dependency: `ts-fsrs` (TypeScript FSRS library)

## [0.1.0] - 2026-01-05 18:52

### Fixed

- **Fixed all markdown linting errors in documentation**:
    - `Implementation_Plan.md` — split long lines, fixed heading hierarchy (h5→h4),
      added language for code block
    - `Frontend_Integration_Plan.md` — split long lines, fixed blockquotes
    - `Testing_API.md` — added blank lines around code blocks (MD031)
    - `Walkthrough.md` — removed trailing punctuation from headers, split long lines
    - Automatically fixed blank lines around lists (MD032) in all files
    - Automatically removed trailing spaces (MD009)

### Changed

- **`.markdownlint.json`** — disabled MD028 (no-blanks-blockquote) rule as it conflicts with
  GitHub Alert blocks syntax (`[!IMPORTANT]`, `[!WARNING]`, `[!NOTE]`)

### Verified

- ✅ All 8 markdown files in `docs/` pass `markdownlint-cli2` check without errors

## [0.1.0] - 2026-01-05 18:30

### Added

- **Extended project documentation**:
    - Added missing points from "Technical Specifications" section to `Task.md`
    - Added detailed sections to `Implementation_Plan.md`:
        - Settings (global and course)
        - Notification system with time of day check
        - Tray integration (minimize to tray)
        - Extended features (statistics, import/export, media, search, tags)
    - Added "Next Implementation Stages" section to `Walkthrough.md`

### Changed

- **Project Renaming**: "Anki Tiny" → "Repetitio"
    - Updated all `package.json` (root, frontend, backend)
    - Updated names in UI: TitleBar, router, console.log
    - Updated all documentation: README, Task.md, Implementation_Plan.md, Walkthrough.md
    - Renamed DB: `anki.db` → `repetitio.db`
    - Updated comments and tooltip in Electron Tray
    - Fixed typo in `frontend/package.json`: "Fontend" → "Frontend"

---

## [0.1.0] - 2026-01-05 18:08

### Added

#### Frontend: Courses Management

- **Data Layer**
    - API service for courses (`shared/api/courses.js`) with full CRUD functionality
    - TypeScript types for courses (`shared/types/course.ts`)
    - Pinia store (`entities/course/model/useCourseStore.js`) with reactive state management
    - Getters: `sortedCourses`, `getCourseById`
    - Actions: `fetchCourses`, `createCourse`, `updateCourse`, `deleteCourse`

- **UI Components**
    - Extended `Input.vue` to support textarea mode with rows attribute
    - Created `Modal.vue` with backdrop blur, ESC/click-outside closure, animations
    - Slots for header and footer in modal window

- **Widgets**
    - `CourseCard.vue` — course card with hover effects, Edit/Delete buttons
    - `CourseList.vue` — grid layout for displaying course list
    - `CourseEditorModal.vue` — course creation/editing modal with validation

- **Pages**
    - Full `HomePage.vue` integration with Pinia store
    - CRUD operations for courses
    - Empty state for new users
    - Loading states

### Changed

- **frontend/src/app/main.js**
    - Pinia store manager integration
    - Dynamic backend URL determination based on Electron port
    - Application initialization after receiving backend port via IPC

- **frontend/src/shared/api/client.js**
    - Updated to work with global variable `window.__BACKEND_URL__`

### Fixed

- Backend port transmission — application correctly receives dynamic port via IPC
- Code formatting in Vue components

### Documentation

- Created `docs/Frontend_Integration_Plan.md` with detailed implementation plan
- Created `docs/Walkthrough_Frontend_Courses.md` with documentation of all components
- Updated `docs/Task.md` with progress

### Verified

- ✅ Loading course list from backend API
- ✅ Creating new course via UI
- ✅ Backend port transmission via Electron IPC

## [0.1.0] - 2026-01-05 17:04

### Changed

#### Project Structure: NPM Workspaces

- **Monorepo structure refactoring**

    - Created root `package.json` with npm workspaces support
    - Frontend and backend declared as separate workspaces
    - Centralized dependency management via root package.json

- **Simplification of development commands**

    - `dev` and `bundle` commands moved from `backend/package.json` to root
    - `npm run dev` now runs from project root
    - `npm run bundle` builds frontend, backend and creates installer
    - Added common `lint` and `format` commands for all workspaces

- **Updated documentation**

    - README.md updated with instructions on using workspaces
    - Created `docs/Workspaces.md` with full guide on working with workspaces
    - Described installation, development and build commands

### Technical Details

- npm workspaces allow:

    - Install all dependencies with one command (`npm install` from root)
    - Use hoisting for shared dependencies
    - Run commands for specific workspaces: `npm run <script> --workspace=<name>`
    - Simplify CI/CD pipeline

## [0.1.0] - 2026-01-05 16:50

### Added

#### Development Experience

- **Hot-Reload for frontend in development mode**

    - Electron now loads frontend from Vite dev server (`http://localhost:5173`) in dev mode
    - All frontend changes are visible instantly without app restart
    - DevTools open automatically in development mode
    - Installed `concurrently` package for running processes in parallel
    - `npm run dev` command runs frontend and backend simultaneously
    - Colored console to separate logs (frontend - blue, backend - green)

### Changed

- **backend/src/electron/main.ts**
    - Changed Electron import to namespace import for compatibility
    - Added logic to load from Vite dev server in development mode
    - Registration of custom `lmorozanki://` protocol only for production
    - Allowed navigation to localhost in dev mode

- **backend/package.json**
    - Updated `dev` and `electron:dev` commands for parallel execution
    - Added `concurrently` dependency

### Fixed

- **backend/src/config/index.ts** — fixed ESLint error with ternary operator formatting

## [0.1.0] - 2026-01-05 16:11

### Added

#### Backend: Database Service (2026-01-05)

- **Database Layer with Kysely + better-sqlite3**
    - Application configuration (`config/index.ts`) with DB path
    - TypeScript schema for tables (`services/database/schema.ts`)
    - Automatic migrations for `courses` table
    - Singleton Database Service initialized in `userData/repetitio.db`

- **Course Repository**
    - CRUD operations: `findAll()`, `findById()`, `create()`, `update()`, `delete()`
    - Automatic `updatedAt` update on change

#### Backend: Courses API (2026-01-05)

- **REST API endpoints for course management**
    - `GET /api/courses` — list all courses
    - `POST /api/courses` — create new course
    - `GET /api/courses/:id` — get course by ID
    - `PUT /api/courses/:id` — update course
    - `DELETE /api/courses/:id` — delete course

- **Validation with Zod v4**
    - `createCourseSchema` — validation on creation (name required)
    - `updateCourseSchema` — validation on update (all fields optional)
    - Detailed error messages via `issues`

#### Infrastructure (2026-01-05)

- **Utilities**
    - Pino logger with pretty printing (`utils/logger.ts`)
    - Performance Timer for debugging (`utils/performance.ts`)

- **Electron configuration**
    - Added scripts: `rebuild`, `postinstall` for better-sqlite3
    - Installed `electron-rebuild` for native modules

- **Documentation**
    - `docs/Testing_API.md` — instructions for testing API via DevTools
    - Updated `docs/Walkthrough.md` with description of implemented features
    - Updated `docs/Task.md` with progress

### Changed

- `backend/src/server.ts` — integration of Database Service, removed old services
- `backend/src/electron/main.ts` — restored TypeScript version with correct imports
- `backend/package.json`, `frontend/package.json` — updated version to 0.1.0

### Technical Details

- Database: SQLite in `userData/repetitio.db`
- ORM: Kysely v0.27 with full type safety
- Validation: Zod v4
- Types installed: `@types/better-sqlite3`

## [Unreleased] - 2026-01-05 14:25

### Added

#### Frontend Architecture

- **Feature-Sliced Design structure**
    - Implemented full frontend architecture (app, pages, widgets, features, entities, shared layers)
    - Configured Vue Router with hash mode to work with custom protocol `lmorozanki://`
    - Created TypeScript types for Electron API integration

- **Custom Title Bar**
    - Frameless window with draggable area for moving
    - Window control buttons: Minimize, Maximize/Restore, Close
    - Integration with Electron IPC handlers
    - Backdrop blur effect (Acrylic material on Windows 11)

- **UI components (shared/ui)**
    - `Button.vue` — 4 variants (primary, secondary, danger, ghost), 3 sizes
    - `Input.vue` — with label, error states, validation
    - `Card.vue` — with backdrop blur and hover effects

- **Application Pages**
    - `HomePage` — course list, empty state, create new course button
    - `CoursePage` — detailed course view, statistics, card management
    - `TrainingPage` — review interface with flip cards
    - `SettingsPage` — training time settings (start/end of day)

- **API integration**
    - HTTP client based on axios with dynamic backend port determination
    - API client ready for integration with backend endpoints

- **Assets**
    - Roboto Fonts (Web Font)
    - Application CSS styles
    - Placeholder images

#### Documentation

- **README.md extended**
    - Added Contents
    - Described data structures (Course, Card, Settings)
    - Detailed Technology Stack description
    - Architecture diagram (Frontend & Backend)
    - Application Features with implementation status
    - Current Status (Phases 1-2 completed)
    - Prerequisites and Installation instructions

- **Walkthrough documentation**
    - `implementation_plan.md` — architectural implementation plan
    - `walkthrough.md` — detailed walkthrough of created architecture
    - `task.md` — checklist of tasks with progress

#### Infrastructure

- **Linting**
    - Added npm `lint` script in frontend/package.json
    - All ESLint errors fixed (self-closing tags in Vue components)
    - All Markdownlint errors fixed in README.md

### Changed

- `frontend/index.html` — updated title to "Repetitio", removed extra Tailwind classes
- `frontend/package.json` — added lint script

### Fixed

- Fixed paths to frontend/backend directories (2026-01-05, commits 57a6f49, 32dba9d)
- Fixed backend/package.json (2026-01-05, commit 631e629)

## [0.0.0] - 2026-01-05 03:04

### Initial Release

- Initial project scaffolding (commit 1ef8e25)
- `.gitignore` file (commit 9d80175)
- Exclusion of `.agent` directory from git (commit 1746e22)
- Basic README.md structure with development philosophy

---

## Legend

- **Added** — new features
- **Changed** — changes in existing functionality
- **Deprecated** — functionality to be removed soon
- **Removed** — removed functionality
- **Fixed** — bug fixes
- **Security** — security fixes
