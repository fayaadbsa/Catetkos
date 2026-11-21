import { Building2 } from 'lucide-react';
import { useKos } from '../../lib/kos';
import { Select } from '../ui';

// Ganti kos aktif. Select native: di iOS/Android keluar picker bawaan yang enak dipakai.
export function KosSwitcher() {
  const { list, active, select } = useKos();
  return (
    <div className="relative">
      <Building2 size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mut" aria-hidden />
      <Select aria-label="Kos aktif" value={active.id} onChange={(e) => select(Number(e.target.value))} className="pl-9 font-medium">
        {list.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
      </Select>
    </div>
  );
}
