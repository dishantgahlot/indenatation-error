import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { blacklistToken, isTokenBlacklisted } from '../utils/tokenBlacklist.js';
import { validate, authSchemas } from '../middleware/validation.js';
import logger from '../utils/logger.js';

const router = express.Router();

function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, ...safe } = user;
  return safe;
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );
}

// POST /api/auth/register
router.post('/register', validate(authSchemas.register), async (req, res) => {
  try {
    const { name, email, password, character_id = 'explorer' } = req.body;

    const existing = await db.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, error: 'A traveler with this email address already exists' });
    }

    // Default preset
    const preset = config.CHARACTER_PRESETS.find(p => p.id === character_id) || config.CHARACTER_PRESETS[0];

    const user = await db.createUser({
      name: name || 'Adventurer',
      email,
      password,
      character_id: preset.id,
      title: preset.title,
      avatar_thumb: preset.avatarThumb,
      avatar_full: preset.avatarFull
    });

    const token = generateToken(user);

    logger.info({ userId: user.id, email }, 'User registered');

    res.status(201).json({
      success: true,
      token,
      user: sanitizeUser(user),
      firstLogin: true
    });
  } catch (err) {
    logger.error({ err: err.message, stack: err.stack }, 'Registration error');
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', validate(authSchemas.login), async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials. User not found.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials. Incorrect password.' });
    }

    const token = generateToken(user);

    logger.info({ userId: user.id, email }, 'User logged in');

    res.json({
      success: true,
      token,
      user: sanitizeUser(user),
      firstLogin: false
    });
  } catch (err) {
    logger.error({ err: err.message, stack: err.stack }, 'Login error');
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: sanitizeUser(req.user)
  });
});

// PUT /api/auth/avatar (Choose & switch avatar after login)
router.put('/avatar', requireAuth, validate(authSchemas.avatar), async (req, res) => {
  try {
    const { character_id, name, custom_avatar_url, title } = req.body;
    let updates = {};

    if (character_id === 'custom' && custom_avatar_url) {
      updates = {
        character_id: 'custom',
        avatar_thumb: custom_avatar_url,
        avatar_full: custom_avatar_url,
        custom_avatar_url,
        title: title || 'Custom Explorer',
        is_custom: true
      };
    } else {
      const preset = config.CHARACTER_PRESETS.find(p => p.id === character_id) || config.CHARACTER_PRESETS[0];
      updates = {
        character_id: preset.id,
        title: preset.title,
        avatar_thumb: preset.avatarThumb,
        avatar_full: preset.avatarFull,
        is_custom: false
      };
    }

    if (name) {
      updates.name = name;
    }

    const updatedUser = await db.updateUser(req.userId, updates);
    res.json({
      success: true,
      user: sanitizeUser(updatedUser)
    });
  } catch (err) {
    logger.error({ err: err.message, stack: err.stack }, 'Avatar update error');
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', requireAuth, async (req, res) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Add token to blacklist (async with TTL matching JWT expiry)
      await blacklistToken(token, 604800); // 7 days
    }

    logger.info({ userId: req.userId }, 'User logged out');

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (err) {
    logger.error({ err: err.message, stack: err.stack }, 'Logout error');
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/status - Check if token is still valid (not blacklisted)
router.get('/status', requireAuth, (req, res) => {
  res.json({
    success: true,
    authenticated: true,
    user: sanitizeUser(req.user)
  });
});

export default router;