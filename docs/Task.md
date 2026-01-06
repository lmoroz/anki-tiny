# Repetitio Implementation Tasks

## Phase 1: Architecture and Setup ✅

- [x] Create project structure using Feature-Sliced Design
- [x] Configure routing considering custom protocol `lmorozanki://`
- [x] Create global types for Electron API

## Phase 2: UI Framework and Custom Title Bar ✅

- [x] Implement custom window title bar
- [x] Configure basic UI components

## Phase 3: Core Functionality - Courses ✅

### Backend ✅

- [x] **Database Service**
    - [x] Application configuration
    - [x] DB schema with Kysely types
    - [x] Migrations for courses table
    - [x] Singleton Database Service
- [x] **Courses API**
    - [x] Course Repository (CRUD)
    - [x] Validation schemas (Zod)
    - [x] API Routes (GET, POST, PUT, DELETE)
    - [x] Integration into Express server

### Frontend - Course Management ✅

- [x] **Data Layer**
    - [x] API client with backend port auto-detection
    - [x] Pinia store for courses
    - [x] TypeScript types for entities
- [x] **UI Layer - Shared Components**
    - [x] Input component (with textarea support)
    - [x] Modal component
- [x] **UI Layer - Widgets**
    - [x] CourseList widget
    - [x] CourseCard component
    - [x] CourseEditorModal
- [x] **Pages**
    - [x] HomePage with full CRUD functionality
- [x] **Testing**
    - [x] Loading course list
    - [x] Creating a course

---

## Phase 4: Cards and FSRS ✅

### Backend (Completed)

- [x] **Database Schema**
    - [x] Update `schema.ts` with `CardsTable`, `SettingsTable`, `CourseSettingsTable`
    - [x] Add FSRS-specific fields (stability, difficulty, state, reps, lapses)
    - [x] Update `Database` interface

- [x] **Database Migrations**
    - [x] Create migration `002_create_cards_table.sql`
    - [x] Create migration `003_create_settings_table.sql`
    - [x] Create migration `004_create_course_settings_table.sql`
    - [x] Define indices (courseId, due, state)

- [x] **FSRS Service**
    - [x] Install `ts-fsrs` package
    - [x] Create `services/fsrs/index.ts`
    - [x] Implement `calculateNextReview()`
    - [x] Implement Learning Steps logic
    - [x] Implement `canShowNewCards()`
    - [x] Implement `initializeNewCard()`

- [x] **Repositories**
    - [x] Card Repository (CRUD + getDueCards + getCourseStats)
    - [x] Settings Repository (global + course + getEffectiveSettings)

- [x] **Validation Schemas**
    - [x] Create `schemas/card.ts` (Create, Update, Review)
    - [x] Create `schemas/settings.ts` (Global, Course)

- [x] **API Routes**
    - [x] `routes/cards.ts` (6 endpoints)
    - [x] `routes/training.ts` (2 endpoints)
    - [x] `routes/settings.ts` (5 endpoints)
    - [x] Register in `routes/index.ts`

- [x] **Bug Fixes and Formatting**
    - [x] FSRS Rating types
    - [x] Zod schema syntax
    - [x] ZodError handling
    - [x] Prettier formatting
    - [x] TypeScript compilation

### Frontend - Cards and Training (In Progress)

- [x] **Entity Layer**
    - [x] API service for cards (`shared/api/cards.js`)
    - [x] Pinia store for cards (`entities/card/model/useCardStore.js`)
    - [x] TypeScript types (`shared/types/card.ts`: CardState enum, Card interface)

- [x] **Widgets**
    - [x] CardList widget (`widgets/card-list/CardList.vue`)
    - [x] CardItem component (`widgets/card-list/CardItem.vue`)
    - [x] CardEditorModal (`widgets/card-editor/CardEditorModal.vue`)
    - [x] QuickAddCard component (`widgets/quick-add-card/QuickAddCard.vue`)

- [x] **Pages Integration**
    - [x] CoursePage - card management integration (CRUD operations)
    - [ ] TrainingPage - training interface with FSRS (next stage)
- [x] SettingsPage - global and individual settings

## Phase 5: Settings Page (SettingsPage) ✅

### Backend ✅

- [x] API Endpoints (GET/PUT Settings, Course Settings)
- [x] Validation (Zod schemas)

### Frontend ✅

- [x] **Entity Layer**
    - [x] Settings API Client
    - [x] Pinia Store (Inheritance logic)
    - [x] TypeScript Types
- [x] **Widgets**
    - [x] SettingsForm (Validation, Preview)
    - [x] CourseSettingsModal (Override/Reset)
    - [x] TimeRangePicker Component
- [x] **Pages**
    - [x] SettingsPage (Global & Courses list)
    - [x] CoursePage Integration (Settings button)
- [x] **Features**
    - [x] Dark Theme Adaptation
    - [x] Time Range Validation
    - [x] Default Settings Fallback

---

## Phase 5: System Integration (Planned)

### Notification System

- [ ] **Backend Notifications Service**
    - [ ] Check due cards every hour
    - [ ] Filter by training time
    - [ ] Check "do not offer new cards if < 4 hours to end of day"
    - [ ] Electron Notification API integration

- [ ] **Electron Main Process**
    - [ ] IPC handlers for notifications
    - [ ] System notifications Windows/Linux/macOS

- [ ] **Frontend**
    - [ ] Notification frequency settings
    - [ ] UI notification test

### Tray Integration

- [ ] **Electron Main Process**
    - [ ] Create Tray icon
    - [ ] Tray menu (Open, Quit)
    - [ ] Change window-close: hide instead of quit
    - [ ] Show window from tray

---

## Phase 6: Extended Functionality (Optional)

- [ ] **Learning Progress Statistics**
    - [ ] Backend: API for statistics
    - [ ] Frontend: Dashboard page with charts

- [ ] **Course Import/Export**
    - [ ] Backend: JSON export/import endpoints
    - [ ] Frontend: Import/export UI

- [ ] **Media in Cards**
    - [ ] Backend: File upload endpoints
    - [ ] Database: media_files table
    - [ ] Frontend: Image/Audio upload components

- [ ] **Card Search**
    - [ ] Backend: Full-text search API
    - [ ] Frontend: SearchBar component

- [ ] **Tags and Categories**
    - [ ] Database: tags table, card_tags relation
    - [ ] Backend: Tags API
    - [ ] Frontend: Tag management UI

---

## Current Status

**✅ Completed:** Backend Implementation of Cards and FSRS

- Database schema (3 new tables)
- FSRS Service with learning steps
- 13 API endpoints
- TypeScript compilation successful
- Code formatting applied

**✅ Completed:** Frontend Course Integration (CRUD fully working)

**✅ Completed:** Frontend Cards Integration (Card management in Course)

- Entity Layer: API client, Pinia store, TypeScript types
- Widgets: CardItem (with flip animation), CardList, CardEditorModal, QuickAddCard
- CoursePage integration: full CRUD, statistics, validation
- ESLint check passed

**📋 Documentation:**

- [Backend_Cards_FSRS_Walkthrough.md](Backend_Cards_FSRS_Walkthrough.md)
- [Cards_FSRS_Implementation_Plan.md](Cards_FSRS_Implementation_Plan.md)
- [Cards_FSRS_Architecture.md](Cards_FSRS_Architecture.md)

**⏭️ Next Steps:** TrainingPage (training interface with FSRS) → SettingsPage

> [!NOTE]
> Frontend Vite dev server is running (localhost:5173).
> Detected Electron backend startup error (import issue in main.js) - requires separate fix.
