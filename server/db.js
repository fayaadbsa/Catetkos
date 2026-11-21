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
  // v2: booking per bulan + deposit (uang titipan, bukan omzet, jadi di luar transactions).
  `
  ALTER TABLE bookings ADD COLUMN deposit INTEGER NOT NULL DEFAULT 0 CHECK(deposit >= 0);
  ALTER TABLE bookings ADD COLUMN deposit_paid_date TEXT;
  ALTER TABLE bookings ADD COLUMN deposit_returned_date TEXT;
  `,
  // v3: multi-kos. Satu akun bisa akses banyak kos, satu kos bisa dipakai banyak akun (memberships).
  // Semua tabel bisnis dapat kos_id. Data lama masuk kos #1, semua akun lama jadi anggotanya.
  // Tabel dengan UNIQUE dibangun ulang (SQLite tak bisa ubah constraint) jadi unik per kos.
  `--nofk
  CREATE TABLE kos(id INTEGER PRIMARY KEY, name TEXT NOT NULL);
  CREATE TABLE memberships(
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kos_id INTEGER NOT NULL REFERENCES kos(id) ON DELETE CASCADE, PRIMARY KEY(user_id, kos_id));
  CREATE INDEX idx_mem_kos ON memberships(kos_id);
  INSERT INTO kos(id,name) VALUES(1,'Kos utama');
  INSERT INTO memberships(user_id,kos_id) SELECT id,1 FROM users;

  CREATE TABLE room_types_n(
    id INTEGER PRIMARY KEY, kos_id INTEGER NOT NULL REFERENCES kos(id) ON DELETE CASCADE, name TEXT NOT NULL,
    base_price INTEGER NOT NULL CHECK(base_price >= 0), capacity INTEGER NOT NULL DEFAULT 1 CHECK(capacity >= 1),
    archived INTEGER NOT NULL DEFAULT 0, UNIQUE(kos_id, name));
  INSERT INTO room_types_n(id,kos_id,name,base_price,capacity,archived) SELECT id,1,name,base_price,capacity,archived FROM room_types;
  DROP TABLE room_types; ALTER TABLE room_types_n RENAME TO room_types;

  CREATE TABLE rooms_n(
    id INTEGER PRIMARY KEY, kos_id INTEGER NOT NULL REFERENCES kos(id) ON DELETE CASCADE, number TEXT NOT NULL,
    room_type_id INTEGER NOT NULL REFERENCES room_types(id) ON DELETE RESTRICT,
    price_override INTEGER CHECK(price_override IS NULL OR price_override >= 0),
    archived INTEGER NOT NULL DEFAULT 0, UNIQUE(kos_id, number));
  INSERT INTO rooms_n(id,kos_id,number,room_type_id,price_override,archived) SELECT id,1,number,room_type_id,price_override,archived FROM rooms;
  DROP TABLE rooms; ALTER TABLE rooms_n RENAME TO rooms;

  CREATE TABLE categories_n(
    id INTEGER PRIMARY KEY, kos_id INTEGER NOT NULL REFERENCES kos(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK(kind IN ('income','expense','capital')), name TEXT NOT NULL, UNIQUE(kos_id, kind, name));
  INSERT INTO categories_n(id,kos_id,kind,name) SELECT id,1,kind,name FROM categories;
  DROP TABLE categories; ALTER TABLE categories_n RENAME TO categories;

  ALTER TABLE promos ADD COLUMN kos_id INTEGER NOT NULL DEFAULT 1 REFERENCES kos(id) ON DELETE CASCADE;
  ALTER TABLE guests ADD COLUMN kos_id INTEGER NOT NULL DEFAULT 1 REFERENCES kos(id) ON DELETE CASCADE;
  ALTER TABLE bookings ADD COLUMN kos_id INTEGER NOT NULL DEFAULT 1 REFERENCES kos(id) ON DELETE CASCADE;
  ALTER TABLE transactions ADD COLUMN kos_id INTEGER NOT NULL DEFAULT 1 REFERENCES kos(id) ON DELETE CASCADE;
  CREATE INDEX idx_rooms_kos ON rooms(kos_id); CREATE INDEX idx_bookings_kos ON bookings(kos_id); CREATE INDEX idx_tx_kos ON transactions(kos_id, date);
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
  if (ver >= 2 && ver < 3 && path !== ':memory:') { db.exec('PRAGMA wal_checkpoint(TRUNCATE)'); copyFileSync(path, `${path}.pre-v3.bak`); }
  for (let i = ver; i < MIGRATIONS.length; i++) {
    const noFk = MIGRATIONS[i].startsWith('--nofk'); // rebuild tabel: FK harus mati di luar transaksi
    if (noFk) db.exec('PRAGMA foreign_keys=OFF');
    db.exec('BEGIN');
    try {
      db.exec(MIGRATIONS[i]);
      if (noFk && db.prepare('PRAGMA foreign_key_check').all().length) throw new Error('foreign_key_check gagal setelah migrasi');
      db.exec(`PRAGMA user_version = ${i + 1}`); db.exec('COMMIT');
    } catch (e) { db.exec('ROLLBACK'); throw e; } finally { if (noFk) db.exec('PRAGMA foreign_keys=ON'); }
  }
}

const DEFAULT_CATS = [['income', 'Sewa kamar'], ['income', 'Lainnya'], ['expense', 'Listrik'], ['expense', 'Air'], ['expense', 'Internet'], ['expense', 'Kebersihan'], ['expense', 'Perawatan'], ['expense', 'Gaji'], ['expense', 'Lainnya'], ['capital', 'Bangunan'], ['capital', 'Furnitur'], ['capital', 'Elektronik'], ['capital', 'Lainnya']];
// Kos baru + kategori bawaan + pembuatnya langsung jadi anggota (userId opsional buat skrip/seed).
export function createKos(name, userId = null) {
  db.exec('BEGIN');
  try {
    const id = Number(db.prepare('INSERT INTO kos(name) VALUES(?)').run(name).lastInsertRowid);
    const c = db.prepare('INSERT INTO categories(kos_id,kind,name) VALUES(?,?,?)');
    for (const [k, n] of DEFAULT_CATS) c.run(id, k, n);
    if (userId) db.prepare('INSERT INTO memberships VALUES(?,?)').run(userId, id);
    db.exec('COMMIT');
    return id;
  } catch (e) { db.exec('ROLLBACK'); throw e; }
}
export const myKos = (userId) => db.prepare('SELECT k.id, k.name FROM kos k JOIN memberships m ON m.kos_id=k.id WHERE m.user_id=? ORDER BY k.name').all(userId);
export const isMember = (userId, kosId) => !!db.prepare('SELECT 1 FROM memberships WHERE user_id=? AND kos_id=?').get(userId, kosId);
export function addMember(kosId, username) {
  const u = db.prepare('SELECT id FROM users WHERE username=?').get(username);
  if (!u) return false;
  db.prepare('INSERT OR IGNORE INTO memberships VALUES(?,?)').run(u.id, kosId);
  return true;
}
export const members = (kosId) => db.prepare('SELECT u.id, u.username FROM users u JOIN memberships m ON m.user_id=u.id WHERE m.kos_id=? ORDER BY u.username').all(kosId);
export function removeMember(kosId, userId) {
  if (members(kosId).length <= 1) return false; // kos tanpa anggota = data yatim
  db.prepare('DELETE FROM memberships WHERE kos_id=? AND user_id=?').run(kosId, userId);
  return true;
}
