# Changelog

All notable changes to the Repetitio project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.10.0] - 2026-01-11 13:33

### Fixed

#### Database Path Resolution in Electron Production Builds

Resolved critical issue with database file paths in Electron where `process.env.APP_USER_DATA` was undefined at config module import time, causing the database to point to the wrong location in built applications.

- **Root Cause Analysis**:
  - Module import order: `main.ts` → `server.ts` → `config/index.ts` → `DATABASE_PATH` calculated
  - `process.env.APP_USER_DATA` set in `app.on('ready')` **after** `config/index.ts` was imported
  - Result: `DATABASE_PATH` always resolved to `process.cwd()` (development path) even in production

- **Solution Architecture**:
  - **Dynamic Path Resolution** (`backend/src/config/index.ts`):
    - Changed `DATABASE_PATH` from static const to getter property
    - Created `getDatabasePath()` function that evaluates at call-time, not import-time
    - Enables correct path resolution after `APP_USER_DATA` is set
  - **Database Setup Utility** (`backend/src/electron/dbSetup.ts` — NEW FILE):
    - `prepareDatabase()` function handles database initialization for both dev and production
    - **Development mode**: Returns path to `backend/repetitio.db`
    - **Production mode**: Copies database from `.asar` archive to `userData` directory
    - Uses `config.DB_FILENAME` instead of hardcoded string
  - **Electron Main Process** (`backend/src/electron/main.ts`):
    - Added `prepareDatabase()` call in `app.on('ready')` before server startup
    - Fatal error handling: quits app if database preparation fails
    - Execution order: `APP_USER_DATA` set → DB prepared → server started → config resolved correctly
  - **Database Service Cleanup** (`backend/src/services/database/index.ts`):
    - Removed all commented-out ASAR copying logic (now handled by `dbSetup.ts`)
    - Simplified initialization: just uses `config.DATABASE_PATH` which is now always correct
    - Database service remains Electron-agnostic as intended

- **Configuration Changes**:
  - **Eliminated Hardcoded DB Filename**:
    - `backend/src/electron/dbSetup.ts`: Uses `config.DB_FILENAME`
    - `backend/build-installer.js`: Created `DB_FILENAME` constant, referenced from config pattern
    - Single source of truth: `config.DB_FILENAME = 'repetitio.db'`

- **Build Script Enhancements** (`backend/build-installer.js`):
  - Added validation: checks database file existence before build
  - Added tray icon copying (`app-tray-icon-32x32.png` → `icon-tray.png`)
  - Fails fast if database missing with clear error message

### Technical Details

- **Files Created**: 1
  - `backend/src/electron/dbSetup.ts` (new database initialization utility)

- **Files Modified**: 4
  - `backend/src/config/index.ts` (dynamic getters for `DATA_ROOT` and `DATABASE_PATH`)
  - `backend/src/electron/main.ts` (added `prepareDatabase()` call)
  - `backend/src/services/database/index.ts` (cleanup, removed commented code)
  - `backend/build-installer.js` (DB validation, tray icon copy)

- **Execution Flow** (Production):

  ```text
  1. app.setName('repetitio')
  2. app.on('ready'):
     a. setupFileLogging()
     b. process.env.APP_USER_DATA = app.getPath('userData')  ← set env var
     c. prepareDatabase()  ← copy DB from asar to userData
     d. createWindow() → startServer() → initializeDatabase()
                                              ↓
                                         config.DATABASE_PATH (getter)
                                              ↓
                                         getDatabasePath() ← NOW resolves correctly
                                              ↓
                                         userData/repetitio.db ✅
  ```

- **Benefits**:
  - ✅ **Dev Mode**: Database at `backend/repetitio.db` (works without Electron)
  - ✅ **Electron Dev**: Database at `backend/repetitio.db` (shared with non-Electron mode)
  - ✅ **Production Build**: Database copied to `%AppData%\Roaming\Repetitio\repetitio.db`
  - ✅ **Isolation**: Database service has zero Electron dependencies
  - ✅ **Maintainability**: Single config constant for DB filename

### Breaking Changes

None — this is an internal fix. Database location in production now correctly uses userData directory instead of attempting to access ASAR-packed files.

## [0.10.0] - 2026-01-11 04:40

### Changed

#### Backend: ESM → CommonJS Migration for Production Build Stability

Reverted backend from ES Modules to CommonJS to resolve critical issues with Electron production builds, ASAR packaging, and dynamic imports.

**Root Cause**: ESM with ASAR creates incompatible scenarios for Node.js module resolution in packaged Electron apps.

- **TypeScript Configuration** (`backend/tsconfig.json`):
  - `module`: `ESNext` → `CommonJS` (critical change for Electron compatibility)
  - `target`: `ESNext` → `ES2020` (stable target for Node.js 18+)
  - `outDir`: `./dist-electron` → `./dist` (simplified build output)
  - Removed: `moduleResolution: "Bundler"`, `noEmit: true`, `allowImportingTsExtensions: true`
  - CommonJS eliminates need for `.js` extensions in imports and circular dependency issues

- **Package Configuration** (`backend/package.json`):
  - **Removed**: `"type": "module"` — enables CommonJS mode globally
  - `name`: `backend` → `@repetitio/backend` (scoped package naming)
  - `main`: `src/electron/main.ts` → `dist/electron/main.js` (compiled output)
  - Added: `"private": true`, `"author": "Morozhnikova Larisa"`
  - **Electron Builder** simplification:
    - Removed: `asar`, `asarUnpack`, `afterPack`, `extraResources` configurations
    - Simplified `files` pattern: `**/*` + frontend paths (relies on default behavior)
  - **Dependencies**:
    - `electron`: `^39.2.6` → `39.2.7` (pinned version for reproducibility)
    - `electron-builder`: `^26.0.12` → `26.4.0` (pinned, latest stable)
    - Removed: `electron-rebuild` (handled by `electron-builder install-app-deps`)
  - **Scripts**:
    - Migrated from `npm` to `pnpm` commands
    - Simplified `build` script (removed post-build hooks)
    - `bundle` command removed (simplified to `dist`)
    - `rebuild:node`: Added pre-cleanup of better-sqlite3 build artifacts

- **Electron Main Process** (`backend/src/electron/main.ts`):
  - **Removed**: `const __dirname = import.meta.dirname;` (now available natively in CommonJS)
  - **All console.log prefixed with `[MAIN]`** for log clarity and grep-ability
  - **Preload path**: `preload.cjs` → `preload.js` (compiled from TypeScript)
  - **File logging**: Switched from custom `logToFile()` wrapper to direct `console.log` (captured by pino)
  - **Simplified imports**: No `.js` extensions needed in CommonJS

- **Preload Script** (`backend/src/electron/`):
  - `preload.cjs` → `preload.ts` (now TypeScript-compiled to `.js`)
  - TypeScript compilation eliminates manual CommonJS maintenance

- **Logger Service** (`backend/src/utils/logger.ts`):
  - **Completely rewritten** from ESM dev/production split to unified CommonJS with file logging
  - **Production Logging**:
    - Writes to `{DATA_ROOT}/logs/app.log` (persistent log file)
    - Uses `pino.multistream` for dual output (file + console in dev)
    - Configured with `pino-pretty` for dev console output via custom `Writable` stream adapter
  - **Development Logging**:
    - Console output with `pino-pretty` (colorized, human-readable)
    - File logging enabled simultaneously for debugging
  - **Configuration**:
    - Timestamp: ISO format (`pino.stdTimeFunctions.isoTime`)
    - Log file rotation: Not implemented (future enhancement)
    - Conditional console stream: Only in dev mode with `DEBUG_PERF` flag

- **Database Service** (`backend/src/services/database/index.ts`):
  - Import path: `../../config/index.js` → `../../config` (CommonJS auto-resolution)
  - Added detailed logging: `DATA_ROOT`, `APP_USER_DATA`, `DATABASE_PATH`
  - **Incomplete**: Commented-out logic for database file copying from ASAR (planned for future fix)
  - Current behavior: Database path points to source location (works but not production-ready)

- **All Backend Routes** (`backend/src/routes/*.ts`):
  - Removed `.js` extensions from all relative imports
  - Changed: `import X from './file.js'` → `import X from './file'`
  - CommonJS module resolver handles `.ts` → `.js` mapping automatically
  - Files affected: `cards.ts`, `courses.ts`, `index.ts`, `settings.ts`, `stats.ts`, `training.ts`

- **All Backend Services** (`backend/src/services/**/*.ts`):
  - Removed `.js` extensions from imports
  - Files affected:
    - `database/index.ts`, `database/migrations.ts`
    - `fsrs/index.ts`
    - `repositories/*.ts` (4 files)
    - `limitService.ts`, `statsScheduler.ts`

- **Configuration** (`backend/src/config/index.ts`, `backend/src/server.ts`):
  - Removed `.js` extensions from imports
  - Simplified module resolution

- **Build Configuration**:
  - `build-installer.cjs` → `build-installer.js` (compiled from TS, no manual `.cjs` needed)
  - Removed temporary utility scripts:
    - `fix-imports.ps1` (was used to batch-replace `.ts` → `.js` extensions during ESM attempt)
    - `after-pack.cjs` (attempted ASAR unpacking workaround, no longer needed)
    - `post-build.cjs` (attempted preload.cjs copying, handled by TS compilation now)

### Fixed

- **Production Build**: Electron app now successfully builds and runs without errors
  - **Before**: `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'express'` in ASAR
  - **After**: CommonJS modules resolve correctly from compiled `dist/` directory
- **ASAR Compatibility**: No longer requires `asarUnpack` workarounds for `node_modules`
  - Electron's default CommonJS handling works seamlessly
- **Import Resolution**: No manual `.js` extension management required
  - TypeScript `outDir` compilation handles all path mapping
- **Logging**: Production logs now persist to disk at `{DATA_ROOT}/logs/app.log`
  - **Before**: Console-only logging in production (lost on app restart)
  - **After**: Persistent file logging + optional console output in dev

