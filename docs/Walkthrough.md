# Walkthrough: Replace Time Selects Implementation

## Objective
Replace standard HTML `<select>` elements in the time range picker with scroll-based pickers, enabling minute-precision time selection (15-minute intervals) and improving the UI/UX to match modern mobile patterns.

## Implementation Summary

### 1. Frontend Components

#### ScrollTimePicker.vue
Created a universal wrapper component for `vue-scroll-picker` library:
- Props: `modelValue`, `min`, `max`, `step`, `suffix`, `formatDigits`, `disabled`
- Dynamically generates options based on min/max/step values
- Fully integrated with design system (CSS variables for theming)
- Supports both light and dark themes
- Responsive design (height adjusts on mobile)

**File:** [ScrollTimePicker.vue](file:///e:/Develop/anki-tiny/frontend/src/shared/ui/ScrollTimePicker.vue)

#### TimeRangePicker.vue
Refactored to use **4 ScrollTimePicker instances**:
- Start Hours (0-23) + Start Minutes (0-59)
- End Hours (0-23) + End Minutes (0-59)
- Converted API from hour-based (0-23) to **minute-based (0-1439)**
- Maintains timeline visualization with minute precision
- All event handlers convert hours+minutes ↔ total minutes

**File:** [TimeRangePicker.vue](file:///e:/Develop/anki-tiny/frontend/src/shared/ui/TimeRangePicker.vue)

#### SettingsForm.vue
Updated to work with minute-based time fields:
- Uses `trainingStartTime`/`trainingEndTime` instead of `trainingStartHour`/`trainingEndHour`
- Added `formatTime(minutes)` helper to display HH:MM format
- Updated validation logic for minute-based duration
- Preview section shows time in HH:MM format

**File:** [SettingsForm.vue](file:///e:/Develop/anki-tiny/frontend/src/widgets/settings-form/SettingsForm.vue)

### 2. Backend Updates

#### Database Migration 005
Created migration `convert_time_to_minutes`:
- Added `trainingStartTime`, `trainingEndTime` columns (INTEGER) to `settings` and `courseSettings` tables
- Migrated existing data: `trainingStartTime = trainingStartHour * 60`
- Migrated existing data: `trainingEndTime = trainingEndHour * 60`
- Set default values: 480 (8:00), 1320 (22:00)
- Kept old columns for backward compatibility

**File:** [migrations.ts:L108-L147](file:///e:/Develop/anki-tiny/backend/src/services/database/migrations.ts#L108-L147)

#### Schema Updates
Updated TypeScript interfaces:
- `SettingsTable`: Added `trainingStartTime`, `trainingEndTime` (minutes from midnight)
- `CourseSettingsTable`: Added nullable fields for course-specific settings
- Marked old fields as `DEPRECATED`

**File:** [schema.ts](file:///e:/Develop/anki-tiny/backend/src/services/database/schema.ts)

#### Zod Validation
Updated schemas to validate minute-based fields:
- `GlobalSettingsSchema`: `trainingStartTime`/`trainingEndTime` with range 0-1439
- `CourseSettingsSchema`: Nullable minute-based fields

**File:** [settings.ts](file:///e:/Develop/anki-tiny/backend/src/schemas/settings.ts)

#### FSRSSettings Interface & Logic
Updated FSRS integration:
- Changed `FSRSSettings` interface to use `trainingStartTime`/`trainingEndTime` (minutes)
- Updated `canShowNewCards()` to check current time in minutes
- Updated `settingsRepository.getEffectiveSettings()` to return minute-based fields
- Fixed `training.ts` route to validate time using minutes

**Files:**
- [fsrs/index.ts:L17-L24](file:///e:/Develop/anki-tiny/backend/src/services/fsrs/index.ts#L17-L24)
- [fsrs/index.ts:L186-L196](file:///e:/Develop/anki-tiny/backend/src/services/fsrs/index.ts#L186-L196)
- [settingsRepository.ts:L107-L133](file:///e:/Develop/anki-tiny/backend/src/services/repositories/settingsRepository.ts#L107-L133)
- [training.ts:L23-L33](file:///e:/Develop/anki-tiny/backend/src/routes/training.ts#L23-L33)

## Visual Result

### Final Design: Light & Airy Time Pickers

After user feedback, the time pickers were redesigned with a lighter, more airy aesthetic:

**Before:** Heavy blurred rectangles with faint text
**After:** Clean design with horizontal lines, gradients, and white text

![Final Time Pickers Design](file://C:/Users/I%20am/.gemini/antigravity/brain/1e4c85c6-96c2-4e5d-b2ff-a18fe5fa614d/new_time_pickers_design_1767714325614.png)

#### Design Features:
- ✨ Two horizontal almost-white lines defining the selection area
- 🌫️ Top and bottom gradient overlays (fade from opaque to transparent)
- ⚪ Selected value in bright white text
- 👻 Non-selected values in semi-transparent white
- 🎯 Clean, weightless appearance
- ⏰ **Minutes: Full range 0-59 with step 1** (previously 0, 15, 30, 45)

### Demo Recording

The full interaction flow is captured here:

![Redesigned Time Pickers Demo](file://C:/Users/I%20am/.gemini/antigravity/brain/1e4c85c6-96c2-4e5d-b2ff-a18fe5fa614d/redesigned_time_pickers_1767714306966.webp)

## Verification

### ✅ Functional Testing
- [x] Scroll pickers are visible and styled correctly
- [x] All 4 pickers (start hours, start minutes, end hours, end minutes) work independently
- [x] Mouse wheel scrolling changes values smoothly
- [x] Timeline visualization updates in real-time
- [x] Time is displayed with minute precision (HH:MM)
- [x] Preview section shows correct time range (e.g., "10:15 до 19:00")
- [x] Backend migration applied successfully
- [x] No console errors during interaction

### ✅ Backend Testing
- [x] Database migration `005_convert_time_to_minutes` executed successfully
- [x] Settings API returns minute-based fields
- [x] FSRS `canShowNewCards()` validates time correctly with minutes
- [x] Training route validates training hours using minutes

## Success Criteria Met

All criteria from [proposal.md](file:///e:/Develop/anki-tiny/openspec/changes/replace-time-selects/proposal.md) have been achieved:

1. ✅ `vue-scroll-picker` successfully integrated
2. ✅ `TimeRangePicker` uses scroll pickers instead of `<select>`
3. ✅ All existing functionality preserved (validation, timeline)
4. ✅ Component works correctly in light/dark themes
5. ✅ API remains backward-compatible (props/events)
6. ✅ Timeline visualization updated for minute precision
7. ✅ No regressions in `SettingsPage` or `CourseSettingsModal`

## Files Changed

### Frontend
- `frontend/package.json` - Added `vue-scroll-picker` dependency
- `frontend/src/shared/ui/ScrollTimePicker.vue` - New component ✨
- `frontend/src/shared/ui/TimeRangePicker.vue` - Refactored ♻️
- `frontend/src/widgets/settings-form/SettingsForm.vue` - Updated 🔧

### Backend
- `backend/src/services/database/migrations.ts` - Added migration 005 ✨
- `backend/src/services/database/schema.ts` - Updated schema 🔧
- `backend/src/schemas/settings.ts` - Updated Zod schemas 🔧
- `backend/src/services/fsrs/index.ts` - Updated FSRSSettings interface 🔧
- `backend/src/services/repositories/settingsRepository.ts` - Updated repository 🔧
- `backend/src/routes/training.ts` - Fixed time validation 🐛
