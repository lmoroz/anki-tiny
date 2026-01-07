# Tasks: Card Edit Visual Feedback

## Overview

Этот документ содержит упорядоченный список задач для добавления визуальной обратной связи при
редактировании и добавлении карточек.

---

## Task List

### 1. Backend: Add Reset Progress Support to Card Update Endpoint

**Description**: Расширить endpoint `PUT /api/courses/:courseId/cards/:cardId` для поддержки сброса прогресса
карточки.

**Dependencies**: None

**Files**:

- `backend/src/routes/cards.ts`

**Steps**:

1. Открыть `backend/src/routes/cards.ts`
2. Найти endpoint `PUT /courses/:courseId/cards/:cardId`
3. Добавить извлечение `resetProgress` из `req.body`:
   ```typescript
   const { front, back, resetProgress } = req.body
   ```
4. Если `resetProgress === true`, добавить в `updates`:
   ```typescript
   if (resetProgress) {
     Object.assign(updates, {
       state: CardState.New,
       stability: null,
       difficulty: null,
       reps: 0,
       lapses: 0,
       lastReview: null,
       due: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
       interval: null,
     })
   }
   ```
5. Сохранить изменения

**Validation**:

- [x] Код компилируется без ошибок TypeScript
- [x] Тестирование через API: `PUT /api/courses/1/cards/123` с
  `{ front: "test", back: "test", resetProgress: true }` сбрасывает прогресс
- [x] Response возвращает обновлённую карточку с `state = New`, `reps = 0`, etc.

**Estimated Time**: 15 минут

---

### 2. Frontend: Add Scroll and Bounce Animation to CardList

**Description**: Добавить метод `scrollToCardWithBounce()` в `CardList.vue` для прокрутки к карточке с
анимацией.

**Dependencies**: None

**Files**:

- `frontend/src/widgets/card-list/CardList.vue`

**Steps**:

1. Открыть `CardList.vue`
2. Добавить метод:
   ```typescript
   const scrollToCardWithBounce = (cardId: string) => {
     const cardElement = scrollContainer.value?.querySelector(`[data-card-id="${cardId}"]`)
     if (!cardElement) {
       console.warn(`Card with id ${cardId} not found in list`)
       return
     }
     cardElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
     setTimeout(() => {
       cardElement.classList.add('anim-bounce-in-bck')
       setTimeout(() => {
         cardElement.classList.remove('anim-bounce-in-bck')
       }, 1000)
     }, 500)
   }
   ```
3. Экспортировать метод через `defineExpose({ scrollToCardWithBounce })`
4. В template добавить `data-card-id` атрибут на `CardItem`:
   ```vue
   <CardItem :data-card-id="card.id" ... />
   ```
5. Добавить CSS анимацию в `<style scoped>`:
   ```css
   .anim-bounce-in-bck {
     animation-duration: 2s;
     animation-name: bounce-in-bck;
   }
   @keyframes bounce-in-bck {
     0% { opacity: 0; animation-timing-function: ease-in; transform: scale(7); }
     38% { opacity: 1; animation-timing-function: ease-out; transform: scale(1); }
     55% { animation-timing-function: ease-in; transform: scale(1.5); }
     72%, 89%, to { animation-timing-function: ease-out; transform: scale(1); }
     81% { animation-timing-function: ease-in; transform: scale(1.24); }
     95% { animation-timing-function: ease-in; transform: scale(1.04); }
   }
   @media (prefers-reduced-motion: reduce) {
     .anim-bounce-in-bck { animation: none; }
   }
   ```
6. Сохранить файл

**Validation**:

- [x] Компонент компилируется без ошибок
- [x] `scrollToCardWithBounce()` вызывается и прокручивает к карточке
- [x] Анимация `bounce-in-bck` отображается корректно
- [x] После завершения анимации класс `anim-bounce-in-bck` удаляется
- [x] Если карточка не найдена, warning в консоли

**Estimated Time**: 30 минут

---

### 3. Frontend: Update CoursePage to Trigger Scroll on Edit

