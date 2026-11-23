'use client';

import { useEffect, useState } from 'react';
import { Trash2, Building2, UserPlus } from 'lucide-react';
import { api, toast, errMsg } from '@/lib/api';
import { useKos } from '@/lib/kos';
import type { Member } from '@/lib/types';
import { Button, Card, Input, Label, PageHeader, Badge } from '@/components/ui';

// Kelola kos: bikin kos baru + atur siapa yang boleh akses kos aktif (many-to-many).
export default function KosPage() {
  const { list, active, select, create } = useKos();
  const [name, setName] = useState('');
  const [user, setUser] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const path = `/kos/${active.id}/members`;

  const load = () =>
    api<Member[]>(path)
      .then(setMembers)
      .catch((e) => toast(errMsg(e), true));

  useEffect(() => {
    load();
  }, [active.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setMembers(await api<Member[]>(path, { body: { username: user.trim() } }));
      setUser('');
      toast('Anggota ditambah');
    } catch (x) {
      toast(errMsg(x), true);
    }
  };

  const del = async (m: Member) => {
    if (!confirm(`Cabut akses ${m.username} dari ${active.name}?`)) return;
    try {
      setMembers(await api<Member[]>(`${path}/${m.id}`, { method: 'DELETE' }));
      toast('Akses dicabut');
    } catch (x) {
      toast(errMsg(x), true);
    }
  };

  const make = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await create(name.trim());
      setName('');
      toast('Kos dibuat');
    } catch (x) {
      toast(errMsg(x), true);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kos & Anggota"
        desc="Satu akun bisa mengelola banyak kos, dan satu kos bisa dikelola banyak anggota."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Kos Kamu Card */}
        <Card className="p-4 md:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-line/60 pb-3 mb-4">
              <Building2 size={18} className="text-brand" />
              <div>
                <h2 className="text-base font-bold text-tx">Daftar Kos Kamu</h2>
                <p className="text-xs text-mut">Pilih kos untuk beralih ruang kerja aktif.</p>
              </div>
            </div>

            <ul className="space-y-2">
              {list.map((k) => (
                <li key={k.id}>
                  <button
                    type="button"
                    onClick={() => select(k.id)}
                    aria-pressed={k.id === active.id}
                    className={`flex min-h-12 w-full items-center justify-between rounded-xl border px-4 text-left text-sm font-semibold transition-all select-none active:scale-[0.98] ${
                      k.id === active.id
                        ? 'border-brand/40 bg-brand/5 text-tx shadow-2xs font-bold'
                        : 'border-line bg-surface hover:bg-soft text-mut hover:text-tx'
                    }`}
                  >
                    <span>{k.name}</span>
                    {k.id === active.id && (
                      <Badge variant="brand" className="text-[10px]">
                        Aktif
                      </Badge>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <form onSubmit={make} className="mt-6 border-t border-line/60 pt-4 space-y-3">
            <Label>
              Bikin kos baru
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="mis. Kos Melati"
                required
              />
            </Label>
            <Button type="submit">Bikin Kos</Button>
          </form>
        </Card>

        {/* Anggota Kos Card */}
        <Card className="p-4 md:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-line/60 pb-3 mb-4">
              <UserPlus size={18} className="text-brand" />
              <div>
                <h2 className="text-base font-bold text-tx">Anggota {active.name}</h2>
                <p className="text-xs text-mut">
                  Pengguna yang memiliki hak akses untuk melihat & mengubah data kos ini.
                </p>
              </div>
            </div>

            <ul className="space-y-2">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="flex min-h-12 items-center justify-between rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-tx"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-7 place-items-center rounded-lg bg-soft text-xs font-bold uppercase text-tx">
                      {m.username[0]}
                    </span>
                    <span>{m.username}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger hover:bg-danger/10"
                    aria-label={`Cabut ${m.username}`}
                    onClick={() => del(m)}
                  >
                    <Trash2 size={15} />
                  </Button>
                </li>
              ))}
            </ul>
          </div>

          <form onSubmit={add} className="mt-6 border-t border-line/60 pt-4 space-y-3">
            <Label>
              Tambah anggota (username yang sudah punya akun)
              <Input
                value={user}
                onChange={(e) => setUser(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="Masukkan username"
                required
              />
            </Label>
            <Button type="submit">Tambah</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
