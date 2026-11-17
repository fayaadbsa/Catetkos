// Usage: npm run seed. Isi data contoh dari seed/example/seed.json ke DB (hapus data bisnis lama, akun dipertahankan).
import { readFileSync } from 'node:fs';
import { db } from '../server/db.js';
import { create } from '../server/resources.js';

const f = process.argv[2] || 'seed/example/seed.json';
const s = JSON.parse(readFileSync(f, 'utf8'));
db.exec('DELETE FROM transactions; DELETE FROM bookings; DELETE FROM guests; DELETE FROM promos; DELETE FROM rooms; DELETE FROM room_types;');
const id = (t, k, v) => db.prepare(`SELECT id FROM ${t} WHERE ${k}=?`).get(v).id;
for (const t of s.room_types) create('room-types', t);
for (const r of s.rooms) create('rooms', { number: r.number, room_type_id: id('room_types', 'name', r.type), price_override: r.price_override });
for (const p of s.promos) create('promos', { ...p, room_type_id: p.type ? id('room_types', 'name', p.type) : null });
for (const b of s.bookings) {
  const { id: bid } = create('bookings', { room_id: id('rooms', 'number', b.room), guest_name: b.guest, check_in: b.check_in, check_out: b.check_out, status: b.status });
  if (b.paid) create('transactions', { booking_id: bid, date: b.paid_at || b.check_in, amount: b.paid === true ? db.prepare('SELECT price_total p FROM bookings WHERE id=?').get(bid).p : b.paid });
}
const cat = (kind, name) => db.prepare('SELECT id FROM categories WHERE kind=? AND name=?').get(kind, name).id;
for (const t of s.transactions) create('transactions', { category_id: cat(t.kind, t.category), date: t.date, amount: t.amount, note: t.note });
console.log(`Seed selesai: ${s.rooms.length} kamar, ${s.bookings.length} booking.`);
