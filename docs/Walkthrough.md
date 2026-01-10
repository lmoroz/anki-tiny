# Walkthrough: Repetitio Project Development

## Project Overview

**Repetitio** — desktop-приложение для изучения материала с помощью карточек и интервального повторения (spaced repetition), построенное на базе FSRS v5 алгоритма.

**Версия**: 0.9.0 (MVP Feature Complete + Real-time Stats SSE)

**Разработка**: AI-assisted development с human-in-the-loop подходом

---

## Development Timeline

### Phase 1: Architecture & Foundation ✅

**Stack выбран**:

- Frontend: Vue 3 + Vite + TailwindCSS v4 + Pinia
- Backend: Node.js + TypeScript + Express + Electron
- Database: SQLite + Kysely (query builder)
- Algorithm: ts-fsrs v5.2+

**Реализовано**:

- Feature-Sliced Design для frontend
- Layered Architecture для backend
- Custom protocol `lmorozanki://` для Electron
- Database с системой миграций
- Custom Title Bar с acrylic blur (Windows 11)

### Phase 2: Styling System ✅

**OpenSpec Change**: `2026-01-06-systemize-styling`

**Реализовано**:

- Централизованная система CSS-переменных
- Dark/Light theme support
- Design tokens (colors, typography, shadows, borders)
- Premium UI aesthetics с современными градиентами
- Responsive design система

**Файлы**:

- `frontend/src/app/assets/css/styles.css` — centralized CSS variables

### Phase 3: Settings System ✅

**OpenSpec Changes**:

- `2026-01-06-add-settings-page`
- `2026-01-06-replace-time-selects`

**Реализовано**:

#### Global Settings

- Training time range (trainingStartTime, trainingEndTime)
- FSRS parameters:
  - `learningSteps` — массив интервалов в минутах (e.g., [10, 1440, 4320])
  - `requestRetention` — интенсивность обучения (0.70-1.00), три уровня:
    - **Low (0.80)** — Расслабленный режим, меньше повторений
    - **Medium (0.90)** — Стандартный режим (по умолчанию)
    - **High (0.95)** — Cramming, много повторений для экзаменов
  - `enableFuzz` — добавление рандомизации к интервалам
- Daily limits:
  - `globalNewCardsPerDay` — глобальный лимит новых карточек (aggregate)
  - `globalMaxReviewsPerDay` — глобальный лимит повторений
- Default course limits (fallbacks для курсов без индивидуальных настроек)
- Session limits (per training session)
- Notifications toggle

#### Course Settings

- Полное наследование от global settings
- Возможность override любого параметра
- `null` = inherit from global
- Individual time ranges, FSRS params, limits per course
- **Retention inheritance**: курсы могут наследовать глобальное значение или установить своё

#### UI Components

- **ScrollTimePicker.vue** — generic scroll picker для hour/minute selection
- **TimeRangePicker.vue** — диапазон времени с двумя парами пикеров
- **SettingsForm.vue** — unified form для global и course settings, организованная в сворачиваемые секции:
  - Временные рамки тренировок
  - Параметры FSRS (learningSteps, enableFuzz, requestRetention)
  - Уведомления
  - Дневные лимиты (глобальные)
  - Лимиты курсов по умолчанию
- **CourseSettingsModal.vue** — modal для редактирования настроек курса
- **CollapsibleSection.vue** — сворачиваемые секции с сохранением состояния в localStorage
- **RetentionLevelPicker.vue** — компонент выбора интенсивности обучения с radio buttons

**Specs**:

- `settings-global-management`
- `settings-course-management`
- `settings-ui`
- `settings-ui-sections` (NEW)
- `settings-retention` (NEW)

### Phase 4: Course & Card Management ✅

**OpenSpec Changes**:

- `2026-01-07-redesign-course-layout`
- `2026-01-07-card-edit-form`
- `2026-01-07-add-batch-card-delete`

**Реализовано**:

#### Course Management

- Full CRUD operations
- Course statistics на главной странице:
  - Total cards count
  - New cards count
  - Last training date (formatted)
- Responsive layout с slide-out panels на mobile
- Settings inheritance visualization

#### Card Management

- Full CRUD с модальными окнами
- **QuickAdd режим** — inline добавление карточек
- **Batch Add** — массовое добавление через текст (`question | answer` format)
- **Batch Delete** — выбор нескольких карточек с custom checkboxes
- **Delete All** — очистка всего курса с подтверждением
- **Card Editor** — modal для редактирования с автоматическим:
  - Progress reset (card становится New)
  - Visual feedback (scroll to card + bounce animation)

