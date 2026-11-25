
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/api';

export type ButtonVariant = 'primary' | 'ghost' | 'outline' | 'danger' | 'brand';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

interface ButtonExtraProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}

export const buttonClass = (
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'default',
  className?: string,
) =>
  cn(
    'inline-flex items-center justify-center gap-1.5 font-medium transition-all select-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]',
    'rounded-lg', // modern tactile 8px squircle
    // Sizing
    size === 'default' && 'min-h-11 px-4 py-2 text-sm font-semibold md:min-h-10 md:px-3.5 md:py-2',
    size === 'sm' && 'min-h-9 px-2.5 py-1 text-xs md:min-h-8 md:px-2 md:py-1',
    size === 'lg' && 'min-h-12 px-4 py-2.5 text-base md:min-h-10 md:px-3.5 md:py-2 md:text-sm',
    size === 'icon' && 'size-11 p-0 md:size-9',
    // Variants
    variant === 'primary' &&
      'bg-primary text-primary-fg hover:bg-primary/90 active:bg-primary',
    variant === 'brand' && 'bg-brand text-white shadow-xs hover:bg-brand/90 active:bg-brand',
    variant === 'outline' &&
      'border border-line bg-surface text-tx hover:bg-soft hover:text-tx active:bg-soft',
    variant === 'ghost' && 'text-tx hover:bg-soft hover:text-tx active:bg-soft',
    variant === 'danger' && 'bg-brand text-white hover:opacity-90 active:opacity-100',
    className,
  );

export const Button = ({
  variant = 'primary',
  size = 'default',
  icon,
  className,
  type = 'button',
  children,
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & ButtonExtraProps) => (
  <button type={type} className={buttonClass(variant, size, className)} {...p}>
    {icon}
    {children}
  </button>
);

export const LinkButton = ({
  variant = 'primary',
  size = 'default',
  icon,
  className,
  children,
  ...p
}: ComponentProps<typeof Link> & ButtonExtraProps) => (
  <Link className={buttonClass(variant, size, className)} {...p}>
    {icon}
    {children}
  </Link>
);
