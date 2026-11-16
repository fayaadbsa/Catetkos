import { db } from './db.js';

const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (s, n) => { const d = new Date(s + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return iso(d); };

// Insight kamar, okupansi, cashflow, balik modal. Semua dihitung dari DB.
export function dashboard(today = iso(new Date())) {
  const WIN = 30;
  const wStart = addDays(today, -WIN + 1);
  const wEnd = addDays(today, 1); // exclusive
  const rooms = db.prepare('SELECT * FROM rooms ORDER BY number').all();
  const bookings = db.prepare('SELECT b.*, r.number, r.type FROM bookings b JOIN rooms r ON r.id=b.room_id').all();

  // okupansi: malam terisi di window / (kamar * hari)
  let occNights = 0;
  for (const b of bookings) {
    const s = b.check_in > wStart ? b.check_in : wStart;
    const e = addDays(b.check_in, b.nights) < wEnd ? addDays(b.check_in, b.nights) : wEnd;
    if (e > s) occNights += (new Date(e) - new Date(s)) / 86400000;
  }
  const occupancy = rooms.length ? Math.round((occNights / (rooms.length * WIN)) * 100) : 0;

  const byType = {}, promoSplit = { promo: 0, normal: 0 };
  for (const b of bookings) {
    byType[b.type] ??= { revenue: 0, nights: 0 };
    byType[b.type].revenue += b.price;
    byType[b.type].nights += b.nights;
    promoSplit[b.is_promo ? 'promo' : 'normal'] += b.price;
  }

  const emptyRooms = rooms.map((r) => {
    const last = bookings.filter((b) => b.room_id === r.id).map((b) => addDays(b.check_in, b.nights)).sort().pop();
    const isOccupiedToday = bookings.some((b) => b.room_id === r.id && b.check_in <= today && addDays(b.check_in, b.nights) > today);
    return { id: r.id, number: r.number, type: r.type, occupied: isOccupiedToday,
      emptyDays: isOccupiedToday ? 0 : last ? Math.max(0, (new Date(today) - new Date(last)) / 86400000) : null };
  });

  // cashflow 6 bulan terakhir
  const ym = today.slice(0, 7);
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(ym + '-01T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() - i);
    months.push(d.toISOString().slice(0, 7));
  }
  const income = db.prepare("SELECT COALESCE(SUM(price),0) s FROM bookings WHERE paid=1 AND substr(check_in,1,7)=?");
  const outcome = db.prepare("SELECT COALESCE(SUM(amount),0) s FROM expenses WHERE substr(date,1,7)=?");
  const cashflow = months.map((m) => {
    const inc = income.get(m).s, exp = outcome.get(m).s;
    return { month: m, income: inc, expense: exp, net: inc - exp };
  });

  // balik modal: kumulatif net (semua waktu) vs total modal
  const totalIncome = db.prepare('SELECT COALESCE(SUM(price),0) s FROM bookings WHERE paid=1').get().s;
  const totalExp = db.prepare('SELECT COALESCE(SUM(amount),0) s FROM expenses').get().s;
  const capitalTotal = db.prepare('SELECT COALESCE(SUM(amount),0) s FROM capital').get().s;
  const cumNet = totalIncome - totalExp;
  const recent = cashflow.slice(-3).reduce((a, m) => a + m.net, 0) / 3;
  const paybackPct = capitalTotal ? Math.max(0, Math.round((cumNet / capitalTotal) * 100)) : null;
  const monthsLeft = capitalTotal > cumNet && recent > 0 ? Math.ceil((capitalTotal - cumNet) / recent) : null;

  const insights = [];
  for (const r of emptyRooms) {
    if (!r.occupied && r.emptyDays === null) insights.push(`Kamar ${r.number} (${r.type}) belum pernah disewa.`);
    else if (!r.occupied && r.emptyDays >= 3) insights.push(`Kamar ${r.number} (${r.type}) kosong ${r.emptyDays} hari. Pertimbangkan promo.`);
  }
  if (occupancy < 50) insights.push(`Okupansi 30 hari cuma ${occupancy}%. Cek harga dan promo.`);
  if (promoSplit.promo > promoSplit.normal && bookings.length) insights.push('Omzet lebih banyak dari promo. Pastikan margin masih aman.');
  if (!insights.length) insights.push('Aman. Belum ada sinyal bahaya.');

  return { today, occupancy, roomCount: rooms.length, byType, promoSplit, emptyRooms, cashflow,
    payback: { capitalTotal, cumNet, pct: paybackPct, monthsLeft, done: capitalTotal > 0 && cumNet >= capitalTotal },
    insights };
}
