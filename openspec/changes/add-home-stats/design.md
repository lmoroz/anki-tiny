# Design: Add Aggregated Training Statistics to Home Page

## Architecture

Этот change затрагивает:

1. **Frontend**:
   - `HomePage.vue` — изменение layout на двухколоночный
   - `GlobalStats.vue` (NEW) — компонент для отображения агрегированной статистики
   - `useStatsStore.js` (NEW) — Pinia store для управления глобальной статистикой

2. **Backend**:
   - Использование существующего endpoint: `GET /api/training/stats`
   - Дополнительный endpoint для получения общего количества новых карточек: `GET /api/stats/global`

3. **Data Flow**:
   ```
   HomePage.vue → useStatsStore → GET /api/training/stats → limitService.getDailyStats()
                → useStatsStore → GET /api/stats/global → cardRepository.getGlobalNewCardsCount()
   ```

---

## Component Design

### GlobalStats.vue

**Purpose**: Отображение агрегированной статистики тренировок.

**Props**:
- Нет (использует `useStatsStore`)

**Data**:
```typescript
interface GlobalStatsData {
  totalNewCards: number;           // Общее кол-во новых карточек по всем курсам
  studiedToday: number;            // newCardsStudied + reviewsCompleted
  remainingToday: number;          // Осталось на сегодня (с учётом лимитов)
  dailyNewLimit: number;           // Глобальный лимит новых карточек
  trainingsToday: number;          // Количество тренировок за день
  loading: boolean;
}
```

**UI Structure**:
```vue
<Card padding="lg">
  <h2>Статистика</h2>
  
  <!-- Новые карточки -->
  <StatItem 
    icon="bi-bookmark-plus" 
    label="Новых карточек (всего)" 
    :value="totalNewCards" 
  />
  
  <!-- Изучено/повторено сегодня -->
  <StatItem 
    icon="bi-check-circle" 
    label="Изучено/повторено сегодня" 
    :value="studiedToday" 
  />
  
  <!-- Осталось на сегодня -->
  <StatItem 
    icon="bi-hourglass-split" 
    label="Осталось на сегодня" 
    :value="remainingToday" 
  />
  
  <!-- Дневной лимит -->
  <StatItem 
    icon="bi-speedometer" 
    label="Дневной лимит новых карточек" 
    :value="dailyNewLimit" 
  />
  
  <!-- Количество тренировок -->
  <StatItem 
    icon="bi-lightning-charge" 
    label="Тренировок сегодня" 
    :value="trainingsToday" 
  />
  
  <!-- Placeholder для графика -->
  <div class="chart-placeholder">
    <p>График статистики (скоро)</p>
  </div>
</Card>
```

**Styling**:
- Vertical layout с gap между элементами
- Каждый `StatItem` — inline layout: icon + label + value
- Icons: Bootstrap Icons (24px, primary color)
- Values: bold, large font (24px)
- Card использует существующий `Card.vue` компонент

---

### HomePage.vue Layout

**Desktop (≥1024px)**:
```vue
<div class="home-container">
  <header class="page-header">...</header>
  
  <div class="home-grid">
    <!-- Левая колонка: Курсы -->
    <div class="courses-column">
      <CourseList ... />
    </div>
    
    <!-- Правая колонка: Статистика -->
    <div class="stats-column">
      <GlobalStats />
    </div>
  </div>
</div>
```

**Mobile (< 1024px)**:
```vue
<div class="home-container">
  <header class="page-header">...</header>
  
  <!-- Статистика отображается выше списка курсов -->
  <GlobalStats />
  
  <CourseList ... />
</div>
```

**CSS**:
```css
.home-grid {
  display: grid;
  grid-template-columns: 1fr 1fr; /* 50% / 50% */
  gap: 24px;
}

@media (max-width: 1024px) {
  .home-grid {
    grid-template-columns: 1fr; /* Single column */
  }
  
  .stats-column {
    order: -1; /* Статистика выше курсов */
  }
}
```

---

## Data Layer

### useStatsStore (Pinia)

**State**:
```typescript
{
  totalNewCards: number;
  studiedToday: number;
  remainingToday: number;
  dailyNewLimit: number;
  trainingsToday: number;
  loading: boolean;
  error: string | null;
}
```

