# Repetitio Implementation Plan

Electron application for learning with flashcards and spaced repetition based on Vue 3, TypeScript, Tailwind CSS, and Express backend.

> [!IMPORTANT]
> The application uses a custom protocol `lmorozanki://` to load frontend resources, which requires specific routing and CSP policy configuration.

> [!IMPORTANT]
> The application window uses `frame: false` (frameless), so a custom title bar with window controls (minimize, maximize, close) implementation is required.

---

## Proposed Changes

### Frontend Architecture

#### Feature-Sliced Design

Code organization by layers:

```text
frontend/src/
├── app/              # Application initialization
│   ├── main.js      # Entry point
│   ├── App.vue      # Root component
│   └── router/      # Router configuration
├── pages/           # Application pages
│   ├── home/
│   ├── course/
│   ├── training/
│   └── settings/
├── widgets/         # Composite UI blocks
│   ├── title-bar/   # Custom window title
│   ├── course-list/
│   └── card-editor/
├── features/        # Business features
│   ├── create-course/
│   ├── add-card/
│   └── spaced-repetition/
├── entities/        # Business entities
│   ├── course/
│   ├── card/
│   └── settings/
└── shared/          # Reusable code
    ├── ui/          # UI primitives
    ├── lib/         # Utilities
    ├── api/         # HTTP client
    └── types/       # TypeScript types
```

---

### Components and Modules

#### App Layer

##### [NEW] [main.js](file:///e:/Develop/anki-tiny/frontend/src/app/main.js)

- Vue application initialization
- Router and global styles connection
- Electron API handlers registration

##### [NEW] [App.vue](file:///e:/Develop/anki-tiny/frontend/src/app/App.vue)

- Root component with `TitleBar` widget
- Area for `<router-view>`
- Global overlays (notifications, modals)

##### [NEW] [router/index.js](file:///e:/Develop/anki-tiny/frontend/src/app/router/index.js)

- Vue Router configuration with **hash mode** (`createWebHashHistory`)
- Routes: `/`, `/course/:id`, `/training/:id`, `/settings`
- Navigation guards for state checking

> [!WARNING]
> Using `createWebHashHistory` is mandatory due to the custom `lmorozanki://` protocol. WebHistory will not work correctly.

---

#### Widgets Layer

##### [NEW] [title-bar/TitleBar.vue](file:///e:/Develop/anki-tiny/frontend/src/widgets/title-bar/TitleBar.vue)

Custom window title implementation:

**Functionality:**

- Display application title
- Area with `-webkit-app-region: drag` for window dragging
- Window control buttons:
    - **Minimize**: `window.electronAPI.minimize()`
    - **Maximize/Restore**: `window.electronAPI.toggleMaximize()`
    - **Close**: `window.electronAPI.close()`

**Styling:**

- Fixed height: 32-40px
- Backdrop blur effect (acrylic material)
- Icons from `bootstrap-icons`
- Hover states for buttons

**Technical Details:**

```css
.title-bar {
    -webkit-app-region: drag;
}

.window-controls button {
    -webkit-app-region: no-drag;
}
```

##### [NEW] [course-list/CourseList.vue](file:///e:/Develop/anki-tiny/frontend/src/widgets/course-list/CourseList.vue)

- List of courses with preview (name, card count, progress)
- Action buttons (Edit, Delete, Start Training)

##### [NEW] [card-editor/CardEditor.vue](file:///e:/Develop/anki-tiny/frontend/src/widgets/card-editor/CardEditor.vue)

- Form for creating/editing a card
- Fields: Front, Back
- Rich text support (optional)

---

#### Pages Layer

##### [NEW] [home/HomePage.vue](file:///e:/Develop/anki-tiny/frontend/src/pages/home/HomePage.vue)

- Main page with course overview
- Uses `CourseList` widget
- "Create Course" button

##### [NEW] [course/CoursePage.vue](file:///e:/Develop/anki-tiny/frontend/src/pages/course/CoursePage.vue)