#### Visual Feedback

- `useScrollAndHighlight` composable для прокрутки к карточке
- Bounce animation (`bounce-in-bck`) при создании/редактировании
- Opacity transitions в selection mode
- Custom checkbox component с gradient styling

**Specs**:

- `course-ui`

### Phase 5: Training System ✅

**OpenSpec Change**: `2026-01-07-add-training-limits`

**Реализовано**:

#### FSRS Integration

- Full ts-fsrs v5 integration
- Custom parameters support
- Card states: New, Learning, Review, Relearning
- FSRS metrics: stability, difficulty, scheduled days, reps, lapses

#### Training Page

- Card-based review interface
- Flip animation (click to reveal answer)
- Answer buttons:
  - **Снова** (Again) — danger variant, red
  - **Сложно** (Hard) — secondary variant, gray
  - **Хорошо** (Good) — primary variant, blue
  - **Легко** (Easy) — success variant, green
- Session states:
  - Loading (spinner animation)
  - Training (card + buttons)
  - Complete (success message + navigation)
  - Empty (no cards available)

#### 4-Tier Limits System

**Иерархия лимитов** (от высшего к низшему):

1. **Global Daily Limits** (aggregate across all courses)
   - `globalNewCardsPerDay` (default: 20)
   - `globalMaxReviewsPerDay` (default: 200)

2. **Course Daily Limits** (per-course)
   - `newCardsPerDay` (null = inherit from default)
   - `maxReviewsPerDay` (null = inherit from default)
   - Constrains global limits

3. **Session Limits** (per training session)
   - `newCardsPerSession` (default: 10)
   - `maxReviewsPerSession` (default: 50)
   - Partitions daily limits

4. **Daily Progress Tracking**
   - Table: `dailyProgress` (date, courseId, newCardsStudied, reviewsCompleted)
   - Reset mechanism: based on `trainingStartTime` (NOT midnight)
   - Lazy reset: check on each request, no cron needed

**Формула расчета**:

```
availableCards = min(
  sessionLimit,
  courseRemainingDaily,
  globalRemainingDaily
)
```

**API**:

- `GET /api/courses/:courseId/due-cards?session=true` — returns cards with limit metadata
- `POST /api/training/review` — updates daily progress
- `GET /api/training/stats` — retrieves daily statistics

**Services**:

- `limitService.ts` — business logic для расчета лимитов
- `progressRepository.ts` — отслеживание дневного прогресса

**Specs**:

- `training-limits`

### Phase 6: UI Enhancements ✅

**OpenSpec Change**: `2026-01-07-replace-dialogs`

**Реализовано**:

#### Custom Dialogs & Notifications

**Toast Notifications** (vue3-toastify):

- Position: top-right
- AutoClose: 3000ms
- Theme: auto (light/dark)
- Usage: `toast.success()`, `toast.error()`
- CSS variables integration

**Custom ConfirmDialog**:

- Modal dialog с backdrop
- Props: title, message, confirmText, cancelText
- Animations: fadeIn (backdrop), slideIn (content), 300ms ease
- Closes on: backdrop click, Escape key, button clicks
- Accessibility: `role="dialog"`, `aria-modal="true"`, keyboard nav

**useConfirm Composable**:

- Promise-based API: `const {confirm} = useConfirm()`
- Usage: `const result = await confirm(message | options)`
- Returns: Promise<boolean>
- Dynamic mounting/unmounting

**Migration**:

- Replaced 4× `alert()` calls → toasts
- Replaced 5× `confirm()` calls → custom dialog
- Полная замена нативных диалогов

**Specs**:

- `ui-notifications`

#### Button Component Extensions

**New sizes**:

- `xs` — 4px/8px padding, extra small text

**New variants**:

- `success` — green theme для положительных действий
- `ghost` — transparent background, border only

**Improvements**:

- Enhanced shadows: `0 10px 20px -5px` (deeper, modern)
- All sizes use CSS variables
- Better hover states

### Phase 7: Statistics & Polish ✅

**Latest Changes** (2026-01-08):

#### Course Statistics on Home Page

- Backend: `cardRepository.getAllCoursesStats()` — one query for all courses
- API: `GET /api/courses` теперь возвращает `stats` для каждого курса
- Frontend: `CourseCard.vue` footer displays:
  - Total cards with Russian declension
  - New cards count (if any) с иконкой
  - Last training date (human-readable: "сегодня", "вчера", "3 дня назад")

