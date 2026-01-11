# Development Roadmap & Project Analysis

> **Дата анализа:** 2026-01-11  
> **Текущая версия:** v0.10.0  
> **Цель:** Production-ready v1.0 Release

---

## 📊 Текущее состояние проекта

### ✅ Реализованные функции

#### Базовая архитектура

- ✅ **Electron + Vue 3 + Express** — Feature-Sliced Design для frontend, Layered Architecture для backend
- ✅ **SQLite с миграциями** — 8 миграций применено, система версионирования БД
- ✅ **FSRS v5 интеграция** — Полная поддержка ts-fsrs с кастомизацией параметров
- ✅ **CommonJS миграция** — Стабильность production builds в Electron
- ✅ **Кастомный протокол** — `lmorozanki://` для загрузки ресурсов
- ✅ **IPC Communication** — Безопасное взаимодействие через Electron preload API

#### Управление курсами и карточками

- ✅ **Полный CRUD** для курсов и карточек
- ✅ **Batch Add** — Массовое добавление через текстовый формат `question | answer`
- ✅ **Batch Delete** — Выбор нескольких карточек + удаление
- ✅ **Quick Add** — Inline режим для быстрого добавления
- ✅ **Card Editor** — Редактирование с автоматическим progress reset
- ✅ **Статистика курсов** — Отображение на главной странице (total, new, last training)

#### Система тренировок

- ✅ **FSRS v5 алгоритм** — Настраиваемые параметры spaced repetition
- ✅ **4-уровневая система лимитов:**
  - Global Daily Limits (агрегация по всем курсам)
  - Course Daily Limits (индивидуальные для каждого курса с наследованием)
  - Session Limits (ограничение на одну тренировку)
  - Daily Progress Tracking (сброс на основе trainingStartTime)
- ✅ **Card-based UI** — Flip-анимации, визуальный фидбек
- ✅ **Глобальная тренировка** — Mixed queue из всех курсов
- ✅ **Учёт времени дня** — Запрет на новые карточки если до конца дня < 4 часов
- ✅ **Кнопки оценки** — Again/Hard/Good/Easy с цветовым кодированием

#### Система настроек

- ✅ **Global Settings** — Общие настройки приложения
- ✅ **Course Settings** — Индивидуальные с наследованием от глобальных
- ✅ **Custom Time Pickers** — Scroll-based hour/minute selection
- ✅ **FSRS Configuration:**
  - learningSteps (кастомные интервалы, например 10min, 1day, 3days)
  - requestRetention (0.70-1.00)
  - maximumInterval
  - enableFuzz (рандомизация интервалов)
- ✅ **Retention Level Picker** — Визуальный выбор уровня запоминания
- ✅ **Секционная организация UI** — Collapsible sections для удобства

#### UI/UX система

- ✅ **Design System** — CSS-переменные, системный подход к стилям
- ✅ **Dark/Light темы** — Tailwind CSS v4 с полной поддержкой тем
- ✅ **Custom Title Bar** — Frameless окно с acrylic blur (Windows 11)
- ✅ **Custom Dialogs:**
  - vue3-toastify для alerts (success/error)
  - ConfirmDialog компонент для confirmations
  - Полная замена нативных `alert()` и `confirm()`
- ✅ **3D Card Flip Animation** — С auto-scaling текста для оптимальной читаемости
- ✅ **Responsive дизайн** — Desktop + mobile с slide-out panels
- ✅ **Accessibility** — ARIA атрибуты, keyboard navigation, focus management

#### Desktop интеграция

- ✅ **System Tray** — Сворачивание в трей вместо закрытия
- ✅ **Tray Context Menu:**
  - Показать/Скрыть Repetitio
  - Закрыть Repetitio (полное завершение)
- ✅ **Правильный lifecycle** — Cleanup resources, graceful shutdown
- ✅ **Database Path Resolution** — Корректное хранение в userData directory
- ✅ **Cross-platform** — Windows, macOS, Linux

#### Real-time обновления

- ✅ **SSE (Server-Sent Events)** для статистики
- ✅ **StatsScheduler** — Умное планирование обновлений на основе due times
- ✅ **Broadcast на мутациях** — Мгновенные обновления после training/CRUD операций
- ✅ **Connection status indicator** — Визуальная индикация подключения SSE

#### Code Quality

- ✅ **Pre-commit hooks** — husky + lint-staged
- ✅ **ESLint + Prettier** — Единый стиль кода
- ✅ **Markdownlint** — Качество документации
- ✅ **TypeScript strict mode** — Полная типизация
- ✅ **Zod v4** — Валидация всех inputs/outputs

