import { useState } from 'react';
import { errMsg } from '../lib/api';
import { Button, Card, Input, Label } from '../components/ui';
import { Logo } from '../components/shell/Logo';
import { useAuth } from '../lib/auth';

// Layar pertama akun yang belum punya kos.
export default function NewKos({ onCreate }: { onCreate: (name: string) => Promise<void> }) {
  const { logout } = useAuth();
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const submit = async (e: React.FormEvent) => { e.preventDefault(); setErr(''); try { await onCreate(name); } catch (x) { setErr(errMsg(x)); } };
  return (
    <div className="grid min-h-dvh place-items-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]">
      <Card className="w-full max-w-sm">
        <Logo size={40} className="mb-3" />
        <p className="mb-4 text-sm text-mut">Belum ada kos nih. Kasih nama kos pertamamu, atau minta pemilik kos nambahin akunmu.</p>
        <form onSubmit={submit} className="space-y-3">
          <Label>Nama kos<Input value={name} onChange={(e) => setName(e.target.value)} placeholder="mis. Kos Melati" required /></Label>
          {err && <p role="alert" className="text-sm text-danger">{err}</p>}
          <Button type="submit" className="w-full">Bikin kos</Button>
          <Button variant="ghost" className="w-full" onClick={logout}>Keluar</Button>
        </form>
      </Card>
    </div>
  );
}
