// Usage: ADMIN_USERNAME=... ADMIN_PASSWORD=... npm run seed:admin
// Bikin akun admin. Aman diulang: kalau username sudah ada, skip. Tidak menghapus data.
import { db, createKos, myKos, addMember } from '../server/db.js';
import { createUser } from '../server/auth.js';

const u = process.env.ADMIN_USERNAME?.trim();
const p = process.env.ADMIN_PASSWORD;
if (!u || !p) { console.error('ADMIN_USERNAME dan ADMIN_PASSWORD wajib diisi'); process.exit(1); }
const ex = db.prepare('SELECT id FROM users WHERE username=?').get(u);
if (ex) console.log(`User ${u} sudah ada, skip.`);
else { createUser(u, p); console.log(`Admin ${u} dibuat.`); }
const id = ex?.id ?? db.prepare('SELECT id FROM users WHERE username=?').get(u).id;
if (!myKos(id).length) { // akun tanpa kos = nggak bisa ngapa-ngapain; kasih satu
  const first = db.prepare('SELECT id FROM kos ORDER BY id LIMIT 1').get();
  if (first && !db.prepare('SELECT 1 FROM memberships WHERE kos_id=?').get(first.id)) addMember(first.id, u); // kos #1 yatim (instalasi baru)
  else createKos(process.env.KOS_NAME || 'Kos saya', id);
}