- Detailed course view
- Card list
- Quick add cards
- Course settings

##### [NEW] [training/TrainingPage.vue](file:///e:/Develop/anki-tiny/frontend/src/pages/training/TrainingPage.vue)

- Training interface
- Card display (Front → Back on click)
- Difficulty rating buttons (Again, Hard, Good, Easy)
- Current session progress bar

##### [NEW] [settings/SettingsPage.vue](file:///e:/Develop/anki-tiny/frontend/src/pages/settings/SettingsPage.vue)

- Global settings
- Training time frames (from/to)
- Spaced repetition parameters

---

#### Shared Layer

##### [NEW] [shared/ui/Button.vue](file:///e:/Develop/anki-tiny/frontend/src/shared/ui/Button.vue)

Base button component with variants: primary, secondary, danger

##### [NEW] [shared/ui/Input.vue](file:///e:/Develop/anki-tiny/frontend/src/shared/ui/Input.vue)

Base input field component

##### [NEW] [shared/ui/Card.vue](file:///e:/Develop/anki-tiny/frontend/src/shared/ui/Card.vue)

Base card component for content

##### [NEW] [shared/api/client.js](file:///e:/Develop/anki-tiny/frontend/src/shared/api/client.js)

Axios-based HTTP client for backend API:

```javascript
import axios from 'axios';

let backendPort = 3000;

window.electronAPI?.onBackendPort((port) => {
    backendPort = port;
});

const api = axios.create({
    baseURL: `http://localhost:${backendPort}/api`,
});

export default api;
```

##### [NEW] [shared/types/electron.d.ts](file:///e:/Develop/anki-tiny/frontend/src/shared/types/electron.d.ts)

TypeScript types for Electron API:

```typescript
interface ElectronAPI {
  onBackendPort: (callback: (port: number) => void) => void;
  openNewWindow: (path: string) => void;
  minimize: () => void;
  toggleMaximize: () => void;
  close: () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
```

---

### Backend

#### API Endpoints

##### [NEW] [routes/courses.ts](file:///e:/Develop/anki-tiny/backend/src/routes/courses.ts)

- `GET /api/courses` - list courses
- `POST /api/courses` - create course
- `GET /api/courses/:id` - get course
- `PUT /api/courses/:id` - update course
- `DELETE /api/courses/:id` - delete course

##### [NEW] [routes/cards.ts](file:///e:/Develop/anki-tiny/backend/src/routes/cards.ts)

- `GET /api/courses/:courseId/cards` - list course cards
- `POST /api/courses/:courseId/cards` - add card
- `PUT /api/cards/:id` - update card
- `DELETE /api/cards/:id` - delete card

##### [NEW] [routes/training.ts](file:///e:/Develop/anki-tiny/backend/src/routes/training.ts)

- `GET /api/courses/:courseId/due-cards` - cards due for review
- `POST /api/training/review` - submit review result

##### [NEW] [routes/settings.ts](file:///e:/Develop/anki-tiny/backend/src/routes/settings.ts)

- `GET /api/settings` - get global settings
- `PUT /api/settings` - update settings
    - `trainingStartHour`: training start hour (default 8)
    - `trainingEndHour`: training end hour (default 22)
    - `minTimeBeforeEnd`: minimum time before day end (4 hours)
    - `notificationsEnabled`: whether notifications are enabled

##### [NEW] [routes/course-settings.ts](file:///e:/Develop/anki-tiny/backend/src/routes/course-settings.ts)

- `GET /api/courses/:courseId/settings` - get course settings
- `PUT /api/courses/:courseId/settings` - update course settings
- `DELETE /api/courses/:courseId/settings` - reset to global settings

---

#### Services

##### [NEW] [services/database.ts](file:///e:/Develop/anki-tiny/backend/src/services/database.ts)

Service for persistent storage (JSON or SQLite):

- DB initialization in `app.getPath('userData')`
- CRUD operations

##### [NEW] [services/spaced-repetition.ts](file:///e:/Develop/anki-tiny/backend/src/services/spaced-repetition.ts)

Spaced repetition algorithm implementation (FSRS):

- Calculate next review interval
- Update easiness factor
- Determine due date

##### [NEW] [services/notifications.ts](file:///e:/Develop/anki-tiny/backend/src/services/notifications.ts)

Service for system notifications:

- Check for due cards
- Filter by training time (`trainingStartHour` / `trainingEndHour`)
- **Important**: Do not offer new cards if less than 4 hours remain until day end
  (first spaced repetition step = 4 hours)
- Send Electron Notification
- Partiodic check (every hour)

##### [NEW] [services/statistics.ts](file:///e:/Develop/anki-tiny/backend/src/services/statistics.ts)

Service for progress statistics:

- Calculate course statistics (total cards, learned, remaining)
- Study history by day
- Answer accuracy (Again/Hard/Good/Easy)

---

#### Electron Integration

##### [MODIFY] [electron/main.ts](file:///e:/Develop/anki-tiny/backend/src/electron/main.ts)

**Add Tray support:**

```typescript
import { Tray, Menu } from 'electron';

let tray: Tray | null = null;

function createTray() {
  tray = new Tray(path.join(__dirname, '../../icon.png'));

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open', click: () => mainWindow?.show() },
    { label: 'Exit', click: () => app.quit() }
  ]);

  tray.setToolTip('Repetitio');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    mainWindow?.show();
  });
}

