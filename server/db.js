import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import pg from 'pg';
import { config } from './config/index.js';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NOW_REGION);
const DB_FILE = isServerless ? path.join('/tmp', 'store.json') : path.join(__dirname, 'data/store.json');

// --- Mongoose Schemas (Used when MONGODB_URI is provided) ---
const UserMongooseSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  character_id: { type: String, default: 'explorer' },
  title: { type: String, default: 'The Mountain Explorer' },
  avatar_thumb: { type: String, default: '/assets/avatar_explorer_thumb.jpg' },
  avatar_full: { type: String, default: '/assets/avatar_explorer_full.jpg' },
  custom_avatar_url: { type: String, default: '' },
  is_custom: { type: Boolean, default: false }
}, { timestamps: true });

const HabitLogMongooseSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  user_id: { type: String, required: true, index: true },
  log_date: { type: String, required: true },
  day_name: { type: String },
  sleep: { type: Number, default: 0 },
  study: { type: Number, default: 0 },
  screen: { type: Number, default: 0 },
  exercise: { type: Number, default: 0 },
  spending: { type: Number, default: 0 },
  hydration: { type: Number, default: 2.0 },
  notes: { type: String, default: '' }
}, { timestamps: true });

// Compound unique index to enforce one habit log per user per date (upsert behavior)
HabitLogMongooseSchema.index({ user_id: 1, log_date: 1 }, { unique: true });

let MongooseUser = null;
let MongooseHabit = null;

// --- Supabase/PostgreSQL Database Class ---
class SupabaseDatabase {
  constructor() {
    this.pool = null;
    this.isConnected = false;
    this.connect();
  }

  connect() {
    const databaseUrl = config.DATABASE_URL || process.env.DATABASE_URL;
    if (!databaseUrl || databaseUrl.trim() === '') {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('💾 [DB] Mode: Local Persistent JSON Database Engine');
      console.log('📍 File: server/data/store.json');
      console.log('ℹ️  To connect to Supabase/PostgreSQL, add your connection string to .env:');
      console.log('    DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return;
    }

    try {
      console.log('🔄 [DB] Connecting to Supabase/PostgreSQL via DATABASE_URL...');
      const isLocalhost = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');
      this.pool = new Pool({
        connectionString: databaseUrl,
        ssl: isLocalhost ? false : { rejectUnauthorized: false },
        max: isServerless ? 2 : 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 8000,
      });

      // Prevent uncaught errors from crashing Node process when DB host is unreachable
      this.pool.on('error', (err) => {
        console.warn('⚠️ [DB] Supabase pool error:', err.message);
        this.isConnected = false;
      });

      // Test connection
      this.pool.query('SELECT NOW()', (err) => {
        if (err) {
          console.warn('⚠️ [DB] Could not establish connection to Supabase:', err.message);
          console.warn('⚡ [DB] Gracefully running on local persistent JSON store (zero downtime).');
          this.isConnected = false;
        } else {
          this.isConnected = true;
          console.log('✅ [DB] Successfully connected to Supabase/PostgreSQL! Cloud persistence active.');
          this.initTables();
        }
      });
    } catch (err) {
      console.warn('⚠️ [DB] Could not establish connection to Supabase:', err.message);
      console.warn('⚡ [DB] Gracefully running on local persistent JSON store (zero downtime).');
      this.isConnected = false;
    }
  }

  async initTables() {
    if (!this.pool) return;
    try {
      // Users table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          character_id TEXT DEFAULT 'explorer',
          title TEXT DEFAULT 'The Mountain Explorer',
          avatar_thumb TEXT DEFAULT '/assets/avatar_explorer_thumb.jpg',
          avatar_full TEXT DEFAULT '/assets/avatar_explorer_full.jpg',
          custom_avatar_url TEXT DEFAULT '',
          is_custom BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      // Habit logs table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS habit_logs (
          id BIGSERIAL PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          log_date DATE NOT NULL,
          day_name TEXT,
          sleep NUMERIC DEFAULT 0,
          study NUMERIC DEFAULT 0,
          screen NUMERIC DEFAULT 0,
          exercise NUMERIC DEFAULT 0,
          spending NUMERIC DEFAULT 0,
          hydration NUMERIC DEFAULT 2.0,
          notes TEXT DEFAULT '',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id, log_date)
        )
      `);

      // Index for fast user log queries
      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date
        ON habit_logs(user_id, log_date DESC)
      `);

      // Simulation cache table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS simulation_cache (
          cache_key TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          scenario_type TEXT NOT NULL,
          letter_data JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      // Hydrate local JSON with Supabase users
      await this.hydrateLocalCache();

