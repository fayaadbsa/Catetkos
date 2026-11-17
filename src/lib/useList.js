import { useEffect, useState } from 'react';
import { api } from './api.js';
// Muat daftar referensi (kamar, tamu, dll) buat dropdown. reload() setelah ada perubahan.
export function useList(resource, query = '') {
  const [rows, setRows] = useState([]);
  const reload = () => api(`/${resource}${query}`).then(setRows).catch(() => {});
  useEffect(() => { reload(); }, [resource, query]);
  return [rows, reload];
}
