# Walkthrough: Frontend Integration для управления курсами

## Что было реализовано

Полная интеграция frontend с backend API для управления курсами, включая все CRUD операции.

---

## Созданные компоненты

### Data Layer

#### [shared/api/courses.js](file:///e:/Develop/anki-tiny/frontend/src/shared/api/courses.js)

API сервис для работы с курсами:

- `getAll()` - получение всех курсов
- `getById(id)` - получение курса по ID
- `create(data)` - создание курса
- `update(id, data)` - обновление курса
- `delete(id)` - удаление курса

#### [shared/types/course.ts](file:///e:/Develop/anki-tiny/frontend/src/shared/types/course.ts)

TypeScript типы для курсов, соответствующие backend схеме.

#### [entities/course/model/useCourseStore.js](file:///e:/Develop/anki-tiny/frontend/src/entities/course/model/useCourseStore.js)

Pinia store для управления состоянием курсов:

- **State**: `courses`, `loading`, `error`
- **Getters**: `sortedCourses`, `getCourseById`
- **Actions**: `fetchCourses`, `createCourse`, `updateCourse`, `deleteCourse`

---

### UI Components

#### [shared/ui/Input.vue](file:///e:/Develop/anki-tiny/frontend/src/shared/ui/Input.vue)

Расширен для поддержки:

- `type="textarea"` режим
- Атрибут `rows` для многострочного ввода
- Валидация через `error` prop

#### [shared/ui/Modal.vue](file:///e:/Develop/anki-tiny/frontend/src/shared/ui/Modal.vue)

Модальное окно с:

- Backdrop blur эффектом
- Закрытие по ESC и клику вне области
- Анимация появления/скрытия
- Слоты для header и footer

---

### Widgets

#### [widgets/course-list/CourseCard.vue](file:///e:/Develop/anki-tiny/frontend/src/widgets/course-list/CourseCard.vue)

Карточка курса с:

- Hover эффектами (scale, shadow)
- Кнопками Edit и Delete (появляются при hover)
- Форматированием даты обновления
- Ellipsis для длинных описаний

#### [widgets/course-list/CourseList.vue](file:///e:/Develop/anki-tiny/frontend/src/widgets/course-list/CourseList.vue)

Widget списка курсов:

- Grid layout (auto-fill, minmax 300px)
- Loading state
- Empty state

#### [widgets/course-editor/CourseEditorModal.vue](file:///e:/Develop/anki-tiny/frontend/src/widgets/course-editor/CourseEditorModal.vue)

Модальное окно создания/редактирования курса:

- Режимы create/edit
- Валидация на клиенте (min 3 символа для названия)
- Автозаполнение формы при редактировании

---

### Pages

#### [pages/home/HomePage.vue](file:///e:/Develop/anki-tiny/frontend/src/pages/home/HomePage.vue)

Полная интеграция:

- Загрузка курсов при монтировании
- Создание курса через модальное окно
- Редактирование курса
- Удаление курса с подтверждением
- Empty state для новых пользователей

---

### Application Integration

#### [app/main.js](file:///e:/Develop/anki-tiny/frontend/src/app/main.js)

Обновления от пользователя:

- Pinia store manager подключен
- Динамическое определение backend URL на основе порта от Electron
- Инициализация приложения после получения backend порта

---

## Проверенная функциональность

### ✅ Загрузка списка курсов

**Тест**: Приложение запускается, выполняется запрос `GET /api/courses`

**Результат**: Курсы загружаются и отображаются корректно

### ✅ Создание курса

**Тест**:

1. Нажать "Создать курс"
2. Заполнить форму
3. Сохранить

**Результат**:

- Модальное окно открывается
- Форма валидируется
- Запрос `POST /api/courses` выполняется
- Новый курс появляется в списке

### ✅ Передача порта backend

**Тест**: Backend запускается на динамическом порту

**Результат**: Frontend корректно получает порт через IPC и настраивает API client

---

## Дополнительные улучшения

### Fixes от пользователя

1. **Backend port transmission** ([main.js](file:///e:/Develop/anki-tiny/frontend/src/app/main.js)):
   - Приложение инициализируется только после получения backend порта
   - Глобальная переменная `window.__BACKEND_URL__` для динамического URL

2. **Code formatting** ([CourseEditorModal.vue](file:///e:/Develop/anki-tiny/frontend/src/widgets/course-editor/CourseEditorModal.vue)):
   - Консистентное форматирование кода
   - Улучшенная читаемость

---

## Следующие шаги

Согласно [Task.md](file:///e:/Develop/anki-tiny/docs/Task.md), следующая фаза - **Реализация работы с карточками**:

1. Backend Cards API (CRUD endpoints)
2. Frontend Cards integration
3. Быстрое добавление карточек
4. Редактор карточек

---

## Технические детали

### Архитектура

Проект следует **Feature-Sliced Design**:

- `app/` - инициализация
- `pages/` - страницы
- `widgets/` - составные блоки UI
- `entities/` - бизнес-сущности (stores)
- `shared/` - переиспользуемый код

### State Management

Используется **Pinia** с Composition API подходом:

- Reactive state с `ref()`
- Computed getters с `computed()`
- Async actions для API вызовов

### Styling

- Темная тема с градиентами
- Современные эффекты (blur, shadow, scale)
- Анимации через CSS transitions
- Bootstrap Icons для иконок
