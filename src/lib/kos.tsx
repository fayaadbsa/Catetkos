'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api } from './api';
import type { Kos } from './types';

interface KosCtx {
  list: Kos[];
  active: Kos;
  select: (id: number) => Promise<void>;
  create: (name: string) => Promise<void>;
  reload: () => void;
}
const Ctx = createContext<KosCtx>(null!);
export const useKos = () => useContext(Ctx);

// Daftar + kos aktif dari server (cookie `kos`, dicek membership). Ganti kos = POST /api/kos/active lalu refresh.
export function KosProvider({
  list,
  active,
  children,
}: {
  list: Kos[];
  active: Kos;
  children: ReactNode;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const select = useCallback(
    async (id: number) => {
      if (busy) return;
      setBusy(true);
      try {
        await api('/kos/active', { body: { id } });
        router.refresh();
      } finally {
        setBusy(false);
      }
    },
    [active.id, busy, router],
  );
  const create = useCallback(
    async (name: string) => {
      await api('/kos', { body: { name } });
      router.refresh();
    },
    [router],
  );
  const reload = useCallback(() => router.refresh(), [router]);
  const value = useMemo(
    () => ({ list, active, select, create, reload }),
    [list, active, select, create, reload],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
