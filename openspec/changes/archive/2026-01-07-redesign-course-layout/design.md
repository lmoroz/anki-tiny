# Design: Course Layout Redesign

## Architecture Overview

Редизайн затрагивает только **frontend presentation layer**, без изменений в API или database schema. Все необходимые данные уже доступны через существующие endpoints.

## Component Structure

```
CoursePage.vue (modified)
├── Course Info Section (left column on desktop, full width on mobile)
│   ├── Course header with name, description
│   ├── Statistics cards (total, new, review, due today)
│   ├── Training start button
│   └── QuickAddCard widget
│
└── Cards Section (right column on desktop, slide-out panel on mobile/tablet)
    ├── Section header
    ├── Create card button
    └── CardList
        └── CardItem (modified) × N
            ├── Front/Back content (existing)
            ├── State badge (existing)
            └── Enhanced statistics (new)
                ├── Stability
                ├── Difficulty
                ├── Reps
                ├── Lapses
                ├── Created date
                ├── Last review date
                └── Due date (existing, reformatted)
```

## Layout Breakpoints

### Desktop (≥1024px)

```
┌─────────────────────────────────────────────────┐
│  ┌─────────────────┐  ┌──────────────────────┐ │
│  │ Course Info     │  │ Cards List (compact) │ │
│  │ - Name          │  │ ┌──────────────────┐ │ │
│  │ - Description   │  │ │ CardItem 1       │ │ │
│  │ - Stats         │  │ └──────────────────┘ │ │
│  │ - Start button  │  │ ┌──────────────────┐ │ │
│  │                 │  │ │ CardItem 2       │ │ │
│  │ QuickAddCard    │  │ └──────────────────┘ │ │
│  │                 │  │ ...                  │ │
│  └─────────────────┘  └──────────────────────┘ │
│      60% width             40% width            │
└─────────────────────────────────────────────────┘
```

**Grid**: `grid-cols-[60%_40%]` или `grid-cols-[2fr_1fr]`
**Gap**: `gap-6` (24px)

### Tablet/Mobile (\u003c1024px)

```
┌───────────────────────────────────┐
│  Course Info (full width)         │
│  - Name                            │
│  - Description                     │
│  - Stats                           │        ┌─────────────────┐
│  - Start button                    │        │ Slide-out Panel │
│                                    │        │                 │
│  QuickAddCard                      │ ◄───── │ Cards List      │
│                                    │  FAB   │ ┌─────────────┐ │
│  [Floating Action Button]          │ opens  │ │ CardItem 1  │ │
│   "Показать карточки (N)"         │ panel  │ └─────────────┘ │
│                                    │        │ ...             │
└───────────────────────────────────┘        └─────────────────┘
                                              (slides from right)
```

**Panel**: Slide-in from right, width 85% tablet, 100% mobile viewport, backdrop blur overlay

## Card Statistics Display

### Current CardItem (front)

```
┌────────────────────────────────────┐
│ [State Badge]          [Edit] [Del]│
│                                    │
│ Question text...                   │
│                                    │
│ 📅 Due: Сегодня    🔄 Показать ответ│
└────────────────────────────────────┘
```

### Enhanced CardItem (front) - Option 1: Inline with icons

```
┌────────────────────────────────────┐
│ [State Badge]          [Edit] [Del]│
│                                    │
│ Question text...                   │
│                                    │
│ 💪 3.5  🎯 6.2  🔁 12  ❌ 2       │  ← stability, difficulty, reps, lapses
│ 📅 Следующее: Сегодня              │
│ 🕐 Последнее: 2 дня назад          │
│ ➕ Создано: 15 дек 2025            │
└────────────────────────────────────┘
```

### Enhanced CardItem (front) - Option 2: Compact grid

```
┌────────────────────────────────────┐
│ [State Badge]          [Edit] [Del]│
│                                    │
│ Question text...                   │
│                                    │
│ ┌────────┬────────┬────────┬──────┐│
│ │💪 3.5  │🎯 6.2  │🔁 12   │❌ 2  ││
│ └────────┴────────┴────────┴──────┘│
│ 📅 След: Сегодня  🕐 Посл: 2д назад│
│ ➕ Создано: 15 дек                 │
└────────────────────────────────────┘
```

