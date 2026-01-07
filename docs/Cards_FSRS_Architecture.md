# Architecture Visualization: Cards and FSRS

## Database Schema

```mermaid
erDiagram
    courses ||--o{ cards: contains
    courses ||--o| courseSettings: has
    settings ||--|| app: "global config"

    courses {
        int id PK
        string name
        string description
        datetime createdAt
        datetime updatedAt
    }

    cards {
        int id PK
        int courseId FK
        string front "Question"
        string back "Answer"
        datetime due "Next review date"
        float stability "FSRS: memory stability"
        float difficulty "FSRS: difficulty"
        int elapsedDays "FSRS: days since last review"
        int scheduledDays "FSRS: scheduled interval"
        int reps "Total repetitions"
        int lapses "Times forgotten"
        int state "0=New 1=Learning 2=Review 3=Relearning"
        datetime lastReview "Last answer time"
        int stepIndex "Current learning step"
        datetime createdAt
        datetime updatedAt
    }

    settings {
        int id PK
        int trainingStartHour "Default: 8"
        int trainingEndHour "Default: 22"
        int minTimeBeforeEnd "Default: 4 hours"
        bool notificationsEnabled
        string learningSteps "JSON: [10, 240]"
        bool enableFuzz
        datetime createdAt
        datetime updatedAt
    }

    courseSettings {
        int id PK
        int courseId FK
        int trainingStartHour "Override global"
        int trainingEndHour "Override global"
        int minTimeBeforeEnd "Override global"
        bool notificationsEnabled "Override global"
        string learningSteps "Override global"
        bool enableFuzz "Override global"
        datetime createdAt
        datetime updatedAt
    }
```

---

## Card State Machine (FSRS Flow)

```mermaid
stateDiagram-v2
    [*] --> NEW: Card created
    NEW --> LEARNING: Good/Easy (step 0)
    NEW --> NEW: Again (reset)
    LEARNING --> LEARNING: Good (next step)
    LEARNING --> NEW: Again (reset to step 0)
    LEARNING --> REVIEW: Good (all steps completed)
    REVIEW --> REVIEW: Good/Easy (FSRS interval)
    REVIEW --> RELEARNING: Again (forgotten)
    RELEARNING --> RELEARNING: Hard/Good (learning steps)
    RELEARNING --> REVIEW: Good (all steps completed)
    RELEARNING --> RELEARNING: Again (reset)
    note right of NEW
        stepIndex = 0
        due = now + learningSteps[0]
    end note
    note right of LEARNING
        stepIndex++
        due = now + learningSteps[stepIndex]
    end note
    note right of REVIEW
        due calculated by FSRS
        stability, difficulty updated
    end note
```

---

## Training Flow (User Journey)

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant FSRS
    participant DB
    User ->> Frontend: Click "Start Training"
    Frontend ->> Backend: GET /api/courses/:id/due-cards
    Backend ->> DB: SELECT cards WHERE due <= now
    Backend ->> Backend: Check training time restrictions
    Backend ->> Backend: Filter NEW cards if < 4h until end
    DB -->> Backend: Due cards list
    Backend -->> Frontend: { cards: [...] }
    Frontend ->> User: Show first card (front)
    User ->> Frontend: Click to reveal
    Frontend ->> User: Show back
    User ->> Frontend: Click "Good"
    Frontend ->> Backend: POST /api/training/review {cardId, rating: 3}
    Backend ->> DB: SELECT card, settings

    alt Card is NEW or LEARNING
        Backend ->> Backend: Apply learning steps logic
        Backend ->> Backend: Update stepIndex, due
    else Card is REVIEW
        Backend ->> FSRS: calculate(card, rating)
        FSRS -->> Backend: {stability, difficulty, scheduledDays, due}
        Backend ->> Backend: Update card with FSRS result
    end

    Backend ->> DB: UPDATE cards SET ...
    DB -->> Backend: Success
    Backend -->> Frontend: { updatedCard }
    Frontend ->> Frontend: Move to next card
    Frontend ->> User: Show next card OR "Session complete!"
