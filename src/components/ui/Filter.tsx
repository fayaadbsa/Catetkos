import { useState, type ReactNode } from 'react';
import { Filter as FunnelIcon, X } from 'lucide-react';
import { cn } from '../../lib/api';
import { Modal } from './Modal';
import { Button } from './Button';

export interface ActiveFilter { key: string; label: string; onRemove: () => void }

// Tombol corong + badge jumlah aktif + chip filter yang bisa dicopot satu-satu (ala milestats).
export function FilterButton({ onClick, filters }: { onClick: () => void; filters: ActiveFilter[] }) {
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" onClick={onClick} aria-label={filters.length ? `Filter, ${filters.length} aktif` : 'Buka filter'}
        className={cn('relative grid size-10 shrink-0 place-items-center rounded-md border', filters.length ? 'border-tx bg-soft text-tx' : 'border-line bg-surface text-mut hover:text-tx')}>
        <FunnelIcon size={16} aria-hidden />
        {filters.length > 0 && <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-fg">{filters.length}</span>}
      </button>
      {filters.map((f) => (
        <button key={f.key} type="button" onClick={f.onRemove} aria-label={`Hapus filter ${f.label}`}
          className="flex min-h-8 items-center gap-1 whitespace-nowrap rounded-full border border-tx bg-soft pl-2.5 pr-1.5 text-xs font-semibold">{f.label}<X size={12} aria-hidden /></button>
      ))}
    </div>
  );
}

export const FilterGroup = ({ label, children }: { label: string; children: ReactNode }) => (
  <fieldset><legend className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-mut">{label}</legend><div className="flex flex-wrap gap-1.5">{children}</div></fieldset>
);

export const FilterChip = ({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) => (
  <button type="button" onClick={onClick} aria-pressed={selected}
    className={cn('min-h-9 rounded-full px-3 text-xs font-semibold', selected ? 'bg-primary text-primary-fg' : 'border border-line bg-surface text-mut hover:text-tx')}>{children}</button>
);

// Bottom sheet. Pilihan = draft sampai "Terapkan", jadi data nggak refetch tiap tap chip.
export function FilterSheet({ title = 'Filter', onClose, onReset, onApply, children }: { title?: string; onClose: () => void; onReset: () => void; onApply: () => void; children: ReactNode }) {
  return (
    <Modal title={title} onClose={onClose} size="sm">
      <div className="space-y-4 pb-2">{children}</div>
      <div className="mt-4 flex gap-2"><Button variant="ghost" className="flex-1" onClick={onReset}>Reset</Button><Button className="flex-1" onClick={onApply}>Terapkan</Button></div>
    </Modal>
  );
}

// Hook kecil: nilai terapan + draft + buka/tutup sheet.
export function useFilterSheet<T>(init: T) {
  const [applied, setApplied] = useState<T>(init);
  const [draft, setDraft] = useState<T>(init);
  const [open, setOpen] = useState(false);
  return {
    applied, draft, setDraft, open,
    show: () => { setDraft(applied); setOpen(true); },
    close: () => setOpen(false),
    apply: () => { setApplied(draft); setOpen(false); },
    reset: () => setDraft(init),
    set: (v: T) => setApplied(v),
  };
}
