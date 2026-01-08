# Tasks: Global Interleaved Training

## Phase 1: Backend Implementation

### Task 1.1: Extend CardRepository with Global Queue

**Duration**: 45 min
**Dependencies**: None

- [ ] Добавить метод `getAllDueCards(now, limit)` в `cardRepository`
- [ ] Реализовать SQL запрос для выборки due карточек из всех курсов
- [ ] Отсортировать карточки по приоритету (overdue сначала)
- [ ] **Validation**: Метод возвращает карточки из разных курсов, отсортированные по срочности

### Task 1.2: Implement Global Limits Logic

**Duration**: 60 min
**Dependencies**: None

- [ ] Добавить метод `calculateGlobalAvailableCards()` в `LimitService`
- [ ] Реализовать логику учёта как глобальных, так и курсовых лимитов
- [ ] Убедиться, что `getDailyStats()` корректно работает для глобального режима
- [ ] **Validation**: Лимиты корректно применяются на уровне курса и глобально

### Task 1.3: Add Global Training API Endpoint

**Duration**: 30 min
**Dependencies**: 1.1, 1.2

- [ ] Добавить endpoint `GET /api/training/global/due-cards` в `training.ts`
- [ ] Реализовать алгоритм перемешивания (interleaving) карточек
- [ ] Применить глобальные и курсовые лимиты
- [ ] **Validation**: `curl http://localhost:3000/api/training/global/due-cards` возвращает mixed queue

### Task 1.4: Test Backend Logic

**Duration**: 30 min
**Dependencies**: 1.1, 1.2, 1.3

- [ ] Создать 3 курса с разным количеством due карточек
- [ ] Установить глобальный лимит в 50 карточек
- [ ] Установить лимит для одного курса в 10 карточек
- [ ] Вызвать `/api/training/global/due-cards`
- [ ] **Validation**: Очередь содержит не более 10 карточек из ограниченного курса и не более 50 всего

---

## Phase 2: Frontend State Management

### Task 2.1: Extend Training Store

**Duration**: 45 min
**Dependencies**: 1.3

- [ ] Открыть `frontend/src/entities/training/model/useTrainingStore.js`
- [ ] Добавить state: `isGlobalSession: false`
- [ ] Реализовать action `startGlobalSession()`:
  - Вызвать `GET /api/training/global/due-cards`
  - Установить `isGlobalSession = true`
  - Загрузить очередь карточек
- [ ] **Validation**: Store корректно переключается в глобальный режим

### Task 2.2: Test Global Session in DevTools

**Duration**: 15 min
**Dependencies**: 2.1

- [ ] Открыть DevTools → Pinia tab
- [ ] Вызвать `trainingStore.startGlobalSession()`
- [ ] **Validation**: State показывает `isGlobalSession: true` и mixed queue

---

## Phase 3: UI Components

### Task 3.1: Add Course Badge Component

**Duration**: 30 min
**Dependencies**: None

- [ ] Создать файл `frontend/src/shared/ui/CourseBadge.vue`
- [ ] Определить props: `courseName`, `courseColor` (optional)
- [ ] Реализовать компактный badge (24px height, rounded, 12px text)
- [ ] **Validation**: Badge отображается корректно с названием курса

### Task 3.2: Update TrainingPage for Global Mode

**Duration**: 60 min
**Dependencies**: 2.1, 3.1

- [ ] Открыть `frontend/src/pages/training/TrainingPage.vue`
- [ ] Добавить условную логику для `isGlobalSession`:
  - Кнопка "Назад" ведёт на главную страницу (не на курс)
  - Отображать `CourseBadge` над карточкой с текущим курсом
  - При завершении сессии редиректить на главную
- [ ] **Validation**: В глобальном режиме отображается badge курса и навигация работает корректно

### Task 3.3: Add Global Training Button to HomePage

**Duration**: 45 min
**Dependencies**: 2.1

- [ ] Открыть `frontend/src/pages/home/HomePage.vue`
- [ ] Добавить кнопку "Тренировать всё" с иконкой (bi-lightning-fill)
- [ ] Отобразить счётчик due карточек из всех курсов
- [ ] Кнопка disabled, если due карточек нет
- [ ] При клике вызвать `router.push('/training/global')`
- [ ] **Validation**: Кнопка отображается с правильным счётчиком и работает

### Task 3.4: Add Global Training Route

**Duration**: 15 min
**Dependencies**: 2.2

- [ ] Открыть `frontend/src/app/router/index.js`
- [ ] Добавить route: `/training/global` → `TrainingPage` (с query param `mode=global`)
- [ ] **Validation**: Переход на `/training/global` открывает TrainingPage в глобальном режиме

