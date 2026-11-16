// Komponen gaya shadcn (Button, Card, Input) ditulis manual biar ringan.
import { cn } from '../lib/api.js';
export const Card = ({ className, ...p }) => <div className={cn('rounded-xl border border-zinc-800 bg-zinc-900/60 p-4', className)} {...p} />;
export const Button = ({ variant = 'primary', className, ...p }) => (
  <button className={cn('inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition disabled:opacity-50',
    variant === 'primary' && 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400',
    variant === 'ghost' && 'text-zinc-300 hover:bg-zinc-800',
    variant === 'danger' && 'bg-red-600 text-white hover:bg-red-500', className)} {...p} />
);
export const Input = ({ className, ...p }) => (
  <input className={cn('w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500', className)} {...p} />
);
export const Label = ({ children, ...p }) => <label className="block text-xs text-zinc-400" {...p}><span className="mb-1 block">{children}</span></label>;
export const Stat = ({ label, value, hint }) => (
  <Card><div className="text-xs text-zinc-400">{label}</div><div className="mt-1 text-2xl font-semibold text-zinc-100">{value}</div>{hint && <div className="mt-1 text-xs text-zinc-500">{hint}</div>}</Card>
);
