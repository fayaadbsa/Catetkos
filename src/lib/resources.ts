// Layer data: definisi entity, validasi, aturan bisnis. Tanpa HTTP, jadi gampang dites.
import type { Prisma } from '@/generated/prisma/client';
import { prisma } from './db';
import type { Row } from '@/lib/types';

type Tx = Prisma.TransactionClient;
type Rec = Record<string, any>;
type Def = Rec;

export class HttpError extends Error {
  constructor(
    public status: number,
    msg: string,
  ) {
    super(msg);
  }
}
function bad(m: string): never {
  throw new HttpError(400, m);
}
function conflict(m: string): never {
  throw new HttpError(409, m);
}

const validDate = (s: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(s + 'T00:00:00Z').toISOString().slice(0, 10) === s;
export const diffDays = (a: string, b: string) =>
  Math.round((+new Date(b + 'T00:00:00Z') - +new Date(a + 'T00:00:00Z')) / 86400000);
const rp = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

// Raw SQL lewat Prisma. Integer SQLite bisa balik sebagai BigInt, dinormalkan ke number.
const norm = (r: Rec): Rec =>
  Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === 'bigint' ? Number(v) : v]));
export const all = async (db: Tx, sql: string, ...p: unknown[]): Promise<Rec[]> =>
  (await db.$queryRawUnsafe<Rec[]>(sql, ...p)).map(norm);
export const one = async (db: Tx, sql: string, ...p: unknown[]): Promise<Rec | undefined> =>
  (await all(db, sql, ...p))[0];
const exec = (db: Tx, sql: string, ...p: unknown[]) => db.$executeRawUnsafe(sql, ...p);

const text = (label: string, o: Rec = {}) => ({ type: 'text', label, ...o });
const int = (label: string, o: Rec = {}) => ({ type: 'int', label, ...o });
const date = (label: string, o: Rec = {}) => ({ type: 'date', label, ...o });
const ref = (label: string, table: string, o: Rec = {}) => ({ type: 'ref', label, table, ...o });
const bool = (label: string) => ({ type: 'bool', label, def: 0 });

export const addMonths = (s: string, n: number) => {
  const [y, m, d] = s.split('-').map(Number),
    t = m - 1 + n;
  const yy = y + Math.floor(t / 12),
    mm = ((t % 12) + 12) % 12;
  const dim = new Date(Date.UTC(yy, mm + 1, 0)).getUTCDate(); // 31 Jan + 1 bulan = 28 Feb
  return `${yy}-${String(mm + 1).padStart(2, '0')}-${String(Math.min(d, dim)).padStart(2, '0')}`;
};

// Harga per BULAN: promo aktif pada tanggal masuk (per tipe atau semua tipe) else harga kamar.
export async function quote(db: Tx, kos: number, roomId: number, checkIn: string) {
  if (!validDate(String(checkIn))) bad('Tanggal tidak valid');
  const room = await one(
    db,
    'SELECT r.id, r.room_type_id, COALESCE(r.price_override, t.base_price) price FROM rooms r JOIN room_types t ON t.id=r.room_type_id WHERE r.id=? AND r.kos_id=?',
    roomId,
    kos,
  );
  if (!room) bad('Kamar tidak ditemukan');
  const promo = await one(
    db,
    'SELECT id, name, price FROM promos WHERE kos_id=? AND (room_type_id IS NULL OR room_type_id=?) AND ? BETWEEN start_date AND end_date ORDER BY price LIMIT 1',
    kos,
    room.room_type_id,
    checkIn,
  );
  const rate = promo ? promo.price : room.price;
  return {
    rate,
    normal_rate: room.price,
    promo_id: promo?.id ?? null,
    promo_name: promo?.name ?? null,
    total: rate,
  };
}
const monthCount = (m: unknown) => {
  const n = Number(m ?? 1);
  if (!Number.isInteger(n) || n < 1 || n > 12) bad('Durasi harus 1-12 bulan');
  return n;
};
// Rincian N bulan berurutan dari tgl masuk. Tiap bulan dinilai promonya sendiri.
export async function quoteMonths(kos: number, roomId: number, checkIn: string, months: unknown) {
  const n = monthCount(months);
  if (!validDate(String(checkIn))) bad('Tanggal tidak valid');
  const items = await Promise.all(
    Array.from({ length: n }, async (_, i) => ({
      check_in: addMonths(checkIn, i),
      check_out: addMonths(checkIn, i + 1),
      ...(await quote(prisma, kos, roomId, addMonths(checkIn, i))),
    })),
  );
  return { items, total: items.reduce((a, x) => a + x.total, 0) };
}

