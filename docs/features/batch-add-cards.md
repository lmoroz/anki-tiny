# Batch Card Addition

## Overview

Added functionality for batch adding cards via a textarea in the `QuickAddCard.vue` component.

## What's Changed

### Component: `frontend/src/widgets/quick-add-card/QuickAddCard.vue`

**New capabilities:**

1. **Mode Switcher** — user can choose between two modes:
   - **"Single Card"** — original functionality for quickly adding one card via two fields (front/back).
   - **"Batch Add"** — new mode for batch importing cards via textarea.

2. **Input format for batch addition:**

   ```text
   question | answer
   ```

   - Each line — new card
   - Text before `|` — front side
   - Text after `|` — back side

3. **Validation:**
   - Checks for existence of separator `|` in each line
   - Checks that separator `|` occurs exactly once
   - Checks for empty front/back values
   - Informative error messages indicating line number

4. **UI Improvements:**
   - Modern mode switcher with active state
   - Auto-height textarea (10 rows)
   - Info tooltip with input format
   - Responsive design for mobile devices

## Technical Details

### New Functions

- `parseBatchInput(text)` — parses textarea into array of `{front, back}[]` objects
- `validateBatchInput()` — validates batch form input data
- `handleBatchAdd()` — handles batch card addition
- `switchMode(newMode)` — switches between modes clearing errors

### Processing Logic

1. User enters cards in `question | answer` format (each line is a new card).
2. Clicking "Add All Cards" triggers validation.
3. If validation succeeds, each card is sent via existing `@added` emit.
4. 50ms delay added between card submissions for smoothness.
5. Textarea is cleared after successful addition.

### Usage Example

**Input:**

```text
bows | bOws
beard | bEard
accountants | accOuntants
denomination | denomiNation
citizenship | citiZenship
hyphen | hyPhen
```

**Result:**

- 6 cards created
- Each card saved to DB
- UI updates automatically via store

## Compatibility

- Fully backward compatible with existing API
- Uses existing `@added` emit mechanism
- Requires no backend changes
- Requires no `CoursePage.vue` changes

## Benefits

✅ Accelerates card creation process for mass input  
✅ Convenient for importing learning materials  
✅ Intuitive `question | answer` format  
✅ Detailed validation with clear error messages  
✅ Adaptive design  
✅ Preserves existing functionality
