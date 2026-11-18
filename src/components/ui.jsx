// Komponen gaya shadcn (Button, Card, Input, Modal, Toast) ditulis manual biar ringan.
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '../lib/api.js';
export const Card = ({ className, ...p }) => <div className={cn('rounded-2xl border border-line bg-surface p-4 shadow-card', className)} {...p} />;
export const Button = ({ variant = 'primary', className, ...p }) => (
  <button className={cn('inline-flex items-center justify-center gap-1 rounded-xl px-3.5 py-2 text-sm font-semibold transition disabled:opacity-50',
    variant === 'primary' && 'bg-primary text-primary-fg hover:opacity-90',
    variant === 'ghost' && 'text-tx hover:bg-soft',
    variant === 'outline' && 'border border-line text-tx hover:bg-soft',
    variant === 'danger' && 'bg-danger text-white hover:opacity-90', className)} {...p} />
);
const field = 'w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-tx outline-none placeholder:text-mut focus:border-primary focus:ring-2 focus:ring-primary/20';
export const Input = ({ className, ...p }) => <input className={cn(field, className)} {...p} />;
export const Select = ({ className, children, ...p }) => <select className={cn(field, className)} {...p}>{children}</select>;
export const Label = ({ children, ...p }) => <label className="block text-sm font-medium text-tx" {...p}><span className="mb-1 block">{children}</span></label>;
export const Stat = ({ label, value, hint, color = '#c2563a' }) => (
  <Card className="relative overflow-hidden">
    <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: color }} />
    <div className="text-xs font-semibold text-mut">{label}</div>
    <div className="mt-1 whitespace-nowrap text-xl font-extrabold text-tx lg:text-lg xl:text-xl">{value}</div>
    {hint && <div className="mt-1 text-xs text-mut">{hint}</div>}
  </Card>
);
export const PageHeader = ({ title, desc, children }) => (
  <div className="flex flex-wrap items-end justify-between gap-3">
    <div><h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>{desc && <p className="mt-0.5 text-sm text-mut">{desc}</p>}</div>
    {children && <div className="flex gap-2">{children}</div>}
  </div>
);
export const Badge = ({ color = '#8a7a66', children }) => (
  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: color + '26', color: 'rgb(var(--tx))', boxShadow: `inset 0 0 0 1px ${color}66` }}><span className="size-1.5 rounded-full" style={{ background: color }} />{children}</span>
);
export const Modal = ({ title, onClose, size = 'lg', children }) => (
  <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 p-0 md:items-center md:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <div role="dialog" aria-modal="true" aria-label={title} className={`max-h-[90vh] w-full ${size === 'sm' ? 'max-w-sm' : 'max-w-2xl'} overflow-y-auto rounded-t-3xl border border-line bg-surface p-5 shadow-card md:rounded-3xl`}>
      <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-bold">{title}</h3>
        <button onClick={onClose} aria-label="Tutup" className="rounded p-1 text-mut hover:bg-soft hover:text-tx"><X size={18} /></button></div>
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
  return <div role="status" className={cn('fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-lg px-4 py-2 text-sm font-semibold shadow-lg', t.bad ? 'bg-danger text-white' : 'bg-ok text-white')}>{t.msg}</div>;
}
