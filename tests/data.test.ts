import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// DB sementara dari migrasi Prisma asli (bukan DB produksi).
const dir = mkdtempSync(join(tmpdir(), 'catetkos-test-'));
process.env.DB_PATH = join(dir, 'test.db');
execSync('npx prisma migrate deploy', { env: process.env, stdio: 'pipe' });

const { prisma } = await import('../src/lib/db.ts');
const { createKos, myKos, isMember, addMember, members, removeMember, resolveKos } =
  await import('../src/lib/membership.ts');
const { createUser, verify, changePassword } = await import('../src/lib/password.ts');
const R = await import('../src/lib/resources.ts');
const { dashboard } = await import('../src/lib/dashboard.ts');
const { create, createBatch, payBooking, update, remove, list, quoteMonths, addMonths } = R;
after(async () => {
  await prisma.$disconnect();
  rmSync(dir, { recursive: true, force: true });
});

const fails = (fn: () => Promise<unknown>, status: number) =>
  assert.rejects(fn, (e: any) => e.status === status);
const quote = (kos: number, room: number, d: string) => R.quote(prisma, kos, room, d);
const find = async (kos: number, id: number) =>
  (await list(kos, 'bookings')).find((x) => x.id === id)!;
const cat = async (kos: number, kind: string, name: string) =>
  (await prisma.category.findFirstOrThrow({ where: { kosId: kos, kind, name } })).id;

const K = await createKos('Kos Test');
const t1 = (await create(K, 'room-types', { name: 'Superior', base_price: 1000000 })).id;
const r1 = (await create(K, 'rooms', { number: '01', room_type_id: t1 })).id;
const r2 = (await create(K, 'rooms', { number: '02', room_type_id: t1, price_override: 900000 }))
  .id;
await create(K, 'promos', {
  name: 'P',
  room_type_id: t1,
  price: 800000,
  start_date: '2026-11-01',
  end_date: '2026-11-30',
});

test('quote: promo aktif, override, tanpa promo', async () => {
  assert.equal((await quote(K, r1, '2026-11-02')).total, 800000);
  assert.equal((await quote(K, r1, '2026-12-02')).total, 1000000);
  assert.equal((await quote(K, r1, '2027-01-02')).total, 1000000);
  assert.equal((await quote(K, r2, '2026-12-02')).total, 900000);
});
test('validasi: tanggal, malam, FK, wajib', async () => {
  await fails(() => quote(K, r1, '2026-02-30'), 400);
  await fails(() => create(K, 'rooms', { number: '9', room_type_id: 999 }), 400);
  await fails(() => create(K, 'room-types', { base_price: 1 }), 400);
  await fails(
    () =>
      create(K, 'promos', {
        name: 'x',
        price: 1,
        start_date: '2026-02-30',
        end_date: '2026-03-01',
      }),
    400,
  );
});
test('unique + restrict', async () => {
  await fails(() => create(K, 'rooms', { number: '01', room_type_id: t1 }), 409);
  await fails(() => remove(K, 'room-types', t1), 409);
  await fails(() => remove(K, 'rooms', 12345), 404);
});
const b1 = (
  await create(K, 'bookings', {
    room_id: r1,
    guest_name: 'Tamu A',
    check_in: '2026-11-02',
    check_out: '2026-11-07',
  })
).id; // check_out manual masih boleh
test('booking: harga otomatis + promo, tamu auto-dibuat', async () => {
  const b = await find(K, b1);
  assert.equal(b.price_total, 800000);
  assert.ok(b.promo_id);
  assert.equal(b.guest_name, 'Tamu A');
});
test('booking: overlap ditolak, back-to-back boleh, cancelled bebas', async () => {
  await fails(
    () =>
      create(K, 'bookings', {
        room_id: r1,
        guest_name: 'X',
        check_in: '2026-11-06',
        check_out: '2026-11-08',
      }),
    409,
  );
  await create(K, 'bookings', {
    room_id: r1,
    guest_name: 'Y',
    check_in: '2026-11-07',
    check_out: '2026-11-08',
  });
  await update(K, 'bookings', b1, { status: 'cancelled' });
  await create(K, 'bookings', {
    room_id: r1,
    guest_name: 'Z',
    check_in: '2026-11-03',
    check_out: '2026-11-05',
  });
  await update(K, 'bookings', b1, {
    status: 'booked',
    check_in: '2026-11-20',
    check_out: '2026-11-22',
  });
});
test('pembayaran: tidak boleh melebihi tagihan, hapus booking diblok', async () => {
  await create(K, 'transactions', { booking_id: b1, date: '2026-11-20', amount: 500000 });
  await fails(
    () => create(K, 'transactions', { booking_id: b1, date: '2026-11-20', amount: 999999999 }),
    400,
  );
  await fails(() => remove(K, 'bookings', b1), 409);
  await fails(() => update(K, 'bookings', b1, { price_total: 10 }), 400);
});
test('update parsial tidak menimpa field lain dengan NULL', async () => {
  await update(K, 'bookings', b1, { note: 'hi' });
  assert.equal((await find(K, b1)).check_in, '2026-11-20');
});
test('dashboard: arus kas, balik modal, piutang', async () => {
  await create(K, 'transactions', {
    category_id: await cat(K, 'capital', 'Bangunan'),
    date: '2026-01-01',
    amount: 10000000,
  });
  await create(K, 'transactions', {
    category_id: await cat(K, 'expense', 'Listrik'),
    date: '2026-11-05',
    amount: 300000,
  });
  const d = await dashboard(K, '2026-11-21');
  const nov = d.cashflow.find((m) => m.month === '2026-11')!;
  assert.equal(nov.income, 500000);
  assert.equal(nov.expense, 300000);
  assert.equal(d.payback.capitalTotal, 10000000);
  assert.equal(d.payback.cumNet, 200000);
  assert.ok(d.receivable.total > 0);
});

