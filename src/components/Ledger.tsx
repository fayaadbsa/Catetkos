'use client';

import { rp, today } from '@/lib/api';
import { useList } from '@/lib/useList';
import type { Row } from '@/lib/types';
import Crud from '@/components/Crud';
import { opts } from '@/components/resource-helpers';
import {
  Card,
  FilterButton,
  FilterChip,
  FilterGroup,
  FilterSheet,
  useFilterSheet,
  type ActiveFilter,
} from '@/components/ui';

export const KINDS: Record<string, string[]> = {
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

export default function Ledger({ kind }: { kind: string }) {
  const [cats] = useList('categories');
  const [rooms] = useList('rooms');
  const catOpts = opts(
    cats.filter((c) => c.kind === kind),
    (c) => c.name,
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
    ...(month
      ? [{ key: 'm', label: monLabel(month), onRemove: () => f.set({ ...f.applied, month: '' }) }]
      : []),
    ...(cat
      ? [
          {
            key: 'c',
            label: cats.find((c) => c.id === cat)?.name ?? 'Kategori',
            onRemove: () => f.set({ ...f.applied, cat: 0 }),
          },
        ]
      : []),
    ...(room
      ? [
          {
            key: 'r',
            label: `Kamar ${rooms.find((r) => r.id === room)?.number ?? ''}`,
            onRemove: () => f.set({ ...f.applied, room: 0 }),
          },
        ]
      : []),
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
            <span className="font-mono font-bold tabular-nums text-tx">{rp(r.amount)}</span>
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
