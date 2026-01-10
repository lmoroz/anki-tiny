import { Kysely, sql } from 'kysely';
import type { Database } from './schema.js';

/**
 * Интерфейс для миграции
 */
interface Migration {
  id: string;
  name: string;
  up: (db: Kysely<Database>) => Promise<void>;
}

/**
 * Список всех миграций в порядке применения
 */
const migrations: Migration[] = [
  {
    id: '001',
    name: 'create_courses_table',
    up: async (db: Kysely<Database>) => {
      await db.schema
        .createTable('courses')
        .ifNotExists()
        .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
        .addColumn('name', 'text', (col) => col.notNull())
        .addColumn('description', 'text')
        .addColumn('createdAt', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
        .addColumn('updatedAt', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
        .execute();

      await db.schema.createIndex('courses_name_idx').ifNotExists().on('courses').column('name').execute();
    },
  },
  {
    id: '002',
    name: 'create_cards_table',
    up: async (db: Kysely<Database>) => {
      await db.schema
        .createTable('cards')
        .ifNotExists()
        .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
        .addColumn('courseId', 'integer', (col) => col.notNull().references('courses.id').onDelete('cascade'))
        .addColumn('front', 'text', (col) => col.notNull())
        .addColumn('back', 'text', (col) => col.notNull())
        // FSRS поля
        .addColumn('due', 'text', (col) => col.notNull())
        .addColumn('stability', 'real', (col) => col.notNull().defaultTo(0.0))
        .addColumn('difficulty', 'real', (col) => col.notNull().defaultTo(5.0))
        .addColumn('elapsedDays', 'integer', (col) => col.notNull().defaultTo(0))
        .addColumn('scheduledDays', 'integer', (col) => col.notNull().defaultTo(0))
        .addColumn('reps', 'integer', (col) => col.notNull().defaultTo(0))
        .addColumn('lapses', 'integer', (col) => col.notNull().defaultTo(0))
        .addColumn('state', 'integer', (col) => col.notNull().defaultTo(0))
        .addColumn('lastReview', 'text')
        .addColumn('stepIndex', 'integer', (col) => col.notNull().defaultTo(0))
        // Timestamps
        .addColumn('createdAt', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
        .addColumn('updatedAt', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
        .execute();

      // Индексы для cards
      await db.schema.createIndex('cards_courseId_idx').ifNotExists().on('cards').column('courseId').execute();
      await db.schema.createIndex('cards_due_idx').ifNotExists().on('cards').column('due').execute();
      await db.schema.createIndex('cards_state_idx').ifNotExists().on('cards').column('state').execute();
    },
  },
  {
    id: '003',
    name: 'create_settings_table',
    up: async (db: Kysely<Database>) => {
      await db.schema
        .createTable('settings')
        .ifNotExists()
        .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
        .addColumn('trainingStartHour', 'integer', (col) => col.notNull().defaultTo(8))
        .addColumn('trainingEndHour', 'integer', (col) => col.notNull().defaultTo(22))
        .addColumn('minTimeBeforeEnd', 'integer', (col) => col.notNull().defaultTo(4))
        .addColumn('notificationsEnabled', 'integer', (col) => col.notNull().defaultTo(1))
        .addColumn('learningSteps', 'text', (col) => col.notNull().defaultTo('[10, 240]'))
        .addColumn('enableFuzz', 'integer', (col) => col.notNull().defaultTo(1))
        .addColumn('createdAt', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
        .addColumn('updatedAt', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
        .execute();
    },
  },
  {
    id: '004',
    name: 'create_course_settings_table',
    up: async (db: Kysely<Database>) => {
      await db.schema
        .createTable('courseSettings')
        .ifNotExists()
        .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
        .addColumn('courseId', 'integer', (col) => col.notNull().unique().references('courses.id').onDelete('cascade'))
        .addColumn('trainingStartHour', 'integer')
        .addColumn('trainingEndHour', 'integer')
        .addColumn('minTimeBeforeEnd', 'integer')
        .addColumn('notificationsEnabled', 'integer')
        .addColumn('learningSteps', 'text')
        .addColumn('enableFuzz', 'integer')
        .addColumn('createdAt', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
        .addColumn('updatedAt', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
        .execute();

      await db.schema
        .createIndex('courseSettings_courseId_idx')
        .ifNotExists()
        .on('courseSettings')
        .column('courseId')
        .execute();
    },
  },
  {
    id: '005',
    name: 'convert_time_to_minutes',
    up: async (db: Kysely<Database>) => {
      // Add new columns for minute-based time
      await db.schema.alterTable('settings').addColumn('trainingStartTime', 'integer').execute();

      await db.schema.alterTable('settings').addColumn('trainingEndTime', 'integer').execute();

      await db.schema.alterTable('courseSettings').addColumn('trainingStartTime', 'integer').execute();

      await db.schema.alterTable('courseSettings').addColumn('trainingEndTime', 'integer').execute();

      // Migrate existing data: convert hours to minutes (hour * 60)
      await sql`UPDATE settings
                SET trainingStartTime = trainingStartHour * 60,
                    trainingEndTime   = trainingEndHour * 60`.execute(db);

      await sql`UPDATE courseSettings
                SET trainingStartTime = trainingStartHour * 60
                WHERE trainingStartHour IS NOT NULL`.execute(db);

      await sql`UPDATE courseSettings
                SET trainingEndTime = trainingEndHour * 60
                WHERE trainingEndHour IS NOT NULL`.execute(db);

      // Set defaults for new columns in settings table
      await sql`UPDATE settings
                SET trainingStartTime = 480
                WHERE trainingStartTime IS NULL`.execute(db);
      await sql`UPDATE settings
                SET trainingEndTime = 1320
                WHERE trainingEndTime IS NULL`.execute(db);

      // Drop old hour-based columns from settings
      // SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
      // For simplicity, we'll keep the old columns for backward compatibility
      // They can be removed in a future migration if needed
    },
  },
  {
    id: '006',
    name: 'add_training_limits',
    up: async (db: Kysely<Database>) => {
      // 1. Add global limit fields to settings table
      await db.schema
        .alterTable('settings')
        .addColumn('globalNewCardsPerDay', 'integer', (col) => col.notNull().defaultTo(20))
        .execute();

      await db.schema
        .alterTable('settings')
        .addColumn('globalMaxReviewsPerDay', 'integer', (col) => col.notNull().defaultTo(200))
        .execute();

      // 2. Add course-specific limit fields to courseSettings table
      await db.schema.alterTable('courseSettings').addColumn('newCardsPerDay', 'integer').execute();

      await db.schema.alterTable('courseSettings').addColumn('maxReviewsPerDay', 'integer').execute();

      await db.schema.alterTable('courseSettings').addColumn('newCardsPerSession', 'integer').execute();

      await db.schema.alterTable('courseSettings').addColumn('maxReviewsPerSession', 'integer').execute();

      // 3. Create dailyProgress table
      await db.schema
        .createTable('dailyProgress')
        .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
        .addColumn('date', 'text', (col) => col.notNull())
        .addColumn('courseId', 'integer', (col) => col.notNull().references('courses.id').onDelete('cascade'))
        .addColumn('newCardsStudied', 'integer', (col) => col.notNull().defaultTo(0))
        .addColumn('reviewsCompleted', 'integer', (col) => col.notNull().defaultTo(0))
        .addColumn('createdAt', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
        .addColumn('updatedAt', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
        .execute();

      // 4. Create indexes for dailyProgress
      await db.schema.createIndex('idx_dailyProgress_date').on('dailyProgress').column('date').execute();

      await db.schema.createIndex('idx_dailyProgress_courseId').on('dailyProgress').column('courseId').execute();

      // 5. Create unique composite index for (date, courseId)
      await db.schema
        .createIndex('idx_dailyProgress_date_course')
        .on('dailyProgress')
        .columns(['date', 'courseId'])
        .unique()
        .execute();
    },
  },
  {
    id: '007',
    name: 'add_default_course_limits',
    up: async (db: Kysely<Database>) => {
      await db.schema
        .alterTable('settings')
        .addColumn('defaultNewCardsPerDay', 'integer', (col) => col.notNull().defaultTo(20))
        .execute();
      await db.schema
        .alterTable('settings')
        .addColumn('defaultMaxReviewsPerDay', 'integer', (col) => col.notNull().defaultTo(200))
        .execute();
      await db.schema
        .alterTable('settings')
        .addColumn('defaultNewCardsPerSession', 'integer', (col) => col.notNull().defaultTo(10))
        .execute();
      await db.schema
        .alterTable('settings')
        .addColumn('defaultMaxReviewsPerSession', 'integer', (col) => col.notNull().defaultTo(50))
        .execute();
    },
  },
  {
    id: '008',
    name: 'add_request_retention',
    up: async (db: Kysely<Database>) => {
      // Add requestRetention to settings table
      await db.schema
        .alterTable('settings')
        .addColumn('requestRetention', 'real', (col) => col.notNull().defaultTo(0.9))
        .execute();

      // Add requestRetention to courseSettings table (nullable for inheritance)
      await db.schema.alterTable('courseSettings').addColumn('requestRetention', 'real').execute();

      // Ensure all existing settings have the default value
      await sql`UPDATE settings
                SET requestRetention = 0.9
                WHERE requestRetention IS NULL`.execute(db);
    },
  },
];

/**
 * Создать таблицу для отслеживания миграций
 */
async function createMigrationsTable(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('_migrations')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('appliedAt', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .ifNotExists()
    .execute();
}

/**
 * Получить список примененных миграций
 */
async function getAppliedMigrations(db: Kysely<Database>): Promise<string[]> {
  try {
    const results = await db
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .selectFrom('_migrations' as any)
      .select('id')
      .execute();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return results.map((r: any) => r.id);
  } catch {
    // Таблица не существует
    return [];
  }
}

/**
 * Отметить миграцию как примененную
 */
async function markMigrationAsApplied(db: Kysely<Database>, migration: Migration): Promise<void> {
  await db
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insertInto('_migrations' as any)
    .values({
      id: migration.id,
      name: migration.name,
    })
    .execute();
}

/**
 * Применить все недостающие миграции
 */
export async function runMigrations(db: Kysely<Database>): Promise<void> {
  console.log('🔄 Checking for pending migrations...');

  // Создать таблицу миграций если её нет
  await createMigrationsTable(db);

  // Получить список примененных миграций
  const appliedMigrations = await getAppliedMigrations(db);

  // Найти неприменённые миграции
  const pendingMigrations = migrations.filter((m) => !appliedMigrations.includes(m.id));

  if (pendingMigrations.length === 0) {
    console.log('✅  All migrations are up to date');
    return;
  }

  console.log(`📦 Applying ${pendingMigrations.length} pending migration(s)...`);

  // Применить каждую миграцию
  for (const migration of pendingMigrations) {
    console.log(`   → ${migration.id}_${migration.name}`);
    await migration.up(db);
    await markMigrationAsApplied(db, migration);
    console.log(`   ✓ ${migration.id}_${migration.name} applied`);
  }

  console.log('✅ All migrations applied successfully');
}

/**
 * Откатить все миграции (для тестирования)
 */
export async function rollbackAllMigrations(db: Kysely<Database>): Promise<void> {
  // Удалить все таблицы в обратном порядке
  await db.schema.dropTable('courseSettings').ifExists().execute();
  await db.schema.dropTable('settings').ifExists().execute();
  await db.schema.dropTable('cards').ifExists().execute();
  await db.schema.dropTable('courses').ifExists().execute();
  await db.schema.dropTable('_migrations').ifExists().execute();

  console.log('✅ All migrations rolled back successfully');
}
