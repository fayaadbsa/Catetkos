import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../lib/api';
import { ALL_ITEMS, BOTTOM_PATHS, MORE } from './nav-items';

// Floating Island Tab Bar (PWA Dock) ala modern iOS
export function BottomNav() {
  const { pathname } = useLocation();
  const items = BOTTOM_PATHS.map((p) => ALL_ITEMS.find((i) => i.path === p)!);
  const moreActive = !BOTTOM_PATHS.includes(pathname) && pathname !== '/account';
  const MoreIcon = MORE.icon;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden select-none">
      <nav
        aria-label="Menu cepat"
        className="pointer-events-auto flex w-full max-w-[27rem] items-center justify-around rounded-full border border-line/80 bg-surface/90 p-1.5 shadow-floating backdrop-blur-2xl [-webkit-backdrop-filter:blur(24px)_saturate(180%)]"
      >
        {items.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              cn(
                'relative flex min-h-12 flex-1 flex-col items-center justify-center gap-1 rounded-full px-2 py-1 transition-all active:scale-90',
                isActive
                  ? 'bg-soft text-tx font-bold'
                  : 'text-mut hover:text-tx font-medium'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn(
                    'size-5 transition-transform',
                    isActive ? 'text-brand scale-105' : 'text-mut'
                  )}
                  strokeWidth={isActive ? 2.4 : 1.8}
                  aria-hidden
                />
                <span className="text-[10px] leading-none tracking-tight">
                  {label}
                </span>
                {isActive && (
                  <span className="absolute bottom-1 size-1 rounded-full bg-brand" />
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* Tab Lainnya */}
        <NavLink
          to={MORE.path}
          className={cn(
            'relative flex min-h-12 flex-1 flex-col items-center justify-center gap-1 rounded-full px-2 py-1 transition-all active:scale-90',
            moreActive
              ? 'bg-soft text-tx font-bold'
              : 'text-mut hover:text-tx font-medium'
          )}
        >
          <MoreIcon
            className={cn(
              'size-5 transition-transform',
              moreActive ? 'text-brand scale-105' : 'text-mut'
            )}
            strokeWidth={moreActive ? 2.4 : 1.8}
            aria-hidden
          />
          <span className="text-[10px] leading-none tracking-tight">
            {MORE.label}
          </span>
          {moreActive && (
            <span className="absolute bottom-1 size-1 rounded-full bg-brand" />
          )}
        </NavLink>
      </nav>
    </div>
  );
}
