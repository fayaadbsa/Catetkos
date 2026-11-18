// Palet chart/badge (hex karena SVG attr tidak baca CSS var). Warna app lain ada di index.css. Netral di terang & gelap.
export const SEM = { ok: '#3f9d68', warn: '#c4841f', danger: '#d2453a', mut: '#7a6a54', accent: '#1f8a84', violet: '#7a5ea8' };
export const C = {
  income: SEM.ok,
  expense: SEM.danger,
  capital: SEM.violet,
  rooms: ['#c2563a', '#1f8a84', '#e0a526', '#7a5ea8', '#4f8a3c', '#d9667d', '#4a78c2', '#b8743a'],
  axis: SEM.mut,
  grid: '#8a7a6633',
  tip: { background: 'rgb(var(--surface))', border: '1px solid rgb(var(--line))', borderRadius: 12, color: 'rgb(var(--tx))' },
};
export const roomColor = (i) => C.rooms[i % C.rooms.length];
