# Spec Delta: course-ui

## MODIFIED Requirements

### Requirement: Card Management Interface

The system SHALL provide visual feedback when creating or editing cards, including automatic scroll to the
affected card and animation to highlight it.

**Rationale**: Users need clear visual confirmation of which card was created or edited. Without feedback, it's
unclear whether the operation succeeded and where the card is located in the list.

#### Scenario: Creating a Card via QuickAddCard

- **GIVEN** user is on the course page
- **WHEN** user fills `front` and `back` fields in QuickAddCard form
- **AND** clicks "Добавить карточку" button
- **THEN**:
  - Card is created via `POST /api/courses/:courseId/cards`
  - Form fields are cleared
  - Card list scrolls to the newly created card using `scrollIntoView({ behavior: 'smooth', block: 'start' })`
  - Newly created card displays "bounce-in-bck" animation (1s duration)
- **AND** animation completes before user can interact with the card
- **AND** if cards panel was already open (mobile), scroll happens within the panel

#### Scenario: Editing a Card

- **GIVEN** user is on the course page with existing cards
- **WHEN** user clicks "Редактировать" button (pencil icon) on a card
- **THEN**:
  - CardEditorModal opens with card data pre-filled (`front`, `back`)
  - Modal displays card in edit mode
- **AND** user can modify `front` or `back` fields
- **AND** validation rules are enforced (front and back required)

#### Scenario: Saving Edited Card

- **GIVEN** user is editing a card via CardEditorModal
- **WHEN** user modifies `front` or `back` fields
- **AND** clicks "Сохранить" button
- **THEN**:
  - Request is sent: `PUT /api/courses/:courseId/cards/:cardId` with body
    `{ front, back, resetProgress: true }`
  - Backend updates card and resets progress (state = New, reps = 0, stability/difficulty = null, due = now + 4h)
  - Modal closes
  - Card list is refreshed
  - Card list scrolls to the edited card using `scrollIntoView({ behavior: 'smooth', block: 'start' })`
  - Edited card displays "bounce-in-bck" animation (1s duration)
- **AND** card appears with "Новая" state badge (green)
- **AND** FSRS metrics are reset (stability 0.0, difficulty 0.0, reps 0, lapses 0)

#### Scenario: Bounce-in-bck Animation

- **GIVEN** card list is displayed
- **WHEN** card receives "bounce" trigger (after creation or edit)
- **THEN**:
  - Card element receives CSS class `anim-bounce-in-bck`
  - Animation runs for 1 second with keyframes:
    - 0%: `opacity: 0`, `transform: scale(7)`
    - 38%: `opacity: 1`, `transform: scale(1)`
    - 55%: `transform: scale(1.5)`
    - 72%, 89%, 100%: `transform: scale(1)`
    - 81%: `transform: scale(1.24)`
    - 95%: `transform: scale(1.04)`
  - After completion: class `anim-bounce-in-bck` is removed
- **AND** animation respects `prefers-reduced-motion: reduce` (no animation in this case)

#### Scenario: Scroll to Card Not Found

- **GIVEN** card list has rendered cards
- **WHEN** `scrollToCardWithBounce(cardId)` is called with non-existent `cardId`
- **THEN**:
  - Console warning is logged: `Card with id ${cardId} not found in list`
  - No scroll or animation occurs
  - No exception is thrown
- **AND** user experience is not disrupted

---

## ADDED Requirements

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

## Implementation Notes

### Component Structure

```
frontend/src/widgets/
├── card-list/
│   ├── CardList.vue (modified: add scrollToCardWithBounce method)
│   └── CardItem.vue (no changes)
└── quick-add-card/
    └── QuickAddCard.vue (no changes)

frontend/src/pages/course/
└── CoursePage.vue (modified: trigger scroll on save/create)
```

### API Contract

**Endpoint**: `PUT /api/courses/:courseId/cards/:cardId`

**Request Body**:

```typescript
{
  front: string
  back: string
  resetProgress?: boolean // default: false
}
```

**Response**: Updated `Card` object

### CSS Animation

```css
.anim-bounce-in-bck {
  animation-duration: 1s;
  animation-name: bounce-in-bck;
}

@keyframes bounce-in-bck {
  0% {
    opacity: 0;
    animation-timing-function: ease-in;
    transform: scale(7);
  }
  38% {
    opacity: 1;
    animation-timing-function: ease-out;
    transform: scale(1);
  }
  55% {
    animation-timing-function: ease-in;
    transform: scale(1.5);
  }
  72%,
  89%,
  to {
    animation-timing-function: ease-out;
    transform: scale(1);
  }
  81% {
    animation-timing-function: ease-in;
    transform: scale(1.24);
  }
  95% {
    animation-timing-function: ease-in;
    transform: scale(1.04);
  }
}

@media (prefers-reduced-motion: reduce) {
  .anim-bounce-in-bck {
    animation: none;
  }
}
```

### Data Flow

```
CardEditorModal → CoursePage.handleSaveCard() → CardStore.updateCard(resetProgress=true)
CoursePage → CardStore.fetchCardsByCourse() → nextTick()
CoursePage → CardList.scrollToCardWithBounce() → Scroll + Animation
```

### Key Points

1. **Existing Modal**: Uses `CardEditorModal` component (already working)
2. **Minimal Changes**: Only adds scroll + animation after save/create
3. **Progress Reset**: Automatic when editing (cannot be disabled)
4. **Visual Feedback**: Scroll + bounce animation (1s)
5. **Accessibility**: Respects `prefers-reduced-motion`
