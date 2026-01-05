import SQLite from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';
import { Database } from './schema';
import { up } from './migrations';
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

  const isNewDatabase = !fs.existsSync(config.DATABASE_PATH);

  const dialect = new SqliteDialect({
    database: new SQLite(config.DATABASE_PATH),
  });

  dbInstance = new Kysely<Database>({
    dialect,
  });

  // Применить миграции для новой БД
  if (isNewDatabase) {
    console.log('📦 Creating new database at:', config.DATABASE_PATH);
    await up(dbInstance);
  } else {
    console.log('📦 Using existing database at:', config.DATABASE_PATH);
  }

  return dbInstance;
}

export function getDatabase(): Kysely<Database> {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return dbInstance;
}

export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.destroy();
    dbInstance = null;
    console.log('🔌 Database connection closed');
  }
}
