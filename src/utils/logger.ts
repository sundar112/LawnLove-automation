import pino from 'pino';
import { env } from '../config/env';

const isDev = process.env['NODE_ENV'] !== 'production';

export const logger = pino({
  level: env.LOG_LEVEL,
  ...(isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            singleLine: false,
            translateTime: 'SYS:HH:MM:ss.l',
            ignore: 'pid,hostname',
          },
        },
      }
    : {}),
});

export type Logger = typeof logger;

/**
 * Create a child logger scoped to a module/page/test, e.g.
 *   const log = childLogger('LoginPage');
 */
export const childLogger = (component: string): Logger => logger.child({ component });
