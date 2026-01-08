# Tasks

1. **Backend Implementation**
   - [ ] Update `CardRepository`: Add `getAllDueCards(now, limit)`.
   - [ ] Update `LimitService`: Implement `calculateGlobalAvailableCards`.
   - [ ] Update `LimitService`: Ensure `getDailyStats` works correctly for global limits (already done, but verify).
   - [ ] Add `training.ts` route: `GET /global/due-cards`.

2. **Frontend Implementation**
   - [ ] Update `useTrainingStore`: Add `isGlobalSession`, `startGlobalSession`.
   - [ ] Update `TrainingPage`: Handle global mode (modify back button, completion logic).
   - [ ] Update `TrainingPage`: Add course name badge to display which course the card belongs to.
   - [ ] Update `router`: Add `/training/global` route.
   - [ ] Update `HomePage`: Add "Train All" button with total due cards counter.

3. **Verification**
   - [ ] Verify global session starts.
   - [ ] Verify cards are mixed (different courses).
   - [ ] Verify limits are respected (if course limit reached, its cards stop appearing).
   - [ ] Verify course indicator is visible during global training.
   - [ ] Verify due cards counter is displayed on HomePage.
   - [ ] Verify "Train All" button is disabled when no cards are due.
