# Tasks: replace-time-selects

## Implementation Checklist

- [x] **Task 1: Install vue-scroll-picker dependency**
  - Add `vue-scroll-picker` to `frontend/package.json`
  - Run `npm install` in frontend workspace
  - Verify package installation and version compatibility
  - **Important**: Package includes CSS файл `vue-scroll-picker/style.css` который нужно импортировать
  - **Validation:** Check `package-lock.json` for correct version

- [x] **Task 2: Create ScrollTimePicker wrapper component**
  - Create `frontend/src/shared/ui/ScrollTimePicker.vue`
  - Import: `import { VueScrollPicker } from 'vue-scroll-picker'`
  - Import CSS: `import 'vue-scroll-picker/style.css'`
  - Implement **universal** wrapper with props: `modelValue`, `min`, `max`, `step`, `suffix`, `formatDigits`, `disabled`
  - Implement computed `options` array generator:

    ```js
    const options = computed(() => {
      const result = [];
      for (let i = props.min ?? 0; i <= (props.max ?? 23); i += props.step ?? 1) {
        result.push({
          name: i.toString().padStart(props.formatDigits ?? 2, "0") + (props.suffix || ""),
          value: i,
        });
      }
      return result;
    });
    ```

  - Test cases: hours (0-23), minutes all (0-59), minutes with step (0, 15, 30, 45)
  - Apply design system styles using CSS variables
  - **Validation:** Test with different configurations (hours, minutes with step 5, minutes with step 15)

- [x] **Task 3: Backend database migration and API updates**
  - **Database migration**: Create new migration to alter Settings tables
    - Add columns: `trainingStartTime INTEGER`, `trainingEndTime INTEGER`
    - Migrate existing data: `trainingStartTime = trainingStartHour * 60`, `trainingEndTime = trainingEndHour * 60`
    - Drop old columns: `trainingStartHour`, `trainingEndHour` (after migration)
  - **Update Zod schemas** (`backend/src/schemas/settings.ts`):
    - Replace `trainingStartHour: z.number().min(0).max(23)`
    - With `trainingStartTime: z.number().min(0).max(1439)` (minutes)
  - **Update TypeScript types** (`SettingsTable` interface)
  - **Validation:** Run migrations on test database, verify data integrity

- [x] **Task 4: Refactor TimeRangePicker to use 4 ScrollTimePickers**
  - Replace `<select>` elements with `<ScrollTimePicker>` in `TimeRangePicker.vue`
  - Maintain existing props: `start`, `end`, `disabled`
  - Maintain existing events: `update:start`, `update:end`
  - Preserve visual timeline component and logic
  - Update component layout to accommodate new picker UI
  - **Validation:** Verify API compatibility — component should work as drop-in replacement

- [x] **Task 4: Style integration with design system**
  - Apply light/dark theme CSS variables to `ScrollTimePicker`
  - Match visual style with existing Input/Select components
  - Ensure proper hover, focus, and disabled states
  - Add smooth transitions for scroll interactions
  - **Validation:** Test in both light and dark themes in SettingsPage

- [x] **Task 5: Integration testing in SettingsForm**
  - Open SettingsPage and test global settings
  - Verify time selection works correctly
  - Confirm validation logic still triggers (start < end)
  - Test visual timeline updates properly
  - **Validation:** No console errors, all interactions work smoothly

- [x] **Task 6: Integration testing in CourseSettingsModal**
  - Open course settings modal from CoursePage
  - Test time selection in custom settings mode
  - Verify save/cancel functionality
  - Confirm disabled state works when using global settings
  - **Validation:** Modal behavior unchanged, settings save correctly

- [x] **Task 7: Cross-browser and responsive testing**
  - Test on different screen sizes (desktop, tablet, mobile emulation)
  - Verify touch interactions work properly
  - Check keyboard navigation (Tab, Arrow keys if supported)
  - Test in Electron environment
  - **Validation:** Component works consistently across contexts

- [x] **Task 8: Code cleanup and documentation**
  - Remove unused code from old `<select>` implementation
  - Add JSDoc comments to `ScrollTimePicker.vue` if needed
  - Update any relevant inline comments
  - Run linter and fix any issues
  - **Validation:** `npm run lint` passes without errors

## Dependencies

- Task 2 depends on Task 1 (package must be installed first)
- Task 3 depends on Task 2 (wrapper component must exist)
- Task 4 can run in parallel with Task 3
- Tasks 5, 6, 7 depend on Tasks 3 and 4 (implementation complete)
- Task 8 depends on all previous tasks

## Parallelization Opportunities

- Tasks 1 and 2 can be done sequentially in rapid succession
- Task 4 (styling) can be started immediately after Task 2 structure is created
- Tasks 5, 6, 7 (testing) can be executed in any order after implementation complete
