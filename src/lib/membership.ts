import { prisma } from './db';

export const DEFAULT_CATS: [string, string][] = [
  ['income', 'Sewa kamar'],
  ['income', 'Lainnya'],
  ['expense', 'Listrik'],
  ['expense', 'Air'],
  ['expense', 'Internet'],
  ['expense', 'Kebersihan'],
  ['expense', 'Perawatan'],
  ['expense', 'Gaji'],
  ['expense', 'Lainnya'],
  ['capital', 'Bangunan'],
  ['capital', 'Furnitur'],
  ['capital', 'Elektronik'],
  ['capital', 'Lainnya'],
];

// Kos baru + kategori bawaan + pembuatnya langsung jadi anggota (userId opsional buat skrip/seed).
export async function createKos(name: string, userId: number | null = null) {
  return prisma.$transaction(async (tx) => {
    const kos = await tx.kos.create({ data: { name } });
    await tx.category.createMany({
      data: DEFAULT_CATS.map(([kind, n]) => ({ kosId: kos.id, kind, name: n })),
    });
    if (userId) await tx.membership.create({ data: { userId, kosId: kos.id } });
    return kos.id;
  });
}

export const myKos = (userId: number) =>
  prisma.kos.findMany({
    where: { memberships: { some: { userId } } },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

export async function isMember(userId: number, kosId: number) {
  return (await prisma.membership.count({ where: { userId, kosId } })) > 0;
}

export async function addMember(kosId: number, username: string) {
  const u = await prisma.user.findUnique({ where: { username } });
  if (!u) return false;
  await prisma.membership.upsert({
    where: { userId_kosId: { userId: u.id, kosId } },
    create: { userId: u.id, kosId },
    update: {},
  });
  return true;
}

export const members = (kosId: number) =>
  prisma.user.findMany({
    where: { memberships: { some: { kosId } } },
    select: { id: true, username: true },
    orderBy: { username: 'asc' },
  });

export async function removeMember(kosId: number, userId: number) {
  if ((await members(kosId)).length <= 1) return false; // kos tanpa anggota = data yatim
  await prisma.membership.deleteMany({ where: { kosId, userId } });
  return true;
}

// Kos aktif = pilihan dari cookie kalau user anggotanya, kalau tidak kos pertama. Selalu dicek ke DB.
export async function resolveKos(userId: number, preferred?: number) {
  const list = await myKos(userId);
  const active = list.find((k) => k.id === preferred) ?? list[0] ?? null;
  return { list, active };
}
