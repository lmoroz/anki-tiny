# Changelog

Все значимые изменения в проекте Repetitio документируются в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/),
и проект придерживается [Semantic Versioning](https://semver.org/lang/ru/).

## [0.4.0] - 2026-01-06 20:45

### Added

#### Feature: Systemized Styling

- **Unified Styling System**
    - Внедрена система CSS-переменных для цветов (`--color-primary`, `--color-bg-modal`, etc.)
    - Внедрена система типографики (`--text-page-title-size`, etc.)
    - Весь UI переведен на использование этих переменных для полной поддержки тем
    - Удалены все hardcoded hex цвета (`#1a73e8`, `#e9ecef`) из компонентов

- **Component Refactoring**
    - `Button.vue`, `Input.vue`, `Modal.vue`, `Card.vue` полностью обновлены
    - `QuickAddCard.vue`, `CardItem.vue`, `CourseCard.vue` и другие виджеты обновлены
    - Убраны дублирующиеся стили (например, кнопки в `CourseSettingsModal.vue` теперь используют shared `Button.vue`)
    - Исправлены проблемы с видимостью текста (dropdowns, buttons) в темной теме

### Fixed

- **UI Consistency Issues**
    - Исправлена проблема с нечитаемыми опциями в `TimeRangePicker` (белый текст на белом фоне)
    - Исправлен стиль блока "Текущее расписание" в настройках (теперь соответствует стилю описания курса)
    - Унифицированы стили кнопок во всех модальных окнах
    - Исправлена излишняя яркость кнопок действий

## [0.3.0] - 2026-01-06 18:19

### Fixed

#### Frontend: Контрастность текста на главной странице

- **Проблема**: Текст в empty state компоненте был нечитаем на сине-голубом фоне карточки
    - `.empty-state-title` использовал тёмный цвет `#202124`
    - `.empty-state-text` использовал тёмный цвет `#5f6368`
    - Текст "Нет курсов" и описание были практически невидимы на синем фоне

- **Решение**:
    - Заголовок `.empty-state-title` изменен на белый: `#ffffff`
    - Описание `.empty-state-text` изменено на светло-серый: `#e9ecef`
    - Обеспечен отличный контраст с синим фоном карточки

- **Файлы**:
    - Изменено: `frontend/src/pages/home/HomePage.vue` (2 строки CSS)

- **Верификация**:
    - ✅ Текст "Нет курсов" отображается белым цветом
    - ✅ Описание читаемо на синем фоне
    - ✅ Контраст соответствует accessibility требованиям

## [0.3.0] - 2026-01-06 18:14

### Fixed

#### Frontend: Tailwind CSS v4 Theme Configuration

- **Проблема с классами `rounded-*`**
    - Диагностирована причина неработающих классов `rounded-xl` в Button.vue и Card.vue
    - Корневая проблема: отсутствие CSS-переменной `--radius-xl` в теме Tailwind CSS v4
    - Динамическая генерация классов через строковую интерполяцию `` `rounded-${props.rounded}` ``
      не обнаруживалась статическим анализом Tailwind

- **Решение 1: Определение темы через `@theme` блок**
    - Создан блок `@theme` в `frontend/src/app/assets/css/styles.css`
    - Определены все переменные радиусов: sm, md, lg, xl, 2xl, 3xl, full
    - `--radius-xl: 0.75rem` (12px) для корректного скругления углов
    - **Важно**: в Tailwind v4 блок `@theme` должен находиться в том же файле, где `@import 'tailwindcss'`

- **Решение 2: Safelist для динамических классов**
    - Создан `frontend/tailwind.config.js` с safelist массивом
    - Явно указаны все классы `rounded-*` для гарантированной генерации
    - Необходимость: Tailwind v4 не обнаруживает классы из строковых интерполяций

### Added

- **frontend/tailwind.config.js** — конфигурация с safelist для динамически генерируемых классов
- **@theme блок** в styles.css с полным набором `--radius-*` переменных (7 значений)

### Technical Details

- **Верификация**:
    - ✅ `rounded-xl` применяется с `border-radius: 12px`
    - ✅ CSS-переменная `--radius-xl: 0.75rem` доступна в документе
    - ✅ Все компоненты (Button, Card) корректно отображают скругленные углы
    - ✅ Dev server перезапущен для применения изменений

- **Файлы**:
    - Изменено: `frontend/src/app/assets/css/styles.css` (+10 строк @theme)
    - Создано: `frontend/tailwind.config.js` (15 строк)

## [0.3.0] - 2026-01-06 17:40

### Added

#### Feature: Settings Management System

**Entity Layer:**

- `frontend/src/shared/api/settings.js` — API client for settings endpoints
    - `getGlobalSettings()`, `updateGlobalSettings()`
    - `getCourseSettings()`, `updateCourseSettings()`, `resetCourseSettings()`
- `frontend/src/shared/types/settings.ts` — TypeScript interfaces для настроек
    - GlobalSettings, CourseSettings, UpdateSettingsDTO, SettingsValidation
- `frontend/src/entities/settings/model/useSettingsStore.js` — Pinia store с логикой наследования
    - State: globalSettings, courseSettings (Map)
    - Getters: getEffectiveSettings(), hasCustomSettings()
    - Actions: fetch/update/reset для global и course настроек
    - Fallback pattern: курсы используют глобальные настройки по умолчанию

**UI Components:**

- `frontend/src/shared/ui/TimeRangePicker.vue` — компонент выбора временного диапазона
    - Два селектора (начало/конец дня) 0-23 часа
    - Визуальная timeline шкала с активным диапазоном
    - Метки времени: 0:00, 6:00, 12:00, 18:00, 24:00

**Widgets:**

- `frontend/src/widgets/settings-form/SettingsForm.vue` — форма редактирования настроек
    - Интеграция TimeRangePicker
    - Real-time валидация временных диапазонов
    - Input для minTimeBeforeEnd (1-12 часов)
    - Checkbox для системных уведомлений
    - Preview секция с расчетом эффективного расписания
- `frontend/src/widgets/course-settings-modal/CourseSettingsModal.vue` — модал настроек курса
    - Переключатель: "Глобальные" / "Индивидуальные"
    - Интеграция SettingsForm (readonly в режиме глобальных)
    - Кнопка "Сбросить к глобальным"

**Pages:**

- `frontend/src/pages/settings/SettingsPage.vue` — главная страница настроек
    - Секция глобальных настроек с SettingsForm
    - Список курсов с badges (Global/Custom)
    - Кнопка "Настроить" для каждого курса
    - Loading states и error handling

### Changed

- `frontend/src/pages/course/CoursePage.vue` — добавлена интеграция настроек курса
    - Кнопка "Настройки курса" в header рядом с "Назад"
    - Интеграция CourseSettingsModal
    - Handlers: handleOpenSettings(), handleCloseSettings(), handleSettingsSaved()
    - Updated page-header styles для flex layout

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
- `minTimeBeforeEnd` от 1 до 12 часов
- Диапазон тренировок >= `minTimeBeforeEnd`

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

- **openspec-workflow.md** — создано полное русскоязычное руководство по OpenSpec методологии
    - Описание spec-driven development подхода
    - Три стадии разработки: Proposal → Implementation → Archive
    - Роли в процессе (разработчик vs AI-агент)
    - Полезные команды для работы с OpenSpec
    - Структура директорий `openspec/`
    - Примеры полного цикла от запроса до архивации
    - Формат спецификаций с правильными Scenarios
    - Операции с Requirements: ADDED, MODIFIED, REMOVED, RENAMED
    - Best Practices: Simplicity First, Complexity Triggers
    - Troubleshooting для частых ошибок
    - Дополнительные ресурсы и ссылки

- **openspec/project.md** — заполнен детальной информацией о проекте
    - Цели проекта (7 ключевых пунктов)
    - Полный технологический стек (Frontend, Backend, Tooling)
    - Конвенции кода (форматирование, условные конструкции, импорты)
    - Архитектурные паттерны (FSD, Layered Architecture)
    - Тестовая стратегия (текущая и планируемая)
    - Git Workflow (semantic commits, процесс разработки)
    - Доменный контекст (FSRS, структуры данных)
    - Важные ограничения (технические, бизнес-логика, процессные)
    - Внешние зависимости (MCP серверы, библиотеки, системные интеграции)
    - Статус проекта (реализовано, в работе, запланировано)

### Changed

- **readme.md** — добавлена секция "Development Workflow" с ссылкой на OpenSpec Workflow Guide
- **readme.md** — исправлены длинные строки для соответствия markdown линтингу (max 120 символов)
- **readme.md** — исправлен bare URL для библиотеки ts-fsrs

### Fixed

- **Markdown Linting**
    - Исправлены все ошибки MD013 (line-length) в readme.md
    - Исправлена ошибка MD034 (no-bare-urls) в readme.md
    - Убраны trailing punctuation (двоеточия) из заголовков в openspec-workflow.md (MD026)
    - Заменены emphasis-заголовки на proper headings в openspec-workflow.md (MD036)
    - Добавлен язык для code block в openspec/project.md (MD040)

### Technical Details

- **Созданных файлов**: 1 (openspec-workflow.md, 453 строки)
- **Обновленных файлов**: 3 (openspec/project.md, readme.md, docs/Changelog.md)
- **Markdown линтинг**: все файлы проходят проверку без ошибок

---

## [0.2.1] - 2026-01-06 14:30

### Changed

#### Code Style: Масштабный рефакторинг UI и форматирования

- **Новые правила кодирования**
    - Создан `.agent/rules/CODE_STYLE.md` с обязательными правилами форматирования JS/TS
    - Стиль условных конструкций: `else` на новой строке, одиночные statements без скобок
    - Обновлен `.agent/rules/vite-imports-and-components-rule.md`: приоритет `<script setup>` над `<template>`
    - Обновлен `.agent/rules/workflow.md`: уточнены процедуры подведения итогов сессий
    - Обновлен `.agent/rules/using-console-commands.md`: правила работы с терминалом

- **Рефакторинг UI (12 файлов)**
    - Затронутые файлы:
        - App.vue, HomePage.vue, CoursePage.vue
        - Button.vue, Card.vue, Input.vue, StackedCardsIcon.vue (новый)
        - TitleBar.vue, CourseCard.vue, CardItem.vue, QuickAddCard.vue

- **Расширение зависимостей frontend**
    - Добавлен `markdown-it` для рендеринга Markdown
    - Добавлен `highlight.js` для подсветки синтаксиса кода
    - Добавлен `@types/markdown-it` для TypeScript типов

### Removed

- **Очистка устаревших правил**
    - Удален `.agent/rules/use-vitejs-at-rule.md` (устарел)
    - Удален `.agent/rules/vue-structure-preference-rule.md` (заменен на vite-imports-and-components-rule)
    - Удален `docs/Changelog_session.md` (дубликат)

### Fixed

- **Документация**
    - Исправлены опечатки в `docs/Backend_Cards_FSRS_Progress.md`
    - Исправлены опечатки в `docs/Backend_Cards_FSRS_Walkthrough.md`
    - Обновлен `docs/Cards_FSRS_Tasks.md` с актуальным статусом задач
    - Добавлены пропущенные строки в `docs/Migration_System_Walkthrough.md`
    - Удалена лишняя пустая строка в `docs/Testing_API.md`

### Technical Details

- **Затронуто файлов**: 29
- **Изменений в frontend**: ~2,116 вставок, ~1,977 удалений
- **Новые agent rules**: CODE_STYLE.md (143 строки)
- **Консистентность**: Все компоненты теперь следуют единому стилю
- **Семантика**: `<script setup>` первым для лучшей навигации по коду

---

## [0.2.1] - 2026-01-05 23:44

### Changed

#### UI: Редизайн на светлую тему

- **Глобальная цветовая схема**
    - Переход с тёмной темы на светлую
    - Фон приложения: `#fafbfc` (почти белый)
    - Основной цвет текста: `#202124` (тёмно-серый)
    - Акцентный цвет: `#1a73e8` (Google Blue)
    - Вторичный текст: `#5f6368` (средне-серый)

- **Компоненты (светлая тема)**
    - `App.vue` — фон `#fafbfc`
    - `styles.css` — добавлены CSS-переменные для light mode
    - `Card.vue` — белые карточки с лёгкими тенями
    - `Button.vue` — плоские цвета вместо градиентов
    - `Input.vue` — белый фон, тёмный текст
    - `TitleBar.vue` — белая панель
    - `HomePage.vue` — обновлены цвета
    - `CoursePage.vue` — светлые карточки статистики
    - `CourseCard.vue` — светлые hover-эффекты
    - `CardItem.vue` — белые флип-карточки

- **QuickAddCard — точное соответствие референсам**
    - Переключатель режимов с **синей обводкой** (`border: 2px solid #1a73e8`) у активной кнопки
    - Все кнопки имеют серую обводку (`border: 1px solid #dadce0`)
    - Прозрачный фон у переключателя (не серый контейнер)
    - Информационный блок с голубым фоном `#e8f0fe` и текстом `#1967d2`

- **Карточки статистики (CoursePage)**
    - **Светло-голубой фон** `#e8f0fe` (было серый #f8f9fa)
    - Голубая обводка `#d2e3fc`
    - Выделенная карточка "Сегодня": `#d2e3fc` с обводкой `2px`
    - Hover: более насыщенный голубой `#d2e3fc`

### Technical Details

- Убраны все glassmorphism эффекты (`backdrop-filter: blur()`)
- Убраны градиенты, применены плоские цвета
- Мягкие тени: `0 1px 3px rgba(0, 0, 0, 0.08)`
- State badges (карточки): светлые фоны вместо градиентных
    - New: `#e8f0fe` / `#1a73e8`
    - Learning: `#fef7e0` / `#f9ab00`
    - Review: `#e6f4ea` / `#0f9d58`
    - Relearning: `#fce8e6` / `#d93025`

### Design Philosophy

- Минималистичный, чистый дизайн
- Следование Material Design principles
- Улучшенная читаемость
- Соответствие предоставленным UI референсам

---

## [0.2.0] - 2026-01-05 23:04

### Added

#### Frontend: Batch-добавление карточек (Batch Card Import)

- **QuickAddCard Component Enhancement**
    - Добавлен переключатель режимов: "Одна карточка" / "Массовое добавление"
    - Режим массового добавления через textarea
    - Формат ввода: `вопрос | ответ` (каждая строка — новая карточка)
    - Парсинг и валидация batch-данных:
        - Проверка наличия разделителя `|`
        - Проверка корректности формата (ровно 1 разделитель на строку)
        - Проверка на пустые значения front/back
        - Информативные сообщения об ошибках с номером строки
    - Последовательная отправка карточек через существующий emit механизм
    - Задержка 50ms между карточками для плавности
    - Автоочистка textarea после успешного добавления

- **Premium UI Design**
    - Премиальный редизайн компонента QuickAddCard
    - Насыщенный glassmorphism эффект (backdrop-filter: blur(16px))
    - Многослойные box-shadows для глубины и объёма
    - Увеличенная типографика: заголовок 20px (было 16px), font-weight 700
    - Светящиеся иконки с drop-shadow эффектом (#60a5fa)
    - Премиальные toggle-кнопки с gradient background (135deg, #3b82f6 → #2563eb)
    - Плавные анимации с cubic-bezier timing function
    - Transform эффекты на hover (translateY + scale)
    - Увеличенные отступы: padding 32px (было 20px), border-radius 16px (было 12px)
    - Элегантная информационная панель с gradient background
    - Стилизованный code element с monospace шрифтом и border
    - Responsive design с адаптивными падингами для мобильных

### Documentation

- **docs/features/batch-add-cards.md** — полная документация функциональности:
    - Обзор возможностей batch-импорта
    - Формат ввода и примеры использования
    - Технические детали реализации
    - Описание функций парсинга и валидации
    - Преимущества и совместимость

- **docs/features/ui-improvements.md** — детальное описание UI улучшений:
    - Сравнение "до" и "после" для всех элементов
    - CSS техники и эффекты
    - Цветовая палитра и spacing
    - Производительность и accessibility

### Technical Details

- **Новые функции в QuickAddCard.vue**:
    - `parseBatchInput(text)` — парсинг textarea в массив `{front, back}[]`
    - `validateBatchInput()` — валидация batch-данных с детальными ошибками
    - `handleBatchAdd()` — последовательная отправка карточек
    - `switchMode(newMode)` — переключение режимов с очисткой ошибок

- **CSS улучшения**:
    - Multi-layered box-shadows
    - Advanced gradients (145deg angle)
    - Filter effects (drop-shadow для glow)
    - Transform animations (GPU-accelerated)
    - Inset shadows для depth
    - Improved color contrasts (#60a5fa, #cbd5e1, #f1f5f9)

### Verified

- ✅ ESLint frontend проверка пройдена (Exit code: 0)
- ✅ Markdownlint проверка документации пройдена
- ✅ Компонент полностью обратно совместим
- ✅ Не требуется изменений в backend

---

## [0.2.0] - 2026-01-05 22:34

### Added

#### Frontend: Управление карточками (Cards Management)

- **Entity Layer**
    - API сервис для карточек (`shared/api/cards.js`) с полным CRUD функционалом
    - TypeScript типы (`shared/types/card.ts`): CardState enum, Card interface, DTOs, CourseStats
    - Pinia store (`entities/card/model/useCardStore.js`) с reactive state management
    - Getters: `getCardsByCourse`, `getCourseStats`
    - Actions: `fetchCardsByCourse`, `fetchCourseStats`, `createCard`, `updateCard`, `deleteCard`
    - Автоматическое обновление статистики после create/delete операций

- **Widgets**
    - `CardItem.vue` — карточка с CSS 3D flip анимацией (вопрос ↔ ответ)
    - State badges (New, Learning, Review, Relearning) с цветовой индикацией
    - Due date форматирование ("Сегодня", "Завтра", "Через N дней")
    - Line clamp для обрезки длинного текста
    - Hover эффекты для кнопок Edit/Delete
    - `CardList.vue` — список карточек с loading skeleton и empty state
    - `CardEditorModal.vue` — модальное окно create/edit с валидацией
    - Character counters для front/back (max 10000 символов)
    - `QuickAddCard.vue` — inline форма быстрого добавления
    - Автоочистка формы после успешного добавления
    - Responsive grid layout (desktop: 2 cols, mobile: 1 col)

- **Pages Integration**
    - Полная интеграция CoursePage с управлением карточками
    - Stats Grid: Total, New, Review, Due Today
    - Training button с dynamic text и disabled state
    - CRUD handlers с confirm dialogs для удаления
    - Dual mode support: Quick Add + Modal Editor

### Fixed

- **Backend Routes Conflict**
    - Исправлен конфликт роутов в `routes/index.ts`
    - Добавлен префикс `/courses` для coursesRouter
    - Теперь `GET /api/courses` корректно обрабатывается без ошибки "Invalid course ID"
    - Порядок регистрации роутов: courses → cards → training → settings

### Changed

- **CoursePage.vue**
    - Переход с mock данных на реальные API запросы
    - Интеграция useCourseStore и useCardStore
    - Computed properties для reactive data
    - Loading states и error handling
    - Stats отображение с hover эффектами

### Documentation

- **Cards_Frontend_Implementation_Plan.md** — детальный план реализации frontend карточек
- **Cards_Frontend_Walkthrough.md** — comprehensive walkthrough с описанием всех компонентов
    - Обзор 8 созданных файлов
    - API endpoints integration
    - Architecture highlights (Feature-Sliced Design)
    - Manual testing plan
    - UX Features описание

### Verified

- ✅ ESLint проверка пройдена (Exit code: 0)
- ✅ TypeScript компиляция успешна
- ✅ Frontend dev server запущен (Vite на localhost:5173)
- ✅ Backend routes исправлены и скомпилированы

### Technical Details

- Созданные файлы: 8 (3 Entity Layer + 4 Widgets + 1 Page integration)
- API endpoints используются: 5 (getByCourseId, create, update, delete, getCourseStats)
- Feature-Sliced Design соблюден во всех слоях
- State management: Pinia stores с auto-update локального состояния

---

## [0.2.0] - 2026-01-05 21:35

### Added

#### Backend: Cards и FSRS система

- **Database Schema расширена для FSRS**
    - `CardsTable` — карточки с полным набором FSRS полей:
        - `due`, `stability`, `difficulty`, `elapsedDays`, `scheduledDays`
        - `reps`, `lapses`, `state`, `lastReview`, `stepIndex`
    - `SettingsTable` — глобальные настройки приложения
    - `CourseSettingsTable` — индивидуальные настройки курсов
    - Индексы для оптимизации: `courseId`, `due`, `state`

- **Migration System с отслеживанием**
    - Таблица `_migrations` для учета примененных миграций
    - 4 отдельные миграции: courses, cards, settings, courseSettings
    - Функция `runMigrations()` — автоматическое применение недостающих миграций
    - Идемпотентность: `.ifNotExists()` для всех `createTable()` и `createIndex()`
    - Логирование процесса применения миграций

- **FSRS Service (`services/fsrs/index.ts`)**
    - Интеграция библиотеки `ts-fsrs` для spaced repetition
    - Кастомные Learning Steps: 10 минут → 4 часа → REVIEW
    - State Machine: NEW → LEARNING → REVIEW → RELEARNING
    - `calculateNextReview()` — расчет интервалов с учетом Rating
    - `canShowNewCards()` — проверка временных ограничений (4 часа до конца дня)
    - `initializeNewCard()` — создание карточки с дефолтными FSRS значениями

- **Repositories**
    - `CardRepository` — CRUD + getDueCards + getCourseStats
    - `SettingsRepository` — глобальные + курса + getEffectiveSettings
    - Singleton instances для удобного использования

- **Validation Schemas (Zod)**
    - `schemas/card.ts`: CreateCard, UpdateCard, ReviewCard (Rating 1-4)
    - `schemas/settings.ts`: GlobalSettings, CourseSettings с валидацией JSON

- **REST API Endpoints (13 endpoints)**
    - **Cards API** (`routes/cards.ts`):
        - `GET /api/courses/:courseId/cards` — список карточек
        - `POST /api/courses/:courseId/cards` — создание
        - `GET /api/cards/:id` — получение
        - `PUT /api/cards/:id` — обновление
        - `DELETE /api/cards/:id` — удаление
        - `GET /api/courses/:courseId/stats` — статистика
    - **Training API** (`routes/training.ts`):
        - `GET /api/courses/:courseId/due-cards` — карточки для повторения
        - `POST /api/training/review` — отправка результата review
    - **Settings API** (`routes/settings.ts`):
        - `GET /api/settings` — глобальные настройки
        - `PUT /api/settings` — обновление глобальных
        - `GET /api/courses/:courseId/settings` — настройки курса
        - `PUT /api/courses/:courseId/settings` — обновление настроек курса
        - `DELETE /api/courses/:courseId/settings` — сброс к глобальным

### Changed

- **backend/src/services/database/index.ts**
    - Изменена логика инициализации БД: миграции применяются всегда, не только для новой БД
    - Замена `up(dbInstance)` на `runMigrations(dbInstance)`

- **backend/src/services/database/migrations.ts**
    - Полный переход на систему отслеживания миграций
    - Разбиение на отдельные миграции вместо одной монолитной функции `up()`
    - Добавлена функция `rollbackAllMigrations()` для тестирования

- **backend/src/routes/index.ts**
    - Зарегистрированы новые роуты: cards, training, settings

### Fixed

- **TypeScript ошибки**
    - FSRS импорты: использование `Rating` enum из ts-fsrs (с type cast `as any` для совместимости)
    - Zod schema syntax: исправлен `ReviewCardSchema` (убран `errorMap`, использован `message`)
    - ZodError обработка: замена `.errors` на `.issues` во всех routes
    - Удалены неиспользуемые импорты (`NewCard` в cardRepository)

- **Code Formatting**
    - Применен prettier ко всем backend файлам
    - Исправлены line breaks и отступы

### Documentation

- **Backend_Cards_FSRS_Walkthrough.md** — comprehensive walkthrough реализации
    - Обзор всех созданных файлов
    - 13 API endpoints с примерами
    - Database schema с FSRS полями
    - Детальное описание FSRS State Machine
    - Результаты верификации и компиляции

- **Migration_System_Walkthrough.md** — детальная документация migration system
    - Архитектура tracking system
    - Список миграций и их содержимое
    - Исправленные проблемы (ifNotExists)
    - Результаты тестирования на существующей БД
    - Руководство по добавлению новых миграций

- **Cards_FSRS_Implementation_Plan.md** — технический план реализации
- **Cards_FSRS_Architecture.md** — Mermaid диаграммы архитектуры
- **Cards_FSRS_Tasks.md** — детальный чеклист задач
- **docs/Task.md** — обновлен прогресс (Фаза 4 Backend завершена)

### Verified

- ✅ TypeScript компиляция без ошибок
- ✅ Prettier форматирование применен
- ✅ Migration system работает на существующей БД (4 миграции применились успешно)
- ✅ Server запускается и слушает на динамическом порту
- ✅ Таблицы созданы: `_migrations`, `courses`, `cards`, `settings`, `courseSettings`
- ✅ Индексы созданы для всех необходимых полей

### Dependencies

- Добавлена зависимость: `ts-fsrs` (TypeScript FSRS library)

## [0.1.0] - 2026-01-05 18:52

### Fixed

- **Исправлены все ошибки markdown линтинга в документации**:
    - `Implementation_Plan.md` — разбиты длинные строки, исправлена иерархия заголовков (h5→h4),
       добавлен язык для code block
    - `Frontend_Integration_Plan.md` — разбиты длинные строки, исправлены blockquotes
    - `Testing_API.md` — добавлены пустые строки вокруг code blocks (MD031)
    - `Walkthrough.md` — убраны trailing punctuation из заголовков, разбиты длинные строки
    - Автоматически исправлены пустые строки вокруг списков (MD032) во всех файлах
    - Автоматически удалены trailing spaces (MD009)

### Changed

- **`.markdownlint.json`** — отключено правило MD028 (no-blanks-blockquote), т.к. оно конфликтует с
  GitHub Alert blocks синтаксисом (`[!IMPORTANT]`, `[!WARNING]`, `[!NOTE]`)

### Verified

- ✅ Все 8 markdown файлов в `docs/` проходят проверку `markdownlint-cli2` без ошибок

## [0.1.0] - 2026-01-05 18:30

### Added

- **Расширена документация проекта**:
    - Добавлены недостающие пункты из раздела "Technical Specifications" в `Task.md`
    - Добавлены детальные разделы в `Implementation_Plan.md`:
        - Настройки (глобальные и для курса)
        - Система уведомлений с проверкой времени дня
        - Tray integration (сворачивание в трей)
        - Расширенный функционал (статистика, импорт/экспорт, медиа, поиск, теги)
    - Добавлен раздел "Следующие этапы реализации" в `Walkthrough.md`

### Changed

- **Переименование проекта**: "Anki Tiny" → "Repetitio"
    - Обновлены все `package.json` (root, frontend, backend)
    - Обновлены названия в UI: TitleBar, router, console.log
    - Обновлена вся документация: README, Task.md, Implementation_Plan.md, Walkthrough.md
    - Переименована БД: `anki.db` → `repetitio.db`
    - Обновлены комментарии и tooltip в Electron Tray
    - Исправлена опечатка в `frontend/package.json`: "Fontend" → "Frontend"

---

## [0.1.0] - 2026-01-05 18:08

### Added

#### Frontend: Управление курсами (Courses Management)

- **Data Layer**
    - API сервис для курсов (`shared/api/courses.js`) с полным CRUD функционалом
    - TypeScript типы для курсов (`shared/types/course.ts`)
    - Pinia store (`entities/course/model/useCourseStore.js`) с reactive state management
    - Getters: `sortedCourses`, `getCourseById`
    - Actions: `fetchCourses`, `createCourse`, `updateCourse`, `deleteCourse`

- **UI Components**
    - Расширен `Input.vue` для поддержки textarea режима с атрибутом rows
    - Создан `Modal.vue` с backdrop blur, ESC/click-outside закрытием, анимациями
    - Слоты для header и footer в модальном окне

- **Widgets**
    - `CourseCard.vue` — карточка курса с hover эффектами, кнопками Edit/Delete
    - `CourseList.vue` — grid layout для отображения списка курсов
    - `CourseEditorModal.vue` — модальное окно создания/редактирования курса с валидацией

- **Pages**
    - Полная интеграция `HomePage.vue` с Pinia store
    - CRUD операции для курсов
    - Empty state для новых пользователей
    - Loading states

### Changed

- **frontend/src/app/main.js**
    - Интеграция Pinia store manager
    - Динамическое определение backend URL на основе порта от Electron
    - Инициализация приложения после получения backend порта через IPC

- **frontend/src/shared/api/client.js**
    - Обновлен для работы с глобальной переменной `window.__BACKEND_URL__`

### Fixed

- Backend port transmission — приложение корректно получает динамический порт через IPC
- Code formatting в Vue компонентах

### Documentation

- Создан `docs/Frontend_Integration_Plan.md` с детальным планом реализации
- Создан `docs/Walkthrough_Frontend_Courses.md` с документацией всех компонентов
- Обновлен `docs/Task.md` с прогрессом выполнения

### Verified

- ✅ Загрузка списка курсов из backend API
- ✅ Создание нового курса через UI
- ✅ Backend port transmission через Electron IPC

## [0.1.0] - 2026-01-05 17:04

### Changed

#### Project Structure: NPM Workspaces

- **Рефакторинг структуры монорепозитория**

    - Создан корневой `package.json` с поддержкой npm workspaces
    - Frontend и backend объявлены как отдельные workspaces
    - Централизованное управление зависимостями через корневой package.json

- **Упрощение команд разработки**

    - Команды `dev` и `bundle` перенесены из `backend/package.json` в корневой
    - Команда `npm run dev` теперь запускается из корня проекта
    - Команда `npm run bundle` собирает frontend, backend и создаёт installer
    - Добавлены общие команды `lint` и `format` для всех workspaces

- **Обновлена документация**

    - README.md обновлён с инструкциями по использованию workspaces
    - Создан `docs/Workspaces.md` с полным руководством по работе с workspaces
    - Описаны команды установки, разработки и сборки

### Technical Details

- npm workspaces позволяют:

    - Установить все зависимости одной командой (`npm install` из корня)
    - Использовать hoisting для общих зависимостей
    - Запускать команды для конкретных workspaces: `npm run <script> --workspace=<name>`
    - Упростить CI/CD pipeline

## [0.1.0] - 2026-01-05 16:50

### Added

#### Development Experience

- **Hot-Reload для фронтенда в режиме разработки**

    - Electron теперь загружает фронтенд с Vite dev server (`http://localhost:5173`) в dev режиме
    - Все изменения во фронтенде видны мгновенно без перезапуска приложения
    - DevTools открываются автоматически в режиме разработки
    - Установлен пакет `concurrently` для параллельного запуска процессов
    - Команда `npm run dev` запускают фронтенд и бэкенд одновременно
    - Цветная консоль для разделения логов (фронтенд - синий, бэкенд - зелёный)

### Changed

- **backend/src/electron/main.ts**
    - Изменён импорт Electron на namespace import для совместимости
    - Добавлена логика загрузки с Vite dev server в development режиме
    - Регистрация кастомного протокола `lmorozanki://` только для production
    - Разрешена навигация по localhost в dev режиме

- **backend/package.json**
    - Обновлены команды `dev` и `electron:dev` для параллельного запуска
    - Добавлена зависимость `concurrently`

### Fixed

- **backend/src/config/index.ts** — исправлена ESLint ошибка с форматированием тернарного оператора

## [0.1.0] - 2026-01-05 16:11

### Added

#### Backend: Database Service (2026-01-05)

- **Database Layer с Kysely + better-sqlite3**
    - Конфигурация приложения (`config/index.ts`) с путем к БД
    - TypeScript схема для таблиц (`services/database/schema.ts`)
    - Автоматические миграции для таблицы `courses`
    - Singleton Database Service с инициализацией в `userData/repetitio.db`

- **Course Repository**
    - CRUD операции: `findAll()`, `findById()`, `create()`, `update()`, `delete()`
    - Автоматическое обновление `updatedAt` при изменении

#### Backend: Courses API (2026-01-05)

- **REST API endpoints для управления курсами**
    - `GET /api/courses` — список всех курсов
    - `POST /api/courses` — создание нового курса
    - `GET /api/courses/:id` — получение курса по ID
    - `PUT /api/courses/:id` — обновление курса
    - `DELETE /api/courses/:id` — удаление курса

- **Валидация с Zod v4**
    - `createCourseSchema` — валидация при создании (name обязателен)
    - `updateCourseSchema` — валидация при обновлении (все поля optional)
    - Детальные сообщения об ошибках через `issues`

#### Infrastructure (2026-01-05)

- **Утилиты**
    - Pino logger с pretty printing (`utils/logger.ts`)
    - Performance Timer для отладки (`utils/performance.ts`)

- **Electron configuration**
    - Добавлены скрипты: `rebuild`, `postinstall` для better-sqlite3
    - Установлен `electron-rebuild` для нативных модулей

- **Документация**
    - `docs/Testing_API.md` — инструкции для тестирования API через DevTools
    - Обновлен `docs/Walkthrough.md` с описанием реализованного функционала
    - Обновлен `docs/Task.md` с прогрессом выполнения

### Changed

- `backend/src/server.ts` — интеграция Database Service, удалены старые сервисы
- `backend/src/electron/main.ts` — восстановлена TypeScript версия с корректными импортами
- `backend/package.json`, `frontend/package.json` — версия обновлена до 0.1.0

### Technical Details

- База данных: SQLite в `userData/repetitio.db`
- ORM: Kysely v0.27 с полной типобезопасностью
- Валидация: Zod v4
- Установлены типы: `@types/better-sqlite3`

## [Unreleased] - 2026-01-05 14:25

### Added

#### Frontend Architecture

- **Feature-Sliced Design структура**
    - Реализована полная архитектура frontend (app, pages, widgets, features, entities, shared слои)
    - Настроен Vue Router с hash mode для работы с кастомным протоколом `lmorozanki://`
    - Созданы TypeScript типы для Electron API интеграции

- **Кастомный Title Bar**
    - Frameless окно с draggable областью для перемещения
    - Кнопки управления окном: Minimize, Maximize/Restore, Close
    - Интеграция с Electron IPC handlers
    - Backdrop blur эффект (Acrylic material на Windows 11)

- **UI компоненты (shared/ui)**
    - `Button.vue` — 4 варианта (primary, secondary, danger, ghost), 3 размера
    - `Input.vue` — с label, error states, валидацией
    - `Card.vue` — с backdrop blur и hover эффектами

- **Страницы приложения**
    - `HomePage` — список курсов, empty state, кнопка создания нового курса
    - `CoursePage` — детальный вид курса, статистика, управление карточками
    - `TrainingPage` — интерфейс повторения с переворачиваемыми карточками
    - `SettingsPage` — настройки времени тренировок (начало/конец дня)

- **API интеграция**
    - HTTP клиент на базе axios с динамическим определением backend порта
    - API client готов к интеграции с backend endpoints

- **Assets**
    - Шрифты Roboto (Web Font)
    - CSS стили приложения
    - Placeholder изображения

#### Documentation

- **README.md расширен**
    - Добавлено оглавление (Contents)
    - Описаны структуры данных (Course, Card, Settings)
    - Детальное описание Technology Stack
    - Архитектурная диаграмма (Frontend & Backend)
    - Application Features с статусом реализации
    - Current Status проекта (Фазы 1-2 завершены)
    - Prerequisites и Installation инструкции

- **Walkthrough документация**
    - `implementation_plan.md` — архитектурный план реализации
    - `walkthrough.md` — детальный walkthrough по созданной архитектуре
    - `task.md` — чеклист задач с прогрессом выполнения

#### Infrastructure

- **Linting**
    - Добавлен npm скрипт `lint` в frontend/package.json
    - Все ESLint ошибки исправлены (self-closing tags в Vue компонентах)
    - Все Markdownlint ошибки исправлены в README.md

### Changed

- `frontend/index.html` — обновлен title на "Repetitio", убраны лишние Tailwind классы
- `frontend/package.json` — добавлен lint скрипт

### Fixed

- Исправлены пути к директориям frontend/backend (2026-01-05, commits 57a6f49, 32dba9d)
- Исправлен backend/package.json (2026-01-05, commit 631e629)

## [0.0.0] - 2026-01-05 03:04

### Initial Release

- Начальный scaffolding проекта (commit 1ef8e25)
- `.gitignore` файл (commit 9d80175)
- Исключение `.agent` директории из git (commit 1746e22)
- Базовая структура README.md с философией разработки

---

## Легенда

- **Added** — новый функционал
- **Changed** — изменения в существующем функционале
- **Deprecated** — функционал, который скоро будет удален
- **Removed** — удаленный функционал
- **Fixed** — исправления багов
- **Security** — исправления уязвимостей
