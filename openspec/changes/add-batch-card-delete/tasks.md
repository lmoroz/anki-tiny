# Tasks: Batch Card Delete

## Backend Tasks

### 1. API Endpoint for Batch Delete

- [ ] 1.1 Создать endpoint `DELETE /api/courses/:courseId/cards/batch` для массового удаления
- [ ] 1.2 Добавить Zod схему валидации для массива ID карточек
- [ ] 1.3 Добавить метод `deleteCardsBatch(ids: number[], courseId: number)` в `cardRepository`
- [ ] 1.4 Реализовать транзакционное удаление (все или ничего)
- [ ] 1.5 Возвращать количество удалённых карточек в ответе

### 2. API Endpoint for Delete All Cards

- [ ] 2.1 Создать endpoint `DELETE /api/courses/:courseId/cards` для удаления всех карточек курса
- [ ] 2.2 Добавить метод `deleteAllCards(courseId: number)` в `cardRepository`
- [ ] 2.3 Возвращать количество удалённых карточек в ответе

---

## Frontend Tasks

### 3. UI Components for Selection Mode

- [ ] 3.1 Создать компонент `CardCheckbox.vue` с кастомным дизайном чекбокса
- [ ] 3.2 Добавить prop `selectionMode` в `CardItem.vue`
- [ ] 3.3 Добавить prop `selected` в `CardItem.vue` для отображения выбранного состояния
- [ ] 3.4 Применить `opacity: 0.6` к выбранным карточкам
- [ ] 3.5 Отключить переворачивание карточки при клике в `selectionMode`
- [ ] 3.6 Добавить чекбокс в верхний правый угол карточки (вместо кнопок Edit/Delete)

### 4. CoursePage Selection Mode

- [ ] 4.1 Добавить состояние `isSelectionMode` и `selectedCardIds` в `CoursePage.vue`
- [ ] 4.2 Добавить кнопку "Выбрать карточки" в шапку списка карточек
- [ ] 4.3 При входе в режим выбора: скрыть кнопки Edit/Delete, показать чекбоксы
- [ ] 4.4 Добавить кнопку "Удалить выбранные (N)" (активна только если N > 0)
- [ ] 4.5 Добавить кнопку "Отменить" для выхода из режима выбора
- [ ] 4.6 Реализовать обработчик `handleToggleCardSelection(cardId)`
- [ ] 4.7 Реализовать обработчик `handleBatchDelete()` с подтверждением

### 5. Delete All Cards Feature

- [ ] 5.1 Добавить кнопку "Удалить все карточки" в шапку списка карточек (с иконкой `bi-trash`)
- [ ] 5.2 Добавить модальное окно подтверждения с предупреждением
- [ ] 5.3 Реализовать обработчик `handleDeleteAllCards()` в `CoursePage.vue`
- [ ] 5.4 Добавить метод `deleteAllCards(courseId)` в `useCardStore`

### 6. API Client Integration

- [ ] 6.1 Добавить метод `deleteBatch(ids: number[])` в `cardsApi`
- [ ] 6.2 Добавить метод `deleteAll(courseId: number)` в `cardsApi`
- [ ] 6.3 Добавить метод `deleteBatchCards(ids, courseId)` в `useCardStore`
- [ ] 6.4 Обновлять локальное состояние и статистику после массового удаления

---

## Validation Tasks

### 7. Testing

- [ ] 7.1 Протестировать выбор одной карточки
- [ ] 7.2 Протестировать выбор нескольких карточек
- [ ] 7.3 Протестировать удаление выбранных карточек
- [ ] 7.4 Протестировать удаление всех карточек курса
- [ ] 7.5 Проверить обновление статистики курса после удаления
- [ ] 7.6 Проверить работу на мобильных устройствах (slide-out panel)
- [ ] 7.7 Проверить транзакционность backend (rollback при ошибке)

### 8. UI/UX Polish

- [ ] 8.1 Убедиться, что чекбоксы красиво выглядят в light/dark темах
- [ ] 8.2 Проверить анимацию opacity при выборе карточки
- [ ] 8.3 Проверить доступность (ARIA labels для чекбоксов)
- [ ] 8.4 Проверить корректность подсчёта "Удалить выбранные (N)"
