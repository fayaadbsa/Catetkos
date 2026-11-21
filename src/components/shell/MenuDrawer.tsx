import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Logo } from './Logo';
import { NavList, UserFooter } from './SideNav';

export function MenuDrawer({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const on = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Menu" className="ml-auto flex h-full w-72 max-w-[85%] flex-col bg-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]">
        <div className="mb-4 flex items-center justify-between"><Logo size={26} /><button onClick={onClose} aria-label="Tutup menu" className="grid size-11 place-items-center rounded-md text-mut hover:bg-soft"><X size={18} /></button></div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain"><NavList onNavigate={onClose} /></div>
        <div className="mt-3"><UserFooter onNavigate={onClose} /></div>
      </div>
    </div>
  );
}
