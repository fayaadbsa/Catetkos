
import { cn } from '@/lib/api';

// iOS-style tactile Segmented Control
export function Tabs<K extends string | number>({
  items,
  value,
  onChange,
  label,
  className,
}: {
  items: readonly (readonly [K, string])[];
  value: K;
  onChange: (k: K) => void;
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-xl bg-soft p-1',
        className,
      )}
      role="tablist"
      aria-label={label}
    >
      {items.map(([k, l]) => {
        const active = value === k;
        return (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(k)}
            className={cn(
              'min-h-9 whitespace-nowrap rounded-lg px-3 py-1 text-xs md:text-sm font-semibold transition-all select-none active:scale-95',
              active ? 'bg-surface text-tx shadow-sm font-bold' : 'text-mut hover:text-tx',
            )}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}
