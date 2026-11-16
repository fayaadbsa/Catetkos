import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
mkdirSync('data', { recursive: true });
export const db = new DatabaseSync(process.env.DB_PATH || 'data/catetkos.db');
db.exec(`
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, username TEXT UNIQUE NOT NULL, hash TEXT NOT NULL, salt TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id INTEGER NOT NULL, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS rooms(id INTEGER PRIMARY KEY, number TEXT NOT NULL, type TEXT NOT NULL, price INTEGER NOT NULL, promo_price INTEGER, promo_start TEXT, promo_end TEXT);
CREATE TABLE IF NOT EXISTS bookings(id INTEGER PRIMARY KEY, room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE, guest TEXT NOT NULL, check_in TEXT NOT NULL, nights INTEGER NOT NULL, price INTEGER NOT NULL, is_promo INTEGER NOT NULL DEFAULT 0, paid INTEGER NOT NULL DEFAULT 0, note TEXT);
CREATE TABLE IF NOT EXISTS expenses(id INTEGER PRIMARY KEY, date TEXT NOT NULL, category TEXT NOT NULL, amount INTEGER NOT NULL, note TEXT);
CREATE TABLE IF NOT EXISTS capital(id INTEGER PRIMARY KEY, date TEXT NOT NULL, item TEXT NOT NULL, type TEXT, amount INTEGER NOT NULL, note TEXT);
`);
