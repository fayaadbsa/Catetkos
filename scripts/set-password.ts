// Usage (di VPS): docker exec -it catetkos-prod node scripts/set-password.js <username>
// Minta password lewat prompt tersembunyi (tidak lewat argumen / chat). Hash scrypt + salt.
import readline from 'node:readline';
import { db } from '../server/db.js';
import { createUser, hashPw } from '../server/auth.js';

const username = process.argv[2]?.trim();
if (!username) { console.error('Usage: node scripts/set-password.js <username>'); process.exit(1); }
if (!process.stdin.isTTY) { console.error('Harus dijalankan interaktif (docker exec -it ...)'); process.exit(1); }

const ask = (q) => new Promise((ok) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  let muted = false;
  rl._writeToOutput = (s) => { if (!muted) rl.output.write(s); };
  rl.question(q, (a) => { rl.close(); process.stdout.write('\n'); ok(a); });
  muted = true;
});

const pw = await ask('Password baru: ');
if (pw.length < 8) { console.error('Minimal 8 karakter.'); process.exit(1); }
if ((await ask('Ulangi password: ')) !== pw) { console.error('Tidak sama.'); process.exit(1); }

const { salt, hash } = hashPw(pw);
const u = db.prepare('SELECT id FROM users WHERE username=?').get(username);
if (u) {
  db.prepare('UPDATE users SET hash=?, salt=? WHERE id=?').run(hash, salt, u.id);
  db.prepare('DELETE FROM sessions WHERE user_id=?').run(u.id);
  console.log(`Password ${username} diganti. Semua sesi dicabut.`);
} else {
  createUser(username, pw);
  console.log(`User ${username} dibuat.`);
}
