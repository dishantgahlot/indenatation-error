import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { db } from './db.js';
import authRouter from './routes/auth.js';
import habitsRouter from './routes/habits.js';
import simulationRouter from './routes/simulation.js';
import profileRouter from './routes/profile.js';
import { requestLogger } from './middleware/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { limiters, globalLimiter } from './middleware/rateLimiter.js';
import { initRedis, shutdown as shutdownRedis, getBlacklistStats } from './utils/tokenBlacklist.js';
import logger from './utils/logger.js';

const isProduction = process.env.NODE_ENV === 'production';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

// Initialize Redis for token blacklist
initRedis();

// Wait for database connections to initialize
setTimeout(() => {}, 100);

const app = express();

// Trust proxy for correct IP detection behind reverse proxy
app.set('trust proxy', 1);
app.set('etag', false);
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// ============================================================================
// Security & Production Middlewares
// ============================================================================

// CORS - Allow frontend origin, vercel preview domains, and local development
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (!isProduction || origin.includes('localhost') || origin.endsWith('.vercel.app') || origin === FRONTEND_ORIGIN) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  credentials: true,
  maxAge: isProduction ? 86400 : 0, // 24h cache in production
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

// Body parsing with limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global rate limiter (applies to all routes)
app.use(globalLimiter);

// Request logging
app.use(requestLogger);

// ============================================================================
// RESTful Route Mounts with specific rate limiters
// ============================================================================

// Auth routes - strict rate limiting
app.use('/api/auth', limiters.auth, authRouter);

// Habits routes - standard API rate limiting
app.use('/api/habits', limiters.api, habitsRouter);

// Simulation routes - strict rate limiting (LLM calls are expensive)
app.use('/api/simulation', limiters.simulation, simulationRouter);

// Profile routes - standard API rate limiting
app.use('/api/profile', limiters.api, profileRouter);

// ============================================================================
// Production Health & Diagnostics Endpoint
// ============================================================================
app.get('/api/health', async (req, res) => {
  const mem = process.memoryUsage();

  // Check database health
  let dbHealth = { status: 'unknown', latency_ms: null };
  try {
    const start = Date.now();
    await db.healthCheck?.() || Promise.resolve();
    dbHealth = { status: 'healthy', latency_ms: Date.now() - start };
  } catch (err) {
    dbHealth = { status: 'unhealthy', latency_ms: null, error: err.message };
  }

  // Check Redis/blacklist health
  let redisHealth = { status: 'not_configured', latency_ms: null };
  if (process.env.REDIS_URL || process.env.REDIS_TLS_URL) {
    try {
      const start = Date.now();
      const stats = await getBlacklistStats();
      redisHealth = { status: 'healthy', latency_ms: Date.now() - start, ...stats };
    } catch (err) {
      redisHealth = { status: 'unhealthy', latency_ms: null, error: err.message };
    }
  }

  // Determine database mode
  const dbMode = db.dbMode || (db.isMongoConnected ? 'mongodb' : 'local');
  const dbModeLabels = {
    supabase: 'Supabase/PostgreSQL',
    mongodb: 'MongoDB Atlas (Mongoose)',
    local: 'Local Persistent JSON Engine'
  };
  const dbStorageLabels = {
    supabase: 'Supabase Cloud (PostgreSQL)',
    mongodb: 'MongoDB Atlas Cloud Cluster',
    local: 'server/data/store.json'
  };

  const health = {
    status: dbHealth.status === 'healthy' && (redisHealth.status === 'healthy' || redisHealth.status === 'not_configured') ? 'healthy' : 'degraded',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.round(process.uptime()),
    runtime: {
      node_version: process.version,
      platform: process.platform,
      memory: {
        rss_mb: Math.round(mem.rss / 1024 / 1024),
        heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
        heap_total_mb: Math.round(mem.heapTotal / 1024 / 1024)
      }
    },
    database: {
      mode: dbMode,
      active_driver: dbModeLabels[dbMode] || dbModeLabels.local,
      storage_location: dbStorageLabels[dbMode] || dbStorageLabels.local,
      is_mongo_connected: db.isMongoConnected,
      is_supabase_connected: db.supabaseDb?.isConnected || false,
      health: dbHealth
    },
    redis: redisHealth,
    ai_llm: {
      groq_configured: Boolean(config.GROQ_API_KEY),
      model: config.GROQ_MODEL
    },
    rate_limits: {
      auth: { window: '15m', max: isProduction ? 10 : 50 },
      simulation: { window: '1h', max: isProduction ? 20 : 100 },
      api: { window: '15m', max: isProduction ? 100 : 500 },
      global: { window: '1m', max: isProduction ? 60 : 300 }
    }
  };

  // Set appropriate HTTP status
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

// ============================================================================
// 404 & Error Handlers
// ============================================================================
app.use(notFoundHandler);
app.use(errorHandler);

// ============================================================================
// Server Listener (Skipped on Vercel Serverless environment)
// ============================================================================
let server;
if (!process.env.VERCEL) {
  server = app.listen(config.PORT, () => {
    logger.info({
      port: config.PORT,
      env: process.env.NODE_ENV || 'development',
      frontend_origin: FRONTEND_ORIGIN
    }, `🚀 [Digital Twin Backend] Production server active on http://localhost:${config.PORT}`);
    console.log(`📡 [API Health] http://localhost:${config.PORT}/api/health`);
  });
}

// ============================================================================
// Graceful Shutdown
// ============================================================================
const handleShutdown = async (signal) => {
  logger.info({ signal }, `Received ${signal}. Shutting down gracefully...`);

  if (!server) {
    await shutdownRedis();
    process.exit(0);
  }

  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed');

    // Close Redis connection
    await shutdownRedis();

    logger.info('Graceful shutdown complete');
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('uncaughtException', (err) => {
  logger.fatal({ err: err.message, stack: err.stack }, 'Uncaught Exception');
  handleShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason) => {
  logger.error({ reason: reason?.message || reason, stack: reason?.stack }, 'Unhandled Rejection');
});

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export default app;