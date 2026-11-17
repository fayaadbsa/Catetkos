import { useEffect, useState } from 'react';
import { ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { api, rp } from '../lib/api.js';
import { C, roomColor } from '../lib/theme.js';
import { Card, Stat } from './ui.jsx';

const short = (v) => (Math.abs(v) >= 1e6 ? `${+(v / 1e6).toFixed(1)}jt` : `${Math.round(v / 1e3)}rb`);

export default function Dashboard() {
  const [d, setD] = useState(null);
  useEffect(() => { api('/dashboard').then(setD).catch(() => {}); }, []);
  if (!d) return <p className="text-zinc-500">Lagi ngitung duit...</p>;
  const pb = d.payback;
  const types = Object.entries(d.byType).map(([name, v]) => ({ name, value: v.revenue }));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat color="#34d399" label="Okupansi 30 hari" value={`${d.occupancy}%`} hint={`${d.roomCount} kamar`} />
        <Stat color="#a78bfa" label="Omzet promo (30 hari)" value={rp(d.promoSplit.promo)} />
        <Stat color="#22d3ee" label="Omzet normal (30 hari)" value={rp(d.promoSplit.normal)} />
        <Stat color="#fb7185" label="Belum dibayar" value={rp(d.receivable.total)} hint={`${d.receivable.count} booking`} />
        <Stat color="#fbbf24" label="Balik modal" value={pb.capitalTotal ? (pb.done ? 'Sudah!' : `${pb.pct}%`) : '-'}
          hint={pb.monthsLeft ? `±${pb.monthsLeft} bulan lagi` : pb.capitalTotal ? `Modal ${rp(pb.capitalTotal)}` : 'Isi modal di Keuangan'} />
      </div>

      <Card>
        <h3 className="mb-3 font-semibold">Lagi ngapain kamarnya</h3>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {d.emptyRooms.map((r, i) => {
            const col = roomColor(i);
            return (
              <div key={r.id} className="rounded-lg border p-3"
                style={r.occupied ? { borderColor: col, background: col + '26' } : { borderColor: '#3f3f46', borderStyle: 'dashed' }}>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="size-2.5 rounded-full" style={{ background: col }} />
                  {r.number} · {r.type}
                </div>
                <div className="mt-1 text-xs text-zinc-400">
                  {r.occupied ? 'Ada penghuni, aman' : r.emptyDays === null ? 'Belum pernah laku, sabar' : `Nganggur ${Math.round(r.emptyDays)} hari`}{!r.occupied && r.upcoming ? ` · booking ${r.upcoming}` : ''}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-2 font-semibold">Duit masuk vs keluar (6 bulan)</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={d.cashflow} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                <XAxis dataKey="month" stroke={C.axis} />
                <YAxis stroke={C.axis} tickFormatter={short} />
                <Tooltip formatter={(v) => rp(v)} contentStyle={C.tip} cursor={{ fill: '#27272a80' }} />
                <Legend />
                <Bar isAnimationActive={false} dataKey="income" name="Pemasukan" fill={C.income} radius={[6, 6, 0, 0]} />
                <Bar isAnimationActive={false} dataKey="expense" name="Pengeluaran" fill={C.expense} radius={[6, 6, 0, 0]} />
                <Bar isAnimationActive={false} dataKey="capital" name="Modal" fill="#a78bfa" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="mb-2 font-semibold">Omzet per tipe kamar</h3>
          {types.length ? (
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={types} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3} stroke="none">
                    {types.map((t, i) => <Cell key={t.name} fill={roomColor(i)} />)}
                  </Pie>
                  <Tooltip formatter={(v) => rp(v)} contentStyle={C.tip} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-sm text-zinc-500">Belum ada booking.</p>}
        </Card>
      </div>

      <Card>
        <h3 className="mb-2 font-semibold">Biaya per kategori (30 hari)</h3>
        {d.expenseByCat.length ? (
          <div className="h-56"><ResponsiveContainer><BarChart data={d.expenseByCat} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.grid} horizontal={false} />
            <XAxis type="number" stroke={C.axis} tickFormatter={short} /><YAxis type="category" dataKey="name" stroke={C.axis} width={80} />
            <Tooltip formatter={(v) => rp(v)} contentStyle={C.tip} cursor={{ fill: '#27272a80' }} />
            <Bar dataKey="value" name="Biaya" radius={[0, 6, 6, 0]}>{d.expenseByCat.map((t, i) => <Cell key={t.name} fill={roomColor(i)} />)}</Bar>
          </BarChart></ResponsiveContainer></div>
        ) : <p className="text-sm text-zinc-500">Belum ada biaya 30 hari ini.</p>}
      </Card>

      <Card>
        <h3 className="mb-2 font-semibold">Bisik-bisik dashboard</h3>
        <ul className="space-y-2 text-sm text-zinc-300">
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