```

---

## API Architecture

```mermaid
graph TB
    subgraph "Frontend"
        Pages[Pages Layer]
        Widgets[Widgets Layer]
        Entities[Entities Layer]
        API[API Client]
    end

    subgraph "Backend: Express Server"
        Routes[Routes Layer]
        Controllers[Controllers]
        Repos[Repositories]
        Services[Services]
    end

    subgraph "Data Layer"
        DB[(SQLite DB)]
        FSRS[ts-fsrs Library]
    end

    Pages --> Widgets
    Widgets --> Entities
    Entities --> API
    API -->|HTTP| Routes
    Routes --> Controllers
    Controllers --> Repos
    Controllers --> Services
    Repos --> DB
    Services --> FSRS
    Services --> DB
    style FSRS fill: #f9f, stroke: #333, stroke-width: 2px
    style DB fill: #bbf, stroke: #333, stroke-width: 2px
```

---

## Key API Endpoints

### Cards CRUD

```mermaid
graph LR
    A[GET /api/courses/:id/cards] -->|Fetch all cards| B[Card Repository]
    C[POST /api/courses/:id/cards] -->|Create card| B
    D[PUT /api/cards/:id] -->|Update card| B
    E[DELETE /api/cards/:id] -->|Delete card| B
    B --> F[(Database)]
    style A fill: #afa
    style C fill: #ffa
    style D fill: #aaf
    style E fill: #faa
```

### Training Flow

```mermaid
graph TD
    A[GET /api/courses/:id/due-cards] --> B{Check time restrictions}
    B -->|Valid| C[Get settings]
    B -->|Outside hours| D[Return empty]
    C --> E{Hours until end < 4?}
    E -->|Yes| F[Exclude NEW cards]
    E -->|No| G[Include all due cards]
    F --> H[Query DB: due <= now AND state != 0]
    G --> I[Query DB: due <= now]
    H --> J[Return cards]
    I --> J
    K[POST /api/training/review] --> L{Card state?}
    L -->|NEW/LEARNING| M[Apply learning steps]
    L -->|REVIEW| N[Use FSRS algorithm]
    M --> O[Update card in DB]
    N --> O
    style B fill: #ffa
    style E fill: #ffa
    style L fill: #afa
```

---

## Learning Steps Logic

```mermaid
flowchart TD
    Start[User answers card] --> CheckState{Card state?}
    CheckState -->|NEW or LEARNING| GetSteps[Get learning steps from settings]
    CheckState -->|REVIEW| UseFSRS[Use FSRS calculation]
    GetSteps --> CheckRating{User rating?}
    CheckRating -->|AGAIN| ResetStep[stepIndex = 0, lapses++]
    CheckRating -->|GOOD/EASY| IncStep[stepIndex++]
    ResetStep --> CalcDue1[due = now + steps[0]]
IncStep --> CheckComplete{stepIndex >= steps.length?}

CheckComplete -->|Yes|Transition[state = REVIEW, use FSRS]
CheckComplete -->|No|CalcDue2[due = now + steps[stepIndex]]

CalcDue1 --> SaveCard[Save to DB]
CalcDue2 --> SaveCard
Transition --> SaveCard
UseFSRS --> SaveCard

SaveCard --> End[Card updated]

