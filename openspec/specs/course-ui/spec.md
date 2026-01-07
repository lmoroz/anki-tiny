# course-ui Specification

## Purpose
TBD - created by archiving change redesign-course-layout. Update Purpose after archive.
## Requirements
### Requirement: Responsive Two-Column Layout

The system SHALL provide a responsive two-column layout on desktop screens (≥1024px) for efficient use of screen space, while maintaining a single-column layout with hidden cards list on mobile/tablet devices (<1024px).

**Rationale**: The current single-column layout leaves unused space on desktop screens (\u003e1024px), reducing the efficiency of card management.

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

The system SHALL provide a slide-out panel from the right side for displaying cards list on mobile/tablet devices (<1024px) to allow quick access without losing course context.

**Rationale**: Long scroll through the card list on mobile is inconvenient; the panel allows quick navigation through cards without losing course context.

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

---

### Requirement: Accessibility for Statistics

The system SHALL provide accessibility support for statistics display through tooltips on hover and ARIA attributes for screen readers.

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

