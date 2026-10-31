import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let dbInstance: Database.Database | null = null;

export function getDatabasePath(): string {
  const customPath = process.env.DB_PATH;
  if (customPath) {
    return path.resolve(customPath);
  }
  return path.resolve(process.cwd(), 'data', 'ruralclass.db');
}

export function initDatabase(dbPath?: string): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const resolvedPath = dbPath || getDatabasePath();
  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(resolvedPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  dbInstance = db;
  return db;
}

export function getDb(): Database.Database {
  if (!dbInstance) {
    return initDatabase();
  }
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

