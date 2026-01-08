import Database from 'better-sqlite3';
import path from 'path';

const __dirname = path.resolve();

function convertToISO(sqliteDate: string): string {
  if (!sqliteDate || sqliteDate.includes('T')) return sqliteDate;
  const [datePart, timePart] = sqliteDate.split(' ');
  if (!datePart || !timePart) return sqliteDate;
  const localDate = new Date(`${datePart}T${timePart}+08:00`);
  return localDate.toISOString();
}

function migrateDatesFn() {
  const dbPath = path.join(__dirname, 'repetitio.db');
  console.log(`📂 Opening database: ${dbPath}`);
  const db = new Database(dbPath);

  try {
    console.log('🔄 Starting date migration...\n');
    db.prepare('BEGIN').run();

    const tables = [
      { name: 'courses', emoji: '📋' },
      { name: 'cards', emoji: '📇' },
      { name: 'settings', emoji: '⚙️' },
      { name: 'courseSettings', emoji: '🎓' },
      { name: 'dailyProgress', emoji: '📊' },
    ];

    const summary: { [key: string]: { updated: number; total: number } } = {};

    for (const table of tables) {
      console.log(`${table.emoji}  Migrating ${table.name} table...`);
      const rows = db.prepare(`SELECT id, createdAt, updatedAt FROM ${table.name}`).all() as Array<{
        id: number;
        createdAt: string;
        updatedAt: string;
      }>;

      let updated = 0;
      for (const row of rows) {
        const newCreatedAt = convertToISO(row.createdAt);
        const newUpdatedAt = convertToISO(row.updatedAt);

        if (newCreatedAt !== row.createdAt || newUpdatedAt !== row.updatedAt) {
          db.prepare(`UPDATE ${table.name} SET createdAt = ?, updatedAt = ? WHERE id = ?`).run(
            newCreatedAt,
            newUpdatedAt,
            row.id
          );
          updated++;
        }
      }
      console.log(`   ✓ Updated ${updated} of ${rows.length} ${table.name}`);
      summary[table.name] = { updated, total: rows.length };
    }

    db.prepare('COMMIT').run();

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📈 Summary:');
    for (const [name, stats] of Object.entries(summary)) {
      console.log(`   - ${name}: ${stats.updated}/${stats.total}`);
    }
  } catch (error) {
    db.prepare('ROLLBACK').run();
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    db.close();
  }
}

migrateDatesFn();
