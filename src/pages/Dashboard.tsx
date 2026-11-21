import { useEffect, useState } from 'react';
import { useList } from '../lib/useList';
import { Tabs } from '../components/ui';
import { ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { api, rp } from '../lib/api';
import { C, SEM, roomColor } from '../lib/theme';
import { AlertOctagon, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { Card, Stat, PageHeader } from '../components/ui';

const MON = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const mon = (m: string) => `${MON[+m.slice(5) - 1]} ${m.slice(2, 4)}`;
const short = (v: number) => (Math.abs(v) >= 1e6 ? `${String(+(v / 1e6).toFixed(1)).replace('.', ',')}jt` : `${Math.round(v / 1e3)}rb`);

export default function Dashboard() {
  const [d, setD] = useState<any>(null);
  const [days, setDays] = useState(30);
  const [type, setType] = useState(0);
  const [tipe] = useList('room-types');
  useEffect(() => { api(`/dashboard?days=${days}&type=${type}`).then(setD).catch(() => {}); }, [days, type]);
  if (!d) return <p className="text-mut">Lagi ngitung duit...</p>;
  const pb = d.payback;
  const LV: Record<string, [typeof Info, string]> = { urgent: [AlertOctagon, 'text-danger'], warn: [AlertTriangle, 'text-warn'], info: [Info, 'text-mut'], ok: [CheckCircle2, 'text-ok'] };
  const types = Object.entries<any>(d.byType).map(([name, v]) => ({ name, value: v.revenue }));
  const typeTotal = types.reduce((a: number, t) => a + t.value, 0);
  return (
    <div className="space-y-4">
      <PageHeader title="Dashboard" desc={`Kondisi kos ${d.windowDays} hari terakhir.`} />
      <div className="flex flex-wrap items-center gap-2">
        <Tabs label="Rentang waktu" value={days} onChange={setDays} items={[[7, '7 hari'], [30, '30 hari'], [90, '3 bulan'], [365, '1 tahun']]} />
        <Tabs label="Tipe kamar" value={type} onChange={setType} items={[[0, 'Semua tipe'], ...tipe.filter((t) => !t.archived).map((t) => [t.id, t.name] as [number, string])]} />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
        <Stat label="Okupansi" value={`${d.occupancy}%`} hint={`dari ${d.roomCount} kamar aktif`} />
        <Stat label="Omzet promo" value={rp(d.promoSplit.promo)} />
        <Stat label="Omzet normal" value={rp(d.promoSplit.normal)} />
        <Stat label="Belum dibayar" value={rp(d.receivable.total)} hint={`${d.receivable.count} booking`} />
        <Stat label="Deposit dipegang" value={rp(d.depositHeld)} hint="Titipan, bukan omzet" />
        <Stat label="Balik modal" value={pb.capitalTotal ? (pb.done ? 'Sudah!' : `${pb.pct}%`) : '-'}
          hint={pb.monthsLeft ? `±${pb.monthsLeft} bulan lagi` : pb.capitalTotal ? `Modal ${rp(pb.capitalTotal)}` : 'Isi modal di menu Modal'} />
      </div>

      <Card>
        <h3 className="text-base font-semibold">Status kamar</h3>
        <p className="mb-3 text-sm text-mut">Titik hijau = ada penghuni. Abu = kosong.</p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {d.emptyRooms.map((r: any) => {
            return (
              <div key={r.id} className="rounded-md border p-3"
                style={r.occupied ? { borderColor: SEM.ok, background: SEM.ok + '1f' } : { borderColor: 'rgb(var(--line))', background: 'rgb(var(--soft) / .6)' }}>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="size-2.5 rounded-full" style={{ background: r.occupied ? SEM.ok : SEM.mut }} aria-hidden />
                  {r.number} · {r.type}
                </div>
                <div className="mt-1 text-sm text-mut">
                  {r.occupied ? 'Ada penghuni, aman' : r.emptyDays === null ? 'Belum pernah laku, sabar' : `Nganggur ${Math.round(r.emptyDays)} hari`}{!r.occupied && r.upcoming ? ` · booking ${r.upcoming}` : ''}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-2 text-base font-semibold">Duit masuk vs keluar ({d.months} bulan)</h3>
          <div className="h-56 md:h-64">
            <ResponsiveContainer>
              <BarChart data={d.cashflow} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                <XAxis dataKey="month" stroke={C.axis} tickFormatter={mon} tickMargin={8} />
                <YAxis stroke={C.axis} tickFormatter={short} />
                <Tooltip formatter={(v) => rp(Number(v))} contentStyle={C.tip} cursor={{ fill: '#8a7a6622' }} />
                <Legend formatter={(v) => <span style={{ color: 'rgb(var(--tx))' }}>{v}</span>} />
                <Bar isAnimationActive={false} dataKey="income" name="Pemasukan" fill={C.income} radius={[6, 6, 0, 0]} />
                <Bar isAnimationActive={false} dataKey="expense" name="Pengeluaran" fill={C.expense} radius={[6, 6, 0, 0]} />
                {d.cashflow.some((m: any) => m.capital > 0) && <Bar isAnimationActive={false} dataKey="capital" name="Modal" fill={C.capital} radius={[6, 6, 0, 0]} />}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="mb-2 text-base font-semibold">Omzet per tipe kamar</h3>
          {types.length ? (
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={types} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3} stroke="none">
                    {types.map((t, i) => <Cell key={t.name} fill={roomColor(i)} />)}
                  </Pie>
                  <text x="50%" y="42%" textAnchor="middle" dominantBaseline="middle" fill="rgb(var(--tx))" fontWeight="800" fontSize="15">{short(typeTotal)}</text>
                  <Tooltip formatter={(v) => rp(Number(v))} contentStyle={C.tip} />
                  <Legend formatter={(v) => { const t = types.find((x) => x.name === v); return <span style={{ color: 'rgb(var(--tx))' }}>{v}{t && typeTotal ? ` · ${Math.round((t.value / typeTotal) * 100)}%` : ''}</span>; }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-sm text-mut">Belum ada booking.</p>}
        </Card>
      </div>

      <Card>
        <h3 className="mb-2 text-base font-semibold">Biaya per kategori ({d.windowDays} hari)</h3>
        {d.expenseByCat.length ? (
          <div className="h-56"><ResponsiveContainer><BarChart data={d.expenseByCat} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.grid} horizontal={false} />
            <XAxis type="number" stroke={C.axis} tickFormatter={short} /><YAxis type="category" dataKey="name" stroke={C.axis} width={80} />
            <Tooltip formatter={(v) => rp(Number(v))} contentStyle={C.tip} cursor={{ fill: '#8a7a6622' }} />
            <Bar dataKey="value" name="Biaya" radius={[0, 6, 6, 0]}>{d.expenseByCat.map((t: any, i: number) => <Cell key={t.name} fill={roomColor(i)} />)}</Bar>
          </BarChart></ResponsiveContainer></div>
        ) : <p className="text-sm text-mut">Belum ada biaya di rentang ini.</p>}
      </Card>

      <Card>
        <h3 className="mb-2 text-base font-semibold">Bisik-bisik dashboard</h3>
        <ul className="space-y-2 text-sm text-tx">
          {d.insights.map((x: any, i: number) => {
            const [Icon, cls] = LV[x.level] || LV.info;
            return <li key={i} className="flex gap-2"><Icon size={16} className={`mt-0.5 shrink-0 ${cls}`} aria-hidden />{x.text}</li>;
          })}
        </ul>
      </Card>
    </div>
  );
}