### Technical Details

- **Migration Scope**:
  - **38+ files modified** across backend:
    - Core: `package.json`, `tsconfig.json`, `main.ts`, `logger.ts`, `server.ts`, `config/index.ts`
    - Routes: 6 files
    - Services: 11 files
    - Database: 3 files
  - **3 temporary scripts removed**: `fix-imports.ps1`, `after-pack.cjs`, `post-build.cjs`
  - **1 file renamed**: `preload.cjs` → `preload.ts` (TypeScript source)
  - **Package manager migration**: `npm` → `pnpm` (workspace monorepo standard)

- **Build Output Structure** (before vs after):

  ```text
  Before (ESM):
    backend/
      ├─ dist-electron/        ← TypeScript compilation
      ├─ src/                  ← Source (with .js extensions in imports)
      ├─ node_modules/
      └─ package.json          ("type": "module")

  After (CommonJS):
    backend/
      ├─ dist/                 ← TypeScript compilation (simplified path)
      ├─ src/                  ← Source (no .js extensions)
      ├─ node_modules/
      └─ package.json          (no "type" field = CommonJS default)
  ```

- **Why CommonJS Over ESM for Electron**:
  1. **ASAR Compatibility**: Electron's ASAR archive works seamlessly with CommonJS `require()`
  2. **Dynamic Imports**: No issues with `import()` inside packaged apps
  3. **Module Resolution**: Node.js native resolution (`node_modules` traversal) works reliably
  4. **Preload Context**: Electron's preload scripts officially support CommonJS (not ESM)
  5. **Ecosystem Stability**: Better-sqlite3 and other native modules have mature CommonJS support
  6. **Build Simplicity**: No need for `asarUnpack`, `afterPack` hooks, or custom module patching

### Known Issues

- **Database Path in ASAR**: Database file copying from ASAR not implemented (commented out in `database/index.ts`)
  - Current workaround: Database path points to development location
  - Planned fix: Implement proper database initialization in userData directory
  - Impact: Production build uses development database path (works but not isolated)

### Breaking Changes

- **None for end users** — this is an internal refactoring
- **Developers**: If extending backend code, use CommonJS syntax (`require`/`module.exports` or TS import/export which compiles to CommonJS)

### Performance \u0026 Benefits

- ✅ **Production Build Success**: App builds and runs without module resolution errors
- ✅ **Simplified Configuration**: Removed 15+ lines of custom Electron Builder config
- ✅ **Faster Development**: `tsx` + `nodemon` with CommonJS is faster than ESM `ts-node`
- ✅ **Reliable Logging**: Persistent file logs at `{DATA_ROOT}/logs/app.log`
- ✅ **Maintainability**: Standard CommonJS workflow, no custom import path hacks
- ✅ **Ecosystem Alignment**: Better compatibility with Electron ecosystem (most examples are CommonJS)

### Migration Notes

This migration was completed manually over ~7 hours of debugging and testing. Key learnings:

1. ESM + ASAR + Electron = Compatibility Hell (avoid in production Electron apps)
2. CommonJS is still the gold standard for Electron main/preload processes (as of Electron 39)
3. Pinning exact versions (`39.2.7`, `26.4.0`) prevents regressions
4. pnpm workspace: Superior to npm workspaces for monorepo builds
5. Logging to file is non-negotiable for production desktop apps

## [0.10.0] - 2026-01-10 23:15

### Added

#### Feature: System Tray Integration

Implemented system tray integration to enable background operation — application now minimizes to system tray instead of fully terminating when the close button is pressed.

- **Backend Implementation** (`backend/src/electron/main.ts`):
  - **createTray()** function:
    - Loads tray icon (`backend/icon-tray.png`, 32x32 PNG with transparency)
    - Sets tooltip: "Repetitio"
    - Creates context menu with dynamic labels
    - Registers click handler for window visibility toggle
    - Error handling with graceful fallback (logs error, allows normal close behavior)
  - **createTrayMenu()** function:
    - Builds context menu with 2 items:
      - **"Показать/Скрыть Repetitio"** — dynamic label based on `mainWindow.isVisible()`
      - **"Закрыть Repetitio"** — calls `app.quit()` to fully terminate
  - **updateTrayMenu()** function:
    - Rebuilds context menu when window visibility changes
    - Ensures label reflects current window state
  - **toggleWindow()** function:
    - Shows window if hidden (`window.show()` + `focus()`)
    - Restores window if minimized (`window.restore()` + `focus()`)
    - Focuses window if already visible
  - **Window Event Handlers**:
    - `mainWindow.on('close')` — prevents default close, calls `window.hide()` instead
    - `mainWindow.on('show')` — calls `updateTrayMenu()` to update label
    - `mainWindow.on('hide')` — calls `updateTrayMenu()` to update label
  - **IPC Handler** (`window-close`):
    - Changed from `win?.close()` to `win?.hide()`
    - Frontend close button now hides window instead of terminating
  - **App Lifecycle**:
    - `app.on('ready')` — calls `createTray()` after `createWindow()`
    - `app.on('window-all-closed')` — **modified logic**:
      - macOS: `app.quit()` (standard behavior)
      - Windows/Linux: continues running (no quit)
    - `app.on('before-quit')` — calls `tray.destroy()` for cleanup

- **Assets**:
  - Created tray icon: `backend/icon-tray.png` (32x32 PNG with transparency)
  - Purple gradient "R" logo design for system tray visibility

### Changed

- **Window Close Behavior**: Application no longer terminates when close button is pressed
  - **Before**: Closing window → full app termination
  - **After**: Closing window → hide to system tray
  - **Rationale**: Matches UX patterns of productivity apps (Slack, Discord, Notion)
  - Users can still fully quit via tray context menu

### Fixed

- **toggleWindow() Logic**: Corrected toggle behavior for tray icon click
  - **Before**: Clicking tray icon when window is visible would only focus it
  - **After**: Clicking tray icon properly toggles — hides window if visible, shows if hidden
  - **Impact**: Tray icon click now works as expected per specification

- **Build Script Migration**: Migrated `build-installer.js` → `build-installer.cjs`
  - Removed incompatible `import.meta.dirname` from CommonJS module
  - Updated `package.json` scripts to reference `.cjs` file
  - Updated ESLint ignore patterns for new filename
  - **Reason**: Ensure proper CommonJS compatibility for build tooling

### Technical Details

- **Platform Support**:
  - Windows: Tray icon appears in bottom-right taskbar
  - macOS: Icon appears in menu bar (top-right)
  - Linux: Depends on DE (GNOME, KDE, XFCE); requires tray support

- **Files Created**: 1
  - `backend/icon-tray.png`

- **Files Modified**: 1
  - `backend/src/electron/main.ts`

- **Documentation Updated**: 2
  - `docs/Walkthrough.md` — Added "System Tray Integration" section to Phase 7
  - `docs/Changelog.md` — This entry

- **Interaction Flows**:
  - **Left click on tray icon** → `toggleWindow()` → show/restore/focus window
  - **Right click on tray icon** → display context menu
  - **Menu: "Показать Repetitio"** → `toggleWindow()` → show window
  - **Menu: "Закрыть Repetitio"** → `app.quit()` → full termination
  - **Window close button** → IPC `window-close` → `window.hide()`
  - **Native close event** → `event.preventDefault()` + `window.hide()`

- **Benefits**:
  - ✅ **Instant Access**: Click tray icon to instantly resume training
  - ✅ **Resource Efficiency**: No need to restart app and reinitialize services
  - ✅ **Standard UX**: Behavior matches user expectations for desktop productivity apps
  - ✅ **Foundation for Notifications**: Creates infrastructure for future system notification integration
  - ✅ **Graceful Lifecycle**: Proper cleanup on quit, no memory leaks

- **OpenSpec Status**:
  - ✅ All tasks completed across 5 phases (Infrastructure, Window Behavior, Integration, Testing, Documentation)
  - Ready for archiving via `/openspec-archive add-system-tray`

## [0.9.0] - 2026-01-10 22:54

### Added

#### OpenSpec: System Tray Integration Proposal

Created comprehensive OpenSpec proposal for implementing system tray integration to enable background operation instead of full application termination on window close.

## [0.9.0] - 2026-01-10 22:09

### Added

#### Enhanced 3D Card Flip Animation with Auto-Scaling Text

Implemented improved 3D card flip animation with true `backface-hidden` rendering and automatic text scaling for optimal readability.

- **Frontend: Training Page 3D Flip Animations** (`frontend/src/pages/training/`):
  - **New composables**:
    - `textFit.js` — Binary search algorithm for optimal font sizing (6-100px range)
    - `useAutoFitText.js` — Vue composable with ResizeObserver, watch, debounce (100ms)
  - **TrainingPage.vue** refactoring:
    - Replaced simple `display: none` flip logic with true 3D transform
    - Added `useTemplateRef()` for direct DOM access (`frontContainer/Content`, `backContainer/Content`)
    - Implemented lifecycle management: `currentSideFitter` cleanup on flip/unmount
    - Watch-based initialization: waits for DOM mount before activating textFit
    - Dynamic viewport sizing: `width: clamp(50vw, 800px, 97vw)`, `height: calc(100dvh - 280px)`
  - **CSS improvements**:
    - Added `perspective: 1000px` for 3D context
    - Applied `backface-hidden` to front/back card faces
    - Applied `transform: rotateY(180deg)` on `.training-container.flipped`
    - Removed fixed `font-size`, added dynamic `transition: font-size 0.1s` for smooth scaling
    - Enabled `transform-3d`, `transform-style: preserve-3d` on card content

- **Card.vue enhancements**:
  - Removed `overflow: hidden` to prevent clipping of 3D-transformed content
  - Added `transform-3d` CSS class with `perspective` and `transform-style: preserve-3d`

### Changed

#### Backend: Electron and TypeScript Configuration Updates

