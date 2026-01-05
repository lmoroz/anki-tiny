# Anki Tiny

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

---

## 📋 Technical Specifications

Это приложение — мини-клон anki — программы для обучения с помощью карточек и интервального повторения.
Необходимые фичи:  

1. Создание топика/курса
2. Быстрое добавление новых карточек в курс
3. Общие настройки, которые должны быть в такой системе
4. Настройки индивидуальные для каждого курса, по-умолчанию, берутся из общих, но можно отредактировать для каждого курса отдельно
5. Должна быть возможность установить время дня, с какого по какой час возможны тренировки и, приложение не дложно предлагать к изучению новые карточки, если до окончания условного текущего дня осталось меньше 4 часов, так как первый шаг повторения — 4 часа
6. Приложение должно вызывать системные уведомления windows/linux/macos, когда нужно приступить к повторению очередных карточек
7. приложение должно сворачиваться в системный трей по клику на кнопке «свернуть» и разворачиваться из него по клику на иконку

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

### Course (Курс)

```typescript
interface Course {
  id: string;
  name: string;
  description: string;
  cardsCount: number;
  dueCardsCount: number;
  settings?: CourseSettings;  // Индивидуальные настройки или наследуются из глобальных
  createdAt: Date;
  updatedAt: Date;
}
```

### Card (Карточка)

```typescript
interface Card {
  id: string;
  courseId: string;
  front: string;        // Вопрос
  back: string;         // Ответ
  easinessFactor: number;  // Фактор легкости (2.5 по умолчанию)
  interval: number;     // Интервал повторения в днях
  repetitions: number;  // Количество успешных повторений
  dueDate: Date;        // Дата следующего повторения
  createdAt: Date;
  lastReviewedAt?: Date;
}
```

### Settings (Настройки)

```typescript
interface Settings {
  trainingStartHour: number;   // Начало дня тренировок (8 по умолчанию)
  trainingEndHour: number;     // Конец дня тренировок (22 по умолчанию)
  minTimeBeforeEnd: number;    // Минимальное время до конца дня (4 часа)
  notificationsEnabled: boolean;
}

interface CourseSettings extends Settings {
  courseId: string;
}
```

---

## 🛠 Technology Stack

### Frontend

- **Vue 3** (v3.5+) — Composition API, `<script setup>`
- **Vue Router** (v4.6+) — Hash mode для работы с `lmorozanki://` протоколом
- **Vite** (v7.2+) — Build tool и dev server
- **Tailwind CSS** (v4.1+) — Utility-first CSS framework
- **Axios** (v1.13+) — HTTP клиент для API запросов
- **Bootstrap Icons** — Набор иконок
- **@vueuse/core** — Composition утилиты

### Backend

- **Node.js** + **TypeScript** (v5.9+)
- **Express** (v4.18+) — Web framework
- **Electron** (v39.2+) — Desktop приложение
- **Zod** (v4.1+) — Валидация схем
- **Pino** — Логирование
- **Chokidar** — File watching

### Architecture

- **Feature-Sliced Design** — Архитектурная методология для frontend
- **Custom Protocol** — `lmorozanki://` для загрузки ресурсов
- **IPC Communication** — Electron preload API для безопасного взаимодействия

---

## 🏗 Architecture

### Frontend Structure (Feature-Sliced Design)

```text
frontend/src/
├── app/              # Инициализация приложения
│   ├── main.js
│   ├── App.vue
│   └── router/
├── pages/           # Страницы
│   ├── home/
│   ├── course/
│   ├── training/
│   └── settings/
├── widgets/         # Составные UI блоки
│   ├── title-bar/   # Кастомный заголовок окна
│   ├── course-list/
│   └── card-editor/
├── features/        # Бизнес-фичи
│   ├── create-course/
│   ├── add-card/
│   └── spaced-repetition/
├── entities/        # Бизнес-сущности
│   ├── course/
│   ├── card/
│   └── settings/
└── shared/          # Переиспользуемый код
    ├── ui/          # UI компоненты (Button, Input, Card)
    ├── api/         # HTTP клиент
    ├── lib/         # Утилиты
    └── types/       # TypeScript типы
```

