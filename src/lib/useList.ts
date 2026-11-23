'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Row } from '@/lib/types';

// Muat daftar referensi (kamar, tamu, dll) buat dropdown. reload() setelah ada perubahan.
export function useList(resource: string, query = ''): [Row[], () => void] {
  const [rows, setRows] = useState<Row[]>([]);
  const reload = useCallback(() => {
    api<Row[]>(`/${resource}${query}`)
      .then(setRows)
      .catch(() => {});
  }, [resource, query]);
  useEffect(reload, [reload]);
  return [rows, reload];
}
