
import Crud from '@/components/Crud';
import { KINDS } from '@/components/Ledger';
import { Badge } from '@/components/ui';

export default function Page() {
  return (
    <Crud
      resource="categories"
      title="Kategori"
      desc="Label pengelompokan transaksi pemasukan, biaya, dan modal."
      columns={[
        {
          key: 'kind',
          label: 'Jenis Transaksi',
          fmt: (r) => <Badge>{KINDS[r.kind]?.[0] || r.kind}</Badge>,
        },
        {
          key: 'name',
          label: 'Nama Kategori',
          fmt: (r) => <span className="font-bold">{r.name}</span>,
        },
        { key: 'uses', label: 'Dipakai', align: 'center', fmt: (r) => `${r.uses} transaksi` },
      ]}
      fields={[
        {
          key: 'kind',
          label: 'Jenis transaksi',
          type: 'select',
          req: 1,
          options: Object.entries(KINDS).map(([v, [l]]) => ({ v, l })),
        },
        { key: 'name', label: 'Nama kategori', req: 1 },
      ]}
    />
  );
}
