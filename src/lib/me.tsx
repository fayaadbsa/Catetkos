'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api } from './api';
import type { Me } from './types';

interface Auth {
  me: Me;
  logout: () => Promise<void>;
}
const Ctx = createContext<Auth>(null!);
export const useAuth = () => useContext(Ctx);

// me datang dari server (layout (app) sudah memastikan login). Sesi habis di tengah jalan = ke /login.
export function AuthProvider({ me, children }: { me: Me; children: ReactNode }) {
  const router = useRouter();
  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    router.replace('/login');
    router.refresh();
  }, [router]);
  useEffect(() => {
    const on = () => {
      router.replace('/login');
      router.refresh();
    };
    window.addEventListener('unauthorized', on);
    return () => window.removeEventListener('unauthorized', on);
  }, [router]);
  const value = useMemo(() => ({ me, logout }), [me, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
