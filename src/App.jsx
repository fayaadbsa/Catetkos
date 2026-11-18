import { useEffect, useState } from 'react';
import { LayoutDashboard, CalendarCheck, BedDouble, Users, Tag, KeyRound, LogOut, Sun, Moon, Menu, X, Layers, ListChecks, ArrowDownToLine, ArrowUpFromLine, Landmark } from 'lucide-react';
import { api, cn } from './lib/api.js';
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';
import { Bookings, Rooms, RoomTypes, Guests, Promos, Categories, Income, Expense, Capital } from './components/Pages.jsx';
import { Button, Toaster } from './components/ui.jsx';
import Logo from './components/Logo.jsx';
import ChangePassword from './components/ChangePassword.jsx';

// Navigasi satu sumber: grup -> item [key, label, icon, page]. Sidebar desktop & drawer mobile pakai ini.
const NAV = [
  ['Ringkasan', [['dash', 'Dashboard', LayoutDashboard, Dashboard]]],
  ['Operasional', [['bookings', 'Booking', CalendarCheck, Bookings], ['guests', 'Tamu', Users, Guests], ['promo', 'Promo', Tag, Promos]]],
  ['Keuangan', [['income', 'Pemasukan', ArrowDownToLine, Income], ['expense', 'Biaya', ArrowUpFromLine, Expense], ['capital', 'Modal', Landmark, Capital]]],
  ['Data master', [['room-types', 'Tipe kamar', Layers, RoomTypes], ['rooms', 'Kamar', BedDouble, Rooms], ['categories', 'Kategori', ListChecks, Categories]]],
];
const ITEMS = NAV.flatMap(([, i]) => i);
const BOTTOM = ['dash', 'bookings', 'income', 'rooms'];

export default function App() {
  const [auth, setAuth] = useState('loading'); // loading | out | in
  const [tab, setTab] = useState(() => location.hash.slice(1) || 'dash');
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [pwOpen, setPwOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => { api('/me').then(() => setAuth('in')).catch(() => setAuth('out')); }, []);
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); localStorage.setItem('theme', dark ? 'dark' : 'light'); }, [dark]);
  useEffect(() => { location.hash = tab; setMenu(false); }, [tab]);
  useEffect(() => { const on = () => setTab(location.hash.slice(1) || 'dash'); window.addEventListener('hashchange', on); return () => window.removeEventListener('hashchange', on); }, []);

  if (auth === 'loading') return null;
  if (auth === 'out') return <Login onDone={() => setAuth('in')} />;
  const cur = ITEMS.find((t) => t[0] === tab) || ITEMS[0];
  const Page = cur[3];
  const logout = async () => { await api('/logout'); setAuth('out'); };

  const navList = (
    <nav className="space-y-5" aria-label="Menu utama">
      {NAV.map(([group, items]) => (
        <div key={group}>
          <div className="mb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-mut">{group}</div>
          <div className="space-y-0.5">
            {items.map(([k, l, Icon]) => (
              <button key={k} onClick={() => setTab(k)} aria-current={cur[0] === k ? 'page' : undefined}
                className={cn('flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold transition', cur[0] === k ? 'bg-primary text-primary-fg' : 'text-tx hover:bg-soft')}><Icon size={16} />{l}</button>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
  const tools = (
    <div className="flex gap-1 border-t border-line pt-3">
      <Button variant="ghost" aria-label="Ganti tema" title="Ganti tema" onClick={() => setDark(!dark)}>{dark ? <Sun size={16} /> : <Moon size={16} />}</Button>
      <Button variant="ghost" aria-label="Ganti password" title="Ganti password" onClick={() => { setPwOpen(true); setMenu(false); }}><KeyRound size={16} /></Button>
      <Button variant="ghost" aria-label="Keluar" title="Keluar" onClick={logout}><LogOut size={16} /></Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg text-tx md:flex">
      <Toaster />
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col justify-between overflow-y-auto border-r border-line bg-surface p-4 md:flex">
        <div><div className="mb-6 px-1"><Logo /></div>{navList}</div>
        {tools}
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface px-4 py-2 md:hidden">
        <Logo size={26} />
        <Button variant="ghost" aria-label="Buka menu" onClick={() => setMenu(true)}><Menu size={20} /></Button>
      </header>
      {menu && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onMouseDown={(e) => e.target === e.currentTarget && setMenu(false)}>
          <div className="ml-auto flex h-full w-72 max-w-[85%] flex-col justify-between overflow-y-auto bg-surface p-4">
            <div>
              <div className="mb-4 flex items-center justify-between"><Logo size={26} /><Button variant="ghost" aria-label="Tutup menu" onClick={() => setMenu(false)}><X size={18} /></Button></div>
              {navList}
            </div>
            {tools}
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1 space-y-5 p-4 pb-24 md:p-8 md:pb-8">
        <Page key={cur[0]} />
      </main>
      {pwOpen && <ChangePassword onDone={() => setAuth('out')} onClose={() => setPwOpen(false)} />}

      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-line bg-surface p-1 md:hidden" aria-label="Menu cepat">
        {[...BOTTOM.map((k) => ITEMS.find((i) => i[0] === k)), null].map((it) => {
          const [k, l, Icon] = it || ['menu', 'Menu', Menu];
          const on = it && cur[0] === k;
          return <button key={k} onClick={() => (it ? setTab(k) : setMenu(true))} className={cn('flex flex-1 flex-col items-center gap-0.5 py-1 text-[11px]', on ? 'font-bold text-primary' : 'text-mut')}><Icon size={20} />{l}</button>;
        })}
      </nav>
    </div>
  );
}
