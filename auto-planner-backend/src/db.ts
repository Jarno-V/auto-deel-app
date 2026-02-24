import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATABASE_PATH = process.env.DATABASE_PATH || process.env.DB_PATH || (process.env.NODE_ENV === 'production' ? '/app/data/database.sqlite' : './data/database.sqlite');

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    const dir = path.dirname(DATABASE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(DATABASE_PATH);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

export function initDatabase(): void {
  const db = getDatabase();

  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      user TEXT NOT NULL CHECK(user IN ('Jarno', 'Sven')),
      date TEXT NOT NULL,
      end_location TEXT NOT NULL CHECK(end_location IN ('Zwolle', 'Ede', 'Anders')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date)
  `);

  console.log('Database initialized successfully');
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
