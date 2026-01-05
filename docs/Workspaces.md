# NPM Workspaces

## Обзор

С версии 0.1.0 проект использует **npm workspaces** для управления монорепозиторием. Это позволяет:

- Централизованно управлять зависимостями
- Упрощать команды разработки и сборки
- Делиться зависимостями между frontend и backend
- Запускать команды для всех workspace одновременно

## Структура Workspaces

```text
anki-tiny/
├── package.json          # Корневой package.json с workspaces
├── frontend/             # Frontend workspace (Vue 3 + Vite)
│   └── package.json
└── backend/              # Backend workspace (Express + Electron)
    └── package.json
```

## Основные Команды

### Из корня проекта

```bash
# Установка всех зависимостей (frontend + backend)
npm install
# Примечание: после установки автоматически выполнится postinstall скрипт
# в backend workspace, который запустит electron-rebuild для better-sqlite3.
# Это может занять 1-2 минуты при первой установке.

# Запуск приложения в dev режиме
npm run dev

# Сборка production bundle
npm run bundle

# Линтинг всех workspaces
npm run lint

# Форматирование кода во всех workspaces
npm run format
```

### Команды для конкретного workspace

```bash
# Запуск команды в frontend
npm run <script> --workspace=frontend

# Запуск команды в backend
npm run <script> --workspace=backend

# Примеры:
npm start --workspace=backend
npm run dev --workspace=frontend
npm run build --workspace=frontend
```

## Преимущества

### До (без workspaces)

```bash
# Установка зависимостей
cd backend && npm install
cd ../frontend && npm install

# Запуск dev mode
cd backend && npm run dev

# Сборка
cd frontend && npm run build
cd ../backend && npm run bundle
```

### После (с workspaces)

```bash
# Установка зависимостей
npm install

# Запуск dev mode
npm run dev

# Сборка
npm run bundle
```

## Добавление зависимости

### В конкретный workspace

```bash
# Добавить зависимость в frontend
npm install <package> --workspace=frontend

# Добавить dev-зависимость в backend
npm install -D <package> --workspace=backend
```

### В корневой package.json

Для зависимостей, используемых на уровне корня (например, для сборки или CI/CD):

```bash
npm install -D <package> -w root
```

## Важные Замечания

1. **Команда `dev`** в корневом `package.json` запускает Electron приложение с hot reload для frontend
2. **Команда `bundle`** собирает frontend, компилирует backend и создаёт installer
3. **PostInstall скрипт**: После установки зависимостей автоматически выполняется `postinstall` в backend workspace,  
   который запускает `electron-rebuild -f -w better-sqlite3` для сборки нативного модуля.  
   Это необходимо для корректной работы SQLite
4. Все `node_modules` хранятся в корне проекта (благодаря hoisting)
5. Каждый workspace может иметь свои независимые версии зависимостей при конфликтах

## Миграция

### Что изменилось

1. Создан корневой `package.json` с полем `workspaces`
2. Команды `dev` и `bundle` перенесены из `backend/package.json` в корневой
3. Обновлена документация в `readme.md`

### Что осталось прежним

- Структура кода frontend и backend
- Конфигурационные файлы (vite.config, tsconfig, etc.)
- package.json в каждом workspace (за исключением удалённых команд `dev` и `bundle` в backend)

## Дополнительные Ресурсы

- [npm workspaces documentation](https://docs.npmjs.com/cli/v7/using-npm/workspaces)
- [Managing Multiple Packages with Workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces#managing-multiple-packages)
