import { useEffect, useState } from 'react';
import { cn, type ToastDetail } from '../../lib/api';

export function Toaster() {
  const [t, setT] = useState<ToastDetail | null>(null);
  useEffect(() => {
    let id: number;
    const on = (e: Event) => { setT((e as CustomEvent<ToastDetail>).detail); clearTimeout(id); id = window.setTimeout(() => setT(null), 3500); };
    window.addEventListener('toast', on);
    return () => window.removeEventListener('toast', on);
  }, []);
  if (!t) return null;
  return <div role="status" className={cn('fixed left-1/2 top-[calc(1rem+env(safe-area-inset-top))] z-[60] max-w-[90vw] -translate-x-1/2 rounded-lg px-4 py-2 text-sm font-semibold shadow-lg', t.bad ? 'bg-danger text-white' : 'bg-ok text-white')}>{t.msg}</div>;
}
