import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/api';

export const Card = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) =>
  <div className={cn('rounded-lg border border-line bg-surface p-4 shadow-card', className)} {...p} />;
export const Stat = ({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) => (
  <Card>
    <div className="text-sm font-semibold text-mut">{label}</div>
    <div className="mt-1 whitespace-nowrap text-xl font-semibold text-tx">{value}</div>
    {hint && <div className="mt-1 text-sm text-mut">{hint}</div>}
  </Card>
);
export const PageHeader = ({ title, desc, children }: { title: string; desc?: string; children?: ReactNode }) => (
  <div className="flex flex-wrap items-end justify-between gap-3">
    <div><h1 className="text-2xl font-semibold tracking-tight">{title}</h1>{desc && <p className="mt-0.5 text-sm text-mut">{desc}</p>}</div>
    {children && <div className="flex gap-2">{children}</div>}
  </div>
);
export const Badge = ({ color = '#8a7a66', children }: { color?: string; children: ReactNode }) => (
  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: color + '26', color: 'rgb(var(--tx))', boxShadow: `inset 0 0 0 1px ${color}66` }}><span className="size-1.5 rounded-full" style={{ background: color }} />{children}</span>
);
