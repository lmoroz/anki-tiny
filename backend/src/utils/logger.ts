import pino from 'pino';
import pinoHttp from 'pino-http';

export const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname',
    },
  },
});

export const requestLogger = pinoHttp({ logger });
