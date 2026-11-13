import { z } from 'zod';
import logger from '../utils/logger.js';

/**
 * Validation middleware factory
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const data = req[source];
    const result = schema.safeParse(data);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      logger.warn({
        path: req.path,
        method: req.method,
        errors,
        source
      }, 'Validation failed');

      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    // Replace with validated/transformed data (only for body, query/params are read-only in Express)
    if (source === 'body') {
      req.body = result.data;
    }
    next();
  };
}

/**
 * Auth validation schemas
 */
export const authSchemas = {
  register: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
    email: z.string().transform(v => (v || '').trim().toLowerCase()).pipe(z.string().email('Invalid email format')),
    password: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password too long'),
    character_id: z.string().min(1).max(50).optional()
  }),

  login: z.object({
    email: z.string().transform(v => (v || '').trim().toLowerCase()).pipe(z.string().email('Invalid email format')),
    password: z.string().min(1, 'Password is required')
  }),

  avatar: z.object({
    character_id: z.string().min(1).max(50).optional(),
    name: z.string().min(1).max(100).optional(),
    custom_avatar_url: z.string().url('Invalid URL format').max(500).optional(),
    title: z.string().max(100).optional()
  }).refine(data => data.character_id || data.custom_avatar_url || data.name, {
    message: 'At least one of character_id, custom_avatar_url, or name must be provided'
  })
};

/**
 * Habits validation schemas
 */
export const habitSchemas = {
  log: z.object({
    sleep: z.number().min(0).max(24, 'Sleep cannot exceed 24 hours'),
    study: z.number().min(0).max(24, 'Study cannot exceed 24 hours'),
    screen: z.number().min(0).max(24, 'Screen time cannot exceed 24 hours'),
    exercise: z.number().min(0).max(24, 'Exercise cannot exceed 24 hours'),
    spending: z.number().min(0).max(100000, 'Spending too high').optional(),
    hydration: z.number().min(0).max(20, 'Hydration cannot exceed 20L').optional(),
    notes: z.string().max(500, 'Notes too long').optional(),
    log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
    is_complete: z.boolean().optional(),
    study_completed: z.boolean().optional(),
    exercise_completed: z.boolean().optional()
  }).refine(data => data.sleep + data.study + data.screen + data.exercise <= 24, {
    message: 'Total hours cannot exceed 24',
    path: ['totalHours']
  }),

  batch: z.object({
    dataset: z.array(z.object({
      sleep: z.number().min(0).max(24),
      study: z.number().min(0).max(24),
      screen: z.number().min(0).max(24),
      exercise: z.number().min(0).max(24),
      spending: z.number().min(0).max(100000).optional(),
      hydration: z.number().min(0).max(20).optional(),
      notes: z.string().max(500).optional(),
      log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    })).min(1, 'Dataset cannot be empty').max(365, 'Dataset too large (max 365 days)')
  })
};

/**
 * Simulation validation schemas
 */
export const simulationSchemas = {
  letterQuery: z.object({
    scenario_type: z.enum(['improved', 'unimproved']).optional(),
    force_refresh: z.coerce.boolean().optional()
  }).optional(),

  letterBody: z.object({
    scenario_type: z.enum(['improved', 'unimproved']).optional(),
    force_refresh: z.coerce.boolean().optional(),
    metrics: z.object({
      sleep: z.number().min(0).max(24).optional(),
      study: z.number().min(0).max(24).optional(),
      screen: z.number().min(0).max(24).optional(),
      exercise: z.number().min(0).max(24).optional(),
      spending: z.number().min(0).max(100000).optional(),
      hydration: z.number().min(0).max(20).optional(),
      productivity_score: z.number().min(0).max(100).optional()
    }).optional()
  }).optional()
};

/**
 * Profile validation schemas
 */
export const profileSchemas = {
  update: z.object({
    character_id: z.string().min(1).max(50).optional(),
    name: z.string().min(1).max(100).optional(),
    custom_avatar_url: z.string().url('Invalid URL format').max(500).optional(),
    title: z.string().max(100).optional()
  })
};

/**
 * Query parameter validation helpers
 */
export const querySchemas = {
  pagination: z.object({
    query: z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      sort: z.string().optional(),
      order: z.enum(['asc', 'desc']).optional()
    })
  }),

  dateRange: z.object({
    query: z.object({
      start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
    })
  })
};

export default { validate, authSchemas, habitSchemas, simulationSchemas, profileSchemas, querySchemas };