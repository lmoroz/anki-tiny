# course-ui Specification

## Purpose

TBD - created by archiving change redesign-course-layout. Update Purpose after archive.

## Requirements

### Requirement: Responsive Two-Column Layout

The system SHALL provide a responsive two-column layout on desktop screens (≥1024px) for efficient use of screen space,
while maintaining a single-column layout with hidden cards list on mobile/tablet devices (<1024px).

**Rationale**: The current single-column layout leaves unused space on desktop screens (\u003e1024px), reducing the
efficiency of card management.

#### Scenario: Desktop Layout

- **GIVEN** user opens course page on device with screen width ≥1024px
- **WHEN** page is loaded
- **THEN**:
    - Layout is split into two columns with ~60%/40% ratio (or 2fr/1fr)
    - Left column contains:
        - Course title and description
        - Statistics cards (total, new, review, due today)
        - Start training button
        - QuickAddCard widget
    - Right column contains:
        - Section header "Cards"
        - Create card button
        - CardList component
    - Columns have 24px (gap-6) gap between them
- **AND** grid layout applies only for viewport ≥1024px
- **AND** both columns are scrollable independently
- **AND** QuickAddCard remains in the left column below the training button

#### Scenario: Tablet/Mobile Layout

- **GIVEN** user opens course page on device with screen width \u003c1024px
- **WHEN** page is loaded
- **THEN**:
    - Layout is single-column (full width)
    - Course information, statistics, training button, and QuickAddCard are displayed fully
    - Card list is hidden by default
    - Floating Action Button (FAB) with text "Show cards (N)" is visible in the bottom right corner
- **AND** FAB is fixed in the bottom right corner (z-index ensures visibility)
- **AND** card count (N) dynamically updates
- **AND** FAB has ARIA label for accessibility

---

### Requirement: Slide-Out Cards Panel (Mobile)

The system SHALL provide a slide-out panel from the right side for displaying cards list on mobile/tablet devices (<
1024px) to allow quick access without losing course context.

**Rationale**: Long scroll through the card list on mobile is inconvenient; the panel allows quick navigation through
cards without losing course context.

#### Scenario: Opening Cards Panel

- **GIVEN** user on mobile/tablet (viewport \u003c1024px), card list hidden
- **WHEN** user clicks FAB "Show cards (N)"
- **THEN**:
    - Card panel slides in from the right with transform animation (300ms ease)
    - Panel takes 85% of viewport width on tablet (max 400px) and 100% on mobile
    - Backdrop (semi-transparent overlay with blur) appears behind the panel
    - Panel contains:
        - Header "Cards" with close button (×)
        - Create card button
        - CardList component
- **AND** animation is smooth (hardware-accelerated transform)
- **AND** backdrop has `backdrop-filter: blur(4px)` and `rgba(0,0,0,0.5)`
- **AND** scroll works only inside the panel (body overflow hidden)
- **AND** focus trap is active (keyboard navigation inside the panel)

#### Scenario: Closing Cards Panel

- **GIVEN** card panel is open on mobile/tablet
- **WHEN** user performs one of the following actions:
    - Clicks the close button (×)
    - Clicks on the backdrop
    - Presses the Escape key
- **THEN**:
    - Card panel slides out to the right with transform animation (300ms ease)
    - Backdrop disappears
    - FAB reappears
    - Focus returns to FAB
- **AND** all three methods of closing work
- **AND** animation is synchronized (panel + backdrop)
- **AND** body overflow is restored

---

### Requirement: Enhanced Card Statistics

The system SHALL display comprehensive FSRS algorithm statistics (stability, difficulty, reps, lapses) and timestamps (
created, last review, due) on each card item for full transparency of the learning process.

**Rationale**: Users should understand how the algorithm evaluates their progress. Hidden metrics (stability,
difficulty, reps, lapses) reduce trust in the system.

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

### Requirement: Accessibility for Statistics

The system SHALL provide accessibility support for statistics display through tooltips on hover and ARIA attributes for
screen readers.

**Rationale**: Icons without explanations may be unclear to new users or users of screen readers.

#### Scenario: Tooltips on Hover

- **GIVEN** user hovers over a statistics icon
- **WHEN** hover event occurs
- **THEN** tooltip with metric description appears:
    - Stability → "Stability of memory retention"
    - Difficulty → "Card difficulty"
    - Reps → "Number of repetitions"
    - Lapses → "Number of lapses"
    - Created at → "Created at"
    - Last review → "Last review"
    - Due date → "Due date"
- **AND** tooltip appears after 300ms hover
- **AND** tooltip positions above/below icon (does not cover text)
- **AND** tooltip disappears on mouse leave

#### Scenario: Screen Reader Support

- **GIVEN** user uses screen reader
- **WHEN** focus moves to CardItem
- **THEN**:
    - State badge is announced as "Current state: [state]"
    - FSRS metrics are announced with full names:
        - "Stability: 3.5"
        - "Difficulty: 6.2"
        - "Repetitions: 12"
        - "Lapses: 2"
    - Time stamps are announced correctly
- **AND** all icons have `aria-label` with full description
- **AND** metric values are announced as numbers (constant strings for reading)

---

### Requirement: Progress Reset on Edit

The system SHALL reset card learning progress when card content is edited, treating the edited card as a new
card for learning purposes.

**Rationale**: Changing card content invalidates existing learning metrics. If a card's question or answer
changes, the user should re-learn it from scratch to ensure proper retention.

#### Scenario: Backend Progress Reset

- **GIVEN** card exists with state = Review, reps = 10, stability = 5.2
- **WHEN** `PUT /api/courses/:courseId/cards/:cardId` is called with
  `{ front: "new question", back: "new answer", resetProgress: true }`
- **THEN** backend updates card with:
    - `front` = "new question"
    - `back` = "new answer"
    - `state` = `CardState.New`
    - `stability` = `null`
    - `difficulty` = `null`
    - `reps` = 0
    - `lapses` = 0
    - `lastReview` = `null`
    - `due` = current time + 4 hours (first learning interval)
    - `interval` = `null`
- **AND** response returns updated card with all fields

#### Scenario: Frontend Progress Reset Display

- **GIVEN** card was edited and progress reset
- **WHEN** card list is refreshed
- **THEN**:
    - Card displays state badge "Новая" (green)
    - Stability value shows "0.0"
    - Difficulty value shows "0.0"
    - Reps value shows "0"
    - Lapses value shows "0"
    - Due date shows time relative to current (e.g., "Через 4 часа", "Сегодня")
    - Last review timestamp is hidden (since `lastReview` is null)
- **AND** card is now eligible for training as a new card

---

### Requirement: Batch Card Delete

The system SHALL provide a selection mode for cards with the ability to delete multiple cards in a single operation.

**Rationale**: Deleting cards one by one is inefficient when users need to remove multiple outdated or incorrect cards
from a course.

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

The system SHALL provide a custom checkbox component for card selection with consistent styling across light and dark
themes.

**Rationale**: Native browser checkboxes do not match the application's design system and may render inconsistently
across platforms.

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