      console.log('✅ [DB] Supabase tables initialized and synced.');
    } catch (err) {
      console.error('[DB] Error initializing Supabase tables:', err.message);
    }
  }

  async hydrateLocalCache() {
    if (!this.pool) return;
    try {
      const result = await this.pool.query('SELECT * FROM users');
      if (result.rows.length > 0) {
        const localData = this.readLocal();
        result.rows.forEach(user => {
          const idx = localData.users.findIndex(u => u.email === user.email);
          if (idx >= 0) {
            localData.users[idx] = user;
          } else {
            localData.users.push(user);
          }
        });
        this.writeLocal(localData);
      }
    } catch (err) {
      console.error('[DB] Error hydrating local cache from Supabase:', err.message);
    }
  }

  readLocal() {
    try {
      if (!fs.existsSync(DB_FILE)) {
        return defaultSeedData();
      }
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      return defaultSeedData();
    }
  }

  writeLocal(data) {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (e) {
      return false;
    }
  }

  // --- User Methods ---
  async findUserByEmail(email) {
    if (!email) return null;
    const normalizedEmail = email.toLowerCase().trim();
    if (this.pool) {
      try {
        const result = await this.pool.query(
          'SELECT * FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))',
          [normalizedEmail]
        );
        if (result.rows.length > 0) {
          this.isConnected = true;
          return result.rows[0];
        }
      } catch (err) {
        console.error('[DB-Supabase] Error finding user by email:', err.message);
      }
    }
    // Fallback to local
    const db = this.readLocal();
    return (db.users || []).find(u => u.email && u.email.toLowerCase().trim() === normalizedEmail) || null;
  }

  async findUserById(id) {
    if (!id || id === 'guest') return null;
    if (this.pool) {
      try {
        const result = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (result.rows.length > 0) {
          this.isConnected = true;
          return result.rows[0];
        }
      } catch (err) {
        console.error('[DB-Supabase] Error finding user by id:', err.message);
      }
    }
    const db = this.readLocal();
    return (db.users || []).find(u => u.id === id) || null;
  }

  async createUser(userData) {
    const { name, email, password, character_id = 'explorer', title = 'The Mountain Explorer',
            avatar_thumb = 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex&backgroundColor=b6e3f4',
            avatar_full = 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex&backgroundColor=b6e3f4' } = userData;

    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const password_hash = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();

    const newUser = {
      id, name: name || 'Adventurer', email: email.toLowerCase().trim(), password_hash,
      character_id, title, avatar_thumb, avatar_full,
      custom_avatar_url: '', is_custom: false,
      created_at: now, updated_at: now
    };

    // Write to Supabase if connected
    if (this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO users (id, name, email, password_hash, character_id, title,
           avatar_thumb, avatar_full, custom_avatar_url, is_custom, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [id, newUser.name, newUser.email, newUser.password_hash, newUser.character_id,
           newUser.title, newUser.avatar_thumb, newUser.avatar_full, newUser.custom_avatar_url,
           newUser.is_custom, newUser.created_at, newUser.updated_at]
        );
        this.isConnected = true;
      } catch (err) {
        console.error('[DB-Supabase] Error creating user:', err.message);
      }
    }

    // Also write to local JSON
    const db = this.readLocal();
    if (!db.users) db.users = [];
    db.users.push(newUser);
    // New users start with fresh, unseeded habit logs (0 initial logs)
    if (!db.habit_daily_logs) db.habit_daily_logs = [];
    this.writeLocal(db);

    return newUser;
  }

  async updateUser(id, updates) {
    if (!id || id === 'guest') return null;

    // Update local JSON
    const db = this.readLocal();
    const index = (db.users || []).findIndex(u => u.id === id);
    let updatedUser;

    if (index === -1) {
      return null;
    } else {
      db.users[index] = { ...db.users[index], ...updates, updated_at: new Date().toISOString() };
      this.writeLocal(db);
      updatedUser = db.users[index];
    }

    // Update Supabase if connected
    if (this.isConnected && this.pool) {
      try {
        const setClause = Object.keys(updates).map((key, i) => `${key} = $${i + 2}`).join(', ');
        const values = [id, ...Object.values(updates), new Date().toISOString()];
        await this.pool.query(
          `UPDATE users SET ${setClause}, updated_at = $${values.length} WHERE id = $1`,
          values
        );
      } catch (err) {
        console.error('[DB-Supabase] Error updating user:', err.message);
      }
    }

    return updatedUser;
  }

  // --- Habit Logs Methods ---
  async getRecentLogs(limit = 7, userId = 'default_user') {
    if (this.isConnected && this.pool) {
      try {
        const result = await this.pool.query(
          `SELECT * FROM habit_logs WHERE user_id = $1 ORDER BY log_date DESC LIMIT $2`,
          [userId, limit]
        );
        if (result.rows.length > 0) {
          return result.rows.reverse(); // Oldest first for consistency
        }
        // No logs in Supabase for this user - return empty array
        return [];
      } catch (err) {
        console.error('[DB-Supabase] Error getting recent logs:', err.message);
      }
    }
    // Fallback to local - return only this user's logs (no default seed fallback)
    const db = this.readLocal();
    const userLogs = (db.habit_daily_logs || []).filter(l => l.user_id === userId);
    return userLogs.slice(-limit);
  }

  // Get ALL historical logs for a user (no limit) - used for historical lifestyle score calculation
  async getAllLogs(userId = 'default_user') {
    if (this.isConnected && this.pool) {
      try {
        const result = await this.pool.query(
          `SELECT * FROM habit_logs WHERE user_id = $1 ORDER BY log_date ASC`,
          [userId]
        );
        return result.rows;
      } catch (err) {
        console.error('[DB-Supabase] Error getting all logs:', err.message);
      }
    }
    // Fallback to local
    const db = this.readLocal();
    const userLogs = (db.habit_daily_logs || []).filter(l => l.user_id === userId);
    return userLogs.sort((a, b) => new Date(a.log_date) - new Date(b.log_date));
  }

  async getLatestLog(userId = 'default_user') {
    const logs = await this.getRecentLogs(7, userId);
    return logs[logs.length - 1] || null;
  }

  async saveDailyLog(logData, userId = 'default_user') {
    const targetDate = logData.log_date || new Date().toISOString().split('T')[0];

    const record = {
      id: logData.id || Date.now(),
      user_id: userId,
      log_date: targetDate,
      sleep: Number(logData.sleep),
      study: Number(logData.study),
      screen: Number(logData.screen),
      exercise: Number(logData.exercise),
      spending: logData.spending !== undefined ? Number(logData.spending) : 0,
      hydration: logData.hydration !== undefined ? Number(logData.hydration) : 0,
      notes: logData.notes || '',
      is_complete: Boolean(logData.is_complete),
      updated_at: new Date().toISOString()
    };

    // Write to Supabase if connected
    if (this.isConnected && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO habit_logs (id, user_id, log_date, sleep, study, screen, exercise, spending, hydration, notes, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
           ON CONFLICT (user_id, log_date) DO UPDATE SET
            sleep = EXCLUDED.sleep, study = EXCLUDED.study, screen = EXCLUDED.screen,
            exercise = EXCLUDED.exercise, spending = EXCLUDED.spending, hydration = EXCLUDED.hydration,
            notes = EXCLUDED.notes, updated_at = EXCLUDED.updated_at`,
          [record.id, record.user_id, record.log_date, record.sleep, record.study,
           record.screen, record.exercise, record.spending, record.hydration, record.notes, record.updated_at]
        );
      } catch (err) {
        console.error('[DB-Supabase] Error saving habit log:', err.message);
      }
    }

    // Write to local JSON
    const db = this.readLocal();
    if (!db.habit_daily_logs) db.habit_daily_logs = [];

    const existingIndex = db.habit_daily_logs.findIndex(
      l => l.user_id === userId && l.log_date === targetDate
    );

    if (existingIndex >= 0) {
      db.habit_daily_logs[existingIndex] = record;
    } else {
      db.habit_daily_logs.push(record);
      if (db.habit_daily_logs.length > 50) {
        db.habit_daily_logs = db.habit_daily_logs.slice(-50);
      }
    }

    // Invalidate simulation cache for this user
    if (db.simulation_cache) {
      Object.keys(db.simulation_cache).forEach(k => {
        if (k.startsWith(userId)) delete db.simulation_cache[k];
      });
    }
    this.writeLocal(db);

    // Also invalidate cache in Supabase
    if (this.isConnected && this.pool) {
      try {
        await this.pool.query(
          `DELETE FROM simulation_cache WHERE cache_key LIKE $1`,
          [`${userId}_%`]
        );
      } catch (err) {
        console.error('[DB-Supabase] Error invalidating cache:', err.message);
      }
    }

    return record;
  }

  async saveBatchLogs(logsArray = [], userId = 'default_user') {
    if (!Array.isArray(logsArray) || logsArray.length === 0) return [];

    // Clean previous logs for this user
    if (this.isConnected && this.pool) {
      try {
        await this.pool.query('DELETE FROM habit_logs WHERE user_id = $1', [userId]);
      } catch (err) {
        console.error('[DB-Supabase] Error cleaning logs for batch:', err.message);
      }
    }

    const db = this.readLocal();
    if (!db.habit_daily_logs) db.habit_daily_logs = [];
    db.habit_daily_logs = db.habit_daily_logs.filter(l => l.user_id !== userId);

    const formattedRecords = logsArray.map((item, idx) => {
      const targetDate = item.log_date || new Date(Date.now() - (logsArray.length - 1 - idx) * 86400000).toISOString().split('T')[0];
      return {
        id: item.id || Date.now() + idx,
        user_id: userId,
        log_date: targetDate,
        day_name: item.day_name || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx % 7],
        sleep: Number(item.sleep !== undefined ? item.sleep : 7.0),
        study: Number(item.study !== undefined ? item.study : 3.5),
        screen: Number(item.screen !== undefined ? item.screen : 4.5),
        exercise: Number(item.exercise !== undefined ? item.exercise : 1.0),
        spending: Number(item.spending !== undefined ? item.spending : 300),
        hydration: Number(item.hydration !== undefined ? item.hydration : 2.5),
        notes: item.notes || 'Batch Dataset Log',
        updated_at: new Date().toISOString()
      };
    });

    db.habit_daily_logs.push(...formattedRecords);

    // Invalidate simulation cache
    if (db.simulation_cache) {
      Object.keys(db.simulation_cache).forEach(k => {
        if (k.startsWith(userId)) delete db.simulation_cache[k];
      });
    }
    this.writeLocal(db);

    // Write to Supabase
    if (this.isConnected && this.pool) {
      try {
        for (const rec of formattedRecords) {
          await this.pool.query(
            `INSERT INTO habit_logs (id, user_id, log_date, day_name, sleep, study, screen, exercise, spending, hydration, notes, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
             ON CONFLICT (user_id, log_date) DO UPDATE SET
              day_name = EXCLUDED.day_name, sleep = EXCLUDED.sleep, study = EXCLUDED.study,
              screen = EXCLUDED.screen, exercise = EXCLUDED.exercise, spending = EXCLUDED.spending,
              hydration = EXCLUDED.hydration, notes = EXCLUDED.notes, updated_at = EXCLUDED.updated_at`,
            [rec.id, rec.user_id, rec.log_date, rec.day_name, rec.sleep, rec.study,
             rec.screen, rec.exercise, rec.spending, rec.hydration, rec.notes, rec.updated_at]
          );
        }
        // Invalidate cache in Supabase
        await this.pool.query(`DELETE FROM simulation_cache WHERE cache_key LIKE $1`, [`${userId}_%`]);
      } catch (err) {
        console.error('[DB-Supabase] Batch upsert error:', err.message);
      }
    }

    return formattedRecords;
  }

  async clearAllLogs(userId = null) {
    if (this.isConnected && this.pool) {
      try {
        if (userId) {
          await this.pool.query('DELETE FROM habit_logs WHERE user_id = $1', [userId]);
          await this.pool.query('DELETE FROM simulation_cache WHERE user_id = $1', [userId]);
        } else {
          await this.pool.query('DELETE FROM habit_logs');
          await this.pool.query('DELETE FROM simulation_cache');
        }
      } catch (err) {
        console.error('[DB-Supabase] Error clearing logs:', err.message);
      }
    }
    const db = this.readLocal();
    if (userId) {
      db.habit_daily_logs = (db.habit_daily_logs || []).filter(l => l.user_id !== userId);
      if (db.simulation_cache) {
        Object.keys(db.simulation_cache).forEach(k => {
          if (k.startsWith(userId)) delete db.simulation_cache[k];
        });
      }
    } else {
      db.habit_daily_logs = [];
      db.simulation_cache = {};
    }
    this.writeLocal(db);
    return true;
  }

  // --- Simulation Cache Methods ---
  async getCachedLetter(cacheKey, userId = 'default_user') {
    if (this.isConnected && this.pool) {
      try {
        const result = await this.pool.query(
          'SELECT letter_data FROM simulation_cache WHERE cache_key = $1',
          [cacheKey]
        );
        if (result.rows.length > 0) return result.rows[0].letter_data;
      } catch (err) {
        console.error('[DB-Supabase] Error getting cached letter:', err.message);
      }
    }
    // Fallback to local
    const db = this.readLocal();
    return db.simulation_cache?.[cacheKey] || null;
  }

  async setCachedLetter(cacheKey, letterData, userId = 'default_user') {
    // Write to local
    const db = this.readLocal();
    if (!db.simulation_cache) db.simulation_cache = {};
    db.simulation_cache[cacheKey] = letterData;
    this.writeLocal(db);

    // Write to Supabase
    if (this.isConnected && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO simulation_cache (cache_key, user_id, scenario_type, letter_data)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (cache_key) DO UPDATE SET letter_data = EXCLUDED.letter_data`,
          [cacheKey, userId, letterData.scenario_type || 'improved', JSON.stringify(letterData)]
        );
      } catch (err) {
        console.error('[DB-Supabase] Error caching letter:', err.message);
      }
    }
  }
}

