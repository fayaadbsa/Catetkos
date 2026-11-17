// Usage: ADMIN_USERNAME=... ADMIN_PASSWORD=... npm run seed:admin
// Bikin akun admin. Aman diulang: kalau username sudah ada, skip. Tidak menghapus data.
import { db } from '../server/db.js';
import { createUser } from '../server/auth.js';

const u = process.env.ADMIN_USERNAME?.trim();
const p = process.env.ADMIN_PASSWORD;
if (!u || !p) { console.error('ADMIN_USERNAME dan ADMIN_PASSWORD wajib diisi'); process.exit(1); }
if (p.length < 8) { console.error('ADMIN_PASSWORD minimal 8 karakter'); process.exit(1); }
if (db.prepare('SELECT id FROM users WHERE username=?').get(u)) { console.log(`User ${u} sudah ada, skip.`); process.exit(0); }
createUser(u, p);
console.log(`Admin ${u} dibuat.`);
