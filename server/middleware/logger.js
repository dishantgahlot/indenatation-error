// Production Request Logger with Pino
import logger from '../utils/logger.js';

export function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;

    // Skip static assets or noisy health polling in production logs
    if (!originalUrl.startsWith('/assets/') && !originalUrl.startsWith('/favicon.ico')) {
      const logData = {
        method,
        url: originalUrl,
        status,
        duration_ms: duration,
        ip,
        userAgent: req.get('user-agent')
      };

      if (status >= 500) {
        logger.error(logData, `${method} ${originalUrl} ${status}`);
      } else if (status >= 400) {
        logger.warn(logData, `${method} ${originalUrl} ${status}`);
      } else {
        logger.info(logData, `${method} ${originalUrl} ${status}`);
      }
    }
  });

  next();
}