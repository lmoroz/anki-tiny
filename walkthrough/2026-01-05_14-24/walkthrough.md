# Walkthrough: Создание базовой архитектуры Anki Tiny

## Что было реализовано

Создана полная базовая архитектура frontend-приложения согласно Feature-Sliced Design и plan реализации.

---

## 1. Архитектура проекта (Feature-Sliced Design)

### Структура директорий

Создана следующая структура в `frontend/src/`:

```
frontend/src/
├── app/                  # Инициализация приложения
│   ├── main.js          # Точка входа
│   ├── App.vue          # Корневой компонент
│   └── router/          # Vue Router конфигурация
│       └── index.js
├── pages/               # Страницы
│   ├── home/HomePage.vue
│   ├── course/CoursePage.vue
│   ├── training/TrainingPage.vue
│   └── settings/SettingsPage.vue
├── widgets/             # Составные UI блоки
│   ├── title-bar/TitleBar.vue
│   ├── course-list/
│   └── card-editor/
├── features/            # Бизнес-фичи
│   ├── create-course/
│   ├── add-card/
│   └── spaced-repetition/
├── entities/            # Бизнес-сущности
│   ├── course/
│   ├── card/
│   └── settings/
└── shared/              # Переиспользуемый код
    ├── ui/              # UI-примитивы
    │   ├── Button.vue
    │   ├── Input.vue
    │   └── Card.vue
    ├── api/client.js    # HTTP клиент
    ├── lib/             # Утилиты
    └── types/           # TypeScript типы
        └── electron.d.ts
```

---

## 2. Кастомный Title Bar

### [TitleBar.vue](file:///e:/Develop/anki-tiny/frontend/src/widgets/title-bar/TitleBar.vue)

Реализован полнофункциональный кастомный заголовок окна:

**Функции:**
- ✅ Draggable область (с использованием `-webkit-app-region: drag`)
- ✅ Кнопка Minimize
- ✅ Кнопка Maximize/Restore (с динамической иконкой)
- ✅ Кнопка Close (с hover эффектом в стиле Windows)
- ✅ Интеграция с Electron IPC через `window.electronAPI`

**Стилизация:**
- Backdrop blur эффект для премиального вида
- Анимации hover/active states
- Иконки из Bootstrap Icons
- Фиксированная высота 36px

---

## 3. Базовые UI компоненты (Shared Layer)

### [Button.vue](file:///e:/Develop/anki-tiny/frontend/src/shared/ui/Button.vue)

Универсальный компонент кнопки с вариантами:
- `primary` - основной акцент
- `secondary` - второстепенные действия
- `danger` - деструктивные действия
- `ghost` - минималистичные кнопки

Размеры: `sm`, `md`, `lg`

### [Input.vue](file:///e:/Develop/anki-tiny/frontend/src/shared/ui/Input.vue)

Компонент поля ввода с поддержкой:
- Label
- Placeholder
- Error states (красный border + сообщение об ошибке)
- v-model binding

### [Card.vue](file:///e:/Develop/anki-tiny/frontend/src/shared/ui/Card.vue)

Компонент карточки для контента:
- Backdrop blur эффект
- Настраиваемый padding (`sm`, `md`, `lg`)
- Опциональный hover эффект (`hoverable`)

---

## 4. Роутинг (Hash Mode)

### [router/index.js](file:///e:/Develop/anki-tiny/frontend/src/app/router/index.js)

Настроен Vue Router с **hash mode** для корректной работы с кастомным протоколом `lmorozanki://`.

**Маршруты:**
- `/` → HomePage
- `/course/:id` → CoursePage
- `/training/:id` → TrainingPage
- `/settings` → SettingsPage

> [!IMPORTANT]
> Использование `createWebHashHistory` критически важно, так как `createWebHistory` не работает с custom protocol схемами.

---

## 5. Страницы приложения

### [HomePage.vue](file:///e:/Develop/anki-tiny/frontend/src/pages/home/HomePage.vue)

**Функционал:**
- Отображение списка курсов
- Кнопка "Создать курс"
- Empty state с призывом к действию
- Loading state

**UI элементы:**
- Заголовок страницы с описанием
- Grid layout для курсов
- Красивый empty state с иконкой

---

### [CoursePage.vue](file:///e:/Develop/anki-tiny/frontend/src/pages/course/CoursePage.vue)

