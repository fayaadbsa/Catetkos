import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, copyFileSync } from 'node:fs';
import { dirname } from 'node:path';

const path = process.env.DB_PATH || 'data/catetkos.db';
if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
export const db = new DatabaseSync(path);
db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');

// Migrasi berurutan, versi di PRAGMA user_version. Tambah migrasi baru di akhir array, jangan edit yang lama.
const MIGRATIONS = [
  // v1: skema baru (ERD v2). users/sessions dipertahankan, tabel bisnis lama dibuang.
  `
  CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, username TEXT UNIQUE NOT NULL, hash TEXT NOT NULL, salt TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL);

  CREATE TABLE room_types(
    id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE,
    base_price INTEGER NOT NULL CHECK(base_price >= 0),
    capacity INTEGER NOT NULL DEFAULT 1 CHECK(capacity >= 1),
    archived INTEGER NOT NULL DEFAULT 0);
  CREATE TABLE rooms(
    id INTEGER PRIMARY KEY, number TEXT NOT NULL UNIQUE,
    room_type_id INTEGER NOT NULL REFERENCES room_types(id) ON DELETE RESTRICT,
    price_override INTEGER CHECK(price_override IS NULL OR price_override >= 0),
    archived INTEGER NOT NULL DEFAULT 0);
  CREATE TABLE promos(
    id INTEGER PRIMARY KEY, name TEXT NOT NULL,
    room_type_id INTEGER REFERENCES room_types(id) ON DELETE CASCADE, -- NULL = semua tipe
    price INTEGER NOT NULL CHECK(price >= 0),
    start_date TEXT NOT NULL, end_date TEXT NOT NULL, CHECK(end_date >= start_date));
  CREATE TABLE guests(id INTEGER PRIMARY KEY, name TEXT NOT NULL, phone TEXT, note TEXT);
  CREATE TABLE bookings(
    id INTEGER PRIMARY KEY,
    room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
    guest_id INTEGER NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
    promo_id INTEGER REFERENCES promos(id) ON DELETE SET NULL,
    check_in TEXT NOT NULL, check_out TEXT NOT NULL,
    price_total INTEGER NOT NULL CHECK(price_total >= 0),
    status TEXT NOT NULL DEFAULT 'booked' CHECK(status IN ('booked','checked_in','checked_out','cancelled')),
    note TEXT, CHECK(check_out > check_in));
  CREATE INDEX idx_bookings_room ON bookings(room_id, check_in);

  -- Arus kas satu ledger: income (sewa/lainnya), expense (operasional), capital (modal/investasi).
  CREATE TABLE categories(
    id INTEGER PRIMARY KEY, kind TEXT NOT NULL CHECK(kind IN ('income','expense','capital')),
    name TEXT NOT NULL, UNIQUE(kind, name));
  CREATE TABLE transactions(
    id INTEGER PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE RESTRICT, -- diisi kalau pembayaran booking
    room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,       -- biaya/pemasukan per kamar (opsional)
    date TEXT NOT NULL, amount INTEGER NOT NULL CHECK(amount > 0), method TEXT, note TEXT);
  CREATE INDEX idx_tx_date ON transactions(date);
  CREATE INDEX idx_tx_booking ON transactions(booking_id);

  INSERT INTO categories(kind,name) VALUES
    ('income','Sewa kamar'),('income','Lainnya'),
    ('expense','Listrik'),('expense','Air'),('expense','Internet'),('expense','Kebersihan'),('expense','Perawatan'),('expense','Gaji'),('expense','Lainnya'),
    ('capital','Bangunan'),('capital','Furnitur'),('capital','Elektronik'),('capital','Lainnya');
  `,
];

const ver = db.prepare('PRAGMA user_version').get().user_version;
if (ver < MIGRATIONS.length) {
  if (ver === 0) {
    const legacy = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='rooms'").get();
    if (legacy && path !== ':memory:') {
      db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
      copyFileSync(path, `${path}.pre-v1.bak`); // backup skema lama sebelum dibuang
    }
    db.exec('DROP TABLE IF EXISTS bookings; DROP TABLE IF EXISTS expenses; DROP TABLE IF EXISTS capital; DROP TABLE IF EXISTS rooms;');
  }
  for (let i = ver; i < MIGRATIONS.length; i++) {
    db.exec('BEGIN');
    try { db.exec(MIGRATIONS[i]); db.exec(`PRAGMA user_version = ${i + 1}`); db.exec('COMMIT'); }
    catch (e) { db.exec('ROLLBACK'); throw e; }
  }
}
