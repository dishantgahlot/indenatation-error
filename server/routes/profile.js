import express from 'express';
import { db } from '../db.js';
import { optionalAuth } from '../middleware/auth.js';
import { validate, profileSchemas } from '../middleware/validation.js';
import logger from '../utils/logger.js';

const router = express.Router();

function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, ...safe } = user;
  return safe;
}

// GET /api/profile
router.get('/', optionalAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const user = req.user || await db.findUserById(userId);
    res.json(sanitizeUser(user));
  } catch (err) {
    logger.error({ err: err.message, stack: err.stack }, 'Error fetching profile');
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/profile
router.put('/', optionalAuth, validate(profileSchemas.update), async (req, res) => {
  try {
    const userId = req.userId;
    const { name, email, character_id, title, avatar_thumb, avatar_full, custom_avatar_url, is_custom } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email.toLowerCase().trim();
    if (character_id !== undefined) updates.character_id = character_id;
    if (title !== undefined) updates.title = title;
    if (avatar_thumb !== undefined) updates.avatar_thumb = avatar_thumb;
    if (avatar_full !== undefined) updates.avatar_full = avatar_full;
    if (custom_avatar_url !== undefined) updates.custom_avatar_url = custom_avatar_url;
    if (is_custom !== undefined) updates.is_custom = is_custom;

    const updated = await db.updateUser(userId, updates);
    logger.info({ userId }, 'Profile updated');

    res.json(sanitizeUser(updated));
  } catch (err) {
    logger.error({ err: err.message, stack: err.stack }, 'Error updating profile');
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;