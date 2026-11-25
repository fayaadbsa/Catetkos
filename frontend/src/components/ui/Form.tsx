
import type { InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/api';

// Target sentuh 44px di mobile (cegah zoom iOS), 36px di desktop
const field =
  'min-h-11 w-full rounded-lg border border-transparent bg-soft px-3.5 py-2 text-base text-tx outline-hidden transition-all placeholder:text-mut/70 focus:border-primary focus:bg-surface focus:ring-2 focus:ring-primary/15 md:min-h-10 md:text-sm';

export const Input = ({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) => (
  <input className={cn(field, className)} {...p} />
);

export const Select = ({ className, ...p }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className={cn(field, 'cursor-pointer', className)} {...p} />
);

export const Label = ({ children, className, ...p }: LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn('block text-xs md:text-sm font-semibold text-tx', className)} {...p}>
    <span className="mb-1.5 block">{children}</span>
  </label>
);

export const Checkbox = ({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    type="checkbox"
    className={cn(
      'size-4.5 rounded-sm border border-line text-primary accent-primary transition cursor-pointer',
      className,
    )}
    {...p}
  />
);
