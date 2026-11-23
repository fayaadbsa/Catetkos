'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/api';

export const Card = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'rounded-xl border border-line bg-surface p-4 shadow-card transition-colors',
      className,
    )}
    {...p}
  />
);

export interface StatProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  trend?: { text: string; positive?: boolean };
}

export const Stat = ({ label, value, hint, icon, trend }: StatProps) => (
  <Card className="flex flex-col justify-between p-3.5 md:p-4">
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] md:text-xs font-semibold uppercase tracking-wider text-mut truncate">
        {label}
      </span>
      {icon && (
        <span className="grid size-7 place-items-center rounded-lg bg-soft text-mut shrink-0">
          {icon}
        </span>
      )}
    </div>
    <div className="mt-2 font-mono text-xl md:text-2xl font-bold tracking-tight text-tx tabular-nums whitespace-nowrap">
      {value}
    </div>
    {(hint || trend) && (
      <div className="mt-1 flex items-center gap-1.5 text-xs text-mut">
        {trend && (
          <span className={cn('font-semibold', trend.positive ? 'text-ok' : 'text-danger')}>
            {trend.positive ? '↑' : '↓'} {trend.text}
          </span>
        )}
        {hint && <span className="truncate">{hint}</span>}
      </div>
    )}
  </Card>
);

export const PageHeader = ({
  title,
  desc,
  badge,
  children,
}: {
  title: string;
  desc?: string;
  badge?: ReactNode;
  children?: ReactNode;
}) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-tx truncate">{title}</h1>
        {badge}
      </div>
      {desc && <p className="mt-0.5 text-xs md:text-sm text-mut truncate">{desc}</p>}
    </div>
    {children && <div className="flex flex-wrap items-center gap-2 shrink-0">{children}</div>}
  </div>
);

export interface BadgeProps {
  color?: string;
  variant?: 'default' | 'ok' | 'warn' | 'danger' | 'brand';
  children: ReactNode;
  className?: string;
}

export const Badge = ({ color, variant, children, className }: BadgeProps) => {
  // Variant mapping if color not directly supplied
  let bg = 'bg-soft';
  let text = 'text-mut';
  let dotBg = 'bg-mut';
  let border = 'border-line';

  if (variant === 'ok') {
    bg = 'bg-ok/10';
    text = 'text-ok';
    dotBg = 'bg-ok';
    border = 'border-ok/30';
  } else if (variant === 'warn') {
    bg = 'bg-warn/10';
    text = 'text-warn';
    dotBg = 'bg-warn';
    border = 'border-warn/30';
  } else if (variant === 'danger') {
    bg = 'bg-danger/10';
    text = 'text-danger';
    dotBg = 'bg-danger';
    border = 'border-danger/30';
  } else if (variant === 'brand') {
    bg = 'bg-brand/10';
    text = 'text-brand';
    dotBg = 'bg-brand';
    border = 'border-brand/30';
  }

  if (color) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] md:text-xs font-semibold',
          className,
        )}
        style={{
          background: color + '1a',
          color: 'rgb(var(--tx))',
          boxShadow: `inset 0 0 0 1px ${color}40`,
        }}
      >
        <span className="size-1.5 rounded-full shrink-0" style={{ background: color }} />
        {children}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] md:text-xs font-semibold',
        bg,
        text,
        border,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full shrink-0', dotBg)} />
      {children}
    </span>
  );
};
