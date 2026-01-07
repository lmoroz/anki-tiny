# Design: Batch Card Delete

## Architecture

### Overview

Функция массового удаления карточек состоит из трёх основных компонентов:

1. **Backend API**: Два новых endpoint для массового удаления и удаления всех карточек
2. **Frontend UI**: Режим выбора карточек с чекбоксами и кнопки управления
3. **State Management**: Расширение `useCardStore` для поддержки массовых операций

---

## Backend Design

### API Endpoints

#### 1. DELETE /api/courses/:courseId/cards/batch

**Purpose**: Удалить несколько карточек одной транзакцией

**Request Body**:

```typescript
{
  "cardIds": [1, 2, 3, 45]  // массив ID карточек для удаления
}
```

**Validation Schema** (Zod):

```typescript
const BatchDeleteSchema = z.object({
  cardIds: z.array(z.number().int().positive()).min(1).max(100)
});
```

**Response**:

```json
{
  "success": true,
  "deletedCount": 4
}
```

**Error Cases**:

- `400 Bad Request`: Невалидный courseId или пустой массив cardIds
- `404 Not Found`: Курс не найден
- `500 Internal Server Error`: Ошибка при удалении

**Implementation**:

- Проверить, что все карточки принадлежат указанному курсу
- Использовать SQL транзакцию для атомарного удаления
- При ошибке удаления любой карточки — откатить всю транзакцию

---

#### 2. DELETE /api/courses/:courseId/cards

**Purpose**: Удалить все карточки курса

**Request Body**: нет

**Response**:

```json
{
  "success": true,
  "deletedCount": 152
}
```

**Error Cases**:

- `400 Bad Request`: Невалидный courseId
- `404 Not Found`: Курс не найден
- `500 Internal Server Error`: Ошибка при удалении

**Implementation**:

- Использовать SQL `DELETE FROM cards WHERE courseId = ?`
- Возвращать количество удалённых строк через `changes` в SQLite

---

### Repository Changes

**File**: `backend/src/services/repositories/cardRepository.ts`

**New Methods**:

```typescript
async deleteCardsBatch(ids: number[], courseId: number): Promise<number> {
  // 1. Проверить, что все ID принадлежат courseId
  // 2. Удалить в транзакции
  // 3. Вернуть количество удалённых карточек
}

async deleteAllCards(courseId: number): Promise<number> {
  // 1. Удалить все карточки курса
  // 2. Вернуть количество удалённых карточек
}
```

---

## Frontend Design

### UI Components

#### 1. CardCheckbox.vue

**Location**: `frontend/src/shared/ui/CardCheckbox.vue`

**Props**:

```typescript
{
  checked: Boolean,
  disabled: Boolean
}
```

**Design**:

- Кастомный чекбокс (не нативный `<input type="checkbox">`)
- Размер: 20x20px
- Border: 2px solid, цвет из CSS переменных
- Checked state: фон с градиентом, иконка галочки (Bootstrap Icons `bi-check`)
- Smooth transition анимация (200ms)
- Dark theme совместимость

**Styling**:

```css
.checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-border);
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.checkbox.checked {
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-color: var(--color-primary);
}

.checkbox.checked i {
  color: white;
  font-size: 14px;
}
```

---

#### 2. CardItem.vue Changes

**New Props**:

```typescript
{
  selectionMode: Boolean,  // режим выбора активен
  selected: Boolean        // карточка выбрана
}
```

**Behavior**:

- Если `selectionMode === true`:
  - Скрыть кнопки Edit и Delete
  - Показать чекбокс в правом верхнем углу (где были кнопки)
  - При клике на карточку — НЕ переворачивать, а переключать selected
  - Emit `@toggle-select` вместо переворота
- Если `selected === true`:
  - Применить класс `.selected` с `opacity: 0.6`
  - Чекбокс в состоянии checked

**Template Changes**:

