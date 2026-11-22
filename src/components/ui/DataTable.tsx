import type { ReactNode } from 'react';
import { cn } from '../../lib/api';
import { Card } from './Card';

export interface Column<T> { key: string; label: string; fmt?: (r: T) => ReactNode }
interface Props<T> {
  rows: T[] | null;
  columns: Column<T>[];
  rowKey: (r: T) => string | number;
  actions?: (r: T) => ReactNode;
  empty?: ReactNode;
  table?: boolean; // true = tabel di semua layar (geser horizontal di mobile), bukan kartu
  footer?: ReactNode;
}
const cell = <T,>(c: Column<T>, r: T) => (c.fmt ? c.fmt(r) : ((r as Record<string, unknown>)[c.key] as ReactNode) ?? '-');

// Satu komponen, dua tampilan: tabel di desktop, daftar kartu di mobile (kolom pertama = judul kartu).
export function DataTable<T>({ rows, columns, rowKey, actions, empty = 'Belum ada data.', table = false, footer }: Props<T>) {
  const note = !rows ? <p className="text-mut">Lagi muat...</p> : !rows.length ? <div className="text-center text-mut">{empty}</div> : null;
  const [head, ...rest] = columns;
  return (
    <>
      <Card className={cn('overflow-x-auto p-0', !table && 'hidden md:block')}>
        <table className="w-full text-sm">
          <thead className="text-left text-xs font-semibold uppercase tracking-wide text-mut"><tr>{columns.map((c) => <th key={c.key} className="whitespace-nowrap p-3">{c.label}</th>)}{actions && <th />}</tr></thead>
          <tbody>
            {rows?.map((r) => (
              <tr key={rowKey(r)} className="border-t border-line hover:bg-soft/60">
                {columns.map((c) => <td key={c.key} className="whitespace-nowrap p-3">{cell(c, r)}</td>)}
                {actions && <td className="whitespace-nowrap p-3 text-right">{actions(r)}</td>}
              </tr>
            ))}
            {note && <tr><td className="p-8" colSpan={columns.length + 1}>{note}</td></tr>}
          </tbody>
          {footer}
        </table>
      </Card>

      <div className={cn('space-y-2.5 md:hidden', table && 'hidden')}>
        {rows?.map((r) => (
          <Card key={rowKey(r)} className="p-3.5">
            <div className="text-base font-semibold">{cell(head, r)}</div>
            <dl className="mt-2 space-y-1.5 text-sm">
              {rest.map((c) => (
                <div key={c.key} className="flex items-start justify-between gap-4"><dt className="shrink-0 text-mut">{c.label}</dt><dd className={cn('min-w-0 text-right')}>{cell(c, r)}</dd></div>
              ))}
            </dl>
            {actions && <div className="mt-3 flex flex-wrap justify-end gap-1 border-t border-line pt-2">{actions(r)}</div>}
          </Card>
        ))}
        {note && <Card className="p-8">{note}</Card>}
      </div>
    </>
  );
}
