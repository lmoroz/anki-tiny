# План реализации Repetitio

Electron-приложение для обучения с помощью карточек и интервального повторения на базе Vue 3, TypeScript,
Tailwind CSS и Express backend.

> [!IMPORTANT]
> Приложение использует кастомный протокол `lmorozanki://` для загрузки frontend-ресурсов,
> что требует особой настройки роутинга и CSP политик.

> [!IMPORTANT]
> Окно приложения использует `frame: false` (без стандартной рамки), поэтому необходима реализация
> собственного title bar с window controls (minimize, maximize, close).

---

## Предлагаемые изменения

### Архитектура Frontend

#### Feature-Sliced Design

Организация кода по слоям:

```text
frontend/src/
├── app/              # Инициализация приложения
│   ├── main.js      # Точка входа
│   ├── App.vue      # Корневой компонент
│   └── router/      # Конфигурация роутера
├── pages/           # Страницы приложения
│   ├── home/
│   ├── course/
│   ├── training/
│   └── settings/
├── widgets/         # Составные блоки UI
│   ├── title-bar/   # Кастомный заголовок окна
│   ├── course-list/
│   └── card-editor/
├── features/        # Бизнес-фичи
│   ├── create-course/
│   ├── add-card/
│   └── spaced-repetition/
├── entities/        # Бизнес-сущности
│   ├── course/
│   ├── card/
│   └── settings/
└── shared/          # Переиспользуемый код
    ├── ui/          # UI-примитивы
    ├── lib/         # Утилиты
    ├── api/         # HTTP клиент
    └── types/       # TypeScript типы
```

---

### Компоненты и модули

#### App Layer

##### [NEW] [main.js](file:///e:/Develop/anki-tiny/frontend/src/app/main.js)

- Инициализация Vue приложения
- Подключение router, глобальных стилей
- Регистрация Electron API handlers

##### [NEW] [App.vue](file:///e:/Develop/anki-tiny/frontend/src/app/App.vue)

- Корневой компонент с `TitleBar` widget
- Область для `<router-view>`
- Глобальные overlay (notifications, modals)

##### [NEW] [router/index.js](file:///e:/Develop/anki-tiny/frontend/src/app/router/index.js)

- Конфигурация Vue Router с **hash mode** (`createWebHashHistory`)
- Маршруты: `/`, `/course/:id`, `/training/:id`, `/settings`
- Navigation guards для проверки состояния

> [!WARNING]
> Использование `createWebHashHistory` обязательно из-за кастомного протокола `lmorozanki://`.
> WebHistory не будет работать корректно.

---

#### Widgets Layer

##### [NEW] [title-bar/TitleBar.vue](file:///e:/Develop/anki-tiny/frontend/src/widgets/title-bar/TitleBar.vue)

Реализация кастомного заголовка окна:

**Функциональность:**

- Отображение title приложения
- Область с `-webkit-app-region: drag` для перетаскивания окна
- Кнопки управления окном:
    - **Minimize**: `window.electronAPI.minimize()`
    - **Maximize/Restore**: `window.electronAPI.toggleMaximize()`
    - **Close**: `window.electronAPI.close()`

**Стилизация:**

- Фиксированная высота: 32-40px
- Backdrop blur эффект (acrylic material)
- Иконки из `bootstrap-icons`
- Hover states для кнопок

**Технические детали:**

```css
.title-bar {
    -webkit-app-region: drag;
}

.window-controls button {
    -webkit-app-region: no-drag;
}
```

##### [NEW] [course-list/CourseList.vue](file:///e:/Develop/anki-tiny/frontend/src/widgets/course-list/CourseList.vue)

- Список курсов с превью (название, количество карточек, прогресс)
- Кнопки действий (Edit, Delete, Start Training)

##### [NEW] [card-editor/CardEditor.vue](file:///e:/Develop/anki-tiny/frontend/src/widgets/card-editor/CardEditor.vue)

- Форма для создания/редактирования карточки
- Поля: Front, Back
- Rich text поддержка (опционально)

---

#### Pages Layer

##### [NEW] [home/HomePage.vue](file:///e:/Develop/anki-tiny/frontend/src/pages/home/HomePage.vue)

- Главная страница с обзором курсов
- Использует `CourseList` widget
- Кнопка "Создать курс"

##### [NEW] [course/CoursePage.vue](file:///e:/Develop/anki-tiny/frontend/src/pages/course/CoursePage.vue)

