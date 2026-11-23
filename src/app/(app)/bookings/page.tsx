'use client';

// Booking per bulan: 1 baris = 1 bulan. Form bisa bikin beberapa bulan sekaligus (tercatat per bulan).
import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  CalendarPlus,
  Check,
  Search,
  Users,
  AlertCircle,
  ShieldCheck,
  CalendarDays,
  ArrowRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api, rp, toast, today, errMsg } from '@/lib/api';
import { useList } from '@/lib/useList';
import type { Row, Form } from '@/lib/types';
import { SEM } from '@/lib/theme';
import {
  Badge,
  Button,
  Card,
  Input,
  Label,
  Modal,
  PageHeader,
  Select,
  Checkbox,
  Tabs,
  DataTable,
  type Column,
} from '@/components/ui';

const STATUS: Record<string, [string, string]> = {
  booked: ['Akan masuk', SEM.warn],
  checked_in: ['Menginap', SEM.ok],
  checked_out: ['Selesai', SEM.mut],
  cancelled: ['Batal', SEM.danger],
};
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const dm = (s?: string | null) =>
  s ? `${+s.slice(8)} ${MON[+s.slice(5, 7) - 1]} ${s.slice(2, 4)}` : '-';
const DURATIONS = [1, 2, 3, 4, 6, 12];

// Checkbox + tanggal (muncul kalau dicentang). value = tanggal atau '' (belum).
const CheckDate = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface p-3">
    <label className="flex items-center gap-2 text-xs md:text-sm font-semibold text-tx cursor-pointer">
      <Checkbox checked={!!value} onChange={(e) => onChange(e.target.checked ? today() : '')} />
      {label}
    </label>
    {!!value && (
      <Input
        type="date"
        className="w-auto ml-auto"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`Tanggal: ${label}`}
      />
    )}
  </div>
);

interface DlgProps {
  rooms: Row[];
  onClose: () => void;
  onDone: () => void;
}

