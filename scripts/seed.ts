// Usage: bun run seed. Isi data contoh dari seed/example/seed.json ke DB (hapus data bisnis lama kos target, akun dipertahankan).
import { readFileSync } from 'node:fs';
import { prisma } from '../src/lib/db';
import { create } from '../src/lib/resources';

// Seed ke kos target: KOS_ID, default kos pertama.
const K =
  Number(process.env.KOS_ID) || (await prisma.kos.findFirst({ orderBy: { id: 'asc' } }))?.id;
if (!K) {
  console.error('Belum ada kos. Jalankan seed:admin dulu.');
  process.exit(1);
}

const f = process.argv[2] || 'seed/example/seed.json';
const s = JSON.parse(readFileSync(f, 'utf8'));
const where = { kosId: K };
await prisma.$transaction([
  prisma.transaction.deleteMany({ where }),
  prisma.booking.deleteMany({ where }),
  prisma.guest.deleteMany({ where }),
  prisma.promo.deleteMany({ where }),
  prisma.room.deleteMany({ where }),
  prisma.roomType.deleteMany({ where }),
]);
const typeId = async (name: string) =>
  (await prisma.roomType.findFirstOrThrow({ where: { kosId: K, name } })).id;
const roomId = async (number: string) =>
  (await prisma.room.findFirstOrThrow({ where: { kosId: K, number } })).id;
const catId = async (kind: string, name: string) =>
  (await prisma.category.findFirstOrThrow({ where: { kosId: K, kind, name } })).id;

for (const t of s.room_types) await create(K, 'room-types', t);
for (const r of s.rooms)
  await create(K, 'rooms', {
    number: r.number,
    room_type_id: await typeId(r.type),
    price_override: r.price_override,
  });
for (const p of s.promos)
  await create(K, 'promos', { ...p, room_type_id: p.type ? await typeId(p.type) : null });
for (const b of s.bookings) {
  const { id: bid } = await create(K, 'bookings', {
    room_id: await roomId(b.room),
    guest_name: b.guest,
    check_in: b.check_in,
    check_out: b.check_out,
    status: b.status,
  });
  if (b.paid) {
    const total = (await prisma.booking.findUniqueOrThrow({ where: { id: bid } })).priceTotal;
    await create(K, 'transactions', {
      booking_id: bid,
      date: b.paid_at || b.check_in,
      amount: b.paid === true ? total : b.paid,
    });
  }
}
for (const t of s.transactions)
  await create(K, 'transactions', {
    category_id: await catId(t.kind, t.category),
    date: t.date,
    amount: t.amount,
    note: t.note,
  });
console.log(`Seed selesai: ${s.rooms.length} kamar, ${s.bookings.length} booking.`);
await prisma.$disconnect();
