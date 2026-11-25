
import { useState } from 'react';
import { api, errMsg } from '@/lib/api';
import { useSession } from '@/lib/me';
import { Button, Input, Label, Card } from '@/components/ui';
import { Logo } from '@/components/shell/Logo';

export default function LoginForm() {
  const { refresh } = useSession();
  const [f, setF] = useState({ username: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await api('/auth/login', { body: f });
      await refresh();
    } catch (x) {
      setErr(errMsg(x));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-dvh place-items-center p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] bg-bg">
      <Card className="w-full max-w-sm p-6 shadow-floating rounded-2xl border border-line">
        <Logo size={42} className="mb-4" />
        <h2 className="text-xl font-bold tracking-tight text-tx">Masuk Akun</h2>
        <p className="mt-1 mb-5 text-xs md:text-sm text-mut">
          Masuk untuk mengelola operasional dan kas kosmu.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <Label>
            Username
            <Input
              value={f.username}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              onChange={(e) => setF({ ...f, username: e.target.value })}
              placeholder="Username kamu"
              required
            />
          </Label>
          <Label>
            Password
            <Input
              type="password"
              autoComplete="current-password"
              value={f.password}
              onChange={(e) => setF({ ...f, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </Label>
          {err && (
            <p role="alert" className="text-xs font-semibold text-danger">
              {err}
            </p>
          )}
          <Button type="submit" disabled={busy} className="w-full font-bold">
            {busy ? 'Masuk...' : 'Masuk'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
