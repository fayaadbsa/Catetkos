import { Menu } from 'lucide-react';
import { Logo } from './Logo';

// Header lengket ala iOS (milestats): blur, hormati notch/safe-area. Cuma di mobile.
export function AppHeader({ title, sub, onMenu }: { title: string; sub?: string; onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-[calc(3rem+env(safe-area-inset-top))] items-center justify-between border-b border-line bg-surface/80 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-xl md:hidden">
      <div className="flex min-w-0 items-center gap-2"><Logo size={26} word={false} /><div className="min-w-0 leading-tight"><h1 className="truncate text-[17px] font-semibold tracking-tight">{title}</h1>{sub && <p className="truncate text-xs text-mut">{sub}</p>}</div></div>
      <button onClick={onMenu} aria-label="Buka menu" className="-mr-2 grid size-11 place-items-center rounded-full text-mut active:bg-soft"><Menu size={20} /></button>
    </header>
  );
}
