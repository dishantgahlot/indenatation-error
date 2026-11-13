import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import logger from '../utils/logger.js';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Create a rate limiter with consistent configuration
 */
export function createRateLimiter(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = isProduction ? 100 : 1000, // requests per window
    message = { error: 'Too many requests, please try again later' },
    statusCode = 429,
    standardHeaders = true,
    legacyHeaders = false,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = (req) => ipKeyGenerator(req.ip),
    handler = (req, res, next, options) => {
      logger.warn({
        ip: req.ip,
        path: req.path,
        method: req.method
      }, 'Rate limit exceeded');
      res.status(options.statusCode).json(options.message);
    }
  } = options;

  return rateLimit({
    windowMs,
    max,
    message,
    statusCode,
    standardHeaders,
    legacyHeaders,
    skipSuccessfulRequests,
    skipFailedRequests,
    keyGenerator,
    handler
  });
}

/**
 * Pre-configured limiters for different endpoint types
 */
export const limiters = {
  // Strict limiter for auth endpoints (login, register)
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProduction ? 10 : 50, // 10 requests per 15 min in production
    message: { error: 'Too many authentication attempts, please try again later' },
    keyGenerator: (req) => `auth:${ipKeyGenerator(req.ip)}`
  }),

  // Moderate limiter for simulation endpoints (LLM calls are expensive)
  simulation: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: isProduction ? 20 : 100, // 20 requests per hour in production
    message: { error: 'Simulation rate limit exceeded, please wait before requesting another letter' },
    keyGenerator: (req) => `simulation:${ipKeyGenerator(req.ip)}`
  }),

  // Standard limiter for API endpoints
  api: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProduction ? 100 : 500,
    message: { error: 'API rate limit exceeded' }
  }),

  // Strict limiter for password reset / sensitive operations
  sensitive: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: isProduction ? 3 : 10,
    message: { error: 'Too many requests for this operation, please try again later' },
    keyGenerator: (req) => `sensitive:${ipKeyGenerator(req.ip)}`
  }),

  // Very strict limiter for batch operations
  batch: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: isProduction ? 5 : 20,
    message: { error: 'Batch operation rate limit exceeded' },
    keyGenerator: (req) => `batch:${ipKeyGenerator(req.ip)}`
  })
};

/**
 * Global rate limiter for all requests (fallback)
 */
export const globalLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: isProduction ? 60 : 300, // 60 req/min in production
  message: { error: 'Global rate limit exceeded' },
  keyGenerator: (req) => `global:${ipKeyGenerator(req.ip)}`
});

export default { createRateLimiter, limiters, globalLimiter };