**Description**: Изменить `handleSaveCard` в `CoursePage.vue`, чтобы после сохранения редактирования
прокручивать к отредактированной карточке с анимацией.

**Dependencies**: Task 2 (scrollToCardWithBounce method)

**Files**:

- `frontend/src/pages/course/CoursePage.vue`

**Steps**:

1. Открыть `CoursePage.vue`
2. Добавить ref на `CardList`:
   ```typescript
   const cardListRef = ref(null)
   ```
3. В template добавить ref на CardList (и desktop, и mobile версии — выбрать подходящий):
   ```vue
   <CardList ref="cardListRef" ... />
   ```
4. Добавить метод `scrollToCardWithBounce`:
   ```typescript
   const scrollToCardWithBounce = (cardId: string) => {
     const cardListComponent = cardListRef.value
     if (cardListComponent) {
       cardListComponent.scrollToCardWithBounce(cardId)
     }
   }
   ```
5. Изменить `handleSaveCard`:
   ```typescript
   const handleSaveCard = async (data) => {
     try {
       if (editingCard.value) {
         await cardStore.updateCard(editingCard.value.id, { ...data, resetProgress: true })
         const editedCardId = editingCard.value.id
         await cardStore.fetchCardsByCourse(courseId)
         handleCloseModal()
         nextTick(() => {
           scrollToCardWithBounce(editedCardId)
         })
       }
       else {
         const newCard = await cardStore.createCard(courseId, data)
         await cardStore.fetchCardsByCourse(courseId)
         handleCloseModal()
         nextTick(() => {
           scrollToCardWithBounce(newCard.id)
         })
       }
     }
     catch (err) {
       console.error('Failed to save card:', err)
     }
   }
   ```
6. Сохранить файл

**Validation**:

- [x] После сохранения редактирования список прокручивается к карточке
- [x] Карточка показывает bounce-анимацию
- [x] Прогресс карточки сброшен (state = New, reps = 0)

**Estimated Time**: 20 минут

---

### 4. Frontend: Update CoursePage to Trigger Scroll on Add

**Description**: Изменить `handleQuickAdd` в `CoursePage.vue`, чтобы после добавления карточки прокручивать
к ней с анимацией.

**Dependencies**: Task 2 (scrollToCardWithBounce method), Task 3 (scrollToCardWithBounce in CoursePage)

**Files**:

- `frontend/src/pages/course/CoursePage.vue`
- `frontend/src/entities/card/model/useCardStore.ts` (проверить, возвращает ли createCard новую карточку)

**Steps**:

1. Открыть `frontend/src/entities/card/model/useCardStore.ts`
2. Убедиться, что `createCard()` возвращает созданную карточку (с полем `id`)
3. Если нет — изменить метод, чтобы возвращать `newCard` из response
4. Открыть `CoursePage.vue`
5. Изменить `handleQuickAdd`:
   ```typescript
   const handleQuickAdd = async (cardData: { front: string; back: string }) => {
     try {
       const newCard = await cardStore.createCard(courseId, cardData)
       nextTick(() => scrollToCardWithBounce(newCard.id))
     }
     catch (err) {
       console.error('Failed to create card:', err)
     }
   }
   ```
6. Сохранить файл

**Validation**:

- [x] После добавления карточки список прокручивается к ней
- [x] Добавленная карточка показывает bounce-анимацию

**Estimated Time**: 15 минут

---

### 5. Testing: Manual Testing on Desktop

**Description**: Провести ручное тестирование на desktop (≥1025px).

**Dependencies**: All previous tasks

**Test Cases**:

1. Редактирование карточки:
   - [x] Нажать "Редактировать" на карточке
   - [x] Модалка открывается с данными карточки
   - [x] Изменить `front` и `back`
   - [x] Нажать "Сохранить"
   - [x] Модалка закрывается
   - [x] Список прокручивается к отредактированной карточке
   - [x] Карточка показывает bounce-анимацию
   - [x] Прогресс карточки сброшен (state = New, reps = 0)

