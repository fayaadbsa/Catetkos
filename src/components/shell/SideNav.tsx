import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { cn } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { NAV, ACCOUNT } from './nav-items';
import { Logo } from './Logo';

// Daftar menu bergrup. Dipakai sidebar desktop dan drawer "Menu" di mobile.
export function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="space-y-4" aria-label="Menu utama">
      {NAV.map(({ group, items }) => (
        <div key={group}>
          <div className="mb-1 px-3 text-xs font-medium text-mut">{group}</div>
          <div className="space-y-0.5">
            {items.map(({ path, label, icon: Icon }) => (
              <NavLink key={path} to={path} onClick={onNavigate}
                className={({ isActive }) => cn('flex min-h-11 w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-left text-sm font-medium transition active:bg-soft md:min-h-0', isActive ? 'bg-soft text-tx' : 'text-mut hover:bg-soft hover:text-tx')}>
                <Icon size={16} />{label}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function UserFooter({ onNavigate }: { onNavigate?: () => void }) {
  const { me, logout } = useAuth();
  return (
    <div className="flex items-center gap-2 border-t border-line pt-3">
      <NavLink to={ACCOUNT.path} onClick={onNavigate} className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-md p-1.5 text-left hover:bg-soft" aria-label="Buka pengaturan akun">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold uppercase text-primary-fg">{(me?.username || '?')[0]}</span>
        <span className="min-w-0"><span className="block truncate text-sm font-medium">{me?.username}</span><span className="block text-xs text-mut">Pengaturan akun</span></span>
      </NavLink>
      <button onClick={logout} aria-label="Keluar" title="Keluar" className="grid size-11 place-items-center rounded-md text-mut hover:bg-soft hover:text-tx"><LogOut size={16} /></button>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface p-4 md:flex">
      <div className="mb-5 px-1"><Logo /></div>
      <div className="min-h-0 flex-1 overflow-y-auto"><NavList /></div>
      <div className="mt-3"><UserFooter /></div>
    </aside>
  );
}