#### OpenSpec

- ✅ **13 спецификаций** — Все прошли валидацию
- ✅ **OpenSpec workflow** — Настроен и работает
- ✅ **Архивированные изменения** — История успешных внедрений

---

## 🚀 Недостающий функционал

### Priority 1: Desktop Integration (критично для v1.0)

#### 1. System Notifications 🔴

**Статус:** Не реализовано  
**Блокирует:** v1.0 Release

**Описание:**
Нативные OS уведомления для карточек, требующих повторения.

**Требования:**

- Electron Notification API интеграция
- Уведомления при наличии due cards
- Click handler → открытие приложения в Training Mode
- Notification scheduling на основе FSRS due times
- Поддержка Windows/macOS/Linux
- Settings toggle для включения/отключения

**Задачи:**

1. Backend: Notification Service (проверка due cards, планирование)
2. Backend: IPC handler для показа уведомлений
3. Frontend: Notification preferences в настройках
4. Electron: Deep linking (открытие на `/training/global`)
5. Testing: проверка на всех ОС

**Сложность:** Medium  
**Оценка:** 8-12 часов

---

#### 2. Deep Linking 🟠

**Статус:** Не реализовано  
**Зависимости:** Используется в System Notifications

**Описание:**
Кастомный URL scheme для открытия приложения из внешних источников.

**Требования:**

- Protocol handler: `repetitio://training/global`
- Protocol registration в Electron
- IPC forwarding в frontend router
- Параметры: `repetitio://training/course/1`

**Задачи:**

1. Electron: Protocol registration (`repetitio://`)
2. Electron: URL parsing и IPC forwarding
3. Frontend: Router navigation из IPC events
4. Testing: notification click → app open → navigation

**Сложность:** Low-Medium  
**Оценка:** 4-6 часов

---

### Priority 2: Enhancements (post-v1.0)

#### 3. Statistics Dashboard 🟡

**Статус:** Частично реализовано (базовая GlobalStats есть)

**Описание:**
Расширенная визуализация прогресса обучения.

**Что добавить:**

**Charts/Visualizations:**

- Heatmap календарь (как в GitHub) — активность обучения
- Line chart прогресса за неделю/месяц
- Pie chart распределения карточек (New/Learning/Review)
- Bar chart ежедневных reviewed cards

**Extended Metrics:**

- Retention rate (процент правильных ответов)
- Learning velocity (новых карт в день)
- Review accuracy по курсам
- FSRS performance metrics (stability, difficulty trends)

**Time Range Filtering:**

- Last 7/30/90 days
- Custom date range picker

**Технологии:**

- `chart.js` + `vue-chartjs` (lightweight)
- ИЛИ `Apache ECharts` (более мощно, красивее)

**Задачи:**

1. Backend: Расширенные API endpoints (`/api/stats/history`, `/api/stats/retention`)
2. Backend: Aggregation queries в cardRepository
3. Frontend: Chart components (Vue wrappers)
4. Frontend: StatsPage.vue с tab navigation
5. UI: Responsive charts для mobile

**Сложность:** Medium-High  
**Оценка:** 16-24 часа

---

#### 4. Import/Export 🟡

**Статус:** Не реализовано

**Описание:**
Импорт/экспорт данных в различных форматах.

**Функции:**

**JSON Export/Import:**

- Курс целиком (с карточками)
- Несколько курсов
- Вся база данных (backup)
- Формат: JSON с метаданными (version, export date)

**Anki Format:**

- Import `.apkg` (Anki package format)
- Export в `.txt` (Anki text format: `question | answer`)
- Mapping Anki fields → Repetitio front/back
- FSRS state handling (conversion from SM-2)

**Задачи:**

1. Backend: Export service (JSON serialization, ZIP packages)
2. Backend: Import service (parsing, validation, conflict resolution)
3. Backend: Anki format parser (`sql.js` для `.apkg`)
4. Frontend: Import/Export UI (file upload, download)
5. Frontend: Import wizard (field mapping, preview)
6. Testing: edge cases (duplicates, missing courses)

**Сложность:** High  
**Оценка:** 20-32 часа

---

#### 5. Media Support 🟢

**Статус:** Не реализовано

**Описание:**
Поддержка изображений и аудио в карточках.

**Функции:**

**Image Support:**

- Upload images для front/back
- Inline rendering (Markdown: `![alt](path)`)
- Storage в `userData/images/`
- Image compression

**Audio Support:**

- Upload MP3/WAV для pronunciation cards
- Play button в карточках
- Storage в `userData/audio/`

