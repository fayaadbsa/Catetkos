import { useCallback, useState } from 'react';
import { api } from './api';
import { useSession } from './me';

// Daftar + kos aktif dari sesi (cookie `kos`, dicek membership di server). Ganti kos = POST /api/kos/active lalu muat ulang sesi.
export function useKos() {
  const { kos, active, refresh } = useSession();
  const [busy, setBusy] = useState(false);
  const select = useCallback(
    async (id: number) => {
      if (busy) return;
      setBusy(true);
      try {
        await api('/kos/active', { body: { id } });
        await refresh();
      } finally {
        setBusy(false);
      }
    },
    [busy, refresh],
  );
  const create = useCallback(
    async (name: string) => {
      await api('/kos', { body: { name } });
      await refresh();
    },
    [refresh],
  );
  return { list: kos, active: active!, select, create, reload: refresh };
}
