import { useEffect, useState } from 'react';
import { ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { api, rp } from '../lib/api.js';
import { C, SEM, roomColor } from '../lib/theme.js';
import { Card, Stat, PageHeader } from './ui.jsx';

const MON = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const mon = (m) => `${MON[+m.slice(5) - 1]} ${m.slice(2, 4)}`;
const short = (v) => (Math.abs(v) >= 1e6 ? `${String(+(v / 1e6).toFixed(1)).replace('.', ',')}jt` : `${Math.round(v / 1e3)}rb`);

export default function Dashboard() {
  const [d, setD] = useState(null);
  useEffect(() => { api('/dashboard').then(setD).catch(() => {}); }, []);
  if (!d) return <p className="text-mut">Lagi ngitung duit...</p>;
  const pb = d.payback;
  const types = Object.entries(d.byType).map(([name, v]) => ({ name, value: v.revenue }));
  return (
    <div className="space-y-4">
      <PageHeader title="Dashboard" desc="Kondisi kos 30 hari terakhir." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
        <Stat color={C.rooms[0]} label="Okupansi" value={`${d.occupancy}%`} hint={`dari ${d.roomCount} kamar aktif`} />
        <Stat color={C.rooms[3]} label="Omzet promo" value={rp(d.promoSplit.promo)} />
        <Stat color={C.rooms[1]} label="Omzet normal" value={rp(d.promoSplit.normal)} />
        <Stat color={SEM.danger} label="Belum dibayar" value={rp(d.receivable.total)} hint={`${d.receivable.count} booking`} />
        <Stat color={C.rooms[4]} label="Deposit dipegang" value={rp(d.depositHeld)} hint="Titipan, bukan omzet" />
        <Stat color={C.rooms[2]} label="Balik modal" value={pb.capitalTotal ? (pb.done ? 'Sudah!' : `${pb.pct}%`) : '-'}
          hint={pb.monthsLeft ? `±${pb.monthsLeft} bulan lagi` : pb.capitalTotal ? `Modal ${rp(pb.capitalTotal)}` : 'Isi modal di menu Modal'} />
      </div>

      <Card>
        <h3 className="text-base font-bold">Status kamar</h3>
        <p className="mb-3 text-sm text-mut">Hijau = ada penghuni. Abu = kosong.</p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {d.emptyRooms.map((r) => {
            return (
              <div key={r.id} className="rounded-xl border p-3"
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
          <h3 className="mb-2 text-base font-bold">Duit masuk vs keluar (6 bulan)</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={d.cashflow} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                <XAxis dataKey="month" stroke={C.axis} tickFormatter={mon} tickMargin={8} />
                <YAxis stroke={C.axis} tickFormatter={short} />
                <Tooltip formatter={(v) => rp(v)} contentStyle={C.tip} cursor={{ fill: '#8a7a6622' }} />
                <Legend formatter={(v) => <span style={{ color: 'rgb(var(--tx))' }}>{v}</span>} />
                <Bar isAnimationActive={false} dataKey="income" name="Pemasukan" fill={C.income} radius={[6, 6, 0, 0]} />
                <Bar isAnimationActive={false} dataKey="expense" name="Pengeluaran" fill={C.expense} radius={[6, 6, 0, 0]} />
                {d.cashflow.some((m) => m.capital > 0) && <Bar isAnimationActive={false} dataKey="capital" name="Modal" fill={C.capital} radius={[6, 6, 0, 0]} />}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="mb-2 text-base font-bold">Omzet per tipe kamar</h3>
          {types.length ? (
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={types} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3} stroke="none">
                    {types.map((t, i) => <Cell key={t.name} fill={roomColor(i)} />)}
                  </Pie>
                  <Tooltip formatter={(v) => rp(v)} contentStyle={C.tip} />
                  <Legend formatter={(v) => <span style={{ color: 'rgb(var(--tx))' }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-sm text-mut">Belum ada booking.</p>}
        </Card>
      </div>

      <Card>
        <h3 className="mb-2 text-base font-bold">Biaya per kategori (30 hari)</h3>
        {d.expenseByCat.length ? (
          <div className="h-56"><ResponsiveContainer><BarChart data={d.expenseByCat} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.grid} horizontal={false} />
            <XAxis type="number" stroke={C.axis} tickFormatter={short} /><YAxis type="category" dataKey="name" stroke={C.axis} width={80} />
            <Tooltip formatter={(v) => rp(v)} contentStyle={C.tip} cursor={{ fill: '#8a7a6622' }} />
            <Bar dataKey="value" name="Biaya" radius={[0, 6, 6, 0]}>{d.expenseByCat.map((t, i) => <Cell key={t.name} fill={roomColor(i)} />)}</Bar>
          </BarChart></ResponsiveContainer></div>
        ) : <p className="text-sm text-mut">Belum ada biaya 30 hari ini.</p>}
      </Card>

      <Card>
        <h3 className="mb-2 text-base font-bold">Bisik-bisik dashboard</h3>
        <ul className="space-y-2 text-sm text-tx">
          {d.insights.map((x, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ background: roomColor(i) }} />
              {x}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
