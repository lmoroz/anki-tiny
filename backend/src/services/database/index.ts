import SQLite from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';
import { Database } from './schema';
import { runMigrations } from './migrations';
import { config } from '../../config';
import path from 'path';
import fs from 'fs';

let dbInstance: Kysely<Database> | null = null;

export async function initializeDatabase(): Promise<Kysely<Database>> {
  if (dbInstance) {
    return dbInstance;
  }

  // Создать директорию для БД, если не существует
  const dbDir = path.dirname(config.DATABASE_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dialect = new SqliteDialect({
    database: new SQLite(config.DATABASE_PATH),
  });

  dbInstance = new Kysely<Database>({
    dialect,
  });

  // Применить миграции (как для новой, так и для существующей БД)
  console.log('📦 Database at:', config.DATABASE_PATH);
  await runMigrations(dbInstance);

  return dbInstance;
}

export function getDatabase(): Kysely<Database> {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return dbInstance;
}

// Экспорт для удобного использования в repositories
export const db = new Proxy({} as Kysely<Database>, {
  get(target, prop) {
    const instance = getDatabase();
    return typeof instance[prop as keyof Kysely<Database>] === 'function'
      ? (instance[prop as keyof Kysely<Database>] as any).bind(instance)
      : instance[prop as keyof Kysely<Database>];
  },
});

export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.destroy();
    dbInstance = null;
    console.log('🔌 Database connection closed');
  }
}
