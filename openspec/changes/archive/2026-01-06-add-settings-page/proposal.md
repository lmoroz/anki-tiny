# Proposal: Add Settings Page

## Summary

Implement comprehensive settings management functionality to allow users to configure global application parameters and course-specific overrides. This includes time-based training restrictions, notification preferences, and FSRS customization aligned with the project's core requirement for flexible, user-controlled learning schedules.

## Motivation

**Problem:**
Currently, there is no user-facing interface to configure critical application behaviors:

- Training time windows (when cards can be studied)
- Minimum time before end-of-day for new cards (4-hour FSRS requirement)
- Notification preferences
- Course-specific settings overrides

Without this functionality:

- All users are locked to default settings
- Cannot optimize training schedules for individual routines
- Cannot customize FSRS behavior per course
- Cannot enable/disable notifications

**User Impact:**

- Users cannot adapt the app to their daily schedule
- Power users cannot fine-tune learning parameters
- System behaves identically for all courses (no specialization)

## Proposed Solution

### High-Level Approach

Create a **SettingsPage** with two main sections:

1. **Global Settings** — default parameters for all courses
2. **Course-Specific Settings** — overrides for individual courses (optional)

Settings inherit from global to course-specific using a **fallback pattern**:

```
effectiveSettings = courseSettings || globalSettings
```

### Key Capabilities

1. **settings-global-management** — CRUD for application-wide settings
2. **settings-course-management** — CRUD for course-specific overrides
3. **settings-ui** — User interface for viewing/editing settings

### Architecture

**Frontend (Feature-Sliced Design):**

```
frontend/src/
├── entities/settings/
│   └── model/useSettingsStore.js    # Pinia store
├── widgets/
│   ├── settings-form/               # Reusable form component
│   ├── time-range-picker/           # Time selection UI
│   └── course-settings-modal/       # Modal for course overrides
├── pages/settings/
│   └── SettingsPage.vue             # Main settings page
└── shared/
    ├── api/settings.js              # API client
    └── types/settings.ts            # TypeScript interfaces
```

**Backend (Already implemented):**

- API endpoints exist: `/api/settings`, `/api/courses/:id/settings`
- Validation schemas exist (Zod)
- Repository layer exists

### Settings Schema

```typescript
interface GlobalSettings {
  trainingStartHour: number; // 0-23, default: 8
  trainingEndHour: number; // 0-23, default: 22
  minTimeBeforeEnd: number; // hours, default: 4
  notificationsEnabled: boolean; // default: true
}
```

**Validation Rules:**

- `trainingStartHour < trainingEndHour`
- `minTimeBeforeEnd` between 1-12 hours
- Training window duration >= `minTimeBeforeEnd`

## User Stories

### US-1: Configure Global Training Window

**As a** user  
**I want** to set my training time window (e.g., 9:00-21:00)  
**So that** the app only shows me cards during my preferred study hours

### US-2: Set Minimum Time Before Day End

**As a** user  
**I want** to configure minimum time required before end-of-day  
**So that** I'm not shown new cards when I don't have enough time to complete the first review cycle

### US-3: Customize Course Settings

**As a** power user  
**I want** different training schedules for different courses  
**So that** I can study language cards in the morning and technical cards in the evening

### US-4: Reset Course to Global Settings

**As a** user  
**I want** to remove custom course settings and revert to global defaults  
**So that** I can experiment with settings without permanent changes

## Risks and Mitigations

### Risk: Complex Validation Logic

**Impact:** Invalid settings could break FSRS scheduling  
**Mitigation:** Real-time client-side validation + server-side enforcement

### Risk: Settings Inheritance Confusion

**Impact:** Users don't understand when course settings override global  
**Mitigation:** Clear UI indicators (badges: "Global" vs "Custom")

### Risk: Backend API Already Exists

**Impact:** Need to verify compatibility with existing implementation  
**Mitigation:** Test all endpoints before frontend integration

## Success Criteria

- [ ] User can view and edit global settings
- [ ] User can view and edit course-specific settings
- [ ] Settings validation prevents invalid configurations
- [ ] UI clearly indicates inheritance (global vs custom)
- [ ] Changes persist across app restarts
- [ ] No breaking changes to existing backend API

## Out of Scope

- Advanced FSRS parameter tuning (stability, difficulty multipliers)
- Import/Export of settings
- Settings versioning or history
- Multi-user settings profiles
- Settings sync across devices

## Timeline Estimate

- **Planning:** ~1 hour (this proposal)
- **Implementation:** ~4-6 hours
  - Entity Layer: ~1.5 hours
  - Widgets: ~2 hours
  - Integration & Testing: ~1.5 hours
- **Documentation:** ~0.5 hours

**Total:** ~5-7 hours of development work

## Dependencies

- ✅ Backend API endpoints already implemented
- ✅ Database schema already has `settings` and `courseSettings` tables
- ✅ Validation schemas (Zod) already defined
- ❓ Need to verify existing API matches expected behavior

## Related Work

- Refer to: `docs/Implementation_Plan.md` (detailed technical design)
- Refer to: `docs/Task.md` (task checklist)
- Builds on: Existing FSRS implementation (4-hour learning step requirement)
