/**
 * Structured Logger
 *
 * Replaces raw console.log/console.error calls with leveled, structured
 * (JSON in production) logs. On Vercel these still end up in the same
 * Runtime Logs stream as console.*, but structured/leveled output is what
 * lets a log drain or log search actually filter ("show me only errors from
 * the last hour") instead of grepping loose text.
 *
 * In development, pino-pretty renders them as readable colored lines instead
 * of raw JSON.
 */

import pino from 'pino';

const isDev = (process.env.NODE_ENV || 'development') === 'development';

const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

export default logger;
