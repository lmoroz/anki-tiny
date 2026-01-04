# Local Video Viewer

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

## Contents

---

## Source data

## Application features

### Home page

#### Home page preview

## Final result


## Launch and Build

### Prerequisites

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
