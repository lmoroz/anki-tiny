# home-stats Specification

## Purpose

Данный spec описывает отображение агрегированной статистики тренировок на главной странице приложения. Статистика
предоставляет пользователю обзор прогресса обучения по всем курсам в едином месте.

## ADDED Requirements

### Requirement: Two-Column Layout on Desktop

The system SHALL display a two-column layout on the home page for desktop screens (≥1024px) with the course list on
the left and aggregated training statistics on the right.

**Rationale**: Desktop screens have sufficient width to display both course list and statistics side-by-side,
improving information density and user efficiency.

#### Scenario: Desktop Layout Rendering

- **GIVEN** user opens the home page on a device with screen width ≥1024px
- **WHEN** the page is loaded
- **THEN**:
  - The page layout is a two-column grid with equal width columns (50%/50%)
  - The left column contains the `CourseList` component
  - The right column contains the `GlobalStats` component
  - The gap between columns is 24px
- **AND** both columns are scrollable independently if content overflows
- **AND** the header (page title + "Create Course" button) remains full-width above the grid

#### Scenario: Mobile Layout Rendering

- **GIVEN** user opens the home page on a device with screen width < 1024px
- **WHEN** the page is loaded
- **THEN**:
  - The page layout is a single-column
  - The `GlobalStats` component is displayed above the `CourseList` component
  - Both components take full width of the container
- **AND** there is a 24px gap between the statistics and course list

---

### Requirement: Aggregated Statistics Display

The system SHALL display aggregated training statistics showing total new cards, studied/reviewed cards today,
remaining cards today, daily new card limit, and total trainings today.

**Rationale**: Users need a high-level overview of their learning progress across all courses to stay motivated and
understand their daily limits.

#### Scenario: Statistics Metrics Display

- **GIVEN** user has 3 courses with a total of 50 new cards, studied 10 new cards and completed 25 reviews today
- **WHEN** the `GlobalStats` component is rendered
- **THEN** the following metrics are displayed:
  - "Новых карточек (всего)": 50 (icon: `bi-bookmark-plus`)
  - "Изучено/повторено сегодня": 35 (10 + 25) (icon: `bi-check-circle`)
  - "Осталось на сегодня": calculated based on global limits (icon: `bi-hourglass-split`)
  - "Дневной лимит новых карточек": value from global settings (icon: `bi-speedometer`)
  - "Тренировок сегодня": 35 (same as studied/reviewed) (icon: `bi-lightning-charge`)
- **AND** all icons are Bootstrap Icons with 24px size and primary color
- **AND** all values are displayed in bold with 24px font size
- **AND** labels are in 14px font size with tertiary text color

#### Scenario: Statistics Loading State

- **GIVEN** user opens the home page
- **WHEN** statistics data is being fetched from the API
- **THEN**:
  - The `GlobalStats` component displays a loading spinner
  - The text "Загрузка статистики..." is shown below the spinner
- **AND** no metrics are displayed during loading

#### Scenario: Statistics Error State

- **GIVEN** the statistics API request fails
- **WHEN** the error is received
- **THEN**:
  - An error message "Не удалось загрузить статистику" is displayed
  - A retry button "Попробовать снова" is shown
- **AND** clicking the retry button re-fetches the statistics

---

### Requirement: Remaining Cards Calculation

The system SHALL calculate the number of remaining cards for today based on global daily limits minus cards already
studied/reviewed today.

**Rationale**: Users need to know how many cards they can still study today to plan their learning sessions.

#### Scenario: Calculating Remaining New Cards

- **GIVEN** global new cards per day limit is 20
- **AND** user has studied 8 new cards today
- **WHEN** statistics are calculated
- **THEN**:
  - Remaining new cards = 20 - 8 = 12

#### Scenario: Calculating Remaining Review Cards

- **GIVEN** global max reviews per day limit is 200
- **AND** user has completed 75 reviews today
- **WHEN** statistics are calculated
- **THEN**:
  - Remaining review cards = 200 - 75 = 125

