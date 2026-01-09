# Design: Real-Time Statistics Updates via Server-Sent Events

## Architecture Overview

Система состоит из трёх ключевых компонентов:

1. **SSE Endpoint** — `GET /api/stats/stream` отдаёт поток событий
2. **Stats Scheduler** — планирует обновления на момент следующей due карточки
3. **Frontend Composable** — управляет подпиской и переподключением

```text
┌─────────────────┐
│   HomePage.vue  │
│  (EventSource)  │
└────────┬────────┘
         │ SSE Connection
         ▼
┌─────────────────────────────────────────┐
│         Backend (Express)               │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  GET /api/stats/stream           │  │
│  │  (SSE endpoint)                  │  │
│  └──────────┬───────────────────────┘  │
│             │                           │
│         Broadcasts                      │
│             ▼                           │
│  ┌──────────────────────────────────┐  │
│  │   StatsScheduler Service         │  │
│  │  • nextDueTimer: NodeJS.Timeout  │  │
│  │  • clients: Set<Response>        │  │
│  │  • scheduleNextUpdate()          │  │
│  │  • broadcastStats()              │  │
│  └──────────┬───────────────────────┘  │
│             │                           │
│       Queries DB                        │
│             ▼                           │
│  ┌──────────────────────────────────┐  │
│  │   cardRepository                 │  │
│  │  • getNextDueCard()              │  │
│  │  • getAllCoursesStats()          │  │
│  └──────────────────────────────────┘  │
│                                         │
│  Triggered by:                          │
│  • POST /api/training/review            │
│  • POST/PUT/DELETE /api/cards           │
│  • PUT /api/courses/:id                 │
│  • PUT /api/settings                    │
└─────────────────────────────────────────┘
```

## Component Design

### 1. SSE Endpoint (`/api/stats/stream`)

**Responsibilities:**

- Устанавливать SSE соединение с клиентом
- Регистрировать клиента в `StatsScheduler`
- Отправлять initial state (текущая статистика)
- Удалять клиента при disconnect

**Implementation:**

```typescript
// backend/src/routes/stats.ts
router.get("/stream", (req: Request, res: Response) => {
  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Add client
  statsScheduler.addClient(res);

  // Send initial stats
  const stats = await cardRepository.getAllCoursesStats();
  statsScheduler.sendToClient(res, stats);

  // Handle disconnect
  req.on("close", () => {
    statsScheduler.removeClient(res);
  });
});
```

**SSE Message Format:**

```text
event: stats-update
data: {"courses":[{"courseId":1,"stats":{"total":50,"newCards":5,"dueToday":12,"lastTraining":"2026-01-09T18:00:00.000Z"}}]}

```

### 2. Stats Scheduler Service

**Responsibilities:**

- Управлять списком подключённых клиентов
- Планировать следующее обновление на момент ближайшей due карточки
- Отправлять обновления всем клиентам при изменениях
- Корректно очищать таймеры при shutdown

**State:**

```typescript
class StatsScheduler {
  private clients: Set<Response> = new Set();
  private nextDueTimer: NodeJS.Timeout | null = null;
}
```

**Key Methods:**

```typescript
addClient(client: Response): void
  → Добавляет клиента в set
  → Если это первый клиент, запускает планирование

removeClient(client: Response): void
  → Удаляет клиента из set
  → Если клиентов не осталось, отменяет таймер

async scheduleNextUpdate(): Promise<void>
  1. Очистить текущий таймер (if exists)
  2. Запросить следующую due карточку:
     SELECT MIN(due) FROM cards WHERE due > NOW()
  3. Если карточка найдена:
     • Вычислить delay = due - now
     • Установить setTimeout на этот delay
     • В callback:
       - broadcastStats()
       - scheduleNextUpdate() (рекурсивно)
  4. Если карточек нет:
     • Установить fallback таймер на 1 час
     • В callback: scheduleNextUpdate()

async broadcastStats(): Promise<void>
  1. Запросить getAllCoursesStats()
  2. Сформировать SSE message
  3. Отправить всем клиентам через res.write()
  4. Если клиент недоступен → удалить из set

shutdown(): void
  → Очистить таймер
  → Закрыть все соединения
  → Очистить set клиентов
```

**Edge Cases:**

- **Нет due карточек**: fallback на 1 час, проверка повторно
- **Due в прошлом**: немедленно отправить обновление
- **Большая задержка (>24 часа)**: ограничить максимальный интервал до 1 часа для периодической валидации
- **Несколько клиентов**: broadcast всем, но проверять доступность перед отправкой

### 3. Card Repository Extension

**New Method:**

```typescript
async getNextDueCard(): Promise<{ due: string } | null>
```

**Implementation:**

```sql
SELECT due
FROM cards
WHERE due > datetime('now')
ORDER BY due ASC
LIMIT 1
```

**Return:**

- `{ due: "2026-01-09T20:30:00.000Z" }` если найдена
- `null` если нет карточек с due в будущем

### 4. Integration Points (Trigger broadcastStats)

После выполнения следующих операций необходимо вызвать `statsScheduler.broadcastStats()`:

**Training:**

- `POST /api/training/review` — после обновления прогресса

**Cards:**

