// Komponen gaya shadcn (Button, Card, Input) ditulis manual biar ringan.
import { cn } from '../lib/api.js';
export const Card = ({ className, ...p }) => <div className={cn('rounded-xl border border-zinc-800 bg-zinc-900/60 p-4', className)} {...p} />;
export const Button = ({ variant = 'primary', className, ...p }) => (
  <button className={cn('inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-semibold transition disabled:opacity-50',
    variant === 'primary' && 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-zinc-950 hover:brightness-110',
    variant === 'ghost' && 'text-zinc-300 hover:bg-zinc-800',
    variant === 'danger' && 'bg-rose-600 text-white hover:bg-rose-500', className)} {...p} />
);
export const Input = ({ className, ...p }) => (
  <input className={cn('w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-400', className)} {...p} />
);
export const Label = ({ children, ...p }) => <label className="block text-xs text-zinc-400" {...p}><span className="mb-1 block">{children}</span></label>;
export const Stat = ({ label, value, hint, color = '#34d399' }) => (
  <Card className="relative overflow-hidden">
    <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
    <div className="text-xs font-medium" style={{ color }}>{label}</div>
    <div className="mt-1 text-2xl font-bold text-zinc-100">{value}</div>
    {hint && <div className="mt-1 text-xs text-zinc-500">{hint}</div>}
  </Card>
);
