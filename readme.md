# Repetitio

> **🤖 AI-Assisted Development Project**
>
> This project demonstrates a modern approach to software development using
> LLM agents (Large Language Models) as intelligent AI assistants. Development
> follows a **human-in-the-loop** model: I define the architecture, make key
> decisions, and control code quality, while the AI agent serves as a powerful
> tool for accelerating routine tasks and generating boilerplate code.

## 🎯 Development Philosophy

### What I do (Developer)

- 🏗️ **Architectural Decisions**: choosing the technology stack, designing
  modular application structure (Feature-Sliced Design)
- 🎨 **UX/UI Design**: interface concept, user scenarios, visual aesthetics
- 🔍 **Code Review**: reviewing generated code, refactoring, optimization
- 🧪 **Testing**: functionality verification, debugging edge cases
- 📋 **Project Management**: feature planning, task prioritization,
  documentation maintenance

### What the AI Agent does

- ⚡ **Code Generation**: creating components, services, validation schemas
  based on technical specifications
- 🔧 **Refactoring**: automatic linter fixes, import optimization,
  code style unification
- 📝 **Documentation**: generating comments, READMEs, technical descriptions
- 🐛 **Debugging**: error analysis, solution suggestions, type fixing
- 🔄 **Migrations**: dependency updates, adapting code to new library versions

## 🚀 Benefits of the AI-Driven Approach

✅ **Development Speed**: routine tasks are solved 5-10x faster  
✅ **Code Consistency**: uniform style throughout the entire project  
✅ **Current Best Practices**: using modern patterns and approaches  
✅ **Documentation**: automatic synchronization of code and documentation  
✅ **Edge Case Coverage**: AI helps identify potential issues

### 📚 Development Workflow

This project uses **OpenSpec** — a spec-driven development methodology. All features go through
**Proposal → Implementation → Archive** stages to ensure transparency and quality.

**👉 [OpenSpec Workflow Guide](openspec-workflow.md)** — read this to understand how to work with
AI assistant on this project.

---

## 📋 Technical Specifications

Application for learning using flashcards and spaced repetition (inspired by Anki).
Required features:

1. Creating topics/courses
2. Quick addition of new cards to a course
3. General settings typical for such systems
4. Individual settings for each course; by default, taken from general settings,
   but can be edited for each course separately
5. Ability to set time of day (from which hour to which hour) for training sessions;
   application should not offer new cards for learning if less than 4 hours remain
   until the end of the current day, since the first repetition step is 4 hours
6. Application should trigger system notifications (Windows/Linux/macOS) when it's
   time to review cards
7. Application should minimize to system tray on "minimize" button click
   and restore from tray on icon click
