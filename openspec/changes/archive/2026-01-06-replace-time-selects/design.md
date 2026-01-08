# Design Document: replace-time-selects

## Overview

Этот документ описывает архитектурное решение для замены стандартных HTML `<select>` элементов в `TimeRangePicker` компоненте на scroll-based picker'ы с использованием библиотеки `vue-scroll-picker`.

## Architecture

### Component Hierarchy

```
SettingsForm.vue
└── TimeRangePicker.vue (existing, modified)
    ├── ScrollTimePicker.vue (new wrapper)
    │   └── VueScrollPicker (library component)
    ├── ScrollTimePicker.vue (new wrapper)
    │   └── VueScrollPicker (library component)
    └── Timeline visualization (existing, unchanged)
```

### Component Responsibilities

#### 1. ScrollTimePicker.vue (New Component)

**Responsability**: Универсальный wrapper вокруг `VueScrollPicker` для выбора часов и минут.

**Location**: `frontend/src/shared/ui/ScrollTimePicker.vue`

**API**:

```typescript
// Props
interface Props {
  modelValue: number; // Selected value (hour 0-23 or minute 0-59)
  min?: number; // Minimum value (default: 0)
  max?: number; // Maximum value (default: 23 for hours, 59 for minutes)
  step?: number; // Step between values (default: 1, can be 5, 10, 15 for minutes)
  formatDigits?: number; // Number of digits for padding (default: 2)
  suffix?: string; // Optional suffix for display (e.g., "ч" or "м")
  disabled?: boolean; // Disable scroll interaction
}

// Events
defineEmits<{
  "update:modelValue": [value: number];
}>();
```

**Implementation Details**:

Компонент генерирует options динамически на основе min/max/step:

```typescript
const options = computed(() => {
  const result = [];
  const minVal = props.min ?? 0;
  const maxVal = props.max ?? 23;
  const stepVal = props.step ?? 1;
  const digits = props.formatDigits ?? 2;

  for (let i = minVal; i <= maxVal; i += stepVal) {
    result.push({
      name: i.toString().padStart(digits, "0") + (props.suffix || ""),
      value: i,
    });
  }

  return result;
});
```

**Usage Examples**:

```vue
<!-- Hours: 0-23 -->
<ScrollTimePicker v-model="hours" :max="23" suffix="ч" />

<!-- Minutes: 0-59 with step 5 (0, 5, 10, ..., 55) -->
<ScrollTimePicker v-model="minutes" :max="59" :step="5" suffix="м" />

<!-- Minutes: 0-59 all values -->
<ScrollTimePicker v-model="minutes" :max="59" suffix="м" />
```

**Required Imports**:

```vue
<script setup>
import { computed } from "vue";
import { VueScrollPicker } from "vue-scroll-picker";
import "vue-scroll-picker/style.css";
</script>
```

**Template Structure**:

```vue
<template>
  <div class="scroll-time-picker">
    <VueScrollPicker
      :model-value="modelValue"
      :options="options"
      :disabled="disabled"
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </div>
</template>
```

**Key Features**:

- **Универсальность**: один компонент для часов и минут
- **Гибкость**: настраиваемый диапазон (min/max) и шаг (step)
- **Форматирование**: автоматическое добавление ведущих нулей
- **Суффиксы**: опциональные суффиксы для улучшения UX ("ч", "м")
- Использует официальный API `vue-scroll-picker` с `options` массивом
- `v-model` binding через `modelValue` prop и `update:modelValue` event
- Автоматическая обработка disabled state библиотекой

**Styling Strategy**:

- Импорт базовых стилей библиотеки: `import 'vue-scroll-picker/style.css'`
- Переопределение CSS variables через scoped styles в wrapper
- Применение дизайн-системы: `--color-border`, `--color-text-primary`, `--input-bg`, `--color-primary`
- Темизация через existing theme CSS variables (light/dark)

#### 2. TimeRangePicker.vue (Modified Component)

**Changes**:

- **Remove**: `<select>` elements и связанный с ними markup
- **Add**: **Четыре** `<ScrollTimePicker>` компонента:
  - Start Hours (0-23) + Start Minutes (0, 15, 30, 45)
  - End Hours (0-23) + End Minutes (0, 15, 30, 45)
- **Change API**: вместо часов (0-23), использовать **минуты с начала дня** (0-1439)
  - `trainingStartHour` → `trainingStartTime` (0-1439 minutes)
  - `trainingEndHour` → `trainingEndTime` (0-1439 minutes)
- **Preserve**:
  - Visual timeline component и logic
  - Props API: `start`, `end`, `disabled` (но значения теперь в минутах)
  - Events API: `update:start`, `update:end` (emit minutes)
  - Layout structure (селекторы + timeline)

**Internal State**:

