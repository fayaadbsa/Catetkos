// Konfigurasi tiap halaman di atas Crud generik.
import { useNavigate } from 'react-router-dom';
import { rp, today } from '../lib/api';
import { useList } from '../lib/useList';
import type { Row } from '../lib/types';
import Crud from '../components/Crud';
import PromoCalc from '../components/PromoCalc';
import { SEM } from '../lib/theme';
import {
  Badge,
  Button,
  Card,
  FilterButton,
  FilterChip,
  FilterGroup,
  FilterSheet,
  useFilterSheet,
  type ActiveFilter,
} from '../components/ui';

const opts = (rows: Row[], l: (r: Row) => string) =>
  rows.map((r) => ({ v: r.id, l: l(r) }));

const activeBadge = (r: Row) =>
  r.archived ? <Badge>Arsip</Badge> : <Badge color={SEM.ok}>Aktif</Badge>;

export function RoomTypes() {
  return (
    <Crud
      resource="room-types"
      title="Tipe kamar"
      desc="Grup kamar dengan fasilitas dan harga dasar yang sama."
      empty="Belum ada tipe kamar. Bikin satu dulu, nanti kamar tinggal pilih."
      columns={[
        { key: 'name', label: 'Tipe Kamar', fmt: (r) => <span className="font-bold">{r.name}</span> },
        {
          key: 'base_price',
          label: 'Harga Dasar / Bln',
          align: 'right',
          fmt: (r) => <span className="font-mono font-bold text-tx">{rp(r.base_price)}</span>,
        },
        { key: 'capacity', label: 'Kapasitas', align: 'center', fmt: (r) => `${r.capacity} orang` },
        { key: 'room_count', label: 'Kamar Aktif', align: 'center', fmt: (r) => `${r.room_count} kamar` },
        { key: 'archived', label: 'Status', fmt: activeBadge },
      ]}
      fields={[
        { key: 'name', label: 'Nama tipe', req: 1 },
        { key: 'base_price', label: 'Harga dasar / bulan', type: 'number', req: 1 },
        { key: 'capacity', label: 'Kapasitas (orang)', type: 'number' },
        { key: 'archived', label: 'Arsip (nonaktifkan)', type: 'bool' },
      ]}
      defaults={{ capacity: 1, archived: 0 }}
    />
  );
}

export function Rooms() {
  const [types] = useList('room-types');
  const nav = useNavigate();
  return (
    <Crud
      resource="rooms"
      title="Kamar"
      desc="Daftar kamar fisik. Harga otomatis ikut tipe kecuali diisi harga khusus."
      canAdd={types.length > 0}
      defaults={{ archived: 0 }}
      empty={
        types.length
          ? 'Belum ada kamar fisik tercatat.'
          : 'Belum ada tipe kamar. Bikin tipe dulu, baru kamar.'
      }
      emptyAction={
        !types.length && (
          <Button onClick={() => nav('/room-types')}>Bikin Tipe Kamar</Button>
        )
      }
      columns={[
        { key: 'number', label: 'Nomor Kamar', fmt: (r) => <span className="font-mono font-bold">Kamar {r.number}</span> },
        { key: 'type_name', label: 'Tipe' },
        {
          key: 'price',
          label: 'Harga / Bulan',
          align: 'right',
          fmt: (r) => (
            <span className="font-mono font-bold text-tx">
              {rp(r.price)}
              {r.price_override ? ' *' : ''}
            </span>
          ),
        },
        { key: 'archived', label: 'Status', fmt: activeBadge },
      ]}
      fields={[
        { key: 'number', label: 'Nomor kamar', req: 1 },
        {
          key: 'room_type_id',
          label: 'Tipe kamar',
          type: 'select',
          req: 1,
          options: opts(types, (t) => `${t.name} (${rp(t.base_price)})`),
        },
        {
          key: 'price_override',
          label: 'Harga khusus / bulan (opsional)',
          type: 'number',
          hint: () =>
            'Kosongkan buat pakai harga tipe. Tanda * di tabel = harga khusus.',
        },
        { key: 'archived', label: 'Arsip (nonaktifkan)', type: 'bool' },
      ]}
    />
  );
}

