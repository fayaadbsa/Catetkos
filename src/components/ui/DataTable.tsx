'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/api';
import { Card } from './Card';

export interface Column<T> {
  key: string;
  label: string;
  fmt?: (r: T) => ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

interface Props<T> {
  rows: T[] | null;
  columns: Column<T>[];
  rowKey: (r: T) => string | number;
  actions?: (r: T) => ReactNode;
  empty?: ReactNode;
  table?: boolean; // true = tabel di semua layar (geser horizontal di mobile)
  footer?: ReactNode;
}

const cell = <T,>(c: Column<T>, r: T) =>
  c.fmt ? c.fmt(r) : (((r as Record<string, unknown>)[c.key] as ReactNode) ?? '-');

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  actions,
  empty = 'Belum ada data.',
  table = false,
  footer,
}: Props<T>) {
  const note = !rows ? (
    <p className="text-center text-mut text-sm py-8">Lagi muat...</p>
  ) : !rows.length ? (
    <div className="text-center text-mut text-sm py-8">{empty}</div>
  ) : null;

  const [head, ...rest] = columns;

  return (
    <>
      {/* Desktop / Full Table View */}
      <div
        className={cn(
          'rounded-2xl border border-line bg-surface shadow-xs overflow-hidden',
          !table && 'hidden md:block',
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="border-b border-line bg-soft text-[11px] font-semibold uppercase tracking-[0.06em] text-mut">
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={cn(
                      'whitespace-nowrap px-4 py-3',
                      c.align === 'right' && 'text-right',
                      c.align === 'center' && 'text-center',
                      c.className,
                    )}
                  >
                    {c.label}
                  </th>
                ))}
                {actions && <th className="px-4 py-3 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {rows?.map((r) => (
                <tr key={rowKey(r)} className="transition-colors hover:bg-soft/40 group">
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        'whitespace-nowrap px-4 py-3.5 text-tx',
                        c.align === 'right' && 'text-right font-mono tabular-nums',
                        c.align === 'center' && 'text-center',
                        c.className,
                      )}
                    >
                      {cell(c, r)}
                    </td>
                  ))}
                  {actions && (
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="inline-flex items-center justify-end gap-1">{actions(r)}</div>
                    </td>
                  )}
                </tr>
              ))}
              {note && (
                <tr>
                  <td colSpan={columns.length + (actions ? 1 : 0)}>{note}</td>
                </tr>
              )}
            </tbody>
            {footer}
          </table>
        </div>
      </div>

      {/* Mobile Card List View */}
      <div className={cn('space-y-3 md:hidden', table && 'hidden')}>
        {rows?.map((r) => (
          <Card key={rowKey(r)} className="p-4">
            <div className="flex items-center justify-between gap-2 border-b border-line/60 pb-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-mut">
                {head.label}
              </span>
              <div className="text-base font-bold text-tx">{cell(head, r)}</div>
            </div>
            <dl className="mt-2.5 space-y-2 text-sm">
              {rest.map((c) => (
                <div key={c.key} className="flex items-center justify-between gap-4">
                  <dt className="text-xs font-medium text-mut">{c.label}</dt>
                  <dd className="font-medium text-tx text-right">{cell(c, r)}</dd>
                </div>
              ))}
            </dl>
            {actions && (
              <div className="mt-3.5 flex flex-wrap items-center justify-end gap-1 border-t border-line/60 pt-2.5">
                {actions(r)}
              </div>
            )}
          </Card>
        ))}
        {note && <Card className="p-6">{note}</Card>}
      </div>
    </>
  );
}