- `POST /api/cards` — после добавления карточки
- `PUT /api/cards/:id` — после редактирования (сброс прогресса)
- `DELETE /api/cards/:id` — после удаления
- `POST /api/cards/batch` — после массового добавления
- `DELETE /api/cards/batch` — после массового удаления

**Courses:**

- `PUT /api/courses/:id` — после обновления настроек курса
- `DELETE /api/courses/:id` — после удаления курса

**Settings:**

- `PUT /api/settings/global` — после изменения глобальных настроек
- `PUT /api/settings/course/:id` — после изменения настроек курса

**Pattern:**

```typescript
// Example: training.ts
router.post('/review', async (req, res) => {
  try {
    // ... existing logic ...
    await updateProgressAfterReview(...);

    // NEW: Broadcast updated stats
    statsScheduler.broadcastStats();

    res.json({ success: true });
  } catch (error) {
    // ...
  }
});
```

### 5. Frontend Composable (`useStatsStream`)

**Responsibilities:**

- Устанавливать EventSource соединение
- Обрабатывать входящие события
- Переподключаться при ошибках
- Закрывать соединение при unmount

**API:**

```typescript
export function useStatsStream(onUpdate: (stats: CourseStats[]) => void) {
  const eventSource = ref<EventSource | null>(null);
  const isConnected = ref(false);

  const connect = () => {
    /* ... */
  };
  const disconnect = () => {
    /* ... */
  };

  onMounted(connect);
  onUnmounted(disconnect);

  return { isConnected, disconnect };
}
```

**Usage in HomePage:**

```vue
<script setup>
import { useStatsStream } from "@/shared/lib/useStatsStream";
import { useCourseStore } from "@/entities/course/model/useCourseStore";

const courseStore = useCourseStore();

const { isConnected } = useStatsStream((stats) => {
  courseStore.updateCoursesStats(stats);
});
</script>
```

### 6. Error Handling \u0026 Reconnection

**Browser Auto-Reconnect:**

- EventSource автоматически переподключается при разрыве соединения
- Delay: 3 секунды по умолчанию

**Manual Reconnect Logic:**

```typescript
eventSource.onerror = () => {
  isConnected.value = false;
  // EventSource will auto-reconnect
  // No manual intervention needed
};

eventSource.onopen = () => {
  isConnected.value = true;
};
```

**Server-Side Cleanup:**

```typescript
req.on("close", () => {
  statsScheduler.removeClient(res);
  console.log("[SSE] Client disconnected");
});
```

## Data Flow Examples

### Scenario 1: User Completes Training

```text
1. User submits review → POST /api/training/review
2. Backend updates dailyProgress in DB
3. Backend calls statsScheduler.broadcastStats()
4. StatsScheduler queries getAllCoursesStats()
5. StatsScheduler sends SSE event to all clients
6. Frontend receives event → updates store → UI re-renders
```

### Scenario 2: Next Due Card Becomes Available

```text
1. StatsScheduler has timer set for 2026-01-09 20:30:00
2. Timer fires at that moment
3. Callback executes:
   a. broadcastStats() → sends updated stats to clients
   b. scheduleNextUpdate() → queries next due card, sets new timer
4. Frontend receives event → UI shows updated due count
```

### Scenario 3: User Opens App (Initial Load)

```text
1. HomePage mounts → useStatsStream() connects
2. Backend receives SSE connection
3. Backend immediately sends current stats (initial state)
4. Frontend receives initial stats → populates store → renders UI
5. Connection remains open for future updates
```

## Performance Considerations

### Memory

- **Client Set**: пренебрежимо мало (1 объект Response ≈ несколько KB)
- **Timer**: 1 NodeJS.Timeout объект (negligible)

### CPU

- **Планирование**: O(1) — установка таймера
- **Запрос следующей due**: O(log N) — индексированный MIN query
- **Broadcast**: O(M) где M = количество клиентов (обычно 1)

### Database

- **getNextDueCard()**: индекс на `(due)` обеспечивает быструю выборку
- **getAllCoursesStats()**: уже существующий метод, используется в `/api/courses`

## Security Considerations

- **No Authentication**: для desktop app не критично (локальный сервер)
- **CORS**: уже настроен в `app.ts`
- **Rate Limiting**: не требуется (единственный клиент)

## Testing Strategy

### Manual Testing

1. **Initial Load**: открыть HomePage → проверить получение статистики
2. **Training Flow**: завершить тренировку → проверить обновление
3. **Card Operations**: добавить/удалить карточку → проверить обновление
4. **Next Due**: подождать, пока карточка станет due → проверить обновление
5. **Reconnection**: закрыть/открыть страницу → проверить переподключение

### Integration Tests (Optional)

```typescript
describe("SSE Stats Updates", () => {
  it("should send initial stats on connection");
  it("should broadcast stats after training review");
  it("should schedule update for next due card");
  it("should handle client disconnect gracefully");
});
```

## Migration Path

1. **Implement backend** — новый endpoint + scheduler
2. **Implement frontend** — composable + integration
3. **Test both systems** — убедиться, что оба работают
4. **Remove setTimeout** — удалить старый polling код
5. **Cleanup** — удалить неиспользуемые зависимости (если есть)

## Future Enhancements (Out of Scope)

- Отправка дельты данных вместо полного snapshot
- Использование SSE для других обновлений (notifications, settings sync)
- Поддержка множественных окон приложения
