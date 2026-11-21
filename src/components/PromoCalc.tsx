import { useState } from 'react';
import { rp } from '../lib/api';
import { promoCheck } from '../lib/promo';
import { Card, Input, Label } from './ui';

export default function PromoCalc() {
  const [f, setF] = useState<Record<string, string | number>>({ normal: 1000000, promo: 800000, varPerNight: 100000, emptyNights: 5 });
  const r = promoCheck(Object.fromEntries(Object.entries(f).map(([k, v]) => [k, +v])) as unknown as Parameters<typeof promoCheck>[0]);
  return (
    <div className="space-y-4">
      <div><h2 className="text-lg font-semibold">Kalkulator promo</h2><p className="text-sm text-mut">Cek dulu promonya masih untung atau nggak.</p></div>
      <Card className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-4">
        {Object.keys(f).map((k) => (
          <Label key={k}>{({ normal: 'Harga normal / bulan', promo: 'Harga promo / bulan', varPerNight: 'Biaya variabel / bulan', emptyNights: 'Hari kosong (rata2)' } as Record<string, string>)[k]}
            <Input type="number" inputMode="numeric" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></Label>
        ))}
      </Card>
      <Card>
        <p className={r.worth ? 'font-semibold text-ok' : 'font-semibold text-warn'}>{r.verdict}</p>
        <p className="mt-2 text-sm text-mut">Diskon {r.discount}% · margin/bulan {rp(r.margin)}</p>
      </Card>
    </div>
  );
}
