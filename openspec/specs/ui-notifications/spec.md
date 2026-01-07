# ui-notifications Specification

## Purpose

Определяет систему пользовательских уведомлений и диалогов подтверждения в приложении, заменяя системные `alert()` и
`confirm()` на кастомные UI компоненты, соответствующие дизайн-системе проекта.

## Requirements

### Requirement: Toast Notifications for Success and Error Messages

The system SHALL use toast notifications (via `vue3-toastify`) to display simple success and error messages instead of
native `alert()`.

**Rationale**: Системные `alert()` блокируют весь UI и не соответствуют дизайн-системе приложения. Toast-уведомления
предоставляют неблокирующий способ информирования пользователя и автоматически исчезают после таймаута.

#### Scenario: Success Notification

- **GIVEN** пользователь выполняет действие, которое завершается успешно (например, сохранение настроек)
- **WHEN** действие завершено
- **THEN**:
    - Отображается toast-уведомление с зеленым фоном (success)
    - Toast содержит текст успешного сообщения (например, "Глобальные настройки сохранены!")
    - Toast автоматически исчезает через 3 секунды
    - Toast позиционируется в правом верхнем углу (`position: 'top-right'`)
- **AND** пользователь может закрыть toast вручную, нажав на кнопку закрытия
- **AND** toast стилизован в соответствии с текущей темой (светлая/темная)

#### Scenario: Error Notification

- **GIVEN** пользователь выполняет действие, которое завершается ошибкой (например, ошибка сохранения)
- **WHEN** произошла ошибка
- **THEN**:
    - Отображается toast-уведомление с красным фоном (error)
    - Toast содержит текст сообщения об ошибке (например, "Ошибка сохранения: network timeout")
    - Toast автоматически исчезает через 3 секунды
    - Toast позиционируется в правом верхнем углу
- **AND** пользователь может закрыть toast вручную
- **AND** toast стилизован в соответствии с текущей темой

#### Scenario: Toast in Dark Theme

- **GIVEN** приложение находится в темной теме
- **WHEN** отображается toast-уведомление (success или error)
- **THEN**:
    - Toast имеет темный фон и светлый текст
    - Цвета индикаторов (зеленый для success, красный для error) адаптированы под темную тему
    - Toast остается читаемым и контрастным

---

### Requirement: Custom Confirm Dialog for User Confirmations

The system SHALL use a custom `ConfirmDialog` component to obtain user confirmation instead of native `confirm()`.

**Rationale**: Системные `confirm()` диалоги блокируют весь UI, не поддерживают кастомизацию и не соответствуют
стилистике приложения. Кастомный ConfirmDialog обеспечивает консистентный UX и поддерживает темизацию.

#### Scenario: Basic Confirmation Dialog

- **GIVEN** пользователь инициирует критическое действие (например, удаление карточки)
- **WHEN** приложение вызывает `useConfirm().confirm(message)`
- **THEN**:
    - Отображается модальное окно с полупрозрачным backdrop (rgba(0,0,0,0.5))
    - Модальное окно содержит:
        - Заголовок "Подтверждение" (по умолчанию)
        - Текст сообщения (переданный аргумент `message`)
        - Две кнопки: "Нет" (вторичная) и "Да" (первичная)
    - Backdrop блокирует взаимодействие с остальным UI
    - Модальное окно анимируется при открытии (fadeIn 300ms)
- **AND** при нажатии "Да" промис разрешается в `true`
- **AND** при нажатии "Нет" промис разрешается в `false`
- **AND** модальное окно закрывается с анимацией (300ms)

#### Scenario: Advanced Confirmation with Custom Options

- **GIVEN** пользователь инициирует критическое действие (например, удаление всех карточек)
- **WHEN** приложение вызывает `useConfirm().confirm({ title, message, confirmText, cancelText })`
- **THEN**:
    - Отображается модальное окно с кастомными параметрами:
        - Заголовок: значение `title` (например, "Удаление всех карточек")
        - Сообщение: значение `message` с поддержкой переносов строк (`\n`)
        - Кнопка подтверждения: текст `confirmText` (например, "Удалить все")
        - Кнопка отмены: текст `cancelText` (например, "Отмена")
    - Сообщение поддерживает многострочный текст (сохраняет переносы строк)
- **AND** поведение кнопок идентично базовому сценарию

#### Scenario: Closing Dialog by Backdrop Click

- **GIVEN** открыт ConfirmDialog
- **WHEN** пользователь кликает на backdrop (вне модального окна)
- **THEN**:
    - Диалог закрывается с анимацией
    - Промис разрешается в `false` (эквивалент отмены)

#### Scenario: Closing Dialog by Escape Key

- **GIVEN** открыт ConfirmDialog
- **WHEN** пользователь нажимает клавишу Escape
- **THEN**:
    - Диалог закрывается с анимацией
    - Промис разрешается в `false`

#### Scenario: Dialog Styling in Light Theme

