# Tasks: Real-Time Statistics Updates via SSE

## Phase 1: Backend Infrastructure

### Task 1.1: Implement getNextDueCard in cardRepository

**Duration**: 30 минут

**Dependencies**: None

- [ ] Добавить метод `getNextDueCard(): Promise<{ due: string } | null>` в `cardRepository`
- [ ] Реализовать SQL запрос: `SELECT due FROM cards WHERE due > datetime('now') ORDER BY due ASC LIMIT 1`
- [ ] Убедиться, что используется индекс на колонке `due` для O(log N) производительности
- [ ] **Validation**: Метод возвращает корректный результат при наличии карточек с due в будущем
- [ ] **Validation**: Метод возвращает `null` при отсутствии таких карточек
- [ ] **Validation**: Query выполняется быстро (проверить через EXPLAIN QUERY PLAN)

---

### Task 1.2: Create StatsScheduler Service

**Duration**: 2 часа

**Dependencies**: Task 1.1

- [ ] Создать файл `backend/src/services/statsScheduler.ts`
- [ ] Реализовать класс `StatsScheduler` с полями:
  - `clients: Set<Response>`
  - `nextDueTimer: NodeJS.Timeout | null`
- [ ] Реализовать методы:
  - `addClient(client: Response): void`
  - `removeClient(client: Response): void`
  - `async scheduleNextUpdate(): Promise<void>`
  - `async broadcastStats(): Promise<void>`
  - `shutdown(): void`
- [ ] Добавить логику планирования таймера на момент следующей due карточки
- [ ] Реализовать fallback таймер на 1 час при отсутствии ближайших due карточек
- [ ] Добавить логирование ключевых событий (connection, broadcast, schedule)
- [ ] **Validation**: Scheduler корректно планирует обновление на момент ближайшей due карточки
- [ ] **Validation**: При добавлении первого клиента запускается планирование
- [ ] **Validation**: При удалении последнего клиента таймер отменяется
- [ ] **Validation**: `broadcastStats()` отправляет данные всем подключённым клиентам
- [ ] **Validation**: `shutdown()` корректно очищает все ресурсы

---

### Task 1.3: Create SSE Endpoint

**Duration**: 1 час

**Dependencies**: Task 1.2

- [ ] Создать файл `backend/src/routes/stats.ts`
- [ ] Реализовать `GET /api/stats/stream`:
  - Установить SSE headers (`Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`)
  - Зарегистрировать клиента в `statsScheduler.addClient(res)`
  - Отправить initial stats через `statsScheduler.sendToClient(res, stats)`
  - Обработать disconnect через `req.on('close', ...)`
- [ ] Зарегистрировать роут в `backend/src/routes/index.ts`
- [ ] **Validation**: Endpoint доступен по адресу `/api/stats/stream`
- [ ] **Validation**: Клиент получает initial event сразу после подключения
- [ ] **Validation**: Connection остаётся открытым
- [ ] **Validation**: При закрытии соединения клиент удаляется из scheduler

---

### Task 1.4: Integrate Broadcast Triggers

**Duration**: 1.5 часа

**Dependencies**: Task 1.2

- [ ] Добавить вызов `statsScheduler.broadcastStats()` после выполнения следующих операций:
  - **Training**: `POST /api/training/review` (в `backend/src/routes/training.ts`)
  - **Cards**: `POST /api/cards`, `PUT /api/cards/:id`, `DELETE /api/cards/:id`, batch operations (в `backend/src/routes/cards.ts`)
  - **Courses**: `PUT /api/courses/:id`, `DELETE /api/courses/:id` (в `backend/src/routes/courses.ts`)
  - **Settings**: `PUT /api/settings/global`, `PUT /api/settings/course/:id` (в `backend/src/routes/settings.ts`)
- [ ] Убедиться, что broadcast происходит ПОСЛЕ успешной операции, но ДО отправки response
- [ ] **Validation**: После завершения тренировки клиенты получают обновлённую статистику
- [ ] **Validation**: После добавления/удаления карточки клиенты получают обновлённую статистику
- [ ] **Validation**: После изменения настроек клиенты получают обновлённую статистику
- [ ] **Validation**: Broadcast НЕ происходит при ошибках в операциях

