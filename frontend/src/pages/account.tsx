
import { useState } from 'react';
import { Sun, Moon, LogOut, Shield, Palette, KeyRound } from 'lucide-react';
import { api, cn, errMsg } from '@/lib/api';
import { useAuth } from '@/lib/me';
import { useDarkMode } from '@/lib/dark';
import { KosSwitcher } from '@/components/shell/KosSwitcher';
import { Button, Card, Input, Label, PageHeader } from '@/components/ui';

// Halaman Akun: tema, ganti password, keluar. Ganti password sukses = semua sesi dicabut, login ulang.
export default function Account() {
  const { me, logout: onLogout } = useAuth();
  const [dark, setDark] = useDarkMode();
  const [f, setF] = useState({ oldPassword: '', newPassword: '' });
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    try {
      await api('/auth/password', { body: f });
      setOk(true);
      setTimeout(onLogout, 800);
    } catch (x) {
      setErr(errMsg(x));
    }
  };

  const themes = [
    [false, 'Terang', Sun],
    [true, 'Gelap', Moon],
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader title="Pengaturan Akun" desc={`Masuk sebagai ${me?.username || 'Pengguna'}.`} />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Kos Aktif */}
        <Card className="lg:col-span-2 p-4 md:p-5">
          <div className="flex items-center gap-2 border-b border-line/60 pb-3 mb-4">
            <Shield size={18} className="text-brand" />
            <div>
              <h2 className="text-base font-bold text-tx">Kos Aktif</h2>
              <p className="text-xs text-mut">Properti kos yang sedang kamu kelola saat ini.</p>
            </div>
          </div>
          <div className="max-w-md">
            <KosSwitcher />
          </div>
        </Card>

        {/* Tampilan / Tema */}
        <Card className="p-4 md:p-5">
          <div className="flex items-center gap-2 border-b border-line/60 pb-3 mb-4">
            <Palette size={18} className="text-brand" />
            <div>
              <h2 className="text-base font-bold text-tx">Tema Tampilan</h2>
              <p className="text-xs text-mut">Sesuaikan kenyamanan visual sesuai selera.</p>
            </div>
          </div>
          <div
            className="inline-flex gap-1.5 rounded-xl border border-line bg-soft p-1"
            role="radiogroup"
            aria-label="Tema"
          >
            {themes.map(([v, l, Icon]) => (
              <button
                key={l}
                type="button"
                role="radio"
                aria-checked={dark === v}
                onClick={() => setDark(v)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs md:text-sm font-bold transition-all active:scale-95',
                  dark === v
                    ? 'bg-surface text-tx shadow-card font-extrabold'
                    : 'text-mut hover:text-tx',
                )}
              >
                <Icon size={16} />
                <span>{l}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Ganti Password */}
        <Card className="p-4 md:p-5">
          <div className="flex items-center gap-2 border-b border-line/60 pb-3 mb-4">
            <KeyRound size={18} className="text-brand" />
            <div>
              <h2 className="text-base font-bold text-tx">Ganti Kata Sandi</h2>
              <p className="text-xs text-mut">
                Setelah ganti, semua perangkat otomatis keluar dan harus login ulang.
              </p>
            </div>
          </div>
          <form onSubmit={submit} className="space-y-3.5">
            <Label>
              Password lama
              <Input
                type="password"
                autoComplete="current-password"
                value={f.oldPassword}
                onChange={(e) => setF({ ...f, oldPassword: e.target.value })}
                required
              />
            </Label>
            <Label>
              Password baru
              <Input
                type="password"
                autoComplete="new-password"
                value={f.newPassword}
                onChange={(e) => setF({ ...f, newPassword: e.target.value })}
                required
              />
            </Label>
            {err && (
              <p role="alert" className="text-xs font-semibold text-danger">
                {err}
              </p>
            )}
            {ok && (
              <p role="status" className="text-xs font-semibold text-ok">
                Tersimpan. Login ulang ya...
              </p>
            )}
            <Button type="submit">Simpan Password</Button>
          </form>
        </Card>

        {/* Keluar */}
        <Card className="lg:col-span-2 p-4 md:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-tx">Keluar Akun</h2>
            <p className="text-xs text-mut">Akhiri sesi aktif kamu di perangkat ini.</p>
          </div>
          <Button
            variant="outline"
            className="text-danger border-danger/30 hover:bg-danger/10 hover:text-danger"
            onClick={onLogout}
            icon={<LogOut size={16} />}
          >
            Keluar Sesi
          </Button>
        </Card>
      </div>
    </div>
  );
}
