import { useState } from 'react';
import { rp } from '../lib/api.js';
import { promoCheck } from '../lib/promo.js';
import { Card, Input, Label } from './ui.jsx';

export default function PromoCalc() {
  const [f, setF] = useState({ normal: 1000000, promo: 800000, varPerNight: 100000, emptyNights: 5 });
  const r = promoCheck(Object.fromEntries(Object.entries(f).map(([k, v]) => [k, +v])));
  return (
    <div className="space-y-4">
      <div><h2 className="text-lg font-semibold">Kalkulator promo</h2><p className="text-sm text-mut">Cek dulu promonya masih untung atau nggak.</p></div>
      <Card className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Object.keys(f).map((k) => (
          <Label key={k}>{{ normal: 'Harga normal / bulan', promo: 'Harga promo / bulan', varPerNight: 'Biaya variabel / bulan', emptyNights: 'Hari kosong (rata2)' }[k]}
            <Input type="number" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></Label>
        ))}
      </Card>
      <Card>
        <p className={r.worth ? 'font-semibold text-ok' : 'font-semibold text-warn'}>{r.verdict}</p>
        <p className="mt-2 text-sm text-mut">Diskon {r.discount}% · margin/bulan {rp(r.margin)}</p>
      </Card>
    </div>
  );
}
