# Frontend Integration - Управление курсами

Интеграция frontend с реализованным backend API для управления курсами, включая создание
Pinia stores, API сервисов, UI компонентов и страниц.

## Предлагаемые изменения

### Data Layer

#### [NEW] [shared/api/courses.js](file:///e:/Develop/anki-tiny/frontend/src/shared/api/courses.js)

API сервис для работы с курсами, использующий axios client:

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

TypeScript типы для курсов (соответствуют backend схеме):

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

Pinia store для управления состоянием курсов:

**State:**

- `courses: Course[]` - список всех курсов
- `loading: boolean` - индикатор загрузки
- `error: string | null` - ошибка загрузки/операций

**Actions:**

- `fetchCourses()` - загрузка всех курсов
- `createCourse(data)` - создание нового курса
- `updateCourse(id, data)` - обновление курса
- `deleteCourse(id)` - удаление курса
- `getCourseById(id)` - получение курса по ID (из состояния)

**Getters:**

- `sortedCourses` - курсы, отсортированные по дате обновления (новые первые)

---

### Shared UI Components

#### [NEW] [shared/ui/Input.vue](file:///e:/Develop/anki-tiny/frontend/src/shared/ui/Input.vue)

Базовый компонент текстового поля с поддержкой:

- `v-model` binding
- Варианты: `text`, `textarea`
- Состояния: `error`, `disabled`
- Label и placeholder

#### [NEW] [shared/ui/Modal.vue](file:///e:/Develop/anki-tiny/frontend/src/shared/ui/Modal.vue)

Модальное окно с:

- Backdrop с blur эффектом
- Анимация появления/скрытия
- Закрытие по ESC и клику вне области
- Слоты: `header`, `body`, `footer`

---

### Widgets Layer

#### [NEW] [widgets/course-list/CourseList.vue](file:///e:/Develop/anki-tiny/frontend/src/widgets/course-list/CourseList.vue)

Widget для отображения списка курсов:

**Функциональность:**

- Отображение курсов в grid layout
- Использует `CourseCard` для каждого курса
- Передает события (edit, delete, select) наверх
- Empty state при отсутствии курсов

#### [NEW] [widgets/course-list/CourseCard.vue](file:///e:/Develop/anki-tiny/frontend/src/widgets/course-list/CourseCard.vue)

Карточка одного курса:

**Отображаемая информация:**

- Название курса
- Описание (если есть)
- Дата последнего обновления
- Количество карточек (TODO: после реализации cards API)

**Действия:**

- Клик по карточке → переход к курсу
- Кнопка "Edit" → эмит события `@edit`
- Кнопка "Delete" → эмит события `@delete`

**Стилизация:**

- Градиентный фон с hover эффектом
- Иконки из `bootstrap-icons`
- Hover анимация (scale, shadow)

#### [NEW] [widgets/course-editor/CourseEditorModal.vue](file:///e:/Develop/anki-tiny/frontend/src/widgets/course-editor/CourseEditorModal.vue)

Модальное окно для создания/редактирования курса:

**Функциональность:**

- Режимы: create / edit
- Форма с полями:
    - Name (обязательное)
    - Description (опциональное)
- Валидация на клиенте (min length для name)
- Обработка ошибок от API
- Кнопки: Save, Cancel

---

### Pages Layer

#### [MODIFY] [pages/home/HomePage.vue](file:///e:/Develop/anki-tiny/frontend/src/pages/home/HomePage.vue)

Интеграция с реальными данными:

**Изменения:**

- Подключить `useCourseStore` вместо заглушки
- Загрузка курсов при монтировании компонента
- Отображение `CourseList` widget при наличии курсов
- Открытие `CourseEditorModal` при создании курса
- Обработка удаления курса с подтверждением
- Обработка редактирования курса

---

### Main Application

#### [MODIFY] [app/main.js](file:///e:/Develop/anki-tiny/frontend/src/app/main.js)

Подключение Pinia:

```javascript
import { createPinia } from 'pinia';

const pinia = createPinia();
app.use(pinia);
```

---

## План верификации

### Проверка существующих тестов