#### Training UI Redesign

**Complete rewrite of `TrainingPage.vue` with 3D card flip animation**:

- **3D Card Flip Animation**:
  - True 3D transform with `backface-hidden` rendering
  - Smooth `transform: rotateY(180deg)` transition (0.7s)
  - Perspective-based depth effect (`perspective: 1000px`)
  - No more `display: none` flickering — both sides always rendered

- **Auto-Scaling Text Composables**:
  - `textFit.js` — Binary search algorithm for optimal font sizing
    - Dynamically adjusts `font-size` from 12px to 100px
    - O(log N) complexity (~7 iterations)
    - Calculates based on container dimensions (width, height)
  - `useAutoFitText.js` — Vue composable for reactive text fitting
    - `ResizeObserver` for window resize handling
    - `watch()` for text content changes (flush: 'post')
    - Debounced recalculation (100ms) for performance
    - Lifecycle management: cleanup on flip/unmount

- **Improved Layout Responsiveness**:
  - Dynamic viewport sizing: `width: clamp(50vw, 800px, 97vw)`
  - Dynamic card height: `min/max-height: calc(100dvh - 280px)`
  - Removed fixed font sizes, replaced with dynamic scaling
  - Smooth font-size transitions (0.1s linear)

- **Enhanced Visual Feedback**:
  - Answer buttons with visual hover/active states
  - Session state management (loading, training, complete, empty)
  - Limit counters with badges
  - Course indicator badge (global training mode)

**Backend: Developer Tooling Updates**:

- **Electron Preload Script Migration**:
  - Migrated `preload.ts` → `preload.cjs` (CommonJS required for Electron)
  - JSDoc type annotations for TypeScript compatibility
  - Removed unused `openNewWindow` IPC handler

- **TypeScript Configuration** (`tsconfig.json`):
  - Enabled `allowArbitraryExtensions: true` for `.cjs` support
  - Enabled `declarationMap: true` for source maps

- **Package Scripts** (`backend/package.json`):
  - Added `codegen` for Kysely type generation
  - Updated `electron:dev` to use `tsx` for direct TS execution
  - Changed `main` entry point to `src/electron/main.ts`

**Code Formatting Standardization**:

- Aligned all code with Prettier defaults (removed semicolons)
- Added `semi: 0` to ESLint config for consistency
- Formatted 30+ backend files for uniform style

**Files Created**:

- `frontend/src/pages/training/composables/textFit.js`
- `frontend/src/pages/training/composables/useAutoFitText.js`

#### Data Model Simplification

- **Removed `elapsedDays` field**:
  - Не используется FSRS (рассчитывается внутренне)
  - Упрощена модель данных
  - Updated: schema, repositories, API routes, frontend types

---

## Current Architecture

### Frontend Structure (FSD)

```
frontend/src/
├── app/              # Application initialization
│   ├── main.js       # Entry point (Vue app, router, pinia, toasts)
│   ├── App.vue
│   └── router/       # Vue Router config
├── pages/           # Pages
│   ├── home/        # HomePage (course list + stats)
│   ├── course/      # CoursePage (card management)
│   ├── training/    # TrainingPage (FSRS review)
│   └── settings/    # SettingsPage (global settings)
├── widgets/         # Composite UI blocks
│   ├── title-bar/   # Custom window title bar
│   ├── course-list/ # Course grid/list
│   ├── card-list/   # Card list с batch operations
│   ├── card-editor/ # Card edit modal
│   ├── course-settings-modal/
│   └── settings-form/
├── features/        # Business features
│   ├── create-course/
│   ├── add-card/
│   └── spaced-repetition/
├── entities/        # Business entities
│   ├── course/
│   │   └── model/useCoursesStore.js
│   ├── card/
│   │   └── model/useCardStore.js
│   ├── settings/
│   │   └── model/useSettingsStore.js
│   └── training/
│       └── model/useTrainingStore.js
└── shared/          # Reusable code
    ├── ui/          # UI components (Button, Input, Modal, etc.)
    ├── api/         # HTTP client & API methods
    ├── lib/         # Utilities (composables)
    └── types/       # TypeScript types
```

### Backend Structure

