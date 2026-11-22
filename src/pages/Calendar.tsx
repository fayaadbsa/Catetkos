import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api, rp } from '../lib/api';
import { useList } from '../lib/useList';
import { Badge, Button, Card, FilterButton, FilterChip, FilterGroup, FilterSheet, Modal, PageHeader, useFilterSheet } from '../components/ui';
import type { Row } from '../lib/types';

const MON = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const PAL = ['#c2563a', '#2563eb', '#16a34a', '#9333ea', '#ca8a04', '#0891b2', '#db2777', '#65a30d', '#ea580c', '#4f46e5'];
const ymd = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const ymdPlus = (s: string, n: number) => { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return ymd(d.getFullYear(), d.getMonth(), d.getDate()); };
const dm = (s: string) => `${+s.slice(8)} ${MON[+s.slice(5, 7) - 1].slice(0, 3)}`;

// Bulan ditumpuk atas-bawah. Tiap kamar 1 baris, booking = bar dari check-in sampai check-out (check-out eksklusif). Warna per tamu.
// ponytail: render semua bulan sekaligus (kecil). Upgrade: virtualisasi kalau rentang jadi bertahun-tahun.
export default function Calendar() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [rooms] = useList('rooms');
  const [tipe] = useList('room-types');
  const fs = useFilterSheet({ type: 0 });
  const type = fs.applied.type;
  const [sel, setSel] = useState<Row[] | null>(null);
  const refs = useRef<Record<string, HTMLElement | null>>({});
  useEffect(() => { api<Row[]>('/bookings').then(setRows).catch(() => setRows([])); }, []);

  const now = new Date();
  const cur = ymd(now.getFullYear(), now.getMonth(), 1).slice(0, 7);
  const bs = (rows || []).filter((b) => b.status !== 'cancelled');
  // Penghuni sama + kamar sama + tanggal nyambung (check-out = check-in berikutnya) = satu penginapan panjang.
  const stays = useMemo(() => {
    const out: { id: number; room_id: number; guest_id: number; guest_name: string; check_in: string; check_out: string; parts: Row[] }[] = [];
    for (const b of [...bs].sort((x, y) => x.check_in.localeCompare(y.check_in))) {
      const last = out.find((s) => s.room_id === b.room_id && s.guest_id === b.guest_id && s.check_out === b.check_in);
      if (last) { last.check_out = b.check_out; last.parts.push(b); } else out.push({ id: b.id, room_id: b.room_id, guest_id: b.guest_id, guest_name: b.guest_name, check_in: b.check_in, check_out: b.check_out, parts: [b] });
    }
    return out;
  }, [rows]); // eslint-disable-line react-hooks/exhaustive-deps
  const months = useMemo(() => {
    const first = bs.map((b) => b.check_in.slice(0, 7)).sort()[0] ?? cur;
    const last = bs.map((b) => b.check_out.slice(0, 7)).sort().pop() ?? cur;
    const a = first < cur ? first : cur;
    const b = last > cur ? last : cur;
    const out: string[] = [];
    let y = +a.slice(0, 4), m = +a.slice(5) - 1;
    const end = +b.slice(0, 4) * 12 + +b.slice(5) - 1 + 1; // 1 bulan setelah booking terakhir
    while (y * 12 + m <= end) { out.push(`${y}-${String(m + 1).padStart(2, '0')}`); m++; if (m > 11) { m = 0; y++; } }
    return out;
  }, [rows]); // eslint-disable-line react-hooks/exhaustive-deps
  // Kalender menerus: tanggal numpuk tanpa jeda bulan, tiap baris maks 7 hari (Senin-Minggu).
  const weeks = useMemo(() => {
    const d0 = new Date(+months[0].slice(0, 4), +months[0].slice(5) - 1, 1);
    d0.setDate(d0.getDate() - ((d0.getDay() + 6) % 7));
    const lastM = months[months.length - 1];
    const endD = new Date(+lastM.slice(0, 4), +lastM.slice(5), 0);
    const out: string[][] = [];
    for (const d = new Date(d0); d <= endD || out.length === 0; ) {
      const w: string[] = [];
      for (let i = 0; i < 7; i++) { w.push(ymd(d.getFullYear(), d.getMonth(), d.getDate())); d.setDate(d.getDate() + 1); }
      out.push(w);
    }
    return out;
  }, [months]);
  const color = useMemo(() => { const ids = [...new Set(bs.map((b) => b.guest_id))]; return (id: number) => PAL[ids.indexOf(id) % PAL.length]; }, [rows]); // eslint-disable-line react-hooks/exhaustive-deps
  const active = rooms.filter((r) => !r.archived && (!type || r.room_type_id === type));
  const td = ymd(now.getFullYear(), now.getMonth(), now.getDate());

  const go = (m: string) => refs.current[m]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  useEffect(() => { if (rows) refs.current[cur]?.scrollIntoView({ block: 'start' }); }, [rows]); // eslint-disable-line react-hooks/exhaustive-deps
  const step = (n: number) => { const vis = months.findIndex((m) => { const r = refs.current[m]?.getBoundingClientRect(); return r && r.top > 100; }); const i = vis < 0 ? months.length - 1 : vis; const t = months[Math.min(months.length - 1, Math.max(0, i + n - (n < 0 && vis >= 0 ? 0 : 0)))]; if (t) go(t); };

  return (
    <div className="space-y-4">
      <PageHeader title="Kalender" desc="Scroll atas-bawah. Bar = lama tamu nginep, 1 warna per tamu.">
        <div className="flex gap-1">
          <Button variant="outline" aria-label="Bulan sebelumnya" onClick={() => step(-1)}><ChevronLeft size={16} /></Button>
          <Button variant="outline" onClick={() => go(cur)}>Hari ini</Button>
          <Button variant="outline" aria-label="Bulan berikutnya" onClick={() => step(1)}><ChevronRight size={16} /></Button>
        </div>
      </PageHeader>
      <FilterButton onClick={fs.show} filters={type ? [{ key: 't', label: tipe.find((t) => t.id === type)?.name ?? 'Tipe', onRemove: () => fs.set({ type: 0 }) }] : []} />
      {fs.open && (
        <FilterSheet onClose={fs.close} onReset={fs.reset} onApply={fs.apply}>
          <FilterGroup label="Tipe kamar">
            <FilterChip selected={!fs.draft.type} onClick={() => fs.setDraft({ type: 0 })}>Semua</FilterChip>
            {tipe.filter((t) => !t.archived).map((t) => <FilterChip key={t.id} selected={fs.draft.type === t.id} onClick={() => fs.setDraft({ type: t.id })}>{t.name}</FilterChip>)}
          </FilterGroup>
        </FilterSheet>
      )}
      {!rows ? <p className="text-mut">Lagi buka kalender...</p> : (
        <Card className="overflow-hidden p-0">
          <div className="sticky top-14 z-10 grid grid-cols-[1.25rem_repeat(7,minmax(0,1fr))] border-b border-line bg-surface px-2 py-1.5 text-center text-[11px] font-semibold text-mut md:top-0">
            <span />{['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((d) => <span key={d} className={d === 'Min' ? 'text-danger' : ''}>{d}</span>)}
          </div>
          {weeks.map((w) => {
            const ym1 = w.find((d) => d.endsWith('-01') && months.includes(d.slice(0, 7)));
            const wFirst = w[0], wEnd = ymdPlus(w[6], 1);
            return (
              <div key={w[0]} ref={(el) => { if (ym1) refs.current[ym1.slice(0, 7)] = el; }} className="scroll-mt-28 border-b border-line px-2 pb-1.5 last:border-b-0">
                {ym1 && <h3 className="pt-2 text-sm font-semibold">{MON[+ym1.slice(5, 7) - 1]} {ym1.slice(0, 4)}{ym1.slice(0, 7) === cur && <span className="ml-2 text-xs font-semibold text-ok">bulan ini</span>}</h3>}
                <div className="grid grid-cols-[1.25rem_repeat(7,minmax(0,1fr))] items-center gap-y-0.5 pt-1">
                  <span />
                  {w.map((d) => (
                    <div key={d} className={`text-center text-xs leading-6 ${d === td ? 'mx-auto w-6 rounded-full bg-primary font-bold text-primary-fg' : d.slice(5, 7) === w[0].slice(5, 7) || +d.slice(8) === 1 ? 'text-tx' : 'text-tx'}`}>
                      {+d.slice(8) === 1 ? `1 ${MON[+d.slice(5, 7) - 1].slice(0, 3)}` : +d.slice(8)}
                    </div>
                  ))}
                  {active.map((r) => (
                    <div key={r.id} className="contents">
                      <span className="text-[10px] font-semibold text-mut">{r.number}</span>
                      <div className="relative h-6 rounded bg-soft/60" style={{ gridColumn: '2 / span 7' }}>
                        {stays.filter((b) => b.room_id === r.id && b.check_in < wEnd && b.check_out > wFirst).map((b) => {
                          const s = b.check_in <= wFirst ? 0 : w.indexOf(b.check_in);
                          const e = b.check_out > w[6] ? 7 : w.indexOf(b.check_out); // check-out eksklusif
                          const capL = b.check_in >= wFirst, capR = b.check_out <= w[6];
                          return (
                            <button key={b.id} onClick={() => setSel(b.parts)} title={`${b.guest_name}: ${dm(b.check_in)} → ${dm(b.check_out)}`}
                              className={`absolute inset-y-0.5 overflow-hidden whitespace-nowrap px-1 text-left text-[11px] font-semibold text-white ${capL ? 'rounded-l' : ''} ${capR ? 'rounded-r' : ''}`}
                              style={{ left: `${(s / 7) * 100}%`, width: `${((e - s) / 7) * 100}%`, background: color(b.guest_id) }}>{b.guest_name}</button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </Card>
      )}
      {sel && (
        <Modal title={sel[0].guest_name} onClose={() => setSel(null)} size="sm">
          <div className="space-y-2 text-sm">
            <p>Kamar {sel[0].room_number} · {dm(sel[0].check_in)} → {dm(sel[sel.length - 1].check_out)} ({sel.length} bulan)</p>
            <p>Total {rp(sel.reduce((a, b) => a + b.price_total, 0))}</p>
            <ul className="divide-y divide-line rounded-md border border-line">
              {sel.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-2 px-3 py-2">
                  <span>{dm(b.check_in)} → {dm(b.check_out)}</span>
                  {b.paid >= b.price_total ? <Badge color="#16a34a">Lunas</Badge> : <Badge color="#ca8a04">Belum lunas</Badge>}
                </li>
              ))}
            </ul>
            {sel[0].deposit > 0 && <p>Deposit {rp(sel[0].deposit)}: {sel[0].deposit_returned_date ? `dikembalikan ${dm(sel[0].deposit_returned_date)}` : sel[0].deposit_paid_date ? 'dipegang' : 'belum diterima'}</p>}
            {sel[0].note && <p className="text-mut">{sel[0].note}</p>}
          </div>
        </Modal>
      )}
    </div>
  );
}
