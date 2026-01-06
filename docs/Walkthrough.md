# Walkthrough: Database Service and Courses API

## Implemented Features

### 1. Database Layer

#### ✅ Configuration

Created [`config/index.ts`](file:///e:/Develop/anki-tiny/backend/src/config/index.ts):

- PORT for Express server (auto-assign from 0)
- DEBUG_PERF for performance debugging
- DATABASE_PATH - path to SQLite DB in `userData/repetitio.db`

#### ✅ Database Schema

Created [`services/database/schema.ts`](file:///e:/Develop/anki-tiny/backend/src/services/database/schema.ts):

- TypeScript types for tables via Kysely
- `CoursesTable` with fields: id, name, description, createdAt, updatedAt
- Types for CRUD operations: `Course`, `NewCourse`, `CourseUpdate`

#### ✅ Migrations

Created [`services/database/migrations.ts`](file:///e:/Develop/anki-tiny/backend/src/services/database/migrations.ts):

- `up()` function to create `courses` table
- Index on `name` field for fast lookup
- CURRENT_TIMESTAMP for automatic timestamp fields

#### ✅ Database Service

Created [`services/database/index.ts`](file:///e:/Develop/anki-tiny/backend/src/services/database/index.ts):

- Singleton pattern for Kysely instance
- `initializeDatabase()` - DB initialization with auto-migrations
- `getDatabase()` - get DB instance
- `closeDatabase()` - graceful shutdown

---

### 2. Repositories

#### ✅ Course Repository

Created [`services/repositories/courseRepository.ts`](file:///e:/Develop/anki-tiny/backend/src/services/repositories/courseRepository.ts):

- `findAll()` - get all courses sorted by createdAt
- `findById(id)` - get course by ID
- `create(data)` - create course
- `update(id, data)` - update course with automatic updatedAt
- `delete(id)` - delete course

---

### 3. API Layer

#### ✅ Validation

Created [`schemas/course.ts`](file:///e:/Develop/anki-tiny/backend/src/schemas/course.ts):

- `createCourseSchema` - creation validation (name required, max 255 chars)
- `updateCourseSchema` - update validation (all fields optional)
- Using Zod v4 with `issues` field

#### ✅ Routes

Created [`routes/courses.ts`](file:///e:/Develop/anki-tiny/backend/src/routes/courses.ts):

- `GET /api/courses` - list all courses
- `POST /api/courses` - create course
- `GET /api/courses/:id` - get course by ID
- `PUT /api/courses/:id` - update course
- `DELETE /api/courses/:id` - delete course

All endpoints include:

- Zod validation
- Error handling (400, 404, 500)
- Correct HTTP statuses

#### ✅ Router

Created [`routes/index.ts`](file:///e:/Develop/anki-tiny/backend/src/routes/index.ts):

- Connecting courses routes via `/api/courses`

---

### 4. Server Integration

#### ✅ Updated [`server.ts`](file:///e:/Develop/anki-tiny/backend/src/server.ts)

- Removed old services (`metadataCache`, `indexerService`)
- Added DB initialization in `startServer()`
- Updated `shutdown()` to close DB
- Importing routes from `./routes`

#### ✅ Utilities

Created:

- [`utils/logger.ts`](file:///e:/Develop/anki-tiny/backend/src/utils/logger.ts) - Pino logger with pretty printing
- [`utils/performance.ts`](file:///e:/Develop/anki-tiny/backend/src/utils/performance.ts) - Performance Timer for debugging

---

### 5. Dependencies

#### ✅ Types installed

- `@types/better-sqlite3` - SQLite types

---

## Current Status

### ✅ TypeScript Compilation

TypeScript compiles successfully without errors:

```bash
npm run build
# ✅ Success
```

### ✅ Electron Configuration

- Correct `main.ts` configuration (restored by user)
- IPC handlers in `app.on('ready')`
- Scripts added to `package.json`:
    - `rebuild` - rebuild native modules (better-sqlite3)
    - `postinstall` - auto install app deps

### ✅ Project Configuration (manual changes)

User made following changes:

- **`.gitignore`** - updated to exclude temporary files
- **`backend/package.json`** - added `rebuild` and `postinstall` scripts, added `electron-rebuild` to devDependencies
- **`backend/src/electron/main.ts`** - restored TypeScript version with correct imports
- **`frontend/package.json`** - dependencies updated

### ✅ Ready for Testing

**Application is ready for launch and testing!**

📋 **Testing Instructions**: [Testing_API.md](Testing_API.md)

---

## Project Structure Update (2026-01-05)

### ✅ NPM Workspaces

Project migrated to npm workspaces for monorepo management:

- **Root `package.json`**
    - Defined workspaces: `frontend` and `backend`
    - Shared commands: `dev`, `bundle`, `lint`, `format`

- **Backend `package.json`**
    - Removed `dev` and `bundle` commands (moved to root)
    - Kept `postinstall` script for `electron-rebuild`

- **Documentation**
    - Created `docs/Workspaces.md` with full guide
    - Updated `README.md` with new installation instructions
    - Added notes about `postinstall` script

### ✅ Workspaces Benefits

- Centralized dependency installation: `npm install` from root
- Simplified dev commands from project root
- Hoisting of shared dependencies
- Automatic `postinstall` execution for native modules build

---

## How to Run

### Install Dependencies

```bash
# From project root (once)
npm install
# postinstall will run automatically: electron-rebuild for better-sqlite3
```

### Development Mode

```bash
# From project root
npm run dev
```

After launch, open DevTools (**F12**) and use commands from `Testing_API.md`.

---

## What to Test

1. **Database Layer**:
    - DB creation in `userData/repetitio.db`
    - CRUD API operations via DevTools Console
    - Data persistence after restart

2. **Frontend Integration** (completed):
    - API client in `frontend/src/shared/api/client.js`
    - CourseList widget
    - HomePage with course management

---

## Next Implementation Stages

### 1. Card Management (Cards API)

- Backend: migration for `cards` table, Card Repository, API routes
- Frontend: Pinia store for cards, CardList widget, CoursePage
- **Feature**: Quick add cards (QuickAddCard component)

### 2. Application Settings

#### Global Settings

- Backend: `settings` table with fields:
    - `trainingStartHour` (default 8)
    - `trainingEndHour` (default 22)
    - `minTimeBeforeEnd` (4 hours)
    - `notificationsEnabled`
- Frontend: SettingsPage with time picker components

#### Course Settings (Individual)

- Backend: `course_settings` table with inheritance from global
- Frontend: Course Settings UI with "Use global settings" toggle

### 3. Spaced Repetition System

- Backend: FSRS algorithm implementation in `services/spaced-repetition.ts`
- API endpoints for training and review submission
- Frontend: TrainingPage with flip-animation and rating buttons (Again, Hard, Good, Easy)

### 4. Notification System

> [!IMPORTANT]
> App must consider training time settings:
>
> - Check `trainingStartHour` and `trainingEndHour`
> - **DO NOT offer new cards if < 4 hours left until end of day**
    > (first spaced repetition step = 4 hours)

- Backend: `services/notifications.ts` with periodic check (every hour)
- Electron: IPC handlers for system notifications
- Frontend: notification settings, test notification

### 5. Tray Integration

> [!IMPORTANT]
> When clicking "Close" in title bar, app should **minimize to tray**, not quit.

- Electron: create Tray icon, context menu, click handling
- Change `window-close` behavior: `hide()` instead of `quit()`
- Show window from tray on icon click

### 6. Extended Features (Optional)

- **Learning Progress Statistics**: Dashboard with charts
- **Course Import/Export**: JSON format, Anki compatibility
- **Media in Cards**: Image/Audio upload
- **Card Search**: Full-text search API
- **Tags and Categories**: Tag management, filtering

---

## Documentation Updates

All missing items from "Technical Specifications" in README added to:

- [`Implementation_Plan.md`](Implementation_Plan.md)
- [`Task.md`](Task.md)
- [`Walkthrough.md`](Walkthrough.md)
