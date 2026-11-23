// Usage: bun run seed:admin (atau ADMIN_USERNAME=... ADMIN_PASSWORD=... bun run seed:admin)
// Bikin akun admin. Aman diulang: kalau username sudah ada, skip. Tidak menghapus data.
import { prisma } from '../src/lib/db';
import { createKos, addMember, myKos } from '../src/lib/membership';
import { createUser } from '../src/lib/password';
import { ask } from './cli';

let u = process.env.ADMIN_USERNAME?.trim() || process.argv[2]?.trim();
let p = process.env.ADMIN_PASSWORD;

if (!u) u = process.stdin.isTTY ? (await ask('Username admin [admin]: ')) || 'admin' : 'admin';

if (!p) {
  const tty = Boolean(process.stdin.isTTY);
  p = await ask('Password admin: ', tty);
  if (!p) {
    console.error('Password tidak boleh kosong.');
    process.exit(1);
  }
  if (p.length < 8) {
    console.error('Password minimal 8 karakter.');
    process.exit(1);
  }
  if (tty && p !== (await ask('Ulangi password: ', true))) {
    console.error('Password tidak sama.');
    process.exit(1);
  }
}

const ex = await prisma.user.findUnique({ where: { username: u } });
if (ex) console.log(`User ${u} sudah ada, skip.`);
else {
  await createUser(u, p);
  console.log(`Admin ${u} dibuat.`);
}

const id = ex?.id ?? (await prisma.user.findUniqueOrThrow({ where: { username: u } })).id;
if (!(await myKos(id)).length) {
  // akun tanpa kos = nggak bisa ngapa-ngapain; kasih satu
  const first = await prisma.kos.findFirst({
    orderBy: { id: 'asc' },
    include: { _count: { select: { memberships: true } } },
  });
  if (first && first._count.memberships === 0)
    await addMember(first.id, u); // kos #1 yatim (instalasi baru)
  else await createKos(process.env.KOS_NAME || 'Kos saya', id);
}
await prisma.$disconnect();
