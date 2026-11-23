process.env.DB_PATH = ':memory:';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const { db, createKos, myKos, isMember, addMember, members, removeMember } = await import('../server/db.js');
const { createUser } = await import('../server/auth.js');
const { create, createBatch, payBooking, update, remove, list, quote, quoteMonths, addMonths } = await import('../server/resources.js');
const K = createKos('Kos Test');
const { dashboard } = await import('../server/dashboard.js');

const fails = (fn, status) => assert.throws(fn, (e) => e.status === status);
const t1 = create(K, 'room-types', { name: 'Superior', base_price: 1000000 }).id;
const r1 = create(K, 'rooms', { number: '01', room_type_id: t1 }).id;
const r2 = create(K, 'rooms', { number: '02', room_type_id: t1, price_override: 900000 }).id;
create(K, 'promos', { name: 'P', room_type_id: t1, price: 800000, start_date: '2026-11-01', end_date: '2026-11-30' });

test('quote: promo aktif, override, tanpa promo', () => {
  assert.equal(quote(K, r1, '2026-11-02').total, 800000);
  assert.equal(quote(K, r1, '2026-12-02').total, 1000000);
  assert.equal(quote(K, r1, '2027-01-02').total, 1000000);
  assert.equal(quote(K, r2, '2026-12-02').total, 900000);
});
test('validasi: tanggal, malam, FK, wajib', () => {
  fails(() => quote(K, r1, '2026-02-30'), 400);
  fails(() => create(K, 'rooms', { number: '9', room_type_id: 999 }), 400);
  fails(() => create(K, 'room-types', { base_price: 1 }), 400);
  fails(() => create(K, 'promos', { name: 'x', price: 1, start_date: '2026-02-30', end_date: '2026-03-01' }), 400);
});
test('unique + restrict', () => {
  fails(() => create(K, 'rooms', { number: '01', room_type_id: t1 }), 409);
  fails(() => remove(K, 'room-types', t1), 409);
  fails(() => remove(K, 'rooms', 12345), 404);
});
const b1 = create(K, 'bookings', { room_id: r1, guest_name: 'Tamu A', check_in: '2026-11-02', check_out: '2026-11-07' }).id; // check_out manual masih boleh
test('booking: harga otomatis + promo, tamu auto-dibuat', () => {
  const b = list(K, 'bookings').find((x) => x.id === b1);
  assert.equal(b.price_total, 800000); assert.ok(b.promo_id); assert.equal(b.guest_name, 'Tamu A');
});
test('booking: overlap ditolak, back-to-back boleh, cancelled bebas', () => {
  fails(() => create(K, 'bookings', { room_id: r1, guest_name: 'X', check_in: '2026-11-06', check_out: '2026-11-08' }), 409);
  create(K, 'bookings', { room_id: r1, guest_name: 'Y', check_in: '2026-11-07', check_out: '2026-11-08' });
  update(K, 'bookings', b1, { status: 'cancelled' });
  create(K, 'bookings', { room_id: r1, guest_name: 'Z', check_in: '2026-11-03', check_out: '2026-11-05' });
  update(K, 'bookings', b1, { status: 'booked', check_in: '2026-11-20', check_out: '2026-11-22' });
});
test('pembayaran: tidak boleh melebihi tagihan, hapus booking diblok', () => {
  create(K, 'transactions', { booking_id: b1, date: '2026-11-20', amount: 500000 });
  fails(() => create(K, 'transactions', { booking_id: b1, date: '2026-11-20', amount: 999999999 }), 400);
  fails(() => remove(K, 'bookings', b1), 409);
  fails(() => update(K, 'bookings', b1, { price_total: 10 }), 400);
});
test('update parsial tidak menimpa field lain dengan NULL', () => {
  update(K, 'bookings', b1, { note: 'hi' });
  assert.equal(list(K, 'bookings').find((x) => x.id === b1).check_in, '2026-11-20');
});
test('dashboard: arus kas, balik modal, piutang', () => {
  const cat = (k, n) => db.prepare('SELECT id FROM categories WHERE kos_id=? AND kind=? AND name=?').get(K, k, n).id;
  create(K, 'transactions', { category_id: cat('capital', 'Bangunan'), date: '2026-01-01', amount: 10000000 });
  create(K, 'transactions', { category_id: cat('expense', 'Listrik'), date: '2026-11-05', amount: 300000 });
  const d = dashboard(K, '2026-11-21');
  const nov = d.cashflow.find((m) => m.month === '2026-11');
  assert.equal(nov.income, 500000); assert.equal(nov.expense, 300000);
  assert.equal(d.payback.capitalTotal, 10000000); assert.equal(d.payback.cumNet, 200000);
  assert.ok(d.receivable.total > 0);
});

test('create: field bool/default dikirim null (form UI) pakai default, bukan error', () => {
  const id = create(K, 'room-types', { name: 'Null-safe', base_price: 500000, capacity: null, archived: null }).id;
  const row = list(K, 'room-types').find((t) => t.id === id);
  assert.equal(row.archived, 0); assert.equal(row.capacity, 1);
});

