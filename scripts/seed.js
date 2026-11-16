// Usage: npm run seed [path/ke/seed.json]. Default: seed/*.json lalu fallback seed/example/.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { db } from '../server/db.js';

const file = process.argv[2] || (existsSync('seed/rooms.json') ? 'seed/rooms.json' : 'seed/example/rooms.json');
const dir = file.includes('example') ? 'seed/example' : 'seed';
const load = (n) => JSON.parse(readFileSync(`${dir}/${n}.json`, 'utf8'));

db.exec('DELETE FROM bookings; DELETE FROM expenses; DELETE FROM capital; DELETE FROM rooms;');
const insRoom = db.prepare('INSERT INTO rooms(number,type,price,promo_price,promo_start,promo_end) VALUES(?,?,?,?,?,?)');
const rooms = load('rooms');
for (const r of rooms) insRoom.run(r.number, r.type, r.price, r.promo_price ?? null, r.promo_start ?? null, r.promo_end ?? null);

const ids = Object.fromEntries(db.prepare('SELECT id, number FROM rooms').all().map((r) => [r.number, r.id]));
const ins = (t, cols, rows) => rows.forEach((r) => db.prepare(`INSERT INTO ${t}(${cols}) VALUES(${cols.split(',').map(() => '?').join(',')})`).run(...cols.split(',').map((c) => r[c] ?? null)));
ins('capital', 'date,item,type,amount,note', load('capital'));
ins('expenses', 'date,category,amount,note', load('expenses'));
ins('bookings', 'room_id,guest,check_in,nights,price,is_promo,paid,note', load('bookings').map((b) => ({ ...b, room_id: ids[b.room] })));
console.log(`Seed selesai dari ${dir}: ${rooms.length} kamar.`);
