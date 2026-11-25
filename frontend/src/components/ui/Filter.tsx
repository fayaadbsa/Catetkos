
import { useState, type ReactNode } from 'react';
import { Filter as FunnelIcon, X } from 'lucide-react';
import { cn } from '@/lib/api';
import { Modal } from './Modal';
import { Button } from './Button';

export interface ActiveFilter {
  key: string;
  label: string;
  onRemove: () => void;
}

// Tombol corong + badge jumlah aktif + chip filter yang bisa dicopot satu-satu (ala milestats / stitch).
export function FilterButton({
  onClick,
  filters,
  className,
}: {
  onClick: () => void;
  filters: ActiveFilter[];
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      <button
        type="button"
        onClick={onClick}
        aria-label={filters.length ? `Filter, ${filters.length} aktif` : 'Buka filter'}
        className={cn(
          'relative inline-flex size-10 md:size-9 shrink-0 items-center justify-center rounded-lg border transition-all active:scale-95',
          filters.length
            ? 'border-tx bg-soft text-tx font-semibold'
            : 'border-line bg-surface text-mut hover:border-tx/40 hover:text-tx',
        )}
      >
        <FunnelIcon size={16} aria-hidden />
        {filters.length > 0 && (
          <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-brand text-[10px] font-bold text-white shadow-xs">
            {filters.length}
          </span>
        )}
      </button>
      {filters.map((f) => (
        <button
          key={f.key}
          type="button"
          onClick={f.onRemove}
          aria-label={`Hapus filter ${f.label}`}
          className="inline-flex min-h-8 md:min-h-7 items-center gap-1.5 whitespace-nowrap rounded-full bg-soft px-2.5 text-xs font-semibold text-tx hover:bg-danger/10 hover:text-danger transition-colors active:scale-95"
        >
          <span>{f.label}</span>
          <X size={12} className="text-mut hover:text-danger" aria-hidden />
        </button>
      ))}
    </div>
  );
}

export const FilterGroup = ({ label, children }: { label: string; children: ReactNode }) => (
  <fieldset className="space-y-2">
    <legend className="text-[11px] font-bold uppercase tracking-wider text-mut">{label}</legend>
    <div className="flex flex-wrap gap-1.5">{children}</div>
  </fieldset>
);

export const FilterChip = ({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    className={cn(
      'min-h-9 md:min-h-8 rounded-full px-3 text-xs font-semibold transition-all select-none active:scale-95',
      selected
        ? 'bg-tx text-surface'
        : 'bg-soft text-mut hover:text-tx',
    )}
  >
    {children}
  </button>
);

// Bottom sheet di mobile, modal di desktop.
export function FilterSheet({
  title = 'Filter',
  onClose,
  onReset,
  onApply,
  children,
}: {
  title?: string;
  onClose: () => void;
  onReset: () => void;
  onApply: () => void;
  children: ReactNode;
}) {
  return (
    <Modal title={title} onClose={onClose} size="sm">
      <div className="space-y-4 pb-2">{children}</div>
      <div className="mt-5 flex items-center gap-2 border-t border-line pt-3">
        <Button variant="ghost" className="flex-1" onClick={onReset}>
          Reset
        </Button>
        <Button className="flex-1" onClick={onApply}>
          Terapkan
        </Button>
      </div>
    </Modal>
  );
}

// Hook nilai terapan + draft + buka/tutup sheet.
export function useFilterSheet<T>(init: T) {
  const [applied, setApplied] = useState<T>(init);
  const [draft, setDraft] = useState<T>(init);
  const [open, setOpen] = useState(false);
  return {
    applied,
    draft,
    setDraft,
    open,
    show: () => {
      setDraft(applied);
      setOpen(true);
    },
    close: () => setOpen(false),
    apply: () => {
      setApplied(draft);
      setOpen(false);
    },
    reset: () => setDraft(init),
    set: (v: T) => setApplied(v),
  };
}