test('addMonths: clamp akhir bulan, lintas tahun', () => {
  assert.equal(addMonths('2026-01-31', 1), '2026-02-28');
  assert.equal(addMonths('2026-11-15', 2), '2027-01-15');
  assert.equal(addMonths('2028-01-31', 1), '2028-02-29');
});
const t2 = create(K, 'room-types', { name: 'Batch', base_price: 1200000 }).id;
const r3 = create(K, 'rooms', { number: 'B1', room_type_id: t2 }).id;
test('batch 3 bulan: 3 baris per bulan, deposit + bayar cuma bulan pertama', () => {
  const { ids } = createBatch(K, { room_id: r3, guest_name: 'Sewa Panjang', check_in: '2027-03-31', months: 3, deposit: 300000, deposit_paid_date: '2027-03-30', paid_date: '2027-03-30' });
  const rows = ids.map((id) => list(K, 'bookings').find((b) => b.id === id));
  assert.deepEqual(rows.map((b) => [b.check_in, b.check_out]), [['2027-03-31', '2027-04-30'], ['2027-04-30', '2027-05-31'], ['2027-05-31', '2027-06-30']]);
  assert.deepEqual(rows.map((b) => b.price_total), [1200000, 1200000, 1200000]);
  assert.deepEqual(rows.map((b) => b.deposit), [300000, 0, 0]);
  assert.deepEqual(rows.map((b) => b.paid), [1200000, 0, 0]);
  assert.equal(new Set(rows.map((b) => b.guest_id)).size, 1);
});
test('batch bentrok: semua batal (rollback), tamu baru juga nggak kebuat', () => {
  const before = list(K, 'bookings').length, g = list(K, 'guests').length;
  fails(() => createBatch(K, { room_id: r3, guest_name: 'Ghost', check_in: '2027-02-28', months: 3 }), 409);
  assert.equal(list(K, 'bookings').length, before); assert.equal(list(K, 'guests').length, g);
});
test('default sebulan kalau check_out kosong; tandai lunas + batalkan', () => {
  const id = create(K, 'bookings', { room_id: r3, guest_name: 'Satu Bulan', check_in: '2027-07-10' }).id;
  assert.equal(list(K, 'bookings').find((b) => b.id === id).check_out, '2027-08-10');
  payBooking(K, id, { date: '2027-07-09' });
  let b = list(K, 'bookings').find((x) => x.id === id);
  assert.equal(b.paid, 1200000); assert.equal(b.paid_date, '2027-07-09');
  payBooking(K, id, { date: '2027-07-09' }); // idempotent
  assert.equal(list(K, 'bookings').find((x) => x.id === id).paid, 1200000);
  payBooking(K, id, { paid: false });
  assert.equal(list(K, 'bookings').find((x) => x.id === id).paid, 0);
});
test('deposit: dikembalikan butuh sudah diterima; status turunan dari tanggal', () => {
  const id = create(K, 'bookings', { room_id: r3, guest_name: 'Dep', check_in: '2030-01-01', deposit: 300000 }).id;
  fails(() => update(K, 'bookings', id, { deposit_returned_date: '2030-02-01' }), 400);
  update(K, 'bookings', id, { deposit_paid_date: '2029-12-31' });
  assert.equal(list(K, 'bookings').find((x) => x.id === id).status, 'booked');
  assert.equal(dashboard(K, '2026-11-21').depositHeld >= 300000, true);
  update(K, 'bookings', id, { status: 'cancelled' });
  assert.equal(list(K, 'bookings').find((x) => x.id === id).status, 'cancelled');
});

// ---- multi-kos: isolasi data + membership many-to-many
const K2 = createKos('Kos Dua');
test('kos: data terisolasi (nomor kamar boleh sama, list/update/remove nggak tembus kos lain)', () => {
  const ty = create(K2, 'room-types', { name: 'Superior', base_price: 700000 }).id; // nama sama dgn kos 1, boleh
  const rm = create(K2, 'rooms', { number: '01', room_type_id: ty }).id;           // nomor sama, boleh
  assert.equal(list(K2, 'rooms').length, 1);
  assert.ok(!list(K, 'rooms').some((r) => r.id === rm));
  fails(() => update(K, 'rooms', rm, { number: 'X' }), 404);
  fails(() => remove(K, 'rooms', rm), 404);
  fails(() => create(K, 'rooms', { number: 'Z', room_type_id: ty }), 400);        // FK ke kos lain ditolak
  fails(() => quote(K, rm, '2026-11-02'), 400);
  assert.equal(quote(K2, rm, '2026-11-02').total, 700000);                          // promo kos 1 nggak bocor
});
test('kos: kategori bawaan per kos, dashboard per kos', () => {
  assert.equal(list(K2, 'categories').length, 13);
  assert.equal(dashboard(K2, '2026-11-21').roomCount, 1);
  assert.equal(dashboard(K2, '2026-11-21').payback.capitalTotal, 0);
});
test('membership many-to-many', () => {
  const a = createUser('amel', 'passw0rd!'), b = createUser('budi', 'passw0rd!');
  addMember(K, 'amel'); addMember(K2, 'amel'); addMember(K2, 'budi');
  assert.equal(myKos(a).length, 2); assert.equal(myKos(b).length, 1);
  assert.equal(isMember(b, K), false); assert.equal(isMember(b, K2), true);
  assert.equal(addMember(K, 'nobody'), false);
  assert.equal(members(K2).length, 2);
  assert.equal(removeMember(K2, b), true); assert.equal(removeMember(K, a), false); // anggota terakhir ditahan
});

test('dashboard filter: days + tipe', () => {
  const all = dashboard(K, '2026-11-21', { days: 90 });
  assert.equal(all.windowDays, 90);
  const tid = db.prepare('SELECT id FROM room_types WHERE kos_id=? LIMIT 1').get(K).id;
  const one = dashboard(K, '2026-11-21', { type: tid });
  assert.ok(one.roomCount <= all.roomCount);
  assert.equal(dashboard(K, '2026-11-21', { days: 99999 }).windowDays, 365);
});
