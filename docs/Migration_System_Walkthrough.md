# Migration System - Реализация и Тестирование ✅

## Проблема

БД `repetitio.db` уже существовала с таблицей `courses`, созданной ранее (05.01.2026 18:00). Старый код применял миграции **только для новой БД**:

```typescript
if (isNewDatabase) {
  await up(dbInstance);  // Миграции применяются только здесь!
}
```

**Результат:** Новые таблицы (`cards`, `settings`, `courseSettings`) не создавались при запуске приложения.

---

## Решение: Migration Tracking System

### Архитектура

Создана профессиональная система отслеживания миграций:

1. **Таблица `_migrations`** — хранит список примененных миграций
2. **Миграции разбиты на отдельные шаги** (001, 002, 003, 004)
3. **Автоматическое применение** недостающих миграций при старте
4. **Идемпотентность** — безопасно запускать многократно

### Структура таблицы _migrations

```sql
CREATE TABLE _migrations (
    id TEXT PRIMARY KEY,          -- '001', '002', '003', '004'
    name TEXT NOT NULL,           -- 'create_courses_table'
    appliedAt TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### Список миграций

| ID  | Name                          | Описание                          |
|-----|-------------------------------|-----------------------------------|
| 001 | create_courses_table          | Таблица courses + индекс         |
| 002 | create_cards_table            | Таблица cards + 3 индекса FSRS   |
| 003 | create_settings_table         | Глобальные настройки             |
| 004 | create_course_settings_table  | Индивидуальные настройки курсов  |

---

## Реализация

### Файл: [migrations.ts](file:///e:/Develop/anki-tiny/backend/src/services/database/migrations.ts)

**Ключевые функции:**

#### `createMigrationsTable()`
Создает таблицу `_migrations` если её нет (с `.ifNotExists()`).

#### `getAppliedMigrations()`
Возвращает список ID примененных миграций из таблицы `_migrations`.

#### `markMigrationAsApplied()`
Вставляет запись в `_migrations` после успешного применения.

#### `runMigrations()` ⭐
**Основная функция:**

```typescript
export async function runMigrations(db: Kysely<Database>): Promise<void> {
  console.log('🔄 Checking for pending migrations...');
  
  await createMigrationsTable(db);
  
  const appliedMigrations = await getAppliedMigrations(db);
  const pendingMigrations = migrations.filter((m) => !appliedMigrations.includes(m.id));
  
  if (pendingMigrations.length === 0) {
    console.log('✅ All migrations are up to date');
    return;
  }
  
  console.log(`📦 Applying ${pendingMigrations.length} pending migration(s)...`);
  
  for (const migration of pendingMigrations) {
    console.log(`   → ${migration.id}_${migration.name}`);
    await migration.up(db);
    await markMigrationAsApplied(db, migration);
    console.log(`   ✓ ${migration.id}_${migration.name} applied`);
  }
  
  console.log('✅ All migrations applied successfully');
}
```

### Файл: [database/index.ts](file:///e:/Develop/anki-tiny/backend/src/services/database/index.ts)

**Изменения:**

```typescript
// Было:
if (isNewDatabase) {
  await up(dbInstance);
} else {
  console.log('Using existing database');
}

// Стало:
console.log('📦 Database at:', config.DATABASE_PATH);
await runMigrations(dbInstance);  // Всегда проверяем и применяем
```

---

## Исправления

### Проблема 1: `table courses already exists`

**Ошибка:** Миграции пытались создать уже существующую таблицу.

**Решение:** Добавлен `.ifNotExists()` ко всем `createTable()`:

```typescript
await db.schema
  .createTable('courses')
  .ifNotExists()  // ← Добавлено
  .addColumn(...)
  .execute();
```

### Проблема 2: `index courses_name_idx already exists`

**Ошибка:** Индексы тоже пытались создаться повторно.

**Решение:** Добавлен `.ifNotExists()` ко всем `createIndex()`:

```typescript
await db.schema
  .createIndex('courses_name_idx')
  .ifNotExists()  // ← Добавлено
  .on('courses')
  .column('name')
  .execute();
```

---

## Результаты тестирования

### ✅ Запуск на существующей БД

```
📦 Database at: E:\Develop\anki-tiny\backend\repetitio.db
🔄 Checking for pending migrations...
📦 Applying 4 pending migration(s)...
   → 001_create_courses_table
   ✓ 001_create_courses_table applied
   → 002_create_cards_table
   ✓ 002_create_cards_table applied
   → 003_create_settings_table
   ✓ 003_create_settings_table applied
   → 004_create_course_settings_table
   ✓ 004_create_course_settings_table applied
✅ All migrations applied successfully
✅ Database initialized
🚀 Server running on port 1095
```

### ✅ Повторный запуск (миграции уже применены)

```
📦 Database at: E:\Develop\anki-tiny\backend\repetitio.db
🔄 Checking for pending migrations...
✅ All migrations are up to date
✅ Database initialized
🚀 Server running on port 1095
```

**Идемпотентность подтверждена!** ✨

---

## Структура БД после миграций

### Таблицы

1. **`_migrations`** — отслеживание миграций (4 записи)
2. **`courses`** — курсы (уже существовала)
3. **`cards`** — карточки с FSRS полями (создана)
4. **`settings`** — глобальные настройки (создана)
5. **`courseSettings`** — индивидуальные настройки (создана)

### Индексы

- `courses_name_idx` (courses.name)
- `cards_courseId_idx` (cards.courseId)
- `cards_due_idx` (cards.due) — для FSRS
- `cards_state_idx` (cards.state) — для FSRS
- `courseSettings_courseId_idx` (courseSettings.courseId)

---

## Преимущества реализации

✅ **Отслеживание:** Каждая миграция применяется только один раз  
✅ **Идемпотентность:** Безопасно запускать многократно  
✅ **Логирование:** Понятные сообщения о процессе  
✅ **Rollback support:** Функция `rollbackAllMigrations()` для тестирования  
✅ **Расширяемость:** Легко добавлять новые миграции  
✅ **Production-ready:** Профессиональный подход

---

## Добавление новых миграций

Пример добавления новой миграции `005`:

```typescript
const migrations: Migration[] = [
  // ... существующие миграции ...
  {
    id: '005',
    name: 'add_tags_table',
    up: async (db: Kysely<Database>) => {
      await db.schema
        .createTable('tags')
        .ifNotExists()
        .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
        .addColumn('name', 'text', (col) => col.notNull().unique())
        .execute();
    },
  },
];
```

**Автоматически применится** при следующем запуске приложения!

---

## Архитектурные решения

### Почему таблица _migrations, а не migrations_history?

- Префикс `_` обозначает системную таблицу
- Короткое имя
- Стандарт в индустрии (аналогично Laravel, TypeORM)

### Почему строковые ID ('001'), а не числовые?

- Более читаемый порядок сортировки  
- Легко добавлять миграции между существующими (001a, 001b)
- Имя миграции включает ID + название: `001_create_courses_table`

### Почему миграции в одном файле?

- Для небольших проектов удобнее
- Все миграции видны в одном месте
- При необходимости легко разбить на отдельные файлы

---

## Следующие шаги

✅ **Backend полностью готов:**
- Database schema с FSRS
- Система миграций работает
- 13 API endpoints
- TypeScript компиляция успешна

**⏭️ Следующий этап:** Frontend integration
- Entity layer (API, Store, Types)
- Widgets (CardList, CardEditor)
- Pages (CoursePage, TrainingPage)

---

**Status:** ✅ Migration system successfully implemented and tested!
