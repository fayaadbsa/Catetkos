// Booking per bulan: 1 baris = 1 bulan. Form bisa bikin beberapa bulan sekaligus (tercatat per bulan).
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, CalendarPlus, Check, Ban } from 'lucide-react';
import { api, rp, toast, today, cn } from '../lib/api.js';
import { useList } from '../lib/useList.js';
import { SEM } from '../lib/theme.js';
import { Badge, Button, Card, Input, Label, Modal, PageHeader, Select } from './ui.jsx';

const STATUS = { booked: ['Akan masuk', SEM.warn], checked_in: ['Menginap', SEM.ok], checked_out: ['Selesai', SEM.mut], cancelled: ['Batal', SEM.danger] };
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const dm = (s) => (s ? `${+s.slice(8)} ${MON[+s.slice(5, 7) - 1]} ${s.slice(2, 4)}` : '-');
const go = (k) => { location.hash = k; };
const DURATIONS = [1, 2, 3, 4, 6, 12];

// Checkbox + tanggal (muncul kalau dicentang). value = tanggal atau '' (belum).
const CheckDate = ({ label, value, onChange }) => (
  <div className="flex flex-wrap items-center gap-3 rounded-md border border-line p-3">
    <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" className="size-5 accent-primary" checked={!!value} onChange={(e) => onChange(e.target.checked ? today() : '')} />{label}</label>
    {!!value && <Input type="date" className="w-auto" value={value} onChange={(e) => onChange(e.target.value)} aria-label={`Tanggal: ${label}`} />}
  </div>
);

function NewBooking({ init, rooms, guests, onClose, onDone }) {
  const [f, setF] = useState({ room_id: '', guest_id: '', guest_name: '', check_in: '', months: 1, deposit: 300000, deposit_date: '', paid_date: '', note: '', ...init });
  const [q, setQ] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (p) => setF((x) => ({ ...x, ...p }));
  useEffect(() => {
    setQ(null);
    if (!f.room_id || !f.check_in) return;
    api(`/quote?room_id=${f.room_id}&check_in=${f.check_in}&months=${f.months}`).then(setQ).catch(() => {});
  }, [f.room_id, f.check_in, f.months]);
  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      await api('/bookings/batch', { body: { room_id: f.room_id, guest_id: f.guest_id || null, guest_name: f.guest_name, check_in: f.check_in, months: +f.months, note: f.note || null,
        deposit: +f.deposit || 0, deposit_paid_date: f.deposit_date || null, paid_date: f.paid_date || null } });
      toast(f.months > 1 ? `${f.months} bulan tercatat` : 'Booking tercatat'); onDone(); onClose();
    } catch (err) { toast(err.message, true); } finally { setBusy(false); }
  };
  return (
    <Modal title={init?.room_id ? 'Perpanjang booking' : 'Booking baru'} onClose={onClose}>
      <form onSubmit={save} className="grid gap-3 md:grid-cols-2">
        <Label>Kamar *<Select required value={f.room_id} onChange={(e) => set({ room_id: e.target.value })}><option value="">-</option>{rooms.map((r) => <option key={r.id} value={r.id}>{r.number} · {r.type_name} ({rp(r.price)}/bln)</option>)}</Select></Label>
        <Label>Tgl masuk *<Input type="date" required value={f.check_in} onChange={(e) => set({ check_in: e.target.value })} /></Label>
        <Label>Tamu<Select value={f.guest_id} onChange={(e) => set({ guest_id: e.target.value })}><option value="">+ Tamu baru</option>{guests.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</Select></Label>
        {f.guest_id ? <div /> : <Label>Nama tamu baru *<Input required value={f.guest_name} onChange={(e) => set({ guest_name: e.target.value })} placeholder="Cukup nama, sisanya bisa nanti" /></Label>}
        <Label>Durasi<Select value={f.months} onChange={(e) => set({ months: +e.target.value })}>{DURATIONS.map((n) => <option key={n} value={n}>{n} bulan</option>)}</Select></Label>
        <Label>Deposit<Input type="number" min="0" inputMode="numeric" value={f.deposit} onChange={(e) => set({ deposit: e.target.value })} /></Label>

        {q && (
          <div className="col-span-full rounded-md bg-soft p-3 text-sm">
            <ul className="space-y-1">{q.items.map((it) => (
              <li key={it.check_in} className="flex justify-between gap-2"><span>{dm(it.check_in)} → {dm(it.check_out)}{it.promo_name && <span className="ml-1 text-xs font-semibold text-ok">promo {it.promo_name}</span>}</span><span className="font-semibold">{rp(it.total)}</span></li>
            ))}</ul>
            <div className="mt-2 flex justify-between border-t border-line pt-2 font-semibold"><span>Total {q.items.length} bulan</span><span>{rp(q.total)}</span></div>
          </div>
        )}

        <div className="col-span-full grid gap-2 md:grid-cols-2">
          <CheckDate label="Bulan pertama sudah bayar" value={f.paid_date} onChange={(v) => set({ paid_date: v })} />
          {+f.deposit > 0 && <CheckDate label="Deposit sudah diterima" value={f.deposit_date} onChange={(v) => set({ deposit_date: v })} />}
        </div>
        <Label>Catatan<Input value={f.note} onChange={(e) => set({ note: e.target.value })} /></Label>
        <div className="col-span-full flex gap-2"><Button disabled={busy}>{busy ? 'Menyimpan...' : f.months > 1 ? `Simpan ${f.months} bulan` : 'Simpan'}</Button><Button type="button" variant="ghost" onClick={onClose}>Batal</Button></div>
      </form>
    </Modal>
  );
}