---

### Task 1.5: Implement Graceful Shutdown

**Duration**: 30 минут

**Dependencies**: Task 1.2

- [ ] Добавить обработчик `process.on('SIGTERM', ...)` в `backend/src/index.ts` (или где запускается сервер)
- [ ] Вызвать `statsScheduler.shutdown()` перед закрытием сервера
- [ ] Убедиться, что таймеры очищаются и соединения закрываются корректно
- [ ] **Validation**: При остановке сервера (Ctrl+C) все таймеры отменяются
- [ ] **Validation**: Все SSE соединения закрываются gracefully
- [ ] **Validation**: Нет утечек памяти (таймеры и клиенты очищены)

---

## Phase 2: Frontend Integration

### Task 2.1: Create useStatsStream Composable

**Duration**: 1 час

**Dependencies**: Task 1.3

- [ ] Создать файл `frontend/src/shared/lib/useStatsStream.js`
- [ ] Реализовать composable с API:
  - `useStatsStream(onUpdate: (stats) => void)` — callback для обработки обновлений
  - Возвращает `{ isConnected: Ref<boolean>, disconnect: () => void }`
- [ ] Внутри:
  - Создать `EventSource` на `/api/stats/stream`
  - Обработать событие `stats-update` → распарсить JSON → вызвать `onUpdate`
  - Обработать `onerror` → установить `isConnected = false`
  - Обработать `onopen` → установить `isConnected = true`
  - В `onUnmounted` → закрыть EventSource
- [ ] **Validation**: Composable успешно подключается к SSE endpoint
- [ ] **Validation**: При получении события вызывается callback `onUpdate` с корректными данными
- [ ] **Validation**: При размонтировании компонента соединение закрывается
- [ ] **Validation**: `isConnected` корректно отражает состояние соединения

---

### Task 2.2: Integrate SSE in HomePage

**Duration**: 45 минут

**Dependencies**: Task 2.1

- [ ] Обновить `frontend/src/pages/home/HomePage.vue`:
  - Импортировать `useStatsStream`
  - Вызвать `useStatsStream((stats) => { courseStore.updateCoursesStats(stats); })`
  - Удалить `update()` функцию и её `setTimeout` вызовы
  - Удалить вызов `update()` из `onMounted`
- [ ] Добавить метод `updateCoursesStats(stats)` в `useCourseStore` (если ещё не существует):
  - Принимает массив `{ courseId, stats }`
  - Обновляет `stats` для соответствующих курсов в store
- [ ] **Validation**: HomePage больше не использует `setTimeout` для опроса
- [ ] **Validation**: При монтировании HomePage устанавливается SSE соединение
- [ ] **Validation**: Статистика отображается корректно (initial load)
- [ ] **Validation**: Статистика обновляется в реальном времени при изменениях данных

---

### Task 2.3: Add Connection Status Indicator (Optional)

**Duration**: 30 минут

**Dependencies**: Task 2.2

- [ ] Добавить визуальный индикатор статуса SSE соединения в `HomePage.vue`:
  - Маленький badge/icon в углу страницы
  - Показывает "Подключено" (зелёный) или "Отключено" (красный)
  - Использует `isConnected` из `useStatsStream`
- [ ] Применить CSS для ненавязчивого отображения
- [ ] **Validation**: Индикатор показывает зелёный статус при активном соединении
- [ ] **Validation**: Индикатор показывает красный статус при разрыве соединения
- [ ] **Validation**: Индикатор не перекрывает основной контент
- [ ] **Validation**: Индикатор автоматически обновляется при reconnect

---

## Phase 3: Testing \u0026 Validation

### Task 3.1: Manual Functional Testing

**Duration**: 1 час

**Dependencies**: Task 2.2

- [ ] Провести ручное тестирование всех сценариев:
  1. **Initial Load**: открыть HomePage → проверить получение статистики
  2. **Training Flow**: завершить тренировку → проверить обновление статистики на главной
  3. **Card Operations**: добавить карточку → удалить карточку → проверить обновление
  4. **Course Operations**: изменить настройки курса → удалить курс → проверить обновление
  5. **Next Due Timer**: создать карточку с due через 30 секунд → подождать → проверить обновление
  6. **Reconnection**: закрыть/открыть HomePage → проверить переподключение
  7. **Multiple Tabs** (опционально): открыть HomePage в двух окнах → проверить обновление в обоих
