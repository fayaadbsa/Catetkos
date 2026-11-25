
import { rp } from '@/lib/api';
import Crud from '@/components/Crud';
import { activeBadge } from '@/components/resource-helpers';

export default function Page() {
  return (
    <Crud
      resource="room-types"
      title="Tipe kamar"
      desc="Grup kamar dengan fasilitas dan harga dasar yang sama."
      empty="Belum ada tipe kamar. Bikin satu dulu, nanti kamar tinggal pilih."
      columns={[
        {
          key: 'name',
          label: 'Tipe Kamar',
          fmt: (r) => <span className="font-bold">{r.name}</span>,
        },
        {
          key: 'base_price',
          label: 'Harga Dasar / Bln',
          align: 'right',
          fmt: (r) => <span className="font-mono font-bold text-tx">{rp(r.base_price)}</span>,
        },
        { key: 'capacity', label: 'Kapasitas', align: 'center', fmt: (r) => `${r.capacity} orang` },
        {
          key: 'room_count',
          label: 'Kamar Aktif',
          align: 'center',
          fmt: (r) => `${r.room_count} kamar`,
        },
        { key: 'archived', label: 'Status', fmt: activeBadge },
      ]}
      fields={[
        { key: 'name', label: 'Nama tipe', req: 1 },
        { key: 'base_price', label: 'Harga dasar / bulan', type: 'number', req: 1 },
        { key: 'capacity', label: 'Kapasitas (orang)', type: 'number' },
        { key: 'archived', label: 'Arsip (nonaktifkan)', type: 'bool' },
      ]}
      defaults={{ capacity: 1, archived: 0 }}
    />
  );
}