```vue
<script setup>
const props = defineProps({
  start: { type: Number, required: true }, // Minutes from midnight (0-1439)
  end: { type: Number, required: true }, // Minutes from midnight (0-1439)
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(["update:start", "update:end"]);

// Convert minutes to hours/minutes
const startHours = computed(() => Math.floor(props.start / 60));
const startMinutes = computed(() => props.start % 60);
const endHours = computed(() => Math.floor(props.end / 60));
const endMinutes = computed(() => props.end % 60);

// Handlers to convert back to minutes
function updateStartHours(hours) {
  emit("update:start", hours * 60 + startMinutes.value);
}

function updateStartMinutes(minutes) {
  emit("update:start", startHours.value * 60 + minutes);
}

function updateEndHours(hours) {
  emit("update:end", hours * 60 + endMinutes.value);
}

function updateEndMinutes(minutes) {
  emit("update:end", endHours.value * 60 + minutes);
}
</script>
```

**Layout Update**:

```vue
<template>
  <div class="time-range-picker">
    <!-- Start Time -->
    <div class="time-group">
      <label>Начало дня</label>
      <div class="time-inputs">
        <ScrollTimePicker
          :model-value="startHours"
          :max="23"
          suffix="ч"
          :disabled="disabled"
          @update:model-value="updateStartHours"
        />
        <span class="separator">:</span>
        <ScrollTimePicker
          :model-value="startMinutes"
          :max="45"
          :step="15"
          suffix="м"
          :disabled="disabled"
          @update:model-value="updateStartMinutes"
        />
      </div>
    </div>

    <!-- End Time -->
    <div class="time-group">
      <label>Конец дня</label>
      <div class="time-inputs">
        <ScrollTimePicker
          :model-value="endHours"
          :max="23"
          suffix="ч"
          :disabled="disabled"
          @update:model-value="updateEndHours"
        />
        <span class="separator">:</span>
        <ScrollTimePicker
          :model-value="endMinutes"
          :max="45"
          :step="15"
          suffix="м"
          :disabled="disabled"
          @update:model-value="updateEndMinutes"
        />
      </div>
    </div>

    <!-- Timeline visualization (UPDATE: now works with minutes) -->
    <div class="timeline">
      <div class="timeline-track">
        <div class="timeline-active" :style="visualRange" />
      </div>
      <div class="timeline-labels">
        <span>0:00</span>
        <span>6:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>24:00</span>
      </div>
    </div>
  </div>
</template>
```

**Visual Range Calculation Update**:

```javascript
const visualRange = computed(() => {
  const totalMinutes = 24 * 60; // 1440 minutes in a day
  const startPercent = (props.start / totalMinutes) * 100;
  const endPercent = (props.end / totalMinutes) * 100;
  return {
    left: `${startPercent}%`,
    width: `${endPercent - startPercent}%`,
  };
});
```

**Breaking Change Note**:

Parent components (SettingsForm) должны обновить API usage:

```vue
<!-- OLD (hours only) -->
<TimeRangePicker :start="settings.trainingStartHour" :end="settings.trainingEndHour" />

<!-- NEW (minutes from midnight) -->
<TimeRangePicker :start="settings.trainingStartTime" :end="settings.trainingEndTime" />
```

**Migration**: Backend должен хранить время в минутах вместо часов, либо frontend должен конвертировать при загрузке/сохранении.

### Data Flow

```
User Interaction
    ↓
VueScrollPicker (library)
    ↓
ScrollTimePicker.vue (wrapper)
    ↓ emit('update:modelValue', hour)
TimeRangePicker.vue
    ↓ emit('update:start' or 'update:end', hour)
SettingsForm.vue
    ↓ localSettings.trainingStartHour / trainingEndHour updated
Reactivity
    ↓
Timeline visualization updates
    ↓
Visual feedback to user
```

## UI/UX Design

### Visual Design

#### Scroll Picker Appearance

```
┌─────────────────┐
│     07:00       │  ← Previous hour (faded)
├─────────────────┤
│   → 08:00 ←     │  ← Selected hour (highlighted, larger font)
├─────────────────┤
│     09:00       │  ← Next hour (faded)
└─────────────────┘
```

**Style Properties**:

- Selected item: `font-weight: 600`, `color: var(--color-primary)`, `font-size: 18px`
- Adjacent items: `opacity: 0.6`, `color: var(--color-text-secondary)`, `font-size: 14px`
- Background: `background: var(--input-bg)`, `border: 1px solid var(--color-border)`
- Border radius: `8px` (consistent with Input.vue component)

#### Interaction Design

**Desktop**:

- Mouse wheel scroll to change value
- Click on arrow buttons (if library provides)
- Hover state: `border-color: var(--color-border-focus)`

**Touch**:

- Vertical swipe to scroll through hours
- Momentum scrolling with smooth deceleration
- Haptic feedback (if device supports) on value snap

**Keyboard**:

- Arrow Up/Down to increment/decrement
- Focus state: `box-shadow: 0 0 0 3px var(--input-focus-shadow)`

### Responsiveness

**Desktop (> 768px)**:

- Picker height: `120px`
- Item height: `40px`
- 3 visible items (previous, current, next)

**Mobile (< 768px)**:

- Picker height: `160px` (larger touch targets)
- Item height: `53px`
- 3 visible items maintained

## Technical Decisions

### Why vue-scroll-picker?

**Criteria evaluated**:

