import { NextResponse, type NextRequest } from 'next/server';
import { readSession, SESSION_COOKIE } from '@/lib/session';

const PUBLIC_API = ['/api/status', '/api/auth/login'];

// Gerbang kasar: tanpa JWT valid, halaman redirect ke /login dan /api balas 401.
// Cek akun masih ada + membership kos tetap dilakukan di server per request (auth.ts, api.ts).
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await readSession(req.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith('/api')) {
    if (!session && !PUBLIC_API.includes(pathname))
      return NextResponse.json({ error: 'Belum login' }, { status: 401 });
    return NextResponse.next();
  }
  if (pathname === '/login')
    return session ? NextResponse.redirect(new URL('/dashboard', req.url)) : NextResponse.next();
  if (!session) return NextResponse.redirect(new URL('/login', req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/|favicon|icons/|logo.svg|apple-touch-icon|manifest.webmanifest|sw.js).*)'],
};
