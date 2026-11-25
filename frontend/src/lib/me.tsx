import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from './api';
import type { Kos, Me } from './types';

interface Session {
  me: Me | null;
  kos: Kos[];
  active: Kos | null;
  ready: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}
const Ctx = createContext<Session>(null!);
export const useSession = () => useContext(Ctx);
export const useAuth = () => {
  const s = useSession();
  return { me: s.me as Me, logout: s.logout };
};

// Sesi dimuat dari GET /api/me (cookie httpOnly). 401 di mana pun = sesi habis, balik ke login.
export function SessionProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<Pick<Session, 'me' | 'kos' | 'active' | 'ready'>>({
    me: null,
    kos: [],
    active: null,
    ready: false,
  });
  const refresh = useCallback(async () => {
    try {
      const r = await api<{ me: Me; kos: Kos[]; active: Kos | null }>('/me');
      setS({ me: r.me, kos: r.kos, active: r.active, ready: true });
    } catch {
      setS({ me: null, kos: [], active: null, ready: true });
    }
  }, []);
  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    setS({ me: null, kos: [], active: null, ready: true });
  }, []);
  useEffect(() => {
     
    refresh();
    const on = () => setS({ me: null, kos: [], active: null, ready: true });
    window.addEventListener('unauthorized', on);
    return () => window.removeEventListener('unauthorized', on);
  }, [refresh]);
  const value = useMemo(() => ({ ...s, refresh, logout }), [s, refresh, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
