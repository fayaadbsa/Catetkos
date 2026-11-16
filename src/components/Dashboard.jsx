import { useEffect, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from 'recharts';
import { api, rp } from '../lib/api.js';
import { Card, Stat } from './ui.jsx';

export default function Dashboard() {
  const [d, setD] = useState(null);
  useEffect(() => { api('/dashboard').then(setD).catch(() => {}); }, []);
  if (!d) return <p className="text-zinc-500">Memuat dashboard...</p>;
  const pb = d.payback;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Okupansi 30 hari" value={`${d.occupancy}%`} hint={`${d.roomCount} kamar`} />
        <Stat label="Omzet promo" value={rp(d.promoSplit.promo)} />
        <Stat label="Omzet normal" value={rp(d.promoSplit.normal)} />
        <Stat label="Balik modal" value={pb.capitalTotal ? (pb.done ? 'Sudah!' : `${pb.pct}%`) : '-'}
          hint={pb.monthsLeft ? `±${pb.monthsLeft} bulan lagi` : pb.capitalTotal ? '' : 'Isi modal dulu'} />
      </div>
      <Card>
        <h3 className="mb-2 font-semibold">Kamar sekarang</h3>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {d.emptyRooms.map((r) => (
            <div key={r.id} className={`rounded-lg border p-3 ${r.occupied ? 'border-emerald-700 bg-emerald-950/40' : 'border-zinc-700'}`}>
              <div className="text-sm font-medium">{r.number} · {r.type}</div>
              <div className="text-xs text-zinc-400">{r.occupied ? 'Terisi' : r.emptyDays === null ? 'Belum pernah disewa' : `Kosong ${Math.round(r.emptyDays)} hari`}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h3 className="mb-2 font-semibold">Cashflow 6 bulan</h3>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={d.cashflow}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="month" stroke="#a1a1aa" /><YAxis stroke="#a1a1aa" tickFormatter={(v) => (v / 1e6) + 'jt'} />
              <Tooltip formatter={(v) => rp(v)} contentStyle={{ background: '#09090b', border: '1px solid #3f3f46' }} />
              <Legend />
              <Bar dataKey="income" name="Pemasukan" fill="#10b981" />
              <Bar dataKey="expense" name="Pengeluaran" fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card>
        <h3 className="mb-2 font-semibold">Insight</h3>
        <ul className="list-inside list-disc space-y-1 text-sm text-zinc-300">{d.insights.map((x, i) => <li key={i}>{x}</li>)}</ul>
      </Card>
    </div>
  );
}
