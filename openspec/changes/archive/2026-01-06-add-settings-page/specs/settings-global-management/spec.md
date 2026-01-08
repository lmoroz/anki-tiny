# Capability: Global Settings Management

## ADDED Requirements

### Requirement: View Global Settings

The system SHALL allow users to view current global application settings through a dedicated settings interface.

#### Scenario: User opens settings page

- **GIVEN** user is logged into the application
- **WHEN** user navigates to `/settings`
- **THEN** the SettingsPage displays current global settings
- **AND** all fields show current values (trainingStartHour, trainingEndHour, minTimeBeforeEnd, notificationsEnabled)

#### Scenario: No settings exist yet (first launch)

- **GIVEN** user launches application for the first time
- **WHEN** user navigates to `/settings`
- **THEN** default values are displayed (8:00-22:00, 4 hours, notifications enabled)

### Requirement: Update Global Settings

The system SHALL allow users to modify and persist global settings that apply as defaults for all courses.

#### Scenario: User updates training time window

- **GIVEN** user is on SettingsPage
- **WHEN** user changes trainingStartHour to 9 and trainingEndHour to 21
- **AND** clicks "Save"
- **THEN** settings are persisted via `PUT /api/settings`
- **AND** success notification is displayed
- **AND** new settings take effect immediately

#### Scenario: User updates minimum time before day end

- **GIVEN** user is on SettingsPage
- **WHEN** user changes minTimeBeforeEnd to 5 hours
- **AND** clicks "Save"
- **THEN** new value is saved
- **AND** FSRS scheduling uses new constraint

#### Scenario: User toggles notifications

- **GIVEN** user is on SettingsPage
- **WHEN** user unchecks "Enable notifications"
- **AND** clicks "Save"
- **THEN** notificationsEnabled is set to false
- **AND** system stops sending notifications

### Requirement: Validate Global Settings

The system SHALL enforce validation rules to prevent invalid settings configurations.

#### Scenario: Invalid time range (start >= end)

- **GIVEN** user is editing global settings
- **WHEN** user sets trainingStartHour to 20 and trainingEndHour to 8
- **THEN** validation error is displayed: "Start must be before end"
- **AND** Save button is disabled
- **AND** no API request is made

#### Scenario: Invalid minTimeBeforeEnd value

- **GIVEN** user is editing global settings
- **WHEN** user sets minTimeBeforeEnd to 15 hours
- **THEN** validation error is displayed: "Must be between 1-12 hours"
- **AND** Save button is disabled

#### Scenario: Training window too short

- **GIVEN** user sets trainingStartHour to 20 and trainingEndHour to 22
- **WHEN** user tries to save with minTimeBeforeEnd = 4 hours
- **THEN** validation error: "Training window too short for minimum time"
- **AND** Save button is disabled

### Requirement: Preview Schedule Impact

The system SHALL display a preview of when training is available and when new cards are blocked.

#### Scenario: User views schedule preview

- **GIVEN** user has set training window 9:00-21:00 with minTimeBeforeEnd = 4
- **WHEN** user is on SettingsPage
- **THEN** preview shows: "Training available 9:00-21:00"
- **AND** shows: "New cards blocked after 17:00"

### Requirement: Settings Persistence

The system SHALL persist global settings across application restarts.

#### Scenario: Settings survive app restart

- **GIVEN** user has saved custom global settings
- **WHEN** user closes and reopens the application
- **THEN** custom settings are loaded from database
- **AND** displayed in SettingsPage
