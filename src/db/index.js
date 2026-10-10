import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';

fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });

export const db = new Database(config.dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    email             TEXT NOT NULL UNIQUE COLLATE NOCASE,
    username          TEXT COLLATE NOCASE,
    password_hash     TEXT NOT NULL,
    role              TEXT NOT NULL CHECK (role IN ('admin', 'editor')),
    terms_accepted_at TEXT,
    terms_version     TEXT,
    created_at        TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS posts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT NOT NULL,
    slug       TEXT NOT NULL UNIQUE,
    content    TEXT NOT NULL DEFAULT '',
    status     TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    author_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_posts_status_created ON posts(status, created_at DESC);
`);

/* ---- Migración para bases creadas con la versión anterior (sin username ni términos) ---- */
const userCols = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name);
for (const [col, def] of [
  ['username', 'TEXT COLLATE NOCASE'],
  ['terms_accepted_at', 'TEXT'],
  ['terms_version', 'TEXT'],
]) {
  if (!userCols.includes(col)) db.exec(`ALTER TABLE users ADD COLUMN ${col} ${def}`);
}

// Usuarios viejos sin username: se deriva del email (parte antes de la @), único.
const sinUsername = db.prepare('SELECT id, email FROM users WHERE username IS NULL').all();
const ocupado = db.prepare('SELECT 1 FROM users WHERE username = ?');
const asignar = db.prepare('UPDATE users SET username = ? WHERE id = ?');
for (const u of sinUsername) {
  const base = (u.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 24) || 'user').padEnd(3, '_');
  asignar.run(ocupado.get(base) ? `${base}_${u.id}` : base, u.id);
}

db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)');
