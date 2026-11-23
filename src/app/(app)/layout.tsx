import { AppShell } from '@/components/shell/AppShell';
import NewKos from '@/components/NewKos';
import { requireUser } from '@/lib/auth';
import { AuthProvider } from '@/lib/me';
import { KosProvider } from '@/lib/kos';
import { resolveKos } from '@/lib/membership';
import { getKosCookie } from '@/lib/session';

// Auth gate: user dicek ke DB tiap request, kos aktif = cookie yang lolos cek membership.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const { list, active } = await resolveKos(user.id, await getKosCookie());
  return (
    <AuthProvider me={user}>
      {active ? (
        <KosProvider list={list} active={active}>
          <AppShell>{children}</AppShell>
        </KosProvider>
      ) : (
        <NewKos />
      )}
    </AuthProvider>
  );
}