- Детальный вид курса
- Список карточек
- Быстрое добавление карточек
- Настройки курса

##### [NEW] [training/TrainingPage.vue](file:///e:/Develop/anki-tiny/frontend/src/pages/training/TrainingPage.vue)

- Интерфейс тренировки
- Отображение карточки (Front → Back при клике)
- Кнопки оценки сложности (Again, Hard, Good, Easy)
- Прогресс-бар текущей сессии

##### [NEW] [settings/SettingsPage.vue](file:///e:/Develop/anki-tiny/frontend/src/pages/settings/SettingsPage.vue)

- Глобальные настройки
- Временные рамки тренировок (с/по)
- Параметры интервального повторения

---

#### Shared Layer

##### [NEW] [shared/ui/Button.vue](file:///e:/Develop/anki-tiny/frontend/src/shared/ui/Button.vue)

Базовый компонент кнопки с вариантами: primary, secondary, danger

##### [NEW] [shared/ui/Input.vue](file:///e:/Develop/anki-tiny/frontend/src/shared/ui/Input.vue)

Базовый компонент поля ввода

##### [NEW] [shared/ui/Card.vue](file:///e:/Develop/anki-tiny/frontend/src/shared/ui/Card.vue)

Базовый компонент карточки для контента

##### [NEW] [shared/api/client.js](file:///e:/Develop/anki-tiny/frontend/src/shared/api/client.js)

HTTP клиент на базе axios для работы с backend API:

```javascript
import axios from 'axios';

let backendPort = 3000;

window.electronAPI?.onBackendPort((port) => {
    backendPort = port;
});

const api = axios.create({
                             baseURL: `http://localhost:${ backendPort }/api`,
                         });

export default api;
```

##### [NEW] [shared/types/electron.d.ts](file:///e:/Develop/anki-tiny/frontend/src/shared/types/electron.d.ts)

TypeScript типы для Electron API:

```typescript
interface ElectronAPI {
  onBackendPort: (callback: (port: number) => void) => void;
  openNewWindow: (path: string) => void;
  minimize: () => void;
  toggleMaximize: () => void;
  close: () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
```

---

### Backend

#### API Endpoints

##### [NEW] [routes/courses.ts](file:///e:/Develop/anki-tiny/backend/src/routes/courses.ts)

- `GET /api/courses` - список курсов
- `POST /api/courses` - создание курса
- `GET /api/courses/:id` - получение курса
- `PUT /api/courses/:id` - обновление курса
- `DELETE /api/courses/:id` - удаление курса

##### [NEW] [routes/cards.ts](file:///e:/Develop/anki-tiny/backend/src/routes/cards.ts)

- `GET /api/courses/:courseId/cards` - список карточек курса
- `POST /api/courses/:courseId/cards` - добавление карточки
- `PUT /api/cards/:id` - обновление карточки
- `DELETE /api/cards/:id` - удаление карточки

##### [NEW] [routes/training.ts](file:///e:/Develop/anki-tiny/backend/src/routes/training.ts)

- `GET /api/courses/:courseId/due-cards` - карточки для повторения
- `POST /api/training/review` - отправка результата повторения

##### [NEW] [routes/settings.ts](file:///e:/Develop/anki-tiny/backend/src/routes/settings.ts)

- `GET /api/settings` - получение глобальных настроек
- `PUT /api/settings` - обновление настроек
    - `trainingStartHour`: начало дня для тренировок (по умолчанию 8)
    - `trainingEndHour`: конец дня для тренировок (по умолчанию 22)
    - `minTimeBeforeEnd`: минимальное время до конца дня (4 часа)
    - `notificationsEnabled`: включены ли уведомления

##### [NEW] [routes/course-settings.ts](file:///e:/Develop/anki-tiny/backend/src/routes/course-settings.ts)

- `GET /api/courses/:courseId/settings` - получение настроек курса
- `PUT /api/courses/:courseId/settings` - обновление настроек курса
- `DELETE /api/courses/:courseId/settings` - сброс к глобальным настройкам

---

#### Services

##### [NEW] [services/database.ts](file:///e:/Develop/anki-tiny/backend/src/services/database.ts)

Сервис для работы с персистентным хранилищем (JSON или SQLite):

- Инициализация БД в `app.getPath('userData')`
- CRUD операции

##### [NEW] [services/spaced-repetition.ts](file:///e:/Develop/anki-tiny/backend/src/services/spaced-repetition.ts)

Реализация алгоритма интервального повторения (FSRS):

- Расчет следующего интервала повторения
- Обновление easiness factor
- Определение due date

##### [NEW] [services/notifications.ts](file:///e:/Develop/anki-tiny/backend/src/services/notifications.ts)

Сервис для системных уведомлений:

- Проверка наличия карточек для повторения
- Фильтрация по времени тренировок (`trainingStartHour` / `trainingEndHour`)
- **Важно**: Не предлагать новые карточки, если до конца дня осталось меньше 4 часов
  (первый шаг интервального повторения = 4 часа)
- Отправка Electron Notification
- Периодическая проверка (каждый час)

##### [NEW] [services/statistics.ts](file:///e:/Develop/anki-tiny/backend/src/services/statistics.ts)

Сервис для статистики прогресса:

- Расчет статистики по курсу (всего карточек, изучено, осталось)
- История обучения по дням
- Точность ответов (Again/Hard/Good/Easy)

---

#### Electron Integration

##### [MODIFY] [electron/main.ts](file:///e:/Develop/anki-tiny/backend/src/electron/main.ts)

**Добавить поддержку Tray:**

```typescript
import {Tray, Menu} from 'electron';

let tray: Tray | null = null;

function createTray() {
  tray = new Tray(path.join(__dirname, '../../icon.png'));

  const contextMenu = Menu.buildFromTemplate([
    {label: 'Открыть', click: () => mainWindow?.show()},
    {label: 'Выход', click: () => app.quit()}
  ]);

  tray.setToolTip('Repetitio');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    mainWindow?.show();
  });
}