function EditBooking({ b, rooms, onClose, onDone }) {
  const [f, setF] = useState({ room_id: b.room_id, check_in: b.check_in, check_out: b.check_out, price_total: b.price_total, deposit: b.deposit, note: b.note || '', cancelled: b.status === 'cancelled' });
  const set = (p) => setF((x) => ({ ...x, ...p }));
  const save = async (e) => {
    e.preventDefault();
    try {
      await api(`/bookings/${b.id}`, { method: 'PUT', body: { room_id: f.room_id, check_in: f.check_in, check_out: f.check_out, price_total: +f.price_total, deposit: +f.deposit || 0, note: f.note || null, status: f.cancelled ? 'cancelled' : 'booked' } });
      toast('Tersimpan'); onDone(); onClose();
    } catch (err) { toast(err.message, true); }
  };
  return (
    <Modal title={`Edit: ${b.guest_name}`} onClose={onClose}>
      <form onSubmit={save} className="grid gap-3 md:grid-cols-2">
        <Label>Kamar<Select required value={f.room_id} onChange={(e) => set({ room_id: e.target.value })}>{rooms.map((r) => <option key={r.id} value={r.id}>{r.number} · {r.type_name}</option>)}</Select></Label>
        <Label>Total tagihan<Input type="number" min="0" required value={f.price_total} onChange={(e) => set({ price_total: e.target.value })} /></Label>
        <Label>Tgl masuk<Input type="date" required value={f.check_in} onChange={(e) => set({ check_in: e.target.value })} /></Label>
        <Label>Tgl keluar<Input type="date" required value={f.check_out} onChange={(e) => set({ check_out: e.target.value })} /></Label>
        <Label>Deposit<Input type="number" min="0" value={f.deposit} onChange={(e) => set({ deposit: e.target.value })} /></Label>
        <Label>Catatan<Input value={f.note} onChange={(e) => set({ note: e.target.value })} /></Label>
        <label className="col-span-full flex items-center gap-2 text-sm font-medium"><input type="checkbox" className="size-5 accent-primary" checked={f.cancelled} onChange={(e) => set({ cancelled: e.target.checked })} />Booking dibatalkan</label>
        <div className="col-span-full flex gap-2"><Button>Simpan</Button><Button type="button" variant="ghost" onClick={onClose}>Batal</Button></div>
      </form>
    </Modal>
  );
}