export function Guests() {
  return (
    <Crud
      resource="guests"
      title="Tamu"
      desc="Daftar penyewa yang otomatis bertambah setiap bikin booking tamu baru."
      empty="Belum ada tamu. Tamu otomatis muncul saat bikin booking."
      columns={[
        { key: 'name', label: 'Nama Tamu', fmt: (r) => <span className="font-bold">{r.name}</span> },
        { key: 'phone', label: 'Nomor HP', fmt: (r) => r.phone ? <span className="font-mono text-tx">{r.phone}</span> : '-' },
        { key: 'booking_count', label: 'Total Booking', align: 'center', fmt: (r) => `${r.booking_count} kali` },
        { key: 'note', label: 'Catatan', fmt: (r) => r.note || '-' },
      ]}
      fields={[
        { key: 'name', label: 'Nama tamu', req: 1 },
        { key: 'phone', label: 'Nomor HP / WhatsApp' },
        { key: 'note', label: 'Catatan' },
      ]}
    />
  );
}

export function Promos() {
  const [types] = useList('room-types');
  return (
    <div className="space-y-8">
      <Crud
        resource="promos"
        title="Promo"
        desc="Harga spesial per periode. Dipakai otomatis saat quote & booking."
        empty="Belum ada promo aktif."
        columns={[
          { key: 'name', label: 'Nama Promo', fmt: (r) => <span className="font-bold">{r.name}</span> },
          {
            key: 'type_name',
            label: 'Berlaku Untuk',
            fmt: (r) => r.type_name ? <Badge>{r.type_name}</Badge> : <Badge color={SEM.ok}>Semua Tipe</Badge>,
          },
          {
            key: 'price',
            label: 'Harga Promo / Bln',
            align: 'right',
            fmt: (r) => <span className="font-mono font-bold text-brand">{rp(r.price)}</span>,
          },
          { key: 'start_date', label: 'Mulai', fmt: (r) => <span className="font-mono">{r.start_date}</span> },
          { key: 'end_date', label: 'Sampai', fmt: (r) => <span className="font-mono">{r.end_date}</span> },
        ]}
        fields={[
          { key: 'name', label: 'Nama promo', req: 1 },
          {
            key: 'room_type_id',
            label: 'Tipe kamar',
            type: 'select',
            options: opts(types, (t) => t.name),
            hint: () => 'Kosongkan jika berlaku untuk semua tipe kamar',
          },
          { key: 'price', label: 'Harga promo / bulan', type: 'number', req: 1 },
          { key: 'start_date', label: 'Mulai berlaku', type: 'date', req: 1 },
          { key: 'end_date', label: 'Sampai dengan', type: 'date', req: 1 },
        ]}
      />
      <PromoCalc />
    </div>
  );
}

const KINDS: Record<string, string[]> = {
  income: ['Pemasukan', 'Pemasukan operasional & sewa'],
  expense: ['Biaya', 'Biaya rutin & operasional'],
  capital: ['Modal', 'Modal awal & investasi'],
};
const DESC: Record<string, string> = {
  income: 'Pembayaran sewa booking otomatis masuk sini. Pemasukan lain bisa dicatat manual.',
  expense: 'Listrik, air, wifi, gaji, kebersihan, dan biaya rutin lainnya.',
  capital: 'Modal awal dan renovasi/investasi properti untuk perhitungan balik modal.',
};

const MONS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const monLabel = (m: string) => `${MONS[+m.slice(5) - 1]} ${m.slice(2, 4)}`;
const dmy = (s?: string) =>
  s ? `${+s.slice(8)} ${MONS[+s.slice(5, 7) - 1]} ${s.slice(2, 4)}` : '-';

