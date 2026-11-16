// Muncul kalau belum ada kamar. Bisa dibuka lagi dari halaman Kamar.
import { useState } from 'react';
import { api } from '../lib/api.js';
import { Button, Input, Label, Card } from './ui.jsx';

const blank = () => ({ number: '', type: 'Superior', price: '', promo_price: '', promo_start: '', promo_end: '' });

export default function Wizard({ onDone }) {
  const [rooms, setRooms] = useState([blank()]);
  const [err, setErr] = useState('');
  const set = (i, k, v) => setRooms(rooms.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const save = async () => {
    setErr('');
    try {
      for (const r of rooms.filter((r) => r.number)) {
        await api('/rooms', { body: { ...r, price: +r.price, promo_price: r.promo_price ? +r.promo_price : null, promo_start: r.promo_start || null, promo_end: r.promo_end || null } });
      }
      onDone();
    } catch (e) { setErr(e.message); }
  };
  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Setup kamar</h2>
        <p className="text-sm text-zinc-400">Isi kamar lu. Bisa diubah lagi nanti.</p>
      </div>
      {rooms.map((r, i) => (
        <div key={i} className="grid grid-cols-2 gap-2 rounded-lg border border-zinc-800 p-3 md:grid-cols-6">
          <Label>No<Input value={r.number} onChange={(e) => set(i, 'number', e.target.value)} /></Label>
          <Label>Tipe<Input value={r.type} onChange={(e) => set(i, 'type', e.target.value)} /></Label>
          <Label>Harga<Input type="number" value={r.price} onChange={(e) => set(i, 'price', e.target.value)} /></Label>
          <Label>Promo<Input type="number" value={r.promo_price} onChange={(e) => set(i, 'promo_price', e.target.value)} /></Label>
          <Label>Promo mulai<Input type="date" value={r.promo_start} onChange={(e) => set(i, 'promo_start', e.target.value)} /></Label>
          <Label>Promo sampai<Input type="date" value={r.promo_end} onChange={(e) => set(i, 'promo_end', e.target.value)} /></Label>
        </div>
      ))}
      {err && <p className="text-sm text-red-400">{err}</p>}
      <div className="flex gap-2">
        <Button variant="ghost" onClick={() => setRooms([...rooms, blank()])}>+ Kamar</Button>
        <Button onClick={save}>Simpan kamar</Button>
      </div>
    </Card>
  );
}
