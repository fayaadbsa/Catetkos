import { HttpError } from '@/lib/resources';
import { addMember, isMember, members } from '@/lib/membership';
import { authed, body, idParam, route } from '@/lib/server-api';

async function guard(id: string) {
  const user = await authed();
  const kid = idParam(id);
  if (!(await isMember(user.id, kid))) throw new HttpError(404, 'Kos tidak ditemukan');
  return kid;
}

type P = { id: string };
export const GET = route<P>(async (_r, { id }) => members(await guard(id)));

export const POST = route<P>(async (req, { id }) => {
  const kid = await guard(id);
  if (!(await addMember(kid, String((await body(req)).username || '').trim())))
    throw new HttpError(404, 'Username tidak ditemukan');
  return members(kid);
});