2. Добавление карточки:
   - [x] Заполнить форму добавления
   - [x] Нажать "Добавить карточку"
   - [x] Список прокручивается к добавленной карточке
   - [x] Карточка показывает bounce-анимацию

**Estimated Time**: 20 минут

---

### 6. Testing: Manual Testing on Mobile

**Description**: Провести ручное тестирование на mobile (<1025px).

**Dependencies**: All previous tasks

**Test Cases**:

1. Редактирование карточки:
   - [x] Открыть мобильную панель карточек
   - [x] Нажать "Редактировать" на карточке
   - [x] Модалка открывается
   - [x] Нажать "Сохранить"
   - [x] Список прокручивается к отредактированной карточке
   - [x] Карточка показывает bounce-анимацию

2. Добавление карточки:
   - [x] Заполнить форму добавления
   - [x] Нажать "Добавить карточку"
   - [x] Список карточек открывается, если не открыт
   - [x] Список прокручивается к добавленной карточке (можно в панели, можно на странице)
   - [x] Карточка показывает bounce-анимацию

**Estimated Time**: 15 минут

---

### 7. Testing: Edge Cases

**Description**: Провести тестирование edge cases.

**Dependencies**: All previous tasks

**Test Cases**:

1. [x] Прокрутка к карточке, которая не существует → warning в консоли, нет ошибки
2. [x] Анимация bounce при `prefers-reduced-motion: reduce` → анимация не воспроизводится
3. [x] Редактирование последней карточки в длинном списке → прокрутка работает
4. [x] Добавление карточки в пустой список → прокрутка работает (или не происходит, если список был пуст)

**Estimated Time**: 15 минут

---

### 8. Documentation: Update Changelog

**Description**: Обновить `docs/Changelog.md` с описанием изменений.

**Dependencies**: All previous tasks

**Steps**:

1. Открыть `docs/Changelog.md`
2. Добавить новую запись в начало файла:
   ```markdown
   ## [Unreleased]
   
   ### Added
   - Visual feedback after card creation/edit: automatic scroll to card with bounce animation
   - Card progress reset on edit (card becomes "new" with fresh FSRS metrics)
   
   ### Changed
   - CardList.vue now exposes `scrollToCardWithBounce()` method
   - CoursePage.vue now triggers scroll and animation after card save/create
   - Card update endpoint now supports `resetProgress` parameter
   ```
3. Сохранить файл

**Validation**:

- [x] Changelog содержит все основные изменения
- [x] Формат соответствует стандарту Keep a Changelog

**Estimated Time**: 10 минут

---

### 9. Validation: Run OpenSpec Validate

**Description**: Запустить валидацию OpenSpec для проверки корректности proposal.

**Dependencies**: All documentation tasks

**Steps**:

1. Выполнить команду:
   ```bash
   npx @fission-ai/openspec validate card-edit-form --strict
   ```
2. Исправить все найденные ошибки (если есть)
3. Повторить валидацию до успешного результата

**Validation**:

- [x] Команда завершается с кодом 0
- [x] Нет ошибок валидации
- [x] Все spec deltas корректны

**Estimated Time**: 10 минут

---

## Summary

**Total Tasks**: 9

**Total Estimated Time**: ~2 часа 30 минут

**Critical Path**:

1. Backend (Task 1) → можно делать параллельно с frontend
2. CardList scroll (Task 2) → CoursePage integration (Task 3, 4)
3. Testing (Tasks 5, 6, 7) → Documentation (Task 8) → Validation (Task 9)

**Parallelizable Work**:

- Task 1 (Backend) и Task 2 (CardList) можно делать одновременно
- Tasks 5, 6, 7 (Testing) можно объединить в один тестовый сеанс

**Key Risks**:

- Если `createCard()` не возвращает ID новой карточки, потребуется дополнительное изменение store
- Анимация может работать некорректно на медленных устройствах (решение: уже учтено `prefers-reduced-motion`)
- Прокрутка может не работать, если карточка не рендерится сразу (решение: `nextTick()` + timeout для анимации)
- Два экземпляра `CardList` (desktop + mobile) — нужно убедиться, что ref ссылается на правильный экземпляр