#### Scenario: Total Remaining Cards Display

- **GIVEN** remaining new cards = 12
- **AND** remaining review cards = 125
- **WHEN** "Осталось на сегодня" metric is displayed
- **THEN**:
  - The value shown is 137 (12 + 125)

---

### Requirement: Global Statistics API Endpoint

The system SHALL provide an API endpoint `/api/stats/global` that returns the total count of new cards across all
courses.

**Rationale**: The frontend needs to know the total number of new (unstudied) cards available across all courses to
display in the statistics panel.

#### Scenario: Fetching Global New Cards Count

- **GIVEN** database has 3 courses with 15, 20, and 15 new cards respectively
- **WHEN** `GET /api/stats/global` is called
- **THEN**:
  - Response status is 200
  - Response body is:

    ```json
    {
      "totalNewCards": 50
    }
    ```

- **AND** `totalNewCards` is the sum of all cards with `state = CardState.New` across all courses

#### Scenario: Error Handling for Global Stats Endpoint

- **GIVEN** database connection fails
- **WHEN** `GET /api/stats/global` is called
- **THEN**:
  - Response status is 500
  - Response body is:

    ```json
    {
      "error": "Failed to fetch global stats"
    }
    ```

---

### Requirement: Statistics Store with Pinia

The system SHALL use a Pinia store `useStatsStore` to manage global statistics state and fetching logic.

**Rationale**: Centralized state management ensures consistency and allows multiple components to access statistics
data if needed in the future.

#### Scenario: Fetching Statistics via Store

- **GIVEN** user opens the home page
- **WHEN** `HomePage.vue` calls `statsStore.fetchGlobalStats()`
- **THEN**:
  - Store sends `GET /api/training/stats` request
  - Store sends `GET /api/stats/global` request
  - Store calculates aggregated metrics:
    - `studiedToday = dailyStats.global.newCardsStudied + dailyStats.global.reviewsCompleted`
    - `remainingToday = (globalNewCardsPerDay - newCardsStudied) + (globalMaxReviewsPerDay - reviewsCompleted)`
    - `trainingsToday = studiedToday`
  - Store updates state with calculated values
- **AND** `loading` state is set to `true` during fetch and `false` after completion
- **AND** `error` state is set if any request fails

---

### Requirement: Visual Consistency with Design System

The system SHALL use existing design system components and CSS variables for the statistics panel to ensure visual
consistency with the rest of the application.

**Rationale**: Maintaining design system consistency improves user experience and reduces maintenance overhead.

#### Scenario: Using Existing Card Component

- **GIVEN** the `GlobalStats` component is being rendered
- **WHEN** the component markup is generated
- **THEN**:
  - The root element is `<Card padding="lg">`
  - All spacing uses CSS variables from the design system
  - All colors use CSS variables (e.g., `var(--color-primary)`, `var(--color-text-primary)`)
- **AND** the component supports both light and dark themes automatically

#### Scenario: Icon and Typography Consistency

- **GIVEN** a stat item is displayed
- **WHEN** the item is rendered
- **THEN**:
  - Icon uses Bootstrap Icons library
  - Font sizes use CSS variables (e.g., `var(--text-body-lg-size)`)
  - Font weights use design system tokens (e.g., `font-semibold`, `font-bold`)

---

### Requirement: Placeholder for Future Chart

The system SHALL display a placeholder area for future training statistics chart within the `GlobalStats` component.

**Rationale**: Preparing the UI structure for the upcoming chart feature ensures a smooth transition when the chart is implemented.

#### Scenario: Chart Placeholder Display

- **GIVEN** the `GlobalStats` component is rendered
- **WHEN** all statistics metrics are displayed
- **THEN**:
  - Below the metrics, a placeholder area with text "График статистики (скоро)" is shown
  - The placeholder has a dashed border with 2px width and primary color
  - The placeholder has 16px padding and 12px border radius
  - The placeholder height is 200px
- **AND** the placeholder uses tertiary text color for the text
- **AND** the placeholder is centered within the card