// Изменить поведение window-close
ipcMain.on('window-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win?.hide(); // Скрыть вместо закрытия (свернуть в трей)
  event.preventDefault(); // Предотвратить закрытие
});

// Обработка quit из трея
app.on('before-quit', () => {
  // Cleanup
});
```

**Настроить уведомления:**

```typescript
import {Notification} from 'electron';

ipcMain.handle('show-notification', (_, title, body) => {
  new Notification({title, body}).show();
});
```

##### [MODIFY] [electron/preload.ts](file:///e:/Develop/anki-tiny/backend/src/electron/preload.ts)

Добавить метод для уведомлений:

```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  // ... существующие методы
  showNotification: (title: string, body: string) =>
    ipcRenderer.invoke('show-notification', title, body),
});
```

---

### Конфигурация

#### [MODIFY] [vite.config.js](file:///e:/Develop/anki-tiny/frontend/vite.config.js)

CSP политика уже настроена корректно для протокола `lmorozanki://`.

**Проверить:**

- `base: './'` - относительные пути
- CSP включает `lmorozanki:` для всех source директив

##### [MODIFY] [index.html](file:///e:/Develop/anki-tiny/frontend/index.html)

Обновить title:

```html
<title>Repetitio</title>
```

Обновить путь к main.js:

```html

<script type="module" src="/src/app/main.js"></script>
```

---

### Работа с карточками

Чтобы внедрить FSRS (Free Spaced Repetition Scheduler),  
нужно отойти от простых множителей и сохранять историю «состояния» памяти для каждой карточки.  
Используем библиотеку <https://github.com/open-spaced-repetition/ts-fsrs>

#### 1. Поля в базе данных для каждой карточки

В классическом SM-2 (старый Anki) мы хранили «фактор легкости».  
В FSRS нам нужно хранить переменные, которые описывают текущую «прочность» знания.

##### 1. Обязательные поля для FSRS

Библиотека ts-fsrs ожидает, что ты передашь ей объект карты. Чтобы восстановить этот объект из БД, тебе нужны эти поля:

`due` **(Datetime)**: Дата и время следующего показа.
Именно по этому полю ты будешь делать запрос `SELECT * FROM cards WHERE due <= NOW()`.

`stability` **(Float)**: Один из ключевых параметров FSRS.

`difficulty` **(Float)**: Текущая сложность карты.

`elapsed_days` **(Int)**: Сколько дней прошло с последнего успешного повторения.

`scheduled_days` **(Int)**: На какой интервал карта была отправлена в прошлый раз.

`reps` **(Int)**: Общее количество повторений.

`lapses` **(Int)**: Сколько раз пользователь забыл карту (нажал "Again").

`state` **(Int/Enum)**: Состояние карты (0 - New, 1 - Learning, 2 - Review, 3 - Relearning).

##### 2. Дополнительные поля для твоей логики

Чтобы реализовать «шаги обучения» (например, те самые 4 часа) и `enable_fuzz`, добавь:

