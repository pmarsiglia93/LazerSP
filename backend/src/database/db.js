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
