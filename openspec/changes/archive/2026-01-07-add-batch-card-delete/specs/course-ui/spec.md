# course-ui Spec Delta

## ADDED Requirements

### Requirement: Batch Card Delete

The system SHALL provide a selection mode for cards with the ability to delete multiple cards in a single operation.

**Rationale**: Deleting cards one by one is inefficient when users need to remove multiple outdated or incorrect cards from a course.

#### Scenario: Entering Selection Mode

- **GIVEN** user is viewing the course page with cards
- **WHEN** user clicks the "Выбрать карточки" button
- **THEN**:
  - Selection mode is activated (`isSelectionMode = true`)
  - All cards display checkboxes in the upper right corner (replacing Edit/Delete buttons)
  - Cards no longer flip when clicked
  - UI shows "Удалить выбранные (0)" button (disabled)
  - UI shows "Отменить" button
- **AND** the button labeled "Выбрать карточки" is hidden
- **AND** the "Create Card" button remains visible

#### Scenario: Selecting Cards

- **GIVEN** selection mode is active
- **WHEN** user clicks on a card
- **THEN**:
  - Card is toggled between selected/unselected state
  - Selected card has `opacity: 0.6`
  - Checkbox shows checked state (gradient background with checkmark icon)
  - Counter in "Удалить выбранные (N)" button updates
- **AND** clicking the checkbox itself also toggles selection
- **AND** card does NOT flip to show the answer

#### Scenario: Deleting Selected Cards

- **GIVEN** selection mode is active, 3 cards are selected
- **WHEN** user clicks "Удалить выбранные (3)" button
- **THEN**:
  - Browser confirmation dialog appears: `Удалить выбранные карточки (3)?`
- **WHEN** user confirms deletion
- **THEN**:
  - Backend API `DELETE /api/courses/:courseId/cards/batch` is called with `{ cardIds: [1, 2, 3] }`
  - Cards are removed from the UI
  - Selection mode is exited (`isSelectionMode = false`)
  - Selected card IDs are cleared
  - Course statistics are updated
- **AND** if deletion fails, error is shown and selection mode remains active

#### Scenario: Exiting Selection Mode

- **GIVEN** selection mode is active
- **WHEN** user clicks "Отменить" button
- **THEN**:
  - Selection mode is deactivated (`isSelectionMode = false`)
  - Checkboxes are hidden
  - Edit/Delete buttons reappear on cards
  - Cards flip normally on click
  - Selected card IDs are cleared
- **AND** opacity of previously selected cards returns to normal

---

### Requirement: Delete All Cards

The system SHALL provide a "Delete All Cards" action to remove all cards from a course in a single operation.

**Rationale**: Users may need to completely clear a course to start over or remove test data.

#### Scenario: Accessing Delete All Cards

- **GIVEN** user is viewing the course page
- **WHEN** user views the cards section header or course actions menu
- **THEN**:
  - "Удалить все карточки" button is visible
  - Button has `bi-trash3` icon
  - Button has `danger` variant styling

#### Scenario: Deleting All Cards

- **GIVEN** course has 50 cards
- **WHEN** user clicks "Удалить все карточки" button
- **THEN**:
  - Confirmation dialog appears: `Вы уверены, что хотите удалить ВСЕ карточки курса (50)?\n\nЭто действие необратимо!`
- **WHEN** user confirms deletion
- **THEN**:
  - Backend API `DELETE /api/courses/:courseId/cards` is called
  - All cards are removed from the UI
  - Course statistics show 0 cards
  - Empty state message is displayed
- **AND** if deletion fails, error notification is shown

---

### Requirement: Custom Checkbox Component

The system SHALL provide a custom checkbox component for card selection with consistent styling across light and dark themes.

**Rationale**: Native browser checkboxes do not match the application's design system and may render inconsistently across platforms.

#### Scenario: Unchecked Checkbox Display

- **GIVEN** custom checkbox is rendered in unchecked state
- **WHEN** checkbox is displayed
- **THEN**:
  - Checkbox is 20x20px square
  - Border is 2px solid using `var(--color-border)`
  - Border radius is 4px
  - Background is transparent
  - Cursor is `pointer` on hover

