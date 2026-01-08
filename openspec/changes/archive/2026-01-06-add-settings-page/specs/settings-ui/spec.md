# Capability: Settings User Interface

## ADDED Requirements

### Requirement: SettingsPage Layout

The system SHALL provide a clear, organized settings interface with global and course-specific sections.

#### Scenario: User views SettingsPage

- **GIVEN** user navigates to `/settings`
- **WHEN** page loads
- **THEN** two main sections are displayed: "Global Settings" and "Course Settings"
- **AND** Global Settings section shows SettingsForm
- **AND** Course Settings section shows list of all courses with configure buttons

#### Scenario: Loading state

- **GIVEN** user navigates to `/settings`
- **WHEN** data is being fetched
- **THEN** loading indicator is displayed
- **AND** form fields are not yet visible

#### Scenario: Empty state (no courses)

- **GIVEN** user has no courses created
- **WHEN** user views SettingsPage
- **THEN** Global Settings section is shown
- **AND** Course Settings section shows "No courses yet" message

### Requirement: TimeRangePicker Component

The system SHALL provide an intuitive time range selection interface with visual feedback.

#### Scenario: User selects time range

- **GIVEN** TimeRangePicker is rendered in SettingsForm
- **WHEN** user selects start hour from dropdown
- **THEN** visual timeline updates to show active window
- **AND** `update:start` event is emitted

#### Scenario: Visual timeline representation

- **GIVEN** trainingStartHour = 8, trainingEndHour = 22
- **WHEN** TimeRangePicker is rendered
- **THEN** horizontal timeline shows 24-hour scale
- **AND** active range (8-22) is highlighted in blue
- **AND** labels show 0:00, 6:00, 12:00, 18:00, 24:00 marks

#### Scenario: Disabled state

- **GIVEN** TimeRangePicker has `disabled` prop = true
- **WHEN** component is rendered
- **THEN** select dropdowns are disabled
- **AND** visual timeline shows inactive styling

### Requirement: SettingsForm Validation Feedback

The system SHALL provide real-time validation feedback to prevent invalid settings.

#### Scenario: Real-time validation errors

- **GIVEN** user is editing settings in SettingsForm
- **WHEN** user enters invalid time range
- **THEN** error message appears immediately below field
- **AND** message text is red (#d93025)
- **AND** Save button becomes disabled

#### Scenario: Validation success

- **GIVEN** user has fixed all validation errors
- **WHEN** all fields contain valid values
- **THEN** no error messages are displayed
- **AND** Save button is enabled

#### Scenario: Help text display

- **GIVEN** SettingsForm is rendered
- **WHEN** user sees minTimeBeforeEnd field
- **THEN** help text explains: "New cards won't show if less than this time remains"

### Requirement: CourseSettingsModal Behavior

The system SHALL provide a modal interface for configuring course-specific settings.

#### Scenario: Open modal from CoursePage

- **GIVEN** user is viewing a course page
- **WHEN** user clicks "Course Settings" button
- **THEN** CourseSettingsModal opens
- **AND** modal header shows course name
- **AND** current settings (global or custom) are loaded

#### Scenario: Toggle between global and custom

- **GIVEN** CourseSettingsModal is open
- **WHEN** user clicks "Custom settings" radio button
- **THEN** form fields become editable
- **AND** values change from global to course-specific (if exist)

#### Scenario: Close modal

- **GIVEN** CourseSettingsModal is open
- **WHEN** user clicks "Cancel" or ESC key
- **THEN** modal closes without saving
- **AND** no API request is made

#### Scenario: Save custom settings

- **GIVEN** user has edited custom settings in modal
- **WHEN** user clicks "Save"
- **THEN** loading indicator appears on Save button
- **AND** API request is made
- **AND** on success, modal closes
- **AND** "saved" event is emitted

### Requirement: Keyboard Navigation

The system SHALL support keyboard navigation for accessibility.

#### Scenario: Tab navigation

- **GIVEN** SettingsPage is open
- **WHEN** user presses Tab key
- **THEN** focus moves between form fields in logical order
- **AND** focus indicators are visible

#### Scenario: ESC closes modal

- **GIVEN** CourseSettingsModal is open
- **WHEN** user presses ESC key
- **THEN** modal closes without saving

### Requirement: Success/Error Notifications

The system SHALL provide clear feedback for save operations.

#### Scenario: Success notification

- **GIVEN** user saves global settings
- **WHEN** API request succeeds
- **THEN** toast notification appears: "Settings saved successfully"
- **AND** notification auto-dismisses after 3 seconds

#### Scenario: Error notification

- **GIVEN** user saves settings
- **WHEN** API request fails (e.g., network error)
- **THEN** error notification appears with message
- **AND** form remains open with current values
- **AND** user can retry

### Requirement: Responsive Design

The system SHALL adapt settings UI for different screen sizes.

#### Scenario: Desktop layout

- **GIVEN** viewport width > 768px
- **WHEN** SettingsPage is rendered
- **THEN** form uses two-column grid for selectors
- **AND** max-width = 800px, centered

#### Scenario: Mobile layout

- **GIVEN** viewport width < 768px
- **WHEN** SettingsPage is rendered
- **THEN** form uses single-column layout
- **AND** modal adapts to full-screen width
