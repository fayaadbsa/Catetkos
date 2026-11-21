import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { createUser, verify, newSession, sessionUser, dropSession, changePassword } from './auth.js';
import { dashboard } from './dashboard.js';
import { createKos, myKos, isMember, addMember, members, removeMember } from './db.js';
import { isResource, list, create, createBatch, payBooking, update, remove, quoteMonths, HttpError } from './resources.js';

const PORT = process.env.PORT || 3005;
const DIST = 'dist';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };

// ponytail: rate limit login in-memory per IP (reset saat restart; di balik proxy IP = proxy). Upgrade: baca X-Forwarded-For terpercaya.
const fails = new Map();
const send = (res, code, data, headers = {}) => {
  res.writeHead(code, { 'Content-Type': 'application/json', ...headers });
  res.end(JSON.stringify(data));
};
const readBody = (req) => new Promise((ok, bad) => {
  let s = ''; req.on('data', (c) => { s += c; if (s.length > 1e6) req.destroy(); });
  req.on('end', () => { try { ok(s ? JSON.parse(s) : {}); } catch { bad(new Error('bad json')); } });
});
const cookie = (req, name) => (req.headers.cookie || '').split(/;\s*/).find((c) => c.startsWith(name + '='))?.slice(name.length + 1);

async function api(req, res, url) {
  const p = url.pathname;
  if (p === '/api/status') return send(res, 200, { ok: true });
  if (p === '/api/login' && req.method === 'POST') {
    const ip = req.socket.remoteAddress, f = fails.get(ip);
    if (f && f.n >= 5 && Date.now() < f.until) return send(res, 429, { error: 'Kebanyakan percobaan. Coba lagi sebentar.' });
    const b = await readBody(req);
    const u = verify(String(b.username || ''), String(b.password || ''));
    if (!u) { fails.set(ip, { n: (f?.n || 0) + 1, until: Date.now() + 60_000 }); return send(res, 401, { error: 'Login gagal' }); }
    fails.delete(ip);
    const token = newSession(u.id);
    return send(res, 200, { username: u.username }, { 'Set-Cookie': `sid=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800` });
  }
  if (p === '/api/logout') { dropSession(cookie(req, 'sid')); return send(res, 200, { ok: true }, { 'Set-Cookie': 'sid=; HttpOnly; Path=/; Max-Age=0' }); }

  const user = sessionUser(cookie(req, 'sid'));
  if (!user) return send(res, 401, { error: 'Belum login' });
  if (p === '/api/me') return send(res, 200, user);

  // Kos: daftar milik akun ini, bikin baru, kelola anggota. Akses selalu dicek lewat memberships.
  if (p === '/api/kos' && req.method === 'GET') return send(res, 200, myKos(user.id));
  if (p === '/api/kos' && req.method === 'POST') {
    const name = String((await readBody(req)).name || '').trim();
    if (!name) return send(res, 400, { error: 'Nama kos wajib diisi' });
    return send(res, 201, { id: createKos(name, user.id) });
  }
  const km = p.match(/^\/api\/kos\/(\d+)\/members(?:\/(\d+))?$/);
  if (km) {
    const kid = Number(km[1]);
    if (!isMember(user.id, kid)) return send(res, 404, { error: 'Kos tidak ditemukan' });
    if (req.method === 'GET') return send(res, 200, members(kid));
    if (req.method === 'POST') {
      if (!addMember(kid, String((await readBody(req)).username || '').trim())) return send(res, 404, { error: 'Username tidak ditemukan' });
      return send(res, 200, members(kid));
    }
    if (req.method === 'DELETE' && km[2]) {
      if (!removeMember(kid, Number(km[2]))) return send(res, 400, { error: 'Kos harus punya minimal satu anggota' });
      return send(res, 200, members(kid));
    }
    return send(res, 405, { error: 'Method not allowed' });
  }

  // Semua data bisnis di bawah ini terikat ke kos aktif (header X-Kos-Id) dan wajib anggota.
  const kos = Number(req.headers['x-kos-id']);
  if (!kos || !isMember(user.id, kos)) return send(res, 403, { error: 'Pilih kos dulu' });
  if (p === '/api/dashboard') return send(res, 200, dashboard(kos));
  if (p === '/api/password' && req.method === 'POST') {
    const b = await readBody(req);
    if (!b.oldPassword || !b.newPassword) return send(res, 400, { error: 'Isi password lama dan baru' });
    if (!changePassword(user.id, String(b.oldPassword), String(b.newPassword))) return send(res, 400, { error: 'Password lama salah' });
    return send(res, 200, { ok: true }, { 'Set-Cookie': 'sid=; HttpOnly; Path=/; Max-Age=0' });
  }

  if (p === '/api/quote') return send(res, 200, quoteMonths(kos, Number(url.searchParams.get('room_id')), url.searchParams.get('check_in'), url.searchParams.get('months')));
  if (p === '/api/bookings/batch' && req.method === 'POST') return send(res, 201, createBatch(kos, await readBody(req)));
  const pay = p.match(/^\/api\/bookings\/(\d+)\/pay$/);
  if (pay && req.method === 'POST') return send(res, 200, payBooking(kos, Number(pay[1]), await readBody(req)));
  const m = p.match(/^\/api\/([a-z-]+)(?:\/(\d+))?$/);
  if (!m || !isResource(m[1])) return send(res, 404, { error: 'Not found' });
  const [, t, id] = m;
  if (req.method === 'GET' && !id) return send(res, 200, list(kos, t, Object.fromEntries(url.searchParams)));
  if (req.method === 'POST' && !id) return send(res, 201, create(kos, t, await readBody(req)));
  if (req.method === 'PUT' && id) return send(res, 200, update(kos, t, Number(id), await readBody(req)));
  if (req.method === 'DELETE' && id) return send(res, 200, remove(kos, t, Number(id)));
  return send(res, 405, { error: 'Method not allowed' });
}

function staticFile(res, pathname) {
  const root = resolve(DIST);
  const file = resolve(root, '.' + normalize(pathname === '/' ? '/index.html' : pathname));
  const safe = file.startsWith(root + sep);
  const target = safe && existsSync(file) && statSync(file).isFile() ? file : join(root, 'index.html');
  if (!existsSync(target)) { res.writeHead(404); return res.end('Build dulu: npm run build'); }
  // index.html & sw.js harus selalu segar (update PWA); aset Vite ber-hash aman di-cache lama.
  const cache = target.startsWith(join(root, 'assets') + sep) ? 'public, max-age=31536000, immutable' : 'no-cache';
  res.writeHead(200, { 'Content-Type': MIME[extname(target)] || 'application/octet-stream', 'Cache-Control': cache });
  res.end(readFileSync(target));
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    staticFile(res, url.pathname);
  } catch (e) {
    if (e instanceof HttpError) return send(res, e.status, { error: e.message });
    if (e.message === 'bad json') return send(res, 400, { error: 'JSON tidak valid' });
    console.error(e);
    send(res, 500, { error: 'Server error' });
  }
}).listen(PORT, process.env.HOST || '127.0.0.1', () => console.log(`catetkos on :${PORT}`));
