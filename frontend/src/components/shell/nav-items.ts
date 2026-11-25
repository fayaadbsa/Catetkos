// Satu sumber navigasi. Cuma data (path, label, nama ikon), jadi aman dipakai server maupun client.
// Ikon dipetakan ke komponen di nav-icons.ts, halaman = satu page.tsx per path di src/app/(app)/.
export type IconName =
  | 'dashboard'
  | 'booking'
  | 'calendar'
  | 'guests'
  | 'promo'
  | 'income'
  | 'expense'
  | 'capital'
  | 'room-types'
  | 'rooms'
  | 'categories'
  | 'kos'
  | 'account'
  | 'more';

export interface NavItem {
  path: string;
  label: string;
  icon: IconName;
}

export const NAV: { group: string; items: NavItem[] }[] = [
  { group: 'Ringkasan', items: [{ path: '/dashboard', label: 'Dashboard', icon: 'dashboard' }] },
  {
    group: 'Operasional',
    items: [
      { path: '/bookings', label: 'Booking', icon: 'booking' },
      { path: '/calendar', label: 'Kalender', icon: 'calendar' },
      { path: '/guests', label: 'Tamu', icon: 'guests' },
      { path: '/promo', label: 'Promo', icon: 'promo' },
    ],
  },
  {
    group: 'Keuangan',
    items: [
      { path: '/income', label: 'Pemasukan', icon: 'income' },
      { path: '/expense', label: 'Biaya', icon: 'expense' },
      { path: '/capital', label: 'Modal', icon: 'capital' },
    ],
  },
  {
    group: 'Data master',
    items: [
      { path: '/room-types', label: 'Tipe kamar', icon: 'room-types' },
      { path: '/rooms', label: 'Kamar', icon: 'rooms' },
      { path: '/categories', label: 'Kategori', icon: 'categories' },
      { path: '/kos', label: 'Kos & anggota', icon: 'kos' },
    ],
  },
];
export const ACCOUNT: NavItem = { path: '/account', label: 'Akun', icon: 'account' };
export const MORE: NavItem = { path: '/more', label: 'Lainnya', icon: 'more' };
export const ALL_ITEMS = [...NAV.flatMap((g) => g.items), ACCOUNT, MORE];
export const HOME = '/dashboard';
// Tab bawah mobile (+ tombol "Menu" buat sisanya).
export const BOTTOM_PATHS = ['/dashboard', '/calendar', '/bookings', '/income'];
