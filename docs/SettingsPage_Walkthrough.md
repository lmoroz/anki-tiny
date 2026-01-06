# SettingsPage Implementation — Walkthrough

## Overview

Реализована полнофункциональная система управления настройками для приложения Repetitio. Система позволяет управлять глобальными настройками приложения и настройками отдельных курсов с поддержкой наследования (fallback).

## Implemented Components

### Entity Layer

#### 1. API Client (`frontend/src/shared/api/settings.js`)
  
API клиент для взаимодействия с backend endpoints:

- `getGlobalSettings()` — получение глобальных настроек
- `updateGlobalSettings(settings)` — обновление глобальных настроек
- `getCourseSettings(courseId)` — получение настроек курса
- `updateCourseSettings(courseId, settings)` — обновление настроек курса
- `resetCourseSettings(courseId)` — сброс настроек курса к глобальным

#### 2. TypeScript Types (`frontend/src/shared/types/settings.ts`)

Определены интерфейсы:

- `GlobalSettings` — структура глобальных настроек
- `CourseSettings` — структура настроек курса (extends GlobalSettings)
- `UpdateSettingsDTO` — DTO для обновления (все поля optional)
- `SettingsValidation` — результат валидации настроек

#### 3. Pinia Store (`frontend/src/entities/settings/model/useSettingsStore.js`)

State management с логикой наследования настроек:

**State:**
- `globalSettings` — глобальные настройки приложения
- `courseSettings` — Map<courseId, CourseSettings> для индивидуальных настроек
- `loading` — флаг загрузки
- `error` — ошибки

**Getters:**
- `getEffectiveSettings(courseId)` — возвращает настройки курса или глобальные (fallback)
- `hasCustomSettings(courseId)` — проверяет наличие индивидуальных настроек

**Actions:**
- `fetchGlobalSettings()`, `updateGlobalSettings()`
- `fetchCourseSettings(courseId)`, `updateCourseSettings()`
- `resetCourseSettings(courseId)` — удаление индивидуальных настроек

### UI Components

#### TimeRangePicker (`frontend/src/shared/ui/TimeRangePicker.vue`)

Компонент выбора временного диапазона:

- Два селектора (начало/конец дня) с часами от 0 до 23
- Визуальная timeline шкала с активным диапазоном (синий цвет)
- Метки времени: 0:00, 6:00, 12:00, 18:00, 24:00
- Props: `start`, `end`, `disabled`
- Events: `update:start`, `update:end`

### Widgets Layer

#### SettingsForm (`frontend/src/widgets/settings-form/SettingsForm.vue`)

Форма редактирования настроек с real-time validation:

**Features:**
- Интеграция TimeRangePicker для временного диапазона
- Input для minTimeBeforeEnd (1-12 часов)
- Checkbox для уведомлений
- Preview секция с расчетом эффективного расписания
- Real-time валидация:
  - `trainingStartHour < trainingEndHour`
  - `minTimeBeforeEnd` от 1 до 12 часов
  - Диапазон тренировок >= minTimeBeforeEnd

**Props:**
- `modelValue` — текущие настройки
- `readonly` — режим только для чтения

**Events:**
- `update:modelValue` — синхронизация изменений
- `save` — сохранение валидных настроек

#### CourseSettingsModal (`frontend/src/widgets/course-settings-modal/CourseSettingsModal.vue`)

Модальное окно для настроек курса:

**Features:**
- Переключатель: "Глобальные" / "Индивидуальные"
- Интеграция SettingsForm (readonly в режиме глобальных)
- Кнопка "Сбросить к глобальным" (если есть индивидуальные)
- Modal footer с кнопками "Отмена" / "Сохранить"

**Logic:**
- При переключении на глобальные → поля становятся readonly, показывают глобальные значения
- При переключении на индивидуальные → поля становятся editable
- Reset удаляет индивидуальные настройки курса

### Pages

#### SettingsPage (`frontend/src/pages/settings/SettingsPage.vue`)

Главная страница настроек с двумя секциями:

**Section 1: Глобальные настройки**
- Card с SettingsForm
- Сохранение через `handleSaveGlobal()`

**Section 2: Настройки курсов**
- Список всех курсов с badges:
  - "Индивидуальные" (синий) — если курс имеет custom settings
  - "Глобальные" (серый) — если использует fallback