const paidOf = async (db: Tx, bookingId: number, exceptTx: number | null = null) =>
  (await one(
    db,
    'SELECT COALESCE(SUM(amount),0) s FROM transactions WHERE booking_id=? AND id IS NOT ?',
    bookingId,
    exceptTx,
  ))!.s as number;

const R: Record<string, Def> = {
  'room-types': {
    table: 'room_types',
    scope: 't.kos_id',
    inUse: 'Tipe masih dipakai kamar. Arsipkan saja.',
    fields: {
      name: text('Nama tipe', { req: 1 }),
      base_price: int('Harga dasar', { req: 1, min: 0 }),
      capacity: int('Kapasitas', { min: 1, def: 1 }),
      archived: bool('Arsip'),
    },
    list: 'SELECT t.*, (SELECT COUNT(*) FROM rooms r WHERE r.room_type_id=t.id AND r.archived=0) room_count FROM room_types t ORDER BY t.name',
  },
  rooms: {
    table: 'rooms',
    scope: 'r.kos_id',
    inUse: 'Kamar punya booking. Arsipkan saja.',
    fields: {
      number: text('No kamar', { req: 1 }),
      room_type_id: ref('Tipe', 'room_types', { req: 1 }),
      price_override: int('Harga khusus', { min: 0 }),
      archived: bool('Arsip'),
    },
    list: 'SELECT r.*, t.name type_name, COALESCE(r.price_override, t.base_price) price FROM rooms r JOIN room_types t ON t.id=r.room_type_id ORDER BY r.number',
  },
  promos: {
    table: 'promos',
    scope: 'p.kos_id',
    fields: {
      name: text('Nama promo', { req: 1 }),
      room_type_id: ref('Tipe', 'room_types'),
      price: int('Harga promo', { req: 1, min: 0 }),
      start_date: date('Mulai', { req: 1 }),
      end_date: date('Sampai', { req: 1 }),
    },
    check: async (_db: Tx, v: Rec) => {
      if (v.end_date < v.start_date) bad('Tanggal akhir sebelum tanggal mulai');
    },
    list: 'SELECT p.*, t.name type_name FROM promos p LEFT JOIN room_types t ON t.id=p.room_type_id ORDER BY p.start_date DESC',
  },
  guests: {
    table: 'guests',
    scope: 'g.kos_id',
    inUse: 'Tamu punya booking.',
    fields: { name: text('Nama', { req: 1 }), phone: text('HP'), note: text('Catatan') },
    list: 'SELECT g.*, (SELECT COUNT(*) FROM bookings b WHERE b.guest_id=g.id) booking_count FROM guests g ORDER BY g.name',
  },
  categories: {
    table: 'categories',
    scope: 'c.kos_id',
    inUse: 'Kategori sudah dipakai transaksi.',
    fields: {
      kind: { type: 'enum', label: 'Jenis', req: 1, of: ['income', 'expense', 'capital'] },
      name: text('Nama', { req: 1 }),
    },
    list: 'SELECT c.*, (SELECT COUNT(*) FROM transactions t WHERE t.category_id=c.id) uses FROM categories c ORDER BY c.kind, c.name',
  },
  bookings: {
    table: 'bookings',
    scope: 'b.kos_id',
    inUse: 'Booking punya pembayaran. Hapus pembayarannya dulu.',
    fields: {
      room_id: ref('Kamar', 'rooms', { req: 1 }),
      guest_id: ref('Tamu', 'guests', { req: 1 }),
      promo_id: ref('Promo', 'promos'),
      check_in: date('Check-in', { req: 1 }),
      check_out: date('Check-out', { req: 1 }),
      price_total: int('Total harga', { min: 0 }),
      status: {
        type: 'enum',
        label: 'Status',
        of: ['booked', 'checked_in', 'checked_out', 'cancelled'],
        def: 'booked',
      },
      note: text('Catatan'),
      deposit: int('Deposit', { min: 0, def: 0 }),
      deposit_paid_date: date('Deposit diterima'),
      deposit_returned_date: date('Deposit dikembalikan'),
    },
    // Tamu baru bisa diketik langsung (guest_name) tanpa buka halaman Tamu.
    pre: async (db: Tx, b: Rec, kos: number) => {
      if (!b.check_out && validDate(String(b.check_in))) b.check_out = addMonths(b.check_in, 1); // default sebulan
      if (!b.guest_id && String(b.guest_name || '').trim())
        b.guest_id = (
          await db.guest.create({ data: { name: b.guest_name.trim(), kosId: kos } })
        ).id;
    },
    check: async (db: Tx, v: Rec, id?: number, cur?: Rec) => {
      if (v.check_out <= v.check_in) bad('Check-out harus setelah check-in');
      const room = (await one(db, 'SELECT archived FROM rooms WHERE id=?', v.room_id))!;
      if (room.archived && !id) bad('Kamar sudah diarsipkan');
      if (
        v.status !== 'cancelled' &&
        (await one(
          db,
          "SELECT 1 x FROM bookings WHERE room_id=? AND status!='cancelled' AND id IS NOT ? AND check_in<? AND check_out>?",
          v.room_id,
          id ?? null,
          v.check_out,
          v.check_in,
        ))
      )
        conflict('Kamar bentrok dengan booking lain di tanggal itu');
      if (v.deposit_returned_date && !v.deposit_paid_date)
        bad('Deposit belum diterima, nggak bisa dikembalikan');
      const q = await quote(db, v.kos_id, v.room_id, v.check_in);
      if (v.price_total === null) {
        v.price_total = q.total;
        v.promo_id = q.promo_id;
      } else if (
        !cur ||
        v.price_total !== cur.price_total ||
        v.check_in !== cur.check_in ||
        v.room_id !== cur.room_id
      )
        v.promo_id = v.price_total === q.total ? q.promo_id : null; // harga manual = bukan promo
      if (id && v.price_total < (await paidOf(db, id)))
        bad('Total harga lebih kecil dari yang sudah dibayar');
    },
    // Status dihitung dari tanggal. Cuma 'cancelled' yang disimpan manual.
    post: (rows: Rec[]) => {
      const t = new Date().toISOString().slice(0, 10);
      return rows.map((b) =>
        b.status === 'cancelled'
          ? b
          : {
              ...b,
              status: t < b.check_in ? 'booked' : t >= b.check_out ? 'checked_out' : 'checked_in',
            },
      );
    },
    list: `SELECT b.*, r.number room_number, g.name guest_name, g.phone guest_phone,
      COALESCE((SELECT SUM(amount) FROM transactions t WHERE t.booking_id=b.id),0) paid,
      (SELECT MAX(date) FROM transactions t WHERE t.booking_id=b.id) paid_date
      FROM bookings b JOIN rooms r ON r.id=b.room_id JOIN guests g ON g.id=b.guest_id ORDER BY b.check_in DESC, b.id DESC`,
  },
  transactions: {
    table: 'transactions',
    scope: 't.kos_id',
    fields: {
      category_id: ref('Kategori', 'categories', { req: 1 }),
      booking_id: ref('Booking', 'bookings'),
      room_id: ref('Kamar', 'rooms'),
      date: date('Tanggal', { req: 1 }),
      amount: int('Nominal', { req: 1, min: 1 }),
      method: text('Metode'),
      note: text('Catatan'),
    },
    // Bayar booking tanpa kategori = otomatis "Sewa kamar".
    pre: async (db: Tx, b: Rec, kos: number) => {
      if (b.booking_id && !b.category_id)
        b.category_id = (
          await one(
            db,
            "SELECT id FROM categories WHERE kos_id=? AND kind='income' AND name='Sewa kamar'",
            kos,
          )
        )?.id;
    },
    check: async (db: Tx, v: Rec, id?: number) => {
      const cat = (await one(db, 'SELECT kind FROM categories WHERE id=?', v.category_id))!;
      if (!v.booking_id) return;
      if (cat.kind !== 'income') bad('Pembayaran booking harus kategori pemasukan');
      const b = (await one(db, 'SELECT price_total FROM bookings WHERE id=?', v.booking_id))!;
      const left = b.price_total - (await paidOf(db, v.booking_id, id ?? null));
      if (v.amount > left) bad(`Melebihi tagihan booking. Sisa ${rp(left)}`);
    },
    list: `SELECT t.*, c.kind, c.name category, r.number room_number, g.name guest_name
      FROM transactions t JOIN categories c ON c.id=t.category_id LEFT JOIN rooms r ON r.id=t.room_id
      LEFT JOIN bookings b ON b.id=t.booking_id LEFT JOIN guests g ON g.id=b.guest_id`,
    filter: (q: Rec): [string, unknown[]] =>
      ['income', 'expense', 'capital'].includes(q.kind) ? [' AND c.kind=?', [q.kind]] : ['', []],
    order: ' ORDER BY t.date DESC, t.id DESC',
  },
};
export const isResource = (n: string) => Object.hasOwn(R, n);

