// Usage: TEST_PASSWORD=... npm run seed:test
// Akun uji many-to-many: tester1 -> Kos Melati + Kos Mawar, tester2 -> Kos Mawar saja. Idempotent.
import { db, createKos, myKos, addMember } from '../server/db.js';
import { createUser } from '../server/auth.js';

const pw = process.env.TEST_PASSWORD;
if (!pw) { console.error('TEST_PASSWORD wajib diisi'); process.exit(1); }
const kosId = (name) => db.prepare('SELECT id FROM kos WHERE name=?').get(name)?.id ?? createKos(name);
const user = (n) => { if (!db.prepare('SELECT 1 FROM users WHERE username=?').get(n)) createUser(n, pw); };
const join = (kos, n) => { if (!myKos(db.prepare('SELECT id FROM users WHERE username=?').get(n).id).some((k) => k.id === kos)) addMember(kos, n); };
['tester1', 'tester2'].forEach(user);
const melati = kosId('Kos Melati'), mawar = kosId('Kos Mawar');
join(melati, 'tester1'); join(mawar, 'tester1'); join(mawar, 'tester2');
console.log('Akun uji siap: tester1 (Melati+Mawar), tester2 (Mawar)');
