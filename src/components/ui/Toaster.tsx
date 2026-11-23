import { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn, type ToastDetail } from '../../lib/api';

export function Toaster() {
  const [t, setT] = useState<ToastDetail | null>(null);

  useEffect(() => {
    let id: number;
    const on = (e: Event) => {
      setT((e as CustomEvent<ToastDetail>).detail);
      clearTimeout(id);
      id = window.setTimeout(() => setT(null), 3500);
    };
    window.addEventListener('toast', on);
    return () => window.removeEventListener('toast', on);
  }, []);

  if (!t) return null;

  return (
    <div
      role="status"
      className={cn(
        'fixed left-1/2 top-[calc(1rem+env(safe-area-inset-top))] z-[60] flex max-w-[90vw] -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2.5 text-xs md:text-sm font-semibold shadow-floating backdrop-blur-xl border transition-all animate-in fade-in slide-in-from-top-2 duration-200',
        t.bad
          ? 'border-danger/30 bg-danger text-white'
          : 'border-ok/30 bg-primary text-primary-fg'
      )}
    >
      {t.bad ? (
        <AlertTriangle size={16} className="shrink-0 text-white" />
      ) : (
        <CheckCircle2 size={16} className="shrink-0 text-ok" />
      )}
      <span>{t.msg}</span>
    </div>
  );
}
