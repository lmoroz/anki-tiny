import { Kysely, sql } from 'kysely';
import { Database } from './schema';

export async function up(db: Kysely<Database>): Promise<void> {
  // Таблица courses
  await db.schema
    .createTable('courses')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('createdAt', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updatedAt', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  // Индекс для быстрого поиска по имени
  await db.schema.createIndex('courses_name_idx').on('courses').column('name').execute();

  console.log('✅ Migrations applied successfully');
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('courses').execute();
  console.log('✅ Migrations rolled back successfully');
}