// Tabel buku kas + filter bulan / kategori / kamar lewat bottom sheet.
function Ledger({ kind }: { kind: string }) {
  const [cats] = useList('categories');
  const [rooms] = useList('rooms');
  const catOpts = opts(
    cats.filter((c) => c.kind === kind),
    (c) => c.name
  );
  const f = useFilterSheet<{ month: string; cat: number; room: number }>({
    month: '',
    cat: 0,
    room: 0,
  });
  const { month, cat, room } = f.applied;
  const rowFilter = (r: Row) =>
    (!month || r.date.startsWith(month)) &&
    (!cat || r.category_id === cat) &&
    (!room || r.room_id === room);

  const active: ActiveFilter[] = [
    ...(month ? [{ key: 'm', label: monLabel(month), onRemove: () => f.set({ ...f.applied, month: '' }) }] : []),
    ...(cat ? [{ key: 'c', label: cats.find((c) => c.id === cat)?.name ?? 'Kategori', onRemove: () => f.set({ ...f.applied, cat: 0 }) }] : []),
    ...(room ? [{ key: 'r', label: `Kamar ${rooms.find((r) => r.id === room)?.number ?? ''}`, onRemove: () => f.set({ ...f.applied, room: 0 }) }] : []),
  ];

  return (
    <Crud
      key={kind}
      resource="transactions"
      query={`?kind=${kind}`}
      title={KINDS[kind][0]}
      desc={DESC[kind]}
      defaults={{ date: today() }}
      table
      rowFilter={rowFilter}
      empty={
        kind === 'income'
          ? 'Pembayaran booking otomatis muncul di sini.'
          : 'Belum ada catatan transaksi.'
      }
      toolbar={(all) => {
        const months = [...new Set(all.map((r) => String(r.date).slice(0, 7)))].sort().reverse();
        const totalAmount = all.reduce((acc, r) => acc + (r.amount || 0), 0);
        return (
          <div className="space-y-4">
            {/* KPI Banner */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Card className="p-3.5 md:p-4">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-mut">
                  Total {KINDS[kind][0]}
                </span>
                <div className="mt-1 font-mono text-xl md:text-2xl font-bold tracking-tight text-tx">
                  {rp(totalAmount)}
                </div>
              </Card>
              <Card className="p-3.5 md:p-4">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-mut">
                  Jumlah Transaksi
                </span>
                <div className="mt-1 font-mono text-xl md:text-2xl font-bold tracking-tight text-tx">
                  {all.length} <span className="text-xs text-mut font-normal">catatan</span>
                </div>
              </Card>
              <Card className="col-span-2 sm:col-span-1 p-3.5 md:p-4">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-mut">
                  Rata-rata
                </span>
                <div className="mt-1 font-mono text-xl md:text-2xl font-bold tracking-tight text-tx">
                  {all.length > 0 ? rp(Math.round(totalAmount / all.length)) : '-'}
                </div>
              </Card>
            </div>

            <div className="flex items-center justify-between">
              <FilterButton onClick={f.show} filters={active} />
            </div>

            {f.open && (
              <FilterSheet onClose={f.close} onReset={f.reset} onApply={f.apply}>
                <FilterGroup label="Bulan Transaksi">
                  <FilterChip
                    selected={!f.draft.month}
                    onClick={() => f.setDraft({ ...f.draft, month: '' })}
                  >
                    Semua Bulan
                  </FilterChip>
                  {months.map((m) => (
                    <FilterChip
                      key={m}
                      selected={f.draft.month === m}
                      onClick={() => f.setDraft({ ...f.draft, month: m })}
                    >
                      {monLabel(m)}
                    </FilterChip>
                  ))}
                </FilterGroup>
                <FilterGroup label="Kategori">
                  <FilterChip
                    selected={!f.draft.cat}
                    onClick={() => f.setDraft({ ...f.draft, cat: 0 })}
                  >
                    Semua Kategori
                  </FilterChip>
                  {catOpts.map((c) => (
                    <FilterChip
                      key={c.v}
                      selected={f.draft.cat === c.v}
                      onClick={() => f.setDraft({ ...f.draft, cat: Number(c.v) })}
                    >
                      {c.l}
                    </FilterChip>
                  ))}
                </FilterGroup>
                <FilterGroup label="Kamar">
                  <FilterChip
                    selected={!f.draft.room}
                    onClick={() => f.setDraft({ ...f.draft, room: 0 })}
                  >
                    Semua Kamar
                  </FilterChip>
                  {rooms
                    .filter((r) => !r.archived)
                    .map((r) => (
                      <FilterChip
                        key={r.id}
                        selected={f.draft.room === r.id}
                        onClick={() => f.setDraft({ ...f.draft, room: r.id })}
                      >
                        Kamar {r.number}
                      </FilterChip>
                    ))}
                </FilterGroup>
              </FilterSheet>
            )}
          </div>
        );
      }}
      footer={(rs) =>
        rs.length > 0 && (
          <tfoot>
            <tr className="border-t-2 border-line bg-soft/30 font-bold text-tx">
              <td className="px-4 py-3">Total ({rs.length} Transaksi)</td>
              <td />
              <td className="whitespace-nowrap px-4 py-3 font-mono tabular-nums text-right">
                {rp(rs.reduce((a, r) => a + r.amount, 0))}
              </td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        )
      }
      columns={[
        {
          key: 'date',
          label: 'Tanggal',
          fmt: (r) => <span className="font-mono tabular-nums text-mut">{dmy(r.date)}</span>,
        },
        {
          key: 'category',
          label: 'Kategori',
          fmt: (r) => <span className="font-semibold">{r.category}</span>,
        },
        {
          key: 'amount',
          label: 'Nominal',
          align: 'right',
          fmt: (r) => (
            <span className="font-mono font-bold tabular-nums text-tx">
              {rp(r.amount)}
            </span>
          ),
        },
        {
          key: 'note',
          label: 'Keterangan',
          fmt: (r) =>
            r.guest_name ? (
              <span>
                Booking <strong className="font-bold text-tx">{r.guest_name}</strong>
                {r.note ? ` · ${r.note}` : ''}
              </span>
            ) : (
              r.note || '-'
            ),
        },
        {
          key: 'room_number',
          label: 'Kamar',
          fmt: (r) => (r.room_number ? `Kamar ${r.room_number}` : '-'),
        },
      ]}
      fields={[
        { key: 'date', label: 'Tanggal transaksi', type: 'date', req: 1 },
        { key: 'category_id', label: 'Kategori', type: 'select', req: 1, options: catOpts },
        { key: 'amount', label: 'Nominal (Rp)', type: 'number', req: 1 },
        {
          key: 'room_id',
          label: 'Kamar terkait (opsional)',
          type: 'select',
          options: opts(rooms, (r) => `Kamar ${r.number}`),
        },
        { key: 'method', label: 'Metode pembayaran (mis. Transfer, Tunai, QRIS)' },
        { key: 'note', label: 'Catatan / Keterangan' },
      ]}
    />
  );
}

export const Income = () => <Ledger kind="income" />;
export const Expense = () => <Ledger kind="expense" />;
export const Capital = () => <Ledger kind="capital" />;

export function Categories() {
  return (
    <Crud
      resource="categories"
      title="Kategori"
      desc="Label pengelompokan transaksi pemasukan, biaya, dan modal."
      columns={[
        {
          key: 'kind',
          label: 'Jenis Transaksi',
          fmt: (r) => <Badge>{KINDS[r.kind]?.[0] || r.kind}</Badge>,
        },
        { key: 'name', label: 'Nama Kategori', fmt: (r) => <span className="font-bold">{r.name}</span> },
        { key: 'uses', label: 'Dipakai', align: 'center', fmt: (r) => `${r.uses} transaksi` },
      ]}
      fields={[
        {
          key: 'kind',
          label: 'Jenis transaksi',
          type: 'select',
          req: 1,
          options: Object.entries(KINDS).map(([v, [l]]) => ({ v, l })),
        },
        { key: 'name', label: 'Nama kategori', req: 1 },
      ]}
    />
  );
}