**Выбор**: Option 1 (inline) для лучшей читаемости на малых размерах

### Statistics Icons Mapping

| Метрика     | Иконка Bootstrap Icons | Tooltip                  |
| ----------- | ---------------------- | ------------------------ |
| Stability   | `bi-graph-up`          | Стабильность запоминания |
| Difficulty  | `bi-speedometer2`      | Сложность карточки       |
| Reps        | `bi-arrow-repeat`      | Количество повторений    |
| Lapses      | `bi-x-circle`          | Количество ошибок        |
| Created at  | `bi-plus-circle`       | Дата создания            |
| Last review | `bi-clock-history`     | Последнее повторение     |
| Due date    | `bi-calendar3`         | Следующее повторение     |

## Responsive Behavior

### State Management

- **Desktop**: Cards section всегда видна (static в grid)
- **Mobile**:
  - Добавить `ref(false)` для `isCardsPanelOpen`
  - FAB с индикатором количества карточек
  - Panel с transition `transform: translateX(100%)` → `translateX(0)`

### Breakpoint Logic

```ts
import { useMediaQuery } from "@vueuse/core";

const isDesktop = useMediaQuery("(min-width: 1024px)");
const showCardsInline = computed(() => isDesktop.value);
const showCardsPanel = computed(() => !isDesktop.value && isCardsPanelOpen.value);
```

## Styling Strategy

### Desktop Grid

```css
.course-page-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

@media (min-width: 1024px) {
  .course-page-grid {
    grid-template-columns: 2fr 1fr;
  }
}
```

### Mobile Panel

```css
.cards-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 85%;
  max-width: 400px;
  background: var(--color-bg-primary);
  transform: translateX(100%);
  transition: transform 0.3s ease;
  z-index: 1000;
  overflow-y: auto;
}

.cards-panel.open {
  transform: translateX(0);
}

.panel-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 999;
}
```

### Compact Card Mode (desktop right column)

```css
.card-item.compact {
  min-height: 100px; /* reduced from 140px */
  font-size: 14px; /* smaller text */
}

.card-item.compact .card-text {
  -webkit-line-clamp: 2; /* reduced from 3 */
}
```

## Data Flow

### Existing (no changes needed)

```
CardStore.fetchCardsByCourse(courseId)
  ↓
Backend API: GET /api/courses/:id/cards
  ↓
Returns Card[] with all FSRS fields
  ↓
CardList receives cards prop
  ↓
CardItem renders each card
```

### Enhanced (only presentational changes)

```
CardItem.vue
  ↓
Access card.stability, card.difficulty, etc. (already in data)
  ↓
Format and display with icons
  ↓
No API calls needed
```

## Accessibility Considerations

- **Tooltips** на иконки статистики для пояснения метрик
- **ARIA labels** для FAB и slide-out panel
- **Keyboard navigation** для закрытия панели (Escape)
- **Focus trap** внутри открытой панели
- **Color contrast** для всех текстовых элементов статистики

## Performance Considerations

- **No additional data fetching** — все данные уже загружены
- **CSS transitions only** — hardware-accelerated
- **Virtual scrolling** не требуется (количество карточек обычно \u003c100)
- **Lazy rendering** для slide-out панели (v-if, не v-show)

## Testing Strategy

### Manual Testing

1. **Responsive layout**:
   - Тестирование на 1920x1080 (desktop, две колонки)
   - Тестирование на 768x1024 (tablet, панель)
   - Тестирование на 375x667 (mobile, панель)

2. **Statistics display**:
   - Проверка всех 8 метрик отображаются корректно
   - Tooltips работают при hover
   - Форматирование дат читабельное

3. **Panel functionality** (mobile):
   - FAB открывает панель
   - Backdrop закрывает панель
   - Escape закрывает панель
   - Скролл работает внутри панели

### Regression Testing

- Существующий функционал редактирования/удаления карточек работает
- QuickAddCard корректно добавляет карточки
- State badges отображаются правильно

## Open Questions

1. **RESOLVED (in proposal)**: Какой breakpoint использовать? → 1024px
2. **RESOLVED (in design)**: Формат статистики — inline или grid? → Inline (Option 1)
3. **RESOLVED**: Нужны ли tooltips для всех метрик или только для stability/difficulty? → для всех, чтобы новые пользователи понимали значение