- [ ] **Validation**: Все сценарии работают корректно
- [ ] **Validation**: Статистика обновляется мгновенно (\<100ms после операции)
- [ ] **Validation**: Планирование на due работает точно (±1 секунда)
- [ ] **Validation**: Переподключение происходит автоматически

---

### Task 3.2: Performance \u0026 Resource Check

**Duration**: 30 минут

**Dependencies**: Task 3.1

- [ ] Проверить использование памяти:
  - Открыть DevTools → Memory → сделать heap snapshot
  - Открыть/закрыть HomePage несколько раз
  - Проверить отсутствие утечек памяти (EventSource должен очищаться)
- [ ] Проверить сетевые запросы:
  - DevTools → Network → убедиться, что нет polling запросов
  - SSE соединение должно быть единственным постоянным запросом
- [ ] Проверить логи бэкенда:
  - Убедиться в корректном логировании connect/disconnect/broadcast
- [ ] **Validation**: Нет утечек памяти при открытии/закрытии HomePage
- [ ] **Validation**: SSE соединение корректно закрывается при unmount
- [ ] **Validation**: Нет избыточных HTTP запросов
- [ ] **Validation**: Логи показывают корректную работу scheduler

---

## Phase 4: Documentation \u0026 Cleanup

### Task 4.1: Update Walkthrough Documentation

**Duration**: 45 минут

**Dependencies**: Task 3.2

- [ ] Обновить `docs/Walkthrough.md`:
  - Добавить секцию "Real-Time Statistics Updates"
  - Описать SSE архитектуру и StatsScheduler
  - Объяснить, как система планирует обновления
  - Документировать формат SSE событий
- [ ] Обновить диаграммы архитектуры (если есть)
- [ ] **Validation**: Документация актуальна и понятна
- [ ] **Validation**: Описаны все ключевые компоненты
- [ ] **Validation**: Приведены примеры использования

---

### Task 4.2: Update Changelog

**Duration**: 15 минут

**Dependencies**: Task 4.1

- [ ] Обновить `docs/Changelog.md`:
  - Добавить запись о внедрении SSE для статистики
  - Указать, что polling через `setTimeout` удалён
  - Перечислить ключевые преимущества (мгновенные обновления, точное планирование)
- [ ] Обновить версию проекта (согласовать с мейнтейнером)
- [ ] **Validation**: Changelog содержит полное описание изменений
- [ ] **Validation**: Версия проекта обновлена корректно

---

### Task 4.3: Code Quality Check

**Duration**: 30 минут

**Dependencies**: Task 4.2

- [ ] Выполнить `npm run lint` в обоих workspace (frontend + backend)
- [ ] Исправить все linting ошибки
- [ ] Выполнить `npm run format` (если есть)
- [ ] Проверить отсутствие TODO/FIXME комментариев
- [ ] Убедиться, что все файлы следуют code style правилам проекта
- [ ] **Validation**: `npm run lint` проходит без ошибок
- [ ] **Validation**: Код отформатирован согласно Prettier
- [ ] **Validation**: Нет временных комментариев или debug логов
- [ ] **Validation**: Code style соответствует project.md

---

## Summary

**Total Estimated Duration**: ~10.5 часов

**Parallelization Opportunities**:

- Phase 1 (Backend) и Phase 2 (Frontend) могут выполняться параллельно после завершения Task 1.3
- Task 2.3 (Connection Status Indicator) опционален и может быть пропущен для MVP

**Critical Path**:
1.1 → 1.2 → 1.3 → 2.1 → 2.2 → 3.1 → 3.2 → 4.1 → 4.2 → 4.3

**Success Criteria**:

- ✅ Polling через `setTimeout` полностью удалён
- ✅ SSE соединение работает стабильно
- ✅ Статистика обновляется \<100ms после изменений
- ✅ Планирование на due работает с точностью ±1 секунда
- ✅ Все тесты пройдены
- ✅ Документация актуализирована
