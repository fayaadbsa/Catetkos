// Layer data: definisi entity, validasi, aturan bisnis. Tanpa HTTP, jadi gampang dites.
import { db } from './db.js';

export class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
const bad = (m) => { throw new HttpError(400, m); };
const conflict = (m) => { throw new HttpError(409, m); };

const validDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(s + 'T00:00:00Z').toISOString().slice(0, 10) === s;
export const diffDays = (a, b) => Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 86400000);
const one = (sql, ...p) => db.prepare(sql).get(...p);
const rp = (n) => 'Rp ' + n.toLocaleString('id-ID');

const text = (label, o = {}) => ({ type: 'text', label, ...o });
const int = (label, o = {}) => ({ type: 'int', label, ...o });
const date = (label, o = {}) => ({ type: 'date', label, ...o });
const ref = (label, table, o = {}) => ({ type: 'ref', label, table, ...o });
const bool = (label) => ({ type: 'bool', label, def: 0 });

// Harga booking: promo aktif pada tanggal check-in (per tipe atau semua tipe) else harga kamar. Dikalikan jumlah malam.
// ponytail: promo dinilai di tanggal check-in saja. Kalau mau promo per malam, hitung per hari.
export function quote(roomId, checkIn, checkOut) {
  if (!validDate(String(checkIn)) || !validDate(String(checkOut))) bad('Tanggal tidak valid');
  const nights = diffDays(checkIn, checkOut);
  if (nights <= 0) bad('Check-out harus setelah check-in');
  const room = one('SELECT r.id, r.room_type_id, COALESCE(r.price_override, t.base_price) price FROM rooms r JOIN room_types t ON t.id=r.room_type_id WHERE r.id=?', roomId);
  if (!room) bad('Kamar tidak ditemukan');
  const promo = one('SELECT id, name, price FROM promos WHERE (room_type_id IS NULL OR room_type_id=?) AND ? BETWEEN start_date AND end_date ORDER BY price LIMIT 1', room.room_type_id, checkIn);
  const rate = promo ? promo.price : room.price;
  return { nights, rate, normal_rate: room.price, promo_id: promo?.id ?? null, promo_name: promo?.name ?? null, total: rate * nights };
}

const paidOf = (bookingId, exceptTx = null) => one('SELECT COALESCE(SUM(amount),0) s FROM transactions WHERE booking_id=? AND id IS NOT ?', bookingId, exceptTx).s;

