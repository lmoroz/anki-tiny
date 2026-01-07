# Tasks: Batch Card Delete

## Backend Tasks

### 1. API Endpoint for Batch Delete

- [x] 1.1 Создать endpoint `DELETE /api/courses/:courseId/cards/batch` для массового удаления
- [x] 1.2 Добавить Zod схему валидации для массива ID карточек
- [x] 1.3 Добавить метод `deleteCardsBatch(ids: number[], courseId: number)` в `cardRepository`
- [x] 1.4 Реализовать транзакционное удаление (все или ничего)
- [x] 1.5 Возвращать количество удалённых карточек в ответе

### 2. API Endpoint for Delete All Cards

- [x] 2.1 Создать endpoint `DELETE /api/courses/:courseId/cards` для удаления всех карточек курса
- [x] 2.2 Добавить метод `deleteAllCards(courseId: number)` в `cardRepository`
- [x] 2.3 Возвращать количество удалённых карточек в ответе

---

## Frontend Tasks

### 3. UI Components for Selection Mode

- [x] 3.1 Создать компонент `CardCheckbox.vue` с кастомным дизайном чекбокса
- [x] 3.2 Добавить prop `selectionMode` в `CardItem.vue`
- [x] 3.3 Добавить prop `selected` в `CardItem.vue` для отображения выбранного состояния
- [x] 3.4 Применить `opacity: 0.6` к выбранным карточкам
- [x] 3.5 Отключить переворачивание карточки при клике в `selectionMode`
- [x] 3.6 Добавить чекбокс в верхний правый угол карточки (вместо кнопок Edit/Delete)

### 4. CoursePage Selection Mode

- [x] 4.1 Добавить состояние `isSelectionMode` и `selectedCardIds` в `CoursePage.vue`
- [x] 4.2 Добавить кнопку "Выбрать карточки" в шапку списка карточек
- [x] 4.3 При входе в режим выбора: скрыть кнопки Edit/Delete, показать чекбоксы
- [x] 4.4 Добавить кнопку "Удалить выбранные (N)" (активна только если N > 0)
- [x] 4.5 Добавить кнопку "Отменить" для выхода из режима выбора
- [x] 4.6 Реализовать обработчик `handleToggleCardSelection(cardId)`
- [x] 4.7 Реализовать обработчик `handleBatchDelete()` с подтверждением

### 5. Delete All Cards Feature

- [x] 5.1 Добавить кнопку "Удалить все карточки" в шапку списка карточек (с иконкой `bi-trash`)
- [x] 5.2 Добавить модальное окно подтверждения с предупреждением
- [x] 5.3 Реализовать обработчик `handleDeleteAllCards()` в `CoursePage.vue`
- [x] 5.4 Добавить метод `deleteAllCards(courseId)` в `useCardStore`

### 6. API Client Integration

- [x] 6.1 Добавить метод `deleteBatch(ids: number[])` в `cardsApi`
- [x] 6.2 Добавить метод `deleteAll(courseId: number)` в `cardsApi`
- [x] 6.3 Добавить метод `deleteBatchCards(ids, courseId)` в `useCardStore`
- [x] 6.4 Обновлять локальное состояние и статистику после массового удаления

---

## Validation Tasks

### 7. Testing

- [x] 7.1 Протестировать выбор одной карточки
- [x] 7.2 Протестировать выбор нескольких карточек
- [x] 7.3 Протестировать удаление выбранных карточек
- [x] 7.4 Протестировать удаление всех карточек курса
- [x] 7.5 Проверить обновление статистики курса после удаления
- [x] 7.6 Проверить работу на мобильных устройствах (slide-out panel)
- [x] 7.7 Проверить транзакционность backend (rollback при ошибке)

### 8. UI/UX Polish

- [x] 8.1 Убедиться, что чекбоксы красиво выглядят в light/dark темах
- [x] 8.2 Проверить анимацию opacity при выборе карточки
- [x] 8.3 Проверить доступность (ARIA labels для чекбоксов)
- [x] 8.4 Проверить корректность подсчёта "Удалить выбранные (N)"
