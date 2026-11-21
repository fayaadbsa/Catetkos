// Konfigurasi tiap halaman di atas Crud generik.
import { useNavigate } from 'react-router-dom';
import { rp, today } from '../lib/api';
import { useList } from '../lib/useList';
import type { Row } from '../lib/types';
import Crud from '../components/Crud';
import PromoCalc from '../components/PromoCalc';
import { SEM } from '../lib/theme';
import { Badge, Button } from '../components/ui';

const opts = (rows: Row[], l: (r: Row) => string) => rows.map((r) => ({ v: r.id, l: l(r) }));

const activeBadge = (r: Row) => (r.archived ? <Badge>Arsip</Badge> : <Badge color={SEM.ok}>Aktif</Badge>);

export function RoomTypes() {
  return (
    <Crud resource="room-types" title="Tipe kamar" desc="Grup kamar dengan harga dasar yang sama." empty="Belum ada tipe. Bikin satu dulu, nanti kamar tinggal pilih."
      columns={[{ key: 'name', label: 'Tipe' }, { key: 'base_price', label: 'Harga dasar', fmt: (r) => rp(r.base_price) }, { key: 'capacity', label: 'Kapasitas' }, { key: 'room_count', label: 'Kamar aktif' }, { key: 'archived', label: 'Status', fmt: activeBadge }]}
      fields={[{ key: 'name', label: 'Nama tipe', req: 1 }, { key: 'base_price', label: 'Harga dasar / bulan', type: 'number', req: 1 }, { key: 'capacity', label: 'Kapasitas', type: 'number' }, { key: 'archived', label: 'Arsip', type: 'bool' }]}
      defaults={{ capacity: 1, archived: 0 }} />
  );
}

export function Rooms() {
  const [types] = useList('room-types');
  const nav = useNavigate();
  return (
    <Crud resource="rooms" title="Kamar" desc="Daftar kamar fisik. Harga ikut tipe kecuali diisi harga khusus." canAdd={types.length > 0} defaults={{ archived: 0 }}
      empty={types.length ? 'Belum ada kamar.' : 'Belum ada tipe kamar. Bikin tipe dulu, baru kamar.'}
      emptyAction={!types.length && <Button onClick={() => nav('/room-types')}>Bikin tipe kamar</Button>}
      columns={[{ key: 'number', label: 'No' }, { key: 'type_name', label: 'Tipe' }, { key: 'price', label: 'Harga / bulan', fmt: (r) => rp(r.price) + (r.price_override ? ' *' : '') }, { key: 'archived', label: 'Status', fmt: activeBadge }]}
      fields={[{ key: 'number', label: 'No kamar', req: 1 }, { key: 'room_type_id', label: 'Tipe', type: 'select', req: 1, options: opts(types, (t) => `${t.name} (${rp(t.base_price)})`) },
        { key: 'price_override', label: 'Harga khusus (opsional)', type: 'number', hint: () => 'Kosongkan buat pakai harga tipe. Tanda * di tabel = harga khusus.' }, { key: 'archived', label: 'Arsip', type: 'bool' }]} />
  );
}

export function Guests() {
  return (
    <Crud resource="guests" title="Tamu" desc="Otomatis bertambah tiap bikin booking tamu baru." empty="Belum ada tamu. Otomatis muncul saat bikin booking."
      columns={[{ key: 'name', label: 'Nama' }, { key: 'phone', label: 'HP' }, { key: 'booking_count', label: 'Booking' }, { key: 'note', label: 'Catatan' }]}
      fields={[{ key: 'name', label: 'Nama', req: 1 }, { key: 'phone', label: 'HP' }, { key: 'note', label: 'Catatan' }]} />
  );
}

export function Promos() {
  const [types] = useList('room-types');
  return (
    <div className="space-y-8">
      <Crud resource="promos" title="Promo" desc="Harga spesial per periode. Dipakai otomatis saat booking." empty="Belum ada promo."
        columns={[{ key: 'name', label: 'Promo' }, { key: 'type_name', label: 'Tipe', fmt: (r) => r.type_name || 'Semua tipe' }, { key: 'price', label: 'Harga', fmt: (r) => rp(r.price) }, { key: 'start_date', label: 'Mulai' }, { key: 'end_date', label: 'Sampai' }]}
        fields={[{ key: 'name', label: 'Nama promo', req: 1 }, { key: 'room_type_id', label: 'Tipe kamar', type: 'select', options: opts(types, (t) => t.name), hint: () => 'Kosong = berlaku semua tipe' },
          { key: 'price', label: 'Harga promo / bulan', type: 'number', req: 1 }, { key: 'start_date', label: 'Mulai', type: 'date', req: 1 }, { key: 'end_date', label: 'Sampai', type: 'date', req: 1 }]} />
      <PromoCalc />
    </div>
  );
}

const KINDS: Record<string, string[]> = { income: ['Pemasukan', 'Pemasukan lain'], expense: ['Biaya', 'Biaya operasional'], capital: ['Modal', 'Modal awal / investasi'] };
const DESC: Record<string, string> = { income: 'Pembayaran booking otomatis masuk sini. Pemasukan lain bisa dicatat manual.', expense: 'Listrik, air, gaji, dan biaya rutin lainnya.', capital: 'Modal awal dan investasi. Dipakai hitung balik modal.' };

function Ledger({ kind }: { kind: string }) {
  const [cats] = useList('categories');
  const [rooms] = useList('rooms');
  const catOpts = opts(cats.filter((c) => c.kind === kind), (c) => c.name);
  return (
    <Crud key={kind} resource="transactions" query={`?kind=${kind}`} title={KINDS[kind][0]} desc={DESC[kind]} defaults={{ date: today() }}
      empty={kind === 'income' ? 'Pembayaran booking otomatis muncul di sini.' : 'Belum ada catatan.'}
      columns={[{ key: 'date', label: 'Tanggal' }, { key: 'category', label: 'Kategori' }, { key: 'amount', label: 'Nominal', fmt: (r) => rp(r.amount) },
        { key: 'note', label: 'Catatan', fmt: (r) => r.guest_name ? `Booking ${r.guest_name}${r.note ? ' · ' + r.note : ''}` : r.note || '-' }, { key: 'room_number', label: 'Kamar' }]}
      fields={[{ key: 'date', label: 'Tanggal', type: 'date', req: 1 }, { key: 'category_id', label: 'Kategori', type: 'select', req: 1, options: catOpts },
        { key: 'amount', label: 'Nominal', type: 'number', req: 1 }, { key: 'room_id', label: 'Kamar (opsional)', type: 'select', options: opts(rooms, (r) => r.number) }, { key: 'method', label: 'Metode' }, { key: 'note', label: 'Catatan' }]} />
  );
}
export const Income = () => <Ledger kind="income" />;
export const Expense = () => <Ledger kind="expense" />;
export const Capital = () => <Ledger kind="capital" />;

export function Categories() {
  return (
    <Crud resource="categories" title="Kategori" desc="Label buat pengelompokan pemasukan, biaya, dan modal."
      columns={[{ key: 'kind', label: 'Jenis', fmt: (r) => KINDS[r.kind][0] }, { key: 'name', label: 'Nama' }, { key: 'uses', label: 'Dipakai' }]}
      fields={[{ key: 'kind', label: 'Jenis', type: 'select', req: 1, options: Object.entries(KINDS).map(([v, [l]]) => ({ v, l })) }, { key: 'name', label: 'Nama', req: 1 }]} />
  );
}
