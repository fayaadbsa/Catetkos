import { useState } from 'react';
import { api } from '../lib/api.js';
import { Button, Input, Label, Card } from './ui.jsx';
import Logo from './Logo.jsx';

export default function Login({ setup, onDone }) {
  const [f, setF] = useState({ username: '', password: '' });
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    try {
      if (setup) await api('/setup', { body: f });
      await api('/login', { body: f });
      onDone();
    } catch (x) { setErr(x.message); }
  };
  return (
    <div className="grid min-h-screen place-items-center p-4">
      <Card className="w-full max-w-sm">
        <Logo size={40} className="mb-3" />
        <p className="mb-4 text-sm text-zinc-400">{setup ? 'Buat akun admin pertama.' : 'Masuk dulu, juragan.'}</p>
        <form onSubmit={submit} className="space-y-3">
          <Label>Username<Input value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} required /></Label>
          <Label>Password<Input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required /></Label>
          {err && <p className="text-sm text-red-400">{err}</p>}
          <Button type="submit" className="w-full">{setup ? 'Buat akun' : 'Masuk'}</Button>
        </form>
      </Card>
    </div>
  );
}
