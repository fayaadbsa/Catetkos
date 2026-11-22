import { NavLink } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Card, PageHeader } from '../components/ui';
import { KosSwitcher } from '../components/shell/KosSwitcher';
import { NAV } from '../components/shell/nav-items';

// Semua halaman, bergrup. Dibuka dari tab "Lainnya" di mobile.
export default function More() {
  return (
    <div className="space-y-4">
      <PageHeader title="Lainnya" desc="Semua halaman ada di sini." />
      <KosSwitcher />
      {NAV.map(({ group, items }) => (
        <section key={group}>
          <h2 className="mb-1.5 px-1 text-xs font-medium text-mut">{group}</h2>
          <Card className="divide-y divide-line p-0">
            {items.map(({ path, label, icon: Icon }) => (
              <NavLink key={path} to={path} className="flex min-h-12 items-center gap-3 px-4 text-sm font-medium active:bg-soft"><Icon size={18} className="text-mut" /><span className="flex-1">{label}</span><ChevronRight size={16} className="text-mut" /></NavLink>
            ))}
          </Card>
        </section>
      ))}
    </div>
  );
}
