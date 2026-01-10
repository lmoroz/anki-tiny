import SQLite from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';
import type { Database } from './schema.js';
import { runMigrations } from './migrations.js';
import { config } from '../../config';

let dbInstance: Kysely<Database> | null = null;

export async function initializeDatabase(): Promise<Kysely<Database>> {
  if (dbInstance) {
    return dbInstance;
  }
  console.log('[DB] Initializing database...');
  console.log('[DB] DATA_ROOT:', config.DATA_ROOT);
  console.log('[DB] APP_USER_DATA:', process.env.APP_USER_DATA);
  console.log('[DB] DATABASE_PATH:', config.DATABASE_PATH);

  // if (!process.env.APP_USER_DATA) process.env.APP_USER_DATA = app.getPath('userData');

  const sourcePath = config.DATABASE_PATH;

  // const destPath = path.join(process.env.APP_USER_DATA, DB_FILENAME);
  // const dbDir = path.dirname(sourcePath);
  // console.log('[DB] Database directory:', dbDir);
  //
  // if (!fs.existsSync(destPath)) {
  //   try {
  //     // Node.js fs.copyFileSync прозрачно читает из .asar
  //     fs.copyFileSync(sourcePath, destPath);
  //     console.log('[DB] ✅ Database initialized successfully in:', destPath);
  //   } catch (err) {
  //     console.error('[DB] ❌ Failed to copy database file:', err);
  //     throw err;
  //   }
  // } else {
  //   console.log('[DB] Database already exists, skipping copy.');
  // }

  console.log('[DB] Creating SQLite instance...');
  let sqliteDb: SQLite.Database;
  try {
    sqliteDb = new SQLite(sourcePath);
    console.log('[DB] ✅ SQLite instance created');
  } catch (err) {
    console.error('[DB] ❌ Failed to create SQLite instance:', err);
    throw err;
  }

  const dialect = new SqliteDialect({
    database: sqliteDb,
  });

  dbInstance = new Kysely<Database>({
    dialect,
  });

  // Применить миграции (как для новой, так и для существующей БД)
  console.log('[DB] 📦 Database at:', sourcePath);
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
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (instance[prop as keyof Kysely<Database>] as any).bind(instance)
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