**Actions**:
```typescript
async fetchGlobalStats() {
  this.loading = true;
  
  try {
    // 1. Получить статистику за день
    const dailyStats = await api.get('/api/training/stats');
    
    // 2. Получить общее количество новых карточек
    const globalStats = await api.get('/api/stats/global');
    
    // 3. Рассчитать метрики
    this.totalNewCards = globalStats.totalNewCards;
    this.studiedToday = dailyStats.global.newCardsStudied + dailyStats.global.reviewsCompleted;
    this.trainingsToday = this.studiedToday; // Синоним
    
    // Remaining = globalNewRemaining + globalReviewsRemaining
    this.remainingToday = 
      dailyStats.global.limits.globalNewCardsPerDay - dailyStats.global.newCardsStudied +
      dailyStats.global.limits.globalMaxReviewsPerDay - dailyStats.global.reviewsCompleted;
    
    this.dailyNewLimit = dailyStats.global.limits.globalNewCardsPerDay;
  } catch (error) {
    this.error = 'Failed to load statistics';
  } finally {
    this.loading = false;
  }
}
```

---

## Backend Changes

### New Endpoint: GET /api/stats/global

**Purpose**: Получить общее количество новых карточек по всем курсам.

**Response**:
```typescript
{
  totalNewCards: number; // Сумма карточек со state = NEW по всем курсам
}
```

**Implementation**:
```typescript
// routes/stats.ts (NEW file)
router.get('/stats/global', async (req: Request, res: Response) => {
  try {
    const totalNewCards = await cardRepository.getGlobalNewCardsCount();
    res.json({ totalNewCards });
  } catch (error) {
    console.error('Error fetching global stats:', error);
    res.status(500).json({ error: 'Failed to fetch global stats' });
  }
});
```

**cardRepository.getGlobalNewCardsCount()**:
```typescript
async getGlobalNewCardsCount(): Promise<number> {
  const result = await db
    .selectFrom('cards')
    .select(({ fn }) => [fn.count('id').as('count')])
    .where('state', '=', CardState.New)
    .executeTakeFirst();
  
  return Number(result?.count ?? 0);
}
```

---

## Key Decisions

### 1. Почему отдельный endpoint `/api/stats/global`?

**Альтернатива**: Добавить `totalNewCards` в существующий `/api/training/stats`.

**Решение**: Отдельный endpoint для семантической чистоты. Endpoint `/api/training/stats` фокусируется на **дневной** статистике (прогресс за день), а `/api/stats/global` — на **общих** метриках приложения (новые карточки по всем курсам).

В будущем `/api/stats/global` может быть расширен другими метриками (total courses, total cards, etc.).

### 2. Почему 50%/50% вместо 60%/40%?

**Решение**: Равные колонки упрощают визуальное восприятие и дают достаточно места для будущего графика статистики. Если пользователь хочет больше места для списка курсов, это можно сделать настраиваемым (out of scope).

### 3. Где хранить useStatsStore?

**Решение**: `frontend/src/entities/stats/model/useStatsStore.js` (новая entity).

**Rationale**: Статистика — отдельная бизнес-сущность, не относится к courses или cards напрямую.

---

## Migration Path

1. Создать новый endpoint `/api/stats/global` (backend)
2. Добавить метод `getGlobalNewCardsCount()` в `cardRepository`
3. Создать `useStatsStore` (frontend)
4. Создать компонент `GlobalStats.vue`
5. Изменить layout `HomePage.vue` на двухколоночный
6. Добавить адаптивность для mobile
7. Написать spec delta для `home-stats`

---

## Testing Strategy

### Manual Testing:
- [ ] Статистика отображается корректно на desktop (1920x1080)
- [ ] Layout переключается на single column на mobile (375x667)
- [ ] Статистика обновляется после тренировки
- [ ] Loading state отображается при загрузке
- [ ] Error state отображается при ошибке API

### Integration Testing:
- [ ] `GET /api/stats/global` возвращает корректное количество новых карточек
- [ ] `useStatsStore.fetchGlobalStats()` корректно рассчитывает метрики

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Перегрузка главной страницы информацией | Минималистичный дизайн, фокус на ключевых метриках |
| Дополнительная загрузка API при открытии HomePage | Кэширование в Pinia store, refresh только при необходимости |
| Несоответствие метрик между курсами и глобальной статистикой | Использовать те же источники данных (progressRepository, cardRepository) |

---

## Future Enhancements (Out of Scope)

- График статистики тренировок по дням (30 дней)
- Фильтрация курсов по статистике
- Экспорт статистики в CSV/JSON
- Настройка видимости метрик (показать/скрыть)
