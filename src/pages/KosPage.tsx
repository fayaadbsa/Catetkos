import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { api, toast, errMsg } from '../lib/api';
import { useKos } from '../lib/kos';
import type { Member } from '../lib/types';
import { Button, Card, Input, Label, PageHeader } from '../components/ui';

// Kelola kos: bikin kos baru + atur siapa yang boleh akses kos aktif (many-to-many).
export default function KosPage() {
  const { list, active, select, create } = useKos();
  const [name, setName] = useState('');
  const [user, setUser] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const path = `/kos/${active.id}/members`;
  const load = () => api<Member[]>(path).then(setMembers).catch((e) => toast(errMsg(e), true));
  useEffect(() => { load(); }, [active.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    try { setMembers(await api<Member[]>(path, { body: { username: user.trim() } })); setUser(''); toast('Anggota ditambah'); } catch (x) { toast(errMsg(x), true); }
  };
  const del = async (m: Member) => {
    if (!confirm(`Cabut akses ${m.username} dari ${active.name}?`)) return;
    try { setMembers(await api<Member[]>(`${path}/${m.id}`, { method: 'DELETE' })); toast('Akses dicabut'); } catch (x) { toast(errMsg(x), true); }
  };
  const make = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await create(name.trim()); setName(''); toast('Kos dibuat'); } catch (x) { toast(errMsg(x), true); }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Kos & anggota" desc="Satu akun bisa pegang banyak kos, satu kos bisa dipegang banyak akun." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-semibold">Kos kamu</h2>
          <ul className="mt-3 space-y-1.5">
            {list.map((k) => (
              <li key={k.id}><button onClick={() => select(k.id)} aria-pressed={k.id === active.id}
                className={`flex min-h-11 w-full items-center justify-between rounded-md border px-3 text-left text-sm font-medium ${k.id === active.id ? 'border-mut bg-soft' : 'border-line hover:bg-soft'}`}>
                {k.name}{k.id === active.id && <span className="text-xs text-mut">aktif</span>}</button></li>
            ))}
          </ul>
          <form onSubmit={make} className="mt-4 space-y-3 border-t border-line pt-4">
            <Label>Bikin kos baru<Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kos" required /></Label>
            <Button type="submit">Bikin kos</Button>
          </form>
        </Card>
        <Card>
          <h2 className="text-base font-semibold">Anggota {active.name}</h2>
          <p className="mb-3 text-sm text-mut">Akun yang boleh lihat dan ubah data kos ini.</p>
          <ul className="space-y-1.5">
            {members.map((m) => (
              <li key={m.id} className="flex min-h-11 items-center justify-between rounded-md border border-line px-3 text-sm font-medium">{m.username}
                <Button variant="ghost" className="text-danger" aria-label={`Cabut ${m.username}`} onClick={() => del(m)}><Trash2 size={15} /></Button></li>
            ))}
          </ul>
          <form onSubmit={add} className="mt-4 space-y-3 border-t border-line pt-4">
            <Label>Tambah anggota (username yang sudah punya akun)<Input value={user} onChange={(e) => setUser(e.target.value)} autoCapitalize="none" autoCorrect="off" required /></Label>
            <Button type="submit">Tambah</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