- Кнопка "Настроить" для каждого курса

**Integration:**
- Загрузка данных через `settingsStore.fetchGlobalSettings()` и `courseStore.fetchCourses()`
- Определение эффективных настроек через `settingsStore.hasCustomSettings()`

#### CoursePage Integration

Добавлена кнопка "Настройки курса" в header:

- Расположена рядом с кнопкой "Назад"
- Открывает CourseSettingsModal
- Передает `courseId` и `courseName`

## Architecture Highlights

### Settings Inheritance Pattern

```javascript
// В useSettingsStore.js
getEffectiveSettings: (state) => (courseId) => {
  if (!courseId) return state.globalSettings
  return state.courseSettings.get(courseId) || state.globalSettings
}
```

Паттерн обеспечивает:
- Курсы по умолчанию используют глобальные настройки
- Индивидуальные настройки переопределяют глобальные
- Простой способ проверки: `hasCustomSettings(courseId)`

### Validation Logic

Real-time валидация в SettingsForm:

```javascript
const validation = computed(() => {
  const errors = {}
  
  if (start >= end) errors.timeRange = 'Начало должно быть раньше конца'
  
  const duration = (end - start + 24) % 24
  if (duration < minTime) errors.minTime = 'Диапазон слишком короткий'
  
  if (minTime < 1 || minTime > 12) errors.minTimeValue = '1-12 часов'
  
  return { isValid: Object.keys(errors).length === 0, errors }
})
```

## Testing Summary

### Code Quality
- ✅ ESLint passed (`npm run lint --workspace=frontend`)
- ✅ No TypeScript compilation errors
- ✅ All imports use `@` alias (no relative paths)
- ✅ Vue components auto-imported (unplugin-vue-components)

### Manual Testing Checklist

**Backend API** (to be tested):
- [ ] GET `/api/settings` — returns global settings
- [ ] PUT `/api/settings` — updates global settings
- [ ] GET `/api/courses/:id/settings` — returns course settings or 404
- [ ] PUT `/api/courses/:id/settings` — creates/updates course settings
- [ ] DELETE `/api/courses/:id/settings` — removes course settings

**Frontend Flows** (to be tested):
- [ ] SettingsPage displays global settings
- [ ] Can edit and save global settings
- [ ] Course list shows correct badges (Global/Custom)
- [ ] Can open CourseSettingsModal from SettingsPage
- [ ] Can open CourseSettingsModal from CoursePage
- [ ] Can create custom settings for a course
- [ ] Can edit existing custom settings
- [ ] Can reset custom settings to global
- [ ] Validation prevents saving invalid data
- [ ] Preview section calculates schedule correctly

## Files Created

1. `frontend/src/shared/api/settings.js` — 31 lines
2. `frontend/src/shared/types/settings.ts` — 28 lines
3. `frontend/src/entities/settings/model/useSettingsStore.js` — 115 lines
4. `frontend/src/shared/ui/TimeRangePicker.vue` — 140 lines
5. `frontend/src/widgets/settings-form/SettingsForm.vue` — 232 lines
6. `frontend/src/widgets/course-settings-modal/CourseSettingsModal.vue` — 185 lines
7. `frontend/src/pages/settings/SettingsPage.vue` — 220 lines (updated)

**Files Modified:**
8. `frontend/src/pages/course/CoursePage.vue` — added CourseSettingsModal integration

**Total:** ~951 lines of Vue/JS/TS code

## Next Steps

1. **Backend API Testing** — verify all 5 endpoints work correctly
2. **Frontend Manual Testing** — complete testing checklist
3. **Documentation** — update main project docs (readme.md, Changelog.md)
4. **OpenSpec Archive** — archive this change after deployment

## Known Limitations

- Backend API endpoints are assumed to exist and match expected schemas (not verified in this walkthrough)
- Manual testing not yet performed (Phase 5.1, 5.2 pending)
- No automated unit tests for new components yet
- CourseSettingsModal currently only accessible from SettingsPage and CoursePage (could be extended to other locations)

## Conclusion

Система настроек полностью реализована в соответствии с OpenSpec proposal. Все компоненты следуют Feature-Sliced Design архитектуре, используют Pinia для state management, и обеспечивают четкое разделение ответственности между слоями. Логика наследования настроек проста и интуитивна, валидация работает в real-time, UI компоненты переиспользуемые и гибкие.
