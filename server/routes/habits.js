import express from 'express';
import { db } from '../db.js';
import { HabitEngine } from '../services/habitEngine.js';
import { optionalAuth } from '../middleware/auth.js';
import { validate, habitSchemas } from '../middleware/validation.js';
import logger from '../utils/logger.js';

const router = express.Router();

// GET /api/habits/current
router.get('/current', optionalAuth, async (req, res) => {
  try {
    const userId = req.userId !== 'guest' ? req.userId : (req.query.userId || req.userId);
    const latest = await db.getLatestLog(userId);
    // Return zeros when no data logged yet
    const sleep = latest ? Number(latest.sleep) : 0;
    const study = latest ? Number(latest.study) : 0;
    const screen = latest ? Number(latest.screen) : 0;
    const exercise = latest ? Number(latest.exercise) : 0;
    const spending = latest ? Number(latest.spending) : 0;
    const hydration = latest ? Number(latest.hydration) : 0;

    const score = HabitEngine.calculateProductivityScore(sleep, study, screen, exercise, spending);
    const statusLabel = HabitEngine.getStatusBadge(score);

    const metrics = [
      {
        id: 'sleep',
        label: 'Sleep',
        value: `${sleep} h`,
        current: sleep,
        target: 8.0,
        unit: 'h',
        targetLabel: 'Target: 8.0h',
        progress: Math.min(1.0, Math.round((sleep / 8.0) * 100) / 100),
        color: '#527ea9',
        trackColor: '#ebdccf',
        iconColor: '#25496f',
        bgColor: '#edf4fa',
        tooltip: sleep < 8.0 ? `Optimal: 8.0h (${Math.round((sleep - 8.0) * 10) / 10}h deficit)` : 'Optimal sleep achieved'
      },
      {
        id: 'study',
        label: 'Study',
        value: `${study} h`,
        current: study,
        target: 4.0,
        unit: 'h',
        targetLabel: 'Target: 4.0h',
        progress: Math.min(1.0, Math.round((study / 4.0) * 100) / 100),
        color: '#c55f46',
        trackColor: '#ebdccf',
        iconColor: '#963923',
        bgColor: '#faeeea',
        tooltip: 'Target: 4.0h daily focus'
      },
      {
        id: 'screen',
        label: 'Screen',
        value: `${screen} h`,
        current: screen,
        target: 5.0,
        unit: 'h',
        targetLabel: 'Limit: 5.0h',
        progress: Math.min(1.0, Math.round((screen / 10.0) * 100) / 100),
        color: '#b33e37',
        trackColor: '#ebdccf',
        iconColor: '#7e241e',
        bgColor: '#faebea',
        tooltip: screen > 5.0 ? 'High usage alert (limit 5.0h)' : 'Within healthy screen limits'
      },
      {
        id: 'exercise',
        label: 'Exercise',
        value: `${exercise} h`,
        current: exercise,
        target: 1.0,
        unit: 'h',
        targetLabel: 'Goal: 1.0h',
        progress: Math.min(1.0, Math.round((exercise / 1.0) * 100) / 100),
        color: '#d67f56',
        trackColor: '#ebdccf',
        iconColor: '#9c4923',
        bgColor: '#faeee7',
        tooltip: 'Goal: 45 min moderate workout'
      },
      {
        id: 'spending',
        label: 'Spending',
        value: `₹${Math.round(spending)}/day`,
        current: spending,
        target: 600,
        unit: '₹/day',
        targetLabel: 'Limit: ₹600/day',
        progress: Math.min(1.0, Math.round((spending / 600) * 100) / 100),
        color: '#d49b32',
        trackColor: '#ebdccf',
        iconColor: '#966617',
        bgColor: '#fcf6e8',
        tooltip: `Budget: ₹600/day (Saving ₹${Math.max(0, Math.round(600 - spending))})`
      },
      {
        id: 'hydration',
        label: 'Hydration',
        value: `${hydration} L`,
        current: hydration,
        target: 3.0,
        unit: 'L',
        targetLabel: 'Target: 3.0L',
        progress: Math.min(1.0, Math.round((hydration / 3.0) * 100) / 100),
        color: '#38bdf8',
        trackColor: '#ebdccf',
        iconColor: '#0284c7',
        bgColor: '#eff6ff',
        tooltip: 'Optimal hydration: 3.0L per day'
      }
    ];

    res.json({
      user_id: userId,
      log_date: latest ? latest.log_date : new Date().toISOString().split('T')[0],
      productivity_score: score,
      status_label: statusLabel,
      metrics
    });
  } catch (err) {
    logger.error({ err: err.message, stack: err.stack }, 'Error fetching current habits');
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/habits/log
router.post('/log', optionalAuth, validate(habitSchemas.log), async (req, res) => {
  try {
    const userId = req.userId !== 'guest' ? req.userId : (req.query.userId || req.userId);
    const { sleep, study, screen, exercise, spending, hydration, notes, log_date, is_complete } = req.body;

    const sleepNum = Number(sleep) || 0;
    const studyNum = Number(study) || 0;
    const screenNum = Number(screen) || 0;
    const exerciseNum = Number(exercise) || 0;
    const spendingNum = Number(spending !== undefined ? spending : 0);
    const hydrationNum = Number(hydration !== undefined ? hydration : 0);

    // Calculate if all 6 factors are completed
    const factorsCompleted = [
      sleepNum > 0,
      studyNum > 0 || req.body.study_completed === true,
      screenNum > 0,
      exerciseNum > 0 || req.body.exercise_completed === true,
      spendingNum > 0,
      hydrationNum > 0
    ].filter(Boolean).length;

    const isFullyComplete = Boolean(is_complete) || factorsCompleted === 6;

    const saved = await db.saveDailyLog({
      sleep: sleepNum,
      study: studyNum,
      screen: screenNum,
      exercise: exerciseNum,
      spending: spendingNum,
      hydration: hydrationNum,
      notes: notes || '',
      log_date: log_date || new Date().toISOString().split('T')[0],
      is_complete: isFullyComplete
    }, userId);

    const score = HabitEngine.calculateProductivityScore(
      saved.sleep, saved.study, saved.screen, saved.exercise, saved.spending
    );

    const streakData = await HabitEngine.getStreakData(userId);

    logger.info({ userId, logDate: saved.log_date, score, isFullyComplete }, 'Habit log saved');

    res.json({
      success: true,
      log: saved,
      productivity_score: score,
      status_badge: HabitEngine.getStatusBadge(score),
      is_day_completed: isFullyComplete,
      completed_factors_count: factorsCompleted,
      streak: streakData
    });
  } catch (err) {
    logger.error({ err: err.message, stack: err.stack }, 'Error saving habit log');
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/habits/batch (Upload/inject custom 7-day, 10-day, or 30-day datasets)
router.post('/batch', optionalAuth, validate(habitSchemas.batch), async (req, res) => {
  try {
    const userId = req.userId;
    const { dataset } = req.body;

    const saved = await db.saveBatchLogs(dataset, userId);
    const weeklyData = await HabitEngine.getWeeklyCycle(userId);

    logger.info({ userId, count: saved.length }, 'Batch habit logs saved');

    res.json({
      success: true,
      count: saved.length,
      dataset: saved,
      weekly_cycle: weeklyData
    });
  } catch (err) {
    logger.error({ err: err.message, stack: err.stack }, 'Error saving batch habit logs');
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/habits/weekly-cycle
router.get('/weekly-cycle', optionalAuth, async (req, res) => {
  try {
    const userId = req.userId !== 'guest' ? req.userId : (req.query.userId || req.userId);
    const weeklyData = await HabitEngine.getWeeklyCycle(userId);
    res.json(weeklyData);
  } catch (err) {
    logger.error({ err: err.message, stack: err.stack }, 'Error fetching weekly cycle');
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/habits/clear (Clear habit logs)
router.post('/clear', optionalAuth, async (req, res) => {
  try {
    const userId = req.body?.all ? null : (req.userId !== 'guest' ? req.userId : (req.query.userId || req.userId));
    await db.clearAllLogs(userId);
    logger.info({ userId }, 'Habit logs cleared');
    res.json({ success: true, message: 'Habit logs cleared successfully' });
  } catch (err) {
    logger.error({ err: err.message }, 'Error clearing habit logs');
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/habits/streak
router.get('/streak', optionalAuth, async (req, res) => {
  try {
    const userId = req.userId !== 'guest' ? req.userId : (req.query.userId || req.userId);
    const days = parseInt(req.query.days) || 365;
    const streakData = await HabitEngine.getStreakData(userId, days);
    res.json({
      user_id: userId,
      ...streakData
    });
  } catch (err) {
    logger.error({ err: err.message, stack: err.stack }, 'Error fetching streak data');
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;