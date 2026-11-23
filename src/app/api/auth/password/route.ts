import { HttpError } from '@/lib/resources';
import { changePassword } from '@/lib/password';
import { clearSessionCookie } from '@/lib/session';
import { authed, body, route } from '@/lib/server-api';

export const POST = route(async (req) => {
  const user = await authed();
  const b = await body(req);
  if (!b.oldPassword || !b.newPassword) throw new HttpError(400, 'Isi password lama dan baru');
  if (!(await changePassword(user.id, String(b.oldPassword), String(b.newPassword))))
    throw new HttpError(400, 'Password lama salah');
  await clearSessionCookie();
  return { ok: true };
});
