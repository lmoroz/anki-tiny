# Walkthrough: Batch Card Delete Implementation

## Session Date: 2026-01-07

## Objective

Implement batch card deletion feature according to OpenSpec proposal `add-batch-card-delete`.

## Implementation Summary

### Backend Implementation ✅

#### 1. Card Repository (`backend/src/services/repositories/cardRepository.ts`)
- Added `deleteCardsBatch(ids: number[], courseId: number): Promise<number>`
  - Uses SQL WHERE IN clause for efficient batch deletion
  - Validates that cards belong to the specified course
  - Returns count of deleted cards via `numDeletedRows`
- Added `deleteAllCards(courseId: number): Promise<number>`
  - Single DELETE query for all course cards
  - Returns deletion count

#### 2. Validation Schema (`backend/src/schemas/card.ts`)
- Created `BatchDeleteSchema` using Zod
  - Validates array of positive integers
  - Min: 1 card, Max: 100 cards per batch
  - Prevents empty requests and protects against excessive load
- Added TypeScript type: `BatchDeleteInput`

#### 3. API Routes (`backend/src/routes/cards.ts`)
- **DELETE /api/courses/:courseId/cards/batch**
  - Request body: `{ cardIds: number[] }`
  - Validates courseId and cardIds array
  - Returns: `{ success: true, deletedCount: number }`
  - Error handling: 400 for validation, 404 for missing course, 500 for server errors
- **DELETE /api/courses/:courseId/cards**
  - No request body required
  - Deletes all cards for the course
  - Returns: `{ success: true, deletedCount: number }`

### Frontend Implementation ✅

#### 1. CardCheckbox Component (`frontend/src/shared/ui/CardCheckbox.vue`)
- **Initial version**: Used TypeScript syntax (incorrect for this project)
- **Fixed version**: Converted to JavaScript with prop definitions
- **Design**:
  - 20x20px custom checkbox (not native HTML checkbox)
  - Border: 2px solid with theme variable
  - Checked state: gradient background `linear-gradient(135deg, var(--color-primary), var(--color-accent))`
  - Bootstrap Icons check mark when selected
  - Smooth 200ms transition
  - ARIA attributes: `role="checkbox"`, `aria-checked`, `aria-label`
  - Keyboard support: Space key toggles selection
  - Dark theme compatible via CSS variables

**Issues Fixed**:
- Removed `lang="ts"` attribute
- Removed i18n `$t()` call (not used in project)
- Changed to standard JavaScript prop definitions

#### 2. CardItem Component (`frontend/src/widgets/card-list/CardItem.vue`)
- **New Props**:
  - `selectionMode: Boolean` - indicates if selection mode is active
  - `selected: Boolean` - indicates if this card is selected
- **New Emit**: `toggle-select` - emitted when card clicked in selection mode
- **Conditional Rendering**:
  - Selection mode: Shows checkbox in top-right corner
  - Normal mode: Shows Edit/Delete buttons
- **Click Handler**:
  - Selection mode: Toggles selection instead of flipping card
  - Normal mode: Flips card to show answer
- **Visual Feedback**:
  - Selected cards: `opacity: 0.6` with 200ms transition
  - Maintains all other card styling

#### 3. CardList Component (`frontend/src/widgets/card-list/CardList.vue`)
- **New Props**:
  - `selectionMode: Boolean` - passed through to CardItem
  - `selectedIds: Set` - set of selected card IDs for O(1) lookup
- **New Emit**: `toggle-select` - bubbles up from CardItem
- **Pass-through**: Binds selection props to each CardItem instance

#### 4. CoursePage Component (`frontend/src/pages/course/CoursePage.vue`)

**State Management**:
```javascript
const isSelectionMode = ref(false)
const selectedCardIds = ref(new Set())
```

**Event Handlers**:
- `handleToggleCardSelection(card)` - adds/removes card ID from Set, forces reactivity
- `handleBatchDelete()` - confirms with user, calls store method, exits selection mode
- `handleDeleteAllCards()` - double confirmation, deletes all cards
- `exitSelectionMode()` - resets mode and clears selection

**UI Components Added**:

*Desktop (Right Column Header)*:
- "Clear" button (red, only when cards exist and not in selection mode)
- "Select" button (enters selection mode)
- Selection mode buttons:
  - "Delete (N)" button (disabled when N=0)
  - "Cancel" button
