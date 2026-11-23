'use client';

import { NavLink } from '@/components/shell/NavLink';
import { ICONS } from '@/components/shell/nav-icons';
import { ChevronRight } from 'lucide-react';
import { Card, PageHeader } from '@/components/ui';
import { KosSwitcher } from '@/components/shell/KosSwitcher';
import { NAV } from '@/components/shell/nav-items';

// Semua halaman, bergrup. Dibuka dari tab "Lainnya" di mobile.
export default function More() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Lainnya"
        desc="Akses seluruh menu operasional, keuangan & data master kos."
      />

      <div className="rounded-xl border border-line bg-surface p-4 shadow-card">
        <span className="text-[11px] font-bold uppercase tracking-wider text-mut block mb-2">
          Pilih Kos Aktif
        </span>
        <KosSwitcher />
      </div>

      <div className="space-y-6">
        {NAV.map(({ group, items }) => (
          <section key={group}>
            <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-mut">
              {group}
            </h2>
            <Card className="divide-y divide-line/60 p-0 overflow-hidden shadow-card">
              {items.map(({ path, label, icon }) => {
                const Icon = ICONS[icon];
                return (
                  <NavLink
                    key={path}
                    to={path}
                    className="flex min-h-12 items-center gap-3.5 px-4 py-3 text-sm font-semibold text-tx transition-colors hover:bg-soft active:bg-soft select-none"
                  >
                    <span className="grid size-8 place-items-center rounded-lg bg-soft text-mut shrink-0">
                      <Icon size={18} />
                    </span>
                    <span className="flex-1">{label}</span>
                    <ChevronRight size={16} className="text-mut/70" />
                  </NavLink>
                );
              })}
            </Card>
          </section>
        ))}
      </div>
    </div>
  );
}