**File Management:**

- Delete unused media (orphan cleanup)
- Media preview в Card Editor

**Технологии:**

- `markdown-it` (уже есть) для рендеринга
- `sharp` для image compression
- `howler.js` для audio playback

**Задачи:**

1. Backend: File upload endpoint (`POST /api/media`)
2. Backend: Media storage service (fs-extra)
3. Backend: Orphan cleanup service
4. Database: Migration для `mediaFiles` table
5. Frontend: File upload component (drag-n-drop)
6. Frontend: Markdown preview в Card Editor
7. Frontend: Audio player component

**Сложность:** High  
**Оценка:** 24-40 часов

---

#### 6. Search & Filtering 🟢

**Статус:** Не реализовано

**Описание:**
Полнотекстовый поиск и фильтрация карточек.

**Функции:**

**Full-Text Search:**

- Search по `front`/`back` текстам
- SQLite FTS5 (Full-Text Search extension)
- Debounced search input
- Highlight matching text

**Filtering:**

- By state (New/Learning/Review)
- By due date range
- By tags (если Tags System реализован)

**Sorting:**

- By created date
- By last review date
- By difficulty

**Задачи:**

1. Backend: FTS5 virtual table migration
2. Backend: Search endpoint (`GET /api/cards/search?q=keyword`)
3. Frontend: Search bar в CoursePage
4. Frontend: Filter UI (checkboxes, date picker)
5. Frontend: Results highlighting

**Сложность:** Medium  
**Оценка:** 12-16 часов

---

#### 7. Tags System 🟢

**Статус:** Не реализовано

**Описание:**
Система тегов для организации карточек.

**Функции:**

- Tags для карточек (many-to-many)
- Tag CRUD (create, rename, delete)
- Tag-based filtering
- Tag autocomplete в Card Editor
- Tag cloud visualization

**Database Schema:**

```sql
CREATE TABLE tags (
  id INTEGER PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE cardTags (
  cardId INTEGER REFERENCES cards(id) ON DELETE CASCADE,
  tagId INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (cardId, tagId)
);
```

**Задачи:**

1. Backend: Migration для `tags` и `cardTags`
2. Backend: Tag repository (CRUD)
3. Backend: Tag endpoints (`GET/POST/PUT/DELETE /api/tags`)
4. Frontend: Tag input component (autocomplete)
5. Frontend: Tag filter UI
6. Frontend: Tag manager page (bulk operations)

**Сложность:** Medium  
**Оценка:** 16-20 часов

---

## 🔴 Слабые места и технические долги

### 1. Отсутствие автотестов 🔴 КРИТИЧНО

**Проблема:**

- Нет unit tests
- Нет integration tests
- Нет E2E tests
- Ручное тестирование отнимает много времени
- Регрессии могут быть незамечены

**Риски:**

- Поломка критического функционала после рефакторинга
- Долгий цикл Bug → Fix → Test
- Сложность поддержки при росте codebase

**Решение:**

#### Backend Unit Tests (Vitest настроен)

- Repository tests (CRUD operations)
- FSRS Service tests (calculateNextReview logic)
- Limit Service tests (calculateAvailableCards)
- Migration tests (schema consistency)

#### Backend Integration Tests

- API endpoints (`supertest` library)
- Database transactions
- SSE broadcasts

#### Frontend Unit Tests

- Composables (`useStatsStream`, `useAutoFitText`)
- Stores (Pinia)
- Utilities (date formatting, validation)

#### E2E Tests (опционально)

- `Playwright` или `Cypress`
- Critical flows (Create Course → Add Cards → Training)

**Оценка:** 40-60 часов  
**Приоритет:** High (должно быть в v1.0)

---

### 2. Database Performance 🟠 ВАЖНО

**Проблема:**

- Нет индексов на некоторых критических полях
- Column `elapsedDays` не используется (техдолг из migration 002)
- Таблица `dailyProgress` растёт линейно без archiving

**Риски:**

- Slow queries при большом количестве карточек (>10k)
- Рост размера БД без cleanup

**Решение:**

#### Index Optimization

- EXPLAIN QUERY PLAN для всех критических запросов
- Composite indexes (например, `(courseId, state, due)` для due cards query)

#### Remove Unused Columns

- Migration для удаления `elapsedDays`

#### Data Archiving

- Cleanup `dailyProgress` старше 1 года (configurable)
- Archive в separate SQLite file

**Оценка:** 8-12 часов  
**Приоритет:** Medium (может подождать до v1.1)

---

### 3. Logging & Observability 🟠 ВАЖНО

**Проблема:**

