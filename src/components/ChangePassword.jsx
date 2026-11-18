import { useState } from 'react';
import { api } from '../lib/api.js';
import { Button, Input, Label, Modal } from './ui.jsx';

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
    <Modal title="Ganti password" onClose={onClose} size="sm">
      <form onSubmit={submit} className="space-y-3">
        <Label>Password lama<Input type="password" autoComplete="current-password" value={f.oldPassword} onChange={(e) => setF({ ...f, oldPassword: e.target.value })} required /></Label>
        <Label>Password baru<Input type="password" autoComplete="new-password" value={f.newPassword} onChange={(e) => setF({ ...f, newPassword: e.target.value })} required /></Label>
        {err && <p role="alert" className="text-sm font-medium text-danger">{err}</p>}
        {ok && <p role="status" className="text-sm font-medium text-ok">Tersimpan. Login ulang ya.</p>}
        <div className="flex gap-2"><Button type="submit">Simpan</Button><Button type="button" variant="ghost" onClick={onClose}>Batal</Button></div>
      </form>
    </Modal>
  );
}
