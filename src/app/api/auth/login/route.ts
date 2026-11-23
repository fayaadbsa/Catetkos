import { HttpError } from '@/lib/resources';
import { verify } from '@/lib/password';
import { fingerprint, setSessionCookie } from '@/lib/session';
import { body, clientIp, fails, route } from '@/lib/server-api';

export const POST = route(async (req) => {
  const ip = clientIp(req);
  const f = fails.get(ip);
  if (f && f.n >= 5 && Date.now() < f.until)
    throw new HttpError(429, 'Kebanyakan percobaan. Coba lagi sebentar.');
  const b = await body(req);
  const u = await verify(String(b.username || ''), String(b.password || ''));
  if (!u) {
    fails.set(ip, { n: (f && Date.now() < f.until ? f.n : 0) + 1, until: Date.now() + 60_000 });
    throw new HttpError(401, 'Login gagal');
  }
  fails.delete(ip);
  await setSessionCookie({ uid: u.id, fp: fingerprint(u.hash) });
  return { username: u.username };
});
