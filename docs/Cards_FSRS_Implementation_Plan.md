# Implementation Plan: Cards and FSRS (Backend & Frontend)

## Overview

This plan outlines the implementation stages for the flashcard system and FSRS (spcaed repetition) algorithm.
The implementation covers the entire stack: from the database to the user interface.

**Implementation Status:**
- Backend: ✅ Completed
- Frontend: 📅 Planned

---

## Stage 1: Database Schema ✅

**Goal:** Create tables for storing cards and settings supporting FSRS fields.

- [x] **1.1. Determine FSRS Data Structure**
  - Use fields: `stability`, `difficulty`, `elapsed_days`, `scheduled_days`, `reps`, `lapses`, `state`, `last_review`.
  - Add `due_date` field for quick filtering.
- [x] **1.2. Create `cards` table**
  - Fields: `id`, `course_id`, `front`, `back`, `...fsrs_fields`.
  - Indices: `course_id`, `due_date`, `state`.
- [x] **1.3. Create `settings` table (Global Settings)**
  - Fields: `training_start_hour`, `training_end_hour`, `min_time_before_end` (4h).
  - Fields: `notifications_enabled`, `learning_steps` (JSON), `enable_fuzz`.
- [x] **1.4. Create `course_settings` table (Course Settings)**
  - Similar fields to global + `course_id`.
  - All fields are nullable (inherit from global if null).

---

## Stage 2: FSRS Library Integration ✅

**Goal:** Integrate `ts-fsrs` library and set up logic.

- [x] **2.1. Install Library**
  - `npm install ts-fsrs` (backend).
- [x] **2.2. Create Database Service**
  - Initialization of FSRS instance with parameters (generator).
  - Helper functions for calculating next interval.
- [x] **2.3. Implement "Time Restrictions" Logic**
  - Function `canShowNewCards(now, settings)`: returns `false` if `(end_of_day - now) < 4 hours` (since first step is 4h).
- [x] **2.4. Define "Learning Steps" Logic**
  - Default: `1m` (Again), `10m` (Hard), `4h` (Good), `1d` (Easy) - *This is an example, need to clarify specific steps*.
  - Requirement: "first short interval 4 hours".
  - **Correction:** FSRS handles scheduling, but "steps" for New/Learning cards are often handled manually or via library parameters.

---

## Stage 3: Cards API (Backend) ✅

**Goal:** CRUD endpoints for cards.

- [x] **3.1. `POST /api/courses/:id/cards`**
  - Zod validation: `front`, `back` required.
  - Create card with initial FSRS state (New).
- [x] **3.2. `GET /api/courses/:id/cards`**
  - List of cards (pagination?).
  - Search/Filter (optional for MVP).
- [x] **3.3. `PUT /api/cards/:id`**
  - Update texts (`front`, `back`).
- [x] **3.4. `DELETE /api/cards/:id`**
  - Delete card.

---

## Stage 4: Training API (Backend) ✅

**Goal:** Endpoints for the learning session.

- [x] **4.1. `GET /api/courses/:id/due-cards`**
  - Returns list of cards to review.
  - **Logic:**
    - Filter by `due_date <= now`.
    - Join with settings.
    - If `canShowNewCards` is false -> exclude cards with `state == New` (or equivalent).
- [x] **4.2. `POST /api/training/review`**
  - Body: `{ cardId, rating }` (Rating: Again, Hard, Good, Easy).
  - Calculate new parameters via FSRS.
  - Update card in DB.
  - Log repetition (history table? - optional for MVP, but good for stats).

---

## Stage 5: Settings API (Backend) ✅

**Goal:** Management of settings.

- [x] **5.1. `GET /api/settings`** & **`PUT /api/settings`** (Global).
- [x] **5.2. `GET /api/courses/:id/settings`** & **`PUT /api/courses/:id/settings`** (Course).
  - GET returns merged settings (Course > Global > Default).

---

## Stage 6: Frontend Entity Layer (Cards) 📅

**Goal:** Models and Stores for Frontend.

- [ ] **6.1. Types**
  - `Card`, `ReviewLog`, `FSRSParameters`.
