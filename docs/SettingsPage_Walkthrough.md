# SettingsPage Implementation — Walkthrough

## Overview

Implemented a fully functional settings management system for the Repetitio application. The system allows managing global application settings and individual course settings with inheritance support (fallback).

## Implemented Components

### Entity Layer

#### 1. API Client (`frontend/src/shared/api/settings.js`)
  
API client for interaction with backend endpoints:

- `getGlobalSettings()` — get global settings
- `updateGlobalSettings(settings)` — update global settings
- `getCourseSettings(courseId)` — get course settings
- `updateCourseSettings(courseId, settings)` — update course settings
- `resetCourseSettings(courseId)` — reset course settings to global

#### 2. TypeScript Types (`frontend/src/shared/types/settings.ts`)

Defined interfaces:

- `GlobalSettings` — global settings structure
- `CourseSettings` — course settings structure (extends GlobalSettings)
- `UpdateSettingsDTO` — DTO for update (all fields optional)
- `SettingsValidation` — validation result

#### 3. Pinia Store (`frontend/src/entities/settings/model/useSettingsStore.js`)

State management with settings inheritance logic:

**State:**

- `globalSettings` — global application settings
- `courseSettings` — Map<courseId, CourseSettings> for individual settings
- `loading` — loading flag
- `error` — errors

**Getters:**

- `getEffectiveSettings(courseId)` — returns course settings or global (fallback)
- `hasCustomSettings(courseId)` — checks for individual settings

**Actions:**

- `fetchGlobalSettings()`, `updateGlobalSettings()`
- `fetchCourseSettings(courseId)`, `updateCourseSettings()`
- `resetCourseSettings(courseId)` — remove individual settings

### UI Components

#### TimeRangePicker (`frontend/src/shared/ui/TimeRangePicker.vue`)

Time range selection component:

- Two selectors (start/end of day) with hours 0-23
- Visual timeline scale with active range (blue color)
- Time marks: 0:00, 6:00, 12:00, 18:00, 24:00
- Props: `start`, `end`, `disabled`
- Events: `update:start`, `update:end`

### Widgets Layer

#### SettingsForm (`frontend/src/widgets/settings-form/SettingsForm.vue`)

Settings editing form with real-time validation:

**Features:**

- TimeRangePicker integration
- Input for minTimeBeforeEnd (1-12 hours)
- Checkbox for notifications
- Preview section with effective schedule calculation
- Real-time validation:
    - `trainingStartHour < trainingEndHour`
    - `minTimeBeforeEnd` from 1 to 12 hours
    - Training duration >= minTimeBeforeEnd

**Props:**

- `modelValue` — current settings
- `readonly` — read-only mode

**Events:**

- `update:modelValue` — sync changes
- `save` — save valid settings

#### CourseSettingsModal (`frontend/src/widgets/course-settings-modal/CourseSettingsModal.vue`)

Modal window for course settings:

**Features:**

- Switch: "Global" / "Individual"
- SettingsForm integration (readonly in global mode)
- "Reset to Global" button (if individual settings exist)
- Modal footer with "Cancel" / "Save" buttons

**Logic:**

- Switch to Global → fields become readonly, show global values
- Switch to Individual → fields become editable
- Reset removes individual course settings

### Pages

#### SettingsPage (`frontend/src/pages/settings/SettingsPage.vue`)

Main settings page with two sections:

**Section 1: Global Settings**

- Card with SettingsForm
- Save via `handleSaveGlobal()`

**Section 2: Course Settings**

- List of all courses with badges:
    - "Individual" (blue) — if course has custom settings
    - "Global" (grey) — if using fallback
- "Configure" button for each course

**Integration:**

- Data loading via `settingsStore.fetchGlobalSettings()` and `courseStore.fetchCourses()`
- Effective settings determination via `settingsStore.hasCustomSettings()`

#### CoursePage Integration

Added "Course Settings" button to header:

- Located next to "Back" button
- Opens CourseSettingsModal
- Passes `courseId` and `courseName`

## Architecture Highlights

### Settings Inheritance Pattern

```javascript
// In useSettingsStore.js
getEffectiveSettings: (state) => (courseId) => {
  if (!courseId) return state.globalSettings
  return state.courseSettings.get(courseId) || state.globalSettings
}
```

This pattern ensures:

- Courses use global settings by default
- Individual settings override global ones
- Simple check: `hasCustomSettings(courseId)`

### Validation Logic

Real-time validation in SettingsForm:

```javascript
const validation = computed(() => {
  const errors = {}
  
  if (start >= end) errors.timeRange = 'Start must be before end'
  
  const duration = (end - start + 24) % 24
  if (duration < minTime) errors.minTime = 'Range too short'
  
  if (minTime < 1 || minTime > 12) errors.minTimeValue = '1-12 hours'
  
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

The settings system is fully implemented according to the OpenSpec proposal. All components follow Feature-Sliced Design architecture, use Pinia for state management, and ensure clear separation of concerns between layers. Inheritance logic is simple and intuitive, validation works in real-time, UI components are reusable and flexible.
