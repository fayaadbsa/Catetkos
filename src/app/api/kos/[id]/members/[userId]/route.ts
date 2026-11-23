import { HttpError } from '@/lib/resources';
import { isMember, members, removeMember } from '@/lib/membership';
import { authed, idParam, route } from '@/lib/server-api';

export const DELETE = route<{ id: string; userId: string }>(async (_r, p) => {
  const user = await authed();
  const kid = idParam(p.id);
  if (!(await isMember(user.id, kid))) throw new HttpError(404, 'Kos tidak ditemukan');
  if (!(await removeMember(kid, idParam(p.userId))))
    throw new HttpError(400, 'Kos harus punya minimal satu anggota');
  return members(kid);
});
