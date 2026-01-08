# Tasks: Replace System Dialogs with Custom UI

## Phase 1: Setup Components (Foundation)

### 1.1 Configure vue3-toastify

- [x] Добавить импорт `vue3-toastify` в `frontend/src/app/main.js`
- [x] Добавить импорт стилей `'vue3-toastify/dist/index.css'`
- [x] Настроить глобальные параметры toast (position, autoClose, draggable)
- [x] Добавить кастомизацию CSS переменных toast в `styles.css`

**Verification**: Вызвать `toast.success('Test')` в консоли, увидеть toast уведомление

---

### 1.2 Create ConfirmDialog Component

- [x] Создать файл `frontend/src/shared/ui/ConfirmDialog.vue`
- [x] Реализовать template с модальным окном и backdrop
- [x] Добавить props: `title`, `message`, `confirmText`, `cancelText`, `resolve`, `close`
- [x] Реализовать анимации открытия/закрытия (fadeIn/slideIn)
- [x] Добавить обработчики `handleConfirm` и `handleCancel`
- [x] Стилизовать компонент с использованием CSS переменных проекта (`--color-background`, `--color-text`, и т.д.)
- [x] Добавить классы `.btn-primary` и `.btn-secondary` для кнопок
- [x] Добавить поддержку закрытия по клику на backdrop

**Verification**: Ручное тестирование рендера компонента в Vue DevTools

---

### 1.3 Create useConfirm Composable

- [x] Создать файл `frontend/src/shared/lib/useConfirm.js`
- [x] Реализовать функцию `confirm()` которая возвращает Promise<boolean>
- [x] Поддержать два формата вызова: строка и объект с опциями
- [x] Реализовать динамическое создание контейнера для монтирования
- [x] Реализовать функцию `close()` для уничтожения компонента после закрытия
- [x] Использовать `createVNode` и `render` из Vue для программного рендера

**Verification**:

```javascript
const { confirm } = useConfirm();
const result = await confirm("Test message");
console.log(result); // true или false
```

---

## Phase 2: Replace alert() Usages

### 2.1 Replace in SettingsPage.vue (2 usages)

- [x] Добавить import `toast` из `'vue3-toastify'`
- [x] **Line 48**: заменить `alert('Глобальные настройки сохранены!')` на
      `toast.success('Глобальные настройки сохранены!')`
- [x] **Line 50**: заменить `alert('Ошибка сохранения: ' + error.message)` на
      `toast.error('Ошибка сохранения: ' + error.message)`

**Verification**: Открыть SettingsPage, сохранить настройки с успехом и с ошибкой (отключив backend), проверить toast

---

### 2.2 Replace in HomePage.vue (2 usages)

- [x] Добавить import `toast` из `'vue3-toastify'`
- [x] **Line 40**: заменить `alert('Ошибка при удалении курса...')` на
      `toast.error('Ошибка при удалении курса. Попробуйте еще раз.')`
- [x] **Line 58**: заменить `alert('Ошибка при сохранении курса...')` на
      `toast.error('Ошибка при сохранении курса. Попробуйте еще раз.')`

**Verification**: Открыть HomePage, симулировать ошибку (отключив backend), проверить toast

---

## Phase 3: Replace confirm() Usages

### 3.1 Replace in CourseSettingsModal.vue (1 usage)

- [x] Добавить import `useConfirm` из `'@/shared/lib/useConfirm'`
- [x] Получить `confirm` из `useConfirm()` composable
- [x] **Line 81**: заменить `if (confirm('Сбросить настройки к глобальным?'))` на:

  ```javascript
  const {confirm} = useConfirm();
  const confirmed = await confirm('Сбросить настройки к глобальным?');
  if (confirmed)
  ```

- [x] Сделать метод обработчика `async`

**Verification**: Открыть CourseSettingsModal, нажать "Сбросить к глобальным", проверить ConfirmDialog

---

### 3.2 Replace in HomePage.vue (1 usage)

