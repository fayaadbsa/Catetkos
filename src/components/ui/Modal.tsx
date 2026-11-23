import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

// Bottom sheet di mobile (dengan safe-area & pull indicator), dialog terpusat di desktop.
export function Modal({
  title,
  onClose,
  size = 'lg',
  children,
}: {
  title: string;
  onClose: () => void;
  size?: 'sm' | 'lg';
  children: ReactNode;
}) {
  useEffect(() => {
    const on = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', on);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', on);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center md:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`max-h-[90dvh] w-full ${
          size === 'sm' ? 'max-w-md' : 'max-w-2xl'
        } overflow-y-auto overscroll-contain rounded-t-[28px] border border-line bg-surface p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-floating md:rounded-2xl md:pb-6 animate-in fade-in zoom-in-95 duration-150`}
      >
        {/* Mobile drag handle */}
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-line md:hidden" />

        <div className="mb-4 flex items-center justify-between border-b border-line/60 pb-3">
          <h3 className="text-lg font-bold tracking-tight text-tx">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="grid size-9 place-items-center rounded-lg text-mut hover:bg-soft hover:text-tx transition-colors active:scale-95"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
