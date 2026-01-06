# Tasks: Add Settings Page

## Phase 1: Entity Layer (Foundation)

- [x] **1.1 Create API Client**
    - File: `frontend/src/shared/api/settings.js`
    - Methods: `getGlobalSettings`, `updateGlobalSettings`, `getCourseSettings`, `updateCourseSettings`, `resetCourseSettings`
    - Error handling for 400, 404, 500 responses
    - **Validation:** API returns expected data structures

- [x] **1.2 Define TypeScript Types**
    - File: `frontend/src/shared/types/settings.ts`
    - Interfaces: `GlobalSettings`, `CourseSettings`, `UpdateSettingsDTO`, `SettingsValidation`
    - **Validation:** No TypeScript compilation errors

- [x] **1.3 Implement Pinia Store**
    - File: `frontend/src/entities/settings/model/useSettingsStore.js`
    - State: `globalSettings`, `courseSettings` (Map)
    - Getters: `getEffectiveSettings(courseId)`, `hasCustomSettings(courseId)`
    - Actions: fetch, update, reset for both global and course settings
    - **Validation:** Store methods return correct fallback values

## Phase 2: Shared UI Components

- [x] **2.1 Create TimeRangePicker Component**
    - File: `frontend/src/shared/ui/TimeRangePicker.vue`
    - Features: Two selects (start/end hour), visual timeline representation
    - Props: `start`, `end`, `disabled`
    - Emits: `update:start`, `update:end`
    - **Validation:** Component updates reactive values correctly

- [x] **2.2 Extend Input Component (if needed)**
    - Check if existing `Input.vue` supports number type with min/max
    - Add support if missing
    - **Validation:** Number inputs enforce bounds

## Phase 3: Widgets Layer

- [x] **3.1 Create SettingsForm Widget**
    - File: `frontend/src/widgets/settings-form/SettingsForm.vue`
    - Features: All settings fields, real-time validation, preview section
    - Props: `modelValue`, `readonly`
    - Emits: `update:modelValue`, `save`
    - Validation logic: time ranges, minTimeBeforeEnd bounds
    - **Validation:** Form prevents saving invalid data

- [x] **3.2 Create CourseSettingsModal Widget**
    - File: `frontend/src/widgets/course-settings-modal/CourseSettingsModal.vue`
    - Features: Toggle (global/custom), SettingsForm integration, reset button
    - Props: `show`, `courseId`, `courseName`
    - Emits: `close`, `saved`
    - **Validation:** Modal correctly saves/resets course settings

## Phase 4: Pages Integration

- [x] **4.1 Create SettingsPage**
    - File: `frontend/src/pages/settings/SettingsPage.vue`
    - Sections: Global settings, Course-specific settings list
    - Features: Loading states, error handling, success notifications
    - Integration with SettingsForm and useSettingsStore
    - **Validation:** Page loads and displays existing settings

- [x] **4.2 Update CoursePage (Add Settings Button)**
    - File: `frontend/src/pages/course/CoursePage.vue`
    - Add "Course Settings" button in header
    - Integrate CourseSettingsModal
    - **Validation:** Modal opens and closes correctly from course page

- [x] **4.3 Verify Router Configuration**
    - Check `/settings` route exists in `frontend/src/app/router/index.js`
    - Add route if missing
    - **Validation:** Navigation to `/settings` works

## Phase 5: Testing & Verification

- [x] **5.1 Backend API Verification**
    - Test all endpoints via DevTools Console or Postman
    - Verify responses match expected schemas
    - Test validation errors (invalid time ranges)
    - **Validation:** All 5 API endpoints return correct data

- [x] **5.2 Frontend Manual Testing**
    - Create and save global settings
    - Create custom settings for a course
    - Reset course settings to global
    - Verify validation prevents invalid inputs
    - Test across different courses
    - **Validation:** All user flows work without errors

- [x] **5.3 Code Quality Checks**
    - Run `npm run lint --workspace=frontend`
    - Fix all ESLint errors/warnings
    - Run TypeScript compilation check
    - **Validation:** No lint or TS errors

## Phase 6: Documentation

- [x] **6.1 Update Task.md**
    - Mark SettingsPage tasks as complete in `docs/Task.md`
    - Update current status section

- [x] **6.2 Create Walkthrough**
    - File: `docs/SettingsPage_Walkthrough.md`
    - Document all created components, architecture decisions, testing results

- [x] **6.3 Update Changelog**
    - Add entry to `docs/Changelog.md`
    - Include version bump, feature description, technical details

## Dependencies

Each phase should be completed sequentially. Key dependencies:

- Phase 2 depends on Phase 1 (types must exist)
- Phase 3 depends on Phase 2 (UI components must exist)
- Phase 4 depends on Phase 3 (widgets must exist)
- Phase 5 can start after Phase 4.1 (partial testing possible)

## Rollback Plan

If critical issues found during testing:

1. Revert CoursePage changes (Phase 4.2)
2. Remove SettingsPage route
3. Keep entity layer and widgets (don't delete, just disable)
4. Document issues for future retry
