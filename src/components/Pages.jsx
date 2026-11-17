// Konfigurasi tiap halaman di atas Crud generik.
import { useState } from 'react';
import { Wallet } from 'lucide-react';
import { api, rp, toast, today, cn } from '../lib/api.js';
import { useList } from '../lib/useList.js';
import Crud from './Crud.jsx';
import PromoCalc from './PromoCalc.jsx';
import { Badge, Button, Input, Label, Modal } from './ui.jsx';

const opts = (rows, l) => rows.map((r) => ({ v: r.id, l: l(r) }));
const STATUS = { booked: ['Booked', '#fbbf24'], checked_in: ['Menginap', '#34d399'], checked_out: ['Selesai', '#a1a1aa'], cancelled: ['Batal', '#fb7185'] };

export const Tabs = ({ tabs, value, onChange }) => (
  <div className="flex gap-1 overflow-x-auto rounded-lg bg-zinc-900 p-1" role="tablist">
    {tabs.map(([k, l]) => (
      <button key={k} role="tab" aria-selected={value === k} onClick={() => onChange(k)}
        className={cn('whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-semibold', value === k ? 'bg-zinc-800 text-emerald-300' : 'text-zinc-400 hover:text-zinc-200')}>{l}</button>
    ))}
  </div>
);

export function Rooms() {
  const [tab, setTab] = useState('rooms');
  const [types, reloadTypes] = useList('room-types');
  return (
    <div className="space-y-4">
      <Tabs tabs={[['rooms', 'Kamar'], ['types', 'Tipe kamar']]} value={tab} onChange={setTab} />
      {tab === 'types' ? (
        <Crud key="types" resource="room-types" title="Tipe kamar" onSaved={reloadTypes} empty="Belum ada tipe. Bikin dulu, baru kamar."
          columns={[{ key: 'name', label: 'Tipe' }, { key: 'base_price', label: 'Harga dasar', fmt: (r) => rp(r.base_price) }, { key: 'capacity', label: 'Kapasitas' }, { key: 'room_count', label: 'Kamar aktif' }, { key: 'archived', label: 'Status', fmt: (r) => (r.archived ? <Badge>Arsip</Badge> : <Badge color="#34d399">Aktif</Badge>) }]}
          fields={[{ key: 'name', label: 'Nama tipe', req: 1 }, { key: 'base_price', label: 'Harga dasar / malam', type: 'number', req: 1 }, { key: 'capacity', label: 'Kapasitas', type: 'number' }, { key: 'archived', label: 'Arsip', type: 'bool' }]}
          defaults={{ capacity: 1 }} bare />
      ) : (
        <Crud key="rooms" resource="rooms" title="Kamar" empty={types.length ? 'Belum ada kamar.' : 'Bikin tipe kamar dulu di tab sebelah.'} canAdd={types.length > 0} bare
          columns={[{ key: 'number', label: 'No' }, { key: 'type_name', label: 'Tipe' }, { key: 'price', label: 'Harga / malam', fmt: (r) => rp(r.price) + (r.price_override ? ' *' : '') }, { key: 'archived', label: 'Status', fmt: (r) => (r.archived ? <Badge>Arsip</Badge> : <Badge color="#34d399">Aktif</Badge>) }]}
          fields={[{ key: 'number', label: 'No kamar', req: 1 }, { key: 'room_type_id', label: 'Tipe', type: 'select', req: 1, options: opts(types, (t) => `${t.name} (${rp(t.base_price)})`) },
            { key: 'price_override', label: 'Harga khusus (opsional)', type: 'number', hint: () => 'Kosongkan buat pakai harga tipe. Tanda * di tabel = harga khusus.' }, { key: 'archived', label: 'Arsip', type: 'bool' }]} />
      )}
    </div>
  );
}

export function Guests() {
  return (
    <Crud resource="guests" title="Tamu" empty="Belum ada tamu. Otomatis muncul saat bikin booking."
      columns={[{ key: 'name', label: 'Nama' }, { key: 'phone', label: 'HP' }, { key: 'booking_count', label: 'Booking' }, { key: 'note', label: 'Catatan' }]}
      fields={[{ key: 'name', label: 'Nama', req: 1 }, { key: 'phone', label: 'HP' }, { key: 'note', label: 'Catatan' }]} />
  );
}