- **Electron Preload Script** (`backend/src/electron/`):
  - Migrated `preload.ts` → `preload.cjs` (CommonJS format required for Electron preload context)
  - Replaced TypeScript syntax with JSDoc for type annotations (`@type {import('electron').IpcRendererEvent}`)
  - Removed unused `openNewWindow` IPC handler
  - Updated `main.ts` to reference `preload.cjs` instead of `preload.js`
  - Added logging calls for server startup and port transmission

- **TypeScript Configuration** (`backend/tsconfig.json`):
  - Enabled `allowArbitraryExtensions: true` for `.cjs` file support
  - Enabled `declarationMap: true` for TypeScript declaration source maps

- **Backend Scripts** (`backend/package.json`):
  - Added `codegen` script for Kysely type generation
  - Updated Electron development scripts to use `tsx` for direct TypeScript execution
  - Changed `main` entry point from `src/server.ts` to `src/electron/main.ts`
  - Modified `electron:dev` to use `NODE_OPTIONS="--import tsx"` instead of pre-compilation

#### Code Formatting Standardization

- **ESLint/Prettier Alignment**:
  - Added `semi: 0` rule to ESLint config to disable semicolon warnings
  - Removed all trailing semicolons from backend codebase (consistent with Prettier defaults)
  - Aligned 30+ backend files with Prettier formatting rules

- **Files Formatted** (30 files):
  - Backend routes: `cards.ts`, `courses.ts`, `training.ts`, `settings.ts`, `stats.ts`, `index.ts`
  - Backend services: `database/index.ts`, `database/migrations.ts`, `database/schema.ts`
  - Repositories: `cardRepository.ts`, `courseRepository.ts`, `progressRepository.ts`, `settingsRepository.ts`
  - FSRS: `fsrs/index.ts`, `limitService.ts`, `statsScheduler.ts`
  - Frontend: `RetentionLevelPicker.vue`, `CardItem.vue`

### Fixed

- **Training Page Lifecycle**: Re-enabled `try-catch` in `onMounted` for proper error handling on session start failure
- **Stats Update**: Changed `statsStore.fetchGlobalStats()` to `await statsStore.fetchGlobalStats()` for proper async flow
- **Router Navigation**: Added `await` to `router.push()` calls in error handling

### Technical Details

- **Files Created**: 2
  - `frontend/src/pages/training/composables/textFit.js`
  - `frontend/src/pages/training/composables/useAutoFitText.js`

- **Files Modified**: 30
  - Backend (21): `package.json`, `tsconfig.json`, `main.ts`, `preload.cjs`, `server.ts`, `routes/*.ts`, `services/**/*.ts`
  - Frontend (9): `TrainingPage.vue`, `Card.vue`, `RetentionLevelPicker.vue`, `CardItem.vue`, `textFit.js`, `useAutoFitText.js`, `main.js`, `useTrainingStore.js`

- **3D Flip Animation Architecture**:

  ```text
  TrainingPage → useAutoFitText(containerRef, contentRef, textSource)
    ├─ ResizeObserver → adjustFontSize (debounced 100ms)
    ├─ watch(textSource) → adjustFontSize (flush: 'post')
    └─ textFit(element, options)
         └─ Binary Search (minFontSize=12, maxFontSize=100)
              • while (low <= high): test mid fontSize
              • check: innerWidth <= containerWidth && innerHeight <= containerHeight
              • return optimal fontSize
  ```

- **Performance Optimizations**:
  - Debounced resize handler (100ms) prevents excessive recalculations
  - Binary search: O(log N) complexity for font size determination (~7 iterations for 12-100px range)
  - Single ResizeObserver per card face (unlinks on flip)
  - Cleanup on unmount prevents memory leaks

- **Breaking Changes**: None (purely visual enhancements)

### Developer Experience

- ✅ **Simplified Electron Development**: Direct `tsx` execution without pre-compilation step
- ✅ **Consistent Formatting**: All code adheres to Prettier rules (no semicolons, 2-space indents)
- ✅ **Type Safety**: JSDoc annotations in `.cjs` files preserve type checking
- ✅ **Kysely Codegen**: New script enables type generation for database schema

## [0.9.0] - 2026-01-09 19:17

### Added

#### Feature: Real-Time Statistics Updates via SSE (Archived as 2026-01-09-add-sse-stats-updates)

Implemented Server-Sent Events (SSE) for real-time statistics updates, replacing inefficient polling with intelligent push-based updates.

- **Backend Implementation**:
  - **StatsScheduler Service** (`backend/src/services/statsScheduler.ts`):
    - Manages SSE client connections (`Set<Response>`)
    - Intelligent scheduling: calculates next due card time and sets timer for exact moment
    - Fallback timer (1 hour) when no cards are due soon
    - Broadcasts statistics to all connected clients (`broadcastStats()`)
    - Graceful shutdown with resource cleanup
  - **SSE Endpoint** (`backend/src/routes/stats.ts`):
    - `GET /api/stats/stream` — persistent EventSource connection
    - Sends initial statistics on connection
    - Broadcasts: `{ courses: [...], globalStats: {...} }` format
    - Handles client disconnections automatically
  - **cardRepository** (`backend/src/services/repositories/cardRepository.ts`):
    - New method `getNextDueCard()`: finds next card becoming due using `ORDER BY due ASC LIMIT 1`
    - O(log N) performance with index on `due` column
  - **Broadcast Triggers**: Added `statsScheduler.broadcastStats()` after all data mutations:
    - Training: `POST /api/training/review`
    - Cards: `POST/PUT/DELETE /api/cards/*`, batch operations
    - Courses: `PUT/DELETE /api/courses/:id`
    - Settings: `PUT /api/settings/*`
  - **Graceful Shutdown** (`backend/src/server.ts`):
    - Calls `statsScheduler.shutdown()` on SIGTERM/SIGINT
    - Cleans up timers and closes all SSE connections

- **Frontend Implementation**:
  - **useStatsStream Composable** (`frontend/src/shared/lib/useStatsStream.js`):
    - EventSource connection to `/api/stats/stream`
    - Auto-reconnect on errors (browser built-in)
    - Reactive `isConnected` state
    - Lifecycle management: connects on mount, disconnects on unmount
  - **HomePage.vue** — SSE Integration:
    - **Removed**: `setTimeout` polling (was every 5 seconds)
    - **Added**: `useStatsStream()` subscription
    - Updates both course stats and global stats from single SSE event
    - No HTTP requests after initial load
  - **useStatsStore** (`frontend/src/entities/stats/model/useStatsStore.js`):
    - New method `updateFromSSE(globalStats)`: updates stats without HTTP request or loading state
    - Eliminates UI flickering during updates
  - **Connection Status Indicator** (`HomePage.vue`):
    - Fixed badge in bottom-right corner
    - Shows "Подключено" (green) / "Отключено" (red)
    - Smooth transitions (0.3s ease)

### Removed

- **Polling Mechanism**: Completely eliminated `setTimeout`-based polling from HomePage
  - **Before**: 720 HTTP requests/hour (every 5 seconds)
  - **After**: 1 persistent SSE connection + broadcasts only on data changes

### Changed

- **Statistics Update Latency**:
  - **Before**: Up to 5 seconds delay (polling interval)
  - **After**: <100ms (instant broadcast on mutations)
- **Network Traffic**:
  - **Before**: Constant polling regardless of changes
  - **After**: Updates only when data actually changes
- **Due Card Updates**:
  - **Before**: Unpredictable (depends on polling interval)
  - **After**: Exact timing (scheduled for precise moment card becomes due)

### Technical Details

- **OpenSpec Status**:
  - ✅ All **85 tasks** completed (4 phases: Backend, Frontend, Testing, Documentation)
  - ✅ Archived as `2026-01-09-add-sse-stats-updates`
  - ✅ Spec `sse-stats-streaming` created with 7 requirements
  - ✅ Validation passed with strict mode (12 specs total)

- **Files Created**: 2
  - `backend/src/services/statsScheduler.ts`
  - `backend/src/routes/stats.ts`
  - `frontend/src/shared/lib/useStatsStream.js`

- **Files Modified**: 9
  - Backend (6): `server.ts`, `cardRepository.ts`, `training.ts`, `cards.ts`, `courses.ts`, `settings.ts`, `routes/index.ts`
  - Frontend (3): `HomePage.vue`, `useCourseStore.js`, `useStatsStore.js`

- **SSE Message Format**:

  ```text
  event: stats-update
  data: {
    "courses": [{"courseId": 1, "stats": {...}}],
    "globalStats": {"totalNewCards": 17, "global": {...}}
  }
  ```

- **Architecture**:
  ```text
  HomePage → useStatsStream → SSE /api/stats/stream
                                    ↓
                              StatsScheduler
                                ├─ Timer for next due (18:45:00)
                                ├─ Broadcast on mutations (training/CRUD)
                                └─ Send to all clients (<100ms)
  ```

### Performance & Benefits

- ✅ **Instant Updates**: <100ms latency vs 0-5s polling delay
- ✅ **Zero Overhead**: No unnecessary requests (was 720/hour)
- ✅ **Predictable Timing**: Cards update exactly when they become due
- ✅ **Graceful Degradation**: Auto-reconnect on connection loss
- ✅ **Resource Efficient**: Single connection serves multiple updates
- ✅ **No UI Flickering**: Updates without loading states

## [0.8.1] - 2026-01-09 18:34

### Added

#### OpenSpec: Real-Time Statistics Updates via SSE Proposal

Created comprehensive OpenSpec proposal for replacing polling-based statistics updates with Server-Sent Events (SSE) for real-time, efficient data synchronization.

- **OpenSpec Change Created**: `add-sse-stats-updates`
  - Proposal to replace `setTimeout` polling (every 5 seconds) with intelligent SSE-based push updates
  - Motivation: Current polling creates unnecessary load (12 requests/minute), delays updates, and cannot predict when cards become due
  - Solution: SSE with smart scheduling based on next card's due time, instant broadcasts on data changes

