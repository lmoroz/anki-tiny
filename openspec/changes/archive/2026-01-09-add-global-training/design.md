# Technical Design

## Architecture

### Backend

- **CardRepository**:
  - Add `getAllDueCards(now, limit)`: Efficiently fetch `due` cards across all courses, sorted by `due ASC`.
- **LimitService**:
  - Add `calculateGlobalAvailableCards(sessionMode)`:
    - Aggregates global and per-course limits.
    - Fetches candidates via `cardRepository`.
    - Filters candidates: A card is accepted only if `CourseLimit > 0` AND `GlobalLimit > 0`.
    - Separates counters for `New` and `Review` cards.
    - Shuffles the final list to achieve interleaving.
- **API**:
  - `GET /api/training/global/due-cards`: Returns the mixed queue and updated limits.

### Frontend

- **Store (`useTrainingStore`)**:
  - Add `startGlobalSession()`: Calls the new endpoint.
  - Add `isGlobalSession` state to handle UI nuances (e.g., exit navigation).
- **Pages**:
  - `TrainingPage`:
    - Support `route.params.id` being undefined or handle a specific route `/training/global`.
    - Hide "Back to Course" button, show "Back to Home".
    - Show course name badge on the card.
  - `HomePage`:
    - Add "Global Train" button in the header or sidebar.
    - Display total count of due cards (across all courses) near the button.
    - Button should be disabled/hidden if no due cards available.

## Data Flow

1. Frontend calls `startGlobalSession()`.
2. Backend `LimitService` calculates budgets:
   - `GlobalRemaining = GlobalMax - GlobalProgress`.
   - `CourseRemaining[id] = CourseMax[id] - CourseProgress[id]`.
3. Backend fetches up to `N` due cards sorted by urgency.
4. Backend iterates candidates:
   - If `New`: Decrement `GlobalNew` and `CourseNew[id]`.
   - If `Review`: Decrement `GlobalReview` and `CourseReview[id]`.
   - If budgets allow, add to result.
5. Backend shuffles result.
6. Frontend receives cards and starts session.
7. User answers card -> `submitReview` (existing) updates card and specific course progress.

## Security & Performance

- **Performance**: Fetching "all due cards" might be heavy. We will limit the SQL query to a reasonable batch (e.g., 1000) since a user won't study more than that in one session.
- **Atomicity**: Limits are checked at the start. Concurrency is not a high concern for a single-user desktop app.
