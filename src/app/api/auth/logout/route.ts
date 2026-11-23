import { clearSessionCookie } from '@/lib/session';
import { route } from '@/lib/server-api';

export const POST = route(async () => {
  await clearSessionCookie();
  return { ok: true };
});
