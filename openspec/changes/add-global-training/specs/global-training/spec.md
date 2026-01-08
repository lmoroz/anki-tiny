# Global Training Spec

## ADDED Requirements

### Requirement: Global Interleaved Queue

The system SHALL provide a "Global Training" mechanism to review due cards from all active courses in a single, interleaved session.

#### Scenario: User starts global training

1. User clicks "Train All" on the Home Page.
2. The system fetches due cards from all courses.
3. The system presents a card from "English".
4. After answering, the system presents a card from "Math".

### Requirement: Limit Hierarchy Enforcement

The selection of cards for the global queue MUST respect both Global Limits and Course Limits simultaneously.

#### Scenario: Course limit reached

1. User has a Global Limit of 100 new cards.
2. "English" course has a limit of 10 new cards.
3. User starts global training.
4. After 10 new "English" cards, no more new "English" cards are shown, even if Global Limit is not reached.

#### Scenario: Global limit reached

1. User has a Global Limit of 20 new cards.
2. "English" and "Math" each have limit of 20.
3. User studies 10 "English" and 10 "Math" new cards.
4. No more new cards are shown from any course.

### Requirement: Interleaving Strategy

The system SHALL mix cards from different courses in a random order (interleaving) after filtering for limits/urgency.

#### Scenario: Mixed content

1. User has due cards for English and Physics.
2. User starts global training.
3. The session contains a mix of English and Physics cards, not blocked by subject.

### Requirement: Due Cards Visibility

The Home Page SHALL display the total count of due cards available for global training.

#### Scenario: Due cards counter displayed

1. User opens the Home Page.
2. User has 15 due cards across all courses.
3. The "Train All" button shows "15 cards ready" or similar indicator.

#### Scenario: No due cards

1. User opens the Home Page.
2. User has no due cards.
3. The "Train All" button is disabled or hidden.