- [x] Добавить import `useConfirm` из `'@/shared/lib/useConfirm'`
- [x] Получить `confirm` из `useConfirm()` composable
- [x] **Line 34**: заменить `const confirmed = confirm(\`Вы уверены...\`)` на:

  ```javascript
  const { confirm } = useConfirm();
  const confirmed = await confirm({
    title: "Удаление курса",
    message: `Вы уверены, что хотите удалить курс "${course.name}"?`,
    confirmText: "Удалить",
    cancelText: "Отмена",
  });
  ```

- [x] Сделать метод `deleteCourse` async

**Verification**: Открыть HomePage, удалить курс, проверить ConfirmDialog с кастомными текстами кнопок

---

### 3.3 Replace in CoursePage.vue (3 usages)

- [x] Добавить import `useConfirm` из `'@/shared/lib/useConfirm'`
- [x] Получить `confirm` из `useConfirm()` composable
- [x] **Line 117**: заменить `const confirmed = confirm('Удалить карточку?')` на:

  ```javascript
  const { confirm } = useConfirm();
  const confirmed = await confirm("Удалить карточку?");
  ```

- [x] **Line 142**: заменить `const confirmed = confirm(\`Удалить выбранные карточки (\${count})?\`)` на:

  ```javascript
  const confirmed = await confirm({
    title: "Удаление карточек",
    message: `Удалить выбранные карточки (${count})?`,
  });
  ```

- [x] **Line 156**: заменить `const confirmed = confirm(\`Вы уверены...\`)` на:

  ```javascript
  const confirmed = await confirm({
    title: "Удаление всех карточек",
    message: `Вы уверены, что хотите удалить ВСЕ карточки курса (${count})?\n\nЭто действие необратимо!`,
    confirmText: "Удалить все",
    cancelText: "Отмена",
  });
  ```

- [x] Сделать соответствующие методы async (`deleteCard`, `deleteSelectedCards`, `deleteAllCards`)

**Verification**: Открыть CoursePage:

- Удалить одну карточку → проверить ConfirmDialog
- Выбрать несколько карточек и удалить → проверить ConfirmDialog с количеством
- Удалить все карточки → проверить ConfirmDialog с предупреждением

---

## Phase 4: Enhancement & Accessibility

### 4.1 Add Accessibility to ConfirmDialog

- [x] Добавить `role="dialog"` на модальное окно
- [x] Добавить `aria-modal="true"`
- [x] Добавить `aria-labelledby` для title
- [x] Добавить `aria-describedby` для message
- [x] Реализовать закрытие по клавише Escape
- [ ] Реализовать focus trap (фокус остается внутри диалога)

**Verification**: Открыть диалог, проверить что:

- Escape закрывает диалог
- Tab не переводит фокус за пределы диалога
- Screen reader корректно читает title и message

---

### 4.2 Verify Theme Support

- [ ] Открыть приложение в светлой теме
- [ ] Проверить что toast и ConfirmDialog стилизованы корректно
- [ ] Переключить на темную тему
- [ ] Проверить что toast и ConfirmDialog адаптировались под темную тему

**Verification**: Ручная проверка в обеих темах

---

## Phase 5: Documentation & Cleanup

### 5.1 Remove Legacy Code

- [x] Убедиться что все 4 `alert()` заменены
- [x] Убедиться что все 5 `confirm()` заменены
- [x] Проверить что нет случайных eslint warnings

**Verification**: Запустить `npm run lint` в frontend

---

### 5.2 Update Documentation

- [x] Документировать новый подход в `ui-notifications` spec
- [ ] Обновить `docs/Walkthrough.md` с информацией о замене диалогов

**Verification**: Прочитать обновленную документацию

---

## Dependencies

- **1.1 → 2.1, 2.2**: vue3-toastify должен быть настроен перед использованием toast
- **1.2, 1.3 → 3.1, 3.2, 3.3**: ConfirmDialog и useConfirm должны быть созданы перед заменой confirm()
- **Phases 1-3 → Phase 4**: Все диалоги должны быть заменены перед добавлением accessibility
- **Phases 1-4 → Phase 5**: Cleanup и документация в последнюю очередь

## Parallelizable Work

- Tasks 2.1 и 2.2 можно выполнять параллельно (оба заменяют alert)
- Tasks 3.1, 3.2, 3.3 можно выполнять параллельно (все заменяют confirm)
