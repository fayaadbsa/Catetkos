import { useState } from 'react';
import { Sun, Moon, LogOut } from 'lucide-react';
import { api, cn } from '../lib/api.js';
import { Button, Card, Input, Label, PageHeader } from './ui.jsx';

// Halaman Akun: tema, ganti password, keluar. Ganti password sukses = semua sesi dicabut, login ulang.
export default function Account({ me, dark, setDark, onLogout }) {
  const [f, setF] = useState({ oldPassword: '', newPassword: '' });
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    try { await api('/password', { body: f }); setOk(true); setTimeout(onLogout, 800); }
    catch (x) { setErr(x.message); }
  };
  const themes = [[false, 'Terang', Sun], [true, 'Gelap', Moon]];
  return (
    <div className="space-y-5">
      <PageHeader title="Akun" desc={`Masuk sebagai ${me?.username || ''}.`} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-semibold">Tampilan</h2>
          <p className="mb-3 text-sm text-mut">Pilih tema yang enak di mata.</p>
          <div className="inline-flex gap-1 rounded-md bg-soft p-1" role="radiogroup" aria-label="Tema">
            {themes.map(([v, l, Icon]) => (
              <button key={l} role="radio" aria-checked={dark === v} onClick={() => setDark(v)}
                className={cn('inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold', dark === v ? 'bg-surface text-primary shadow-card' : 'text-mut hover:text-tx')}><Icon size={15} />{l}</button>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="text-base font-semibold">Ganti password</h2>
          <p className="mb-3 text-sm text-mut">Setelah ganti, semua perangkat keluar dan harus login ulang.</p>
          <form onSubmit={submit} className="space-y-3">
            <Label>Password lama<Input type="password" autoComplete="current-password" value={f.oldPassword} onChange={(e) => setF({ ...f, oldPassword: e.target.value })} required /></Label>
            <Label>Password baru<Input type="password" autoComplete="new-password" value={f.newPassword} onChange={(e) => setF({ ...f, newPassword: e.target.value })} required /></Label>
            {err && <p role="alert" className="text-sm font-medium text-danger">{err}</p>}
            {ok && <p role="status" className="text-sm font-medium text-ok">Tersimpan. Login ulang ya.</p>}
            <Button type="submit">Simpan password</Button>
          </form>
        </Card>
        <Card className="lg:col-span-2">
          <h2 className="text-base font-semibold">Keluar</h2>
          <p className="mb-3 text-sm text-mut">Akhiri sesi di perangkat ini.</p>
          <Button variant="outline" onClick={onLogout}><LogOut size={16} /> Keluar</Button>
        </Card>
      </div>
    </div>
  );
}
