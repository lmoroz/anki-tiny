// Скрипт для проверки структуры БД
/* eslint-disable @typescript-eslint/no-require-imports */
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../repetitio.db');
const db = new Database(dbPath);

console.log('📊 Проверка структуры БД:', dbPath);
console.log('');

// Получить список всех таблиц
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();

console.log('Существующие таблицы:');
tables.forEach((table) => {
  console.log(`  - ${table.name}`);

  // Получить structure таблицы
  const columns = db.prepare(`PRAGMA table_info(${table.name})`).all();
  console.log(`    Колонки (${columns.length}):`);
  columns.forEach((col) => {
    console.log(
      `      ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.dflt_value ? ` DEFAULT ${col.dflt_value}` : ''}`
    );
  });
  console.log('');
});

// Проверка наличия новых таблиц
const requiredTables = ['courses', 'cards', 'settings', 'courseSettings'];
const existingTableNames = tables.map((t) => t.name);
const missingTables = requiredTables.filter((t) => !existingTableNames.includes(t));

if (missingTables.length > 0) {
  console.log('❌ Отсутствующие таблицы:');
  missingTables.forEach((t) => console.log(`  - ${t}`));
  console.log('');
  console.log('⚠️  Миграции НЕ применены!');
} else {
  console.log('✅ Все необходимые таблицы найдены!');
}

db.close();
