
import { useNavigate } from 'react-router-dom';
import { rp } from '@/lib/api';
import { useList } from '@/lib/useList';
import Crud from '@/components/Crud';
import { activeBadge, opts } from '@/components/resource-helpers';
import { Button } from '@/components/ui';

export default function Page() {
  const [types] = useList('room-types');
  const navigate = useNavigate();
  return (
    <Crud
      resource="rooms"
      title="Kamar"
      desc="Daftar kamar fisik. Harga otomatis ikut tipe kecuali diisi harga khusus."
      canAdd={types.length > 0}
      defaults={{ archived: 0 }}
      empty={
        types.length
          ? 'Belum ada kamar fisik tercatat.'
          : 'Belum ada tipe kamar. Bikin tipe dulu, baru kamar.'
      }
      emptyAction={
        !types.length && (
          <Button onClick={() => navigate('/room-types')}>Bikin Tipe Kamar</Button>
        )
      }
      columns={[
        {
          key: 'number',
          label: 'Nomor Kamar',
          fmt: (r) => <span className="font-mono font-bold">Kamar {r.number}</span>,
        },
        { key: 'type_name', label: 'Tipe' },
        {
          key: 'price',
          label: 'Harga / Bulan',
          align: 'right',
          fmt: (r) => (
            <span className="font-mono font-bold text-tx">
              {rp(r.price)}
              {r.price_override ? ' *' : ''}
            </span>
          ),
        },
        { key: 'archived', label: 'Status', fmt: activeBadge },
      ]}
      fields={[
        { key: 'number', label: 'Nomor kamar', req: 1 },
        {
          key: 'room_type_id',
          label: 'Tipe kamar',
          type: 'select',
          req: 1,
          options: opts(types, (t) => `${t.name} (${rp(t.base_price)})`),
        },
        {
          key: 'price_override',
          label: 'Harga khusus / bulan (opsional)',
          type: 'number',
          hint: () => 'Kosongkan buat pakai harga tipe. Tanda * di tabel = harga khusus.',
        },
        { key: 'archived', label: 'Arsip (nonaktifkan)', type: 'bool' },
      ]}
    />
  );
}
