# sse-stats-streaming Specification

## Purpose

TBD - created by archiving change add-sse-stats-updates. Update Purpose after archive.

## Requirements

### Requirement: SSE Endpoint for Statistics

**Priority**: MUST
**Tag**: backend-api

The backend SHALL provide an SSE endpoint `GET /api/stats/stream` that:

- Sets appropriate SSE headers (`Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`)
- Sends initial statistics snapshot immediately upon connection
- Keeps connection open for streaming future updates
- Removes client from active connections on disconnect

#### Scenario: Client connects to SSE endpoint

**Given** the backend server is running
**When** a client sends `GET /api/stats/stream`
**Then** the response SHALL include SSE headers
**And** the client SHALL receive an initial `stats-update` event with current course statistics
**And** the connection SHALL remain open for future events

#### Scenario: Client disconnects

**Given** a client is connected to `/api/stats/stream`
**When** the client closes the connection
**Then** the backend SHALL remove the client from the active connections set
**And** SHALL stop sending events to that client

---

### Requirement: Stats Scheduler Service

**Priority**: MUST
**Tag**: backend-service

The backend SHALL implement a `StatsScheduler` service that:

- Maintains a set of active SSE client connections
- Schedules next update based on the earliest `due` date among all cards
- Broadcasts statistics to all connected clients when triggered
- Cancels scheduled timers when no clients are connected
- Provides graceful shutdown to clean up resources

#### Scenario: First client connects

**Given** no clients are currently connected
**When** the first client connects to `/api/stats/stream`
**Then** the scheduler SHALL query the database for the next due card
**And** SHALL schedule an update at that card's due time
**And** SHALL add the client to the active connections set

#### Scenario: Last client disconnects

**Given** one client is connected
**When** that client disconnects
**Then** the scheduler SHALL cancel the scheduled update timer
**And** SHALL clear the active connections set

#### Scenario: Scheduled update fires

**Given** a timer is scheduled for the next due card at time T
**When** time T is reached
**Then** the scheduler SHALL broadcast updated statistics to all clients
**And** SHALL query for the next due card
**And** SHALL schedule a new timer for that card's due time

#### Scenario: No due cards in near future

**Given** the scheduler queries for the next due card
**When** no cards have due dates within the next 24 hours
**Then** the scheduler SHALL set a fallback timer for 1 hour
**And** SHALL re-check for due cards after that hour

---

### Requirement: Next Due Card Query

**Priority**: MUST
**Tag**: backend-repository

The `cardRepository` SHALL provide a method `getNextDueCard()` that:

- Returns the earliest `due` timestamp among all cards where `due > NOW()`
- Returns `null` if no cards have future due dates
- Uses an indexed query for performance

#### Scenario: Cards with future due dates exist

**Given** the database contains cards with due dates in the future
**When** `getNextDueCard()` is called
**Then** it SHALL return an object with the earliest `due` timestamp
**And** the query SHALL execute in O(log N) time using index

#### Scenario: No cards with future due dates

**Given** all cards have due dates in the past or no cards exist
**When** `getNextDueCard()` is called
**Then** it SHALL return `null`

---

### Requirement: Broadcast on Data Mutation

**Priority**: MUST
**Tag**: backend-integration

The backend SHALL broadcast updated statistics via SSE after any operation that modifies course or card data:

- After training review completion (`POST /api/training/review`)
- After card creation, update, or deletion (`POST/PUT/DELETE /api/cards`, batch operations)
- After course update or deletion (`PUT/DELETE /api/courses/:id`)
- After settings modification (`PUT /api/settings/*`)

#### Scenario: User completes training review

**Given** a client is connected to `/api/stats/stream`
**When** a training review is submitted and processed
**Then** the scheduler SHALL query updated statistics
**And** SHALL send a `stats-update` event to all connected clients
**And** the event SHALL contain the latest course statistics

#### Scenario: User adds a new card

**Given** a client is connected to `/api/stats/stream`
**When** a new card is created via `POST /api/cards`
**Then** the scheduler SHALL broadcast updated statistics
**And** SHALL also re-schedule the next update if the new card's due is sooner than the currently scheduled time

#### Scenario: User modifies course settings

**Given** a client is connected to `/api/stats/stream`
**When** course settings are updated via `PUT /api/courses/:id`
**Then** the scheduler SHALL broadcast updated statistics reflecting any changes in due card counts

---

### Requirement: Frontend SSE Integration

**Priority**: MUST
**Tag**: frontend-composable

The frontend SHALL provide a composable `useStatsStream(onUpdate)` that:

- Establishes an EventSource connection to `/api/stats/stream`
- Invokes the `onUpdate` callback with parsed statistics on each event
- Automatically reconnects on connection errors (via browser built-in)
- Closes the connection on component unmount

#### Scenario: HomePage subscribes to stats stream

**Given** the user navigates to the home page
**When** the `HomePage` component mounts
**Then** `useStatsStream` SHALL create an EventSource connection
**And** SHALL receive the initial stats event
**And** SHALL update the course store with the received statistics

#### Scenario: EventSource receives update event

**Given** the EventSource is connected
**When** a `stats-update` event is received
**Then** the composable SHALL parse the event data
**And** SHALL invoke the `onUpdate` callback with the parsed statistics
**And** the UI SHALL reactively update to reflect the new data

#### Scenario: Connection error occurs

**Given** the EventSource is connected
**When** a network error or server restart occurs
**Then** the EventSource SHALL automatically attempt to reconnect
**And** the composable SHALL reflect the disconnected state
**And** SHALL restore the connected state upon successful reconnection

---

### Requirement: Remove Polling Mechanism

**Priority**: MUST
**Tag**: frontend-cleanup

The frontend SHALL remove the `setTimeout`-based polling mechanism from `HomePage.vue`:

- The `update()` function and its recursive `setTimeout` SHALL be deleted
- The `onMounted` hook SHALL no longer call `update()`
- Initial course loading (if needed outside SSE) SHALL be handled separately

#### Scenario: HomePage no longer polls for updates

**Given** the new SSE-based updates are implemented
**When** the home page is rendered
**Then** there SHALL be no `setTimeout` calls for periodic updates
**And** statistics updates SHALL arrive exclusively via SSE events

---

### Requirement: SSE Message Format

**Priority**: MUST
**Tag**: backend-api

SSE events sent by the backend SHALL follow this format:

```text
event: stats-update
data: {"courses":[{"courseId":1,"stats":{"total":50,"newCards":5,"dueToday":12,"lastTraining":"2026-01-09T18:00:00.000Z"}}]}
```

Where:

- `event` field is always `stats-update`
- `data` field contains a JSON object with a `courses` array
- Each item in `courses` contains `courseId` and `stats` object matching the existing stats schema

#### Scenario: Client receives valid SSE message

**Given** a client is connected to the SSE stream
**When** the server broadcasts a stats update
**Then** the message SHALL include the `event: stats-update` line
**And** the `data:` line SHALL contain a valid JSON string
**And** the frontend SHALL successfully parse the JSON and extract course statistics