```vue
<!-- Card Header -->
<div class="card-header">
  <span class="state-badge">...</span>
  
  <!-- Selection Mode: Show Checkbox -->
  <CardCheckbox 
    v-if="selectionMode"
    :checked="selected"
    @click.stop="emit('toggle-select')"
  />
  
  <!-- Normal Mode: Show Edit/Delete -->
  <div v-else class="card-actions">
    <button @click="handleEdit">...</button>
    <button @click="handleDelete">...</button>
  </div>
</div>
```

**Event Handler**:

```typescript
const handleCardClick = () => {
  if (props.selectionMode) {
    emit('toggle-select');
  }
  else {
    toggleFlip();
  }
};
```

---

#### 3. CoursePage.vue Changes

**New State**:

```typescript
const isSelectionMode = ref(false);
const selectedCardIds = ref(new Set());
```

**New UI Elements**:

1. **Button "Выбрать карточки"** (в шапке списка карточек, Desktop and Mobile)
   - Icon: `bi-check-square`
   - При клике: `isSelectionMode.value = true`

2. **Button "Удалить выбранные (N)"** (показывается только в режиме выбора)
   - Icon: `bi-trash`
   - Variant: `danger`
   - Disabled: `selectedCardIds.size === 0`
   - При клике: `handleBatchDelete()`

3. **Button "Отменить"** (показывается только в режиме выбора)
   - Icon: `bi-x`
   - Variant: `ghost`
   - При клике: `exitSelectionMode()`

4. **Button "Удалить все карточки"** (в меню действий курса)
   - Icon: `bi-trash3`
   - Variant: `danger`
   - При клике: `handleDeleteAllCards()`

**Handlers**:

```typescript
const handleToggleCardSelection = (cardId: string) => {
  if (selectedCardIds.value.has(cardId)) {
    selectedCardIds.value.delete(cardId);
  }
  else {
    selectedCardIds.value.add(cardId);
  }
};

const handleBatchDelete = async () => {
  const count = selectedCardIds.value.size;
  const confirmed = confirm(
    `Удалить выбранные карточки (${count})?`
  );
  
  if (confirmed) {
    await cardStore.deleteBatchCards(Array.from(selectedCardIds.value), courseId);
    exitSelectionMode();
  }
};

const handleDeleteAllCards = async () => {
  const count = cards.value.length;
  const confirmed = confirm(
    `Вы уверены, что хотите удалить ВСЕ карточки курса (${count})?\\n\\nЭто действие необратимо!`
  );
  
  if (confirmed) {
    await cardStore.deleteAllCards(courseId);
  }
};

const exitSelectionMode = () => {
  isSelectionMode.value = false;
  selectedCardIds.value.clear();
};
```

**Layout**:

В Desktop режиме кнопки управления добавляются в шапку правой колонки (где "Cards" и "Create Card"):

```vue
<div class="flex items-center justify-between mb-4">
  <h2>Cards</h2>
  <div class="flex gap-2">
    <Button v-if="!isSelectionMode" @click="isSelectionMode = true">
      <i class="bi bi-check-square" /> Выбрать карточки
    </Button>
    <template v-else>
      <Button variant="danger" :disabled="selectedCardIds.size === 0" @click="handleBatchDelete">
        <i class="bi bi-trash" /> Удалить выбранные ({{ selectedCardIds.size }})
      </Button>
      <Button variant="ghost" @click="exitSelectionMode">
        <i class="bi bi-x" /> Отменить
      </Button>
    </template>
    <Button @click="handleCreateCard">Create Card</Button>
  </div>
</div>
```

В Mobile panel аналогично добавляются в шапку панели.

---

### API Client

**File**: `frontend/src/shared/api/cards.js`

**New Methods**:

```javascript
export const cardsApi = {
  // ...existing methods
  
  deleteBatch(courseId, cardIds) {
    return apiClient.delete(`/courses/${courseId}/cards/batch`, {
      data: { cardIds }
    });
  },
  
  deleteAll(courseId) {
    return apiClient.delete(`/courses/${courseId}/cards`);
  }
};
```