`last_review` **(Datetime)**: Время последнего ответа. Нужно для расчетов и статистики.

`step_index` **(Int)**: Если у тебя в настройках колоды указаны шаги (например, `["10m", "4h"]`), это поле хранит, на
каком шаге сейчас находится новая карта.

##### Пример структуры (JSON/SQL)

| Поле           | Тип        | Описание                                                  |
|----------------|------------|-----------------------------------------------------------|
| id             | UUID / Int | Первичный ключ                                            |
| deck_id        | Int        | Ссылка на колоду/курс (где лежат настройки `enable_fuzz`) |
| question       | Text       | Текст вопроса                                             |
| answer         | Text       | Текст ответа                                              |
| due            | Timestamp  | Когда показать в следующий раз                            |
| stability      | Double     | Параметр стабильности FSRS                                |
| difficulty     | Double     | Параметр сложности FSRS                                   |
| elapsed_days   | Int        | Дней с прошлого раза                                      |
| scheduled_days | Int        | На сколько дней планировалась                             |
| reps           | Int        | Всего повторов                                            |
| lapses         | Int        | Всего забываний                                           |
| state          | Int        | "0=New, 1=Learn, 2=Review, 3=Relearn"                     |
| last_review    | Timestamp  | Дата последнего ответа                                    |

#### 2. Как адаптировать интервалы под пользователя (про 4 часа)

Библиотека `ts-fsrs` позволяет передать объект `FSRSParameters`. Чтобы реализовать кастомные короткие интервалы, тебе
нужно использовать механизм **Learning Steps**.

1. **Настройка колоды**: Храни в БД для каждой колоды массив `learning_steps`. Например: `[0.16, 4]` (в часах) или
   просто в минутах `[10, 240]`.
2. **Логика**:
    - Когда карта в состоянии **New** или **Learning**, ты не используешь основную формулу FSRS для расчета `due`.
    - Вместо этого ты берешь значение из своего массива `learning_steps[card.step_index]`.
    - При нажатии "Good" ты увеличиваешь `step_index` и ставишь `due = now + steps[index]`.
    - Как только шаги кончились, переводишь `state` в **Review** — и вот тут уже в дело вступает полноценный `ts-fsrs`.

##### Про `enable_fuzz`

**Fuzz** — это небольшое случайное отклонение интервала, чтобы карточки, выученные в один день, не приходили «толпой»
через месяц в один и тот же день.

В `ts-fsrs` это делается при инициализации:

```typescript
const params = createEmptyParams();
params.enable_fuzz = true; // берешь из настроек колоды в БД
const f = fsrs(params);
```

Если `enable_fuzz` включен, библиотека сама будет чуть-чуть менять `scheduled_days`
(например, вместо 10 дней поставит 9 или 11), что автоматически изменит дату `due`.

## План верификации

### Automated Tests

#### Unit тесты для Spaced Repetition сервиса

**Команда:**

```bash
cd backend
npm run test
```

**Описание:**
Добавить тесты в `backend/tests/services/spaced-repetition.test.ts` для проверки корректности расчета интервалов.

#### E2E тесты основных сценариев

Использовать Playwright для автоматизации:

1. Создание курса
2. Добавление карточек
3. Прохождение тренировки

---

### Manual Verification

#### 1. Проверка кастомного Title Bar

**Шаги:**

1. Запустить приложение: `cd backend && npm run electron:dev`
2. Убедиться, что заголовок окна отображается корректно
3. Проверить работу кнопок:
    - **Minimize** - окно сворачивается
    - **Maximize** - окно разворачивается на весь экран
    - **Close** - окно сворачивается в трей (не закрывается)
4. Попробовать перетащить окно за title bar

**Ожидаемый результат:** Все кнопки работают, окно можно перетаскивать.

---

#### 2. Проверка роутинга с кастомным протоколом

**Шаги:**

1. Запустить приложение
2. Перейти на разные страницы через UI
3. Проверить, что URL в DevTools имеет формат `lmorozanki://app/index.html#/route`
4. Открыть DevTools (F12) и проверить консоль на наличие ошибок загрузки ресурсов

**Ожидаемый результат:** Все ресурсы загружаются без ошибок 404, роутинг работает.

---

#### 3. Проверка работы с Tray

**Шаги:**

1. Запустить приложение
2. Нажать кнопку "Close" в title bar
3. Убедиться, что окно скрылось, но приложение не закрылось
4. Найти иконку в системном трее
5. Кликнуть по иконке трея