**Функционал:**
- Детальный вид курса
- Статистика (количество карточек)
- Кнопка "Начать тренировку"
- Навигация назад

**UI элементы:**
- Card с информацией о курсе
- Секция для списка карточек (placeholder)

---

### [TrainingPage.vue](file:///e:/Develop/anki-tiny/frontend/src/pages/training/TrainingPage.vue)

**Функционал:**
- Переворачиваемая карточка (клик для flip)
- Отображение вопроса и ответа
- Кнопки оценки сложности (Снова, Сложно, Хорошо, Легко)
- Навигация для завершения тренировки

**UI элементы:**
- Большая интерактивная карточка
- Подсказка о возможности переворота
- Grid кнопок ответов (показываются только после flip)

---

### [SettingsPage.vue](file:///e:/Develop/anki-tiny/frontend/src/pages/settings/SettingsPage.vue)

**Функционал:**
- Настройка временных рамок тренировок
- Input fields для начала и конца дня
- Кнопка сохранения настроек с loading state
- Info boxes с пояснениями

---

## 6. Интеграция с Electron API

### [electron.d.ts](file:///e:/Develop/anki-tiny/frontend/src/shared/types/electron.d.ts)

Типы для интеграции с Electron:

```typescript
interface ElectronAPI {
  onBackendPort: (callback: (port: number) => void) => void;
  openNewWindow: (path: string) => void;
  minimize: () => void;
  toggleMaximize: () => void;
  close: () => void;
  showNotification: (title: string, body: string) => void;
}
```

### [client.js](file:///e:/Develop/anki-tiny/frontend/src/shared/api/client.js)

HTTP клиент на базе axios:
- Динамическое определение backend порта через `window.electronAPI.onBackendPort`
- Автоматический baseURL: `http://localhost:{port}/api`
- Interceptor для логирования ошибок

---

## 7. Корневой компонент

### [App.vue](file:///e:/Develop/anki-tiny/frontend/src/app/App.vue)

**Структура:**
- TitleBar (фиксированный сверху)
- router-view с fade transition
- Глобальные стили

**Стили:**
- Градиентный фон
- Full height layout
- Scroll контейнер для контента

---

## 8. Обновленные файлы

### [index.html](file:///e:/Develop/anki-tiny/frontend/index.html)

- ✅ Обновлен title: "Anki Tiny"
- ✅ Правильный путь к main.js: `/src/app/main.js`
- ✅ Удалены ненужные Tailwind классы из body

---

## Проверка работы

### Dev Server

Frontend dev server успешно запущен:

```bash
cd frontend
npm run dev
```

**Результат:**
```
VITE v7.3.0 ready in 609 ms
➜  Local:   http://localhost:5173/
```

Приложение доступно по адресу [http://localhost:5173/](http://localhost:5173/)

---

## Следующие шаги

Согласно `task.md`, следующие фазы:

### Фаза 3: Основной функционал
- [ ] Реализовать создание/редактирование курсов
- [ ] Добавить работу с карточками
- [ ] Внедрить алгоритм интервального повторения

### Фаза 4: Настройки
- [ ] Глобальные настройки
- [ ] Настройки курса

### Фаза 5: Системная интеграция
- [ ] Системные уведомления
- [ ] Tray integration

### Фаза 6: Backend и хранение данных
- [ ] REST API endpoints
- [ ] Персистентное хранилище (SQLite/JSON)

---

## Технический стэк

**Реализовано:**
- ✅ Vue 3 (Composition API, `<script setup>`)
- ✅ Vue Router (Hash mode)
- ✅ Tailwind CSS (v4.1.17)
- ✅ Bootstrap Icons
- ✅ Axios
- ✅ TypeScript типы для Electron API

**Готово к интеграции:**
- Electron IPC handlers (уже настроены в `preload.ts`)
- Backend API (axios client готов)

---

## Выполненные задачи

- [x] Создана структура по Feature-Sliced Design
- [x] Настроен Vue Router с hash mode
- [x] Реализован кастомный Title Bar
- [x] Созданы базовые UI компоненты (Button, Input, Card)
- [x] Реализованы все основные страницы
- [x] Настроена интеграция с Electron API
- [x] Создан HTTP клиент для backend
- [x] Обновлен index.html

Приложение готово к дальнейшей разработке функциональности!
