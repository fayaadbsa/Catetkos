import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { prisma } from './db';
import { fingerprint, getSessionToken, readSession } from './session';

export interface SessionUser {
  id: number;
  username: string;
}

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const s = await readSession(await getSessionToken());
  if (!s) return null;
  const u = await prisma.user.findUnique({ where: { id: s.uid } });
  return u && fingerprint(u.hash) === s.fp ? { id: u.id, username: u.username } : null;
});

export async function requireUser(): Promise<SessionUser> {
  const u = await getCurrentUser();
  if (!u) redirect('/login');
  return u;
}
