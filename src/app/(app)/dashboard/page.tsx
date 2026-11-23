'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Home,
  Tag,
  AlertCircle,
  ShieldCheck,
  Landmark,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useList } from '@/lib/useList';
import { api, rp } from '@/lib/api';
import { C, SEM, roomColor } from '@/lib/theme';
import {
  Card,
  Stat,
  PageHeader,
  Badge,
  FilterButton,
  FilterChip,
  FilterGroup,
  FilterSheet,
  useFilterSheet,
  Tabs,
  type ActiveFilter,
} from '@/components/ui';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const mon = (m: string) => `${MON[+m.slice(5) - 1]} ${m.slice(2, 4)}`;
const short = (v: number) =>
  Math.abs(v) >= 1e6
    ? `${String(+(v / 1e6).toFixed(1)).replace('.', ',')}jt`
    : `${Math.round(v / 1e3)}rb`;

const RANGE_TABS: [number, string][] = [
  [7, '7 Hari'],
  [30, '30 Hari'],
  [90, '3 Bulan'],
  [365, '1 Tahun'],
];

export default function Dashboard() {
  const [d, setD] = useState<any>(null);
  const f = useFilterSheet({ days: 30, type: 0 });
  const { days, type } = f.applied;
  const [tipe] = useList('room-types');

  const active: ActiveFilter[] = [
    ...(days !== 30
      ? [
          {
            key: 'd',
            label: RANGE_TABS.find((r) => r[0] === days)?.[1] ?? `${days} hari`,
            onRemove: () => f.set({ days: 30, type }),
          },
        ]
      : []),
    ...(type
      ? [
          {
            key: 't',
            label: tipe.find((t) => t.id === type)?.name ?? 'Tipe',
            onRemove: () => f.set({ days, type: 0 }),
          },
        ]
      : []),
  ];

  useEffect(() => {
    api(`/dashboard?days=${days}&type=${type}`)
      .then(setD)
      .catch(() => {});
  }, [days, type]);

  if (!d) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm font-medium text-mut animate-pulse">Menyiapkan ringkasan kos...</p>
      </div>
    );
  }

  const pb = d.payback;
  const LV: Record<string, [typeof Info, string, string]> = {
    urgent: [AlertOctagon, 'text-danger bg-danger/10 border-danger/30', 'Penting'],
    warn: [AlertTriangle, 'text-warn bg-warn/10 border-warn/30', 'Perhatian'],
    info: [Info, 'text-mut bg-soft border-line', 'Catatan'],
    ok: [CheckCircle2, 'text-ok bg-ok/10 border-ok/30', 'Bagus'],
  };

  const types = Object.entries<any>(d.byType).map(([name, v]) => ({
    name,
    value: v.revenue,
    count: v.count,
  }));
  const typeTotal = types.reduce((a: number, t) => a + t.value, 0);

  // Total cashflow in current window
  const totalIncome = d.cashflow.reduce((acc: number, m: any) => acc + (m.income || 0), 0);
  const totalExpense = d.cashflow.reduce((acc: number, m: any) => acc + (m.expense || 0), 0);
  const netProfit = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      {/* Page Header with Time Tabs & Room Filter */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <PageHeader
          title="Dashboard & Ringkasan"
          desc={`Kondisi operasional dan keuangan kos ${d.windowDays} hari terakhir.`}
          badge={
            <Badge variant="ok" className="hidden sm:inline-flex">
              Sinkron
            </Badge>
          }
        />

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <Tabs
            items={RANGE_TABS}
            value={days}
            onChange={(val) => f.set({ days: val, type })}
            label="Rentang Waktu"
          />
          <FilterButton onClick={f.show} filters={active} />
        </div>
      </div>

      {/* Filter Sheet Modal */}
      {f.open && (
        <FilterSheet onClose={f.close} onReset={f.reset} onApply={f.apply}>
          <FilterGroup label="Rentang Waktu">
            {RANGE_TABS.map(([v, l]) => (
              <FilterChip
                key={v}
                selected={f.draft.days === v}
                onClick={() => f.setDraft({ ...f.draft, days: v })}
              >
                {l}
              </FilterChip>
            ))}
          </FilterGroup>
          <FilterGroup label="Tipe Kamar">
            <FilterChip
              selected={!f.draft.type}
              onClick={() => f.setDraft({ ...f.draft, type: 0 })}
            >
              Semua Tipe
            </FilterChip>
            {tipe
              .filter((t) => !t.archived)
              .map((t) => (
                <FilterChip
                  key={t.id}
                  selected={f.draft.type === t.id}
                  onClick={() => f.setDraft({ ...f.draft, type: t.id })}
                >
                  {t.name}
                </FilterChip>
              ))}
          </FilterGroup>
        </FilterSheet>
      )}

      {/* 6 Metric Bento KPI Cards */}
      <section
        aria-label="Metrik Utama"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6"
      >
        <Stat
          label="Okupansi"
          value={`${d.occupancy}%`}
          hint={`dari ${d.roomCount} kamar aktif`}
          icon={<Home size={16} />}
          trend={{ text: `${d.occupancy}% terisi`, positive: d.occupancy >= 70 }}
        />
        <Stat
          label="Omzet Normal"
          value={rp(d.promoSplit.normal)}
          hint="Harga standar"
          icon={<TrendingUp size={16} />}
        />
        <Stat
          label="Omzet Promo"
          value={rp(d.promoSplit.promo)}
          hint={d.promoSplit.promo > 0 ? 'Harga diskon' : 'Tidak ada promo'}
          icon={<Tag size={16} />}
        />
        <Stat
          label="Belum Lunas"
          value={rp(d.receivable.total)}
          hint={`${d.receivable.count} tagihan berjalan`}
          icon={<AlertCircle size={16} className={d.receivable.total > 0 ? 'text-warn' : ''} />}
        />
        <Stat
          label="Titipan Deposit"
          value={rp(d.depositHeld)}
          hint="Jaminan aktif"
          icon={<ShieldCheck size={16} />}
        />
        <Stat
          label="Balik Modal (BEP)"
          value={pb.capitalTotal ? (pb.done ? 'Lunas!' : `${pb.pct}%`) : '-'}
          hint={
            pb.monthsLeft
              ? `±${pb.monthsLeft} bln lagi`
              : pb.capitalTotal
                ? `Modal ${rp(pb.capitalTotal)}`
                : 'Isi di menu Modal'
          }
          icon={<Landmark size={16} />}
        />
      </section>

      {/* Split Grid: Main Analytics & Matrix (Left 8 cols) vs Insights & Breakdown (Right 4 cols) */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN: 8 cols on desktop */}
        <div className="space-y-6 lg:col-span-8">
          {/* Arus Kas Chart */}
          <Card className="p-4 md:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-line/60 pb-3">
              <div>
                <h2 className="text-base font-bold text-tx tracking-tight">Arus Kas Bulanan</h2>
                <p className="text-xs text-mut">
                  Perbandingan uang masuk vs pengeluaran ({d.months} bulan terakhir)
                </p>
              </div>
              {/* Quick Net Profit Summary */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-mut">Saldo Bersih:</span>
                <span
                  className={`font-mono text-xs md:text-sm font-bold tabular-nums ${
                    netProfit >= 0 ? 'text-ok' : 'text-danger'
                  }`}
                >
                  {rp(netProfit)}
                </span>
              </div>
            </div>

            <div className="mt-4 h-64 md:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.cashflow} barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke={C.axis}
                    tickFormatter={mon}
                    tickMargin={8}
                    fontSize={12}
                    fontFamily="Plus Jakarta Sans"
                  />
                  <YAxis
                    stroke={C.axis}
                    tickFormatter={short}
                    fontSize={12}
                    fontFamily="JetBrains Mono"
                  />
                  <Tooltip
                    formatter={(v) => rp(Number(v))}
                    contentStyle={{
                      ...C.tip,
                      fontFamily: 'JetBrains Mono',
                      fontSize: '12px',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                    cursor={{ fill: 'rgba(var(--mut), 0.08)' }}
                  />
                  <Legend
                    formatter={(v) => <span className="text-xs font-semibold text-tx">{v}</span>}
                  />
                  <Bar
                    isAnimationActive={false}
                    dataKey="income"
                    name="Pemasukan"
                    fill={C.income}
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    isAnimationActive={false}
                    dataKey="expense"
                    name="Pengeluaran"
                    fill={C.expense}
                    radius={[6, 6, 0, 0]}
                  />
                  {d.cashflow.some((m: any) => m.capital > 0) && (
                    <Bar
                      isAnimationActive={false}
                      dataKey="capital"
                      name="Modal"
                      fill={C.capital}
                      radius={[6, 6, 0, 0]}
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Status Kamar Real-time (Grid of Rooms) */}
          <Card className="p-4 md:p-5">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div>
                <h2 className="text-base font-bold text-tx tracking-tight">
                  Status Kamar Real-time
                </h2>
                <p className="text-xs text-mut">Kondisi fisik hunian kamar saat ini</p>
              </div>
              <Link
                href="/calendar"
                className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline"
              >
                Buka Kalender <ArrowRight size={13} />
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {d.emptyRooms.map((r: any) => {
                const isOccupied = r.occupied;
                return (
                  <div
                    key={r.id}
                    className={`group relative flex flex-col justify-between rounded-xl border p-3 transition-all hover:shadow-card ${
                      isOccupied ? 'border-line bg-surface' : 'border-line/70 bg-soft/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-base font-bold text-tx tabular-nums">
                          {r.number}
                        </span>
                        <span
                          className={`size-2 rounded-full shrink-0 ${
                            isOccupied ? 'bg-ok' : 'bg-mut/50'
                          }`}
                          aria-hidden
                        />
                      </div>
                      <div className="text-[11px] font-medium text-mut truncate">{r.type}</div>
                    </div>

                    <div className="mt-3 border-t border-line/50 pt-2 text-[11px]">
                      {isOccupied ? (
                        <span className="font-semibold text-ok flex items-center gap-1">
                          <span className="size-1 rounded-full bg-ok" /> Terisi
                        </span>
                      ) : r.emptyDays === null ? (
                        <span className="text-mut">Belum pernah laku</span>
                      ) : (
                        <span className="text-mut">
                          Kosong{' '}
                          <strong className="font-bold text-tx">
                            {Math.round(r.emptyDays)} hari
                          </strong>
                          {r.upcoming ? ` · masuk ${r.upcoming}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: 4 cols on desktop */}
        <div className="space-y-6 lg:col-span-4">
          {/* Tindakan Cepat & Bisik-bisik (Insights & Alerts) */}
          <Card className="p-4 md:p-5">
            <div className="flex items-center gap-2 border-b border-line/60 pb-3">
              <Sparkles size={16} className="text-brand" />
              <div>
                <h2 className="text-base font-bold text-tx tracking-tight">Perlu Tindakan Cepat</h2>
                <p className="text-xs text-mut">Pemberitahuan operasional kos</p>
              </div>
            </div>

            <div className="mt-3 space-y-2.5">
              {d.insights && d.insights.length > 0 ? (
                d.insights.map((it: any, idx: number) => {
                  const [Icon, styleCls, tagLabel] = LV[it.level] || LV.info;
                  return (
                    <div
                      key={idx}
                      className={`flex items-start gap-3 rounded-lg border p-3 text-xs ${styleCls}`}
                    >
                      <Icon size={16} className="shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className="font-bold uppercase tracking-wider text-[10px] block opacity-80 mb-0.5">
                          {tagLabel}
                        </span>
                        <p className="font-medium leading-relaxed">{it.text}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-mut">Belum ada peringatan penting.</p>
              )}
            </div>

            {d.receivable.total > 0 && (
              <div className="mt-4 border-t border-line/60 pt-3">
                <Link
                  href="/bookings"
                  className="flex items-center justify-between text-xs font-semibold text-tx hover:text-brand transition-colors"
                >
                  <span>Lihat {d.receivable.count} booking belum lunas</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </Card>

          {/* Breakdown Omzet per Tipe Kamar */}
          <Card className="p-4 md:p-5">
            <h2 className="text-base font-bold text-tx tracking-tight border-b border-line/60 pb-3">
              Omzet per Tipe Kamar
            </h2>

            {types.length > 0 ? (
              <div className="mt-4 space-y-4">
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={types}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {types.map((t, i) => (
                          <Cell key={t.name} fill={roomColor(i)} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v) => rp(Number(v))}
                        contentStyle={{
                          ...C.tip,
                          fontFamily: 'JetBrains Mono',
                          fontSize: '12px',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 border-t border-line/60 pt-3">
                  {types.map((t, i) => {
                    const pct = typeTotal > 0 ? Math.round((t.value / typeTotal) * 100) : 0;
                    return (
                      <div key={t.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="size-2 rounded-full shrink-0"
                            style={{ background: roomColor(i) }}
                          />
                          <span className="font-medium text-tx truncate">{t.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 font-mono tabular-nums">
                          <span className="text-mut text-[11px]">{pct}%</span>
                          <span className="font-semibold text-tx">{rp(t.value)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-xs text-mut">Belum ada data omzet.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
