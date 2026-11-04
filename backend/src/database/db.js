const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "../../lazersp.db");

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  }
  return db;
}

function initDb() {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS places (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      address TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT NOT NULL,
      rating REAL NOT NULL DEFAULT 0,
      opening_hours TEXT NOT NULL,
      price_level TEXT NOT NULL,
      highlight TEXT NOT NULL,
      is_open INTEGER NOT NULL DEFAULT 1,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS data_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      google_sub TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      avatar_url TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      last_login_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_favorites (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      place_id INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, place_id)
    );

    CREATE TABLE IF NOT EXISTS user_visits (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      place_id INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
      rating INTEGER CHECK (rating BETWEEN 1 AND 5),
      note TEXT NOT NULL DEFAULT '',
      visited_at TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      PRIMARY KEY (user_id, place_id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      place_id INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE (user_id, place_id)
    );

    CREATE INDEX IF NOT EXISTS idx_reviews_place_status ON reviews (place_id, status);

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      place_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
    );
  `);

  // Migrations: add new columns if they don't exist yet
  const migrations = [
    "ALTER TABLE places ADD COLUMN website TEXT",
    "ALTER TABLE places ADD COLUMN phone TEXT",
    "ALTER TABLE places ADD COLUMN photos TEXT",
    "ALTER TABLE places ADD COLUMN updated_at TEXT DEFAULT (datetime('now'))",
    "ALTER TABLE places ADD COLUMN instagram TEXT",
  ];

  for (const migration of migrations) {
    try {
      database.exec(migration);
    } catch (_) {
      // Column already exists — safe to ignore
    }
  }

  return database;
}

module.exports = { getDb, initDb };
