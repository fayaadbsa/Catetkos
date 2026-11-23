'use client';

import { useState } from 'react';
import { Calculator, CheckCircle2, AlertTriangle } from 'lucide-react';
import { rp } from '@/lib/api';
import { promoCheck } from '@/lib/promo';
import { Card, Input, Label } from './ui';

export default function PromoCalc() {
  const [f, setF] = useState<Record<string, string | number>>({
    normal: 1000000,
    promo: 800000,
    varPerNight: 100000,
    emptyNights: 5,
  });

  const r = promoCheck(
    Object.fromEntries(Object.entries(f).map(([k, v]) => [k, +v])) as unknown as Parameters<
      typeof promoCheck
    >[0],
  );

  return (
    <Card className="space-y-4 p-4 md:p-5">
      <div className="flex items-center gap-2 border-b border-line/60 pb-3">
        <Calculator size={18} className="text-brand" />
        <div>
          <h2 className="text-base font-bold text-tx">Kalkulator Kelayakan Promo</h2>
          <p className="text-xs text-mut">
            Simulasi apakah promo sewa kamar tetap memberikan margin keuntungan sehat.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
        <Label>
          Harga normal / bln
          <Input
            type="number"
            inputMode="numeric"
            value={f.normal}
            onChange={(e) => setF({ ...f, normal: e.target.value })}
          />
        </Label>
        <Label>
          Harga promo / bln
          <Input
            type="number"
            inputMode="numeric"
            value={f.promo}
            onChange={(e) => setF({ ...f, promo: e.target.value })}
          />
        </Label>
        <Label>
          Biaya variabel / bln
          <Input
            type="number"
            inputMode="numeric"
            value={f.varPerNight}
            onChange={(e) => setF({ ...f, varPerNight: e.target.value })}
          />
        </Label>
        <Label>
          Hari kosong (rata-rata)
          <Input
            type="number"
            inputMode="numeric"
            value={f.emptyNights}
            onChange={(e) => setF({ ...f, emptyNights: e.target.value })}
          />
        </Label>
      </div>

      <div
        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border p-4 ${
          r.worth ? 'border-ok/30 bg-ok/5' : 'border-warn/30 bg-warn/5'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {r.worth ? (
            <CheckCircle2 size={20} className="text-ok shrink-0" />
          ) : (
            <AlertTriangle size={20} className="text-warn shrink-0" />
          )}
          <div>
            <span className={`text-sm font-bold block ${r.worth ? 'text-ok' : 'text-warn'}`}>
              {r.verdict}
            </span>
            <span className="text-xs text-mut">
              Diskon promo <strong className="font-bold text-tx">{r.discount}%</strong>
            </span>
          </div>
        </div>

        <div className="text-left sm:text-right font-mono tabular-nums border-t sm:border-t-0 border-line/60 pt-2 sm:pt-0">
          <span className="text-xs text-mut block font-sans">Margin Keuntungan Bersih</span>
          <span className="text-base font-bold text-tx">{rp(r.margin)} / bln</span>
        </div>
      </div>
    </Card>
  );
}
