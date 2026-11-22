import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../lib/api';
import { ALL_ITEMS, BOTTOM_PATHS, MORE } from './nav-items';

// Island melayang. 4 tab utama + "Lainnya" (halaman berisi semua menu). Aktif di Lainnya = halaman mana pun di luar 4 tab (kecuali Akun).
export function BottomNav() {
  const { pathname } = useLocation();
  const items = BOTTOM_PATHS.map((p) => ALL_ITEMS.find((i) => i.path === p)!);
  const moreActive = !BOTTOM_PATHS.includes(pathname) && pathname !== '/account';
  const base = 'flex min-h-11 flex-1 flex-col items-center justify-center gap-1 rounded-full px-2 py-1 text-[10px] leading-none tracking-tight transition-all active:scale-90';
  const MoreIcon = MORE.icon;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden">
      <nav aria-label="Menu cepat" className="pointer-events-auto flex w-full max-w-[26rem] items-center justify-around rounded-full border border-line bg-surface/90 p-1.5 shadow-[0_12px_32px_-4px_rgba(0,0,0,0.18)] backdrop-blur-2xl [-webkit-backdrop-filter:blur(24px)_saturate(180%)]">
        {items.map(({ path, label, icon: Icon }) => (
          <NavLink key={path} to={path} className={({ isActive }) => cn(base, isActive ? 'bg-soft font-semibold text-tx' : 'font-medium text-mut')}>
            {({ isActive }) => <><Icon className="size-5" strokeWidth={isActive ? 2.4 : 1.8} aria-hidden />{label}</>}
          </NavLink>
        ))}
        <NavLink to={MORE.path} className={cn(base, moreActive ? 'bg-soft font-semibold text-tx' : 'font-medium text-mut')}>
          <MoreIcon className="size-5" strokeWidth={moreActive ? 2.4 : 1.8} aria-hidden />{MORE.label}
        </NavLink>
      </nav>
    </div>
  );
}
