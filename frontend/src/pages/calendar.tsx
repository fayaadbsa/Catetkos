
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api, rp } from '@/lib/api';
import { useList } from '@/lib/useList';
import {
  Badge,
  Card,
  FilterButton,
  FilterChip,
  FilterGroup,
  FilterSheet,
  Modal,
  PageHeader,
  useFilterSheet,
} from '@/components/ui';
import type { Row } from '@/lib/types';

const MON = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];
const PAL = [
  '#c2563a',
  '#2563eb',
  '#16a34a',
  '#9333ea',
  '#ca8a04',
  '#0891b2',
  '#db2777',
  '#65a30d',
  '#ea580c',
  '#4f46e5',
];
const ymd = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const ymdPlus = (s: string, n: number) => {
  const d = new Date(s + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return ymd(d.getFullYear(), d.getMonth(), d.getDate());
};
const dm = (s: string) => `${+s.slice(8)} ${MON[+s.slice(5, 7) - 1].slice(0, 3)}`;

export default function Calendar() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [rooms] = useList('rooms');
  const [tipe] = useList('room-types');
  const fs = useFilterSheet({ type: 0 });
  const type = fs.applied.type;
  const [sel, setSel] = useState<Row[] | null>(null);
  const refs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    api<Row[]>('/bookings')
      .then(setRows)
      .catch(() => setRows([]));
  }, []);

  const now = new Date();
  const cur = ymd(now.getFullYear(), now.getMonth(), 1).slice(0, 7);
  const bs = (rows || []).filter((b) => b.status !== 'cancelled');

  const stays = useMemo(() => {
    const out: {
      id: number;
      room_id: number;
      guest_id: number;
      guest_name: string;
      check_in: string;
      check_out: string;
      parts: Row[];
    }[] = [];
    for (const b of [...bs].sort((x, y) => x.check_in.localeCompare(y.check_in))) {
      const last = out.find(
        (s) => s.room_id === b.room_id && s.guest_id === b.guest_id && s.check_out === b.check_in,
      );
      if (last) {
        last.check_out = b.check_out;
        last.parts.push(b);
      } else {
        out.push({
          id: b.id,
          room_id: b.room_id,
          guest_id: b.guest_id,
          guest_name: b.guest_name,
          check_in: b.check_in,
          check_out: b.check_out,
          parts: [b],
        });
      }
    }
    return out;
  }, [rows]); // eslint-disable-line react-hooks/exhaustive-deps

  const months = useMemo(() => {
    const first = bs.map((b) => b.check_in.slice(0, 7)).sort()[0] ?? cur;
    const last =
      bs
        .map((b) => b.check_out.slice(0, 7))
        .sort()
        .pop() ?? cur;
    const a = first < cur ? first : cur;
    const b = last > cur ? last : cur;
    const out: string[] = [];
    let y = +a.slice(0, 4),
      m = +a.slice(5) - 1;
    const end = +b.slice(0, 4) * 12 + +b.slice(5) - 1 + 1;
    while (y * 12 + m <= end) {
      out.push(`${y}-${String(m + 1).padStart(2, '0')}`);
      m++;
      if (m > 11) {
        m = 0;
        y++;
      }
    }
    return out;
  }, [rows]); // eslint-disable-line react-hooks/exhaustive-deps

  const weeks = useMemo(() => {
    const d0 = new Date(+months[0].slice(0, 4), +months[0].slice(5) - 1, 1);
    d0.setDate(d0.getDate() - ((d0.getDay() + 6) % 7));
    const lastM = months[months.length - 1];
    const endD = new Date(+lastM.slice(0, 4), +lastM.slice(5), 0);
    const out: string[][] = [];
    for (const d = new Date(d0); d <= endD || out.length === 0;) {
      const w: string[] = [];
      for (let i = 0; i < 7; i++) {
        w.push(ymd(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setDate(d.getDate() + 1);
      }
      out.push(w);
    }
    return out;
  }, [months]);

  const color = useMemo(() => {
    const ids = [...new Set(bs.map((b) => b.guest_id))];
    return (id: number) => PAL[ids.indexOf(id) % PAL.length];
  }, [rows]); // eslint-disable-line react-hooks/exhaustive-deps

  const active = rooms.filter((r) => !r.archived && (!type || r.room_type_id === type));
  const td = ymd(now.getFullYear(), now.getMonth(), now.getDate());

  const go = (m: string) => refs.current[m]?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  useEffect(() => {
    if (rows) refs.current[cur]?.scrollIntoView({ block: 'start' });
  }, [rows]); // eslint-disable-line react-hooks/exhaustive-deps

  const step = (n: number) => {
    const vis = months.findIndex((m) => {
      const r = refs.current[m]?.getBoundingClientRect();
      return r && r.top > 100;
    });
    const i = vis < 0 ? months.length - 1 : vis;
    const t = months[Math.min(months.length - 1, Math.max(0, i + n - (n < 0 && vis >= 0 ? 0 : 0)))];
    if (t) go(t);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Command Strip */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Kalender Hunian"
          desc="Timeline okupansi kamar & alur tamu menginap (1 warna per tamu)."
        />

        <div className="flex flex-wrap items-center gap-2">
          {/* Month Step Navigation Controls */}
          <div className="inline-flex items-center rounded-xl border border-line bg-surface p-1 shadow-card">
            <button
              type="button"
              aria-label="Bulan sebelumnya"
              onClick={() => step(-1)}
              className="grid size-8 place-items-center rounded-lg text-mut hover:bg-soft hover:text-tx transition-colors active:scale-95"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => go(cur)}
              className="px-3 py-1 text-xs font-bold text-tx hover:bg-soft rounded-lg transition-colors"
            >
              Bulan Ini
            </button>
            <button
              type="button"
              aria-label="Bulan berikutnya"
              onClick={() => step(1)}
              className="grid size-8 place-items-center rounded-lg text-mut hover:bg-soft hover:text-tx transition-colors active:scale-95"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <FilterButton
            onClick={fs.show}
            filters={
              type
                ? [
                    {
                      key: 't',
                      label: tipe.find((t) => t.id === type)?.name ?? 'Tipe',
                      onRemove: () => fs.set({ type: 0 }),
                    },
                  ]
                : []
            }
          />
        </div>
      </div>

      {fs.open && (
        <FilterSheet onClose={fs.close} onReset={fs.reset} onApply={fs.apply}>
          <FilterGroup label="Tipe Kamar">
            <FilterChip selected={!fs.draft.type} onClick={() => fs.setDraft({ type: 0 })}>
              Semua Tipe
            </FilterChip>
            {tipe
              .filter((t) => !t.archived)
              .map((t) => (
                <FilterChip
                  key={t.id}
                  selected={fs.draft.type === t.id}
                  onClick={() => fs.setDraft({ type: t.id })}
                >
                  {t.name}
                </FilterChip>
              ))}
          </FilterGroup>
        </FilterSheet>
      )}

      {/* Main Calendar Card */}
      {!rows ? (
        <Card className="flex min-h-[40vh] items-center justify-center p-8">
          <p className="text-sm font-medium text-mut animate-pulse">
            Menyiapkan matriks kalender...
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0 shadow-card">
          {/* Day of week header sticky */}
          <div className="sticky top-12 md:top-16 z-10 grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] border-b border-line bg-surface/95 px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-mut backdrop-blur-md">
            <span className="text-left pl-1">Kamar</span>
            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((d) => (
              <span key={d} className={d === 'Min' ? 'text-danger' : 'text-tx'}>
                {d}
              </span>
            ))}
          </div>

          <div className="divide-y divide-line/60">
            {weeks.map((w) => {
              const ym1 = w.find((d) => d.endsWith('-01') && months.includes(d.slice(0, 7)));
              const wFirst = w[0],
                wEnd = ymdPlus(w[6], 1);

              return (
                <div
                  key={w[0]}
                  ref={(el) => {
                    if (ym1) refs.current[ym1.slice(0, 7)] = el;
                  }}
                  className="scroll-mt-32 px-3 py-2 transition-colors hover:bg-soft/20"
                >
                  {ym1 && (
                    <div className="flex items-center gap-2 pt-2 pb-1.5 border-b border-line/40 mb-2">
                      <span className="text-sm font-bold text-tx">
                        {MON[+ym1.slice(5, 7) - 1]} {ym1.slice(0, 4)}
                      </span>
                      {ym1.slice(0, 7) === cur && (
                        <Badge variant="ok" className="text-[10px]">
                          Bulan Ini
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] items-center gap-y-1.5">
                    {/* Row header: empty or date label */}
                    <span className="text-[10px] font-medium text-mut/60" />

                    {/* Date Numbers Header */}
                    {w.map((d) => {
                      const isToday = d === td;
                      const isFirst = +d.slice(8) === 1;
                      return (
                        <div key={d} className="text-center">
                          <span
                            className={`inline-grid size-6 place-items-center text-xs font-mono font-medium rounded-full ${
                              isToday
                                ? 'bg-primary font-bold text-primary-fg shadow-card'
                                : isFirst
                                  ? 'font-bold text-brand'
                                  : 'text-mut'
                            }`}
                          >
                            {isFirst ? `1 ${MON[+d.slice(5, 7) - 1].slice(0, 3)}` : +d.slice(8)}
                          </span>
                        </div>
                      );
                    })}

                    {/* Rooms Rows */}
                    {active.map((r) => (
                      <div key={r.id} className="contents group/room">
                        <span className="font-mono text-xs font-bold text-tx truncate pl-1">
                          {r.number}
                        </span>
                        <div
                          className="relative h-7 rounded-lg bg-soft/60 border border-line/40 transition-colors group-hover/room:bg-soft"
                          style={{ gridColumn: '2 / span 7' }}
                        >
                          {stays
                            .filter(
                              (b) =>
                                b.room_id === r.id && b.check_in < wEnd && b.check_out > wFirst,
                            )
                            .map((b) => {
                              const s = b.check_in <= wFirst ? 0 : w.indexOf(b.check_in);
                              const e = b.check_out > w[6] ? 7 : w.indexOf(b.check_out);
                              const capL = b.check_in >= wFirst,
                                capR = b.check_out <= w[6];

                              return (
                                <button
                                  key={b.id}
                                  type="button"
                                  onClick={() => setSel(b.parts)}
                                  title={`${b.guest_name}: ${dm(b.check_in)} → ${dm(b.check_out)}`}
                                  className={`absolute inset-y-1 overflow-hidden whitespace-nowrap px-2 text-left text-[11px] font-bold text-white shadow-2xs transition-transform active:scale-95 ${
                                    capL ? 'rounded-l-md' : ''
                                  } ${capR ? 'rounded-r-md' : ''}`}
                                  style={{
                                    left: `${(s / 7) * 100}%`,
                                    width: `${((e - s) / 7) * 100}%`,
                                    background: color(b.guest_id),
                                  }}
                                >
                                  <span className="truncate block drop-shadow-xs">
                                    {b.guest_name}
                                  </span>
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Booking Stay Detail Modal */}
      {sel && (
        <Modal title={sel[0].guest_name} onClose={() => setSel(null)} size="sm">
          <div className="space-y-4 text-xs md:text-sm">
            <div className="rounded-xl border border-line bg-soft/50 p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-mut">Kamar</span>
                <span className="font-mono font-bold text-tx">Kamar {sel[0].room_number}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-mut">Periode</span>
                <span className="font-mono tabular-nums font-bold text-tx">
                  {dm(sel[0].check_in)} → {dm(sel[sel.length - 1].check_out)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-line/60 pt-1 mt-1">
                <span className="font-semibold text-tx">Total Tagihan</span>
                <span className="font-mono font-bold text-brand">
                  {rp(sel.reduce((a, b) => a + b.price_total, 0))}
                </span>
              </div>
            </div>

            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-mut mb-2">
                Rincian Bulan ({sel.length} Bulan)
              </span>
              <ul className="divide-y divide-line/60 rounded-xl border border-line bg-surface overflow-hidden">
                {sel.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs"
                  >
                    <span className="font-mono tabular-nums text-tx">
                      {dm(b.check_in)} → {dm(b.check_out)}
                    </span>
                    {b.paid >= b.price_total ? (
                      <Badge variant="ok">Lunas</Badge>
                    ) : (
                      <Badge variant="warn">Belum Lunas</Badge>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {sel[0].deposit > 0 && (
              <div className="rounded-lg border border-line bg-surface p-3 text-xs flex justify-between items-center">
                <span className="text-mut font-semibold">Deposit</span>
                <span className="font-mono font-bold">
                  {rp(sel[0].deposit)} (
                  {sel[0].deposit_returned_date
                    ? `dikembalikan ${dm(sel[0].deposit_returned_date)}`
                    : sel[0].deposit_paid_date
                      ? 'dipegang'
                      : 'belum diterima'}
                  )
                </span>
              </div>
            )}

            {sel[0].note && (
              <p className="rounded-lg bg-soft/80 p-2.5 text-xs text-mut italic">
                &quot;{sel[0].note}&quot;
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