- Production logs в `{DATA_ROOT}/logs/app.log`
- Нет rotation (файл растёт бесконечно)
- Нет structured logging для критических action
- Нет детальных error messages для пользователя

**Риски:**

- Переполнение диска логами
- Сложная отладка production issues
- Пользователь видит только generic "Failed to..." сообщения

**Решение:**

#### Log Rotation

- `pino-roll` или custom rotation (max 10MB, keep 5 files)

#### Structured Logging

- Context fields: `userId`, `courseId`, `cardId`, `action`
- Критические events: training start/end, DB errors, SSE disconnects

#### Error Reporting

- Sentry integration (опционально)
- ИЛИ custom error aggregation (`errors.log`)

#### Performance Monitoring

- Slow queries (>100ms)
- Request timing (pino-http уже логирует requests)

**Оценка:** 6-10 часов  
**Приоритет:** Medium

---

### 4. Security 🟡 СРЕДНИЙ ПРИОРИТЕТ

**Проблема:**

- Express API без rate limiting (хотя это desktop app для 1 пользователя)
- Нет CSRF protection (не критично для Electron IPC)
- Database файл не зашифрован (plaintext SQLite)
- Нет backup mechanism

**Риски:**

- Потеря данных при corruption или удалении файла
- Утечка данных при доступе к файловой системе

**Решение:**

#### Database Encryption (опционально)

- `better-sqlite3` + SQLCipher
- Требует master password

#### Auto Backup

- Daily backup в `{userData}/backups/`
- Keep last 7 days
- Background process в StatsScheduler

#### CORS Strictness

- Production: только `lmorozanki://` protocol

**Оценка:** 10-16 часов (с encryption)  
**Приоритет:** Low (не критично для single-user desktop app)

---

### 5. Code Organization 🟡 СРЕДНИЙ ПРИОРИТЕТ

**Проблема:**

- `backend/src/services/` имеет mixed responsibilities:
  - `limitService.ts` — business logic
  - `statsScheduler.ts` — scheduled service
  - `repositories/` — data access
  - `fsrs/` — domain logic
- Нет чёткого разделения на layers

**Риски:**

- Сложность понимания для новых разработчиков
- Потенциал circular dependencies

**Решение:**

#### Refactor Backend Structure

```text
backend/src/
├── domain/           # Pure business logic
├── application/      # Use cases
├── infrastructure/   # External dependencies
│   ├── database/
│   ├── repositories/
│   └── schedulers/
├── presentation/     # API layer
└── config/
```

#### Dependency Injection

- Simple DI container (`awilix` или custom)
- Inject repositories через constructor

**Оценка:** 16-24 часа  
**Приоритет:** Low (работает, но улучшит maintainability)

---

### 6. Frontend State Management 🟢 НИЗКИЙ ПРИОРИТЕТ

**Проблема:**

- Pinia stores имеют direct API calls
- Нет централизованной error handling strategy
- Нет connection state management (SSE disconnect → ?)

**Риски:**

- Дублирование error handling logic
- Inconsistent UX при ошибках

**Решение:**

#### API Service Layer

- Wrapper классы (`CourseService`, `CardService`)
- Централизованный error handling

#### Global Error Store

- `useErrorStore` для toast notifications
- Auto-dismiss после 5 секунд

#### Offline Support (опционально)

- Detect SSE disconnect
- Fallback на polling
- Warning badge

**Оценка:** 8-12 часов  
**Приоритет:** Low

---

## 📈 Development Roadmap

### Phase 1: v1.0 Release (Priority 1)

**Цель:** Production-ready application

#### Задачи

1. **System Notifications** — 12h
2. **Deep Linking** — 6h
3. **Backend Unit Tests** — 40h ← Критично!
4. **Log Rotation** — 6h
5. **Auto Backup** — 8h
6. **Production Build Testing** — 8h

**Итого:** ~80 часов (~2 недели full-time)  
**Release Target:** v1.0.0

#### Must-Have критерии

- ✅ System Notifications работают на всех платформах
- ✅ Deep Linking корректно открывает training mode
- ✅ Unit Test coverage минимум 60% для critical paths
- ✅ Log rotation предотвращает переполнение диска
- ✅ Auto Backup сохраняет данные ежедневно
- ✅ Production build проходит smoke testing

---

### Phase 2: v1.1 Enhancements

**Цель:** Feature-rich application

#### Задачи

1. **Statistics Dashboard** — 24h
2. **Search & Filtering** — 16h
3. **Frontend Unit Tests** — 20h
4. **Database Performance Optimization** — 12h