### Backend Structure

```text
backend/src/
├── electron/        # Electron main process
│   ├── main.ts      # Entry point, Tray, протокол lmorozanki://
│   └── preload.ts   # IPC bridge
├── routes/          # API endpoints
├── controllers/     # Request handlers
├── services/        # Бизнес-логика
├── schemas/         # Zod validation
└── server.ts        # Express server
```

---

## ✨ Application Features

### Implemented

#### 🎨 Custom Title Bar

- Frameless окно с кастомным заголовком
- Draggable область для перемещения окна
- Кнопки управления: Minimize, Maximize/Restore, Close
- Backdrop blur эффект (Acrylic material на Windows 11)
- Интеграция с Electron IPC

#### 📱 Responsive Pages

- **Home Page** — список курсов, создание нового курса
- **Course Page** — детальный вид курса, управление карточками
- **Training Page** — интерфейс повторения с переворачиваемыми карточками
- **Settings Page** — глобальные настройки времени тренировок

#### 🎯 UI Components

- Button (primary, secondary, danger, ghost варианты)
- Input (с label, error states, валидацией)
- Card (с backdrop blur, hover эффектами)
- Loading states
- Empty states

### In Progress

- 🔄 Backend API endpoints (courses, cards, training)
- 🔄 Алгоритм интервального повторения (SM-2)
- 🔄 Персистентное хранилище данных (SQLite/JSON)
- 🔄 Системные уведомления
- 🔄 Tray integration (сворачивание в трей)

### Planned

- 📅 Статистика прогресса обучения
- 📅 Импорт/экспорт курсов
- 📅 Поддержка медиа в карточках (изображения, аудио)
- 📅 Поиск по карточкам
- 📅 Теги и категории

---

## 🎬 Current Status

✅ **Фаза 1-2 завершены** (Архитектура и UI Framework)

**Что работает:**

- Полная структура проекта по Feature-Sliced Design
- Кастомный Title Bar с window controls
- Vue Router с hash mode для `lmorozanki://`
- Базовые UI компоненты
- Все основные страницы с макетами
- Integration типов для Electron API
- HTTP клиент с динамическим определением порта

**Следующие шаги:**

- Реализация backend API (Фаза 6)
- Создание БД и схемы данных
- Алгоритм интервального повторения
- Системная интеграция (notifications, tray)

## Launch and Build

### Prerequisites

Убедитесь, что у вас установлены:

- **Node.js** v18.0.0 или выше
- **npm** v9.0.0 или выше

### Installation

1. Клонируйте репозиторий:

   ```bash
   git clone https://github.com/your-username/anki-tiny.git
   cd anki-tiny
   ```

2. Установите зависимости для backend:

   ```bash
   cd backend
   npm install
   ```

3. Установите зависимости для frontend:

   ```bash
   cd ../frontend
   npm install
   ```

### Development mode

For development, it is recommended to run the backend and frontend separately
for Hot Module Replacement (HMR) to work.

1. **Running the Backend (API Server)**

   ```bash
   cd backend
   npm start
   # The server will be launched at http://localhost:3000
   ```

2. **Launching Frontend (Vite Dev Server)**

   ```bash
   cd frontend
   npm run dev
   # The application will be available via the link in the terminal
   # (usually http://localhost:5173)
   ```

### Running in Electron (Dev) mode

If you need to check the operation inside the Electron window:

1. Build the frontend (since electron-main.js loads static files or
   <http://localhost:3000>, which distributes static files in the current
   configuration):

   ```bash
   cd frontend
   npm run build
   ```

2. Run Electron from the backend folder:

   ```bash
   cd backend
   npm run electron:dev
   ```

### Building the application (Production Build)

#### To create an installation file in two steps (exe and installer)

1. **Frontend build**

   ```bash
   cd frontend
   npm run build
   ```

   This will create a `dist` folder inside `frontend`.

2. **Building the Backend and Installer**

   ```bash
   cd backend
   npm run dist
   ```

   The application installer file will appear in the `dist` folder.

#### To create the installer file in one step

```bash
cd backend
npm run bundle
```

The application installer file will appear in the `dist` folder.
