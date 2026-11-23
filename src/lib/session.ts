import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'session';
export const KOS_COOKIE = 'kos';
const TTL_S = 7 * 24 * 3600;

// Rahasia JWT: env SESSION_SECRET, kalau kosong dibikin sekali dan disimpan di volume data/ (ikut persisten antar deploy).
let secret: Uint8Array | undefined;
function key() {
  if (secret) return secret;
  let s = process.env.SESSION_SECRET;
  if (!s) {
    const f = resolve(
      dirname(resolve(/*turbopackIgnore: true*/ process.env.DB_PATH || 'data/catetkos.db')),
      '.session-secret',
    );
    if (!existsSync(f)) {
      mkdirSync(dirname(f), { recursive: true });
      writeFileSync(f, randomBytes(32).toString('hex'), { mode: 0o600 });
    }
    s = readFileSync(f, 'utf8').trim();
  }
  return (secret = new TextEncoder().encode(s));
}

// fp = sidik jari hash password: ganti password otomatis mencabut semua sesi lama.
export const fingerprint = (hash: string) =>
  createHash('sha256').update(hash).digest('hex').slice(0, 16);

export interface Session {
  uid: number;
  fp: string;
}

export const signSession = (s: Session) =>
  new SignJWT({ ...s })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${TTL_S}s`)
    .sign(key());

export async function readSession(token?: string): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ['HS256'] });
    return typeof payload.uid === 'number' && typeof payload.fp === 'string'
      ? { uid: payload.uid, fp: payload.fp }
      : null;
  } catch {
    return null;
  }
}

const opts = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
};

export async function setSessionCookie(s: Session) {
  (await cookies()).set(SESSION_COOKIE, await signSession(s), { ...opts, maxAge: TTL_S });
}
export async function clearSessionCookie() {
  const c = await cookies();
  c.delete(SESSION_COOKIE);
  c.delete(KOS_COOKIE);
}
export async function setKosCookie(id: number) {
  (await cookies()).set(KOS_COOKIE, String(id), { ...opts, maxAge: 365 * 24 * 3600 });
}
export async function getKosCookie() {
  return Number((await cookies()).get(KOS_COOKIE)?.value) || 0;
}
export async function getSessionToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}
