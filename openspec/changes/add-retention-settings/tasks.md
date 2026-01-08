# Implementation Tasks

## Phase 1: Database Schema

- [x] Create migration для добавления `requestRetention` в таблицу `settings`
- [x] Create migration для добавления `requestRetention` в таблицу `courseSettings`
- [x] Добавить значения по умолчанию (0.90) для всех существующих записей

## Phase 2: Backend Updates

- [x] Обновить `FSRSSettings` interface для включения `requestRetention`
- [x] Обновить `settingsRepository` для чтения/записи `requestRetention`
- [x] Обновить `courseSettingsRepository` для поддержки nullable `requestRetention`
- [x] Обновить `initializeFSRS` в `fsrs/index.ts` для использования настраиваемого retention
- [x] Добавить валидацию на backend (0.70 ≤ requestRetention ≤ 1.00)

## Phase 3: API Updates

- [x] Обновить `GET /api/settings` для возврата `requestRetention`
- [x] Обновить `PUT /api/settings` для сохранения `requestRetention`
- [x] Обновить `GET /api/courses/:id/settings` для возврата `requestRetention`
- [x] Обновить `PUT /api/courses/:id/settings` для сохранения `requestRetention`

## Phase 4: Frontend Data Layer

- [x] Обновить Zod схемы настроек для включения `requestRetention`
- [x] Обновить Settings store (useSettingsStore) для работы с новым полем
- [x] Добавить computed для маппинга числовых значений в названия уровней

## Phase 5: UI Components — Retention Parameter

- [x] Создать `RetentionLevelPicker` компонент (radio buttons для 3 уровней)
- [x] Добавить tooltips с объяснением каждого уровня
- [x] Интегрировать в SettingsForm (глобальные настройки)
- [x] Интегрировать в CourseSettingsModal (курсовые настройки)
- [x] Добавить placeholder для nullable значения (наследование от глобальных)

## Phase 6: UI Components — Collapsible Sections

- [x] Создать `CollapsibleSection` компонент (с заголовком и иконкой expand/collapse)
- [x] Реорганизовать SettingsForm в секции:
  - Временные рамки тренировок
  - Параметры FSRS (learningSteps, enableFuzz, requestRetention)
  - Уведомления
  - Дневные лимиты (глобальные)
  - Лимиты курсов по умолчанию
- [x] Реорганизовать CourseSettingsModal в секции:
  - Временные рамки тренировок
  - Параметры FSRS
  - Дневные лимиты курса
  - Сессионные лимиты
- [x] Сохранять состояние секций (открыто/закрыто) в localStorage

## Phase 7: Validation & Testing

- [x] Проверить миграцию БД (существующие курсы используют 0.90)
- [x] Протестировать API endpoints (GET/PUT для settings и courseSettings)
- [x] Протестировать FSRS расчеты с разными retention значениями
- [x] Протестировать наследование retention в курсовых настройках
- [x] Протестировать сворачиваемые секции в UI
- [x] Проверить валидацию на frontend и backend

## Phase 8: Documentation

- [ ] Обновить `docs/Walkthrough.md` с новой функциональностью
- [ ] Обновить `docs/Changelog.md`
