import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { db } from '../db.js';
import { isTokenBlacklisted } from '../utils/tokenBlacklist.js';

export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      // Check if token is blacklisted
      if (await isTokenBlacklisted(token)) {
        // Token is blacklisted, fall through to guest user
      } else {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        const user = await db.findUserById(decoded.id);
        if (user) {
          req.user = user;
          req.userId = user.id;
          return next();
        }
      }
    }
  } catch (err) {
    // Token expired or invalid, continue as guest user
  }

  // Fallback to guest user (no authentication)
  // Use a special guest ID that won't match any real user's logs
  req.user = { id: 'guest', name: 'Guest', isGuest: true };
  req.userId = 'guest';
  next();
}

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
    }

    const token = authHeader.split(' ')[1];

    // Check if token is blacklisted
    if (await isTokenBlacklisted(token)) {
      return res.status(401).json({ error: 'Token has been revoked. Please log in again.' });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = await db.findUserById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'User not found or token invalid.' });
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token', message: err.message });
  }
}