function NewBooking({
  init,
  rooms,
  guests,
  onClose,
  onDone,
}: DlgProps & { init?: Form; guests: Row[] }) {
  const [f, setF] = useState({
    room_id: '',
    guest_id: '',
    guest_name: '',
    check_in: '',
    months: 1,
    deposit: 300000,
    deposit_date: '',
    paid_date: '',
    note: '',
    ...init,
  });
  const [q, setQ] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const set = (p: Row | Record<string, unknown>) => setF((x) => ({ ...x, ...p }));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQ(null);
    if (!f.room_id || !f.check_in) return;
    api(`/quote?room_id=${f.room_id}&check_in=${f.check_in}&months=${f.months}`)
      .then(setQ)
      .catch(() => {});
  }, [f.room_id, f.check_in, f.months]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/bookings/batch', {
        body: {
          room_id: f.room_id,
          guest_id: f.guest_id || null,
          guest_name: f.guest_name,
          check_in: f.check_in,
          months: +f.months,
          note: f.note || null,
          deposit: +f.deposit || 0,
          deposit_paid_date: f.deposit_date || null,
          paid_date: f.paid_date || null,
        },
      });
      toast(f.months > 1 ? `${f.months} bulan tercatat` : 'Booking tercatat');
      onDone();
      onClose();
    } catch (err) {
      toast(errMsg(err), true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={init?.room_id ? 'Perpanjang booking' : 'Booking baru'} onClose={onClose}>
      <form onSubmit={save} className="grid gap-3.5 md:grid-cols-2">
        <Label>
          Kamar *
          <Select required value={f.room_id} onChange={(e) => set({ room_id: e.target.value })}>
            <option value="">- Pilih kamar -</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.number} · {r.type_name} ({rp(r.price)}/bln)
              </option>
            ))}
          </Select>
        </Label>
        <Label>
          Tgl masuk *
          <Input
            type="date"
            required
            value={f.check_in}
            onChange={(e) => set({ check_in: e.target.value })}
          />
        </Label>
        <Label>
          Tamu
          <Select value={f.guest_id} onChange={(e) => set({ guest_id: e.target.value })}>
            <option value="">+ Tamu baru</option>
            {guests.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
        </Label>
        {f.guest_id ? (
          <div />
        ) : (
          <Label>
            Nama tamu baru *
            <Input
              required
              value={f.guest_name}
              onChange={(e) => set({ guest_name: e.target.value })}
              placeholder="Cukup nama, sisanya bisa nanti"
            />
          </Label>
        )}
        <Label>
          Durasi sewa
          <Select value={f.months} onChange={(e) => set({ months: +e.target.value })}>
            {DURATIONS.map((n) => (
              <option key={n} value={n}>
                {n} bulan
              </option>
            ))}
          </Select>
        </Label>
        <Label>
          Deposit jaminan (Rp)
          <Input
            type="number"
            min="0"
            inputMode="numeric"
            value={f.deposit}
            onChange={(e) => set({ deposit: e.target.value })}
          />
        </Label>

        {q && (
          <div className="col-span-full rounded-xl border border-line bg-soft/70 p-3.5 text-xs md:text-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-mut block mb-2">
              Rincian Tagihan Otomatis
            </span>
            <ul className="space-y-1.5 font-mono">
              {q.items.map((it: any) => (
                <li key={it.check_in} className="flex justify-between gap-2">
                  <span className="font-sans text-tx">
                    {dm(it.check_in)} → {dm(it.check_out)}
                    {it.promo_name && (
                      <span className="ml-1.5 text-xs font-semibold text-ok bg-ok/10 px-1.5 py-0.5 rounded-sm">
                        promo {it.promo_name}
                      </span>
                    )}
                  </span>
                  <span className="font-bold tabular-nums text-tx">{rp(it.total)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2.5 flex justify-between border-t border-line/70 pt-2 font-bold text-sm">
              <span>Total {q.items.length} bulan</span>
              <span className="font-mono tabular-nums text-brand">{rp(q.total)}</span>
            </div>
          </div>
        )}

        <div className="col-span-full grid gap-2.5 md:grid-cols-2">
          <CheckDate
            label="Bulan pertama sudah bayar"
            value={f.paid_date}
            onChange={(v) => set({ paid_date: v })}
          />
          {+f.deposit > 0 && (
            <CheckDate
              label="Deposit sudah diterima"
              value={f.deposit_date}
              onChange={(v) => set({ deposit_date: v })}
            />
          )}
        </div>
        <div className="col-span-full">
          <Label>
            Catatan
            <Input
              value={f.note}
              onChange={(e) => set({ note: e.target.value })}
              placeholder="mis. bawa motor, bayar via transfer"
            />
          </Label>
        </div>
        <div className="col-span-full mt-2 flex items-center gap-2 border-t border-line/60 pt-3">
          <Button disabled={busy} className="flex-1 md:flex-none">
            {busy ? 'Menyimpan...' : f.months > 1 ? `Simpan ${f.months} bulan` : 'Simpan Booking'}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Batal
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function EditBooking({ b, rooms, onClose, onDone }: DlgProps & { b: Row }) {
  const [f, setF] = useState({
    room_id: b.room_id,
    check_in: b.check_in,
    check_out: b.check_out,
    price_total: b.price_total,
    deposit: b.deposit,
    note: b.note || '',
    cancelled: b.status === 'cancelled',
  });
  const set = (p: Row | Record<string, unknown>) => setF((x) => ({ ...x, ...p }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api(`/bookings/${b.id}`, {
        method: 'PUT',
        body: {
          room_id: f.room_id,
          check_in: f.check_in,
          check_out: f.check_out,
          price_total: +f.price_total,
          deposit: +f.deposit || 0,
          note: f.note || null,
          status: f.cancelled ? 'cancelled' : 'booked',
        },
      });
      toast('Tersimpan');
      onDone();
      onClose();
    } catch (err) {
      toast(errMsg(err), true);
    }
  };

  return (
    <Modal title={`Edit: ${b.guest_name}`} onClose={onClose}>
      <form onSubmit={save} className="grid gap-3.5 md:grid-cols-2">
        <Label>
          Kamar
          <Select required value={f.room_id} onChange={(e) => set({ room_id: e.target.value })}>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.number} · {r.type_name}
              </option>
            ))}
          </Select>
        </Label>
        <Label>
          Total tagihan (Rp)
          <Input
            type="number"
            min="0"
            required
            value={f.price_total}
            onChange={(e) => set({ price_total: e.target.value })}
          />
        </Label>
        <Label>
          Tgl masuk
          <Input
            type="date"
            required
            value={f.check_in}
            onChange={(e) => set({ check_in: e.target.value })}
          />
        </Label>
        <Label>
          Tgl keluar
          <Input
            type="date"
            required
            value={f.check_out}
            onChange={(e) => set({ check_out: e.target.value })}
          />
        </Label>
        <Label>
          Deposit (Rp)
          <Input
            type="number"
            min="0"
            value={f.deposit}
            onChange={(e) => set({ deposit: e.target.value })}
          />
        </Label>
        <Label>
          Catatan
          <Input value={f.note} onChange={(e) => set({ note: e.target.value })} />
        </Label>
        <label className="col-span-full flex items-center gap-2 text-xs md:text-sm font-semibold text-tx cursor-pointer">
          <Checkbox checked={f.cancelled} onChange={(e) => set({ cancelled: e.target.checked })} />
          Booking dibatalkan
        </label>
        <div className="col-span-full flex items-center gap-2 border-t border-line/60 pt-3">
          <Button>Simpan Perubahan</Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Batal
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Konfirmasi bayar: pilih tanggal, lalu simpan.
function PayDialog({
  title,
  info,
  onConfirm,
  onClose,
}: {
  title: string;
  info: string;
  onConfirm: (d: string) => void;
  onClose: () => void;
}) {
  const [date, setDate] = useState(today());
  return (
    <Modal title={title} onClose={onClose} size="sm">
      <p className="mb-4 text-xs md:text-sm text-mut leading-relaxed">{info}</p>
      <Label>
        Tanggal dibayar
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </Label>
      <div className="mt-5 flex gap-2 border-t border-line/60 pt-3">
        <Button onClick={() => onConfirm(date)} className="flex-1" icon={<Check size={16} />}>
          Konfirmasi
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Batal
        </Button>
      </div>
    </Modal>
  );
}

interface Stay {
  id: number;
  room_number: string;
  guest_id: number;
  guest_name: string;
  check_in: string;
  check_out: string;
  parts: Row[];
}

function groupStays(rows: Row[]): Stay[] {
  const out: Stay[] = [];
  for (const b of [...rows]
    .filter((x) => x.status !== 'cancelled')
    .sort((x, y) => x.check_in.localeCompare(y.check_in))) {
    const last = out.find(
      (t) =>
        t.parts[0].room_id === b.room_id && t.guest_id === b.guest_id && t.check_out === b.check_in,
    );
    if (last) {
      last.check_out = b.check_out;
      last.parts.push(b);
    } else {
      out.push({
        id: b.id,
        room_number: b.room_number,
        guest_id: b.guest_id,
        guest_name: b.guest_name,
        check_in: b.check_in,
        check_out: b.check_out,
        parts: [b],
      });
    }
  }
  const cancelled = rows
    .filter((x) => x.status === 'cancelled')
    .map((b) => ({
      id: b.id,
      room_number: b.room_number,
      guest_id: b.guest_id,
      guest_name: b.guest_name,
      check_in: b.check_in,
      check_out: b.check_out,
      parts: [b],
    }));
  return [...out, ...cancelled].sort(
    (a, b) =>
      a.room_number.localeCompare(b.room_number, undefined, { numeric: true }) ||
      a.check_in.localeCompare(b.check_in),
  );
}

export default function Bookings() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [rooms] = useList('rooms');
  const [guests, reloadGuests] = useList('guests');
  type Dlg = { k: 'new'; init?: Form } | { k: 'edit' | 'rent' | 'dep' | 'ret'; b: Row } | null;
  const [dlg, setDlg] = useState<Dlg>(null);
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'active' | 'unpaid' | 'cancelled'>('all');
  const [query, setQuery] = useState('');
  const [stayId, setStayId] = useState<number | null>(null);

  const load = () =>
    api<Row[]>('/bookings')
      .then(setRows)
      .catch((e) => toast(errMsg(e), true));

  useEffect(() => {
    load();
  }, []);

  const activeRooms = rooms.filter((r) => !r.archived);
  const done = () => {
    load();
    reloadGuests();
  };
  const run = async (fn: () => Promise<unknown>, msg: string) => {
    try {
      await fn();
      toast(msg);
      load();
      setDlg(null);
    } catch (e) {
      toast(errMsg(e), true);
    }
  };

  const del = (b: Row) => {
    if (confirm(`Hapus booking ${b.guest_name} (${dm(b.check_in)})?`))
      run(() => api(`/bookings/${b.id}`, { method: 'DELETE' }), 'Terhapus');
  };

  const depPatch = (b: Row, p: Record<string, unknown>) =>
    run(() => api(`/bookings/${b.id}`, { method: 'PUT', body: p }), 'Deposit diperbarui');

  const stays = useMemo(() => groupStays(rows || []), [rows]);

  // Overall KPIs
  const totalBilled = useMemo(
    () =>
      (rows || [])
        .filter((b) => b.status !== 'cancelled')
        .reduce((acc, b) => acc + (b.price_total || 0), 0),
    [rows],
  );
  const totalUnpaid = useMemo(
    () =>
      (rows || [])
        .filter((b) => b.status !== 'cancelled')
        .reduce((acc, b) => acc + Math.max(0, b.price_total - b.paid), 0),
    [rows],
  );
  const activeCount = useMemo(
    () => (rows || []).filter((b) => b.status === 'checked_in').length,
    [rows],
  );

  const shown = useMemo(() => {
    return stays.filter((t) => {
      // Tab filter
      if (filter === 'unpaid') {
        if (!t.parts.some((b) => b.status !== 'cancelled' && b.paid < b.price_total)) return false;
      } else if (filter === 'active') {
        if (!t.parts.some((b) => b.status === 'checked_in')) return false;
      } else if (filter === 'cancelled') {
        if (!t.parts.every((b) => b.status === 'cancelled')) return false;
      }
      // Search query
      if (query.trim()) {
        const q = query.toLowerCase();
        return t.guest_name.toLowerCase().includes(q) || t.room_number.toLowerCase().includes(q);
      }
      return true;
    });
  }, [stays, filter, query]);

  const stay = stays.find((t) => t.id === stayId) || null;
  const extend = (b: Row) =>
    setDlg({
      k: 'new',
      init: {
        room_id: b.room_id,
        guest_id: b.guest_id,
        check_in: b.check_out,
        deposit: 0,
      },
    });

  const rent = (b: Row) => {
    if (b.status === 'cancelled') return <span className="text-mut">-</span>;
    if (b.paid >= b.price_total)
      return (
        <button
          type="button"
          title="Klik untuk batalkan pembayaran"
          onClick={() =>
            confirm('Batalkan pembayaran bulan ini?') &&
            run(
              () => api(`/bookings/${b.id}/pay`, { body: { paid: false } }),
              'Pembayaran dibatalkan',
            )
          }
        >
          <Badge color={SEM.ok}>Lunas · {dm(b.paid_date)}</Badge>
        </button>
      );
    return (
      <div className="flex flex-col items-start gap-1">
        {b.paid > 0 && <Badge color={SEM.warn}>Kurang {rp(b.price_total - b.paid)}</Badge>}
        <Button variant="outline" size="sm" onClick={() => setDlg({ k: 'rent', b })}>
          Tandai lunas
        </Button>
      </div>
    );
  };

  const dep = (b: Row) => {
    if (!b.deposit) return <span className="text-mut">-</span>;
    if (b.deposit_returned_date) return <Badge>Dikembalikan · {dm(b.deposit_returned_date)}</Badge>;
    if (b.deposit_paid_date)
      return (
        <div className="flex flex-col items-start gap-1">
          <Badge color={SEM.ok}>{rp(b.deposit)} dipegang</Badge>
          {b.status === 'checked_out' && (
            <Button variant="outline" size="sm" onClick={() => setDlg({ k: 'ret', b })}>
              Kembalikan
            </Button>
          )}
        </div>
      );
    return (
      <Button variant="outline" size="sm" onClick={() => setDlg({ k: 'dep', b })}>
        Terima {rp(b.deposit)}
      </Button>
    );
  };

  const stayStatus = (t: Stay) => {
    const bs = t.parts;
    return bs.every((b) => b.status === 'cancelled')
      ? 'cancelled'
      : bs.some((b) => b.status === 'checked_in')
        ? 'checked_in'
        : bs.every((b) => b.status === 'checked_out')
          ? 'checked_out'
          : 'booked';
  };

  const paidInfo = (t: Stay) => {
    if (t.parts[0].status === 'cancelled') return <span className="text-mut">-</span>;
    const due = t.parts.reduce((a, b) => a + b.price_total - b.paid, 0);
    const n = t.parts.filter((b) => b.paid >= b.price_total).length;
    return due <= 0 ? (
      <Badge color={SEM.ok}>Lunas semua</Badge>
    ) : (
      <Badge color={SEM.warn}>
        {n}/{t.parts.length} bln · Kurang {rp(due)}
      </Badge>
    );
  };

  const cols: Column<Stay>[] = [
    {
      key: 'room_number',
      label: 'Kamar',
      fmt: (t) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-tx">Kamar {t.room_number}</span>
        </div>
      ),
    },
    {
      key: 'guest_name',
      label: 'Penghuni & Status',
      fmt: (t) => {
        const st = stayStatus(t);
        const [stLabel, stColor] = STATUS[st] || ['-', SEM.mut];
        return (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-tx">{t.guest_name}</span>
            <Badge color={stColor}>{stLabel}</Badge>
          </div>
        );
      },
    },
    {
      key: 'period',
      label: 'Periode Sewa',
      fmt: (t) => (
        <div className="text-xs">
          <span className="font-mono tabular-nums">
            {dm(t.check_in)} → {dm(t.check_out)}
          </span>
          <span className="ml-1 text-mut">({t.parts.length} bln)</span>
        </div>
      ),
    },
    {
      key: 'total',
      label: 'Total Tagihan',
      align: 'right',
      fmt: (t) => (
        <span className="font-mono font-bold tabular-nums text-tx">
          {rp(t.parts.reduce((a, b) => a + b.price_total, 0))}
        </span>
      ),
    },
    {
      key: 'rent',
      label: 'Status Pembayaran',
      fmt: paidInfo,
    },
    {
      key: 'dep',
      label: 'Deposit',
      fmt: (t) => dep(t.parts.find((b) => b.deposit) || t.parts[0]),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Booking & Penginapan"
        desc="Kelola sewa kamar bulanan, pembayaran & status tamu."
      >
        {activeRooms.length > 0 && (
          <Button onClick={() => setDlg({ k: 'new' })} variant="primary" icon={<Plus size={16} />}>
            Booking Baru
          </Button>
        )}
      </PageHeader>

      {/* Summary KPI Bento Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-3.5 md:p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-mut">
            Tamu Menginap
          </span>
          <div className="mt-1 font-mono text-xl md:text-2xl font-bold tracking-tight text-tx">
            {activeCount} <span className="text-xs text-mut font-normal">kamar</span>
          </div>
        </Card>
        <Card className="p-3.5 md:p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-mut">
            Total Tagihan
          </span>
          <div className="mt-1 font-mono text-xl md:text-2xl font-bold tracking-tight text-tx">
            {rp(totalBilled)}
          </div>
        </Card>
        <Card className="p-3.5 md:p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-warn">
            Belum Lunas
          </span>
          <div className="mt-1 font-mono text-xl md:text-2xl font-bold tracking-tight text-warn">
            {rp(totalUnpaid)}
          </div>
        </Card>
        <Card className="p-3.5 md:p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-mut">
            Kamar Aktif
          </span>
          <div className="mt-1 font-mono text-xl md:text-2xl font-bold tracking-tight text-tx">
            {activeRooms.length}
          </div>
        </Card>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          label="Filter Booking"
          value={filter}
          onChange={setFilter}
          items={[
            ['all', 'Semua'],
            ['active', 'Menginap'],
            ['unpaid', 'Belum Lunas'],
            ['cancelled', 'Batal'],
          ]}
        />

        <div className="relative w-full sm:w-64">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mut"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari kamar atau tamu..."
            className="pl-9 h-10 md:h-9 text-xs md:text-sm"
          />
        </div>
      </div>

      {/* Table Data */}
      <DataTable
        rows={rows && shown}
        columns={cols}
        rowKey={(t) => t.id}
        empty={
          <>
            <p>
              {filter !== 'all' || query
                ? 'Tidak ada booking yang cocok dengan filter.'
                : activeRooms.length
                  ? 'Belum ada booking tercatat.'
                  : 'Belum ada kamar aktif. Bikin kamar dulu.'}
            </p>
            {!activeRooms.length && (
              <div className="mt-3">
                <Button onClick={() => router.push('/rooms')}>Bikin Kamar</Button>
              </div>
            )}
          </>
        }
        actions={(t) => (
          <>
            {t.parts[0].status !== 'cancelled' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => extend(t.parts[t.parts.length - 1])}
                title="Perpanjang 1 bulan dari tgl keluar"
                aria-label="Perpanjang 1 bulan"
                icon={<CalendarPlus size={14} />}
              >
                +1 bln
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setStayId(t.id)}>
              Rincian
            </Button>
          </>
        )}
      />

      {/* Modal Detail Stay / Rincian Bulan */}
      {stay && (
        <Modal
          title={`${stay.guest_name} · Kamar ${stay.room_number}`}
          onClose={() => setStayId(null)}
        >
          <div className="mb-4 rounded-xl border border-line bg-soft/50 p-3.5 text-xs md:text-sm">
            <span className="font-mono tabular-nums font-bold text-tx">
              {dm(stay.check_in)} → {dm(stay.check_out)}
            </span>
            <span className="text-mut"> · {stay.parts.length} bulan sewa</span>
            <div className="mt-1 font-mono text-base font-bold text-tx">
              Total Tagihan: {rp(stay.parts.reduce((a, b) => a + b.price_total, 0))}
            </div>
          </div>

          <ul className="space-y-3">
            {stay.parts.map((b) => (
              <li key={b.id} className="rounded-xl border border-line bg-surface p-4 shadow-2xs">
                <div className="flex items-center justify-between gap-2 border-b border-line/60 pb-2">
                  <span className="font-mono font-bold text-tx">
                    {dm(b.check_in)} → {dm(b.check_out)}
                  </span>
                  <span className="font-mono font-bold text-tx">
                    {rp(b.price_total)}
                    {b.promo_id && (
                      <span className="ml-1 text-xs font-semibold text-ok bg-ok/10 px-1.5 py-0.5 rounded-sm">
                        promo
                      </span>
                    )}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-wrap gap-4 text-xs md:text-sm">
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-mut mb-1">
                        Sewa
                      </span>
                      {rent(b)}
                    </div>
                    {!!b.deposit && (
                      <div>
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-mut mb-1">
                          Deposit
                        </span>
                        {dep(b)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Edit"
                      title="Edit"
                      onClick={() => setDlg({ k: 'edit', b })}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Hapus"
                      title="Hapus"
                      className="text-danger"
                      onClick={() => del(b)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Modal>
      )}

      {/* Dialogs */}
      {dlg?.k === 'new' && (
        <NewBooking
          init={dlg.init}
          rooms={activeRooms}
          guests={guests}
          onClose={() => setDlg(null)}
          onDone={done}
        />
      )}
      {dlg?.k === 'edit' && (
        <EditBooking
          b={dlg.b}
          rooms={rooms.filter((r) => !r.archived || r.id === dlg.b.room_id)}
          onClose={() => setDlg(null)}
          onDone={load}
        />
      )}
      {dlg?.k === 'rent' && (
        <PayDialog
          title={`Sewa Lunas: ${dlg.b.guest_name}`}
          info={`Kamar ${dlg.b.room_number}, ${dm(dlg.b.check_in)} → ${dm(
            dlg.b.check_out,
          )}. Sisa tagihan ${rp(dlg.b.price_total - dlg.b.paid)}.`}
          onClose={() => setDlg(null)}
          onConfirm={(date) =>
            run(
              () => api(`/bookings/${dlg.b.id}/pay`, { body: { date } }),
              'Pembayaran sewa dicatat',
            )
          }
        />
      )}
      {dlg?.k === 'dep' && (
        <PayDialog
          title={`Deposit Diterima: ${dlg.b.guest_name}`}
          info={`Penerimaan deposit ${rp(
            dlg.b.deposit,
          )}. Ini merupakan titipan jaminan, tidak dihitung omzet.`}
          onClose={() => setDlg(null)}
          onConfirm={(date) => depPatch(dlg.b, { deposit_paid_date: date })}
        />
      )}
      {dlg?.k === 'ret' && (
        <PayDialog
          title={`Kembalikan Deposit: ${dlg.b.guest_name}`}
          info={`Kembalikan dana jaminan deposit ${rp(dlg.b.deposit)} ke tamu.`}
          onClose={() => setDlg(null)}
          onConfirm={(date) => depPatch(dlg.b, { deposit_returned_date: date })}
        />
      )}
    </div>
  );
}