export function Promos() {
  const [types] = useList('room-types');
  return (
    <div className="space-y-6">
      <Crud resource="promos" title="Promo" empty="Belum ada promo."
        columns={[{ key: 'name', label: 'Promo' }, { key: 'type_name', label: 'Tipe', fmt: (r) => r.type_name || 'Semua tipe' }, { key: 'price', label: 'Harga', fmt: (r) => rp(r.price) }, { key: 'start_date', label: 'Mulai' }, { key: 'end_date', label: 'Sampai' }]}
        fields={[{ key: 'name', label: 'Nama promo', req: 1 }, { key: 'room_type_id', label: 'Tipe kamar', type: 'select', options: opts(types, (t) => t.name), hint: () => 'Kosong = berlaku semua tipe' },
          { key: 'price', label: 'Harga promo / malam', type: 'number', req: 1 }, { key: 'start_date', label: 'Mulai', type: 'date', req: 1 }, { key: 'end_date', label: 'Sampai', type: 'date', req: 1 }]} />
      <PromoCalc />
    </div>
  );
}

function PayModal({ b, onClose, onDone }) {
  const due = b.price_total - b.paid;
  const [f, setF] = useState({ amount: due, date: today(), method: '' });
  const go = async (e) => {
    e.preventDefault();
    try { await api('/transactions', { body: { booking_id: b.id, ...f, amount: Number(f.amount) } }); toast('Pembayaran dicatat'); onDone(); onClose(); } catch (err) { toast(err.message, true); }
  };
  return (
    <Modal title={`Bayar: ${b.guest_name} (kamar ${b.room_number})`} onClose={onClose}>
      <form onSubmit={go} className="grid gap-3 md:grid-cols-3">
        <p className="col-span-full text-sm text-zinc-400">Total {rp(b.price_total)} · sudah {rp(b.paid)} · sisa {rp(due)}</p>
        <Label>Nominal<Input type="number" min="1" max={due} required value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Label>
        <Label>Tanggal<Input type="date" required value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Label>
        <Label>Metode<Input placeholder="transfer / tunai" value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })} /></Label>
        <div className="col-span-full"><Button>Catat</Button></div>
      </form>
    </Modal>
  );
}

export function Bookings() {
  const [rooms] = useList('rooms');
  const [guests, reloadGuests] = useList('guests');
  const [pay, setPay] = useState(null);
  const [v, setV] = useState(0); // paksa Crud muat ulang setelah bayar
  const active = rooms.filter((r) => !r.archived);
  const quoteIfReady = async (f, patch) => {
    if (!('room_id' in patch || 'check_in' in patch || 'check_out' in patch)) return;
    if (!f.room_id || !f.check_in || !f.check_out || f.check_out <= f.check_in) return { __quote: null };
    try {
      const q = await api(`/quote?room_id=${f.room_id}&check_in=${f.check_in}&check_out=${f.check_out}`);
      return { price_total: q.total, __quote: `${q.nights} malam × ${rp(q.rate)}${q.promo_name ? ` (promo ${q.promo_name}, normal ${rp(q.normal_rate)})` : ''}` };
    } catch { return { __quote: null }; }
  };
  const st = (r) => <Badge color={STATUS[r.status][1]}>{STATUS[r.status][0]}</Badge>;
  return (
    <>
      <Crud key={v} resource="bookings" title="Booking" canAdd={active.length > 0} empty={active.length ? 'Belum ada booking.' : 'Bikin kamar dulu di menu Kamar.'}
        defaults={{ status: 'booked' }} onChange={quoteIfReady} onSaved={reloadGuests}
        columns={[{ key: 'guest_name', label: 'Tamu' }, { key: 'room_number', label: 'Kamar' }, { key: 'check_in', label: 'Check-in' }, { key: 'check_out', label: 'Check-out' },
          { key: 'price_total', label: 'Total', fmt: (r) => rp(r.price_total) + (r.promo_id ? ' · promo' : '') }, { key: 'status', label: 'Status', fmt: st },
          { key: 'paid', label: 'Bayar', fmt: (r) => (r.paid >= r.price_total ? <Badge color="#34d399">Lunas</Badge> : <Badge color={r.paid ? '#fbbf24' : '#fb7185'}>{r.paid ? `DP ${rp(r.paid)}` : 'Belum'}</Badge>) }]}
        actions={(r) => r.status !== 'cancelled' && r.paid < r.price_total && <Button variant="ghost" className="text-emerald-300" onClick={() => setPay(r)}><Wallet size={15} /> Bayar</Button>}
        fields={[
          { key: 'room_id', label: 'Kamar', type: 'select', req: 1, options: opts(active, (r) => `${r.number} · ${r.type_name}`) },
          { key: 'guest_id', label: 'Tamu', type: 'select', options: opts(guests, (g) => g.name), req: 0, hint: () => 'Pilih tamu lama, atau ketik nama baru di bawah' },
          { key: 'guest_name', label: 'Tamu baru', hide: (f) => !!f.guest_id },
          { key: 'check_in', label: 'Check-in', type: 'date', req: 1 }, { key: 'check_out', label: 'Check-out', type: 'date', req: 1 },
          { key: 'price_total', label: 'Total harga', type: 'number', hint: (f) => f.__quote || 'Otomatis dari harga kamar/promo, bisa diubah' },
          { key: 'status', label: 'Status', type: 'select', options: Object.entries(STATUS).map(([v, [l]]) => ({ v, l })) }, { key: 'note', label: 'Catatan' },
        ]} />
      {pay && <PayModal b={pay} onClose={() => setPay(null)} onDone={() => setV((x) => x + 1)} />}
    </>
  );
}

