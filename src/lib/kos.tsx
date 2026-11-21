import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, getKosId, setKosId } from './api';
import type { Kos } from './types';

interface KosCtx { list: Kos[]; active: Kos; select: (id: number) => void; create: (name: string) => Promise<void>; reload: () => Promise<void> }
const Ctx = createContext<KosCtx>(null!);
export const useKos = () => useContext(Ctx);

// Muat kos milik akun. Kalau kos tersimpan sudah bukan miliknya (dicabut), jatuh ke kos pertama.
// Belum punya kos = tampil layar bikin kos pertama (children tidak dirender).
export function KosProvider({ children, empty }: { children: ReactNode; empty: (create: (name: string) => Promise<void>) => ReactNode }) {
  const [list, setList] = useState<Kos[] | null>(null);
  const [activeId, setActiveId] = useState(getKosId());
  const apply = useCallback((l: Kos[], prefer = getKosId()) => {
    const id = l.find((k) => k.id === prefer)?.id ?? l[0]?.id ?? 0;
    setKosId(id); setActiveId(id); setList(l);
  }, []);
  const reload = useCallback(() => api<Kos[]>('/kos').then((l) => apply(l)), [apply]);
  useEffect(() => { reload().catch(() => setList([])); }, [reload]);
  const select = useCallback((id: number) => { setKosId(id); setActiveId(id); }, []);
  const create = useCallback(async (name: string) => {
    const { id } = await api<{ id: number }>('/kos', { body: { name } });
    apply(await api<Kos[]>('/kos'), id);
  }, [apply]);
  const active = list?.find((k) => k.id === activeId);
  const value = useMemo(() => (active ? { list: list!, active, select, create, reload } : null), [list, active, select, create, reload]);
  if (!list) return null;
  if (!value) return <>{empty(create)}</>;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