// Change window-close behavior
ipcMain.on('window-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win?.hide(); // Hide instead of close (minimize to tray)
  event.preventDefault(); // Prevent closing
});

// Handle quit from tray
app.on('before-quit', () => {
  // Cleanup
});
```

**Configure notifications:**

```typescript
import { Notification } from 'electron';

ipcMain.handle('show-notification', (_, title, body) => {
  new Notification({ title, body }).show();
});
```

##### [MODIFY] [electron/preload.ts](file:///e:/Develop/anki-tiny/backend/src/electron/preload.ts)

Add method for notifications:

```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  // ... existing methods
  showNotification: (title: string, body: string) =>
    ipcRenderer.invoke('show-notification', title, body),
});
```

---

### Configuration

#### [MODIFY] [vite.config.js](file:///e:/Develop/anki-tiny/frontend/vite.config.js)

CSP policy is already correctly configured for `lmorozanki://` protocol.

**Check:**

- `base: './'` - relative paths
- CSP includes `lmorozanki:` for all source directives

##### [MODIFY] [index.html](file:///e:/Develop/anki-tiny/frontend/index.html)

Update title:

```html
<title>Repetitio</title>
```

Update path to main.js:

```html
<script type="module" src="/src/app/main.js"></script>
```

---

### Card Operations

To implement FSRS (Free Spaced Repetition Scheduler),
we need to move away from simple multipliers and store memory "state" history for each card.
We use the library <https://github.com/open-spaced-repetition/ts-fsrs>

#### 1. Database Fields for Each Card

In classic SM-2 (old Anki) we stored "easiness factor".
In FSRS we need to store variables describing current memory "strength".

##### 1. Mandatory Fields for FSRS

The `ts-fsrs` library expects you to pass it a card object. To restore this object from DB, you need these fields:

`due` **(Datetime)**: Date and time of next review.
You will query `SELECT * FROM cards WHERE due <= NOW()` using this field.

`stability` **(Float)**: One of the key FSRS parameters.

`difficulty` **(Float)**: Current card difficulty.

`elapsed_days` **(Int)**: Days passed since last successful review.

`scheduled_days` **(Int)**: For what interval the card was scheduled last time.

`reps` **(Int)**: Total repetition count.

`lapses` **(Int)**: How many times user forgot the card (pressed "Again").

`state` **(Int/Enum)**: Card state (0 - New, 1 - Learning, 2 - Review, 3 - Relearning).

