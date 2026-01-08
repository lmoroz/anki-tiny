# settings-course-management Specification

## Purpose

TBD - created by archiving change add-settings-page. Update Purpose after archive.

## Requirements

### Requirement: View Course Settings

The system SHALL allow users to view settings for individual courses, showing whether they use global defaults or custom
values.

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

### Requirement: Course Settings SHALL Include Per-Course Training Limits

**Priority:** MUST  
**Rationale:** Разные курсы могут требовать разной нагрузки

#### Scenario: Course Limits Stored in Database

**GIVEN** пользователь создал курс  
**WHEN** настройки курса сохраняются  
**THEN** таблица `courseSettings` ДОЛЖНА поддерживать поля:

- `newCardsPerDay: integer | null` — лимит новых карточек в день
- `maxReviewsPerDay: integer | null` — лимит повторений в день
- `newCardsPerSession: integer | null` — новых карточек за сессию
- `maxReviewsPerSession: integer | null` — повторений за сессию

#### Scenario: Null Values Inherit From Global Settings

**GIVEN** курсовая настройка `newCardsPerDay = NULL`  
**AND** глобальная настройка `globalNewCardsPerDay = 30`  
**WHEN** система вычисляет эффективные настройки курса  
**THEN** эффективное значение `newCardsPerDay` ДОЛЖНО быть 30 (унаследовано)

#### Scenario: Explicit Course Limit Overrides Global

**GIVEN** курсовая настройка `newCardsPerDay = 10`  
**AND** глобальная настройка `globalNewCardsPerDay = 30`  
**WHEN** система вычисляет эффективные настройки  
**THEN** эффективное значение ДОЛЖНО быть 10 (курсовое имеет приоритет)

---

### Requirement: Course Settings API SHALL Return Limit Fields

**Priority:** MUST  
**Rationale:** Frontend должен получать и отправлять лимиты

#### Scenario: Get Course Settings Includes Limits

**GIVEN** курс имеет индивидуальные настройки  
**WHEN** клиент запрашивает `GET /api/courses/:id/settings`  
**THEN** ответ ДОЛЖЕН включать:

```json
{
  "newCardsPerDay": 15,
  "maxReviewsPerDay": 100,
  "newCardsPerSession": 10,
  "maxReviewsPerSession": 50
}
```

**OR** если настройки не установлены (наследуются):

```json
{
  "newCardsPerDay": null,
  "maxReviewsPerDay": null,
  "newCardsPerSession": null,
  "maxReviewsPerSession": null
}
```

#### Scenario: Update Course Limits

**GIVEN** пользователь изменяет лимиты курса  
**WHEN** клиент отправляет `PUT /api/courses/:id/settings` с телом:

```json
{
  "newCardsPerDay": 20,
  "maxReviewsPerSession": 30
}
```

**THEN** API ДОЛЖЕН сохранить указанные значения  
**AND** другие поля (не указанные) ДОЛЖНЫ остаться без изменений

---

### Requirement: Course Settings UI SHALL Display Limit Controls with Inheritance Hints

**Priority:** MUST  
**Rationale:** Пользователь должен понимать, какие значения унаследованы

#### Scenario: Course Settings Modal Shows Limit Sections

**GIVEN** пользователь открывает модальное окно настроек курса  
**WHEN** окно отображается  
**THEN** ДОЛЖНЫ присутствовать два раздела:

**Раздел "Дневные лимиты":**

- Number input "Новых карточек в день"
  - Placeholder: "Наследуется (глобально: 20)"
  - Hint: "Оставьте пустым для использования глобального значения"
- Number input "Повторений в день"
  - Placeholder: "Наследуется (глобально: 200)"

**Раздел "Сессионные лимиты":**

- Number input "Новых карточек за сессию" — default 10
- Number input "Повторений за сессию" — default 50

#### Scenario: Clear Course Limit to Inherit

**GIVEN** курс имеет `newCardsPerDay = 15`  
**AND** пользователь очищает поле (устанавливает в пустое значение)  
**WHEN** пользователь сохраняет настройки  
**THEN** API ДОЛЖЕН сохранить `newCardsPerDay = null`  
**AND** курс ДОЛЖЕН начать использовать глобальное значение

---

### Requirement: Validation SHALL Enforce Reasonable Limit Ranges

**Priority:** MUST  
**Rationale:** Предотвращение некорректных значений

#### Scenario: Reject Negative Limits

**GIVEN** пользователь пытается установить `newCardsPerSession = -5`  
**WHEN** форма отправляет данные на API  
**THEN** API ДОЛЖЕН вернуть 400 Bad Request  
**AND** сообщение об ошибке ДОЛЖНО указывать на недопустимое значение

#### Scenario: Accept Zero Limits

**GIVEN** пользователь устанавливает `newCardsPerDay = 0`  
**WHEN** настройки сохраняются  
**THEN** API ДОЛЖЕН принять значение  
**AND** курс НЕ ДОЛЖЕН показывать новые карточки (блокировка)

#### Scenario: Warn on Extreme Values

**GIVEN** пользователь устанавливает `maxReviewsPerDay = 1000`  
**WHEN** форма валидирует значение  
**THEN** UI МОЖЕТ показать предупреждение "Это очень большое значение"  
**BUT** ДОЛЖЕН разрешить сохранение (не блокировать)

---
