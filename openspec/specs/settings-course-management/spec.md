# settings-course-management Specification

## Purpose

TBD - created by archiving change add-settings-page. Update Purpose after archive.

## Requirements

### Requirement: View Course Settings

The system SHALL allow users to view settings for individual courses, showing whether they use global defaults or custom values.

#### Scenario: Course uses global settings

- **GIVEN** course "Spanish Vocabulary" has no custom settings
- **WHEN** user views course settings in SettingsPage
- **THEN** badge displays "Global"
- **AND** effective settings show global values

#### Scenario: Course uses custom settings

- **GIVEN** course "Math Formulas" has custom settings
- **WHEN** user views course settings in SettingsPage
- **THEN** badge displays "Custom"
- **AND** effective settings show course-specific values

### Requirement: Create Course-Specific Settings

The system SHALL allow users to override global settings for individual courses.

#### Scenario: User creates custom settings for course

- **GIVEN** user opens CourseSettingsModal for "Spanish Vocabulary"
- **WHEN** user toggles to "Custom settings"
- **AND** sets trainingStartHour to 7 and trainingEndHour to 12
- **AND** clicks "Save"
- **THEN** settings are persisted via `PUT /api/courses/:id/settings`
- **AND** course badge changes to "Custom"
- **AND** course uses new time window for scheduling

#### Scenario: User edits existing custom settings

- **GIVEN** course "Math Formulas" already has custom settings
- **WHEN** user opens CourseSettingsModal
- **AND** changes minTimeBeforeEnd to 3 hours
- **AND** clicks "Save"
- **THEN** updated settings are persisted
- **AND** FSRS scheduling for this course uses new value

### Requirement: Reset Course Settings to Global

The system SHALL allow users to remove custom course settings and revert to global defaults.

#### Scenario: User resets course to global settings

- **GIVEN** course "Spanish Vocabulary" has custom settings
- **WHEN** user opens CourseSettingsModal
- **AND** clicks "Reset to Global"
- **AND** confirms action
- **THEN** custom settings are deleted via `DELETE /api/courses/:id/settings`
- **AND** badge changes to "Global"
- **AND** course uses global settings

### Requirement: Settings Inheritance Clarity

The system SHALL clearly indicate which settings are in effect for each course.

#### Scenario: User views settings source

- **GIVEN** multiple courses with mixed global/custom settings
- **WHEN** user views SettingsPage course list
- **THEN** each course displays a badge ("Global" or "Custom")
- **AND** "Configure" button is available for all courses

#### Scenario: Modal shows current effective settings

- **GIVEN** user opens CourseSettingsModal
- **WHEN** "Use global settings" is selected
- **THEN** form fields display global values in readonly mode
- **AND** preview section shows effective schedule

### Requirement: Course Settings Validation

The system SHALL enforce the same validation rules for course-specific settings as for global settings.

#### Scenario: Invalid course settings rejected

- **GIVEN** user creates custom settings for course
- **WHEN** user sets invalid time range (start >= end)
- **THEN** validation error is displayed
- **AND** Save button is disabled

### Requirement: Settings Affect Scheduling

The system SHALL use effective settings (course-specific or global) when determining card due times.

#### Scenario: Course with custom time window

- **GIVEN** course has custom trainingStartHour = 6, trainingEndHour = 10
- **WHEN** FSRS scheduler calculates due cards
- **THEN** only cards due between 6:00-10:00 are shown
- **AND** new cards blocked after 6:00 (10:00 - 4 hours)
