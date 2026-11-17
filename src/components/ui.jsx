// Komponen gaya shadcn (Button, Card, Input, Modal, Toast) ditulis manual biar ringan.
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '../lib/api.js';
export const Card = ({ className, ...p }) => <div className={cn('rounded-xl border border-zinc-800 bg-zinc-900/60 p-4', className)} {...p} />;
export const Button = ({ variant = 'primary', className, ...p }) => (
  <button className={cn('inline-flex items-center justify-center gap-1 rounded-md px-3 py-2 text-sm font-semibold transition disabled:opacity-50',
    variant === 'primary' && 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-zinc-950 hover:brightness-110',
    variant === 'ghost' && 'text-zinc-300 hover:bg-zinc-800',
    variant === 'danger' && 'bg-rose-600 text-white hover:bg-rose-500', className)} {...p} />
);
const field = 'w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-400';
export const Input = ({ className, ...p }) => <input className={cn(field, className)} {...p} />;
export const Select = ({ className, children, ...p }) => <select className={cn(field, className)} {...p}>{children}</select>;
export const Label = ({ children, ...p }) => <label className="block text-xs text-zinc-400" {...p}><span className="mb-1 block">{children}</span></label>;
export const Stat = ({ label, value, hint, color = '#34d399' }) => (
  <Card className="relative overflow-hidden">
    <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
    <div className="text-xs font-medium" style={{ color }}>{label}</div>
    <div className="mt-1 text-2xl font-bold text-zinc-100">{value}</div>
    {hint && <div className="mt-1 text-xs text-zinc-500">{hint}</div>}
  </Card>
);
export const Badge = ({ color = '#a1a1aa', children }) => (
  <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: color + '26', color }}>{children}</span>
);
export const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-0 md:items-center md:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-zinc-800 bg-zinc-900 p-5 md:rounded-2xl">
      <div className="mb-4 flex items-center justify-between"><h3 className="font-semibold">{title}</h3>
        <button onClick={onClose} aria-label="Tutup" className="rounded p-1 text-zinc-400 hover:bg-zinc-800"><X size={18} /></button></div>
      {children}
    </div>
  </div>
);
export function Toaster() {
  const [t, setT] = useState(null);
  useEffect(() => {
    let id; const on = (e) => { setT(e.detail); clearTimeout(id); id = setTimeout(() => setT(null), 3500); };
    window.addEventListener('toast', on); return () => window.removeEventListener('toast', on);
  }, []);
  if (!t) return null;
  return <div role="status" className={cn('fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-lg px-4 py-2 text-sm font-semibold shadow-lg', t.bad ? 'bg-rose-600 text-white' : 'bg-emerald-500 text-zinc-950')}>{t.msg}</div>;
}
