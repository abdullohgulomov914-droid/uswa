import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || process.env.RAILWAY_VOLUME_MOUNT_PATH 
  ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH || '', 'app.db')
  : path.join(__dirname, '../../data/app.db');

export const db = new Database(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON');

// Initialize tables
export function initDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT,
      telegram_id TEXT UNIQUE,
      telegram_username TEXT,
      telegram_photo_url TEXT,
      display_name TEXT,
      streak_days INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      last_relapse_date TEXT,
      start_date TEXT NOT NULL,
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      is_admin INTEGER DEFAULT 0,
      is_banned INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Journal entries (STAR+ triggers)
  db.exec(`
    CREATE TABLE IF NOT EXISTS journal_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('trigger', 'tackle', 'account', 'reward')),
      title TEXT,
      content TEXT NOT NULL,
      trigger_time TEXT,
      trigger_location TEXT,
      trigger_feeling TEXT,
      is_resolved BOOLEAN DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Relapse log
  db.exec(`
    CREATE TABLE IF NOT EXISTS relapses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      trigger TEXT NOT NULL,
      notes TEXT,
      mood TEXT,
      logged_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Emergency sessions (urge surfing)
  db.exec(`
    CREATE TABLE IF NOT EXISTS emergency_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      duration_seconds INTEGER,
      was_successful BOOLEAN,
      technique_used TEXT DEFAULT '4-7-8 breathing',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Community posts
  db.exec(`
    CREATE TABLE IF NOT EXISTS community_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      is_anonymous BOOLEAN DEFAULT 1,
      likes INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // XP/Achievement log
  db.exec(`
    CREATE TABLE IF NOT EXISTS xp_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      reason TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Admin activity log
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      target_user_id INTEGER,
      details TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Telegram sessions for mini app
  db.exec(`
    CREATE TABLE IF NOT EXISTS telegram_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      telegram_id TEXT NOT NULL,
      auth_date INTEGER NOT NULL,
      hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  console.log('✅ Database initialized');
}