- [ ] **6.2. Card Service (API Client)**
  - Methods for all endpoints.
- [ ] **6.3. Card Store (Pinia)**
  - State: `cards`, `currentCard`, `sessionStats`.
  - Actions: `loadCards`, `createCard`, `submitReview`.

---

## Stage 7: Frontend Cards UI Components 📅

**Goal:** Basic components.

- [ ] **7.1. `CardList` Widget**
  - List of cards in course settings.
  - "Edit" and "Delete" buttons.
- [ ] **7.2. `CardEditor` (Modal/Inline)**
  - Fields Front/Back.
  - Rich Text Editor? (Start with plain text/markdown).
- [ ] **7.3. `QuickAddCard` Widget**
  - Form on the course page for quick addition.
  - "Add & Continue" behavior.

---

## Stage 8: Frontend Course Page Integration 📅

**Goal:** Display cards on Course Page.

- [ ] **8.1. Update `CoursePage`**
  - Add "Start Training" button (if due cards exist).
  - Add `QuickAddCard` widget.
  - Add list of cards (or link to separate page "Manage Cards").

---

## Stage 9: Frontend Training Page 📅

**Goal:** The main interface for learning.

- [ ] **9.1. Create `TrainingPage` (`/training/:courseId`)**.
- [ ] **9.2. Implement Card Display**
  - "Question" state (Back hidden).
  - "Answer" state (Back visible).
- [ ] **9.3. Implement Action Buttons**
  - Again, Hard, Good, Easy.
  - Display next intervals (if possible to calculate on client or fetch from backend).
- [ ] **9.4. Implement "Session Complete" screen**.

---

## Stage 10: Frontend Settings Pages 📅

**Goal:** UI for Settings.

- [ ] **10.1. Global Settings Page**
  - Inputs for time ranges.
  - FSRS parameters adjustment (advanced).
- [ ] **10.2. Course Settings Modal/Page**
  - "Use Global" switch.
  - Overrides.

---

## Stage 11: Backend Unit Tests ✅

**Goal:** Verify FSRS logic.

- [x] **11.1. Test FSRS calculation**
  - Verify interval growth.
- [x] **11.2. Test Time Restrictions**
  - Mock time and check filtering of new cards.
- [x] **11.3. Test Settings Inheritance**
  - Verify course settings override global.

---

## Stage 12: Integration Testing 📅

**Goal:** Verify full flow.

- [ ] **12.1. Create Course -> Add Card -> Train -> Verify Due Date**.

---

## Stage 13: Verification & Documentation 📅

**Goal:** Final checks.

- [ ] **13.1. Verify requirement:** "first short interval 4 hours".
- [ ] **13.2. Verify requirement:** "notifications".
- [ ] **13.3. Verify requirement:** "minimize to tray".

---

## Risks and Limitations

1. **FSRS Complexity**: Tuning parameters might be difficult for users. Need good defaults.
   - *Mitigation*: Hide advanced settings behind "Advanced" toggle.
2. **Time Zones**: "End of day" (22:00) depends on user timezone.
   - *Mitigation*: Backend should handle dates in UTC, but logic for "hours" likely needs local time offset or assume checking against local time sent from client? Or store timezone in settings.
   - *Simplify*: For desktop app (Electron), Backend logic runs locally, so system time is user time. ✅

---

## FSRS Requirements Detail (from user)

> "User wants to adapt intervals to their needs, for example, make the first short interval 4 hours instead of one day"

This implies **Custom Learning Steps**.
Standard Anki steps: `1m 10m`.
User request: `4h ...`.

**Solution:**
Configure `learning_steps` parameter.
If `ts-fsrs` supports custom steps before entering main scheduling, use that.
Otherwise, manually handle "Learning" state logic. Since we implement our own scheduler wrapper, we can control this.

**Logic Plan:**
1. **New Card** -> Reviewed "Good" -> Enters **Learning**.
2. **Learning Step 1**: Interval = 4 hours.
3. Card becomes Due after 4 hours.
4. User reviews -> "Good" -> **Graduated** (moves to Review state) OR Next Step.

Needs flexible "Steps" configuration field in Settings (e.g., "4h, 1d").
