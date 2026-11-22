import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { useAuth } from '../../lib/auth';

// Header lengket ala iOS: blur, hormati notch. Kanan = avatar ke halaman profil (bukan menu). Cuma di mobile.
export function AppHeader({ title, sub }: { title: string; sub?: string }) {
  const { me } = useAuth();
  return (
    <header className="sticky top-0 z-30 flex h-[calc(3rem+env(safe-area-inset-top))] items-center justify-between border-b border-line bg-surface/80 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-xl md:hidden">
      <div className="flex min-w-0 items-center gap-2"><Logo size={26} word={false} /><div className="min-w-0 leading-tight"><h1 className="truncate text-[17px] font-semibold tracking-tight">{title}</h1>{sub && <p className="truncate text-xs text-mut">{sub}</p>}</div></div>
      <Link to="/account" aria-label="Profil" className="-mr-1 grid size-11 place-items-center active:opacity-70">
        <span className="grid size-8 place-items-center rounded-full bg-primary text-sm font-semibold uppercase text-primary-fg">{(me?.username || '?')[0]}</span>
      </Link>
    </header>
  );
}
