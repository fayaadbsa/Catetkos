import { useState } from 'react';
import { errMsg } from '../lib/api';
import { Button, Card, Input, Label } from '../components/ui';
import { Logo } from '../components/shell/Logo';
import { useAuth } from '../lib/auth';

// Layar onboarding akun yang belum punya kos.
export default function NewKos({
  onCreate,
}: {
  onCreate: (name: string) => Promise<void>;
}) {
  const { logout } = useAuth();
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await onCreate(name);
    } catch (x) {
      setErr(errMsg(x));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-dvh place-items-center p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))]">
      <Card className="w-full max-w-sm p-6 shadow-floating rounded-2xl">
        <Logo size={42} className="mb-4" />
        <h2 className="text-lg font-bold text-tx">Selamat Datang di Catetkos</h2>
        <p className="mt-1 mb-5 text-xs md:text-sm text-mut leading-relaxed">
          Belum ada kos terdaftar. Masukkan nama kos pertamamu, atau minta pemilik kos menambahkan username kamu.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <Label>
            Nama kos
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="mis. Kos Melati"
              required
            />
          </Label>
          {err && (
            <p role="alert" className="text-xs font-semibold text-danger">
              {err}
            </p>
          )}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Menyimpan...' : 'Bikin Kos'}
          </Button>
          <Button variant="ghost" className="w-full" onClick={logout}>
            Keluar Sesi
          </Button>
        </form>
      </Card>
    </div>
  );
}