```
backend/src/
├── electron/        # Electron main process
│   ├── main.ts      # Entry point, lmorozanki:// protocol
│   └── preload.ts   # IPC bridge
├── routes/          # API endpoints
│   ├── courses.ts   # Course CRUD + stats
│   ├── cards.ts     # Card CRUD + batch operations
│   ├── training.ts  # Training API with limits
│   └── settings.ts  # Settings CRUD
├── services/        # Business logic
│   ├── database/    # Kysely schema & migrations
│   ├── fsrs/        # FSRS integration
│   ├── limitService.ts # Training limits calculation
│   └── repositories/
│       ├── courseRepository.ts
│       ├── cardRepository.ts
│       ├── settingsRepository.ts
│       └── progressRepository.ts
├── schemas/         # Zod validation schemas
│   ├── course.ts
│   ├── card.ts
│   └── settings.ts
├── config/          # Configuration
├── utils/           # Utilities (logger)
└── server.ts        # Express server
```

---

## OpenSpec Specs (Current)

1. **course-ui** — UI управления курсами и карточками
   - Course CRUD, statistics
   - Card CRUD, batch operations
   - Visual feedback, animations

2. **settings-global-management** — глобальные настройки
   - FSRS parameters
   - Global daily limits
   - Default course limits
   - Time range

3. **settings-course-management** — настройки курсов
   - Inheritance pattern
   - Per-course overrides
   - Settings reset

4. **settings-ui** — UI настроек
   - Settings form
   - Time pickers
   - Course settings modal

5. **styling-system** — система стилей
   - CSS variables
   - Dark/light themes
   - Design tokens

6. **training-limits** — 4-уровневая система лимитов
   - Global daily limits
   - Course daily limits
   - Session limits
   - Daily progress tracking

7. **ui-notifications** — кастомные диалоги и уведомления
   - Toast notifications
   - Confirm dialog
   - useConfirm composable

---

## Key Technical Decisions

### 1. FSRS Integration

- Используем `ts-fsrs` v5.2+ (latest stable)
- Custom parameters: learningSteps, requestRetention, maximumInterval, enableFuzz
- Card states: New, Learning, Review, Relearning
- Progress reset при редактировании карточки (card becomes New)

### 2. Limits System

- 4-tier hierarchy для гибкого контроля
- Daily reset based on `trainingStartTime` (NOT midnight) — matches user's actual day cycle
- Lazy reset (no cron jobs) — check on each request
- First-come first-served между курсами для global limits

### 3. Settings Architecture

- Inheritance pattern: null = inherit from global/default
- Partial<Settings> для course settings
- Unified SettingsForm component для global и course
- Time stored as "HH:MM" strings (easy to display/validate)

### 4. UI/UX Patterns

- Custom dialogs вместо нативных (consistent design, theme support)
- Visual feedback для всех user actions (animations, toasts)
- Responsive design с slide-out panels на mobile
- Accessibility: ARIA, keyboard navigation, focus management

### 5. Database Design

- SQLite с migration system (table `_migrations`)
- Kysely для type-safe queries
- Transaction support для batch operations
- Compound indexes для performance (e.g., `date + courseId` в dailyProgress)

---

## Code Quality Standards

### Formatting

- Indentation: 2 spaces
- Line endings: LF (Unix)
- Encoding: UTF-8
- Max line length: 160 (code), 120 (markdown)

### Code Style

- If/else: opening brace on same line, `else` on new line
- Single statement: no braces (one-line)
- Multiple statements: braces required

### Imports (Frontend)

- Always use `@` alias for src imports
- Never use relative paths (`../`, `./`)
- No manual Vue component imports (unplugin-vue-components)

### Vue Files

- `<script setup>` block always ABOVE `<template>`

---

## Next Steps (v0.6-0.9 → v1.0)

### Priority 1: Desktop Integration

1. **System Tray Integration**
   - Minimize to tray instead of closing
   - Tray icon with context menu
   - Restore from tray

2. **System Notifications**
   - Native OS notifications for due cards
   - Scheduled checks (every N minutes)
   - Notification settings (enable/disable)

3. **Deep Linking**
   - Open app in training mode from notification
   - URL scheme: `lmorozanki://train/:courseId`

### Priority 2: Enhancements (Post v1.0)

- Statistics Dashboard с charts
- Import/Export (JSON, Anki)
- Media support (images, audio)
- Search & filtering
- Tags system

---

## Conclusion

**v0.5.0** — полнофункциональное SRS-приложение с:

- ✅ FSRS v5 algorithm
- ✅ Гибкой системой настроек
- ✅ 4-уровневыми лимитами
- ✅ Batch operations
- ✅ Premium UI/UX
- ✅ Dark/Light themes
- ✅ Responsive design

**v1.0** потребует только desktop integration (tray, notifications, deep linking).

Все основные функции для обучения с карточками **уже реализованы**.