test('create: field bool/default dikirim null (form UI) pakai default, bukan error', async () => {
  const id = (
    await create(K, 'room-types', {
      name: 'Null-safe',
      base_price: 500000,
      capacity: null,
      archived: null,
    })
  ).id;
  const row = (await list(K, 'room-types')).find((t) => t.id === id)!;
  assert.equal(row.archived, 0);
  assert.equal(row.capacity, 1);
});

test('addMonths: clamp akhir bulan, lintas tahun', () => {
  assert.equal(addMonths('2026-01-31', 1), '2026-02-28');
  assert.equal(addMonths('2026-11-15', 2), '2027-01-15');
  assert.equal(addMonths('2028-01-31', 1), '2028-02-29');
});
const t2 = (await create(K, 'room-types', { name: 'Batch', base_price: 1200000 })).id;
const r3 = (await create(K, 'rooms', { number: 'B1', room_type_id: t2 })).id;
test('batch 3 bulan: 3 baris per bulan, deposit + bayar cuma bulan pertama', async () => {
  const { ids } = await createBatch(K, {
    room_id: r3,
    guest_name: 'Sewa Panjang',
    check_in: '2027-03-31',
    months: 3,
    deposit: 300000,
    deposit_paid_date: '2027-03-30',
    paid_date: '2027-03-30',
  });
  const rows = await Promise.all(ids.map((id) => find(K, id)));
  assert.deepEqual(
    rows.map((b) => [b.check_in, b.check_out]),
    [
      ['2027-03-31', '2027-04-30'],
      ['2027-04-30', '2027-05-31'],
      ['2027-05-31', '2027-06-30'],
    ],
  );
  assert.deepEqual(
    rows.map((b) => b.price_total),
    [1200000, 1200000, 1200000],
  );
  assert.deepEqual(
    rows.map((b) => b.deposit),
    [300000, 0, 0],
  );
  assert.deepEqual(
    rows.map((b) => b.paid),
    [1200000, 0, 0],
  );
  assert.equal(new Set(rows.map((b) => b.guest_id)).size, 1);
});
test('batch bentrok: semua batal (rollback), tamu baru juga nggak kebuat', async () => {
  const before = (await list(K, 'bookings')).length,
    g = (await list(K, 'guests')).length;
  await fails(
    () => createBatch(K, { room_id: r3, guest_name: 'Ghost', check_in: '2027-02-28', months: 3 }),
    409,
  );
  assert.equal((await list(K, 'bookings')).length, before);
  assert.equal((await list(K, 'guests')).length, g);
});
test('default sebulan kalau check_out kosong; tandai lunas + batalkan', async () => {
  const id = (
    await create(K, 'bookings', { room_id: r3, guest_name: 'Satu Bulan', check_in: '2027-07-10' })
  ).id;
  assert.equal((await find(K, id)).check_out, '2027-08-10');
  await payBooking(K, id, { date: '2027-07-09' });
  const b = await find(K, id);
  assert.equal(b.paid, 1200000);
  assert.equal(b.paid_date, '2027-07-09');
  await payBooking(K, id, { date: '2027-07-09' }); // idempotent
  assert.equal((await find(K, id)).paid, 1200000);
  await payBooking(K, id, { paid: false });
  assert.equal((await find(K, id)).paid, 0);
});
test('deposit: dikembalikan butuh sudah diterima; status turunan dari tanggal', async () => {
  const id = (
    await create(K, 'bookings', {
      room_id: r3,
      guest_name: 'Dep',
      check_in: '2030-01-01',
      deposit: 300000,
    })
  ).id;
  await fails(() => update(K, 'bookings', id, { deposit_returned_date: '2030-02-01' }), 400);
  await update(K, 'bookings', id, { deposit_paid_date: '2029-12-31' });
  assert.equal((await find(K, id)).status, 'booked');
  assert.equal((await dashboard(K, '2026-11-21')).depositHeld >= 300000, true);
  await update(K, 'bookings', id, { status: 'cancelled' });
  assert.equal((await find(K, id)).status, 'cancelled');
});