async function clean(db: Tx, def: Def, kos: number, body: Rec, cur: Rec = {}) {
  const out: Rec = { kos_id: kos };
  for (const [k, f] of Object.entries<Rec>(def.fields)) {
    let v = body[k] !== undefined ? body[k] : k in cur ? cur[k] : (f.def ?? null);
    if (v === '') v = null;
    if (v === null && f.def !== undefined) v = f.def; // field kosong/nggak dikirim = default (bool Arsip, kapasitas)
    if (v === null) {
      if (f.req) bad(`${f.label} wajib diisi`);
      out[k] = null;
      continue;
    }
    if (f.type === 'text') {
      v = String(v).trim();
      if (!v && f.req) bad(`${f.label} wajib diisi`);
      out[k] = v || null;
    } else if (f.type === 'int') {
      v = Number(v);
      if (!Number.isInteger(v) || v < (f.min ?? -Infinity))
        bad(`${f.label} harus angka bulat${f.min !== undefined ? ` >= ${f.min}` : ''}`);
      out[k] = v;
    } else if (f.type === 'bool') out[k] = v ? 1 : 0;
    else if (f.type === 'date') {
      if (!validDate(String(v))) bad(`${f.label} harus tanggal YYYY-MM-DD`);
      out[k] = v;
    } else if (f.type === 'enum') {
      if (!f.of.includes(v)) bad(`${f.label} harus salah satu: ${f.of.join(', ')}`);
      out[k] = v;
    } else if (f.type === 'ref') {
      v = Number(v);
      if (!(await one(db, `SELECT 1 x FROM ${f.table} WHERE id=? AND kos_id=?`, v, kos)))
        bad(`${f.label} tidak ditemukan`);
      out[k] = v;
    }
  }
  return out;
}

