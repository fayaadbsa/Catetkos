// Usage (di VPS): docker exec -it catetkos-prod bun scripts/set-password.ts <username>
// Minta password lewat prompt tersembunyi (tidak lewat argumen / chat). Hash scrypt + salt.
import { prisma } from '../src/lib/db';
import { createUser, setPassword } from '../src/lib/password';
import { ask } from './cli';

const username = process.argv[2]?.trim();
if (!username) {
  console.error('Usage: bun scripts/set-password.ts <username>');
  process.exit(1);
}
if (!process.stdin.isTTY) {
  console.error('Harus dijalankan interaktif (docker exec -it ...)');
  process.exit(1);
}

const pw = await ask('Password baru: ', true);
if (pw.length < 8) {
  console.error('Minimal 8 karakter.');
  process.exit(1);
}
if ((await ask('Ulangi password: ', true)) !== pw) {
  console.error('Tidak sama.');
  process.exit(1);
}

const u = await prisma.user.findUnique({ where: { username } });
if (u) {
  await setPassword(u.id, pw);
  console.log(`Password ${username} diganti. Semua sesi dicabut.`);
} else {
  await createUser(username, pw);
  console.log(`User ${username} dibuat.`);
}
await prisma.$disconnect();
