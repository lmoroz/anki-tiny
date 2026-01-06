# Frontend Integration - Course Management

Frontend integration with implemented backend API for course management, including creation of Pinia stores, API services, UI components, and pages.

## Proposed Changes

### Data Layer

#### [NEW] [shared/api/courses.js](file:///e:/Develop/anki-tiny/frontend/src/shared/api/courses.js)

API service for working with courses, using axios client:

```javascript
import api from './client';

export const coursesApi = {
    async getAll () {
        const response = await api.get('/courses');
        return response.data;
    },

    async getById (id) {
        const response = await api.get(`/courses/${ id }`);
        return response.data;
    },

    async create (data) {
        const response = await api.post('/courses', data);
        return response.data;
    },

    async update (id, data) {
        const response = await api.put(`/courses/${ id }`, data);
        return response.data;
    },

    async delete (id) {
        const response = await api.delete(`/courses/${ id }`);
        return response.data;
    }
};
```

#### [NEW] [shared/types/course.ts](file:///e:/Develop/anki-tiny/frontend/src/shared/types/course.ts)

TypeScript types for courses (matching backend schema):

```typescript
export interface Course {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseDto {
  name: string;
  description?: string;
}

export interface UpdateCourseDto {
  name?: string;
  description?: string;
}
```

---

### State Management

#### [NEW] [entities/course/model/useCourseStore.js](file:///e:/Develop/anki-tiny/frontend/src/entities/course/model/useCourseStore.js)

Pinia store for course state management:

**State:**

- `courses: Course[]` - list of all courses
- `loading: boolean` - loading indicator
- `error: string | null` - loading/operation error

**Actions:**

- `fetchCourses()` - load all courses
- `createCourse(data)` - create new course
- `updateCourse(id, data)` - update course
- `deleteCourse(id)` - delete course
- `getCourseById(id)` - get course by ID (from state)

**Getters:**

- `sortedCourses` - courses sorted by update date (newest first)

---

### Shared UI Components

#### [NEW] [shared/ui/Input.vue](file:///e:/Develop/anki-tiny/frontend/src/shared/ui/Input.vue)

Base text input component supporting:

- `v-model` binding
- Variants: `text`, `textarea`
- States: `error`, `disabled`
- Label and placeholder

#### [NEW] [shared/ui/Modal.vue](file:///e:/Develop/anki-tiny/frontend/src/shared/ui/Modal.vue)

Modal window with:

- Backdrop with blur effect
- Appearance/disappearance animation
- Close on ESC and click outside
- Slots: `header`, `body`, `footer`

---

### Widgets Layer

#### [NEW] [widgets/course-list/CourseList.vue](file:///e:/Develop/anki-tiny/frontend/src/widgets/course-list/CourseList.vue)

Widget for displaying course list:

**Functionality:**

- Display courses in grid layout
- Uses `CourseCard` for each course
- Emits events (edit, delete, select) upwards
- Empty state when no courses

#### [NEW] [widgets/course-list/CourseCard.vue](file:///e:/Develop/anki-tiny/frontend/src/widgets/course-list/CourseCard.vue)

Single course card:

**Displayed Information:**

- Course name
- Description (if any)
- Last updated date
- Card count (TODO: after cards API implementation)

**Actions:**

- Click on card → navigate to course
- "Edit" button → emits `@edit` event
- "Delete" button → emits `@delete` event

**Styling:**

- Gradient background with hover effect
- Icons from `bootstrap-icons`
- Hover animation (scale, shadow)

#### [NEW] [widgets/course-editor/CourseEditorModal.vue](file:///e:/Develop/anki-tiny/frontend/src/widgets/course-editor/CourseEditorModal.vue)

Modal for creating/editing a course:

**Functionality:**

- Modes: create / edit
- Form with fields:
    - Name (required)
    - Description (optional)
- Client-side validation (min length for name)
- API error handling
- Buttons: Save, Cancel

---

### Pages Layer