// Satu transaksi DB + terjemah error constraint SQLite ke pesan yang manusiawi.
async function guard<T>(def: Def, fn: (db: Tx) => Promise<T>): Promise<T> {
  try {
    return await prisma.$transaction(fn);
  } catch (e) {
    if (e instanceof HttpError) throw e;
    const m = String((e as Error)?.message ?? e) + JSON.stringify((e as Rec)?.meta ?? '');
    if (/UNIQUE constraint/i.test(m)) conflict('Data dengan nama/nomor itu sudah ada');
    if (/FOREIGN KEY constraint/i.test(m)) conflict(def.inUse || 'Masih dipakai data lain');
    if (/CHECK constraint/i.test(m)) bad('Data tidak lolos validasi');
    throw e;
  }
}

export async function list(kos: number, name: string, q: Rec = {}): Promise<Row[]> {
  const d = R[name];
  const [where, params] = d.filter ? d.filter(q) : ['', []];
  const [base, ord] = d.list.split(' ORDER BY '); // ORDER BY harus setelah WHERE
  const rows = await all(
    prisma,
    `${base} WHERE ${d.scope}=?${where}${ord ? ' ORDER BY ' + ord : d.order || ''}`,
    kos,
    ...params,
  );
  return (d.post ? d.post(rows) : rows) as Row[];
}

