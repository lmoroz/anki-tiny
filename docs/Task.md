# Задачи реализации Repetitio

## Фаза 1: Архитектура и настройка ✅

- [x] Создать структуру проекта по Feature-Sliced Design
- [x] Настроить роутинг с учетом кастомного протокола `lmorozanki://`
- [x] Создать глобальные типы для Electron API

## Фаза 2: UI Framework и кастомный Title Bar ✅

- [x] Реализовать кастомный заголовок окна
- [x] Настроить базовые UI компоненты

## Фаза 3: Основной функционал - Курсы ✅

### Backend ✅

- [x] **Database Service**
    - [x] Конфигурация приложения
    - [x] Схема БД с Kysely типами
    - [x] Миграции для таблицы courses
    - [x] Singleton Database Service
- [x] **Courses API**
    - [x] Course Repository (CRUD)
    - [x] Validation схемы (Zod)
    - [x] API Routes (GET, POST, PUT, DELETE)
    - [x] Интеграция в Express server

### Frontend - Управление курсами ✅

- [x] **Data Layer**
    - [x] API client с автоопределением порта backend
    - [x] Pinia store для курсов
    - [x] TypeScript типы для entities
- [x] **UI Layer - Shared Components**
    - [x] Input компонент (с поддержкой textarea)
    - [x] Modal компонент
- [x] **UI Layer - Widgets**
    - [x] CourseList widget
    - [x] CourseCard компонент
    - [x] CourseEditorModal
- [x] **Pages**
    - [x] HomePage с полным CRUD функционалом
- [x] **Тестирование**
    - [x] Загрузка списка курсов
    - [x] Создание курса

---

## Фаза 4: Карточки и FSRS ✅

### Backend (Завершено)

- [x] **Database Schema**
    - [x] Обновить `schema.ts` с `CardsTable`, `SettingsTable`, `CourseSettingsTable`
    - [x] Добавить FSRS-специфичные поля (stability, difficulty, state, reps, lapses)
    - [x] Обновить интерфейс `Database`

- [x] **Database Migrations**
    - [x] Создать миграцию `002_create_cards_table.sql`
    - [x] Создать миграцию `003_create_settings_table.sql`
    - [x] Создать миграцию `004_create_course_settings_table.sql`
    - [x] Определить индексы (courseId, due, state)

- [x] **FSRS Service**
    - [x] Установить пакет `ts-fsrs`
    - [x] Создать `services/fsrs/index.ts`
    - [x] Реализовать `calculateNextReview()`
    - [x] Реализовать Learning Steps логику
    - [x] Реализовать `canShowNewCards()`
    - [x] Реализовать `initializeNewCard()`

- [x] **Repositories**
    - [x] Card Repository (CRUD + getDueCards + getCourseStats)
    - [x] Settings Repository (глобальные + курса + getEffectiveSettings)

- [x] **Validation Schemas**
    - [x] Создать `schemas/card.ts` (Create, Update, Review)
    - [x] Создать `schemas/settings.ts` (Global, Course)

- [x] **API Routes**
    - [x] `routes/cards.ts` (6 endpoints)
    - [x] `routes/training.ts` (2 endpoints)
    - [x] `routes/settings.ts` (5 endpoints)
    - [x] Зарегистрировать в `routes/index.ts`

- [x] **Исправление ошибок и форматирование**
    - [x] FSRS Rating types
    - [x] Zod schema syntax
    - [x] ZodError обработка
    - [x] Prettier форматирование
    - [x] TypeScript compilation

### Frontend - Работа с карточками (В процессе)

- [x] **Entity Layer**
    - [x] API сервис для карточек (`shared/api/cards.js`)
    - [x] Pinia store для карточек (`entities/card/model/useCardStore.js`)
    - [x] TypeScript типы (`shared/types/card.ts`: CardState enum, Card interface)

- [x] **Widgets**
    - [x] CardList widget (`widgets/card-list/CardList.vue`)
    - [x] CardItem компонент (`widgets/card-list/CardItem.vue`)
    - [x] CardEditorModal (`widgets/card-editor/CardEditorModal.vue`)
    - [x] QuickAddCard компонент (`widgets/quick-add-card/QuickAddCard.vue`)

