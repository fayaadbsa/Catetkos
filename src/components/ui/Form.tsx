import type { InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/api';

// text-base di mobile: iOS Safari zoom otomatis kalau font input < 16px.
const field = 'min-h-11 w-full rounded-md border border-line bg-surface px-3 py-2 text-base text-tx outline-none placeholder:text-mut focus:border-mut focus:ring-2 focus:ring-mut/20 md:min-h-9 md:text-sm';
export const Input = ({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) => <input className={cn(field, className)} {...p} />;
export const Select = ({ className, ...p }: SelectHTMLAttributes<HTMLSelectElement>) => <select className={cn(field, className)} {...p} />;
export const Label = ({ children, ...p }: LabelHTMLAttributes<HTMLLabelElement>) =>
  <label className="block text-sm font-medium text-tx" {...p}><span className="mb-1 block">{children}</span></label>;
export const Checkbox = ({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) => <input type="checkbox" className={cn('size-5 accent-primary', className)} {...p} />;