- "Create Card" button (hidden in selection mode)

*Mobile (Slide-out Panel Header)*:
- Same button set as desktop
- Responsive layout with flexbox
- Buttons adapt to smaller screen

#### 5. API Client (`frontend/src/shared/api/cards.js`)
- `deleteBatch(courseId, cardIds)` - DELETE request with data payload
- `deleteAll(courseId)` - DELETE request, no body

#### 6. Card Store (`frontend/src/entities/card/model/useCardStore.js`)
- `deleteBatchCards(ids, courseId)`:
  - Calls API batch delete
  - Filters out deleted cards from local state
  - Fetches fresh course stats
  - Returns deleted count
- `deleteAllCards(courseId)`:
  - Calls API delete all
  - Clears local card array
  - Fetches fresh course stats
  - Returns deleted count

### User Improvements Made

During implementation, user made several UX improvements:
1. Changed mobile panel header padding from `pt-[60px]` to `py-[6px]`
2. Added `mr-auto` to section title for better spacing
3. Made "Clear" button ghosted (less prominent)
4. Changed button text "Создать карточку" → "Создать" (shorter for mobile)
5. Fixed mobile panel animations with `opacity` transition
6. Improved pointer events handling for backdrop
7. Changed `else` to `else-if` for clearer conditionals

### Testing Results ✅

User has tested and verified:
- ✅ Single card selection
- ✅ Multiple card selection
- ✅ Batch deletion of selected cards
- ✅ Delete all cards functionality
- ✅ Statistics update after deletion
- ✅ Mobile panel functionality
- ✅ Checkbox visual appearance in dark theme
- ✅ Opacity animation on selection
- ✅ ARIA labels accessibility
- ✅ Delete count accuracy

### OpenSpec Workflow ✅

1. **Implementation**: `/openspec-apply add-batch-card-delete`
   - All 30+ tasks completed
   - Backend and frontend fully implemented
   - No lint errors

2. **Archival**: `/openspec-archive add-batch-card-delete`
   - Change archived as `2026-01-07-add-batch-card-delete`
   - Spec `course-ui` updated with +3 requirements
   - All specs validation passed

3. **Documentation**: `Changelog.md` updated with v0.4.6 entry

## Files Modified

### Backend (3 files)
1. `backend/src/services/repositories/cardRepository.ts` - added 2 methods
2. `backend/src/routes/cards.ts` - added 2 endpoints
3. `backend/src/schemas/card.ts` - added validation schema

### Frontend (6 files)
1. `frontend/src/shared/ui/CardCheckbox.vue` - **NEW** component
2. `frontend/src/widgets/card-list/CardItem.vue` - selection mode support
3. `frontend/src/widgets/card-list/CardList.vue` - prop pass-through
4. `frontend/src/pages/course/CoursePage.vue` - state management and UI
5. `frontend/src/shared/api/cards.js` - API methods
6. `frontend/src/entities/card/model/useCardStore.js` - store actions

### Documentation (2 files)
1. `docs/Changelog.md` - added v0.4.6 entry
2. `openspec/changes/add-batch-card-delete/tasks.md` - all tasks marked complete

## Key Technical Decisions

1. **Set for selectedCardIds**: O(1) operations for add/delete/has
2. **Transactional deletion**: Backend uses SQL transactions (implicit in SQLite)
3. **Custom checkbox**: Not native HTML for full design control
4. **Gradient styling**: Uses CSS variables for theme compatibility
5. **Confirmation dialogs**: Standard browser confirm() - simple and reliable
6. **No optimistic updates**: Wait for server confirmation before UI update
7. **Force reactivity**: `selectedCardIds.value = new Set(selectedCardIds.value)` after mutation

## Code Quality

- ✅ No TypeScript in frontend (JavaScript only)
- ✅ No i18n calls (not implemented in project)
- ✅ Consistent code style (else formatting)
- ✅ ARIA labels for accessibility
- ✅ Keyboard navigation support
- ✅ CSS variables for theming
- ✅ Proper error handling in API calls
- ✅ State synchronization between local and server

## Conclusion

The batch card delete feature has been successfully implemented according to the OpenSpec proposal. All functionality works on both desktop and mobile layouts, with proper accessibility, error handling, and visual feedback.
