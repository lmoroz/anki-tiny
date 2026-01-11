import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ quiet: true });

/**
 * Получает корневую директорию для данных приложения.
 * В Electron (prod): C:\Users\User\AppData\Roaming\Repetitio
 * В Dev: корень проекта
 */
function getDataRoot(): string {
  return process.env.APP_USER_DATA || process.cwd();
}

/**
 * Получает путь к файлу базы данных.
 * ВАЖНО: Эта функция вызывается динамически, чтобы учитывать
 * изменения process.env.APP_USER_DATA после импорта модуля.
 */
export function getDatabasePath(): string {
  if (process.env.APP_USER_DATA) return path.join(process.env.APP_USER_DATA, 'repetitio.db');

  // В режиме разработки БД находится в корне backend
  return path.join(__dirname, '../../repetitio.db');
}

export const config = {
  PORT: parseInt(process.env.PORT || '0', 10),
  DEBUG_PERF: process.env.DEBUG_PERF === 'true',
  DB_FILENAME: 'repetitio.db',
  get DATA_ROOT() {
    return getDataRoot();
  },
  get DATABASE_PATH() {
    return getDatabasePath();
  },
};
