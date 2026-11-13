import express from 'express';
import { db } from '../db.js';
import { TwinSimulator } from '../services/twinSimulator.js';
import { LLMService } from '../services/llmService.js';
import { optionalAuth } from '../middleware/auth.js';
import { validate, simulationSchemas } from '../middleware/validation.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Helper to resolve active metrics
async function resolveMetrics(userId, incoming = {}) {
  const latest = await db.getLatestLog(userId) || {};
  return {
    sleep: incoming.sleep !== undefined ? Number(incoming.sleep) : (latest.sleep !== undefined ? Number(latest.sleep) : 5.2),
    study: incoming.study !== undefined ? Number(incoming.study) : (latest.study !== undefined ? Number(latest.study) : 2.1),
    screen: incoming.screen !== undefined ? Number(incoming.screen) : (latest.screen !== undefined ? Number(latest.screen) : 7.8),
    exercise: incoming.exercise !== undefined ? Number(incoming.exercise) : (latest.exercise !== undefined ? Number(latest.exercise) : 0.3),
    spending: incoming.spending !== undefined ? Number(incoming.spending) : (latest.spending !== undefined ? Number(latest.spending) : 280),
    hydration: incoming.hydration !== undefined ? Number(incoming.hydration) : (latest.hydration !== undefined ? Number(latest.hydration) : 1.8),
    productivity_score: incoming.productivity_score !== undefined ? Number(incoming.productivity_score) : (latest.productivity_score !== undefined ? Number(latest.productivity_score) : 42)
  };
}

// GET /api/simulation/scenarios
router.get('/scenarios', optionalAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const user = req.user || await db.findUserById(userId);
    const userName = user?.name || 'Dishant';
    const scenarios = TwinSimulator.generateSimulation(userId, userName);
    res.json(scenarios);
  } catch (err) {
    logger.error({ err: err.message, stack: err.stack }, 'Error generating scenarios');
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/simulation/letter (with query params support)
router.get('/letter', optionalAuth, validate(simulationSchemas.letterQuery, 'query'), async (req, res) => {
  try {
    const scenarioType = req.query.scenario_type === 'unimproved' ? 'unimproved' : 'improved';
    const forceRefresh = req.query.force_refresh === 'true';

    const userId = req.userId;
    const user = req.user || await db.findUserById(userId);
    const userName = user?.name || 'Dishant';

    logger.debug({ userId, userName, scenarioType, forceRefresh }, 'Letter request');

    const metrics = await resolveMetrics(userId, req.query);

    const letter = await LLMService.generateFutureLetter(
      userName,
      scenarioType,
      metrics,
      forceRefresh,
      userId
    );

    res.json(letter);
  } catch (err) {
    logger.error({ err: err.message, stack: err.stack }, 'Error generating letter');
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/simulation/letter (Direct dynamic metric ingestion for instant recalculation)
router.post('/letter', optionalAuth, validate(simulationSchemas.letterBody, 'body'), async (req, res) => {
  try {
    const scenarioType = req.body.scenario_type === 'unimproved' ? 'unimproved' : 'improved';
    const forceRefresh = Boolean(req.body.force_refresh);

    const userId = req.userId;
    const user = req.user || await db.findUserById(userId);
    const userName = user?.name || 'Dishant';
    const metrics = await resolveMetrics(userId, req.body.metrics || req.body);

    logger.debug({ userId, userName, scenarioType, forceRefresh, hasCustomMetrics: !!req.body.metrics }, 'Letter POST request');

    const letter = await LLMService.generateFutureLetter(
      userName,
      scenarioType,
      metrics,
      forceRefresh,
      userId
    );

    res.json(letter);
  } catch (err) {
    logger.error({ err: err.message, stack: err.stack }, 'Error generating letter via POST');
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;