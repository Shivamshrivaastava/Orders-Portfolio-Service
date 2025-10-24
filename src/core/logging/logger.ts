import pino, { Logger } from 'pino';
export const logger: Logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: undefined, });
