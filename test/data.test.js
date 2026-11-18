process.env.DB_PATH = ':memory:';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const { db } = await import('../server/db.js');
const { create, createBatch, payBooking, update, remove, list, quote, quoteMonths, addMonths } = await import('../server/resources.js');
const { dashboard } = await import('../server/dashboard.js');

const fails = (fn, status) => assert.throws(fn, (e) => e.status === status);
const t1 = create('room-types', { name: 'Superior', base_price: 1000000 }).id;
const r1 = create('rooms', { number: '01', room_type_id: t1 }).id;
const r2 = create('rooms', { number: '02', room_type_id: t1, price_override: 900000 }).id;
create('promos', { name: 'P', room_type_id: t1, price: 800000, start_date: '2026-11-01', end_date: '2026-11-30' });

test('quote: promo aktif, override, tanpa promo', () => {
  assert.equal(quote(r1, '2026-11-02').total, 800000);
  assert.equal(quote(r1, '2026-12-02').total, 1000000);
  assert.equal(quote(r1, '2027-01-02').total, 1000000);
  assert.equal(quote(r2, '2026-12-02').total, 900000);
});
test('validasi: tanggal, malam, FK, wajib', () => {
  fails(() => quote(r1, '2026-02-30'), 400);
  fails(() => create('rooms', { number: '9', room_type_id: 999 }), 400);
  fails(() => create('room-types', { base_price: 1 }), 400);
  fails(() => create('promos', { name: 'x', price: 1, start_date: '2026-02-30', end_date: '2026-03-01' }), 400);
});
test('unique + restrict', () => {
  fails(() => create('rooms', { number: '01', room_type_id: t1 }), 409);
  fails(() => remove('room-types', t1), 409);
  fails(() => remove('rooms', 12345), 404);
});
const b1 = create('bookings', { room_id: r1, guest_name: 'Tamu A', check_in: '2026-11-02', check_out: '2026-11-07' }).id; // check_out manual masih boleh
test('booking: harga otomatis + promo, tamu auto-dibuat', () => {
  const b = list('bookings').find((x) => x.id === b1);
  assert.equal(b.price_total, 800000); assert.ok(b.promo_id); assert.equal(b.guest_name, 'Tamu A');
});
test('booking: overlap ditolak, back-to-back boleh, cancelled bebas', () => {
  fails(() => create('bookings', { room_id: r1, guest_name: 'X', check_in: '2026-11-06', check_out: '2026-11-08' }), 409);
  create('bookings', { room_id: r1, guest_name: 'Y', check_in: '2026-11-07', check_out: '2026-11-08' });
  update('bookings', b1, { status: 'cancelled' });
  create('bookings', { room_id: r1, guest_name: 'Z', check_in: '2026-11-03', check_out: '2026-11-05' });
  update('bookings', b1, { status: 'booked', check_in: '2026-11-20', check_out: '2026-11-22' });
});
test('pembayaran: tidak boleh melebihi tagihan, hapus booking diblok', () => {
  create('transactions', { booking_id: b1, date: '2026-11-20', amount: 500000 });
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
  assert.equal(nov.income, 500000); assert.equal(nov.expense, 300000);
  assert.equal(d.payback.capitalTotal, 10000000); assert.equal(d.payback.cumNet, 200000);
  assert.ok(d.receivable.total > 0);
});

test('create: field bool/default dikirim null (form UI) pakai default, bukan error', () => {
  const id = create('room-types', { name: 'Null-safe', base_price: 500000, capacity: null, archived: null }).id;
  const row = list('room-types').find((t) => t.id === id);
  assert.equal(row.archived, 0); assert.equal(row.capacity, 1);
});

test('addMonths: clamp akhir bulan, lintas tahun', () => {
  assert.equal(addMonths('2026-01-31', 1), '2026-02-28');
  assert.equal(addMonths('2026-11-15', 2), '2027-01-15');
  assert.equal(addMonths('2028-01-31', 1), '2028-02-29');
});
const t2 = create('room-types', { name: 'Batch', base_price: 1200000 }).id;
const r3 = create('rooms', { number: 'B1', room_type_id: t2 }).id;
test('batch 3 bulan: 3 baris per bulan, deposit + bayar cuma bulan pertama', () => {
  const { ids } = createBatch({ room_id: r3, guest_name: 'Sewa Panjang', check_in: '2027-03-31', months: 3, deposit: 300000, deposit_paid_date: '2027-03-30', paid_date: '2027-03-30' });
  const rows = ids.map((id) => list('bookings').find((b) => b.id === id));
  assert.deepEqual(rows.map((b) => [b.check_in, b.check_out]), [['2027-03-31', '2027-04-30'], ['2027-04-30', '2027-05-31'], ['2027-05-31', '2027-06-30']]);
  assert.deepEqual(rows.map((b) => b.price_total), [1200000, 1200000, 1200000]);
  assert.deepEqual(rows.map((b) => b.deposit), [300000, 0, 0]);
  assert.deepEqual(rows.map((b) => b.paid), [1200000, 0, 0]);
  assert.equal(new Set(rows.map((b) => b.guest_id)).size, 1);
});
test('batch bentrok: semua batal (rollback), tamu baru juga nggak kebuat', () => {
  const before = list('bookings').length, g = list('guests').length;
  fails(() => createBatch({ room_id: r3, guest_name: 'Ghost', check_in: '2027-02-28', months: 3 }), 409);
  assert.equal(list('bookings').length, before); assert.equal(list('guests').length, g);
});
test('default sebulan kalau check_out kosong; tandai lunas + batalkan', () => {
  const id = create('bookings', { room_id: r3, guest_name: 'Satu Bulan', check_in: '2027-07-10' }).id;
  assert.equal(list('bookings').find((b) => b.id === id).check_out, '2027-08-10');
  payBooking(id, { date: '2027-07-09' });
  let b = list('bookings').find((x) => x.id === id);
  assert.equal(b.paid, 1200000); assert.equal(b.paid_date, '2027-07-09');
  payBooking(id, { date: '2027-07-09' }); // idempotent
  assert.equal(list('bookings').find((x) => x.id === id).paid, 1200000);
  payBooking(id, { paid: false });
  assert.equal(list('bookings').find((x) => x.id === id).paid, 0);
});
test('deposit: dikembalikan butuh sudah diterima; status turunan dari tanggal', () => {
  const id = create('bookings', { room_id: r3, guest_name: 'Dep', check_in: '2030-01-01', deposit: 300000 }).id;
  fails(() => update('bookings', id, { deposit_returned_date: '2030-02-01' }), 400);
  update('bookings', id, { deposit_paid_date: '2029-12-31' });
  assert.equal(list('bookings').find((x) => x.id === id).status, 'booked');
  assert.equal(dashboard('2026-11-21').depositHeld >= 300000, true);
  update('bookings', id, { status: 'cancelled' });
  assert.equal(list('bookings').find((x) => x.id === id).status, 'cancelled');
});
