import { useEffect, useState } from 'react';
import { LayoutDashboard, CalendarCheck, BedDouble, Users, Tag, Wallet, KeyRound, LogOut, Sun, Moon } from 'lucide-react';
import { api } from './lib/api.js';
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';
import { Bookings, Rooms, Guests, Promos, Money } from './components/Pages.jsx';
import { Button, Toaster } from './components/ui.jsx';
import Logo from './components/Logo.jsx';
import ChangePassword from './components/ChangePassword.jsx';

const TABS = [
  ['dash', 'Dashboard', LayoutDashboard, Dashboard], ['bookings', 'Booking', CalendarCheck, Bookings], ['rooms', 'Kamar', BedDouble, Rooms],
  ['guests', 'Tamu', Users, Guests], ['promo', 'Promo', Tag, Promos], ['money', 'Keuangan', Wallet, Money],
];

export default function App() {
  const [auth, setAuth] = useState('loading'); // loading | out | in
  const [tab, setTab] = useState(() => location.hash.slice(1) || 'dash');
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [pwOpen, setPwOpen] = useState(false);

  useEffect(() => { api('/me').then(() => setAuth('in')).catch(() => setAuth('out')); }, []);
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); localStorage.setItem('theme', dark ? 'dark' : 'light'); }, [dark]);
  useEffect(() => { location.hash = tab; }, [tab]);
  useEffect(() => { const on = () => setTab(location.hash.slice(1) || 'dash'); window.addEventListener('hashchange', on); return () => window.removeEventListener('hashchange', on); }, []);

  if (auth === 'loading') return null;
  if (auth === 'out') return <Login onDone={() => setAuth('in')} />;
  const Page = (TABS.find((t) => t[0] === tab) || TABS[0])[3];
  const logout = async () => { await api('/logout'); setAuth('out'); };

  return (
    <div className="min-h-screen bg-bg text-tx md:flex">
      <Toaster />
      <aside className="hidden w-56 shrink-0 border-r border-line bg-surface p-4 md:block">
        <div className="mb-6"><Logo /></div>
        <nav className="space-y-1">
          {TABS.map(([k, l, Icon]) => (
            <button key={k} onClick={() => setTab(k)} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold ${tab === k ? 'bg-primary/15 text-primary' : 'text-mut hover:bg-soft'}`}><Icon size={16} />{l}</button>
          ))}
        </nav>
        <div className="mt-6 flex gap-1">
          <Button variant="ghost" aria-label="Ganti tema" onClick={() => setDark(!dark)}>{dark ? <Sun size={16} /> : <Moon size={16} />}</Button>
          <Button variant="ghost" aria-label="Ganti password" onClick={() => setPwOpen(true)}><KeyRound size={16} /></Button>
          <Button variant="ghost" aria-label="Keluar" onClick={logout}><LogOut size={16} /></Button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 space-y-4 p-4 pb-24 md:p-6 md:pb-6">
        <div className="flex items-center justify-between md:hidden">
          <Logo size={26} />
          <div className="flex"><Button variant="ghost" aria-label="Ganti password" onClick={() => setPwOpen(true)}><KeyRound size={16} /></Button><Button variant="ghost" aria-label="Keluar" onClick={logout}><LogOut size={16} /></Button></div>
        </div>
        <Page key={tab} />
        {pwOpen && <ChangePassword onDone={() => setAuth('out')} onClose={() => setPwOpen(false)} />}
      </main>
      <nav className="fixed inset-x-0 bottom-0 flex justify-around border-t border-line bg-surface p-1 md:hidden">
        {TABS.map(([k, l, Icon]) => (
          <button key={k} onClick={() => setTab(k)} className={`flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] ${tab === k ? 'font-bold text-primary' : 'text-mut'}`}><Icon size={20} />{l}</button>
        ))}
      </nav>
    </div>
  );
}