async function insert(db: Tx, d: Def, kos: number, body: Rec) {
  await d.pre?.(db, body, kos);
  const v = await clean(db, d, kos, body);
  await d.check?.(db, v);
  const cols = Object.keys(v);
  await exec(
    db,
    `INSERT INTO ${d.table}(${cols.join(',')}) VALUES(${cols.map(() => '?').join(',')})`,
    ...Object.values(v),
  );
  return Number((await one(db, 'SELECT last_insert_rowid() id'))!.id);
}
export const create = (kos: number, name: string, body: Rec) => {
  const d = R[name];
  return guard(d, async (db) => ({ id: await insert(db, d, kos, body) }));
};

// Booking N bulan sekaligus = N baris (1 per bulan), atomik: satu bulan bentrok, semua batal.
// Deposit + status bayar cuma nempel di bulan pertama.
export function createBatch(kos: number, body: Rec) {
  const d = R.bookings;
  return guard(d, async (db) => {
    const n = monthCount(body.months);
    if (!validDate(String(body.check_in))) bad('Tgl masuk tidak valid');
    await d.pre(db, body, kos);
    const ids: number[] = [];
    for (let i = 0; i < n; i++) {
      const first = i === 0;
      const id = await insert(db, d, kos, {
        room_id: body.room_id,
        guest_id: body.guest_id,
        note: body.note,
        check_in: addMonths(body.check_in, i),
        check_out: addMonths(body.check_in, i + 1),
        deposit: first ? (body.deposit ?? 0) : 0,
        deposit_paid_date: first ? body.deposit_paid_date : null,
      });
      if (first && body.paid_date)
        await insert(db, R.transactions, kos, {
          booking_id: id,
          date: body.paid_date,
          amount: (await one(db, 'SELECT price_total p FROM bookings WHERE id=?', id))!.p,
        });
      ids.push(id);
    }
    return { ids };
  });
}

// Tandai lunas = 1 transaksi senilai sisa tagihan (kategori Sewa kamar). paid:false = batalkan semua pembayaran booking itu.
export function payBooking(kos: number, id: number, body: Rec) {
  return guard(R.bookings, async (db) => {
    const b = await one(
      db,
      'SELECT price_total, status FROM bookings WHERE id=? AND kos_id=?',
      id,
      kos,
    );
    if (!b) throw new HttpError(404, 'Data tidak ada');
    if (body.paid === false) {
      await exec(db, 'DELETE FROM transactions WHERE booking_id=?', id);
      return { ok: true };
    }
    if (b.status === 'cancelled') bad('Booking sudah dibatalkan');
    const due = b.price_total - (await paidOf(db, id));
    if (due > 0)
      await insert(db, R.transactions, kos, { booking_id: id, date: body.date, amount: due });
    return { ok: true };
  });
}

// Update = merge dengan baris lama, jadi field yang nggak dikirim nggak ketimpa NULL.
export function update(kos: number, name: string, id: number, body: Rec) {
  const d = R[name];
  return guard(d, async (db) => {
    const cur = await one(db, `SELECT * FROM ${d.table} WHERE id=? AND kos_id=?`, id, kos);
    if (!cur) throw new HttpError(404, 'Data tidak ada');
    await d.pre?.(db, body, kos);
    const v = await clean(db, d, kos, body, cur);
    await d.check?.(db, v, id, cur);
    await exec(
      db,
      `UPDATE ${d.table} SET ${Object.keys(v)
        .map((c) => c + '=?')
        .join(',')} WHERE id=?`,
      ...Object.values(v),
      id,
    );
    return { ok: true };
  });
}

export function remove(kos: number, name: string, id: number) {
  const d = R[name];
  return guard(d, async (db) => {
    if (!(await exec(db, `DELETE FROM ${d.table} WHERE id=? AND kos_id=?`, id, kos)))
      throw new HttpError(404, 'Data tidak ada');
    return { ok: true };
  });
}