**Итого:** ~72 часа (~1.5 недели)  
**Release Target:** v1.1.0

#### Nice-to-Have

- Charts с красивыми визуализациями
- Быстрый поиск по карточкам
- Frontend test coverage >50%
- Оптимизированные запросы для больших датасетов

---

### Phase 3: v1.2 Advanced Features

**Цель:** Professional-grade application

#### Задачи

1. **Import/Export** — 32h
2. **Tags System** — 20h
3. **Media Support** — 40h
4. **E2E Tests** — 16h

**Итого:** ~108 часов (~2.5 недели)  
**Release Target:** v1.2.0

#### Advanced Features

- Anki format compatibility
- Tag-based organization
- Image/Audio в карточках
- Comprehensive E2E test suite

---

## 🎯 Критические моменты для v1.0

### Must-Have (блокируют release)

- 🔴 System Notifications
- 🔴 Deep Linking
- 🔴 Unit Tests (backend critical paths)
- 🔴 Log Rotation
- 🔴 Auto Backup

### Nice-to-Have (могут подождать)

- ⏸️ Statistics Dashboard
- ⏸️ Import/Export
- ⏸️ Media Support
- ⏸️ Tags System

---

## 📊 Общая оценка проекта

### Strengths (Сильные стороны)

- ✅ **Solid Architecture** — FSD для frontend, layered для backend
- ✅ **Modern Stack** — Vue 3, Vite, TypeScript, Electron 39
- ✅ **Real-time Updates** — SSE вместо polling (отличное решение!)
- ✅ **Developer Experience** — Pre-commit hooks, OpenSpec workflow
- ✅ **Code Quality** — ESLint, Prettier, TypeScript strict mode
- ✅ **Documentation** — Подробный Changelog, проектная документация

### Weaknesses (Слабые стороны)

- ❌ **No Tests** — критичный gap для production app
- ❌ **Missing Notifications** — блокирует v1.0 release
- ❌ **No Backup Strategy** — риск потери данных
- ❌ **Log Growth** — нет rotation
- ⚠️ **Limited Error Handling** — generic error messages

### Overall Score: 7.5/10

| Критерий             | Оценка  | Комментарий                        |
| -------------------- | ------- | ---------------------------------- |
| Functionality        | 8/10    | Основное работает отлично          |
| Code Quality         | 8/10    | Хороший стиль, но нет тестов       |
| Architecture         | 8/10    | Solid, но может быть более layered |
| User Experience      | 7/10    | Красиво, но нет notifications      |
| Production Readiness | 6/10    | Нужны tests, backup, log rotation  |
| **Общая оценка**     | **7.5** | **Почти готово к production**      |

---

## 🚀 Рекомендации

### Краткосрочные (2 недели)

**Фокус:** Завершение v1.0

1. ✅ Implement System Notifications (Top priority!)
2. ✅ Add Deep Linking support
3. ✅ Write Backend Unit Tests (критично для стабильности)
4. ✅ Implement Log Rotation
5. ✅ Add Auto Backup mechanism

**После этого:** Приложение готово для production use и публикации.

### Среднесрочные (1 месяц)

**Фокус:** Enhancements для v1.1

1. Statistics Dashboard (пользователи оценят визуализации)
2. Search & Filtering (улучшит usability)
3. Frontend Tests (повысит качество)
4. Database Optimization (готовность к масштабированию)

### Долгосрочные (2-3 месяца)

**Фокус:** Advanced features

1. Import/Export (Anki compatibility — большой плюс)
2. Media Support (расширяет возможности обучения)
3. Tags System (улучшает организацию контента)

---

## 📝 Заключение

Проект **Repetitio** находится в отличном состоянии:

- ✅ Solid архитектура
- ✅ Современный стек технологий
- ✅ Хорошая кодовая база
- ✅ Большинство core features реализовано

**Главные блокеры v1.0:**

1. System Notifications (критично для UX desktop app)
2. Unit Tests (критично для production reliability)
3. Backup & Logging (критично для data safety)

**Рекомендация:** Сфокусироваться на **Phase 1 (v1.0)**, особенно на **Notifications + Tests + Backup**. После этого приложение будет полностью готово к production release и можно уверенно публиковать для реальных пользователей. 🚀

**Estimated Timeline:**

- **v1.0:** 2 недели (80 часов)
- **v1.1:** +1.5 недели (72 часа)
- **v1.2:** +2.5 недели (108 часов)

**Total to v1.2:** ~6 недель full-time development

---

**Дата создания:** 2026-01-11  
**Автор анализа:** AI Assistant  
**Версия документа:** 1.0
