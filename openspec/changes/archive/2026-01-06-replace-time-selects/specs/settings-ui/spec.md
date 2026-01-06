# Spec Delta: settings-ui (replace-time-selects)

## MODIFIED Requirements

### Requirement: TimeRangePicker Component

The system SHALL provide an intuitive time range selection interface with visual feedback using scroll-based picker UI.

#### Scenario: User selects time range with scroll picker

- **GIVEN** TimeRangePicker is rendered in SettingsForm
- **WHEN** user scrolls through hour values in start time picker
- **THEN** visual timeline updates to show active window in real-time
- **AND** `update:start` event is emitted with selected hour value
- **AND** scroll animation is smooth and responsive

#### Scenario: Visual timeline representation

- **GIVEN** trainingStartHour = 8, trainingEndHour = 22
- **WHEN** TimeRangePicker is rendered
- **THEN** two scroll picker components show current values (08:00 and 22:00)
- **AND** horizontal timeline shows 24-hour scale below pickers
- **AND** active range (8-22) is highlighted in blue on timeline
- **AND** labels show 0:00, 6:00, 12:00, 18:00, 24:00 marks

#### Scenario: Disabled state

- **GIVEN** TimeRangePicker has `disabled` prop = true
- **WHEN** component is rendered
- **THEN** scroll pickers are disabled and show reduced opacity
- **AND** scroll interaction is blocked
- **AND** visual timeline shows inactive styling (gray)

#### Scenario: Touch interaction on scroll pickers

- **GIVEN** user is on touch-enabled device or mobile viewport
- **WHEN** user swipes vertically on time picker
- **THEN** hours scroll smoothly with momentum
- **AND** selected value snaps to center position
- **AND** visual timeline updates during scroll

#### Scenario: Keyboard navigation support

- **GIVEN** scroll picker has focus
- **WHEN** user presses Arrow Up/Down keys
- **THEN** hour value increments/decrements by 1
- **AND** visual timeline updates accordingly
- **AND** selection wraps around (23 → 0, 0 → 23)

## Design Rationale

### Why ScrollTimePicker?

1. **Mobile-first UX**: Scroll picker является стандартным паттерном для выбора времени на iOS и Android. Применение этого паттерна в desktop приложении обеспечивает консистентный UX.

2. **Premium UI**: Стандартные HTML `<select>` элементы не поддаются полной кастомизации и выглядят устаревшими. Scroll picker позволяет создать более современный и premium-качественный интерфейс.

3. **Touch-friendly**: Приложение потенциально может использоваться на touch-устройствах (hybrid laptops, tablets с Windows). Scroll picker обеспечивает лучший touch UX.

4. **Визуальная обратная связь**: Scroll picker позволяет видеть соседние значения (hour-1, hour, hour+1), что улучшает контекстное понимание выбора.

### Technical Considerations

- **Library choice**: `vue-scroll-picker` — активно поддерживаемый пакет с совместимостью с Vue 3 Composition API
- **Wrapper pattern**: Создание `ScrollTimePicker.vue` wrapper компонента позволяет инкапсулировать интеграцию библиотеки и применить дизайн-систему
- **API compatibility**: Сохранение существующего API (`update:start`, `update:end` events) обеспечивает отсутствие breaking changes для `SettingsForm.vue`

### Alternative Considered

**Native HTML `<input type="time">`**: Рассмотрен и отклонён по следующим причинам:
- Разный UX в разных браузерах (Chrome, Firefox, Edge имеют разные нативные picker'ы)
- Невозможность полной кастомизации согласно дизайн-системе
- Возвращает значение в формате "HH:MM", требует парсинга, текущий API использует числовые значения (0-23)

## Backward Compatibility

### Component API

Компонент `TimeRangePicker.vue` сохраняет полную обратную совместимость:

- **Props**: `start`, `end`, `disabled` — типы и поведение неизменны
- **Events**: `update:start`, `update:end` — payload формат (Number) неизменён
- **Visual timeline**: Сохранена и продолжает корректно отображать выбранный диапазон

### Usage in SettingsForm

Никаких изменений в `SettingsForm.vue` не требуется (кроме возможного обновления импорта, если компонент не использует автоимпорт).

## Testing Strategy

### Unit Testing (Manual)

1. **Render test**: Компонент корректно рендерится с различными значениями start/end
2. **Value selection**: Изменение значения в scroll picker эмитит корректный event
3. **Disabled state**: Компонент корректно обрабатывает disabled=true prop
4. **Edge cases**: Тест граничных значений (0, 23, start > end)

### Integration Testing (Manual)

1. **SettingsPage**: Полный workflow выбора времени и сохранения глобальных настроек
2. **CourseSettingsModal**: Полный workflow выбора времени в custom course settings
3. **Validation flow**: Проверка, что validation errors корректно отображаются при start >= end
4. **Theme switching**: Компонент корректно работает при переключении light/dark theme

### Visual Testing

1. **Light theme**: Компонент визуально соответствует дизайн-системе
2. **Dark theme**: Компонент визуально соответствует дизайн-системе
3. **Hover states**: Hover эффекты корректны и плавны
4. **Focus states**: Focus indicators видимы и соответствуют accessibility стандартам