##### 2. Additional Fields for Your Logic

To implement "learning steps" (e.g., the 4 hours) and `enable_fuzz`, add:

`last_review` **(Datetime)**: Time of last answer. Needed for calculations and statistics.

`step_index` **(Int)**: If your deck settings specify steps (e.g., `["10m", "4h"]`), this field stores which step the new card is currently on.

##### Example Structure (JSON/SQL)

| Field          | Type       | Description                                              |
|----------------|------------|----------------------------------------------------------|
| id             | UUID / Int | Primary Key                                              |
| deck_id        | Int        | Link to deck/course (where `enable_fuzz` settings live)  |
| question       | Text       | Question text                                            |
| answer         | Text       | Answer text                                              |
| due            | Timestamp  | Next show time                                           |
| stability      | Double     | FSRS stability parameter                                 |
| difficulty     | Double     | FSRS difficulty parameter                                |
| elapsed_days   | Int        | Days since last time                                     |
| scheduled_days | Int        | Scheduled days count                                     |
| reps           | Int        | Total reps                                               |
| lapses         | Int        | Total lapses                                             |
| state          | Int        | "0=New, 1=Learn, 2=Review, 3=Relearn"                    |
| last_review    | Timestamp  | Last review date                                         |

#### 2. Adapting Intervals for User (About 4 Hours)

The `ts-fsrs` library allows passing an `FSRSParameters` object. To implement custom short intervals, you need to use the **Learning Steps** mechanism.

1.  **Deck Settings**: Store `learning_steps` array in DB for each deck. E.g.: `[0.16, 4]` (in hours) or just in minutes `[10, 240]`.
2.  **Logic**:
    - When card is in **New** or **Learning** state, you don't use the main FSRS formula for `due` calculation.
    - Instead, you take value from your `learning_steps[card.step_index]`.
    - On "Good" press, you increment `step_index` and set `due = now + steps[index]`.
    - Once steps are exhausted, switch `state` to **Review** — and here full `ts-fsrs` takes over.

##### About `enable_fuzz`

**Fuzz** is a small random deviation of the interval so that cards learned on the same day don't arrive in a "clump" a month later on the same day.

In `ts-fsrs` this is done at initialization:

```typescript
const params = createEmptyParams();
params.enable_fuzz = true; // take from deck settings in DB
const f = fsrs(params);
```

If `enable_fuzz` is enabled, the library will slightly change `scheduled_days` itself (e.g., set 9 or 11 instead of 10), which automatically changes the `due` date.

## Verification Plan

### Automated Tests

#### Unit Tests for Spaced Repetition Service

**Command:**

```bash
cd backend
npm run test
```

**Description:**
Add tests to `backend/tests/services/spaced-repetition.test.ts` to verify correctness of interval calculations.

#### E2E Tests for Main Scenarios

Use Playwright for automation:

1. Create course
2. Add cards
3. Complete training

---

### Manual Verification

#### 1. Custom Title Bar Verification

**Steps:**

1. Run app: `cd backend && npm run electron:dev`
2. Ensure window title is displayed correctly
3. Check buttons:
    - **Minimize** - window minimizes
    - **Maximize** - window maximizes to full screen
    - **Close** - window minimizes to tray (does not close)
4. Try dragging window by title bar

**Expected Result:** All buttons work, window can be dragged.

---

#### 2. Routing with Custom Protocol Verification

**Steps:**

1. Run app
2. Navigate to different pages via UI
3. Check that URL in DevTools has format `lmorozanki://app/index.html#/route`
4. Open DevTools (F12) and check console for resource loading errors

**Expected Result:** All resources load without 404 errors, routing works.

---

#### 3. Tray Operation Verification

**Steps:**

1. Run app
2. Click "Close" button in title bar
3. Ensure window hid but app didn't quit
4. Find icon in system tray
5. Click tray icon

**Expected Result:** Window reappears.