style CheckRating fill: #ffa
style CheckComplete fill: #afa
style Transition fill: #aaf
```

---

## Time Restrictions Logic

```mermaid
flowchart TD
    Start[Request due cards] --> GetTime[Get current time]
    GetTime --> GetSettings[Get course/global settings]
    GetSettings --> CheckHour{Hour in range?}
    CheckHour -->|No| ReturnEmpty[Return empty array]
    CheckHour -->|Yes| CalcRemaining[Calculate hours until trainingEndHour]
    CalcRemaining --> CheckMinTime{remaining < minTimeBeforeEnd?}
    CheckMinTime -->|Yes| FilterNew[Exclude NEW cards]
    CheckMinTime -->|No| AllCards[Include all due cards]
    FilterNew --> QueryDB1[SELECT WHERE due <= now AND state != 0]
    AllCards --> QueryDB2[SELECT WHERE due <= now]
    QueryDB1 --> ReturnCards[Return cards]
    QueryDB2 --> ReturnCards
    style CheckHour fill: #ffa
    style CheckMinTime fill: #ffa
    style FilterNew fill: #faa
```

---

## Component Hierarchy (Frontend)

```mermaid
graph TD
    App[App.vue] --> Router[Vue Router]
    Router --> HomePage
    Router --> CoursePage
    Router --> TrainingPage
    Router --> SettingsPage
    CoursePage --> QuickAdd[QuickAddCard Widget]
    CoursePage --> CardList[CardList Widget]
    CoursePage --> CourseSettings[CourseSettingsModal]
    CardList --> CardItem1[CardItem]
    CardList --> CardItem2[CardItem]
    CardList --> CardItemN[CardItem...]
    CardItem1 --> EditModal[CardEditor Modal]
    TrainingPage --> CardDisplay[Card Display]
    TrainingPage --> RatingButtons[Rating Buttons]
    TrainingPage --> ProgressBar[Progress Bar]
    SettingsPage --> TimeInputs[Time Picker Inputs]
    SettingsPage --> Toggles[Settings Toggles]
    QuickAdd --> Input[Shared/Input]
    QuickAdd --> Button[Shared/Button]
    EditModal --> Textarea[Shared/Textarea]
    style CoursePage fill: #afa
    style TrainingPage fill: #aaf
    style SettingsPage fill: #ffa
```

---

## Data Flow: Creating a Card

```mermaid
sequenceDiagram
    participant User
    participant QuickAdd as QuickAddCard.vue
    participant Store as cardStore (Pinia)
    participant API as cardApi.ts
    participant Backend as Express /api/cards
    participant DB as SQLite
    User ->> QuickAdd: Enters front/back, clicks Save
    QuickAdd ->> QuickAdd: Validate inputs (client-side)
    QuickAdd ->> Store: createCard({front, back})
    Store ->> API: POST /api/courses/:id/cards
    API ->> Backend: {front, back}
    Backend ->> Backend: Validate with Zod schema
    Backend ->> Backend: Create NEW card with FSRS defaults
    Backend ->> DB: INSERT INTO cards (...)
    DB -->> Backend: Card inserted, ID returned
    Backend -->> API: {card: {...}}
    API -->> Store: Card created
    Store ->> Store: Add card to state
    Store -->> QuickAdd: Success
    QuickAdd ->> User: Clear form, show success message
```

---

## FSRS Parameters Flow

```mermaid
flowchart LR
    A[User creates course] --> B{Custom settings?}
    B -->|No| C[Use global settings]
    B -->|Yes| D[Store in courseSettings table]
    C --> E[Read from settings table]
    D --> E
    E --> F[Parse learningSteps JSON]
    E --> G[Get enableFuzz boolean]
    E --> H[Get time restrictions]
    F --> I[Initialize FSRS with params]
    G --> I
    I --> J[Calculate intervals]
    H --> K[Filter due cards]
    J --> L[Update card.due, card.stability, etc.]
    K --> L
    L --> M[(Save to DB)]
    style B fill: #ffa
    style E fill: #afa
    style I fill: #aaf
```

---

## Notes

> **Database Schema**: All FSRS-specific fields are required for the algorithm to work correctly.

> **State Machine**: Transitions between card states are strictly defined by the FSRS algorithm.

> **Time Restrictions**: Critical for user experience — must not offer NEW cards if < 4 hours until end of day.

> **Learning Steps**: Custom logic that works BEFORE the card enters the full FSRS cycle.
