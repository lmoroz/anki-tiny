# Walkthrough: Frontend Integration for Course Management

## Implemented Features

Full frontend integration with backend API for course management, including all CRUD operations.

---

## Created Components

### Data Layer

#### [shared/api/courses.js](file:///e:/Develop/anki-tiny/frontend/src/shared/api/courses.js)

API service for courses:

- `getAll()` - get all courses
- `getById(id)` - get course by ID
- `create(data)` - create course
- `update(id, data)` - update course
- `delete(id)` - delete course

#### [shared/types/course.ts](file:///e:/Develop/anki-tiny/frontend/src/shared/types/course.ts)

TypeScript types for courses matching backend schema.

#### [entities/course/model/useCourseStore.js](file:///e:/Develop/anki-tiny/frontend/src/entities/course/model/useCourseStore.js)

Pinia store for course state management:

- **State**: `courses`, `loading`, `error`
- **Getters**: `sortedCourses`, `getCourseById`
- **Actions**: `fetchCourses`, `createCourse`, `updateCourse`, `deleteCourse`

---

### UI Components

#### [shared/ui/Input.vue](file:///e:/Develop/anki-tiny/frontend/src/shared/ui/Input.vue)

Extended to support:

- `type="textarea"` mode
- `rows` attribute for multi-line input
- Validation via `error` prop

#### [shared/ui/Modal.vue](file:///e:/Develop/anki-tiny/frontend/src/shared/ui/Modal.vue)

Modal window with:

- Backdrop blur effect
- Close on ESC and click outside
- Fade in/out animation
- Slots for header and footer

---

### Widgets

#### [widgets/course-list/CourseCard.vue](file:///e:/Develop/anki-tiny/frontend/src/widgets/course-list/CourseCard.vue)

Course card with:

- Hover effects (scale, shadow)
- Edit and Delete buttons (appear on hover)
- Update date formatting
- Ellipsis for long descriptions

#### [widgets/course-list/CourseList.vue](file:///e:/Develop/anki-tiny/frontend/src/widgets/course-list/CourseList.vue)

Course list widget:

- Grid layout (auto-fill, minmax 300px)
- Loading state
- Empty state

#### [widgets/course-editor/CourseEditorModal.vue](file:///e:/Develop/anki-tiny/frontend/src/widgets/course-editor/CourseEditorModal.vue)

Course creation/editing modal:

- Create/Edit modes
- Client-side validation (min 3 chars for name)
- Auto-fill form on edit

---

### Pages

#### [pages/home/HomePage.vue](file:///e:/Develop/anki-tiny/frontend/src/pages/home/HomePage.vue)

Full integration:

- Load courses on mount
- Create course via modal
- Edit course
- Delete course with confirmation
- Empty state for new users

---

### Application Integration

#### [app/main.js](file:///e:/Develop/anki-tiny/frontend/src/app/main.js)

Updates from user:

- Pinia store manager connected
- Dynamic backend URL determination based on Electron port
- App initialization only after receiving backend port

---

## Verified Functionality

### ✅ Load Course List

**Test**: App starts, execution of `GET /api/courses`

**Result**: Courses loaded and displayed correctly

### ✅ Create Course

**Test**:

1. Click "Create Course"
2. Fill form
3. Save

**Result**:

- Modal opens
- Form validates
- Request `POST /api/courses` executed
- New course appears in list

### ✅ Backend Port Transmission

**Test**: Backend starts on dynamic port

**Result**: Frontend correctly receives port via IPC and configures API client

---

## Additional Improvements

### User Fixes

1. **Backend port transmission** ([main.js](file:///e:/Develop/anki-tiny/frontend/src/app/main.js)):
    - App inits only after getting backend port
    - Global variable `window.__BACKEND_URL__` for dynamic URL

2. **Code formatting** ([CourseEditorModal.vue](file:///e:/Develop/anki-tiny/frontend/src/widgets/course-editor/CourseEditorModal.vue)):
    - Consistent code formatting
    - Improved readability

---

## Next Steps

According to [Task.md](Task.md), next phase - **Cards Management Implementation**:

1. Backend Cards API (CRUD endpoints)
2. Frontend Cards integration
3. Quick add cards
4. Card editor

---

## Technical Details

### Architecture

Project follows **Feature-Sliced Design**:

- `app/` - initialization
- `pages/` - pages
- `widgets/` - composite UI blocks
- `entities/` - business entities (stores)
- `shared/` - reusable code

### State Management

Using **Pinia** with Composition API approach:

- Reactive state with `ref()`
- Computed getters with `computed()`
- Async actions for API calls

### Styling

- Dark theme with gradients
- Modern effects (blur, shadow, scale)
- Animations via CSS transitions
- Bootstrap Icons for icons
