import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { db } from './db.js';
import { createUser, verify, newSession, sessionUser, dropSession } from './auth.js';
import { dashboard } from './dashboard.js';

const PORT = process.env.PORT || 3005;
const DIST = 'dist';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon' };

// CRUD tabel sederhana: whitelist kolom biar aman dari SQL injection
const TABLES = {
  rooms: ['number', 'type', 'price', 'promo_price', 'promo_start', 'promo_end'],
  bookings: ['room_id', 'guest', 'check_in', 'nights', 'price', 'is_promo', 'paid', 'note'],
  expenses: ['date', 'category', 'amount', 'note'],
  capital: ['date', 'item', 'type', 'amount', 'note'],
};
const pick = (t, body) => TABLES[t].map((c) => (body[c] === undefined ? null : body[c]));

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
  if (p === '/api/status') return send(res, 200, { setup: db.prepare('SELECT COUNT(*) c FROM users').get().c === 0, rooms: db.prepare('SELECT COUNT(*) c FROM rooms').get().c });
  if (p === '/api/setup' && req.method === 'POST') {
    if (db.prepare('SELECT COUNT(*) c FROM users').get().c) return send(res, 403, { error: 'Sudah di-setup' });
    const b = await readBody(req);
    if (!b.username || !b.password || b.password.length < 8) return send(res, 400, { error: 'Username wajib, password min 8 karakter' });
    createUser(b.username, b.password);
    return send(res, 201, { ok: true });
  }
  if (p === '/api/login' && req.method === 'POST') {
    const b = await readBody(req);
    const u = verify(String(b.username || ''), String(b.password || ''));
    if (!u) return send(res, 401, { error: 'Login gagal' });
    const token = newSession(u.id);
    return send(res, 200, { username: u.username }, { 'Set-Cookie': `sid=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800` });
  }
  if (p === '/api/logout') { dropSession(cookie(req, 'sid')); return send(res, 200, { ok: true }, { 'Set-Cookie': 'sid=; HttpOnly; Path=/; Max-Age=0' }); }

  const user = sessionUser(cookie(req, 'sid'));
  if (!user) return send(res, 401, { error: 'Belum login' });
  if (p === '/api/me') return send(res, 200, user);
  if (p === '/api/dashboard') return send(res, 200, dashboard());

  const m = p.match(/^\/api\/(rooms|bookings|expenses|capital)(?:\/(\d+))?$/);
  if (!m) return send(res, 404, { error: 'Not found' });
  const [, t, id] = m;
  if (req.method === 'GET' && !id) return send(res, 200, db.prepare(`SELECT * FROM ${t} ORDER BY id DESC`).all());
  if (req.method === 'POST' && !id) {
    const body = await readBody(req);
    const cols = TABLES[t];
    const r = db.prepare(`INSERT INTO ${t}(${cols.join(',')}) VALUES(${cols.map(() => '?').join(',')})`).run(...pick(t, body));
    return send(res, 201, { id: Number(r.lastInsertRowid) });
  }
  if (req.method === 'PUT' && id) {
    const body = await readBody(req);
    db.prepare(`UPDATE ${t} SET ${TABLES[t].map((c) => c + '=?').join(',')} WHERE id=?`).run(...pick(t, body), id);
    return send(res, 200, { ok: true });
  }
  if (req.method === 'DELETE' && id) {
    db.prepare(`DELETE FROM ${t} WHERE id=?`).run(id);
    return send(res, 200, { ok: true });
  }
  return send(res, 405, { error: 'Method not allowed' });
}

function staticFile(res, pathname) {
  const root = resolve(DIST);
  const file = resolve(root, '.' + normalize(pathname === '/' ? '/index.html' : pathname));
  const safe = file.startsWith(root + sep);
  const target = safe && existsSync(file) && statSync(file).isFile() ? file : join(root, 'index.html');
  if (!existsSync(target)) { res.writeHead(404); return res.end('Build dulu: npm run build'); }
  res.writeHead(200, { 'Content-Type': MIME[extname(target)] || 'application/octet-stream' });
  res.end(readFileSync(target));
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    staticFile(res, url.pathname);
  } catch (e) {
    console.error(e);
    send(res, 500, { error: 'Server error' });
  }
}).listen(PORT, '127.0.0.1', () => console.log(`catetkos on :${PORT}`));
