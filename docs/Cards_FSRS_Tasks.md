# Task Checklist: Cards and FSRS

## Phase 1: Database & Backend Core

- [x] **1.1 Database Schema**
    - [x] Create migration for `cards` table
    - [x] Create migration for `settings` table
    - [x] Create migration for `course_settings` table
    - [x] Verify indices and foreign keys

- [x] **1.2 FSRS Service**
    - [x] Add `ts-fsrs` dependency
    - [x] Create `fsrs` service
    - [x] Implement `calculateNextReview`
    - [x] Implement `canShowNewCards` (time restriction logic)

- [x] **1.3 Repositories**
    - [x] `CardRepository`: Create, Update, Delete, GetById, GetByCourse
    - [x] `SettingsRepository`: GetGlobal, UpdateGlobal, GetCourse, UpdateCourse

- [x] **1.4 Backend API Routes**
    - [x] `POST /api/courses/:id/cards` (Create)
    - [x] `GET /api/courses/:id/cards` (List)
    - [x] `PUT /api/cards/:id` (Update)
    - [x] `DELETE /api/cards/:id` (Delete)
    - [x] `GET /api/courses/:id/due-cards` (Training Session)
    - [x] `POST /api/training/review` (Submit Review)
    - [x] `GET/PUT /api/settings` and `/api/courses/:id/settings`

## Phase 2: Frontend Core

- [ ] **2.1 Entity Layer**
    - [ ] Define TypeScript interfaces (`Card`, `Settings`)
    - [ ] Update API Client with new endpoints
    - [ ] Create `useCards` store (Pinia)
    - [ ] Create `useSettings` store (Pinia)

- [ ] **2.2 Components: Cards**
    - [ ] `CardList.vue` - list of cards with edit/delete actions
    - [ ] `CardEditor.vue` - modal/form for creating/editing cards
    - [ ] `QuickAddCard.vue` - widget for fast entry

- [ ] **2.3 Components: Training**
    - [ ] `TrainingCard.vue` - display front/back
    - [ ] `RatingButtons.vue` - Again/Hard/Good/Easy buttons
    - [ ] `TrainingSession.vue` - container for the session flow

## Phase 3: Integration & Pages

- [ ] **3.1 Course Page**
    - [ ] Integrate `QuickAddCard`
    - [ ] Display `CardList`
    - [ ] Add "Start Training" button (conditional)

- [ ] **3.2 Training Page**
    - [ ] Create route `/training/:id`
    - [ ] Implement training loop logic (fetch -> display -> rate -> next)
    - [ ] Handle "Empty/Done" state

- [ ] **3.3 Settings Page**
    - [ ] UI for Global Settings (Time ranges)
    - [ ] UI for Course Settings (Inheritance toggle)

## Phase 4: Verification

- [ ] **4.1 Manual Testing**
    - [ ] Verify "4 hours" delay for new cards
    - [ ] Verify time restrictions (< 4h to end of day)
    - [ ] Verify course settings override global settings

- [ ] **4.2 Automated Tests** (Optional/Later)
    - [ ] Unit tests for FSRS wrapper
    - [ ] API integration tests
