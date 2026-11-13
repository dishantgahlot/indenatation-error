import Redis from 'ioredis';
import logger from './logger.js';

const isProduction = process.env.NODE_ENV === 'production';
const REDIS_URL = process.env.REDIS_URL || process.env.REDIS_TLS_URL;
const REDIS_TLS = process.env.REDIS_TLS === 'true';

// In-memory fallback
const memoryBlacklist = new Set();
const MAX_MEMORY_SIZE = 10000;

// Redis client (lazy initialized)
let redisClient = null;
let redisAvailable = false;

/**
 * Initialize Redis connection
 */
export function initRedis() {
  if (!REDIS_URL) {
    logger.warn('REDIS_URL not set - using in-memory token blacklist (not suitable for production clusters)');
    return false;
  }

  try {
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.warn('Redis connection failed after 3 retries - falling back to in-memory blacklist');
          return null; // Stop retrying
        }
        return Math.min(times * 200, 2000);
      },
      tls: REDIS_TLS ? {} : undefined,
      lazyConnect: true
    });

    redisClient.on('connect', () => {
      redisAvailable = true;
      logger.info('Redis connected for token blacklist');
    });

    redisClient.on('error', (err) => {
      redisAvailable = false;
      logger.warn({ err: err.message }, 'Redis error - using in-memory fallback');
    });

    redisClient.on('close', () => {
      redisAvailable = false;
      logger.warn('Redis connection closed - using in-memory fallback');
    });

    // Connect asynchronously
    redisClient.connect().catch((err) => {
      logger.warn({ err: err.message }, 'Redis initial connect failed - using in-memory fallback');
      redisAvailable = false;
    });

    return true;
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to initialize Redis client');
    return false;
  }
}

/**
 * Add a token to the blacklist
 * @param {string} token - JWT token to blacklist
 * @param {number} ttlSeconds - TTL in seconds (default: 7 days to match JWT expiry)
 */
export async function blacklistToken(token, ttlSeconds = 604800) {
  const key = `blacklist:${token}`;

  if (redisAvailable && redisClient) {
    try {
      await redisClient.setex(key, ttlSeconds, '1');
      return;
    } catch (err) {
      logger.warn({ err: err.message }, 'Redis blacklist failed - falling back to memory');
      redisAvailable = false;
    }
  }

  // In-memory fallback
  memoryBlacklist.add(token);
  if (memoryBlacklist.size > MAX_MEMORY_SIZE) {
    const first = memoryBlacklist.values().next().value;
    memoryBlacklist.delete(first);
  }
}

/**
 * Check if a token is blacklisted
 * @param {string} token - JWT token to check
 * @returns {Promise<boolean>}
 */
export async function isTokenBlacklisted(token) {
  const key = `blacklist:${token}`;

  if (redisAvailable && redisClient) {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (err) {
      logger.warn({ err: err.message }, 'Redis blacklist check failed - falling back to memory');
      redisAvailable = false;
    }
  }

  // In-memory fallback
  return memoryBlacklist.has(token);
}

/**
 * Remove a token from blacklist (for testing)
 */
export async function removeFromBlacklist(token) {
  const key = `blacklist:${token}`;

  if (redisAvailable && redisClient) {
    try {
      await redisClient.del(key);
    } catch (err) {
      logger.warn({ err: err.message }, 'Redis blacklist remove failed');
    }
  }

  memoryBlacklist.delete(token);
}

/**
 * Get blacklist stats
 */
export async function getBlacklistStats() {
  let redisCount = 0;
  let memoryCount = memoryBlacklist.size;

  if (redisAvailable && redisClient) {
    try {
      const keys = await redisClient.keys('blacklist:*');
      redisCount = keys.length;
    } catch (err) {
      logger.warn({ err: err.message }, 'Redis stats failed');
    }
  }

  return { redis: redisCount, memory: memoryCount, usingRedis: redisAvailable };
}

/**
 * Clear all blacklisted tokens (for testing)
 */
export async function clearBlacklist() {
  if (redisAvailable && redisClient) {
    try {
      const keys = await redisClient.keys('blacklist:*');
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch (err) {
      logger.warn({ err: err.message }, 'Redis clear failed');
    }
  }

  memoryBlacklist.clear();
}

/**
 * Graceful shutdown
 */
export async function shutdown() {
  if (redisClient) {
    await redisClient.quit();
    redisAvailable = false;
    logger.info('Redis connection closed');
  }
}

export default {
  initRedis,
  blacklistToken,
  isTokenBlacklisted,
  removeFromBlacklist,
  getBlacklistStats,
  clearBlacklist,
  shutdown
};