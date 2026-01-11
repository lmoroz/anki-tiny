/**
 * Утилита для подготовки базы данных в Electron-приложении.
 * Копирует БД из .asar в userData при первом запуске.
 */

import { existsSync, copyFileSync } from 'fs';
import path from 'path';
import { app } from 'electron';
import { config } from '../config/index.js';

/**
 * Подготавливает базу данных для работы приложения.
 * В production режиме копирует БД из asar в userData, если её там ещё нет.
 *
 * @returns Путь к рабочей копии базы данных
 */
export function prepareDatabase(): string {
  const isDev = !app.isPackaged;

  if (isDev) {
    // В dev-режиме БД находится в backend/repetitio.db
    const devDbPath = path.join(__dirname, '../../../backend', config.DB_FILENAME);
    console.log('[DB-SETUP] Development mode, using:', devDbPath);
    return devDbPath;
  }

  // В production БД упакована в asar, нужно скопировать в userData
  const userData = app.getPath('userData');
  const targetDbPath = path.join(userData, config.DB_FILENAME);

  if (existsSync(targetDbPath)) {
    console.log('[DB-SETUP] Database already exists in userData:', targetDbPath);
    return targetDbPath;
  }

  // Исходная БД находится в asar рядом с скомпилированным backend
  const sourceDbPath = path.join(__dirname, '../../', config.DB_FILENAME);

  console.log('[DB-SETUP] Copying database from asar to userData...');
  console.log('[DB-SETUP] Source:', sourceDbPath);
  console.log('[DB-SETUP] Target:', targetDbPath);

  try {
    // Node.js fs.copyFileSync прозрачно читает из .asar
    copyFileSync(sourceDbPath, targetDbPath);
    console.log('[DB-SETUP] ✅ Database copied successfully');
  } catch (err) {
    console.error('[DB-SETUP] ❌ Failed to copy database:', err);
    throw new Error(`Failed to prepare database: ${err}`);
  }

  return targetDbPath;
}
