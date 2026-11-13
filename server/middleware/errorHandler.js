// Standardized Production Error Handler
import logger from '../utils/logger.js';

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  const isProduction = process.env.NODE_ENV === 'production';

  // Structured error logging
  logger.error({
    method: req.method,
    url: req.originalUrl,
    statusCode,
    message: err.message,
    code: err.code,
    stack: isProduction ? undefined : err.stack,
    ip: req.ip,
    userAgent: req.get('user-agent')
  }, `Error: ${err.message}`);

  res.status(statusCode).json({
    success: false,
    error: {
      message: isProduction && statusCode === 500 ? 'Internal Server Error' : (err.message || 'Internal Server Error'),
      code: err.code || 'INTERNAL_SERVER_ERROR',
      ...(isProduction ? {} : { stack: err.stack })
    }
  });
}

// 404 Not Found Handler
export function notFoundHandler(req, res, next) {
  logger.warn({
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  }, 'Route not found');

  res.status(404).json({
    success: false,
    error: {
      message: `Endpoint ${req.method} ${req.originalUrl} not found`,
      code: 'ROUTE_NOT_FOUND'
    }
  });
}