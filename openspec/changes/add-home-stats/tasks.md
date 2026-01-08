# Tasks: Add Aggregated Training Statistics to Home Page

## Phase 1: Backend API Implementation

### Task 1.1: Add Global Stats Endpoint

**Duration**: 30 min  
**Dependencies**: None

- [ ] Создать новый файл `backend/src/routes/stats.ts`
- [ ] Добавить endpoint `GET /api/stats/global`
- [ ] Зарегистрировать роут в `backend/src/routes/index.ts`
- [ ] **Validation**: `curl http://localhost:3000/api/stats/global` возвращает `{"totalNewCards": <number>}`

### Task 1.2: Extend Card Repository

**Duration**: 20 min  
**Dependencies**: None

- [ ] Добавить метод `getGlobalNewCardsCount()` в `cardRepository`
- [ ] Реализовать SQL запрос с фильтрацией по `state = CardState.New`
- [ ] **Validation**: Метод возвращает корректное количество новых карточек из БД

### Task 1.3: Test Backend API

**Duration**: 15 min  
**Dependencies**: 1.1, 1.2

- [ ] Создать 3 курса с 10, 15, 20 новыми карточками соответственно
- [ ] Вызвать `GET /api/stats/global`
- [ ] **Validation**: Response содержит `{"totalNewCards": 45}`

---

## Phase 2: Frontend State Management

### Task 2.1: Create Stats Store

**Duration**: 45 min  
**Dependencies**: 1.1, 1.2

- [ ] Создать директорию `frontend/src/entities/stats/model`
- [ ] Создать файл `useStatsStore.js` с Pinia store
- [ ] Определить state:

  ```typescript
  {
    totalNewCards: 0,
    studiedToday: 0,
    remainingToday: 0,
    dailyNewLimit: 0,
    trainingsToday: 0,
    loading: false,
    error: null
  }
  ```

- [ ] Реализовать action `fetchGlobalStats()`:
  - Вызвать `GET /api/training/stats`
  - Вызвать `GET /api/stats/global`
  - Рассчитать агрегированные метрики
- [ ] **Validation**: Store корректно обновляет state после вызова `fetchGlobalStats()`

### Task 2.2: Test Stats Store in DevTools

**Duration**: 15 min  
**Dependencies**: 2.1

- [ ] Импортировать store в `main.js`
- [ ] Открыть DevTools → Pinia tab
- [ ] Вызвать `statsStore.fetchGlobalStats()`
- [ ] **Validation**: State обновляется корректными значениями

---

## Phase 3: UI Components

### Task 3.1: Create StatItem Component

**Duration**: 30 min  
**Dependencies**: None

- [ ] Создать файл `frontend/src/shared/ui/StatItem.vue`
- [ ] Определить props: `icon`, `label`, `value`
- [ ] Реализовать layout: icon (24px) + label (14px) + value (24px, bold)
- [ ] Применить CSS variables из design system
- [ ] **Validation**: Компонент отображается корректно в изоляции

### Task 3.2: Create GlobalStats Component

**Duration**: 60 min  
**Dependencies**: 2.1, 3.1

- [ ] Создать файл `frontend/src/widgets/global-stats/GlobalStats.vue`
- [ ] Использовать `useStatsStore` для получения данных
- [ ] Использовать `Card.vue` как обёртку
- [ ] Добавить 5 `StatItem` компонентов для метрик:
  - Новых карточек (всего)
  - Изучено/повторено сегодня
  - Осталось на сегодня
  - Дневной лимит новых карточек
  - Тренировок сегодня
- [ ] Добавить placeholder для графика (200px высота, dashed border)
- [ ] Реализовать loading state (spinner + "Загрузка статистики...")
- [ ] Реализовать error state (сообщение + кнопка "Попробовать снова")
- [ ] **Validation**: Компонент отображает все метрики корректно

### Task 3.3: Update HomePage Layout

**Duration**: 45 min  
**Dependencies**: 3.2

- [ ] Открыть `frontend/src/pages/home/HomePage.vue`
- [ ] Изменить layout на двухколоночный grid:

  ```css
  .home-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
  ```