---

## Phase 4: Verification & Testing

### Task 4.1: Verify Global Session Start

**Duration**: 15 min
**Dependencies**: 3.2, 3.3, 3.4

- [ ] Создать несколько курсов с due карточками
- [ ] Кликнуть "Тренировать всё" на главной странице
- [ ] **Validation**: Открывается TrainingPage с карточкой и badge курса

### Task 4.2: Verify Cards Interleaving

**Duration**: 20 min
**Dependencies**: 4.1

- [ ] Пройти 10 карточек в global session
- [ ] Записать последовательность курсов
- [ ] **Validation**: Карточки из разных курсов чередуются (не блоками)

### Task 4.3: Verify Limits Enforcement

**Duration**: 20 min
**Dependencies**: 4.1

- [ ] Установить лимит для курса "English" = 5 новых карточек
- [ ] Установить глобальный лимит = 50 новых карточек
- [ ] Начать global session
- [ ] Изучить 10 карточек
- [ ] **Validation**: Карточек из "English" было не более 5

### Task 4.4: Verify Course Indicator

**Duration**: 10 min
**Dependencies**: 4.1

- [ ] Начать global session
- [ ] **Validation**: CourseBadge отображается на каждой карточке

### Task 4.5: Verify Due Cards Counter

**Duration**: 10 min
**Dependencies**: 3.3

- [ ] Открыть HomePage
- [ ] Создать или обновить карточки, чтобы были due
- [ ] **Validation**: Счётчик на кнопке "Тренировать всё" показывает правильное количество

### Task 4.6: Verify Button Disabled State

**Duration**: 10 min
**Dependencies**: 3.3

- [ ] Завершить все due карточки
- [ ] Открыть HomePage
- [ ] **Validation**: Кнопка "Тренировать всё" disabled или скрыта

### Task 4.7: Verify Navigation and Completion

**Duration**: 15 min
**Dependencies**: 4.1

- [ ] Начать global session
- [ ] Кликнуть "Назад"
- [ ] **Validation**: Возврат на главную страницу (не на страницу курса)
- [ ] Завершить global session
- [ ] **Validation**: Редирект на главную страницу

---

## Phase 5: Documentation & Cleanup

### Task 5.1: Update Walkthrough

**Duration**: 30 min
**Dependencies**: All previous tasks

- [ ] Открыть `docs/Walkthrough.md`
- [ ] Добавить раздел "Глобальная тренировка":
  - Описание Global Training mode
  - Алгоритм interleaving
  - Логика учёта лимитов
  - API endpoint `/api/training/global/due-cards`
  - Компонент `CourseBadge`
- [ ] **Validation**: Документация актуальна и понятна

### Task 5.2: Update Changelog

**Duration**: 10 min
**Dependencies**: 5.1

- [ ] Открыть `docs/Changelog.md`
- [ ] Добавить новую запись:

  ```markdown
  ## [0.8.0] - YYYY-MM-DD

  ### Added

  - Глобальная тренировка: возможность изучать карточки из всех курсов в одной сессии
  - Алгоритм interleaved practice для улучшения запоминания
  - Кнопка "Тренировать всё" на главной странице с счётчиком due карточек
  - Badge курса на карточках в глобальном режиме
  - API endpoint GET /api/training/global/due-cards
  ```

- [ ] **Validation**: Changelog отражает все изменения

### Task 5.3: Final Linting and Formatting

**Duration**: 10 min
**Dependencies**: All previous tasks

- [ ] Выполнить `npm run lint` в `frontend/`
- [ ] Выполнить `npm run lint` в `backend/`
- [ ] Исправить все ошибки и предупреждения
- [ ] **Validation**: `npm run lint` проходит без ошибок

---

## Summary

**Total Estimated Duration**: ~7-8 hours

**Parallelizable Tasks**:

- Task 1.1 + 1.2 могут выполняться параллельно
- Task 3.1 может начаться до завершения Phase 2
- Verification tasks (Phase 4) могут частично выполняться параллельно

**Critical Path**:

1. Backend (Phase 1) → State Management (Phase 2) → UI Components (Phase 3) → Verification (Phase 4)

**Acceptance Criteria**:

- [ ] Global training session успешно стартует и загружает mixed queue
- [ ] Карточки из разных курсов чередуются в сессии
- [ ] Глобальные и курсовые лимиты корректно применяются
- [ ] Badge курса отображается на каждой карточке
- [ ] Кнопка "Тренировать всё" работает и показывает правильный счётчик
- [ ] Навигация и завершение сессии работают корректно
- [ ] Документация обновлена
- [ ] Linting проходит без ошибок
