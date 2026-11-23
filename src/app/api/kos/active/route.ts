import { HttpError } from '@/lib/resources';
import { isMember } from '@/lib/membership';
import { setKosCookie } from '@/lib/session';
import { authed, body, route } from '@/lib/server-api';

export const POST = route(async (req) => {
  const user = await authed();
  const id = Number((await body(req)).id);
  if (!id || !(await isMember(user.id, id))) throw new HttpError(404, 'Kos tidak ditemukan');
  await setKosCookie(id);
  return { id };
});