- **GIVEN** приложение находится в светлой теме
- **WHEN** отображается ConfirmDialog
- **THEN**:
    - Фон модального окна использует `var(--color-background)` (светлый)
    - Текст заголовка использует `var(--color-text)` (темный)
    - Текст сообщения использует `var(--color-text-muted)` (серый)
    - Кнопки стилизованы через `.btn-primary` и `.btn-secondary`

#### Scenario: Dialog Styling in Dark Theme

- **GIVEN** приложение находится в темной теме
- **WHEN** отображается ConfirmDialog
- **THEN**:
    - Фон модального окна использует `var(--color-background)` (темный)
    - Текст заголовка использует `var(--color-text)` (светлый)
    - Текст сообщения использует `var(--color-text-muted)` (серый светлый)
    - Кнопки адаптируются под темную тему через CSS переменные

---

### Requirement: Accessibility for ConfirmDialog

The system SHALL ensure ConfirmDialog accessibility for users with assistive technologies (screen readers, keyboard
navigation).

**Rationale**: Все интерактивные элементы должны быть доступны через клавиатуру и корректно интерпретироваться screen
readers.

#### Scenario: ARIA Attributes

- **GIVEN** открыт ConfirmDialog
- **WHEN** screen reader анализирует модальное окно
- **THEN**:
    - Модальное окно имеет `role="dialog"`
    - Модальное окно имеет `aria-modal="true"`
    - Заголовок имеет уникальный `id` и связан с модальным окном через `aria-labelledby`
    - Сообщение имеет уникальный `id` и связано с модальным окном через `aria-describedby`
- **AND** screen reader корректно объявляет заголовок и сообщение диалога

#### Scenario: Focus Trap

- **GIVEN** открыт ConfirmDialog
- **WHEN** пользователь нажимает Tab для навигации
- **THEN**:
    - Фокус перемещается между кнопками "Нет" и "Да"
    - Фокус НЕ выходит за пределы модального окна
    - При достижении последней кнопки следующий Tab возвращает фокус на первую кнопку
- **AND** при открытии диалога фокус автоматически устанавливается на кнопку "Нет"

#### Scenario: Keyboard Navigation

- **GIVEN** открыт ConfirmDialog
- **WHEN** пользователь нажимает Enter на кнопке "Да"
- **THEN** промис разрешается в `true` и диалог закрывается
- **WHEN** пользователь нажимает Enter на кнопке "Нет"
- **THEN** промис разрешается в `false` и диалог закрывается
- **WHEN** пользователь нажимает Escape
- **THEN** промис разрешается в `false` и диалог закрывается

---

### Requirement: Global Toast Configuration

The system SHALL configure vue3-toastify globally at the application entry point (`main.ts`) for consistent notification
behavior.

#### Scenario: Global Toast Setup

- **GIVEN** приложение инициализируется
- **WHEN** выполняется `frontend/src/app/main.ts`
- **THEN**:
    - Импортируются `toast` и стили из `'vue3-toastify'`
    - Опционально настраиваются параметры:
        - `position: 'top-right'`
        - `autoClose: 3000` (мс)
        - `hideProgressBar: false`
        - `closeOnClick: true`
        - `pauseOnHover: true`
        - `draggable: true`
        - `theme: 'auto'` (автоматическая смена темы)
- **AND** toast доступен глобально через импорт `import {toast} from 'vue3-toastify'`

---

### Requirement: Programmatic Confirm via useConfirm Composable

The system SHALL provide a `useConfirm()` composable for programmatic invocation of ConfirmDialog from any component.

#### Scenario: Simple String Message

- **GIVEN** компонент импортирует `useConfirm`
- **WHEN** вызывается `const {confirm} = useConfirm(); const result = await confirm('Вы уверены?')`
- **THEN**:
    - Отображается ConfirmDialog с заголовком "Подтверждение" и сообщением "Вы уверены?"
    - Кнопки имеют дефолтные тексты: "Нет" и "Да"
    - Промис разрешается в `true` при нажатии "Да" или в `false` при нажатии "Нет"

#### Scenario: Options Object

- **GIVEN** компонент импортирует `useConfirm`
- **WHEN** вызывается:
  ```javascript
  const {confirm} = useConfirm();
  const result = await confirm({
    title: 'Удаление курса',
    message: 'Вы уверены?',
    confirmText: 'Удалить',
    cancelText: 'Отмена'
  });
  ```
- **THEN**:
    - Отображается ConfirmDialog с кастомными параметрами
    - Промис разрешается в соответствии с выбором пользователя

#### Scenario: Cleanup After Dialog Close

- **GIVEN** ConfirmDialog был открыт и закрыт
- **WHEN** пользователь закрывает диалог (любым способом)
- **THEN**:
    - Контейнер диалога удаляется из DOM (`document.body.removeChild`)
    - Vue VNode уничтожается (`render(null, container)`)
    - Память освобождается

---
