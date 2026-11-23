// Usage: TEST_PASSWORD=... bun run seed:test
// Akun uji many-to-many: tester1 -> Kos Melati + Kos Mawar, tester2 -> Kos Mawar saja. Idempotent.
import { prisma } from '../src/lib/db';
import { addMember, createKos, myKos } from '../src/lib/membership';
import { createUser } from '../src/lib/password';

const pw = process.env.TEST_PASSWORD;
if (!pw) {
  console.error('TEST_PASSWORD wajib diisi');
  process.exit(1);
}

const kosId = async (name: string) =>
  (await prisma.kos.findFirst({ where: { name } }))?.id ?? createKos(name);
const user = async (n: string) => {
  if (!(await prisma.user.findUnique({ where: { username: n } }))) await createUser(n, pw);
};
const join = async (kos: number, n: string) => {
  const u = await prisma.user.findUniqueOrThrow({ where: { username: n } });
  if (!(await myKos(u.id)).some((k) => k.id === kos)) await addMember(kos, n);
};

await user('tester1');
await user('tester2');
const melati = await kosId('Kos Melati'),
  mawar = await kosId('Kos Mawar');
await join(melati, 'tester1');
await join(mawar, 'tester1');
await join(mawar, 'tester2');
console.log('Akun uji siap: tester1 (Melati+Mawar), tester2 (Mawar)');
await prisma.$disconnect();
