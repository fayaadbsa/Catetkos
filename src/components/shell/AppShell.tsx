import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from '../ui';
import { ALL_ITEMS, HOME } from './nav-items';
import { Sidebar } from './SideNav';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';
import { useKos } from '../../lib/kos';

// Desktop: sidebar + top bar + konten responsif. Mobile: layout app iOS (header lengket, floating island nav, safe-area).
export function AppShell() {
  const { pathname } = useLocation();
  const { active } = useKos();
  const cur = ALL_ITEMS.find((i) => i.path === pathname);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${cur?.label ?? 'catetkos'} · catetkos`;
  }, [cur]);

  return (
    <div className="min-h-dvh bg-bg text-tx md:flex">
      <Toaster />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader title={cur?.label ?? 'catetkos'} sub={active.name} />
        <main className="min-w-0 flex-1 space-y-6 p-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:p-8 md:pb-12 max-w-7xl w-full mx-auto">
          <Routes key={active.id}>
            <Route path="/" element={<Navigate to={HOME} replace />} />
            {ALL_ITEMS.map(({ path, page: Page }) => (
              <Route key={path} path={path} element={<Page />} />
            ))}
            <Route path="*" element={<Navigate to={HOME} replace />} />
          </Routes>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