8. Memory system used: user-customized FSRS (using library
   <https://github.com/open-spaced-repetition/ts-fsrs>): user wants to adapt
   intervals to their needs, for example, make the first short interval 4 hours
   instead of one day

---

## 📑 Contents

- [Development Philosophy](#-development-philosophy)
- [Technical Specifications](#-technical-specifications)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Application Features](#-application-features)
- [Launch and Build](#launch-and-build)

---

## 💾 Data Structure

### Course

```typescript
interface Course {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}
```

### Card

```typescript
interface Card {
  id: number;
  courseId: number;
  front: string;
  back: string;
  state: CardState;     // New, Learning, Review, Relearning
  due: string;          // ISO Date
  stability: number;    // FSRS
  difficulty: number;   // FSRS
  scheduledDays: number;
  reps: number;
  lapses: number;
  lastReview?: string;
  stepIndex?: number;   // For learning steps
}
```

### Settings

```typescript
interface Settings {
  // Time Range
  trainingStartTime: string;   // "HH:MM" format (e.g., "08:00")
  trainingEndTime: string;     // "HH:MM" format (e.g., "22:00")
  
  // FSRS Parameters
  learningSteps: number[];     // Minutes (e.g., [10, 1440, 4320])
  requestRetention: number;    // 0.0-1.0 (default 0.9)
  maximumInterval: number;     // Days (default 36500)
  enableFuzz: boolean;         // Add randomness to intervals
  
  // Global Daily Limits (aggregate across all courses)
  globalNewCardsPerDay: number;    // Default 20
  globalMaxReviewsPerDay: number;  // Default 200
  
  // Default Course Limits (fallbacks for courses without custom settings)
  newCardsPerDay: number;      // Default 20
  maxReviewsPerDay: number;    // Default 200
  
  // Session Limits
  newCardsPerSession: number;  // Default 10
  maxReviewsPerSession: number; // Default 50
  
  // Notifications
  notificationsEnabled: boolean;
}

interface CourseSettings extends Partial<Settings> {
  courseId: number;
  // null values inherit from global settings
}
```

---

## 🛠 Technology Stack

### Frontend

- **Vue 3** (v3.5+) — Composition API, `<script setup>`
- **Vue Router** (v4.6+) — Hash mode for `lmorozanki://` protocol
- **Vite** (v6.0+) — Build tool and dev server
- **Tailwind CSS** (v4.0+) — Utility-first CSS framework
- **Pinia** — State management
- **Axios** (v1.7+) — HTTP client for API requests
- **Bootstrap Icons** — Icon set
- **@vueuse/core** — Composition utilities

### Backend

- **Node.js** + **TypeScript** (v5.7+)
- **Express** (v4.21+) — Web framework
- **Electron** (v33.2+) — Desktop application
- **Zod** (v3.24+) — Schema validation
- **Better-SQLite3** + **Kysely** — Database & ORM
- **ts-fsrs** — Spaced repetition algorithm
- **Pino** — Logging

### Architecture

- **Feature-Sliced Design** — Architectural methodology for frontend
- **Custom Protocol** — `lmorozanki://` for resource loading
- **IPC Communication** — Electron preload API for secure interaction

---

## 🏗 Architecture

### Frontend Structure (Feature-Sliced Design)

```text
frontend/src/
├── app/              # Application initialization
│   ├── main.js
│   ├── App.vue
│   └── router/
├── pages/           # Pages
│   ├── home/
│   ├── course/
│   ├── training/
│   └── settings/
├── widgets/         # Composite UI blocks
│   ├── title-bar/   # Custom window title bar
│   ├── course-list/
│   ├── card-list/
│   └── settings-form/
├── features/        # Business features
│   ├── create-course/
│   ├── add-card/
│   └── spaced-repetition/
├── entities/        # Business entities
│   ├── course/
│   ├── card/
│   └── settings/
└── shared/          # Reusable code
    ├── ui/          # UI components (Button, Input, Card, Modal)
    ├── api/         # HTTP client & Services
    ├── lib/         # Utilities
    └── types/       # TypeScript types
```

### Backend Structure

```text
backend/src/
├── electron/        # Electron main process
│   ├── main.ts      # Entry point, lmorozanki:// protocol
│   └── preload.ts   # IPC bridge
├── routes/          # API endpoints (courses, cards, settings, etc.)
├── services/        # Business logic
│   ├── database/    # Kysely schema & migrations
│   ├── fsrs/        # Spaced repetition algorithm
│   └── repositories/# Data access layer
├── schemas/         # Zod validation schemas
├── config/          # Configuration
├── utils/           # Utilities (logger, etc.)
└── server.ts        # Express server
```

---

## ✨ Application Features

### Implemented ✅

#### 🗂️ Course & Card Management

- **Course Management**: Full CRUD operations with statistics.
- **Card Management**: Full CRUD with visual feedback and progress tracking.
- **Batch Operations**: 
  - Batch Add mode (text-based `question | answer` format)
  - Batch Delete with selection mode and custom checkboxes
  - Delete All Cards with confirmation
- **Quick Add**: Inline mode for rapid card creation.
- **Card Editing**: Edit cards with automatic progress reset and visual feedback (scroll + bounce animation).
- **Course Statistics**: Home page displays total cards, new cards count, and last training date.

#### 🧠 Training System

- **FSRS v5 Algorithm**: Full integration of `ts-fsrs` with customizable parameters.
- **Training Mode**: Card-based review interface with flip animations.
- **4-Tier Limits System**:
  - Global daily limits (aggregate across all courses)
  - Course daily limits (per-course with inheritance)
  - Session limits (per training session)
  - Daily progress tracking with `trainingStartTime`-based reset
- **Visual Training UI**: Answer buttons (Again/Hard/Good/Easy) with color coding.
- **Session Management**: Real-time counter, limit badges, completion states.

#### ⚙️ Settings System

- **Global Settings**: Training hours, FSRS parameters, daily/session limits.
- **Course Settings**: Full override capability with inheritance from global settings.
- **Custom Time Pickers**: Scroll-based hour/minute selection (generic, reusable component).
- **Learning Steps**: Configurable intervals (e.g., 10min, 1day, 3days).
- **FSRS Configuration**: Request retention, maximum interval, learning steps, fuzz.

#### 🎨 UI & UX

- **Design System**: Systemized CSS variables, dark/light theme support.
- **Custom Title Bar**: Frameless acrylic design with window controls.
- **Custom Dialogs**: Replaced native `alert()`/`confirm()` with:
  - Toast notifications (vue3-toastify) for alerts
  - Custom `ConfirmDialog` component with theme support
- **Animations**: Smooth transitions, flip effects, bounce animations, hover states.
- **Responsive Design**: Mobile-optimized with slide-out panels.

#### 🔧 Backend Core

- **Database**: SQLite with migration system, transaction support.
- **REST API**: Full API coverage for all features.
- **Validation**: Strict Zod v4 schemas for all inputs.
- **Repositories**: Clean data access layer (courses, cards, settings, progress).
- **Services**: Business logic separation (FSRS, limits, daily progress).

### In Progress 🔄

- **System Tray Integration**: Minimize to tray instead of closing.
- **System Notifications**: Native OS notifications for due cards.
- **Deep Linking**: Open app directly in training mode from notification.

### Planned 📅

- Learning progress statistics dashboard.
- Course import/export (JSON/Anki format).
- Media support in cards (images, audio).
- Card search and filtering.
- Tags and categories system.

---

## 🎬 Current Status

**Version**: 0.5.0 (MVP Feature Complete)

✅ **Core Features Complete**

- **Architecture**: Electron + Vue 3 + Express, Feature-Sliced Design
- **Database**: SQLite with migrations, transaction support, repositories
- **FSRS Algorithm**: Full ts-fsrs v5 integration with custom parameters
- **Course Management**: CRUD, statistics, settings inheritance
- **Card Management**: CRUD, batch operations, visual feedback, progress reset
- **Training System**: Review interface, 4-tier limits, session management, FSRS scheduling
- **Settings**: Global + Course-specific, time pickers, FSRS config, limits config
- **UI/UX**: Custom dialogs, toast notifications, animations, responsive design, dark/light themes

🔄 **Next Phase (v0.6-0.9 → v1.0)**

**Priority 1** (Desktop Integration):
- System Tray: Minimize to tray, restore from tray
- System Notifications: Native OS notifications for due cards
- Deep Linking: Open app in training mode from notification

**Priority 2** (Enhancements):
- Statistics dashboard with charts
- Import/Export (JSON, Anki)
- Media support (images, audio)
- Search and filtering

**v1.0 Release Criteria**: All Priority 1 features + stable production build

---

## Launch and Build

### Prerequisites

Make sure you have installed:

- **Node.js** v22.0.0 or higher
- **npm** v10.0.0 or higher

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/lmoroz/anki-tiny.git
   cd anki-tiny
   ```

2. Install dependencies for all workspaces:

   ```bash
   npm install
   ```

### Development mode

All commands are run from the project root:

1. **Run full application (Electron + Frontend HMR)**

   ```bash
   npm run app:dev
   ```

   This command automatically rebuilds native dependencies, starts the frontend dev server, and launches the Electron app.

2. **Run backend API only**

   ```bash
   npm run dev --workspace=backend
   ```

   Starts the Express server with Nodemon (usually on port 3000). Useful for API testing without Electron.

3. **Run frontend only**

   ```bash
   npm run dev --workspace=frontend
   ```

   Starts the Vite dev server (<http://localhost:5173>).

4. **Run both servers (Frontend + Backend API) without Electron**

   ```bash
   npm run dev
   ```

   Useful for development in a browser or inspecting both services simultaneously.

### Building the application (Production Build)

#### Create installer (exe and installer) with one command

```bash
npm run bundle
```

This command will:

1. Build frontend (`npm run build` in frontend workspace)
2. Compile backend TypeScript code
3. Create installer via electron-builder

Ready installer will appear in `dist` folder.

### Additional commands

- **Lint all workspaces:**

  ```bash
  npm run lint
  ```

- **Format code in all workspaces:**

  ```bash
  npm run format
  ```

- **Commands for specific workspace:**

  ```bash
  npm run <script> --workspace=frontend
  npm run <script> --workspace=backend
  ```
