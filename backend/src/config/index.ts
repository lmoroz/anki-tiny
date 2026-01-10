// Определяем базовую директорию для данных
// В Electron (prod) это будет C:\Users\User\AppData\Roaming\Repetitio
// В Dev это будет корень проекта
const DATA_ROOT = process.env.APP_USER_DATA || process.cwd();

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ quiet: true });

console.log('[CONFIG] DATA_ROOT: ', DATA_ROOT);

export const config = {
  PORT: parseInt(process.env.PORT || '0', 10),
  DEBUG_PERF: process.env.DEBUG_PERF === 'true',
  DB_FILENAME: 'repetitio.db',
  DATABASE_PATH: process.env.APP_USER_DATA
    ? path.join(process.env.APP_USER_DATA, 'repetitio.db')
    : path.join(__dirname, '../../repetitio.db'),
  DATA_ROOT, // Экспортируем корень, пригодится для логгера
};
