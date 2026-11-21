import { db } from './db.js';
import { diffDays } from './resources.js';

const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (s, n) => { const d = new Date(s + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
const sum = (sql, ...p) => db.prepare(sql).get(...p).s;
const DEFAULT_TODAY = () => iso(new Date());

// Semua angka dari DB. Window 30 hari konsisten untuk okupansi, omzet tipe, promo, dan biaya per kategori.
export function dashboard(kos, today = DEFAULT_TODAY()) {
  const WIN = 30;
  const wStart = addDays(today, -WIN + 1);
  const wEnd = addDays(today, 1); // exclusive
  const rooms = db.prepare('SELECT r.id, r.number, t.name type FROM rooms r JOIN room_types t ON t.id=r.room_type_id WHERE r.archived=0 AND r.kos_id=? ORDER BY r.number').all(kos);
  const activeIds = new Set(rooms.map((r) => r.id));
  const bookings = db.prepare("SELECT b.*, t.name type FROM bookings b JOIN rooms r ON r.id=b.room_id JOIN room_types t ON t.id=r.room_type_id WHERE b.status!='cancelled' AND b.kos_id=?").all(kos);

  // okupansi: malam terisi di window / (kamar aktif * hari). check_out eksklusif.
  let occNights = 0;
  for (const b of bookings) {
    if (!activeIds.has(b.room_id)) continue;
    const s = b.check_in > wStart ? b.check_in : wStart;
    const e = b.check_out < wEnd ? b.check_out : wEnd;
    if (e > s) occNights += diffDays(s, e);
  }
  const occupancy = rooms.length ? Math.round((occNights / (rooms.length * WIN)) * 100) : 0;

  const inWin = bookings.filter((b) => b.check_in >= wStart && b.check_in < wEnd);
  const byType = {}, promoSplit = { promo: 0, normal: 0 };
  for (const b of inWin) {
    byType[b.type] ??= { revenue: 0, nights: 0 };
    byType[b.type].revenue += b.price_total;
    byType[b.type].nights += diffDays(b.check_in, b.check_out);
    promoSplit[b.promo_id ? 'promo' : 'normal'] += b.price_total;
  }

  const emptyRooms = rooms.map((r) => {
    const mine = bookings.filter((b) => b.room_id === r.id);
    const occupied = mine.some((b) => b.check_in <= today && b.check_out > today);
    const last = mine.map((b) => b.check_out).filter((d) => d <= today).sort().pop();
    const next = mine.map((b) => b.check_in).filter((d) => d > today).sort()[0] ?? null;
    return { id: r.id, number: r.number, type: r.type, occupied, upcoming: next, emptyDays: occupied ? 0 : last ? diffDays(last, today) : null };
  });

  // arus kas 6 bulan: income, expense (operasional), capital (investasi). net = income - expense.
  const ym = today.slice(0, 7);
  const months = [];
  for (let i = 5; i >= 0; i--) { const d = new Date(ym + '-01T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() - i); months.push(iso(d).slice(0, 7)); }
  const rows = db.prepare('SELECT substr(t.date,1,7) m, c.kind k, SUM(t.amount) s FROM transactions t JOIN categories c ON c.id=t.category_id WHERE t.kos_id=? AND t.date>=? GROUP BY m, k').all(kos, months[0] + '-01');
  const cashflow = months.map((m) => {
    const g = (k) => rows.find((r) => r.m === m && r.k === k)?.s ?? 0;
    return { month: m, income: g('income'), expense: g('expense'), capital: g('capital'), net: g('income') - g('expense') };
  });

  const total = (k) => sum('SELECT COALESCE(SUM(t.amount),0) s FROM transactions t JOIN categories c ON c.id=t.category_id WHERE t.kos_id=? AND c.kind=?', kos, k);
  const capitalTotal = total('capital');
  const cumNet = total('income') - total('expense');
  const recent = cashflow.slice(-3).reduce((a, m) => a + m.net, 0) / 3;
  const payback = {
    capitalTotal, cumNet,
    pct: capitalTotal ? Math.max(0, Math.round((cumNet / capitalTotal) * 100)) : null,
    monthsLeft: capitalTotal > cumNet && recent > 0 ? Math.ceil((capitalTotal - cumNet) / recent) : null,
    done: capitalTotal > 0 && cumNet >= capitalTotal,
  };

  // piutang: booking aktif yang belum lunas
  const unpaid = db.prepare(`SELECT b.id, b.check_in, b.price_total - COALESCE((SELECT SUM(amount) FROM transactions t WHERE t.booking_id=b.id),0) due
    FROM bookings b WHERE b.status!='cancelled' AND b.kos_id=?`).all(kos).filter((b) => b.due > 0);
  const receivable = { total: unpaid.reduce((a, b) => a + b.due, 0), count: unpaid.length, overdue: unpaid.filter((b) => b.check_in <= today).length };

  const depositHeld = sum('SELECT COALESCE(SUM(deposit),0) s FROM bookings WHERE kos_id=? AND deposit_paid_date IS NOT NULL AND deposit_returned_date IS NULL', kos);

  const expenseByCat = db.prepare("SELECT c.name, SUM(t.amount) value FROM transactions t JOIN categories c ON c.id=t.category_id WHERE t.kos_id=? AND c.kind='expense' AND t.date>=? AND t.date<? GROUP BY c.id ORDER BY value DESC").all(kos, wStart, wEnd);

  const insights = [];
  for (const r of emptyRooms) {
    if (r.occupied || (r.upcoming && diffDays(today, r.upcoming) <= 3)) continue;
    if (r.emptyDays === null) insights.push({ level: 'info', text: `Kamar ${r.number} (${r.type}) belum pernah disewa.` });
    else if (r.emptyDays >= 3) insights.push({ level: 'warn', text: `Kamar ${r.number} (${r.type}) kosong ${r.emptyDays} hari. Pertimbangkan promo.` });
  }
  if (rooms.length && occupancy < 50) insights.push({ level: 'warn', text: `Okupansi 30 hari cuma ${occupancy}%. Cek harga dan promo.` });
  if (receivable.overdue) insights.unshift({ level: 'urgent', text: `${receivable.overdue} booking belum lunas padahal sudah masuk. Tagih.` });
  if (promoSplit.promo > 0 && promoSplit.promo > promoSplit.normal) insights.push({ level: 'warn', text: 'Mayoritas omzet 30 hari datang dari promo. Pastikan margin masih aman.' });
  if (!insights.length) insights.push({ level: 'ok', text: 'Aman. Belum ada sinyal bahaya.' });

  return { today, occupancy, roomCount: rooms.length, byType, promoSplit, emptyRooms, cashflow, expenseByCat, payback, receivable, depositHeld, insights };
}
