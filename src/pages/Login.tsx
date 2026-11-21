import { useState } from 'react';
import { api, errMsg } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Button, Input, Label, Card } from '../components/ui';
import { Logo } from '../components/shell/Logo';

export default function Login() {
  const { refresh } = useAuth();
  const [f, setF] = useState({ username: '', password: '' });
  const [err, setErr] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr('');
    try {
      await api('/login', { body: f });
      await refresh();
    } catch (x) { setErr(errMsg(x)); }
  };
  return (
    <div className="grid min-h-dvh place-items-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]">
      <Card className="w-full max-w-sm">
        <Logo size={40} className="mb-3" />
        <p className="mb-4 text-sm text-mut">Masuk dulu, juragan.</p>
        <form onSubmit={submit} className="space-y-3">
          <Label>Username<Input value={f.username} autoComplete="username" autoCapitalize="none" autoCorrect="off" onChange={(e) => setF({ ...f, username: e.target.value })} required /></Label>
          <Label>Password<Input type="password" autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required /></Label>
          {err && <p className="text-sm text-danger">{err}</p>}
          <Button type="submit" className="w-full">Masuk</Button>
        </form>
      </Card>
    </div>
  );
}