const KINDS = { income: ['Pemasukan', 'Pemasukan lain'], expense: ['Biaya', 'Biaya operasional'], capital: ['Modal', 'Modal awal / investasi'] };

export function Money() {
  const [tab, setTab] = useState('expense');
  const [cats, reloadCats] = useList('categories');
  const [rooms] = useList('rooms');
  const tabs = [...Object.entries(KINDS).map(([k, [l]]) => [k, l]), ['categories', 'Kategori']];
  const catOpts = (kind) => opts(cats.filter((c) => c.kind === kind), (c) => c.name);
  return (
    <div className="space-y-4">
      <Tabs tabs={tabs} value={tab} onChange={setTab} />
      {tab === 'categories' ? (
        <Crud key="cats" resource="categories" title="Kategori" bare onSaved={reloadCats}
          columns={[{ key: 'kind', label: 'Jenis', fmt: (r) => KINDS[r.kind][0] }, { key: 'name', label: 'Nama' }, { key: 'uses', label: 'Dipakai' }]}
          fields={[{ key: 'kind', label: 'Jenis', type: 'select', req: 1, options: Object.entries(KINDS).map(([v, [l]]) => ({ v, l })) }, { key: 'name', label: 'Nama', req: 1 }]} />
      ) : (
        <Crud key={tab} resource="transactions" query={`?kind=${tab}`} title={KINDS[tab][1]} bare defaults={{ date: today() }}
          empty={tab === 'income' ? 'Pembayaran booking otomatis muncul di sini.' : 'Belum ada catatan.'}
          columns={[{ key: 'date', label: 'Tanggal' }, { key: 'category', label: 'Kategori' }, { key: 'amount', label: 'Nominal', fmt: (r) => rp(r.amount) },
            { key: 'note', label: 'Catatan', fmt: (r) => r.guest_name ? `Booking ${r.guest_name}${r.note ? ' · ' + r.note : ''}` : r.note || '-' }, { key: 'room_number', label: 'Kamar' }]}
          fields={[{ key: 'date', label: 'Tanggal', type: 'date', req: 1 }, { key: 'category_id', label: 'Kategori', type: 'select', req: 1, options: catOpts(tab) },
            { key: 'amount', label: 'Nominal', type: 'number', req: 1 }, { key: 'room_id', label: 'Kamar (opsional)', type: 'select', options: opts(rooms, (r) => r.number) }, { key: 'method', label: 'Metode' }, { key: 'note', label: 'Catatan' }]} />
      )}
    </div>
  );
}
