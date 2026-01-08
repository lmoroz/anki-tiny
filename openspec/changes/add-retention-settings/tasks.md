# Implementation Tasks

## Phase 1: Database Schema

- [ ] Create migration для добавления `requestRetention` в таблицу `settings`
- [ ] Create migration для добавления `requestRetention` в таблицу `courseSettings`
- [ ] Добавить значения по умолчанию (0.90) для всех существующих записей

## Phase 2: Backend Updates

- [ ] Обновить `FSRSSettings` interface для включения `requestRetention`
- [ ] Обновить `settingsRepository` для чтения/записи `requestRetention`
- [ ] Обновить `courseSettingsRepository` для поддержки nullable `requestRetention`
- [ ] Обновить `initializeFSRS` в `fsrs/index.ts` для использования настраиваемого retention
- [ ] Добавить валидацию на backend (0.70 ≤ requestRetention ≤ 1.00)

## Phase 3: API Updates

- [ ] Обновить `GET /api/settings` для возврата `requestRetention`
- [ ] Обновить `PUT /api/settings` для сохранения `requestRetention`
- [ ] Обновить `GET /api/courses/:id/settings` для возврата `requestRetention`
- [ ] Обновить `PUT /api/courses/:id/settings` для сохранения `requestRetention`

## Phase 4: Frontend Data Layer

- [ ] Обновить Zod схемы настроек для включения `requestRetention`
- [ ] Обновить Settings store (useSettingsStore) для работы с новым полем
- [ ] Добавить computed для маппинга числовых значений в названия уровней

## Phase 5: UI Components — Retention Parameter

- [ ] Создать `RetentionLevelPicker` компонент (radio buttons для 3 уровней)
- [ ] Добавить tooltips с объяснением каждого уровня
- [ ] Интегрировать в SettingsForm (глобальные настройки)
- [ ] Интегрировать в CourseSettingsModal (курсовые настройки)
- [ ] Добавить placeholder для nullable значения (наследование от глобальных)

## Phase 6: UI Components — Collapsible Sections

- [ ] Создать `CollapsibleSection` компонент (с заголовком и иконкой expand/collapse)
- [ ] Реорганизовать SettingsForm в секции:
  - Временные рамки тренировок
  - Параметры FSRS (learningSteps, enableFuzz, requestRetention)
  - Уведомления
  - Дневные лимиты (глобальные)
  - Лимиты курсов по умолчанию
- [ ] Реорганизовать CourseSettingsModal в секции:
  - Временные рамки тренировок
  - Параметры FSRS
  - Дневные лимиты курса
  - Сессионные лимиты
- [ ] Сохранять состояние секций (открыто/закрыто) в localStorage

## Phase 7: Validation \u0026 Testing

- [ ] Проверить миграцию БД (существующие курсы используют 0.90)
- [ ] Протестировать API endpoints (GET/PUT для settings и courseSettings)
- [ ] Протестировать FSRS расчеты с разными retention значениями
- [ ] Протестировать наследование retention в курсовых настройках
- [ ] Протестировать сворачиваемые секции в UI
- [ ] Проверить валидацию на frontend и backend

## Phase 8: Documentation

- [ ] Обновить `docs/Walkthrough.md` с новой функциональностью
- [ ] Обновить `docs/Changelog.md`
- [ ] Добавить комментарии в OpenSpec specs
