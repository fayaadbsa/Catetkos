import { useEffect, useState } from 'react';
import { api, rp } from './lib/api.js';
import Login from './components/Login.jsx';
import Wizard from './components/Wizard.jsx';
import Crud from './components/Crud.jsx';
import Dashboard from './components/Dashboard.jsx';
import PromoCalc from './components/PromoCalc.jsx';
import { Button } from './components/ui.jsx';
import Logo from './components/Logo.jsx';

const TABS = [
  ['dash', 'Dashboard', 'LayoutDashboard'],
  ['rooms', 'Kamar'], ['bookings', 'Booking'], ['expenses', 'Biaya'], ['capital', 'Modal'], ['promo', 'Promo'],
];

const bookingCols = [
  { key: 'guest', label: 'Tamu' },
  { key: 'room_id', label: 'Kamar', fmt: (r, rooms) => rooms.find((x) => x.id === r.room_id)?.number ?? '-' },
  { key: 'check_in', label: 'Check-in' },
  { key: 'nights', label: 'Malam' },
  { key: 'price', label: 'Harga', fmt: (r) => rp(r.price) },
  { key: 'is_promo', label: 'Promo', fmt: (r) => (r.is_promo ? 'Ya' : '-') },
  { key: 'paid', label: 'Lunas', fmt: (r) => (r.paid ? 'Ya' : 'Belum') },
];

export default function App() {
  const [auth, setAuth] = useState('loading'); // loading | out | in
  const [setup, setSetup] = useState(false);
  const [tab, setTab] = useState('dash');
  const [rooms, setRooms] = useState([]);
  const [dark, setDark] = useState(true);

  const boot = async () => {
    const s = await api('/status');
    setSetup(s.setup);
    try { await api('/me'); setAuth('in'); } catch { setAuth('out'); }
  };
  const loadRooms = () => api('/rooms').then(setRooms).catch(() => {});
  useEffect(() => { boot(); }, []);
  useEffect(() => { if (auth === 'in') loadRooms(); }, [auth]);
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); }, [dark]);

  if (auth === 'loading') return null;
  if (auth === 'out') return <Login setup={setup} onDone={() => { setAuth('in'); }} />;

  const needSetup = rooms.length === 0 && tab !== 'promo';
  const cols = {
    rooms: [
      { key: 'number', label: 'No' }, { key: 'type', label: 'Tipe' },
      { key: 'price', label: 'Harga', fmt: (r) => rp(r.price) },
      { key: 'promo_price', label: 'Promo', fmt: (r) => (r.promo_price ? rp(r.promo_price) : '-') },
      { key: 'promo_end', label: 'Promo s/d' },
    ],
    bookings: bookingCols,
    expenses: [{ key: 'date', label: 'Tanggal' }, { key: 'category', label: 'Kategori' }, { key: 'amount', label: 'Nominal', fmt: (r) => rp(r.amount) }, { key: 'note', label: 'Catatan' }],
    capital: [{ key: 'date', label: 'Tanggal' }, { key: 'item', label: 'Item' }, { key: 'type', label: 'Tipe' }, { key: 'amount', label: 'Nominal', fmt: (r) => rp(r.amount) }],
  };
  const forms = {
    rooms: [{ key: 'number', label: 'No' }, { key: 'type', label: 'Tipe' }, { key: 'price', label: 'Harga', type: 'number' }, { key: 'promo_price', label: 'Harga promo', type: 'number' }, { key: 'promo_start', label: 'Promo mulai', type: 'date' }, { key: 'promo_end', label: 'Promo sampai', type: 'date' }],
    bookings: [{ key: 'room_id', label: 'Kamar' }, { key: 'guest', label: 'Tamu' }, { key: 'check_in', label: 'Check-in', type: 'date' }, { key: 'nights', label: 'Malam', type: 'number' }, { key: 'price', label: 'Harga', type: 'number' }, { key: 'is_promo', label: 'Promo', type: 'bool' }, { key: 'paid', label: 'Lunas', type: 'bool' }, { key: 'note', label: 'Catatan' }],
    expenses: [{ key: 'date', label: 'Tanggal', type: 'date' }, { key: 'category', label: 'Kategori' }, { key: 'amount', label: 'Nominal', type: 'number' }, { key: 'note', label: 'Catatan' }],
    capital: [{ key: 'date', label: 'Tanggal', type: 'date' }, { key: 'item', label: 'Item' }, { key: 'type', label: 'Tipe' }, { key: 'amount', label: 'Nominal', type: 'number' }, { key: 'note', label: 'Catatan' }],
  };
  const titles = { rooms: 'Kamar', bookings: 'Booking', expenses: 'Biaya operasional', capital: 'Modal awal' };

  const logout = async () => { await api('/logout'); setAuth('out'); };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 md:flex">
      <aside className="hidden w-56 shrink-0 border-r border-zinc-800 p-4 md:block">
        <div className="mb-6"><Logo /></div>
        <nav className="space-y-1">
          {TABS.map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`block w-full rounded-md px-3 py-2 text-left text-sm ${tab === k ? 'bg-emerald-500/15 text-emerald-300' : 'text-zinc-400 hover:bg-zinc-800'}`}>{l}</button>
          ))}
        </nav>
        <div className="mt-6 flex gap-2">
          <Button variant="ghost" onClick={() => setDark(!dark)}>{dark ? 'Light' : 'Dark'}</Button>
          <Button variant="ghost" onClick={logout}>Keluar</Button>
        </div>
      </aside>
      <main className="flex-1 space-y-4 p-4 pb-24 md:p-6 md:pb-6">
        {needSetup ? (
          <Wizard onDone={loadRooms} />
        ) : tab === 'dash' ? <Dashboard /> : tab === 'promo' ? <PromoCalc /> : (
          <Crud key={tab} table={tab === 'rooms' ? 'rooms' : tab} title={titles[tab]} columns={cols[tab]} fields={forms[tab]} rooms={rooms} />
        )}
        {!needSetup && tab === 'rooms' && <Wizard onDone={loadRooms} />}
      </main>
      <nav className="fixed inset-x-0 bottom-0 flex justify-around border-t border-zinc-800 bg-zinc-950 p-2 md:hidden">
        {TABS.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-2 py-1 text-xs ${tab === k ? 'text-emerald-400' : 'text-zinc-500'}`}>{l}</button>
        ))}
      </nav>
    </div>
  );
}