// Konfirmasi bayar: pilih tanggal, lalu simpan.
function PayDialog({ title, info, onConfirm, onClose }) {
  const [date, setDate] = useState(today());
  return (
    <Modal title={title} onClose={onClose} size="sm">
      <p className="mb-3 text-sm text-mut">{info}</p>
      <Label>Tanggal dibayar<Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></Label>
      <div className="mt-4 flex gap-2"><Button onClick={() => onConfirm(date)}><Check size={16} /> Konfirmasi</Button><Button variant="ghost" onClick={onClose}>Batal</Button></div>
    </Modal>
  );
}

export default function Bookings() {
  const [rows, setRows] = useState(null);
  const [rooms] = useList('rooms');
  const [guests, reloadGuests] = useList('guests');
  const [dlg, setDlg] = useState(null); // {k:'new'|'edit'|'rent'|'dep', ...}
  const [filter, setFilter] = useState('all');
  const load = () => api('/bookings').then(setRows).catch((e) => toast(e.message, true));
  useEffect(() => { load(); }, []);
  const active = rooms.filter((r) => !r.archived);
  const done = () => { load(); reloadGuests(); };
  const run = async (fn, msg) => { try { await fn(); toast(msg); load(); setDlg(null); } catch (e) { toast(e.message, true); } };
  const del = (b) => { if (confirm(`Hapus booking ${b.guest_name} (${dm(b.check_in)})?`)) run(() => api(`/bookings/${b.id}`, { method: 'DELETE' }), 'Terhapus'); };
  const depPatch = (b, p) => run(() => api(`/bookings/${b.id}`, { method: 'PUT', body: p }), 'Deposit diperbarui');

  const shown = (rows || []).filter((b) => filter === 'all' || (filter === 'unpaid' && b.status !== 'cancelled' && b.paid < b.price_total) || (filter === 'active' && b.status === 'checked_in'));
  const extend = (b) => setDlg({ k: 'new', init: { room_id: b.room_id, guest_id: b.guest_id, check_in: b.check_out, deposit: 0 } });

  const rent = (b) => {
    if (b.status === 'cancelled') return <span className="text-mut">-</span>;
    if (b.paid >= b.price_total) return <button title="Klik untuk batalkan pembayaran" onClick={() => confirm('Batalkan pembayaran bulan ini?') && run(() => api(`/bookings/${b.id}/pay`, { body: { paid: false } }), 'Pembayaran dibatalkan')}><Badge color={SEM.ok}>Lunas · {dm(b.paid_date)}</Badge></button>;
    return <div className="flex flex-col items-start gap-1">{b.paid > 0 && <Badge color={SEM.warn}>Kurang {rp(b.price_total - b.paid)}</Badge>}<Button variant="outline" className="py-1" onClick={() => setDlg({ k: 'rent', b })}>Tandai lunas</Button></div>;
  };
  const dep = (b) => {
    if (!b.deposit) return <span className="text-mut">-</span>;
    if (b.deposit_returned_date) return <Badge>Dikembalikan · {dm(b.deposit_returned_date)}</Badge>;
    if (b.deposit_paid_date) return <div className="flex flex-col items-start gap-1"><Badge color={SEM.ok}>{rp(b.deposit)} dipegang</Badge>{b.status === 'checked_out' && <Button variant="outline" className="py-1" onClick={() => setDlg({ k: 'ret', b })}>Kembalikan</Button>}</div>;
    return <Button variant="outline" className="py-1" onClick={() => setDlg({ k: 'dep', b })}>Terima {rp(b.deposit)}</Button>;
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Booking" desc="Satu baris = satu bulan. Booking panjang tercatat per bulan.">
        {active.length > 0 && <Button onClick={() => setDlg({ k: 'new' })}><Plus size={16} /> Booking baru</Button>}
      </PageHeader>
      <div className="flex gap-1 overflow-x-auto rounded-md bg-soft p-1 sm:w-fit" role="tablist">
        {[['all', 'Semua'], ['active', 'Menginap'], ['unpaid', 'Belum lunas']].map(([k, l]) => (
          <button key={k} role="tab" aria-selected={filter === k} onClick={() => setFilter(k)} className={cn('whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold', filter === k ? 'bg-surface text-tx shadow-card' : 'text-mut hover:text-tx')}>{l}</button>
        ))}
      </div>
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="text-left text-xs font-semibold uppercase tracking-wide text-mut"><tr>{['Tamu', 'Kamar', 'Periode', 'Tagihan', 'Sewa', 'Deposit', 'Aksi'].map((h) => <th key={h} className={cn('whitespace-nowrap p-3', h === 'Aksi' && 'text-right')}>{h}</th>)}</tr></thead>
          <tbody>
            {shown.map((b) => (
              <tr key={b.id} className="border-t border-line hover:bg-soft/60">
                <td className="whitespace-nowrap p-3 font-semibold">{b.guest_name}<div className="mt-0.5"><Badge color={STATUS[b.status][1]}>{STATUS[b.status][0]}</Badge></div></td>
                <td className="whitespace-nowrap p-3">{b.room_number}</td>
                <td className="whitespace-nowrap p-3">{dm(b.check_in)} → {dm(b.check_out)}</td>
                <td className="whitespace-nowrap p-3">{rp(b.price_total)}{b.promo_id && <span className="ml-1 text-xs font-semibold text-ok">promo</span>}</td>
                <td className="whitespace-nowrap p-3">{rent(b)}</td>
                <td className="whitespace-nowrap p-3">{dep(b)}</td>
                <td className="whitespace-nowrap p-3 text-right">
                  {b.status !== 'cancelled' && <Button variant="ghost" className="text-tx" onClick={() => extend(b)} title="Perpanjang 1 bulan dari tgl keluar" aria-label="Perpanjang 1 bulan"><CalendarPlus size={15} /> +1 bln</Button>}
                  <Button variant="ghost" aria-label="Edit" title="Edit" onClick={() => setDlg({ k: 'edit', b })}><Pencil size={15} /></Button>
                  <Button variant="ghost" aria-label="Hapus" title="Hapus" className="text-danger" onClick={() => del(b)}><Trash2 size={15} /></Button>
                </td>
              </tr>
            ))}
            {rows && !shown.length && (
              <tr><td colSpan={7} className="p-8 text-center text-mut"><p>{filter !== 'all' ? 'Tidak ada yang cocok.' : active.length ? 'Belum ada booking.' : 'Belum ada kamar aktif. Bikin kamar dulu.'}</p>
                {!active.length && <div className="mt-3"><Button onClick={() => go('rooms')}>Bikin kamar</Button></div>}</td></tr>
            )}
            {!rows && <tr><td colSpan={7} className="p-3 text-mut">Lagi muat...</td></tr>}
          </tbody>
        </table>
      </Card>

      {dlg?.k === 'new' && <NewBooking init={dlg.init} rooms={active} guests={guests} onClose={() => setDlg(null)} onDone={done} />}
      {dlg?.k === 'edit' && <EditBooking b={dlg.b} rooms={rooms.filter((r) => !r.archived || r.id === dlg.b.room_id)} onClose={() => setDlg(null)} onDone={load} />}
      {dlg?.k === 'rent' && <PayDialog title={`Sewa lunas: ${dlg.b.guest_name}`} info={`Kamar ${dlg.b.room_number}, ${dm(dlg.b.check_in)} → ${dm(dlg.b.check_out)}. Sisa ${rp(dlg.b.price_total - dlg.b.paid)}.`} onClose={() => setDlg(null)}
        onConfirm={(date) => run(() => api(`/bookings/${dlg.b.id}/pay`, { body: { date } }), 'Pembayaran dicatat')} />}
      {dlg?.k === 'dep' && <PayDialog title={`Deposit diterima: ${dlg.b.guest_name}`} info={`Deposit ${rp(dlg.b.deposit)}. Ini uang titipan, tidak masuk omzet.`} onClose={() => setDlg(null)} onConfirm={(date) => depPatch(dlg.b, { deposit_paid_date: date })} />}
      {dlg?.k === 'ret' && <PayDialog title={`Deposit dikembalikan: ${dlg.b.guest_name}`} info={`Kembalikan ${rp(dlg.b.deposit)} ke tamu.`} onClose={() => setDlg(null)} onConfirm={(date) => depPatch(dlg.b, { deposit_returned_date: date })} />}
    </div>
  );
}
