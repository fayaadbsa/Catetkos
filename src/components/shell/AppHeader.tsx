import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Plus } from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../../lib/auth';
import { useKos } from '../../lib/kos';
import { NAV, ALL_ITEMS } from './nav-items';
import { LinkButton } from '../ui';

const MON = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export function AppHeader({ title, sub }: { title: string; sub?: string }) {
  const { me } = useAuth();
  const { active } = useKos();
  const { pathname } = useLocation();

  // Find category/group for breadcrumb
  const group = NAV.find((g) => g.items.some((it) => it.path === pathname))?.group;
  const now = new Date();
  const currentMonthName = `${MON[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <>
      {/* Mobile Sticky iOS Header */}
      <header className="sticky top-0 z-30 flex h-[calc(3.25rem+env(safe-area-inset-top))] items-center justify-between border-b border-line bg-surface/85 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-2xl md:hidden">
        <div className="flex min-w-0 items-center gap-2.5">
          <Logo size={28} word={false} />
          <div className="min-w-0 leading-tight">
            <h1 className="truncate text-base font-bold tracking-tight text-tx">
              {title}
            </h1>
            {sub && <p className="truncate text-[11px] font-medium text-mut">{sub}</p>}
          </div>
        </div>
        <Link
          to="/account"
          aria-label="Profil"
          className="grid size-9 place-items-center rounded-full bg-primary text-xs font-bold uppercase text-primary-fg shadow-card active:scale-95 transition-transform"
        >
          {(me?.username || '?')[0]}
        </Link>
      </header>

      {/* Desktop Top Header Command Strip */}
      <header className="sticky top-0 z-20 hidden h-16 w-full items-center justify-between border-b border-line bg-surface/80 px-8 backdrop-blur-xl md:flex select-none">
        {/* Breadcrumb Context */}
        <div className="flex items-center gap-2 text-xs md:text-sm text-mut">
          <span className="font-bold text-tx">{active.name}</span>
          {group && (
            <>
              <ChevronRight size={14} className="text-line" />
              <span className="font-medium text-mut">{group}</span>
            </>
          )}
          <ChevronRight size={14} className="text-line" />
          <span className="font-semibold text-tx">{title}</span>
        </div>

        {/* Right Action & Status Group */}
        <div className="flex items-center gap-3">
          {/* Current Month Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-lg border border-line bg-surface text-xs font-semibold text-mut shadow-2xs">
            <span>{currentMonthName}</span>
          </div>

          {/* Live Sync Status */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ok/10 border border-ok/20 text-ok text-[11px] font-bold">
            <span className="size-1.5 rounded-full bg-ok animate-pulse" />
            <span>Kondisi Sinkron</span>
          </div>

          {/* Quick Action: Catat Transaksi */}
          <LinkButton
            to="/income"
            variant="primary"
            size="sm"
            icon={<Plus size={14} />}
            className="font-semibold shadow-2xs"
          >
            Catat Transaksi
          </LinkButton>

          {/* Profile link */}
          <Link
            to="/account"
            aria-label="Profil"
            className="grid size-8 place-items-center rounded-lg bg-soft hover:bg-line/60 transition-colors text-xs font-bold text-tx"
            title={me?.username}
          >
            {(me?.username || '?')[0].toUpperCase()}
          </Link>
        </div>
      </header>
    </>
  );
}