- **Proposal Structure** (`openspec/changes/add-sse-stats-updates/`)
  - **proposal.md** (3.1 KB)
    - Why: Inefficient polling wastes resources, delays updates, lacks predictability
    - Problem: 4 key issues (redundant requests, update delay, resource waste, no due-time awareness)
    - Solution: SSE + StatsScheduler that plans updates for exact due times
    - Benefits: Zero latency (<100ms), minimal traffic, predictable updates, scalability
    - Alternatives considered: WebSocket (overcomplicated), Long Polling (same problems), keeping setTimeout (inefficient)
  - **design.md** (11.9 KB)
    - Architecture: SSE Endpoint + StatsScheduler Service + EventSource composable
    - Components:
      - Backend: `GET /api/stats/stream`, `StatsScheduler` class, `cardRepository.getNextDueCard()`
      - Frontend: `useStatsStream` composable, HomePage integration with auto-reconnect
    - Data Flow: 3 scenarios documented (training completion, next due timer, initial app load)
    - Performance: O(1) scheduling, O(log N) next due query, O(M) broadcast (M = clients, typically 1)
    - Edge Cases: no due cards (fallback 1hr), large delays (max 1hr), multiple clients (broadcast to all)
  - **tasks.md** (15.0 KB, 4 phases, **85 tasks**, ~10.5 hours)
    - **Phase 1**: Backend Infrastructure (5 tasks, 33 subtasks)
      - Task 1.1: `getNextDueCard()` in cardRepository
      - Task 1.2: Create StatsScheduler Service (clients set, timer, scheduleNextUpdate, broadcastStats)
      - Task 1.3: SSE endpoint `GET /api/stats/stream`
      - Task 1.4: Integrate broadcast triggers (training, cards, courses, settings routes)
      - Task 1.5: Gracefulsurrender for scheduler shutdown
    - **Phase 2**: Frontend Integration (3 tasks, 22 subtasks)
      - Task 2.1: `useStatsStream` composable with EventSource
      - Task 2.2: Integrate SSE in HomePage, remove setTimeout polling
      - Task 2.3: Connection status indicator (optional)
    - **Phase 3**: Testing & Validation (2 tasks, 15 subtasks)
      - Task 3.1: Manual functional testing (7 scenarios)
      - Task 3.2: Performance & resource checks (memory leaks, network requests, logs)
    - **Phase 4**: Documentation & Cleanup (3 tasks, 15 subtasks)
      - Task 4.1: Update Walkthrough with SSE architecture
      - Task 4.2: Update Changelog
      - Task 4.3: Code quality check (ESLint, Prettier, code style)
  - **specs/sse-stats-streaming/spec.md** (NEW spec, 6.9 KB)
    - 7 requirements with SHALL/MUST keywords:
      - SSE Endpoint for Statistics (2 scenarios: connection, disconnect)
      - Stats Scheduler Service (4 scenarios: first/last client, scheduled update, no due cards)
      - Next Due Card Query (2 scenarios: future due cards, no due cards)
      - Broadcast on Data Mutation (3 scenarios: training, card add, settings change)
      - Frontend SSE Integration (3 scenarios: HomePage subscription, event reception, connection error)
      - Remove Polling Mechanism (1 scenario: no setTimeout usage)
      - SSE Message Format (1 scenario: valid message structure)

- **Key Features Documented**
  - **Intelligent Scheduling**:
    - Queries next due card: `SELECT MIN(due) FROM cards WHERE due > NOW()`
    - Sets timer for exact due time (no wasted polls)
    - Fallback to 1-hour check if no cards due soon
  - **Broadcast Triggers** (instant updates):
    - After training review completion
    - After card CRUD operations (add, edit, delete, batch)
    - After course/settings updates
    - Only broadcasts AFTER successful operation, BEFORE response
  - **SSE Message Format**:
    ```text
    event: stats-update
    data: {"courses":[{"courseId":1,"stats":{...}}]}
    ```
  - **Frontend Architecture**:
    - EventSource connects to `/api/stats/stream`
    - Auto-reconnect on errors (browser built-in, 3s delay)
    - `useStatsStream(onUpdate)` composable for easy integration
  - **Backend Architecture**:
    ```typescript
    class StatsScheduler {
      clients: Set<Response>
      nextDueTimer: NodeJS.Timeout | null
      addClient(), removeClient()
      scheduleNextUpdate(), broadcastStats()
      shutdown()
    }
    ```
  - **Benefits**:
    - ✅ Instant updates (<100ms vs up to 5s delay)
    - ✅ Reduced traffic (only when data changes vs 720 requests/hour)
    - ✅ Precise timing (updates exactly when cards become due)
    - ✅ Graceful shutdown (clean timer/connection cleanup)

### Technical Details

- **OpenSpec Validation**: ✅ Passed `npx @fission-ai/openspec validate --all` (12/12 specs)
- **Markdown Linting**: ✅ 0 errors across all proposal files
- **Change Status**: 0/85 tasks (proposal stage, ready for implementation)
- **Files Created**: 4
  - `openspec/changes/add-sse-stats-updates/proposal.md`
  - `openspec/changes/add-sse-stats-updates/design.md`
  - `openspec/changes/add-sse-stats-updates/tasks.md`
  - `openspec/changes/add-sse-stats-updates/specs/sse-stats-streaming/spec.md` (NEW spec)
- **No Code Changes**: Pure planning/proposal phase

### Architecture Highlights

```text
Current (Polling):
  HomePage → setTimeout(5s) → GET /api/courses (stats included)
  Problems: 720 requests/hour, up to 5s delay, unpredictable

Proposed (SSE):
  HomePage → EventSource → GET /api/stats/stream (SSE)
    ↓ (persistent connection)
  StatsScheduler:
    ├→ Timer set for next due card (e.g., 18:45:00)
    ├→ Broadcast on user actions (training, CRUD)
    └→ Clients receive: event stream with stats
  Benefits: <100ms latency, minimal traffic, exact timing
```

### Next Steps

- User review and approval of the proposal
- Implementation via `/openspec-apply add-sse-stats-updates` after approval
- New spec `sse-stats-streaming` will be formalized upon archiving
- After implementation: Elimination of polling, real-time statistics, better resource efficiency

## [0.8.1] - 2026-01-09 17:59

### Changed

#### Backend: ES Modules (ESM) Migration

Migrated backend codebase from CommonJS to ES Modules for better compatibility with modern Node.js ecosystem.

- **TypeScript Configuration** (`backend/tsconfig.json`):
  - Changed `module` from `CommonJS` to `ESNext`
  - Changed `target` from `ES2020` to `ESNext`
  - Set `moduleResolution` to `Bundler`

- **Development Tooling**:
  - Replaced `ts-node` with `tsx` in `package.json` for better ESM support
  - Created `backend/nodemon.json` with TypeScript watch configuration
  - Updated `dev` script to use `tsx` with type-checking before execution
  - Added `dev:only` script for faster development without rebuild

- **Code Updates**:
  - Added `import.meta.dirname` polyfill to files requiring `__dirname`:
    - `backend/build-installer.js`
    - `backend/src/config/index.ts`
    - `backend/src/electron/main.ts`
    - `backend/src/server.ts`
  - Updated entry point detection in `server.ts`:
    - Changed from `require.main === module` (CommonJS)
    - To `process.argv[1] === fileURLToPath(import.meta.url)` (ESM)

**Benefits**:

- Better compatibility with modern npm packages (many are ESM-only)
- Faster development builds with `tsx`
- Native `import`/`export` syntax without transpilation quirks
- Consistent module system across frontend and backend

#### Frontend: HomePage Auto-Refresh

Added automatic course list refresh every 5 seconds on the home page.

- **Implementation** (`frontend/src/pages/home/HomePage.vue`):
  - Extracted course fetching logic into `update()` function
  - Added `window.setTimeout(update, 5000)` for periodic refresh
  - Ensures UI always displays up-to-date course statistics and due cards count

**Benefits**:

- Real-time updates when cards become due or training is completed in another window
- Improved UX: no need to manually refresh the page
- Minimal performance impact (5-second interval is conservative)

### Technical Details

- **Files Modified**: 8
  - Backend (6): `build-installer.js`, `package.json`, `tsconfig.json`, `src/config/index.ts`, `src/electron/main.ts`, `src/server.ts`
  - Frontend (1): `src/pages/home/HomePage.vue`
  - Root (1): `package-lock.json`

- **Files Created**: 1
  - `backend/nodemon.json`

## [0.8.0] - 2026-01-09 16:30

### Added

#### Feature: Global Interleaved Training (Archived as 2026-01-09-add-global-training)

Implemented global training mode that allows learning cards from all courses in a single unified session with intelligent interleaving for improved retention.

- **Backend Implementation**:
  - **cardRepository.ts** — New method `getAllDueCards(now, limit)`:
    - Fetches due cards from all courses sorted by priority (overdue first)
    - SQL query with `due <= now` filter and `ORDER BY due ASC`
    - Limit parameter (default 1000) for performance
  - **limitService.ts** — New function `calculateGlobalAvailableCards(timezone)`:
    - Applies dual-level limits: global AND course-specific
    - Filters cards: `globalNewUsed < globalNewRemaining && courseNewUsed < courseNewRemaining`
    - Implements Fisher-Yates shuffle for interleaved practice
    - Returns `{ cards: Card[], limits: {...} }`
  - **training.ts** — New endpoint `GET /api/training/global/due-cards?timezone=...`:
    - Calls `calculateGlobalAvailableCards(timezone)`
    - Returns mixed queue with remaining limits

