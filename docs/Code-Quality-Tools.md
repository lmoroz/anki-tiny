# Code Quality Tools Configuration

Этот документ описывает настройку инструментов качества кода в проекте.

## Обзор

Проект использует следующие инструменты для поддержания качества кода:

- **ESLint** — статический анализ JavaScript/TypeScript кода
- **Prettier** — форматирование кода
- **markdownlint-cli2** — линтинг markdown файлов

## Команды

### Линтинг

```bash
# Проверка всего кода (ESLint + Markdown)
npm run lint

# Только markdown
npm run lint:md

# Автоисправление markdown
npm run lint:md:fix
```

### Форматирование

```bash
# Форматирование всего кода (JS/TS/Vue/JSON/CSS/MD)
npm run format

# Только markdown
npm run format:md
```

## Конфигурация

### ESLint

- **Frontend**: `frontend/eslint.config.mjs` — конфигурация для Vue 3 + TypeScript
- **Backend**: `backend/eslint.config.mjs` — конфигурация для Node.js + TypeScript

### Prettier

Конфигурации настроены отдельно для каждого workspace:

- **Frontend**: `frontend/.prettierrc.json`
  - `printWidth: 120`
  - `semi: true`
  - `singleQuote: true`
  - `tabWidth: 2`
  - Специальные настройки для Vue файлов
  - Overrides для markdown (proseWrap: preserve)
- **Backend**: `backend/.prettierrc`
  - `printWidth: 120`
  - `semi: true`
  - `singleQuote: true`
  - `tabWidth: 2`
  - Overrides для markdown (proseWrap: preserve)
- **Root**: `.prettierrc.json` — для корневых markdown файлов

### Markdownlint

- **Конфигурация**: `.markdownlint-cli2.jsonc`
- **Основные правила**:
  - `MD007`: indent 2 пробела (совместимо с Prettier)
  - `MD013`: отключено (длина строки)
  - `MD024`: отключено (дубликаты заголовков)
  - `MD040`: отключено (язык для code blocks)
  - Другие strict правила отключены для гибкости

## Интеграция

### Pre-commit hooks

Проект использует **husky** и **lint-staged** для автоматической проверки кода перед коммитом:

- **ESLint** — автоматически проверяет и исправляет JS/TS/Vue файлы
- **Prettier** — автоматически форматирует JSON, CSS, SCSS, MD файлы
- **Markdownlint** — автоматически проверяет и исправляет markdown файлы

Эти проверки запускаются автоматически при выполнении `git commit`. Если обнаружены ошибки, коммит будет отклонён.

**Обход pre-commit hooks** (не рекомендуется):

```bash
git commit --no-verify -m "message"
```

### CI/CD

_(Пока не настроено, планируется добавить GitHub Actions)_

## Примечания

- **Prettier и Markdownlint**: настроены для совместной работы (indent: 2)
- **Markdown formatting**: Prettier форматирует markdown с `proseWrap: preserve`,
  сохраняя ручные переносы строк
- **Ignores**: `node_modules`, `dist`, `.git` исключены из проверки