---

#### 4. System Notifications Verification

**Steps:**

1. Create course and add a few cards
2. Complete training
3. Wait for next review time (can manually change due date in DB)
4. Check that system notification appeared

**Expected Result:** Notification displays in Windows/macOS/Linux system tray.

---

#### 5. Production Build Verification

**Command:**

```bash
cd backend
npm run bundle
```

**Steps:**

1. Run build command
2. Find installer in `dist/`
3. Install app on clean system
4. Run and check basic functionality

**Expected Result:** App launches and works correctly.

---

## Extended Features (Optional)

### Learning Progress Statistics

#### [NEW] [routes/statistics.ts](file:///e:/Develop/anki-tiny/backend/src/routes/statistics.ts)

- `GET /api/courses/:courseId/statistics` - course statistics
- `GET /api/statistics/daily` - daily statistics

#### [NEW] [pages/statistics/StatisticsPage.vue](file:///e:/Develop/anki-tiny/frontend/src/pages/statistics/StatisticsPage.vue)

- Dashboard with progress charts
- Display of learned cards count by days/weeks
- Answer accuracy

---

### Course Import/Export

#### [NEW] [routes/export.ts](file:///e:/Develop/anki-tiny/backend/src/routes/export.ts)

- `GET /api/courses/:courseId/export` - export course to JSON
- `POST /api/courses/import` - import course from JSON

#### [NEW] [features/import-export/](file:///e:/Develop/anki-tiny/frontend/src/features/import-export/)

- Export/Import buttons in UI
- File picker for import
- Format: Anki compatibility (optional)

---

### Media in Cards

#### [NEW] Database Schema for media_files

```typescript
interface MediaFilesTable {
  id: string;
  cardId: string;
  type: 'image' | 'audio';
  fileName: string;
  filePath: string;
  createdAt: Date;
}
```

#### [NEW] [routes/media.ts](file:///e:/Develop/anki-tiny/backend/src/routes/media.ts)

- `POST /api/cards/:cardId/media` - upload media file
- `GET /api/media/:id` - get media file
- `DELETE /api/media/:id` - delete media

#### [MODIFY] [CardEditor.vue](file:///e:/Develop/anki-tiny/frontend/src/widgets/card-editor/CardEditor.vue)

- Add support for image/audio upload
- Media preview in editor

---

### Card Search

#### [NEW] [routes/search.ts](file:///e:/Develop/anki-tiny/backend/src/routes/search.ts)

- `GET /api/search?q=query` - full-text search across cards

#### [NEW] [widgets/search-bar/SearchBar.vue](file:///e:/Develop/anki-tiny/frontend/src/widgets/search-bar/SearchBar.vue)

- Search bar with autocomplete
- Result filtering

---

### Tags and Categories

#### [NEW] Database Schema for tags

```typescript
interface TagsTable {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
}

interface CardTagsTable {
  cardId: string;
  tagId: string;
}
```

#### [NEW] [routes/tags.ts](file:///e:/Develop/anki-tiny/backend/src/routes/tags.ts)

- `GET /api/tags` - list tags
- `POST /api/tags` - create tag
- `POST /api/cards/:cardId/tags` - add tag to card

#### [NEW] [features/tags/](file:///e:/Develop/anki-tiny/frontend/src/features/tags/)

- Tag management UI
- Filter cards by tags

---

## Risks and Constraints

> [!CAUTION]
> **Acrylic Material for Title Bar** - `backgroundMaterial: 'acrylic'` is supported only on Windows 11. Fallback solution needed for other OS.
>
> [!WARNING]
> **IPC Security** - all IPC handlers must validate incoming data to avoid XSS and other attacks.
>
> [!WARNING]
> **Notification System** - must correctly handle time zones and user settings. Do not offer new cards if less than 4 hours remain until day end.

> [!NOTE]
> **Database** - uses SQLite via `better-sqlite3` and Kysely for type safety.