#### Scenario: Checked Checkbox Display

- **GIVEN** custom checkbox is rendered in checked state
- **WHEN** checkbox is displayed
- **THEN**:
  - Background is gradient from `var(--color-primary)` to `var(--color-accent)`
  - Border color changes to `var(--color-primary)`
  - White checkmark icon (`bi-check`, 14px) is centered
  - Transition animation is smooth (200ms ease)

#### Scenario: Checkbox in Dark Theme

- **GIVEN** application is in dark theme
- **WHEN** checkbox is rendered (checked or unchecked)
- **THEN**:
  - Border color uses theme-specific `var(--color-border)` value
  - Gradient colors use theme-specific `var(--color-primary)` and `var(--color-accent)`
  - Checkbox remains clearly visible and accessible

---

## MODIFIED Requirements

### Requirement: Enhanced Card Statistics

The system SHALL display comprehensive FSRS algorithm statistics (stability, difficulty, reps, lapses) and timestamps (created, last review, due) on each card item for full transparency of the learning process.

**Rationale**: Users should understand how the algorithm evaluates their progress. Hidden metrics (stability, difficulty, reps, lapses) reduce trust in the system.

#### Scenario: Displaying Card Statistics

- **GIVEN** user views the card list
- **WHEN** CardItem is rendered
- **THEN** on the front side of the card, the following is displayed:
  - State badge (existing): "New", "Learning", "Review", "Relearning"
  - FSRS metrics (new, inline with icons):
    - Stability: `bi-graph-up` icon + value (1 decimal, e.g. "3.5")
    - Difficulty: `bi-speedometer2` icon + value (1 decimal, e.g. "6.2")
    - Reps: `bi-arrow-repeat` icon + value (integer, e.g. "12")
    - Lapses: `bi-x-circle` icon + value (integer, e.g. "2")
  - Time stamps (new + existing due):
    - Due date: `bi-calendar3` + "Next: [formatted date]"
    - Last review: `bi-clock-history` + "Last: [relative time]" (if available)
    - Created at: `bi-plus-circle` + "Created: [formatted date]"
- **AND** all 8 statistics elements are visible on the front side of the card
- **AND** icons use Bootstrap Icons according to mapping in design.md
- **AND** tooltips show full description on hover
- **AND** values are correctly formatted:
  - Dates: `toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })`
  - Relative time: "Today", "Yesterday", "2 days ago"
  - If `lastReview` null → do not display "Last: ..." string

#### Scenario: Card Actions in Normal Mode

- **GIVEN** user is NOT in selection mode
- **WHEN** card is displayed
- **THEN**:
  - Edit button (pencil icon) is visible in the upper right corner
  - Delete button (trash icon) is visible in the upper right corner
  - Both buttons are initially hidden (opacity 0)
  - Both buttons become visible on card hover
- **AND** clicking Edit button opens card editor modal
- **AND** clicking Delete button shows confirmation and deletes card

#### Scenario: Card Actions in Selection Mode

- **GIVEN** user IS in selection mode (`selectionMode prop = true`)
- **WHEN** card is displayed
- **THEN**:
  - Edit and Delete buttons are hidden
  - Custom checkbox is visible in the upper right corner (where buttons were)
  - Checkbox shows checked/unchecked state based on `selected` prop
- **AND** clicking card toggles selection instead of flipping
- **AND** checkbox emits `@toggle-select` event on click

#### Scenario: Compact Card Mode (Desktop)

- **GIVEN** user on desktop (≥1024px), cards in the right column
- **WHEN** CardItem is rendered in the right column
- **THEN**:
  - Class `.compact` is applied to CardItem
  - `min-height` is reduced to 100px (vs 140px in normal mode)
  - `font-size` is reduced to 14px
  - Card text is truncated to 2 lines (`-webkit-line-clamp: 2`)
  - Statistics is displayed in a more compact format (less padding)
- **AND** compact mode is applied only to the right column on desktop
- **AND** all metrics remain readable
- **AND** tooltips work
- **AND** checkboxes in selection mode are same size (20x20px) for touch target consistency

---
