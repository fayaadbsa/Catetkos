
import { LogOut, Settings } from 'lucide-react';
import { cn } from '@/lib/api';
import { useAuth } from '@/lib/me';
import { NAV, ACCOUNT } from './nav-items';
import { ICONS } from './nav-icons';
import { NavLink } from './NavLink';
import { Logo } from './Logo';
import { KosSwitcher } from './KosSwitcher';

// Daftar menu bergrup dengan style modern iOS utility
export function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="space-y-5" aria-label="Menu utama">
      {NAV.map(({ group, items }) => (
        <div key={group}>
          <div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-mut">
            {group}
          </div>
          <div className="space-y-1">
            {items.map(({ path, label, icon }) => {
              const Icon = ICONS[icon];
              return (
                <NavLink
                  key={path}
                  to={path}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex min-h-11 md:min-h-9 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-all select-none active:scale-[0.98]',
                      isActive
                        ? 'bg-soft text-tx font-bold shadow-card'
                        : 'text-mut hover:bg-soft/70 hover:text-tx',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={18}
                        className={cn(
                          'shrink-0 transition-colors',
                          isActive ? 'text-brand' : 'text-mut group-hover:text-tx',
                        )}
                      />
                      <span className="truncate">{label}</span>
                      {isActive && <span className="ml-auto size-1.5 rounded-full bg-brand" />}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function UserFooter({ onNavigate }: { onNavigate?: () => void }) {
  const { me, logout } = useAuth();
  return (
    <div className="flex items-center gap-2 border-t border-line/70 pt-3">
      <NavLink
        to={ACCOUNT.path}
        onClick={onNavigate}
        className="flex min-h-11 md:min-h-9 min-w-0 flex-1 items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-soft"
        aria-label="Buka pengaturan akun"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-xs font-bold uppercase text-primary-fg shadow-2xs">
          {(me?.username || '?')[0]}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-tx">{me?.username}</span>
          <span className="block text-[11px] font-medium text-mut">Pemilik Utama</span>
        </span>
      </NavLink>
      <NavLink
        to={ACCOUNT.path}
        onClick={onNavigate}
        aria-label="Pengaturan"
        title="Pengaturan"
        className="grid size-9 place-items-center rounded-lg text-mut hover:bg-soft hover:text-tx transition-colors"
      >
        <Settings size={16} />
      </NavLink>
      <button
        onClick={logout}
        aria-label="Keluar"
        title="Keluar"
        className="grid size-9 place-items-center rounded-lg text-danger/80 hover:bg-danger/10 hover:text-danger transition-colors active:scale-95"
      >
        <LogOut size={16} />
      </button>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-surface p-4 md:flex select-none">
      <div className="mb-4 px-1">
        <Logo />
      </div>
      <div className="mb-4">
        <KosSwitcher />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <NavList />
      </div>
      <div className="mt-3">
        <UserFooter />
      </div>
    </aside>
  );
}