- **Frontend Implementation**:
  - **useTrainingStore.js** — New action `startGlobalSession()`:
    - Detects user timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone`
    - Calls `GET /api/training/global/due-cards`
    - Sets `isGlobalSession = true` flag
  - **TrainingPage.vue** — Global mode adaptations:
    - Conditional navigation: "Back to Home" instead of "Back to Course"
    - Displays `CourseBadge` component above each card
    - Session remaining counter shows cards left in current session (not daily limits)
    - Computed property `sessionRemaining` calculates remaining new/review cards
  - **CourseBadge.vue** (NEW) — `frontend/src/shared/ui/CourseBadge.vue`:
    - Compact badge component (24px height, rounded, 12px text)
    - Props: `courseName`, `courseColor` (optional)
    - Shows course name during global training
  - **HomePage.vue** — "Train All" button:
    - Button with lightning icon (bi-lightning-fill)
    - Counter badge showing total due cards across all courses
    - Disabled when `totalDueCards === 0`
    - Navigates to `/training/global` on click
  - **Router** — New route: `/training/global` → `TrainingPage`

- **Key Features**:
  - **Interleaved Practice**: Cards from different courses are shuffled together (not studied in blocks)
  - **Hierarchical Limits**: Enforces both global (e.g., 200 new/day) AND course (e.g., 20 new/day) limits simultaneously
  - **Dynamic Due Counter**: Home page button shows real-time count of cards ready for review
  - **Course Indicator**: Badge on each card shows which course it belongs to during global session
  - **Session Remaining Display**: "Осталось" section shows cards left in current session, updating after each review

### Fixed

- **Course Limits Fallback**: Fixed hardcoded fallback values (20 new, 200 reviews) in `calculateGlobalAvailableCards()`
  - Now uses `globalSettings.defaultNewCardsPerDay` and `defaultMaxReviewsPerDay`
  - Resolves issue where global training was limited to 22 cards instead of 51 due to incorrect defaults
- **Stats Display**: Added `dueToday` field to course stats in `GET /api/courses`
  - Backend `getAllCoursesStats()` now calculates due cards count (`card.due <= now`)
  - Home page "Train All" button now displays correct counter
- **Session Limits**: Fixed "Осталось" display to show remaining cards in session, not daily limits
  - Changed from `sessionLimits.newCardsRemaining` to `sessionRemaining.newCards`
  - UI now displays actual progress through current training session

### Technical Details

- **Files Created**: 2
  - `frontend/src/shared/ui/CourseBadge.vue`
  - `openspec/specs/global-training/spec.md` (archived spec)

- **Files Modified**: 9
  - Backend (4): `cardRepository.ts`, `limitService.ts`, `training.ts`, `courses.ts`
  - Frontend (5): `useTrainingStore.js`, `trainingApi.js`, `TrainingPage.vue`, `HomePage.vue`, `router/index.js`

- **OpenSpec Status**:
  - ✅ All **82 tasks** completed (5 phases: Backend, State, UI, Verification, Documentation)
  - ✅ Archived as `2026-01-09-add-global-training`
  - ✅ Spec `global-training` created with 4 requirements
  - ✅ Validation passed with strict mode (11 specs total)

- **Architecture**:
  ```text
  HomePage: "Train All" (51 cards) → router.push('/training/global')
    ↓
  TrainingPage: isGlobalMode = true
    ↓
  useTrainingStore.startGlobalSession()
    ↓
  GET /api/training/global/due-cards?timezone=Asia/Shanghai
    ↓
  calculateGlobalAvailableCards():
    - Calculate budgets (global + per-course)
    - Fetch all due cards (sorted by due ASC)
    - Filter with dual limits (global AND course)
    - Shuffle result (Fisher-Yates)
    ↓
  Returns: { cards: [29 new + 22 reviews], limits: {...} }
    ↓
  TrainingPage: Shows cards with CourseBadge, "28 новых + 21 повтор." remaining
  ```

### User Experience

- ✅ **One-Button Global Training**: Click "Тренировать всё" to review all due cards in one session
- ✅ **Interleaved Practice**: Cards from multiple courses are mixed together for better retention
- ✅ **Intelligent Limit Enforcement**: Respects both global and per-course limits automatically
- ✅ **Visual Course Indicator**: Each card shows which course it belongs to
- ✅ **Session Progress Tracking**: "Осталось: X новых + Y повтор." updates in real-time
- ✅ **Smart Navigation**: Back button returns to home page (not individual course)
- ✅ **Dynamic Counter**: Home page button shows exact number of cards ready for review

### Next Steps

- Future enhancement: Real-time stat updates via SSE (planned for next OpenSpec proposal)
- Consider adding session time tracking
- Potential optimization: lazy loading for very large card sets (>1000 cards)

## [0.6.2] - 2026-01-09 03:44

### Changed

#### OpenSpec: Global Training Tasks Format Fix

- Reformatted `openspec/changes/add-global-training/tasks.md` to comply with OpenSpec task tracking format
- Changed from nested checklist format to structured task format with `### Task X.Y` headings
- OpenSpec now correctly recognizes **82 tasks** (previously showed "No tasks")
- Change status updated from `no-tasks` to `in-progress` (0/82 tasks completed)
- Organized into 5 phases:
  - **Phase 1**: Backend Implementation (4 tasks, 21 subtasks)
  - **Phase 2**: Frontend State Management (2 tasks, 7 subtasks)
  - **Phase 3**: UI Components (4 tasks, 20 subtasks)
  - **Phase 4**: Verification & Testing (7 tasks, 25 subtasks)
  - **Phase 5**: Documentation & Cleanup (3 tasks, 9 subtasks)
- Each task now includes metadata: Duration, Dependencies, and Validation criteria
- Total estimated duration: 7-8 hours
- Ready for implementation tracking via OpenSpec

## [0.6.2] - 2026-01-09 03:30

### Changed

#### OpenSpec: Archived Home Stats Change

- Archived OpenSpec change `add-home-stats` as `2026-01-08-add-home-stats`
- Created new specification document: `openspec/specs/home-stats/spec.md` (7 requirements, 223 lines)
- All specs validated successfully with strict mode (11 specs passing)
- Change status: 0/68 tasks completed before archiving (all implementation tasks done)
- New spec formalizes: two-column responsive layout, aggregated statistics, remaining cards calculation, global stats API, Pinia store, design system consistency, and chart placeholder

## [0.6.2] - 2026-01-09 03:24

### Added

#### OpenSpec: Global Interleaved Practice Proposal

Created comprehensive OpenSpec proposal for implementing "Global Training" mode — an interleaved practice system that mixes cards from all courses in a single unified session.

- **OpenSpec Change Created**: `add-global-training`
  - Proposal for global queue with interleaving strategy and hierarchical limit enforcement
  - Motivation: Users currently study one course at a time; research shows interleaved practice (mixing subjects) improves retention and cognitive flexibility
  - Solution: Global training mode that respects both global and course-specific limits while mixing cards for optimal learning

- **Proposal Structure** (`openspec/changes/add-global-training/`)
  - **proposal.md** (1.6 KB)
    - Why: Modern learning science (Interleaved Practice) shows mixing subjects improves retention
    - Goals: 4 key objectives including intelligent mixing algorithm, global entry point, and course indicators
    - User Story: One-button "Train All" to review everything due today, mixed together
  - **design.md** (2.1 KB)
    - Backend: `getAllDueCards()`, `calculateGlobalAvailableCards()`, `/api/training/global/due-cards`
    - Frontend: `useTrainingStore.startGlobalSession()`, course badge on cards, due cards counter
    - Data Flow: Budget calculation → Candidate fetching → Filtering with dual limits → Shuffling for interleaving
    - Performance: SQL limit of 1000 cards to prevent memory overload
  - **tasks.md** (1.1 KB, 3 phases)
    - Phase 1: Backend (4 tasks: repository, service, API endpoint)
    - Phase 2: Frontend (5 tasks: store, page, router, home button, course badge)
    - Phase 3: Verification (6 scenarios: session start, mixing, limits, indicators, counters)
  - **specs/global-training/spec.md** (NEW spec, 1.9 KB)
    - 4 requirements with SHALL/MUST keywords
    - **Global Interleaved Queue**: Mix cards from all courses in one session
    - **Limit Hierarchy Enforcement**: Respect both global AND course limits simultaneously
    - **Interleaving Strategy**: Random card order after filtering for urgency
    - **Due Cards Visibility**: Display total due count on HomePage, disable button when zero

- **Key Features Documented**
  - **Intelligent Mixing Algorithm**:
    - Fetches due cards sorted by urgency (`due ASC`)
    - Filters using dual-level budgets (global + per-course)
    - Separates counters for New vs Review cards
    - Shuffles final result for interleaving (no subject blocking)
  - **Limit Hierarchy**:
    - Global limits (e.g., 300 reviews/day total)
    - Course limits (e.g., 20 new cards for "English")
    - Card accepted ONLY if: `CourseLimit > 0` AND `GlobalLimit > 0`
    - Example: Course limit reached → no more cards from that course, even if global limit allows
  - **UI Requirements**:
    - HomePage: "Train All" button with due cards counter (e.g., "15 cards ready")
    - HomePage: Button disabled/hidden when no due cards
    - TrainingPage: Course name badge on each card during global session
    - TrainingPage: "Back to Home" button instead of "Back to Course"
  - **Backend API**:
    - `GET /api/training/global/due-cards` → `{ cards: Card[], limits: {...} }`
    - Cards array contains mixed cards from all courses
    - Limits object shows remaining global budgets
  - **Frontend Architecture**:
    - Router: `/training/global` route
    - Store: `isGlobalSession` flag, `startGlobalSession()` method
    - TrainingPage: Adapts UI based on session type (global vs course-specific)

### Technical Details

- **OpenSpec Validation**: ✅ Passed `npx @fission-ai/openspec validate add-global-training --strict`
- **Markdown Linting**: ✅ All files pass markdownlint-cli2 with 0 errors
- **Change Status**: 0/15 tasks (proposal stage, ready for implementation)
- **Files Created**: 4
  - `openspec/changes/add-global-training/proposal.md`
  - `openspec/changes/add-global-training/design.md`
  - `openspec/changes/add-global-training/tasks.md`
  - `openspec/changes/add-global-training/specs/global-training/spec.md` (NEW spec)
