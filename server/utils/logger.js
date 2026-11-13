import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  transport: isProduction ? undefined : {
    target: 'pino-pretty',
    options: { colorize: true, translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' }
  },
  base: {
    service: 'digital-twin-api',
    env: process.env.NODE_ENV || 'development'
  }
});

export const createLogger = (context) => logger.child({ context });

export default logger;