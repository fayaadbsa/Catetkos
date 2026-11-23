import { HttpError } from '@/lib/resources';
import { createKos, myKos } from '@/lib/membership';
import { setKosCookie } from '@/lib/session';
import { authed, body, route } from '@/lib/server-api';

export const GET = route(async () => myKos((await authed()).id));

export const POST = route(async (req) => {
  const user = await authed();
  const name = String((await body(req)).name || '').trim();
  if (!name) throw new HttpError(400, 'Nama kos wajib diisi');
  const id = await createKos(name, user.id);
  await setKosCookie(id);
  return { id };
}, 201);
