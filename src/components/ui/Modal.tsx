import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

// Bottom sheet di mobile (hormati safe-area), dialog tengah di desktop. Esc / tap latar = tutup.
export function Modal({ title, onClose, size = 'lg', children }: { title: string; onClose: () => void; size?: 'sm' | 'lg'; children: ReactNode }) {
  useEffect(() => {
    const on = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', on);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', on); document.body.style.overflow = ''; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 md:items-center md:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title}
        className={`max-h-[90dvh] w-full ${size === 'sm' ? 'max-w-sm' : 'max-w-2xl'} overflow-y-auto overscroll-contain rounded-t-3xl border border-line bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-card md:rounded-3xl md:pb-5`}>
        <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} aria-label="Tutup" className="grid size-10 place-items-center rounded text-mut hover:bg-soft hover:text-tx"><X size={18} /></button></div>
        {children}
      </div>
    </div>
  );
}
