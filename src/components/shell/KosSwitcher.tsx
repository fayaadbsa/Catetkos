'use client';

import { Building2 } from 'lucide-react';
import { useKos } from '@/lib/kos';
import { Select } from '@/components/ui';

// Ganti kos aktif dengan tampilan modern tactile
export function KosSwitcher() {
  const { list, active, select } = useKos();
  return (
    <div className="relative group">
      <Building2
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mut transition-colors group-hover:text-tx"
        aria-hidden
      />
      <Select
        aria-label="Kos aktif"
        value={active.id}
        onChange={(e) => select(Number(e.target.value))}
        className="pl-9 pr-8 font-semibold text-xs md:text-sm bg-surface shadow-card hover:border-tx/40 transition-colors"
      >
        {list.map((k) => (
          <option key={k.id} value={k.id}>
            {k.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
