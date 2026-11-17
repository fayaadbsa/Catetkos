// Satu sumber warna buat chart & aksen. Ubah di sini, jangan hardcode di komponen.
export const C = {
  income: '#34d399',
  expense: '#fb7185',
  rooms: ['#34d399', '#22d3ee', '#a78bfa', '#fbbf24', '#f472b6', '#60a5fa', '#fb923c', '#a3e635'],
  axis: '#a1a1aa',
  grid: '#27272a',
  tip: { background: '#09090b', border: '1px solid #3f3f46', borderRadius: 8, color: '#f4f4f5' },
};

// Warna konsisten per index kamar/tipe.
export const roomColor = (i) => C.rooms[i % C.rooms.length];