const R = {
  'room-types': {
    table: 'room_types', inUse: 'Tipe masih dipakai kamar. Arsipkan saja.',
    fields: { name: text('Nama tipe', { req: 1 }), base_price: int('Harga dasar', { req: 1, min: 0 }), capacity: int('Kapasitas', { min: 1, def: 1 }), archived: bool('Arsip') },
    list: 'SELECT t.*, (SELECT COUNT(*) FROM rooms r WHERE r.room_type_id=t.id AND r.archived=0) room_count FROM room_types t ORDER BY t.name',
  },
  rooms: {
    table: 'rooms', inUse: 'Kamar punya booking. Arsipkan saja.',
    fields: { number: text('No kamar', { req: 1 }), room_type_id: ref('Tipe', 'room_types', { req: 1 }), price_override: int('Harga khusus', { min: 0 }), archived: bool('Arsip') },
    list: 'SELECT r.*, t.name type_name, COALESCE(r.price_override, t.base_price) price FROM rooms r JOIN room_types t ON t.id=r.room_type_id ORDER BY r.number',
  },
  promos: {
    table: 'promos',
    fields: { name: text('Nama promo', { req: 1 }), room_type_id: ref('Tipe', 'room_types'), price: int('Harga promo', { req: 1, min: 0 }), start_date: date('Mulai', { req: 1 }), end_date: date('Sampai', { req: 1 }) },
    check: (v) => { if (v.end_date < v.start_date) bad('Tanggal akhir sebelum tanggal mulai'); },
    list: 'SELECT p.*, t.name type_name FROM promos p LEFT JOIN room_types t ON t.id=p.room_type_id ORDER BY p.start_date DESC',
  },
  guests: {
    table: 'guests', inUse: 'Tamu punya booking.',
    fields: { name: text('Nama', { req: 1 }), phone: text('HP'), note: text('Catatan') },
    list: 'SELECT g.*, (SELECT COUNT(*) FROM bookings b WHERE b.guest_id=g.id) booking_count FROM guests g ORDER BY g.name',
  },
  categories: {
    table: 'categories', inUse: 'Kategori sudah dipakai transaksi.',
    fields: { kind: { type: 'enum', label: 'Jenis', req: 1, of: ['income', 'expense', 'capital'] }, name: text('Nama', { req: 1 }) },
    list: 'SELECT c.*, (SELECT COUNT(*) FROM transactions t WHERE t.category_id=c.id) uses FROM categories c ORDER BY c.kind, c.name',
  },
  bookings: {
    table: 'bookings', inUse: 'Booking punya pembayaran. Hapus pembayarannya dulu.',
    fields: {
      room_id: ref('Kamar', 'rooms', { req: 1 }), guest_id: ref('Tamu', 'guests', { req: 1 }), promo_id: ref('Promo', 'promos'),
      check_in: date('Check-in', { req: 1 }), check_out: date('Check-out', { req: 1 }), price_total: int('Total harga', { min: 0 }),
      status: { type: 'enum', label: 'Status', of: ['booked', 'checked_in', 'checked_out', 'cancelled'], def: 'booked' }, note: text('Catatan'),
    },
    // Tamu baru bisa diketik langsung (guest_name) tanpa buka halaman Tamu.
    pre: (b) => {
      if (!b.guest_id && String(b.guest_name || '').trim()) b.guest_id = Number(db.prepare('INSERT INTO guests(name) VALUES(?)').run(b.guest_name.trim()).lastInsertRowid);
    },
    check: (v, id) => {
      if (v.check_out <= v.check_in) bad('Check-out harus setelah check-in');
      const room = one('SELECT archived FROM rooms WHERE id=?', v.room_id);
      if (room.archived && !id) bad('Kamar sudah diarsipkan');
      if (v.status !== 'cancelled' && one("SELECT 1 FROM bookings WHERE room_id=? AND status!='cancelled' AND id IS NOT ? AND check_in<? AND check_out>?", v.room_id, id ?? null, v.check_out, v.check_in)) conflict('Kamar bentrok dengan booking lain di tanggal itu');
      const q = quote(v.room_id, v.check_in, v.check_out);
      if (v.price_total === null) { v.price_total = q.total; v.promo_id = q.promo_id; }
      else v.promo_id = v.price_total === q.total ? q.promo_id : null; // harga manual = bukan promo
      if (id && v.price_total < paidOf(id)) bad('Total harga lebih kecil dari yang sudah dibayar');
    },
    list: `SELECT b.*, r.number room_number, g.name guest_name, g.phone guest_phone,
      COALESCE((SELECT SUM(amount) FROM transactions t WHERE t.booking_id=b.id),0) paid
      FROM bookings b JOIN rooms r ON r.id=b.room_id JOIN guests g ON g.id=b.guest_id ORDER BY b.check_in DESC, b.id DESC`,
  },
  transactions: {
    table: 'transactions',
    fields: {
      category_id: ref('Kategori', 'categories', { req: 1 }), booking_id: ref('Booking', 'bookings'), room_id: ref('Kamar', 'rooms'),
      date: date('Tanggal', { req: 1 }), amount: int('Nominal', { req: 1, min: 1 }), method: text('Metode'), note: text('Catatan'),
    },
    // Bayar booking tanpa kategori = otomatis "Sewa kamar".
    pre: (b) => { if (b.booking_id && !b.category_id) b.category_id = one("SELECT id FROM categories WHERE kind='income' AND name='Sewa kamar'")?.id; },
    check: (v, id) => {
      const cat = one('SELECT kind FROM categories WHERE id=?', v.category_id);
      if (!v.booking_id) return;
      if (cat.kind !== 'income') bad('Pembayaran booking harus kategori pemasukan');
      const b = one('SELECT price_total FROM bookings WHERE id=?', v.booking_id);
      const left = b.price_total - paidOf(v.booking_id, id ?? null);
      if (v.amount > left) bad(`Melebihi tagihan booking. Sisa ${rp(left)}`);
    },
    list: `SELECT t.*, c.kind, c.name category, r.number room_number, g.name guest_name
      FROM transactions t JOIN categories c ON c.id=t.category_id LEFT JOIN rooms r ON r.id=t.room_id
      LEFT JOIN bookings b ON b.id=t.booking_id LEFT JOIN guests g ON g.id=b.guest_id`,
    filter: (q) => (['income', 'expense', 'capital'].includes(q.kind) ? [' WHERE c.kind=?', [q.kind]] : ['', []]),
    order: ' ORDER BY t.date DESC, t.id DESC',
  },
};
export const isResource = (n) => Object.hasOwn(R, n);