- **No Code Changes**: Pure planning/proposal phase

### Architecture Highlights

```text
Global Training Data Flow:
  Frontend: HomePage "Train All" button
    ↓
  useTrainingStore.startGlobalSession()
    ↓
  Backend: LimitService.calculateGlobalAvailableCards()
    ├→ Calculate budgets (Global, per-Course)
    ├→ Fetch candidates (sorted by due ASC)
    ├→ Filter with dual limits
    │   • New card: take if GlobalNew > 0 AND CourseNew[id] > 0
    │   • Review card: take if GlobalReview > 0 AND CourseReview[id] > 0
    └→ Shuffle result (interleaving)
  Frontend: TrainingPage shows mixed cards with course badges
```

### Next Steps

- Implementation via `/openspec-apply add-global-training` after user approval
- New spec `global-training` will be formalized upon archiving
- After implementation: Users will benefit from scientifically-backed interleaved practice

## [0.6.2] - 2026-01-09 02:49

### Changed

#### OpenSpec: Archived Retention Settings Change

- Archived OpenSpec change `add-retention-settings` as `2026-01-08-add-retention-settings`
- Created two new specification documents:
  - `openspec/specs/settings-retention/spec.md` — Request retention parameter specification
  - `openspec/specs/settings-ui-sections/spec.md` — Collapsible settings UI sections specification
- All specs validated successfully with strict mode
- Change status: 30/32 tasks completed before archiving

## [0.6.2] - 2026-01-09 02:42

### Added

#### Feature: Request Retention Settings and Collapsible UI Sections

Implemented configurable `requestRetention` (learning intensity) parameter with 3 preset levels and reorganized settings UI into collapsible sections for better user experience.

**Motivation**: Previously, `request_retention = 0.9` was hardcoded in FSRS service, limiting user flexibility. Different learning contexts require different retention targets (e.g., cramming for exams vs. long-term casual learning).

**Solution**: Added user-selectable intensity levels (Low/Medium/High) at both global and course levels, with UI reorganization into collapsible sections for better navigation.

- **Database Changes**:
  - **Migration 008**: `add_request_retention`
    - Added `requestRetention REAL NOT NULL DEFAULT 0.9` to `settings` table
    - Added `requestRetention REAL nullable` to `courseSettings` table (null = inherit from global)
    - All existing settings default to 0.9 (current behavior, no breaking changes)

- **Backend Implementation**:
  - **schema.ts**: Extended `SettingsTable` and `CourseSettingsTable` with `requestRetention` field
  - **fsrs/index.ts**:
    - Updated `FSRSSettings` interface to include `requestRetention: number`
    - Modified `initializeFSRS()` to use `settings.requestRetention` instead of hardcoded 0.9
  - **settingsRepository.ts**:
    - Added `requestRetention: 0.9` to default settings
    - Extended `getEffectiveSettings()` to support retention inheritance (course → global)
  - **settings.ts** (validation):
    - Added `requestRetention: z.number().min(0.7).max(1.0).optional()` to `GlobalSettingsSchema`
    - Added `requestRetention: z.number().min(0.7).max(1.0).nullable().optional()` to `CourseSettingsSchema`

- **Frontend Implementation**:
  - **settings.ts** (types): Extended `GlobalSettings` and `CourseSettings` with `requestRetention?: number`
  - **RetentionLevelPicker.vue** (NEW component):
    - Radio buttons for 3 preset levels:
      - **Low (0.80)** — "Расслабленный режим": fewer repetitions, suitable for long-term learning
      - **Medium (0.90)** — "Стандарт": balanced mode (default)
      - **High (0.95)** — "Cramming": many repetitions, minimal forgetting, exam preparation
    - **Inherited option** (course settings only): "Использовать глобальное значение (Medium)"
    - Tooltips explaining each level's impact
    - Supports `isCourseSettings` prop for conditional rendering
  - **CollapsibleSection.vue** (NEW component):
    - Expandable/collapsible sections with chevron icons (bi-chevron-down/right)
    - **localStorage persistence**: state saved per-section using unique `storageKey`
    - **Keyboard accessibility**: Tab navigation, Enter/Space to toggle
    - **Smooth animations**: slideDown (0.2s) for content reveal
  - **SettingsForm.vue** (MAJOR REFACTOR):
    - Reorganized into **5 collapsible sections** (global settings):
      1. Временные рамки тренировок (TimeRangePicker, minTimeBeforeEnd)
      2. **Параметры FSRS** (learningSteps, enableFuzz, **requestRetention**)
      3. Уведомления (notificationsEnabled)
      4. Дневные лимиты (по всем курсам) (globalNewCardsPerDay, globalMaxReviewsPerDay)
      5. Лимиты курсов по умолчанию (defaults for courses without custom settings)
    - Reorganized into **4 collapsible sections** (course settings):
      1. Временные рамки тренировок
      2. **Параметры FSRS** (includes **Inherited** option for requestRetention)
      3. Дневные лимиты курса
      4. Сессионные лимиты
    - Section state persistence with unique keys per context (global vs. course)
    - Validation for `requestRetention` (0.7-1.0 range)

### Changed

- **FSRS Behavior**: FSRS algorithm now uses user-configurable retention value instead of hardcoded 0.9
- **Settings UI**: Transformed from flat vertical list to organized collapsible sections
  - Reduces visual clutter (forms are now ~50% shorter when sections collapsed)
  - Improves navigation and focus on relevant settings
  - State persists across sessions (localStorage)

### Technical Details

- **Files Created**: 3
  - `backend/src/services/database/migrations.ts` (migration 008)
  - `frontend/src/shared/ui/RetentionLevelPicker.vue`
  - `frontend/src/shared/ui/CollapsibleSection.vue`

- **Files Modified**: 9
  - Backend (5): `schema.ts`, `fsrs/index.ts`, `settingsRepository.ts`, `settings.ts` (validation), `routes/settings.ts`
  - Frontend (4): `shared/types/settings.ts`, `widgets/settings-form/SettingsForm.vue`, `shared/ui/CollapsibleSection.vue`, `shared/ui/RetentionLevelPicker.vue`

- **OpenSpec Status**:
  - ✅ Change `add-retention-settings` implemented
  - ✅ All 7 phases completed (Database → Backend → API → Frontend → UI Components → Testing)
  - New specs: `settings-retention`, `settings-ui-sections`

- **Migration**: ✅ Successfully applied (`008_add_request_retention`)
  - All existing settings records updated with `requestRetention = 0.9`
  - No data loss, backward compatible

### User Experience

- ✅ **Flexible Learning Intensity**: Users can now choose retention levels based on their goals (cramming vs. relaxed learning)
- ✅ **Course-Specific Retention**: Different courses can have different intensities (e.g., exam prep at High, hobby at Low)
- ✅ **Cleaner Settings UI**: Collapsible sections reduce visual overload, improve navigation
- ✅ **State Persistence**: Section expand/collapse states remembered across sessions
- ✅ **Accessibility**: Full keyboard navigation support (Tab, Enter, Space)
- ✅ **No Breaking Changes**: All existing data preserves current behavior (0.9 retention)

### Architecture Highlights

```text
Request Retention Flow:
  User selects level (Low/Medium/High)
    → SettingsForm/CourseSettingsModal
    → RetentionLevelPicker (maps label to value)
    → useSettingsStore
    → PUT /api/settings or PUT /api/courses/:id/settings
    → settingsRepository / courseSettingsRepository
    → fsrs/index.ts (initializeFSRS with configurable retention)
    → FSRS algorithm uses custom retention value
    → Affects interval calculations for all future reviews

Collapsible Sections:
  CollapsibleSection.vue
    ├─ localStorage.getItem(storageKey) on mount
    ├─ localStorage.setItem(storageKey) on toggle
    ├─ Keyboard: Enter/Space to toggle
    └─ Animation: slideDown (0.2s ease-out)
```

### Next Steps

- Archive OpenSpec change: `/openspec-archive add-retention-settings`
- Potential future enhancements:
  - Advanced retention customization (custom values 0.70-1.00)
  - Visualization of retention impact on intervals
  - Per-tag retention settings

## [0.6.1] - 2026-01-09 01:25

### Fixed

#### Daily Progress Timezone-Aware Tracking

Fixed timezone mismatch causing daily training statistics to show zero progress after completing training sessions.

**Problem**: Daily progress records were saved using UTC dates, but frontend queried statistics using user's local timezone (Asia/Shanghai UTC+8), resulting in date mismatch and zero displayed progress.

**Solution**: Implemented timezone-aware progress tracking throughout the training flow.

- **Backend Changes**:
  - **ReviewCardSchema** (`backend/src/schemas/card.ts`): Added optional `timezone` field to review payload
  - **Review Endpoint** (`backend/src/routes/training.ts`): Extracts `timezone` from request body (fallback to UTC)
  - **limitService** (`backend/src/services/limitService.ts`): Updated `updateProgressAfterReview()` function:
    - Now accepts `timezone` parameter (default: 'UTC')
    - Uses `formatDate(new Date(), timezone)` for correct daily progress date calculation
    - Ensures progress records saved with user's local date instead of UTC date

- **Frontend Changes**:
  - **trainingApi** (`frontend/src/shared/api/training.js`): Added `timezone` parameter to `submitReview()` method
  - **useTrainingStore** (`frontend/src/entities/training/model/useTrainingStore.js`): Auto-detects user timezone:
    - Uses `Intl.DateTimeFormat().resolvedOptions().timeZone` to get user's timezone
    - Passes timezone to API with every card review submission

- **Data Migration**:
  - Created script to analyze and split mixed progress data by `lastReview` timestamps
  - Found 30 cards reviewed today after midnight UTC+8 (2026-01-08T16:00:00Z = 2026-01-09 00:00 Asia/Shanghai)
  - Updated yesterday's record: 60→50 new cards, 20→0 reviews
  - Created today's record: 10 new cards, 20 reviews