- [x] **Pages Integration**
    - [x] CoursePage - интеграция управления карточками (CRUD operations)
    - [ ] TrainingPage - интерфейс тренировки с FSRS (следующий этап)
- [x] SettingsPage - глобальные и индивидуальные настройки

## Фаза 5: Страница настроек (SettingsPage) ✅

### Backend ✅

- [x] API Ecdpoints (GET/PUT Settings, Course Settings)
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

## Фаза 5: Системная интеграция (Запланировано)

### Система уведомлений

- [ ] **Backend Notifications Service**
    - [ ] Проверка due cards каждый час
    - [ ] Фильтрация по времени тренировок
    - [ ] Проверка "не предлагать новые карточки если до конца дня < 4 часов"
    - [ ] Electron Notification API integration

- [ ] **Electron Main Process**
    - [ ] IPC handlers для уведомлений
    - [ ] Системные уведомления Windows/Linux/macOS

- [ ] **Frontend**
    - [ ] Настройка частоты уведомлений в Settings
    - [ ] Тест уведомлений из UI

### Tray Integration

- [ ] **Electron Main Process**
    - [ ] Создание Tray icon
    - [ ] Tray menu (Открыть, Выход)
    - [ ] Изменение window-close: hide вместо quit
    - [ ] Показ окна из трея

---

## Фаза 6: Расширенный функционал (Опционально)

- [ ] **Статистика прогресса обучения**
    - [ ] Backend: API для статистики
    - [ ] Frontend: Dashboard страница с графиками

- [ ] **Импорт/Экспорт курсов**
    - [ ] Backend: JSON export/import endpoints
    - [ ] Frontend: UI для импорта/экспорта

- [ ] **Медиа в карточках**
    - [ ] Backend: File upload endpoints
    - [ ] Database: media_files таблица
    - [ ] Frontend: Image/Audio upload компоненты

- [ ] **Поиск по карточкам**
    - [ ] Backend: Full-text search API
    - [ ] Frontend: SearchBar компонент

- [ ] **Теги и категории**
    - [ ] Database: tags таблица, card_tags связь
    - [ ] Backend: Tags API
    - [ ] Frontend: Tag management UI

---

## Текущий статус

**✅ Завершено:** Backend реализация Cards и FSRS

- Database schema (3 новые таблицы)
- FSRS Service с learning steps
- 13 API endpoints
- TypeScript компиляция успешна  
- Code formatting применен

**✅ Завершено:** Frontend интеграция курсов (CRUD полностью работает)

**✅ Завершено:** Frontend интеграция карточек (Управление карточками в курсе)

- Entity Layer: API client, Pinia store, TypeScript types
- Widgets: CardItem (с flip анимацией), CardList, CardEditorModal, QuickAddCard
- CoursePage интеграция: полный CRUD, статистика, валидация
- ESLint проверка пройдена

**📋 Документация:**

- [Backend_Cards_FSRS_Walkthrough.md](file:///e:/Develop/anki-tiny/docs/Backend_Cards_FSRS_Walkthrough.md)
- [Cards_FSRS_Implementation_Plan.md](file:///e:/Develop/anki-tiny/docs/Cards_FSRS_Implementation_Plan.md)
- [Cards_FSRS_Architecture.md](file:///e:/Develop/anki-tiny/docs/Cards_FSRS_Architecture.md)
- [Cards_Frontend_Implementation_Plan.md](file:///C:/Users/I%20am/.gemini/antigravity/brain/66d166ab-9158-446a-a995-53247e8be728/Cards_Frontend_Implementation_Plan.md)
- [Cards_Frontend_Walkthrough.md](file:///C:/Users/I%20am/.gemini/antigravity/brain/66d166ab-9158-446a-a995-53247e8be728/Cards_Frontend_Walkthrough.md)

**⏭️ Следующие шаги:** TrainingPage (интерфейс тренировки с FSRS) → SettingsPage

> [!NOTE]
> Frontend Vite dev server запущен (localhost:5173).
> Обнаружена ошибка запуска Electron backend (import issue в main.js) - требует отдельного исправления.
