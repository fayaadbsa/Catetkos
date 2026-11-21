import type { ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '../../lib/api';

type Variant = 'primary' | 'ghost' | 'outline' | 'danger';
// Target sentuh 44px di mobile (standar iOS), rapat di desktop.
export const buttonClass = (variant: Variant = 'primary', className?: string) =>
  cn('inline-flex min-h-11 items-center justify-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition active:scale-[0.97] disabled:opacity-50 md:min-h-9',
    variant === 'primary' && 'bg-primary text-primary-fg hover:bg-primary/90',
    variant === 'ghost' && 'text-tx hover:bg-soft',
    variant === 'outline' && 'border border-line bg-surface text-tx hover:bg-soft',
    variant === 'danger' && 'bg-danger text-white hover:opacity-90', className);

export const Button = ({ variant, className, type = 'button', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) =>
  <button type={type} className={buttonClass(variant, className)} {...p} />;
export const LinkButton = ({ variant, className, ...p }: LinkProps & { variant?: Variant }) =>
  <Link className={buttonClass(variant, className)} {...p} />;
