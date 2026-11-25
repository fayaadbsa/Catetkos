// Palet chart/badge (hex karena SVG attr tidak baca CSS var). Warna app lain ada di index.css. Netral di terang & gelap.
export const SEM = {
  ok: '#16a34a',
  warn: '#ca8a04',
  danger: '#dc2626',
  mut: '#71717a',
  brand: '#c2563a',
};
export const C = {
  income: SEM.ok, // income hijau, expense terakota
  expense: SEM.brand,
  capital: '#a1a1aa',
  rooms: [SEM.ok, SEM.brand, '#063b2e', '#71717a', '#86efac', '#fdba74'],
  axis: SEM.mut,
  grid: '#71717a33',
  tip: {
    background: 'rgb(var(--surface))',
    border: '1px solid rgb(var(--line))',
    borderRadius: 12,
    color: 'rgb(var(--tx))',
  },
};
export const roomColor = (i: number) => C.rooms[i % C.rooms.length];
