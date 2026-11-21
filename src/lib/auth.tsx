import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from './api';
import type { Me } from './types';

interface Auth { status: 'loading' | 'out' | 'in'; me: Me | null; refresh: () => Promise<void>; logout: () => Promise<void> }
const Ctx = createContext<Auth>(null!);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Auth['status']>('loading');
  const [me, setMe] = useState<Me | null>(null);
  const refresh = useCallback(() => api<Me>('/me').then((u) => { setMe(u); setStatus('in'); }).catch(() => { setMe(null); setStatus('out'); }), []);
  const logout = useCallback(async () => { await api('/logout').catch(() => {}); setMe(null); setStatus('out'); }, []);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { const on = () => { setMe(null); setStatus('out'); }; window.addEventListener('unauthorized', on); return () => window.removeEventListener('unauthorized', on); }, []);
  const value = useMemo(() => ({ status, me, refresh, logout }), [status, me, refresh, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