---

### State Management

**File**: `frontend/src/entities/card/model/useCardStore.js`

**New Methods**:

```javascript
async function deleteBatchCards(ids, courseId) {
  loading.value = true;
  error.value = null;
  try {
    const response = await cardsApi.deleteBatch(courseId, ids);
    
    // Удаляем карточки из локального состояния
    if (cardsByCourse.value[courseId]) {
      cardsByCourse.value[courseId] = cardsByCourse.value[courseId]
        .filter(c => !ids.includes(c.id));
    }
    
    // Обновляем статистику
    await fetchCourseStats(courseId);
    
    return response.data.deletedCount;
  } catch (err) {
    error.value = err.response?.data?.error || 'Ошибка массового удаления';
    throw err;
  } finally {
    loading.value = false;
  }
}

async function deleteAllCards(courseId) {
  loading.value = true;
  error.value = null;
  try {
    const response = await cardsApi.deleteAll(courseId);
    
    // Очищаем локальное состояние
    cardsByCourse.value[courseId] = [];
    
    // Обновляем статистику
    await fetchCourseStats(courseId);
    
    return response.data.deletedCount;
  } catch (err) {
    error.value = err.response?.data?.error || 'Ошибка удаления карточек';
    throw err;
  } finally {
    loading.value = false;
  }
}
```

---

## UX Considerations

### Visual Feedback

1. **Selection State**:
   - Выбранная карточка: `opacity: 0.6` + чекбокс checked
   - Hover на карточке в режиме выбора: курсор `pointer` (как обычно)

2. **Transitions**:
   - Opacity transition: `200ms ease`
   - Checkbox animation: `200ms ease`

3. **Button States**:
   - "Удалить выбранные (N)" disabled если N === 0
   - Показывать количество выбранных карточек в тексте кнопки

### Accessibility

1. **Checkbox**:
   - ARIA label: `aria-label="Выбрать карточку"`
   - Keyboard navigation: Space для toggle

2. **Selection Mode**:
   - Сообщить screen reader о входе/выходе из режима выбора
   - ARIA live region для количества выбранных карточек

### Mobile Considerations

- В Mobile panel (slide-out) кнопки управления размещаются в шапке панели
- Чекбоксы достаточно большие для тапа (20x20px с padding)
- Подтверждение удаления через стандартный `confirm()` (работает на мобильных)

---

## Error Handling

### Backend

1. **Partial Failure Protection**:
   - Использовать SQL транзакции для batch delete
   - Rollback при ошибке удаления любой карточки
   - Логировать ошибки через Pino

2. **Validation**:
   - Проверять принадлежность карточек курсу
   - Лимит на количество карточек в batch (max 100)

### Frontend

1. **Network Errors**:
   - Показывать toast notification при ошибке
   - Не очищать `selectedCardIds` при ошибке (позволить повторить)

2. **Optimistic Updates**:
   - НЕ использовать optimistic updates для удаления
   - Ждать подтверждения от сервера
   - Показывать loading state во время удаления

---

## Performance

### Backend

- **Batch Delete**: Использовать `DELETE FROM cards WHERE id IN (?, ?, ...)` вместо N отдельных запросов
- **Delete All**: Один SQL запрос `DELETE FROM cards WHERE courseId = ?`

### Frontend

- **Set для selectedCardIds**: O(1) для add/delete/has операций
- **Minimal Re-renders**: Передавать `selectionMode` и `selected` как props, избегать computed

---

## Security

- **Authorization**: Проверять, что пользователь имеет доступ к курсу (если будет добавлена авторизация)
- **Validation**: Валидировать courseId и cardIds на backend
- **SQL Injection**: Использовать prepared statements (уже обеспечено Kysely)

---

## Future Enhancements (Out of Scope)

- Undo функция (восстановление удалённых карточек)
- Bulk export перед удалением
- Архивирование вместо удаления
- Keyboard shortcuts (Ctrl+A для выбора всех)