function clean(def, body, cur = {}) {
  const out = {};
  for (const [k, f] of Object.entries(def.fields)) {
    let v = body[k] !== undefined ? body[k] : k in cur ? cur[k] : f.def ?? null;
    if (v === '') v = null;
    if (v === null) { if (f.req) bad(`${f.label} wajib diisi`); out[k] = null; continue; }
    if (f.type === 'text') { v = String(v).trim(); if (!v && f.req) bad(`${f.label} wajib diisi`); out[k] = v || null; }
    else if (f.type === 'int') { v = Number(v); if (!Number.isInteger(v) || v < (f.min ?? -Infinity)) bad(`${f.label} harus angka bulat${f.min !== undefined ? ` >= ${f.min}` : ''}`); out[k] = v; }
    else if (f.type === 'bool') out[k] = v ? 1 : 0;
    else if (f.type === 'date') { if (!validDate(String(v))) bad(`${f.label} harus tanggal YYYY-MM-DD`); out[k] = v; }
    else if (f.type === 'enum') { if (!f.of.includes(v)) bad(`${f.label} harus salah satu: ${f.of.join(', ')}`); out[k] = v; }
    else if (f.type === 'ref') { v = Number(v); if (!one(`SELECT 1 FROM ${f.table} WHERE id=?`, v)) bad(`${f.label} tidak ditemukan`); out[k] = v; }
  }
  return out;
}

// Satu transaksi DB + terjemah error constraint SQLite ke pesan yang manusiawi.
function guard(def, fn) {
  db.exec('BEGIN');
  try { const r = fn(); db.exec('COMMIT'); return r; }
  catch (e) {
    db.exec('ROLLBACK');
    if (e instanceof HttpError) throw e;
    if (/UNIQUE constraint/.test(e.message)) conflict('Data dengan nama/nomor itu sudah ada');
    if (/FOREIGN KEY constraint/.test(e.message)) conflict(def.inUse || 'Masih dipakai data lain');
    if (/CHECK constraint/.test(e.message)) bad('Data tidak lolos validasi');
    throw e;
  }
}

export function list(name, q = {}) {
  const d = R[name];
  const [where, params] = d.filter ? d.filter(q) : ['', []];
  return db.prepare(d.list + where + (d.order || '')).all(...params);
}

export function create(name, body) {
  const d = R[name];
  return guard(d, () => {
    d.pre?.(body);
    const v = clean(d, body);
    d.check?.(v);
    const cols = Object.keys(v);
    const r = db.prepare(`INSERT INTO ${d.table}(${cols.join(',')}) VALUES(${cols.map(() => '?').join(',')})`).run(...Object.values(v));
    return { id: Number(r.lastInsertRowid) };
  });
}

// Update = merge dengan baris lama, jadi field yang nggak dikirim nggak ketimpa NULL.
export function update(name, id, body) {
  const d = R[name];
  return guard(d, () => {
    const cur = one(`SELECT * FROM ${d.table} WHERE id=?`, id);
    if (!cur) throw new HttpError(404, 'Data tidak ada');
    d.pre?.(body);
    const v = clean(d, body, cur);
    d.check?.(v, id);
    db.prepare(`UPDATE ${d.table} SET ${Object.keys(v).map((c) => c + '=?').join(',')} WHERE id=?`).run(...Object.values(v), id);
    return { ok: true };
  });
}

export function remove(name, id) {
  const d = R[name];
  return guard(d, () => {
    if (!db.prepare(`DELETE FROM ${d.table} WHERE id=?`).run(id).changes) throw new HttpError(404, 'Data tidak ada');
    return { ok: true };
  });
}