- [ ] Добавить `GlobalStats` компонент в правую колонку
- [ ] Добавить `onMounted` hook для вызова `statsStore.fetchGlobalStats()`
- [ ] **Validation**: Desktop layout показывает 2 колонки (50%/50%)

---

## Phase 4: Responsive Design

### Task 4.1: Add Mobile Layout

**Duration**: 30 min  
**Dependencies**: 3.3

- [ ] Добавить media query для `< 1024px`:

  ```css
  @media (max-width: 1024px) {
    .home-grid {
      grid-template-columns: 1fr;
    }
    .stats-column {
      order: -1;
    }
  }
  ```

- [ ] **Validation**: Mobile layout показывает статистику выше списка курсов

### Task 4.2: Test Responsive Behavior

**Duration**: 15 min  
**Dependencies**: 4.1

- [ ] Открыть DevTools → Responsive mode
- [ ] Переключить между desktop (1920x1080) и mobile (375x667)
- [ ] **Validation**: Layout корректно переключается между режимами

---

## Phase 5: Integration and Polish

### Task 5.1: Refresh Statistics After Training

**Duration**: 30 min  
**Dependencies**: 2.1, 3.2

- [ ] Открыть `frontend/src/pages/training/TrainingPage.vue`
- [ ] После успешного review вызвать `statsStore.fetchGlobalStats()`
- [ ] **Validation**: Статистика обновляется после завершения тренировки

### Task 5.2: Theme Support Verification

**Duration**: 15 min  
**Dependencies**: 3.2

- [ ] Переключить на dark theme
- [ ] Проверить, что `GlobalStats` корректно отображается в обеих темах
- [ ] **Validation**: Все цвета используют CSS variables и адаптируются к теме

### Task 5.3: Accessibility Review

**Duration**: 20 min  
**Dependencies**: 3.1, 3.2

- [ ] Добавить `aria-label` для всех иконок
- [ ] Проверить keyboard navigation (focus states)
- [ ] Проверить screen reader announcements
- [ ] **Validation**: Компонент доступен для пользователей с ограниченными возможностями

---

## Phase 6: Documentation and Cleanup

### Task 6.1: Update Walkthrough

**Duration**: 30 min  
**Dependencies**: All previous tasks

- [ ] Открыть `docs/Walkthrough.md`
- [ ] Добавить раздел "Статистика на главной странице":
  - Описание двухколоночного layout
  - Объяснение каждой метрики
  - Ссылка на API endpoints
  - Объяснение `useStatsStore`
- [ ] **Validation**: Документация актуальна и понятна

### Task 6.2: Update Changelog

**Duration**: 10 min  
**Dependencies**: 6.1

- [ ] Открыть `docs/Changelog.md`
- [ ] Добавить новую запись:

  ```
  ## [0.6.0] - YYYY-MM-DD
  ### Added
  - Агрегированная статистика на главной странице
  - Двухколоночный layout для desktop
  - Новый API endpoint GET /api/stats/global
  - Pinia store для управления глобальной статистикой
  ```

- [ ] **Validation**: Changelog отражает все изменения

### Task 6.3: Final Linting and Formatting

**Duration**: 10 min  
**Dependencies**: All previous tasks

- [ ] Выполнить `npm run lint` в `frontend/`
- [ ] Выполнить `npm run lint` в `backend/`
- [ ] Исправить все ошибки и предупреждения
- [ ] **Validation**: `npm run lint` проходит без ошибок

---

## Summary

**Total Estimated Duration**: ~6-7 hours

**Parallelizable Tasks**:

- Task 1.1 + 1.2 могут выполняться параллельно
- Task 3.1 может начаться до завершения Phase 2
- Task 5.2 + 5.3 могут выполняться параллельно

**Critical Path**:

1. Backend API (Phase 1) → Stats Store (Phase 2) → UI Components (Phase 3) → Integration (Phase 5)

**Acceptance Criteria**:

- [ ] Главная страница показывает 5 ключевых метрик статистики
- [ ] Layout адаптируется для desktop и mobile
- [ ] Статистика обновляется после тренировки
- [ ] Все тесты пройдены (manual)
- [ ] Документация обновлена
- [ ] Linting проходит без ошибок
