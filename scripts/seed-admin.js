// Usage: npm run seed:admin (atau ADMIN_USERNAME=... ADMIN_PASSWORD=... npm run seed:admin)
// Bikin akun admin. Aman diulang: kalau username sudah ada, skip. Tidak menghapus data.
import readline from 'node:readline';
import { db, createKos, myKos, addMember } from '../server/db.js';
import { createUser } from '../server/auth.js';

const ask = (q, hidden = false) =>
  new Promise((ok) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: Boolean(process.stdin.isTTY),
    });
    let muted = false;
    if (hidden) {
      rl._writeToOutput = (s) => {
        if (!muted) rl.output.write(s);
      };
    }
    rl.question(q, (a) => {
      rl.close();
      if (hidden) process.stdout.write('\n');
      ok(a.trim());
    });
    if (hidden) muted = true;
  });

let u = process.env.ADMIN_USERNAME?.trim() || process.argv[2]?.trim();
let p = process.env.ADMIN_PASSWORD;

if (!u) {
  if (process.stdin.isTTY) {
    u = (await ask('Username admin [admin]: ')) || 'admin';
  } else {
    u = 'admin';
  }
}

if (!p) {
  const isTTY = Boolean(process.stdin.isTTY);
  p = await ask('Password admin: ', isTTY);
  if (!p) {
    console.error('Password tidak boleh kosong.');
    process.exit(1);
  }
  if (p.length < 8) {
    console.error('Password minimal 8 karakter.');
    process.exit(1);
  }
  if (isTTY) {
    const p2 = await ask('Ulangi password: ', true);
    if (p !== p2) {
      console.error('Password tidak sama.');
      process.exit(1);
    }
  }
}

const ex = db.prepare('SELECT id FROM users WHERE username=?').get(u);
if (ex) {
  console.log(`User ${u} sudah ada, skip.`);
} else {
  createUser(u, p);
  console.log(`Admin ${u} dibuat.`);
}

const id = ex?.id ?? db.prepare('SELECT id FROM users WHERE username=?').get(u).id;
if (!myKos(id).length) {
  // akun tanpa kos = nggak bisa ngapa-ngapain; kasih satu
  const first = db.prepare('SELECT id FROM kos ORDER BY id LIMIT 1').get();
  if (first && !db.prepare('SELECT 1 FROM memberships WHERE kos_id=?').get(first.id)) {
    addMember(first.id, u); // kos #1 yatim (instalasi baru)
  } else {
    createKos(process.env.KOS_NAME || 'Kos saya', id);
  }
}
