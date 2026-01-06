# Migration System - Implementation and Testing ✅

## Problem

The database `repetitio.db` already existed with the `courses` table created earlier (05.01.2026 18:00). The old code applied migrations **only for a new DB**:

```typescript
if (isNewDatabase) {
  await up(dbInstance);  // Migrations applied only here!
}
```

**Result:** New tables (`cards`, `settings`, `courseSettings`) were not created when the app started.

---

## Solution: Migration Tracking System

### Architecture

Created a professional migration tracking system:

1. **Table `_migrations`** — stores list of applied migrations.
2. **Migrations split into steps** (001, 002, 003, 004).
3. **Automatic application** of missing migrations on startup.
4. **Idempotency** — safe to run multiple times.

### Structure of `_migrations` table

```sql
CREATE TABLE _migrations (
    id TEXT PRIMARY KEY,          -- '001', '002', '003', '004'
    name TEXT NOT NULL,           -- 'create_courses_table'
    appliedAt TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### Migrations List

| ID  | Name                          | Description                       |
|-----|-------------------------------|-----------------------------------|
| 001 | create_courses_table          | Table courses + index             |
| 002 | create_cards_table            | Table cards + 3 FSRS indices      |
| 003 | create_settings_table         | Global settings                   |
| 004 | create_course_settings_table  | Individual course settings        |

---

## Implementation

### File: [migrations.ts](file:///e:/Develop/anki-tiny/backend/src/services/database/migrations.ts)

**Key functions:**

#### `createMigrationsTable()`

Creates `_migrations` table if it doesn't exist (with `.ifNotExists()`).

#### `getAppliedMigrations()`

Returns list of applied migration IDs from `_migrations` table.

#### `markMigrationAsApplied()`

Inserts record into `_migrations` after successful application.

#### `runMigrations()` ⭐

**Main function:**

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

### File: [database/index.ts](file:///e:/Develop/anki-tiny/backend/src/services/database/index.ts)

**Changes:**

```typescript
// Was:
if (isNewDatabase) {
  await up(dbInstance);
} else {
  console.log('Using existing database');
}

// Became:
console.log('📦 Database at:', config.DATABASE_PATH);
await runMigrations(dbInstance);  // Always check and apply
```

---

## Fixes

### Issue 1: `table courses already exists`

**Error:** Migrations tried to create an already existing table.

**Solution:** Added `.ifNotExists()` to all `createTable()`:

```typescript
await db.schema
  .createTable('courses')
  .ifNotExists()  // ← Added
  .addColumn(...)
  .execute();
```

### Issue 2: `index courses_name_idx already exists`

**Error:** Indices also tried to be recreated.

**Solution:** Added `.ifNotExists()` to all `createIndex()`:

```typescript
await db.schema
  .createIndex('courses_name_idx')
  .ifNotExists()  // ← Added
  .on('courses')
  .column('name')
  .execute();
```

---

## Testing Results

### ✅ Run on existing DB

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

### ✅ Second run (migrations already applied)

```
📦 Database at: E:\Develop\anki-tiny\backend\repetitio.db
🔄 Checking for pending migrations...
✅ All migrations are up to date
✅ Database initialized
🚀 Server running on port 1095
```

**Idempotency confirmed!** ✨

---

## DB Structure after Migrations

### Tables

1. **`_migrations`** — migration tracking (4 records)
2. **`courses`** — courses (already existed)
3. **`cards`** — cards with FSRS fields (created)
4. **`settings`** — global settings (created)
5. **`courseSettings`** — individual settings (created)

### Indices

- `courses_name_idx` (courses.name)
- `cards_courseId_idx` (cards.courseId)
- `cards_due_idx` (cards.due) — for FSRS
- `cards_state_idx` (cards.state) — for FSRS
- `courseSettings_courseId_idx` (courseSettings.courseId)

---

## Implementation Benefits

✅ **Tracking:** Each migration applied only once  
✅ **Idempotency:** Safe to run multiple times  
✅ **Logging:** Clear process messages  
✅ **Rollback support:** `rollbackAllMigrations()` function for testing  
✅ **Extensibility:** Easy to add new migrations  
✅ **Production-ready:** Professional approach

---

## Adding New Migrations

Example of adding new migration `005`:

```typescript
const migrations: Migration[] = [
  // ... existing migrations ...
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

**Automatically applied** on next app launch!

---

## Architectural Decisions

### Why `_migrations` table and not `migrations_history`?

- Prefix `_` denotes system table
- Short name
- Industry standard (similar to Laravel, TypeORM)

### Why string IDs ('001') and not numbers?

- More readable sort order
- Easy to add migrations between existing ones (001a, 001b)
- Migration name includes ID + name: `001_create_courses_table`

### Why migrations in one file?

- More convenient for small projects
- All migrations visible in one place
- Can be split into files if needed

---

## Next Steps

✅ **Backend fully ready:**

- Database schema with FSRS
- Migration system working
- 13 API endpoints
- TypeScript compilation successful

**⏭️ Next Stage:** Frontend integration

- Entity layer (API, Store, Types)
- Widgets (CardList, CardEditor)
- Pages (CoursePage, TrainingPage)

---

**Status:** ✅ Migration system successfully implemented and tested!