Backend уже имеет API endpoints для courses, которые были протестированы в предыдущей сессии
(задокументировано в `Testing_API.md`). Frontend тесты в проекте отсутствуют.

### Automated Tests

На данном этапе автоматизированное тестирование frontend не настроено. Рекомендуется добавление
Vitest в будущих итерациях.

### Manual Verification

#### 1. Проверка Backend API

**Команда:**

```bash
cd backend
npm run dev
```

**Проверка:** Backend должен запуститься на порту 3000 (или динамическом порту). API endpoints
`/api/courses` должны быть доступны.

---

#### 2. Проверка загрузки курсов

**Команда:**

```bash
cd backend
npm run electron:dev
```

**Шаги:**

1. Приложение запускается в Electron
2. HomePage отображается корректно
3. Если курсов нет → отображается Empty State с кнопкой "Создать первый курс"
4. Открыть DevTools (F12) и проверить:
    - Console: нет ошибок загрузки API
    - Network: запрос `GET http://localhost:3000/api/courses` выполняется успешно

**Ожидаемый результат:** Empty state отображается, API запрос выполняется без ошибок.

---

#### 3. Проверка создания курса

**Шаги:**

1. Нажать кнопку "Создать курс"
2. Модальное окно открывается
3. Заполнить форму:
    - Name: "Английский язык"
    - Description: "Базовая лексика"
4. Нажать "Сохранить"
5. Проверить в DevTools:
    - Network: `POST http://localhost:3000/api/courses` возвращает 201
    - Console: нет ошибок
6. Модальное окно закрывается
7. Новый курс появляется в списке

**Ожидаемый результат:** Курс создается, отображается в списке.

---

#### 4. Проверка редактирования курса

**Шаги:**

1. Навести на карточку курса
2. Нажать кнопку "Edit" (иконка карандаша)
3. Модальное окно открывается с заполненными данными
4. Изменить название на "English Language"
5. Нажать "Сохранить"
6. Проверить в DevTools:
    - Network: `PUT http://localhost:3000/api/courses/1` возвращает 200
7. Карточка курса обновляется с новым названием

**Ожидаемый результат:** Курс обновляется, изменения отображаются.

---

#### 5. Проверка удаления курса

**Шаги:**

1. Навести на карточку курса
2. Нажать кнопку "Delete" (иконка корзины)
3. Появляется confirm dialog с предупреждением
4. Подтвердить удаление
5. Проверить в DevTools:
    - Network: `DELETE http://localhost:3000/api/courses/1` возвращает 200
6. Курс исчезает из списка
7. Если это был последний курс → отображается Empty State

**Ожидаемый результат:** Курс удаляется, список обновляется.

---

#### 6. Проверка обработки ошибок

**Шаги:**

1. Остановить backend сервер
2. Попытаться создать новый курс
3. Проверить, что:
    - Отображается сообщение об ошибке
    - Модальное окно не закрывается
    - Пользователь может повторить попытку

**Ожидаемый результат:** Ошибки обрабатываются корректно, пользователю показывается понятное сообщение.

---

#### 7. Проверка валидации формы

**Шаги:**

1. Открыть модальное окно создания курса
2. Попытаться сохранить с пустым полем Name
3. Проверить, что:
    - Отображается ошибка валидации
    - Запрос на backend не отправляется
    - Кнопка "Сохранить" disabled или показывает ошибку

**Ожидаемый результат:** Форма валидируется на клиенте.

---

#### 8. Проверка UI/UX

**Проверка:**

- Все анимации (fade transitions, hover effects) работают плавно
- Модальное окно закрывается по ESC и клику по backdrop
- Loading states отображаются при операциях
- Стили соответствуют дизайну (градиенты, spacing, typography)

**Ожидаемый результат:** UI соответствует современным стандартам, анимации плавные.

---

## Дополнительные замечания

> [!NOTE]
> После реализации этого этапа будет готов базовый функционал управления курсами.
> Следующий шаг - реализация работы с карточками (cards CRUD API + frontend).
>
> [!TIP]
> Рекомендуется использовать `@vueuse/core` composables (например, `useConfirmDialog`) для
> confirm dialogs вместо нативного `window.confirm`.