**Ожидаемый результат:** Окно снова появляется.

---

#### 4. Проверка системных уведомлений

**Шаги:**

1. Создать курс и добавить несколько карточек
2. Пройти тренировку
3. Дождаться времени следующего повторения (можно вручную изменить due date в БД)
4. Проверить, что появилось системное уведомление

**Ожидаемый результат:** Уведомление отображается в системном трее Windows/macOS/Linux.

---

#### 5. Проверка production build

**Команда:**

```bash
cd backend
npm run bundle
```

**Шаги:**

1. Запустить команду сборки
2. Найти установщик в `dist/`
3. Установить приложение на чистую систему
4. Запустить и проверить базовый функционал

**Ожидаемый результат:** Приложение запускается и работает корректно.

---

## Расширенный функционал (опционально)

### Статистика прогресса обучения

#### [NEW] [routes/statistics.ts](file:///e:/Develop/anki-tiny/backend/src/routes/statistics.ts)

- `GET /api/courses/:courseId/statistics` - статистика по курсу
- `GET /api/statistics/daily` - статистика по дням

#### [NEW] [pages/statistics/StatisticsPage.vue](file:///e:/Develop/anki-tiny/frontend/src/pages/statistics/StatisticsPage.vue)

- Dashboard с графиками прогресса
- Отображение количества изученных карточек по дням/неделям
- Точность ответов

---

### Импорт/Экспорт курсов

#### [NEW] [routes/export.ts](file:///e:/Develop/anki-tiny/backend/src/routes/export.ts)

- `GET /api/courses/:courseId/export` - экспорт курса в JSON
- `POST /api/courses/import` - импорт курса из JSON

#### [NEW] [features/import-export/](file:///e:/Develop/anki-tiny/frontend/src/features/import-export/)

- Кнопки Export/Import в UI
- File picker для импорта
- Формат: совместимость с Anki (опционально)

---

### Медиа в карточках

#### [NEW] Database Schema для media_files

```typescript
interface MediaFilesTable {
  id: string;
  cardId: string;
  type: 'image' | 'audio';
  fileName: string;
  filePath: string;
  createdAt: Date;
}
```

#### [NEW] [routes/media.ts](file:///e:/Develop/anki-tiny/backend/src/routes/media.ts)

- `POST /api/cards/:cardId/media` - upload медиа файла
- `GET /api/media/:id` - получение медиа файла
- `DELETE /api/media/:id` - удаление медиа

#### [MODIFY] [CardEditor.vue](file:///e:/Develop/anki-tiny/frontend/src/widgets/card-editor/CardEditor.vue)

- Добавить поддержку загрузки изображений/аудио
- Превью медиа в редакторе

---

### Поиск по карточкам

#### [NEW] [routes/search.ts](file:///e:/Develop/anki-tiny/backend/src/routes/search.ts)

- `GET /api/search?q=query` - full-text search по карточкам

#### [NEW] [widgets/search-bar/SearchBar.vue](file:///e:/Develop/anki-tiny/frontend/src/widgets/search-bar/SearchBar.vue)

- Строка поиска с автодополнением
- Фильтрация результатов

---

### Теги и категории

#### [NEW] Database Schema для tags

```typescript
interface TagsTable {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
}

interface CardTagsTable {
  cardId: string;
  tagId: string;
}
```

#### [NEW] [routes/tags.ts](file:///e:/Develop/anki-tiny/backend/src/routes/tags.ts)

- `GET /api/tags` - список тегов
- `POST /api/tags` - создание тега
- `POST /api/cards/:cardId/tags` - добавление тега к карточке

#### [NEW] [features/tags/](file:///e:/Develop/anki-tiny/frontend/src/features/tags/)

- Tag management UI
- Фильтрация карточек по тегам

---

## Риски и ограничения

> [!CAUTION]
> **Acrylic Material для Title Bar** - `backgroundMaterial: 'acrylic'` поддерживается только на
> Windows 11. На других ОС нужно fallback решение.
>
> [!WARNING]
> **Безопасность IPC** - все IPC handlers должны валидировать входящие данные, чтобы избежать XSS
> и других атак.
>
> [!WARNING]
> **Система уведомлений** - необходимо корректно обрабатывать временные зоны и настройки пользователя.
> Не предлагать новые карточки, если до конца дня осталось меньше 4 часов.

> [!NOTE]
> **База данных** - используется SQLite через `better-sqlite3` и Kysely для типобезопасности.