// Export Supabase database instance
export const supabaseDb = new SupabaseDatabase();

// Default Seed Data
const defaultSeedData = () => {
  const defaultPasswordHash = bcrypt.hashSync('password123', 10);

  return {
    users: [
      {
        id: 'usr_default_dishant',
        name: 'Dishant',
        email: 'dishant@futureyou.ai',
        password_hash: defaultPasswordHash,
        character_id: 'explorer',
        title: 'The Mountain Explorer',
        avatar_thumb: '/assets/avatar_explorer_thumb.jpg',
        avatar_full: '/assets/characters/explorer_journey.jpg',
        custom_avatar_url: '',
        is_custom: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    habit_daily_logs: [],
    simulation_cache: {}
  };
};

class UnifiedDatabase {
  constructor() {
    this.memoryStore = defaultSeedData();
    this.dbMode = 'local'; // 'supabase', 'mongodb', or 'local'
    this.isMongoConnected = false;
    this.supabaseDb = null;
    this.init();
    this.connectDatabases();
  }

  init() {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify(this.memoryStore, null, 2), 'utf-8');
      } else {
        const data = this.read();
        let changed = false;
        if (!data.users || data.users.length === 0) {
          data.users = defaultSeedData().users;
          changed = true;
        }
        if (changed) {
          this.write(data);
        }
      }
    } catch (e) {
      // In serverless / read-only filesystem, silently keep memoryStore
    }
  }

  async connectDatabases() {
    // Priority 1: Supabase (DATABASE_URL)
    const databaseUrl = config.DATABASE_URL || process.env.DATABASE_URL;
    if (databaseUrl && databaseUrl.trim() !== '') {
      console.log('🔄 [DB] Attempting Supabase/PostgreSQL connection via DATABASE_URL...');
      try {
        this.supabaseDb = new SupabaseDatabase();
        this.dbMode = 'supabase';
        console.log('✅ [DB] Mode: Supabase/PostgreSQL (Active)');
        return;
      } catch (err) {
        console.warn('⚠️ [DB] Supabase connection failed:', err.message);
      }
    }

    // Priority 2: MongoDB (MONGODB_URI)
    const mongoUri = config.MONGODB_URI || process.env.MONGODB_URI;
    if (mongoUri && mongoUri.trim() !== '') {
      try {
        console.log('🔄 [DB] Connecting to MongoDB Atlas via MONGODB_URI...');
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
        this.isMongoConnected = true;
        MongooseUser = mongoose.models.User || mongoose.model('User', UserMongooseSchema);
        MongooseHabit = mongoose.models.HabitLog || mongoose.model('HabitLog', HabitLogMongooseSchema);
        this.dbMode = 'mongodb';
        console.log('✅ [DB] Mode: MongoDB Atlas (Primary)');

        // Hydrate local cache with MongoDB users
        const mongoUsers = await MongooseUser.find({});
        if (mongoUsers && mongoUsers.length > 0) {
          const localData = this.read();
          mongoUsers.forEach(mu => {
            const idx = localData.users.findIndex(u => u.email === mu.email);
            if (idx >= 0) {
              localData.users[idx] = mu.toObject();
            } else {
              localData.users.push(mu.toObject());
            }
          });
          this.write(localData);
        }
        return;
      } catch (err) {
        console.warn('⚠️ [DB] Could not establish connection to MongoDB Atlas:', err.message);
      }
    }

    // Fallback: Local JSON / In-Memory
    this.dbMode = 'local';
    console.log('💾 [DB] Mode: Persistent Storage Engine active.');
  }

  read() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const data = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === 'object') {
          this.memoryStore = parsed;
          return parsed;
        }
      }
    } catch (e) {
      // In serverless cold starts or read-only FS, silently use memoryStore
    }
    return this.memoryStore || defaultSeedData();
  }

  write(data) {
    if (!data) return false;
    this.memoryStore = data;
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (e) {
      return true;
    }
  }

  // --- User Authentication Methods ---
  async findUserByEmail(email) {
    if (!email) return null;
    const normalizedEmail = email.toLowerCase().trim();

    // Try Supabase first
    if ((this.dbMode === 'supabase' || this.supabaseDb?.pool) && this.supabaseDb) {
      try {
        const user = await this.supabaseDb.findUserByEmail(normalizedEmail);
        if (user) return user;
      } catch (err) {
        console.error('[DB] Supabase findUserByEmail error:', err.message);
      }
    }

    // Try MongoDB
    if (this.dbMode === 'mongodb' && this.isMongoConnected && MongooseUser) {
      try {
        const user = await MongooseUser.findOne({ email: normalizedEmail });
        if (user) return user.toObject();
      } catch (err) {
        console.error('[DB] MongoDB findUserByEmail error:', err.message);
      }
    }

    // Fallback to local JSON / memory store
    const db = this.read();
    return (db.users || []).find(u => u.email && u.email.toLowerCase().trim() === normalizedEmail) || null;
  }

  async findUserById(id) {
    if (!id || id === 'guest') return null;

    // Try Supabase first
    if ((this.dbMode === 'supabase' || this.supabaseDb?.pool) && this.supabaseDb) {
      try {
        const user = await this.supabaseDb.findUserById(id);
        if (user) return user;
      } catch (err) {
        console.error('[DB] Supabase findUserById error:', err.message);
      }
    }

    // Try MongoDB
    if (this.dbMode === 'mongodb' && this.isMongoConnected && MongooseUser) {
      try {
        const user = await MongooseUser.findOne({ id });
        if (user) return user.toObject();
      } catch (err) {
        console.error('[DB] MongoDB findUserById error:', err.message);
      }
    }

    // Fallback to local JSON
    const db = this.read();
    return (db.users || []).find(u => u.id === id) || null;
  }

  async createUser({ name, email, password, character_id = 'explorer', title = 'The Mountain Explorer',
                     avatar_thumb = 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex&backgroundColor=b6e3f4',
                     avatar_full = 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex&backgroundColor=b6e3f4' }) {
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const password_hash = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();

    const newUser = {
      id,
      name: name || 'Adventurer',
      email: email.toLowerCase().trim(),
      password_hash,
      character_id,
      title,
      avatar_thumb,
      avatar_full,
      custom_avatar_url: '',
      is_custom: false,
      created_at: now,
      updated_at: now
    };

    // Write to memory / local JSON
    const db = this.read();
    if (!db.users) db.users = [];
    db.users.push(newUser);
    if (!db.habit_daily_logs) db.habit_daily_logs = [];
    this.write(db);

    // Write to Supabase if available
    if ((this.dbMode === 'supabase' || this.supabaseDb?.pool) && this.supabaseDb) {
      try {
        await this.supabaseDb.createUser({ name, email, password, character_id, title, avatar_thumb, avatar_full });
      } catch (err) {
        console.error('[DB] Supabase createUser error:', err.message);
      }
    }
    // Write to MongoDB if connected
    else if (this.dbMode === 'mongodb' && this.isMongoConnected && MongooseUser) {
      MongooseUser.create(newUser).catch(err => console.error('[DB-Mongo] Error creating user:', err.message));
    }

    return newUser;
  }

  async updateUser(id, updates) {
    if (!id || id === 'guest') return null;

    // Update local JSON first
    const db = this.read();
    const index = (db.users || []).findIndex(u => u.id === id);
    let updatedUser;

    if (index === -1) {
      return null;
    } else {
      db.users[index] = {
        ...db.users[index],
        ...updates,
        updated_at: new Date().toISOString()
      };
      this.write(db);
      updatedUser = db.users[index];
    }

    // Update Supabase if available
    if ((this.dbMode === 'supabase' || this.supabaseDb?.pool) && this.supabaseDb) {
      try {
        await this.supabaseDb.updateUser(id, updates);
      } catch (err) {
        console.error('[DB] Supabase updateUser error:', err.message);
      }
    }
    // Update MongoDB if connected
    else if (this.dbMode === 'mongodb' && this.isMongoConnected && MongooseUser) {
      MongooseUser.updateOne({ id }, { $set: updates }).catch(err => console.error('[DB-Mongo] Error updating user:', err.message));
    }

    return updatedUser;
  }

  // --- Habit Logs Methods ---
  async getRecentLogs(limit = 7, userId = 'default_user') {
    // Try Supabase first
    if ((this.dbMode === 'supabase' || this.supabaseDb?.pool) && this.supabaseDb) {
      try {
        const logs = await this.supabaseDb.getRecentLogs(limit, userId);
        if (logs) return logs;
      } catch (err) {
        console.error('[DB] Supabase getRecentLogs error:', err.message);
      }
    }

    // Try MongoDB
    if (this.dbMode === 'mongodb' && this.isMongoConnected && MongooseHabit) {
      try {
        const logs = await MongooseHabit.find({ user_id: userId })
          .sort({ log_date: -1 })
          .limit(limit)
          .lean();
        return logs.reverse(); // Oldest first
      } catch (err) {
        console.error('[DB] MongoDB getRecentLogs error:', err.message);
      }
    }

    // Fallback to local JSON - return only this user's logs (no default seed fallback)
    const db = this.read();
    const userLogs = (db.habit_daily_logs || []).filter(l => l.user_id === userId);
    return userLogs.slice(-limit);
  }

  // Get ALL historical logs for a user (no limit) - used for historical lifestyle score calculation
  async getAllLogs(userId = 'default_user') {
    // Try Supabase first
    if ((this.dbMode === 'supabase' || this.supabaseDb?.pool) && this.supabaseDb) {
      try {
        if (this.supabaseDb.pool) {
          const result = await this.supabaseDb.pool.query(
            `SELECT * FROM habit_logs WHERE user_id = $1 ORDER BY log_date ASC`,
            [userId]
          );
          if (result.rows.length > 0) {
            return result.rows;
          }
        }
      } catch (err) {
        console.error('[DB] Supabase getAllLogs error:', err.message);
      }
    }

    // Try MongoDB
    if (this.dbMode === 'mongodb' && this.isMongoConnected && MongooseHabit) {
      try {
        const logs = await MongooseHabit.find({ user_id: userId })
          .sort({ log_date: 1 })
          .lean();
        return logs;
      } catch (err) {
        console.error('[DB] MongoDB getAllLogs error:', err.message);
      }
    }

    // Fallback to local JSON - return all this user's logs
    const db = this.read();
    const userLogs = (db.habit_daily_logs || []).filter(l => l.user_id === userId);
    return userLogs.sort((a, b) => new Date(a.log_date) - new Date(b.log_date));
  }

  async getLatestLog(userId = 'default_user') {
    const logs = await this.getRecentLogs(7, userId);
    return logs[logs.length - 1] || null;
  }

  async saveDailyLog(logData, userId = 'default_user') {
    const targetDate = logData.log_date || new Date().toISOString().split('T')[0];

    const record = {
      id: logData.id || Date.now(),
      user_id: userId,
      log_date: targetDate,
      sleep: Number(logData.sleep),
      study: Number(logData.study),
      screen: Number(logData.screen),
      exercise: Number(logData.exercise),
      spending: logData.spending !== undefined ? Number(logData.spending) : 0,
      hydration: logData.hydration !== undefined ? Number(logData.hydration) : 0,
      notes: logData.notes || '',
      is_complete: Boolean(logData.is_complete),
      updated_at: new Date().toISOString()
    };

    // Write to local JSON first
    const db = this.read();
    if (!db.habit_daily_logs) db.habit_daily_logs = [];

    const existingIndex = db.habit_daily_logs.findIndex(
      l => l.user_id === userId && l.log_date === targetDate
    );

    if (existingIndex >= 0) {
      db.habit_daily_logs[existingIndex] = record;
    } else {
      db.habit_daily_logs.push(record);
      if (db.habit_daily_logs.length > 50) {
        db.habit_daily_logs = db.habit_daily_logs.slice(-50);
      }
    }

    // Invalidate simulation cache for this user
    if (db.simulation_cache) {
      Object.keys(db.simulation_cache).forEach(k => {
        if (k.startsWith(userId)) delete db.simulation_cache[k];
      });
    }
    this.write(db);

    // Write to Supabase if connected
    if ((this.dbMode === 'supabase' || this.supabaseDb?.pool) && this.supabaseDb) {
      try {
        await this.supabaseDb.saveDailyLog(logData, userId);
      } catch (err) {
        console.error('[DB] Supabase saveDailyLog error:', err.message);
      }
    }
    // Write to MongoDB if connected
    else if (this.dbMode === 'mongodb' && this.isMongoConnected && MongooseHabit) {
      MongooseHabit.findOneAndUpdate(
        { user_id: userId, log_date: targetDate },
        record,
        { upsert: true }
      ).catch(err => console.error('[DB-Mongo] Error saving habit log:', err.message));
    }

    return record;
  }

  async saveBatchLogs(logsArray = [], userId = 'default_user') {
    if (!Array.isArray(logsArray) || logsArray.length === 0) return [];

    // Clean previous logs for this user
    const db = this.read();
    if (!db.habit_daily_logs) db.habit_daily_logs = [];
    db.habit_daily_logs = db.habit_daily_logs.filter(l => l.user_id !== userId);

    const formattedRecords = logsArray.map((item, idx) => {
      const targetDate = item.log_date || new Date(Date.now() - (logsArray.length - 1 - idx) * 86400000).toISOString().split('T')[0];
      return {
        id: item.id || Date.now() + idx,
        user_id: userId,
        log_date: targetDate,
        day_name: item.day_name || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx % 7],
        sleep: Number(item.sleep !== undefined ? item.sleep : 7.0),
        study: Number(item.study !== undefined ? item.study : 3.5),
        screen: Number(item.screen !== undefined ? item.screen : 4.5),
        exercise: Number(item.exercise !== undefined ? item.exercise : 1.0),
        spending: Number(item.spending !== undefined ? item.spending : 300),
        hydration: Number(item.hydration !== undefined ? item.hydration : 2.5),
        notes: item.notes || 'Batch Dataset Log',
        updated_at: new Date().toISOString()
      };
    });

    db.habit_daily_logs.push(...formattedRecords);

    // Invalidate simulation cache
    if (db.simulation_cache) {
      Object.keys(db.simulation_cache).forEach(k => {
        if (k.startsWith(userId)) delete db.simulation_cache[k];
      });
    }
    this.write(db);

    // Write to Supabase if connected
    if ((this.dbMode === 'supabase' || this.supabaseDb?.pool) && this.supabaseDb) {
      try {
        return await this.supabaseDb.saveBatchLogs(logsArray, userId);
      } catch (err) {
        console.error('[DB] Supabase saveBatchLogs error:', err.message);
      }
    }
    // Sync to MongoDB if connected
    else if (this.dbMode === 'mongodb' && this.isMongoConnected && MongooseHabit) {
      formattedRecords.forEach(rec => {
        MongooseHabit.findOneAndUpdate(
          { user_id: userId, log_date: rec.log_date },
          rec,
          { upsert: true }
        ).catch(err => console.error('[DB-Mongo] Batch upsert error:', err.message));
      });
    }

    return formattedRecords;
  }

  async clearAllLogs(userId = null) {
    if (this.dbMode === 'supabase' && this.supabaseDb?.isConnected) {
      try {
        await this.supabaseDb.clearAllLogs(userId);
      } catch (err) {
        console.error('[DB] Supabase clearAllLogs error:', err.message);
      }
    }
    if (this.dbMode === 'mongodb' && this.isMongoConnected && MongooseHabit) {
      try {
        if (userId) {
          await MongooseHabit.deleteMany({ user_id: userId });
        } else {
          await MongooseHabit.deleteMany({});
        }
      } catch (err) {
        console.error('[DB] MongoDB clearAllLogs error:', err.message);
      }
    }
    const db = this.read();
    if (userId) {
      db.habit_daily_logs = (db.habit_daily_logs || []).filter(l => l.user_id !== userId);
      if (db.simulation_cache) {
        Object.keys(db.simulation_cache).forEach(k => {
          if (k.startsWith(userId)) delete db.simulation_cache[k];
        });
      }
    } else {
      db.habit_daily_logs = [];
      db.simulation_cache = {};
    }
    this.write(db);
    return true;
  }

  // --- Simulation Cache Methods ---
  async getCachedLetter(scenarioType, userId = 'default_user') {
    const cacheKey = `${userId}_${scenarioType}`;

    // Try Supabase first
    if (this.dbMode === 'supabase' && this.supabaseDb?.isConnected) {
      try {
        return await this.supabaseDb.getCachedLetter(cacheKey, userId);
      } catch (err) {
        console.error('[DB] Supabase getCachedLetter error:', err.message);
      }
    }

    // Fallback to local JSON
    const db = this.read();
    return db.simulation_cache?.[cacheKey] || null;
  }

  async setCachedLetter(scenarioType, letterData, userId = 'default_user') {
    const cacheKey = `${userId}_${scenarioType}`;

    // Write to local JSON first
    const db = this.read();
    if (!db.simulation_cache) db.simulation_cache = {};
    db.simulation_cache[cacheKey] = letterData;
    this.write(db);

    // Write to Supabase if connected
    if ((this.dbMode === 'supabase' || this.supabaseDb?.pool) && this.supabaseDb) {
      try {
        await this.supabaseDb.setCachedLetter(cacheKey, letterData, userId);
      } catch (err) {
        console.error('[DB] Supabase setCachedLetter error:', err.message);
      }
    }
  }
}

export const db = new UnifiedDatabase();
