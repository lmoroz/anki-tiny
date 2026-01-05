# Changelog

Все значимые изменения в проекте Anki Tiny документируются в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/),
и проект придерживается [Semantic Versioning](https://semver.org/lang/ru/).

## [Unreleased]

### Added

#### Frontend Architecture (2026-01-05)

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

- `frontend/index.html` — обновлен title на "Anki Tiny", убраны лишние Tailwind классы
- `frontend/package.json` — добавлен lint скрипт

### Fixed

- Исправлены пути к директориям frontend/backend (2026-01-05, commits 57a6f49, 32dba9d)
- Исправлен backend/package.json (2026-01-05, commit 631e629)

## [0.1.0] - 2026-01-05

### Added

#### Backend: Database Service (2026-01-05)

- **Database Layer с Kysely + better-sqlite3**
  - Конфигурация приложения (`config/index.ts`) с путем к БД
  - TypeScript схема для таблиц (`services/database/schema.ts`)
  - Автоматические миграции для таблицы `courses`
  - Singleton Database Service с инициализацией в `userData/anki.db`

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

- База данных: SQLite в `userData/anki.db`
- ORM: Kysely v0.27 с полной типобезопасностью
- Валидация: Zod v4
- Установлены типы: `@types/better-sqlite3`

## [0.0.0] - 2026-01-05

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
