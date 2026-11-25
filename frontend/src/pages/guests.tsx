
import Crud from '@/components/Crud';

export default function Page() {
  return (
    <Crud
      resource="guests"
      title="Tamu"
      desc="Daftar penyewa yang otomatis bertambah setiap bikin booking tamu baru."
      empty="Belum ada tamu. Tamu otomatis muncul saat bikin booking."
      columns={[
        {
          key: 'name',
          label: 'Nama Tamu',
          fmt: (r) => <span className="font-bold">{r.name}</span>,
        },
        {
          key: 'phone',
          label: 'Nomor HP',
          fmt: (r) => (r.phone ? <span className="font-mono text-tx">{r.phone}</span> : '-'),
        },
        {
          key: 'booking_count',
          label: 'Total Booking',
          align: 'center',
          fmt: (r) => `${r.booking_count} kali`,
        },
        { key: 'note', label: 'Catatan', fmt: (r) => r.note || '-' },
      ]}
      fields={[
        { key: 'name', label: 'Nama tamu', req: 1 },
        { key: 'phone', label: 'Nomor HP / WhatsApp' },
        { key: 'note', label: 'Catatan' },
      ]}
    />
  );
}
