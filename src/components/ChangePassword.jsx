import { useState } from 'react';
import { api } from '../lib/api.js';
import { Button, Input, Label, Card } from './ui.jsx';

// Ganti password. Sukses = semua sesi dicabut, user login ulang.
export default function ChangePassword({ onDone, onClose }) {
  const [f, setF] = useState({ oldPassword: '', newPassword: '' });
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    try { await api('/password', { body: f }); setOk(true); setTimeout(onDone, 800); }
    catch (x) { setErr(x.message); }
  };
  return (
    <Card className="max-w-sm">
      <h3 className="mb-3 font-semibold">Ganti password</h3>
      <form onSubmit={submit} className="space-y-3">
        <Label>Password lama<Input type="password" value={f.oldPassword} onChange={(e) => setF({ ...f, oldPassword: e.target.value })} required /></Label>
        <Label>Password baru<Input type="password" value={f.newPassword} onChange={(e) => setF({ ...f, newPassword: e.target.value })} required /></Label>
        {err && <p className="text-sm text-danger">{err}</p>}
        {ok && <p className="text-sm text-primary">Tersimpan. Login ulang ya.</p>}
        <div className="flex gap-2"><Button type="submit">Simpan</Button><Button variant="ghost" onClick={onClose}>Batal</Button></div>
      </form>
    </Card>
  );
}
