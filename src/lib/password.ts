import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { prisma } from './db';

export const hashPw = (pw: string, salt = randomBytes(16).toString('hex')) => ({
  salt,
  hash: scryptSync(pw, salt, 64).toString('hex'),
});

export async function createUser(username: string, password: string) {
  const { salt, hash } = hashPw(password);
  return (await prisma.user.create({ data: { username, hash, salt } })).id;
}

export async function verify(username: string, password: string) {
  const u = await prisma.user.findUnique({ where: { username } });
  if (!u) return null;
  const a = Buffer.from(hashPw(password, u.salt).hash, 'hex');
  return timingSafeEqual(a, Buffer.from(u.hash, 'hex')) ? u : null;
}

// Ganti hash = fingerprint (session.ts) berubah = semua sesi lama otomatis mati.
export async function setPassword(userId: number, password: string) {
  await prisma.user.update({ where: { id: userId }, data: hashPw(password) });
}

export async function changePassword(userId: number, oldPw: string, newPw: string) {
  const u = await prisma.user.findUnique({ where: { id: userId } });
  if (!u || !(await verify(u.username, oldPw))) return false;
  await setPassword(userId, newPw);
  return true;
}
