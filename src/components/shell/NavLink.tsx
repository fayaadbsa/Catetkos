'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentProps, ReactNode } from 'react';

type Props = Omit<ComponentProps<typeof Link>, 'href' | 'className' | 'children'> & {
  to: string;
  className?: string | ((s: { isActive: boolean }) => string);
  children?: ReactNode | ((s: { isActive: boolean }) => ReactNode);
};

// Pengganti NavLink react-router: aktif kalau path sama persis.
export function NavLink({ to, className, children, ...p }: Props) {
  const isActive = usePathname() === to;
  return (
    <Link
      href={to}
      aria-current={isActive ? 'page' : undefined}
      className={typeof className === 'function' ? className({ isActive }) : className}
      {...p}
    >
      {typeof children === 'function' ? children({ isActive }) : children}
    </Link>
  );
}