#### [MODIFY] [pages/home/HomePage.vue](file:///e:/Develop/anki-tiny/frontend/src/pages/home/HomePage.vue)

Integration with real data:

**Changes:**

- Connect `useCourseStore` instead of mock
- Load courses on component mount
- Display `CourseList` widget if courses exist
- Open `CourseEditorModal` when creating course
- Handle course deletion with confirmation
- Handle course editing

---

### Main Application

#### [MODIFY] [app/main.js](file:///e:/Develop/anki-tiny/frontend/src/app/main.js)

Pinia connection:

```javascript
import { createPinia } from 'pinia';

const pinia = createPinia();
app.use(pinia);
```

---

## Verification Plan

### Checking Existing Tests

Backend already has API endpoints for courses, which were tested in previous session (documented in `Testing_API.md`). Frontend tests are missing in the project.

### Automated Tests

Automated frontend testing is not configured at this stage. Adding Vitest in future iterations is recommended.

### Manual Verification

#### 1. Backend API Check

**Command:**

```bash
cd backend
npm run dev
```

**Check:** Backend should start on port 3000 (or dynamic port). API endpoints `/api/courses` must be available.

---

#### 2. Course Loading Check

**Command:**

```bash
cd backend
npm run electron:dev
```

**Steps:**

1. Application launches in Electron
2. HomePage displays correctly
3. If no courses → Empty State with "Create first course" button displays
4. Open DevTools (F12) and check:
    - Console: no API load errors
    - Network: request `GET http://localhost:3000/api/courses` executes successfully

**Expected Result:** Empty state displays, API request executes without errors.

---

#### 3. Course Creation Check

**Steps:**

1. Click "Create Course" button
2. Modal window opens
3. Fill form:
    - Name: "English Language"
    - Description: "Basic vocabulary"
4. Click "Save"
5. Check in DevTools:
    - Network: `POST http://localhost:3000/api/courses` returns 201
    - Console: no errors
6. Modal closes
7. New course appears in list

**Expected Result:** Course is created, appears in list.

---

#### 4. Course Editing Check

**Steps:**

1. Hover over course card
2. Click "Edit" button (pencil icon)
3. Modal opens with filled data
4. Change name to "English Language (Updated)"
5. Click "Save"
6. Check in DevTools:
    - Network: `PUT http://localhost:3000/api/courses/1` returns 200
7. Course card updates with new name

**Expected Result:** Course updates, changes are reflected.

---

#### 5. Course Deletion Check

**Steps:**

1. Hover over course card
2. Click "Delete" button (trash bin icon)
3. Confirm dialog appears with warning
4. Confirm deletion
5. Check in DevTools:
    - Network: `DELETE http://localhost:3000/api/courses/1` returns 200
6. Course disappears from list
7. If it was the last course → Empty State displays

**Expected Result:** Course deleted, list updated.

---

#### 6. Error Handling Check

**Steps:**

1. Stop backend server
2. Try to create new course
3. Check that:
    - Error message is displayed
    - Modal does not close
    - User can retry

**Expected Result:** Errors handled correctly, clear message shown to user.

---

#### 7. Form Validation Check

**Steps:**

1. Open create course modal
2. Try to save with empty Name field
3. Check that:
    - Validation error displays
    - Request not sent to backend
    - "Save" button disabled or shows error

**Expected Result:** Form validates on client side.

---

#### 8. UI/UX Check

**Check:**

- All animations (fade transitions, hover effects) work smoothly
- Modal closes on ESC and backdrop click
- Loading states display during operations
- Styles match design (gradients, spacing, typography)

**Expected Result:** UI meets modern standards, animations are smooth.

---

## Additional Notes

> [!NOTE]
> Basic course management functionality will be ready after this stage implementation.
> Next step - Cards management implementation (cards CRUD API + frontend).
>
> [!TIP]
> Recommended to use `@vueuse/core` composables (e.g. `useConfirmDialog`) for confirm dialogs instead of native `window.confirm`.