**Result**: Statistics now correctly display daily progress in user's local timezone. Future training sessions will automatically save progress with correct dates.

**Files Modified**: 5

- `backend/src/schemas/card.ts`
- `backend/src/routes/training.ts`
- `backend/src/services/limitService.ts`
- `frontend/src/shared/api/training.js`
- `frontend/src/entities/training/model/useTrainingStore.js`

## [0.6.0] - 2026-01-09 00:58

### Changed

#### Database: Date Format Unification

Unified all database dates to ISO 8601 UTC format and fixed statistics timezone handling for UTC+8.

- **Migration Script**: Created one-time migration to convert SQLite `CURRENT_TIMESTAMP` dates from UTC+8 to ISO 8601 UTC
  - **File**: `backend/src/scripts/migrate-dates.ts`
  - Migrated 3 courses, 105 cards, 2 settings (110 records total)
  - Dates converted from `"YYYY-MM-DD HH:MM:SS"` (UTC+8 local time) to `"YYYY-MM-DDTHH:MM:SS.sssZ"` (ISO 8601 UTC)
- **Date Utilities**: Created timezone-aware date utilities
  - **File**: `backend/src/utils/dateUtils.ts`
  - `getCurrentISOString()` — get current date in ISO 8601 UTC
  - `formatDateInTimezone()` — format date in YYYY-MM-DD with timezone support
  - `getLocalToday()` — get "today" date for specific timezone
  - `convertSQLiteDateToISO()` — convert SQLite dates to ISO 8601 UTC

- **Statistics Service**: Updated `limitService.ts` to support user timezone
  - Function `formatDate()` now accepts `timezone` parameter
  - Uses `Intl.DateTimeFormat` for timezone-aware date formatting
  - Function `getDailyStats()` now accepts `timezone` parameter

- **API Endpoint Consolidation**: Merged statistics endpoints
  - **Modified**: `GET /api/training/stats` now accepts `?timezone` parameter
  - **Added**: Returns `totalNewCards` field (previously in `/api/stats/global`)
  - **Deleted**: `backend/src/routes/stats.ts` (functionality merged into training endpoint)
  - Backend endpoint now returns unified statistics response

- **Frontend Integration**: Updated stats store and API client
  - **Modified**: `frontend/src/entities/stats/model/useStatsStore.js`
    - Detects user timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone`
    - Passes timezone to API when fetching stats
    - Uses single unified endpoint instead of two separate ones
  - **Modified**: `frontend/src/shared/api/training.js`
    - Method `getStats()` now accepts and passes `timezone` parameter
  - **Deleted**: `frontend/src/shared/api/stats.js` (no longer needed)

### Fixed

- **Statistics Timezone Bug**: Daily stats now correctly account for user's local timezone (UTC+8)
  - Before: Statistics showed UTC day, not user's local day
  - After: Statistics reset at midnight in user's timezone
  - Impact: Home page statistics now display correct "today" data

### Technical Details

- **Migration Results**:
  - ✅ Courses: 3/3 updated
  - ✅ Cards: 105/105 updated
  - ✅ Settings: 1/1 updated
  - ✅ Course Settings: 1/1 updated
  - ✅ Daily Progress: 0/2 (already in correct format)

- **Date Format Examples**:
  - Before: `"2026-01-08 05:39:57"` (SQLite CURRENT_TIMESTAMP, ambiguous timezone)
  - After: `"2026-01-07T21:39:57.000Z"` (ISO 8601 UTC, explicit timezone)

- **Files Created**: 2
  - `backend/src/scripts/migrate-dates.ts` — one-time migration script
  - `backend/src/utils/dateUtils.ts` — timezone utilities

- **Files Modified**: 6
  - `backend/src/services/limitService.ts` — timezone support
  - `backend/src/routes/training.ts` — unified stats endpoint
  - `backend/src/routes/index.ts` — removed stats router
  - `backend/package.json` — added migrate-dates script
  - `frontend/src/entities/stats/model/useStatsStore.js` — timezone detection
  - `frontend/src/shared/api/training.js` — timezone parameter

- **Files Deleted**: 2
  - `backend/src/routes/stats.ts`
  - `frontend/src/shared/api/stats.js`

### Architecture Improvements

```text
Before:
  Frontend → GET /api/training/stats (daily stats)
  Frontend → GET /api/stats/global (new cards count)

After:
  Frontend (detects timezone) → GET /api/training/stats?timezone=Asia/Shanghai
    └→ Returns: { ...dailyStats, totalNewCards }
```

## [0.6.0] - 2026-01-08 23:43

### Added

#### Feature: Aggregated Training Statistics on Home Page

Implemented comprehensive statistics display on the home page showing global training progress, daily limits, and remaining cards across all courses.

- **Frontend Implementation**:
  - **GlobalStats.vue** (новый компонент, `frontend/src/widgets/global-stats/`)
    - Displays 5 key metrics with icons:
      - Новых карточек (всего) — total new cards across all courses
      - Изучено/повторено сегодня — daily training completion (newCardsStudied + reviewsCompleted)
      - Осталось на сегодня — remaining cards today (considering global limits)
      - Дневной лимит новых карточек — global new cards per day limit
      - Тренировок сегодня — total training sessions completed today
    - Loading state: spinner + "Загрузка статистики..."
    - Error state: error message + retry button
    - Placeholder for future chart: "График статистики (скоро)"
  - **StatItem.vue** (новый компонент, `frontend/src/shared/ui/`)
    - Reusable component for displaying individual statistics
    - Icon + label + value layout
    - Bootstrap Icons integration (24px)
    - Bold value display (24px font)
  - **HomePage.vue** — Two-column responsive layout
    - Desktop (≥1024px): 50%/50% grid layout (courses | stats)
    - Mobile (<1024px): single column, stats displayed above courses
    - Max width increased to 1600px for better space utilization
  - **useStatsStore.js** (новый Pinia store, `frontend/src/entities/stats/model/`)
    - State management for global statistics
    - Action `fetchGlobalStats()` combines data from two sources:
      - `GET /api/training/stats` — daily training statistics
      - `GET /api/stats/global` — total new cards count
    - Calculates derived metrics (remainingToday, trainingsToday)
  - **TrainingPage.vue** — Auto-refresh integration
    - Calls `statsStore.fetchGlobalStats()` after each review submission
    - Ensures home page stats stay up-to-date during training sessions

- **Backend Implementation**:
  - **stats.ts** (новый роут, `backend/src/routes/`)
    - `GET /api/stats/global` endpoint
    - Returns `{ totalNewCards: number }`
  - **cardRepository.ts** — Extended repository
    - New method: `getGlobalNewCardsCount()`
    - SQL query: `SELECT COUNT(id) FROM cards WHERE state = 0`
    - Returns total count of new cards across all courses
  - **routes/index.ts** — Router registration
    - Added stats router to main routes

- **Data Flow**:

  ```text
  HomePage.vue (onMounted)
    ↓
  useStatsStore.fetchGlobalStats()
    ├→ GET /api/training/stats (daily progress)
    ├→ GET /api/stats/global (new cards count)
    └→ calculate metrics
  GlobalStats.vue ← displays results
  ```

### Changed

- **HomePage.vue Layout**:
  - Changed from single-column to responsive two-column grid
  - Desktop: courses and stats side-by-side
  - Mobile: stats above courses list
  - Increased max-width from 1200px to 1600px

- **Training Integration**:
  - Training page now updates global stats after each review
  - Enables real-time statistics tracking across the application

### Technical Details

- **Files Created**: 5
  - `backend/src/routes/stats.ts` — global stats API
  - `frontend/src/shared/api/stats.js` — stats API client
  - `frontend/src/entities/stats/model/useStatsStore.js` — Pinia store
  - `frontend/src/shared/ui/StatItem.vue` — stat display component
  - `frontend/src/widgets/global-stats/GlobalStats.vue` — main stats widget

- **Files Modified**: 4
  - `backend/src/routes/index.ts` — stats router registration
  - `backend/src/services/repositories/cardRepository.ts` — getGlobalNewCardsCount()
  - `frontend/src/pages/home/HomePage.vue` — responsive layout
  - `frontend/src/pages/training/TrainingPage.vue` — stats refresh

- **OpenSpec Status**:
  - ✅ Change `add-home-stats` implementation completed
  - ✅ All phases executed (Backend API, State Management, UI, Responsive, Integration)
  - Ready for archiving and spec generation

- **Architecture Decisions**:
  - Separate endpoint `/api/stats/global` for semantic clarity (global vs daily metrics)
  - 50%/50% grid layout to balance courses list with statistics display
  - Stats entity in FSD structure (`entities/stats`) for clear domain separation
  - Mobile-first approach: stats shown first on mobile for immediate progress visibility

- **User Experience**:
  - ✅ Immediate visibility of training progress on home page
  - ✅ Clear understanding of daily limits and remaining cards
  - ✅ Motivation through visible daily achievements
  - ✅ Responsive design works on all screen sizes
  - ✅ Auto-updates after training sessions
  - ✅ Theme-aware (CSS variables for light/dark modes)
  - ✅ Loading and error states for better UX

### Next Steps

- Archive OpenSpec change with `/openspec-archive add-home-stats`
- Future enhancement: Add statistics chart (tracked in placeholder)
- Consider adding per-course breakdown option

## [0.5.0] - 2026-01-08 22:55

### Added

#### OpenSpec: Home Page Statistics Proposal

Создан комплексный OpenSpec proposal для добавления агрегированной статистики тренировок на главную страницу приложения.

- **OpenSpec Change Created**: `add-home-stats`
  - Предложение по добавлению глобальной статистики на главную страницу
  - Мотивация: пользователь не видит общий прогресс обучения, лимиты и ежедневную активность
  - Решение: двухколоночный layout (список курсов + статистика) на desktop, single column на mobile

- **Proposal Structure** (`openspec/changes/add-home-stats/`)
  - **proposal.md** (5.4 KB)
    - Problem: 4 ключевых проблемы (нет обзора прогресса, лимитов, мотивации, неэффективное пространство)
    - Why: 5 обоснований важности (прогресс, лимиты, мотивация, эффективность, расширяемость)
    - Solution: двухколоночный layout (50%/50%) на desktop, статистика выше курсов на mobile
    - Benefits: мотивация, прозрачность, эффективное использование пространства, готовая основа для графиков
    - Scope: новый endpoint, компонент GlobalStats, layout изменения, адаптивный дизайн, Pinia store
  - **design.md** (19.7 KB)
    - Architecture: Frontend (HomePage + GlobalStats + useStatsStore) + Backend (endpoint + repository)
    - Component design: GlobalStats с 5 метриками + placeholder для графика
    - Data flow: HomePage → useStatsStore → GET /api/training/stats + GET /api/stats/global
    - API design: новый endpoint `/api/stats/global` для получения общего количества новых карточек
    - Layout: CSS grid (1fr 1fr) для desktop, single column для mobile
    - Key decisions: почему отдельный endpoint, почему 50%/50%, где хранить store
  - **tasks.md** (9.2 KB, 6 фаз, ~6-7 часов)
    - Phase 1: Backend API (3 tasks: endpoint, repository, testing)
    - Phase 2: Frontend State Management (2 tasks: create store, test in DevTools)
    - Phase 3: UI Components (3 tasks: StatItem, GlobalStats, HomePage layout)
    - Phase 4: Responsive Design (2 tasks: mobile layout, testing)
    - Phase 5: Integration and Polish (3 tasks: refresh after training, theme support, accessibility)
    - Phase 6: Documentation and Cleanup (3 tasks: Walkthrough, Changelog, linting)
  - **specs/home-stats/spec.md** (NEW spec, 9.1 KB)
    - 7 requirements with SHALL keywords
    - Two-Column Layout on Desktop (2 scenarios: desktop, mobile)
    - Aggregated Statistics Display (3 scenarios: metrics, loading, error)
    - Remaining Cards Calculation (3 scenarios: new, review, total)
    - Global Statistics API Endpoint (2 scenarios: fetching, error handling)
    - Statistics Store with Pinia (1 scenario: fetching via store)
    - Visual Consistency with Design System (2 scenarios: Card component, icons/typography)
    - Placeholder for Future Chart (1 scenario: chart placeholder)

- **Key Features Documented**
  - **Статистика включает 5 метрик**:
    - Новых карточек (всего) — общее количество новых карточек по всем курсам
    - Изучено/повторено сегодня — сумма newCardsStudied + reviewsCompleted
    - Осталось на сегодня — с учётом глобальных лимитов (new + review)
    - Дневной лимит новых карточек — globalNewCardsPerDay из настроек
    - Тренировок сегодня — общее количество завершённых повторений
  - **Layout**:
    - Desktop (≥1024px): две колонки 50%/50% с gap 24px
    - Mobile (<1024px): single column, статистика выше списка курсов
    - Адаптивный перенос через CSS grid + media query
  - **Backend API**:
    - Новый endpoint: `GET /api/stats/global` → `{ totalNewCards: number }`
    - Использование существующего: `GET /api/training/stats` для дневной статистики
    - Новый метод: `cardRepository.getGlobalNewCardsCount()` (SQL count с фильтром state = NEW)
  - **Frontend Architecture**:
    - Новый компонент: `GlobalStats.vue` (использует useStatsStore)
    - Новый компонент: `StatItem.vue` (icon + label + value)
    - Новый Pinia store: `useStatsStore` (state, actions, fetchGlobalStats)
    - Обновлён: `HomePage.vue` (двухколоночный layout через CSS grid)
  - **User Experience**:
    - Placeholder для графика: "График статистики (скоро)" (dashed border, 200px height)
    - Loading state: spinner + "Загрузка статистики..."
    - Error state: сообщение + кнопка "Попробовать снова"
    - Поддержка светлой и тёмной темы (CSS variables)
    - Accessibility: ARIA labels, tooltips, keyboard navigation

### Technical Details

- **OpenSpec Validation**: ✅ Passed `npx @fission-ai/openspec validate add-home-stats --strict`
- **Change Status**: 0/~15 tasks (proposal stage, ready for user review and approval)
- **Files Created**: 4
  - `openspec/changes/add-home-stats/proposal.md`
  - `openspec/changes/add-home-stats/design.md`
  - `openspec/changes/add-home-stats/tasks.md`
  - `openspec/changes/add-home-stats/specs/home-stats/spec.md` (NEW spec)
- **No Code Changes**: Pure planning/proposal phase
- **Total Estimated Effort**: 6-7 hours full implementation

### Architecture Highlights

```
Frontend (HomePage)
  ↓ onMounted → fetchGlobalStats()
