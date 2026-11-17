process.env.DB_PATH = ':memory:';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const { db } = await import('../server/db.js');
const { create, update, remove, list, quote } = await import('../server/resources.js');
const { dashboard } = await import('../server/dashboard.js');

const fails = (fn, status) => assert.throws(fn, (e) => e.status === status);
const t1 = create('room-types', { name: 'Superior', base_price: 1000000 }).id;
const r1 = create('rooms', { number: '01', room_type_id: t1 }).id;
const r2 = create('rooms', { number: '02', room_type_id: t1, price_override: 900000 }).id;
create('promos', { name: 'P', room_type_id: t1, price: 800000, start_date: '2026-11-01', end_date: '2026-11-30' });

test('quote: promo aktif, override, tanpa promo', () => {
  assert.equal(quote(r1, '2026-11-02', '2026-11-04').total, 1600000);
  assert.equal(quote(r1, '2026-12-02', '2026-12-04').total, 2000000);
  assert.equal(quote(r2, '2026-12-02', '2026-12-03').total, 900000);
});
test('validasi: tanggal, malam, FK, wajib', () => {
  fails(() => quote(r1, '2026-11-05', '2026-11-05'), 400);
  fails(() => create('rooms', { number: '9', room_type_id: 999 }), 400);
  fails(() => create('room-types', { base_price: 1 }), 400);
  fails(() => create('promos', { name: 'x', price: 1, start_date: '2026-02-30', end_date: '2026-03-01' }), 400);
});
test('unique + restrict', () => {
  fails(() => create('rooms', { number: '01', room_type_id: t1 }), 409);
  fails(() => remove('room-types', t1), 409);
  fails(() => remove('rooms', 12345), 404);
});
const b1 = create('bookings', { room_id: r1, guest_name: 'Tamu A', check_in: '2026-11-02', check_out: '2026-11-07' }).id;
test('booking: harga otomatis + promo, tamu auto-dibuat', () => {
  const b = list('bookings').find((x) => x.id === b1);
  assert.equal(b.price_total, 4000000); assert.ok(b.promo_id); assert.equal(b.guest_name, 'Tamu A');
});
test('booking: overlap ditolak, back-to-back boleh, cancelled bebas', () => {
  fails(() => create('bookings', { room_id: r1, guest_name: 'X', check_in: '2026-11-06', check_out: '2026-11-08' }), 409);
  create('bookings', { room_id: r1, guest_name: 'Y', check_in: '2026-11-07', check_out: '2026-11-08' });
  update('bookings', b1, { status: 'cancelled' });
  create('bookings', { room_id: r1, guest_name: 'Z', check_in: '2026-11-03', check_out: '2026-11-05' });
  update('bookings', b1, { status: 'booked', check_in: '2026-11-20', check_out: '2026-11-22' });
});
test('pembayaran: tidak boleh melebihi tagihan, hapus booking diblok', () => {
  create('transactions', { booking_id: b1, date: '2026-11-20', amount: 1000000 });
  fails(() => create('transactions', { booking_id: b1, date: '2026-11-20', amount: 999999999 }), 400);
  fails(() => remove('bookings', b1), 409);
  fails(() => update('bookings', b1, { price_total: 10 }), 400);
});
test('update parsial tidak menimpa field lain dengan NULL', () => {
  update('bookings', b1, { note: 'hi' });
  assert.equal(list('bookings').find((x) => x.id === b1).check_in, '2026-11-20');
});
test('dashboard: arus kas, balik modal, piutang', () => {
  const cat = (k, n) => db.prepare('SELECT id FROM categories WHERE kind=? AND name=?').get(k, n).id;
  create('transactions', { category_id: cat('capital', 'Bangunan'), date: '2026-01-01', amount: 10000000 });
  create('transactions', { category_id: cat('expense', 'Listrik'), date: '2026-11-05', amount: 300000 });
  const d = dashboard('2026-11-21');
  const nov = d.cashflow.find((m) => m.month === '2026-11');
  assert.equal(nov.income, 1000000); assert.equal(nov.expense, 300000);
  assert.equal(d.payback.capitalTotal, 10000000); assert.equal(d.payback.cumNet, 700000);
  assert.ok(d.receivable.total > 0);
});
