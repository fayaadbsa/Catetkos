import { cn } from '../../lib/api';

// Segmented control: filter / pilihan sedikit.
export function Tabs<K extends string | number>({ items, value, onChange, label }: { items: readonly (readonly [K, string])[]; value: K; onChange: (k: K) => void; label?: string }) {
  return (
    <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-md bg-soft p-1" role="tablist" aria-label={label}>
      {items.map(([k, l]) => (
        <button key={k} role="tab" aria-selected={value === k} onClick={() => onChange(k)}
          className={cn('min-h-9 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold', value === k ? 'bg-surface text-tx shadow-card' : 'text-mut hover:text-tx')}>{l}</button>
      ))}
    </div>
  );
}
