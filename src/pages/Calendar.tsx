import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api, rp } from '../lib/api';
import { useList } from '../lib/useList';
import { Badge, Button, Card, Modal, PageHeader, Tabs } from '../components/ui';
import type { Row } from '../lib/types';

const MON = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const PAL = ['#c2563a', '#2563eb', '#16a34a', '#9333ea', '#ca8a04', '#0891b2', '#db2777', '#65a30d', '#ea580c', '#4f46e5'];
const ymd = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const dm = (s: string) => `${+s.slice(8)} ${MON[+s.slice(5, 7) - 1].slice(0, 3)}`;

// Bulan ditumpuk atas-bawah. Tiap kamar 1 baris, booking = bar dari check-in sampai check-out (check-out eksklusif). Warna per tamu.
// ponytail: render semua bulan sekaligus (kecil). Upgrade: virtualisasi kalau rentang jadi bertahun-tahun.
export default function Calendar() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [rooms] = useList('rooms');
  const [tipe] = useList('room-types');
  const [type, setType] = useState(0);
  const [sel, setSel] = useState<Row | null>(null);
  const refs = useRef<Record<string, HTMLElement | null>>({});
  useEffect(() => { api<Row[]>('/bookings').then(setRows).catch(() => setRows([])); }, []);

  const now = new Date();
  const cur = ymd(now.getFullYear(), now.getMonth(), 1).slice(0, 7);
  const bs = (rows || []).filter((b) => b.status !== 'cancelled');
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
  const color = useMemo(() => { const ids = [...new Set(bs.map((b) => b.guest_id))]; return (id: number) => PAL[ids.indexOf(id) % PAL.length]; }, [rows]); // eslint-disable-line react-hooks/exhaustive-deps
  const active = rooms.filter((r) => !r.archived && (!type || r.room_type_id === type));

  const go = (m: string) => refs.current[m]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  useEffect(() => { if (rows) refs.current[cur]?.scrollIntoView({ block: 'start' }); }, [rows]); // eslint-disable-line react-hooks/exhaustive-deps
  const step = (n: number) => { const vis = months.findIndex((m) => { const r = refs.current[m]?.getBoundingClientRect(); return r && r.bottom > 140; }); const t = months[Math.min(months.length - 1, Math.max(0, vis + n))]; if (t) go(t); };

  return (
    <div className="space-y-4">
      <PageHeader title="Kalender" desc="Scroll atas-bawah buat ganti bulan. Bar = lama tamu nginep, 1 warna per tamu.">
        <div className="flex gap-1">
          <Button variant="outline" aria-label="Bulan sebelumnya" onClick={() => step(-1)}><ChevronLeft size={16} /></Button>
          <Button variant="outline" onClick={() => go(cur)}>Hari ini</Button>
          <Button variant="outline" aria-label="Bulan berikutnya" onClick={() => step(1)}><ChevronRight size={16} /></Button>
        </div>
      </PageHeader>
      <Tabs label="Tipe kamar" value={type} onChange={setType} items={[[0, 'Semua tipe'], ...tipe.filter((t) => !t.archived).map((t) => [t.id, t.name] as [number, string])]} />
      {!rows ? <p className="text-mut">Lagi buka kalender...</p> : months.map((ym) => {
        const y = +ym.slice(0, 4), m = +ym.slice(5) - 1, n = new Date(y, m + 1, 0).getDate();
        const first = ymd(y, m, 1), nextFirst = m === 11 ? ymd(y + 1, 0, 1) : ymd(y, m + 1, 1);
        const td = ymd(now.getFullYear(), now.getMonth(), now.getDate());
        return (
          <Card key={ym} className="overflow-x-auto p-0">
            <div ref={(el) => { refs.current[ym] = el; }} className="scroll-mt-20 min-w-[44rem] p-3">
              <h3 className="mb-2 text-base font-semibold">{MON[m]} {y}{ym === cur && <span className="ml-2 text-xs font-semibold text-ok">bulan ini</span>}</h3>
              <div className="grid items-center gap-y-1" style={{ gridTemplateColumns: `4rem repeat(${n}, minmax(0, 1fr))` }}>
                <div />
                {Array.from({ length: n }, (_, i) => {
                  const dow = new Date(y, m, i + 1).getDay();
                  return <div key={i} className={`text-center text-[11px] leading-tight ${ymd(y, m, i + 1) === td ? 'font-bold text-tx' : dow === 0 ? 'text-danger' : 'text-mut'}`}>{i + 1}</div>;
                })}
                {active.map((r) => (
                  <div key={r.id} className="contents">
                    <div className="pr-1 text-sm font-semibold">{r.number}<span className="block text-[10px] font-normal text-mut">{r.type_name}</span></div>
                    <div className="relative h-8 rounded bg-soft/60" style={{ gridColumn: `2 / span ${n}` }}>
                      {ymd(now.getFullYear(), now.getMonth(), now.getDate()).slice(0, 7) === ym && <div className="absolute inset-y-0 w-px bg-tx/40" style={{ left: `${((now.getDate() - 0.5) / n) * 100}%` }} />}
                      {bs.filter((b) => b.room_id === r.id && b.check_in < nextFirst && b.check_out > first).map((b) => {
                        const s = b.check_in < first ? 0 : +b.check_in.slice(8) - 1;
                        const e = b.check_out >= nextFirst ? n : +b.check_out.slice(8) - 1; // check-out eksklusif
                        return (
                          <button key={b.id} onClick={() => setSel(b)} title={`${b.guest_name}: ${dm(b.check_in)} → ${dm(b.check_out)}`}
                            className="absolute inset-y-0.5 overflow-hidden whitespace-nowrap rounded px-1.5 text-left text-xs font-semibold text-white"
                            style={{ left: `${(s / n) * 100}%`, width: `calc(${((e - s) / n) * 100}% - 2px)`, background: color(b.guest_id) }}>{b.guest_name}</button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        );
      })}
      {sel && (
        <Modal title={sel.guest_name} onClose={() => setSel(null)} size="sm">
          <div className="space-y-2 text-sm">
            <p>Kamar {sel.room_number} · {dm(sel.check_in)} → {dm(sel.check_out)}</p>
            <p>Tagihan {rp(sel.price_total)} · {sel.paid >= sel.price_total ? <Badge color="#16a34a">Lunas</Badge> : <Badge color="#ca8a04">Belum lunas</Badge>}</p>
            {sel.deposit > 0 && <p>Deposit {rp(sel.deposit)}: {sel.deposit_returned_date ? `dikembalikan ${dm(sel.deposit_returned_date)}` : sel.deposit_paid_date ? 'dipegang' : 'belum diterima'}</p>}
            {sel.note && <p className="text-mut">{sel.note}</p>}
          </div>
        </Modal>
      )}
    </div>
  );
}