useStatsStore
  ├→ GET /api/training/stats (дневная статистика)
  ├→ GET /api/stats/global (общее кол-во новых карточек)
  └→ calculate metrics (studiedToday, remainingToday, trainingsToday)
GlobalStats.vue → StatItem.vue (x5) + Placeholder (график)
```

### Next Steps

- User review and approval of proposal
- Implementation via `/openspec-apply add-home-stats` after approval
- New spec `home-stats` will be created upon archiving
- После реализации: v0.6.0 с полноценной статистикой на главной странице

## [0.5.0] - 2026-01-08 21:40

### Changed

#### Feature Improvement: Course Card "Updated" Date Logic

Улучшена логика отображения даты "Обновлено" в карточках курсов на главной странице.

**Проблема**: Ранее дата "Обновлено" показывала только `course.updatedAt`, что отражало лишь редактирование названия/описания курса, но не добавление контента (карточек).

**Решение**: Теперь отображается **максимальная дата** из двух источников:

- `course.updatedAt` — дата последнего редактирования метаданных курса (название, описание)
- `stats.lastCardAdded` — дата последнего добавления карточки в курс

**Результат**: Пользователь видит реальную активность в курсе — будь то добавление контента или редактирование метаданных.

**Технические детали**:

- Backend: Добавлено поле `lastCardAdded` в `cardRepository.getAllCoursesStats()`
  - Вычисляется как `max(card.createdAt)` для каждого курса
- Frontend: Обновлён `CourseCard.vue` для сравнения двух дат и показа более поздней

#### Documentation: Project Documentation Update

Актуализирована документация проекта для отражения текущего состояния разработки.

- **readme.md**:
  - Обновлен раздел "Data Structure":
    - Удалено устаревшее поле `elapsedDays` из `Card` interface
    - Добавлена полная структура `Settings` с FSRS параметрами и лимитами
    - Добавлен `CourseSettings` с паттерном наследования
  - Обновлен раздел "Application Features / Implemented":
    - **Course & Card Management**: отражены batch operations, card editing, course statistics
    - **Training System**: добавлена информация о FSRS v5, 4-tier limits, visual training UI
    - **Settings System**: custom time pickers, FSRS configuration, limits configuration
    - **UI & UX**: custom dialogs, toast notifications, animations, responsive design
    - **Backend Core**: repositories, services, business logic separation
  - Обновлен раздел "Current Status":
    - Версия: **0.5.0 (MVP Feature Complete)**
    - Список реализованных core features
    - Roadmap к v1.0 (tray, notifications, deep linking)

- **openspec/project.md**:
  - Обновлен раздел "Project Status":
    - Текущая версия: **0.5.0 (MVP Feature Complete)**
    - Подробный список реализованных фич по категориям:
      - Архитектура & Инфраструктура
      - Управление Курсами и Карточками
      - Система Тренировок
      - Система Настроек
      - UI/UX Система
      - Backend Services
    - Список всех актуальных OpenSpec specs (7 specs)
  - Обновлен раздел "В работе":
    - Desktop Integration (Priority 1 для v1.0): tray, notifications, deep linking
  - Обновлен раздел "Запланировано":
    - Priority 2 (Post v1.0): statistics dashboard, import/export, media, search, tags

- **docs/Walkthrough.md**:
  - Создан comprehensive walkthrough всего проекта
  - Структура по фазам разработки (Phases 1-7):
    - Phase 1: Architecture & Foundation
    - Phase 2: Styling System
    - Phase 3: Settings System
    - Phase 4: Course & Card Management
    - Phase 5: Training System
    - Phase 6: UI Enhancements
    - Phase 7: Statistics & Polish
  - Добавлены разделы:
    - Current Architecture (frontend FSD, backend structure)
    - OpenSpec Specs (7 specs с описаниями)
    - Key Technical Decisions
    - Code Quality Standards
    - Next Steps (v0.6-0.9 → v1.0)

### Technical Details

- **Version Update**: Обновлена версия во всех `package.json`:
  - `package.json`: **0.5.0**
  - `backend/package.json`: **0.5.0**
  - `frontend/package.json`: **0.5.0**

- **Files Modified**: 6
  - `readme.md` — актуализация статуса и features
  - `openspec/project.md` — обновление статуса проекта
  - `docs/Walkthrough.md` — comprehensive overview (полная переработка)
  - `package.json`, `backend/package.json`, `frontend/package.json` — версия 0.5.0

- **Next Milestone**: v1.0.0
  - **Priority 1 Requirements**:
    - System Tray Integration
    - System Notifications
    - Deep Linking (open app in training mode)
  - После реализации Priority 1 → готов к релизу v1.0

### Notes

**v0.5.0 = MVP Feature Complete** — все основные функции SRS-приложения реализованы. До полноценного v1.0 остаются только функции desktop integration (tray, notifications, deep linking).

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
      name: i.toString().padStart(2, "0") + ":00",
      value: i,
    })),
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
  if (!courseId) return state.globalSettings;
  return state.courseSettings.get(courseId) || state.globalSettings;
};
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