1. Vue 3 Composition API compatibility ✅
2. TypeScript support ✅
3. Active maintenance (last update < 6 months) ✅
4. Size (< 50kb) ✅
5. Customization flexibility ✅
6. Official documentation and examples ✅

**Package Details**:

- **Name**: `vue-scroll-picker`
- **Import**: `{ VueScrollPicker } from 'vue-scroll-picker'`
- **CSS**: `import 'vue-scroll-picker/style.css'` (REQUIRED)
- **API**: Uses `options` prop with `{ name: string, value: any, disabled?: boolean }[]` format
- **Events**: Native `v-model` support через `update:modelValue`

**Важно**: Библиотека требует **обязательного импорта CSS** файла `vue-scroll-picker/style.css`. Без этого импорта компонент не будет корректно отображаться.

**Alternatives considered**:

- `@vueform/slider`: Не подходит, это slider, а не scroll picker
- `vue3-scroll-picker`: Менее популярный, меньше stars на GitHub
- Custom implementation: Излишне сложно для текущего scope

### Wrapper Pattern Justification

**Зачем создавать wrapper вместо прямого использования библиотеки?**

1. **Encapsulation**: Изолирует зависимость от внешней библиотеки. Если в будущем потребуется сменить библиотеку — изменения затронут только wrapper.

2. **Design System Integration**: Wrapper позволяет применить единую стилизацию и поведение согласно проектной дизайн-системе.

3. **Simplified API**: Wrapper может упростить API библиотеки, предоставляя только необходимые props/events для нашего use case (hour selection 0-23).

4. **Reusability**: В будущем `ScrollTimePicker` может быть переиспользован в других компонентах (например, для выбора минут, дней и т.д.).

### State Management

**No Pinia Store Required**:

Компонент является презентационным (presentational component) и не управляет глобальным состоянием. Все данные передаются через props и emit events, что соответствует принципу unidirectional data flow.

**Local State**:

`ScrollTimePicker` может содержать минимальное локальное состояние для управления UI behaviour (например, scroll animation state), но это инкапсулировано внутри компонента.

## Performance Considerations

### Rendering Performance

**Concern**: Рендеринг 24 элементов в двух scroll picker'ах может быть ресурсоёмким.

**Mitigation**:

- `vue-scroll-picker` использует виртуализацию — рендерит только видимые элементы + buffer
- Общее количество (24 hours) достаточно мало для производительности не быть проблемой
- Используем `v-once` для статичных labels в timeline

### Animation Performance

**Concern**: Плавные scroll анимации должны работать на 60 FPS.

**Mitigation**:

- Используем CSS transitions вместо JavaScript анимаций где возможно
- Применяем `will-change: transform` для элементов, которые анимируются
- Тестируем на низкопроизводительных устройствах (если доступны)

## Testing Approach

### Manual Testing Protocol

**Phase 1: Component Isolation**

1. Создать тестовую страницу с `ScrollTimePicker` в изоляции
2. Проверить все interaction methods (mouse, touch, keyboard)
3. Проверить disabled state
4. Проверить edge values (0, 23)

**Phase 2: Integration in TimeRangePicker**

1. Проверить синхронизацию с timeline visualization
2. Проверить update events
3. Проверить validation flow (start >= end)

**Phase 3: Settings Page E2E**

1. Полный workflow: открыть Settings → изменить время → сохранить
2. Проверить CourseSettingsModal
3. Проверить theme switching

### Regression Testing

**Critical flows to verify**:

- Global settings save
- Course custom settings save
- Validation error display
- Timeline visual update
- Disabled state in modal (when using global settings)

## Migration Strategy

### Implementation Order

1. **Install dependency** → Immediate, low risk
2. **Create ScrollTimePicker.vue** → Can develop and test in isolation
3. **Update TimeRangePicker.vue** → Replace selects with new pickers
4. **Style integration** → Apply design system styles
5. **Integration testing** → Verify in SettingsForm and modal
6. **Visual polish** → Fine-tune animations and transitions

### Rollback Plan

Если интеграция не удастся или выявятся критические проблемы:

1. **Revert TimeRangePicker.vue** к версии с `<select>` (сохранить в git history)
2. **Remove ScrollTimePicker.vue** файл
3. **Uninstall vue-scroll-picker** из package.json
4. **No database or backend changes** — откат фронтенда не затрагивает бэкенд

**Rollback complexity**: LOW (только фронтенд файлы, full backward compatibility)

## Future Enhancements (Out of Scope)

Следующие улучшения могут быть рассмотрены в будущих iterations, но НЕ входят в текущий scope:

1. **Minute-level precision**: Добавление выбора минут (не только часы)
2. **Time format customization**: Поддержка 12-hour AM/PM формата
3. **Quick presets**: Кнопки быстрого выбора (например, "9-17 рабочий день")
4. **Accessibility enhancements**: ARIA labels, screen reader support
5. **Animation customization**: Настройки скорости и типа scroll анимации

## Open Questions

~~Нет открытых вопросов — решение полностью специфицировано.~~

---

**Document Status**: ✅ Ready for Implementation  
**Last Updated**: 2026-01-06  
**Author**: AI Agent (Antigravity)