// ---- multi-kos: isolasi data + membership many-to-many
const K2 = await createKos('Kos Dua');
test('kos: data terisolasi (nomor kamar boleh sama, list/update/remove nggak tembus kos lain)', async () => {
  const ty = (await create(K2, 'room-types', { name: 'Superior', base_price: 700000 })).id; // nama sama dgn kos 1, boleh
  const rm = (await create(K2, 'rooms', { number: '01', room_type_id: ty })).id; // nomor sama, boleh
  assert.equal((await list(K2, 'rooms')).length, 1);
  assert.ok(!(await list(K, 'rooms')).some((r) => r.id === rm));
  await fails(() => update(K, 'rooms', rm, { number: 'X' }), 404);
  await fails(() => remove(K, 'rooms', rm), 404);
  await fails(() => create(K, 'rooms', { number: 'Z', room_type_id: ty }), 400); // FK ke kos lain ditolak
  await fails(() => quote(K, rm, '2026-11-02'), 400);
  assert.equal((await quote(K2, rm, '2026-11-02')).total, 700000); // promo kos 1 nggak bocor
});
test('kos: kategori bawaan per kos, dashboard per kos', async () => {
  assert.equal((await list(K2, 'categories')).length, 13);
  assert.equal((await dashboard(K2, '2026-11-21')).roomCount, 1);
  assert.equal((await dashboard(K2, '2026-11-21')).payback.capitalTotal, 0);
});
test('membership many-to-many + resolveKos', async () => {
  const a = await createUser('amel', 'passw0rd!'),
    b = await createUser('budi', 'passw0rd!');
  await addMember(K, 'amel');
  await addMember(K2, 'amel');
  await addMember(K2, 'budi');
  assert.equal((await myKos(a)).length, 2);
  assert.equal((await myKos(b)).length, 1);
  assert.equal(await isMember(b, K), false);
  assert.equal(await isMember(b, K2), true);
  assert.equal(await addMember(K, 'nobody'), false);
  assert.equal((await members(K2)).length, 2);
  // cookie kos milik orang lain tidak dipercaya: jatuh ke kos pertama user
  assert.equal((await resolveKos(b, K)).active?.id, K2);
  assert.equal((await resolveKos(a, K2)).active?.id, K2);
  assert.equal((await resolveKos(a, 0)).list.length, 2);
  assert.equal(await removeMember(K2, b), true);
  assert.equal(await removeMember(K, a), false); // anggota terakhir ditahan
});
test('password: verify, ganti password', async () => {
  assert.ok(await verify('amel', 'passw0rd!'));
  assert.equal(await verify('amel', 'salah'), null);
  const id = (await verify('amel', 'passw0rd!'))!.id;
  assert.equal(await changePassword(id, 'salah', 'baru-12345'), false);
  assert.equal(await changePassword(id, 'passw0rd!', 'baru-12345'), true);
  assert.equal(await verify('amel', 'passw0rd!'), null);
  assert.ok(await verify('amel', 'baru-12345'));
});

test('dashboard filter: days + tipe', async () => {
  const all = await dashboard(K, '2026-11-21', { days: 90 });
  assert.equal(all.windowDays, 90);
  const tid = (await prisma.roomType.findFirstOrThrow({ where: { kosId: K } })).id;
  const one = await dashboard(K, '2026-11-21', { type: tid });
  assert.ok(one.roomCount <= all.roomCount);
  assert.equal((await dashboard(K, '2026-11-21', { days: 99999 })).windowDays, 365);
});
test('quoteMonths: tiap bulan dinilai promonya sendiri', async () => {
  const r = await quoteMonths(K, r1, '2026-11-15', 3);
  assert.deepEqual(
    r.items.map((i) => i.total),
    [800000, 1000000, 1000000],
  );
  assert.equal(r.total, 2800000);
});
