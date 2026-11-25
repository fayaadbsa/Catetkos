import { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/shell/AppShell';
import LoginForm from '@/components/LoginForm';
import NewKos from '@/components/NewKos';
import { useSession } from '@/lib/me';

const page = (name: string) => lazy(() => import(`./pages/${name}.tsx`));
const P = {
  dashboard: page('dashboard'),
  bookings: page('bookings'),
  calendar: page('calendar'),
  guests: page('guests'),
  promo: page('promo'),
  income: page('income'),
  expense: page('expense'),
  capital: page('capital'),
  'room-types': page('room-types'),
  rooms: page('rooms'),
  categories: page('categories'),
  kos: page('kos'),
  account: page('account'),
  more: page('more'),
};

// Gerbang: belum login = /login, login tanpa kos = onboarding, sisanya shell + halaman.
function Gate() {
  const { me, active, ready } = useSession();
  if (!ready) return null;
  if (!me) return <Navigate to="/login" replace />;
  if (!active) return <NewKos />;
  return (
    <AppShell>
      <Suspense fallback={null}>
        <Outlet />
      </Suspense>
    </AppShell>
  );
}

function Login() {
  const { me, ready } = useSession();
  if (!ready) return null;
  return me ? <Navigate to="/dashboard" replace /> : <LoginForm />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Gate />}>
        {Object.entries(P).map(([path, C]) => (
          <Route key={path} path={path} element={<C />} />
        ))}
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
