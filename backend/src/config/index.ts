import path from 'path';

export const config = {
  PORT: parseInt(process.env.PORT || '0', 10),
  DEBUG_PERF: process.env.DEBUG_PERF === 'true',
  DATABASE_PATH: process.env.APP_USER_DATA ? path.join(process.env.APP_USER_DATA, 'repetitio.db') : path.join(__dirname, '../../repetitio.db'),
};
