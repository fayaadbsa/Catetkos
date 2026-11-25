
import { rp } from '@/lib/api';
import { useList } from '@/lib/useList';
import Crud from '@/components/Crud';
import PromoCalc from '@/components/PromoCalc';
import { opts } from '@/components/resource-helpers';
import { SEM } from '@/lib/theme';
import { Badge } from '@/components/ui';

export default function Page() {
  const [types] = useList('room-types');
  return (
    <div className="space-y-8">
      <Crud
        resource="promos"
        title="Promo"
        desc="Harga spesial per periode. Dipakai otomatis saat quote & booking."
        empty="Belum ada promo aktif."
        columns={[
          {
            key: 'name',
            label: 'Nama Promo',
            fmt: (r) => <span className="font-bold">{r.name}</span>,
          },
          {
            key: 'type_name',
            label: 'Berlaku Untuk',
            fmt: (r) =>
              r.type_name ? <Badge>{r.type_name}</Badge> : <Badge color={SEM.ok}>Semua Tipe</Badge>,
          },
          {
            key: 'price',
            label: 'Harga Promo / Bln',
            align: 'right',
            fmt: (r) => <span className="font-mono font-bold text-brand">{rp(r.price)}</span>,
          },
          {
            key: 'start_date',
            label: 'Mulai',
            fmt: (r) => <span className="font-mono">{r.start_date}</span>,
          },
          {
            key: 'end_date',
            label: 'Sampai',
            fmt: (r) => <span className="font-mono">{r.end_date}</span>,
          },
        ]}
        fields={[
          { key: 'name', label: 'Nama promo', req: 1 },
          {
            key: 'room_type_id',
            label: 'Tipe kamar',
            type: 'select',
            options: opts(types, (t) => t.name),
            hint: () => 'Kosongkan jika berlaku untuk semua tipe kamar',
          },
          { key: 'price', label: 'Harga promo / bulan', type: 'number', req: 1 },
          { key: 'start_date', label: 'Mulai berlaku', type: 'date', req: 1 },
          { key: 'end_date', label: 'Sampai dengan', type: 'date', req: 1 },
        ]}
      />
      <PromoCalc />
    </div>
  );
}
