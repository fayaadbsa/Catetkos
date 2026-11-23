import 'server-only';
import { NextResponse } from 'next/server';
import { getCurrentUser } from './auth';
import { HttpError } from './resources';
import { resolveKos } from './membership';
import { getKosCookie } from './session';

type Ctx<P> = { params: Promise<P> };

// Bungkus route handler: HttpError jadi JSON {error}, body rusak 400, sisanya 500.
export function route<P = Record<string, never>>(
  fn: (req: Request, p: P) => Promise<unknown>,
  status = 200,
) {
  return async (req: Request, ctx: Ctx<P>) => {
    try {
      const out = await fn(req, await ctx.params);
      return out instanceof Response ? out : NextResponse.json(out, { status });
    } catch (e) {
      if (e instanceof HttpError)
        return NextResponse.json({ error: e.message }, { status: e.status });
      if (e instanceof SyntaxError)
        return NextResponse.json({ error: 'JSON tidak valid' }, { status: 400 });
      console.error(e);
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
  };
}

export const body = async (req: Request): Promise<Record<string, any>> => {
  const t = await req.text();
  return t ? JSON.parse(t) : {};
};

export async function authed() {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, 'Belum login');
  return user;
}

// Kos aktif = preferensi dari cookie, tapi cuma dipakai kalau user anggotanya (dicek ke DB di SETIAP request).
export async function withKos() {
  const user = await authed();
  const { active } = await resolveKos(user.id, await getKosCookie());
  if (!active) throw new HttpError(403, 'Pilih kos dulu');
  return { user, kos: active.id };
}

export const idParam = (s: string) => {
  const n = Number(s);
  if (!Number.isInteger(n) || n < 1) throw new HttpError(404, 'Not found');
  return n;
};

// ponytail: rate limit login in-memory per IP (reset saat restart). IP = entri terakhir X-Forwarded-For (ditambah proxy), Upgrade: store persisten.
const g = globalThis as unknown as { loginFails?: Map<string, { n: number; until: number }> };
export const fails = (g.loginFails ??= new Map());
export const clientIp = (req: Request) =>
  req.headers.get('x-forwarded-for')?.split(',').pop()?.trim() ||
  req.headers.get('x-real-ip') ||
  'local';
