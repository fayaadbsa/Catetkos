import { Building2, LayoutDashboard, CalendarCheck, BedDouble, Users, Tag, Layers, ListChecks, ArrowDownToLine, ArrowUpFromLine, Landmark, UserCircle, type LucideIcon } from 'lucide-react';
import type { ComponentType } from 'react';
import Dashboard from '../../pages/Dashboard';
import Bookings from '../../pages/Bookings';
import KosPage from '../../pages/KosPage';
import Account from '../../pages/Account';
import { Rooms, RoomTypes, Guests, Promos, Categories, Income, Expense, Capital } from '../../pages/Resources';

export interface NavItem { path: string; label: string; icon: LucideIcon; page: ComponentType }

// Satu sumber navigasi + rute. URL tetap (path nyata), bisa di-bookmark / di-refresh.
export const NAV: { group: string; items: NavItem[] }[] = [
  { group: 'Ringkasan', items: [{ path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, page: Dashboard }] },
  { group: 'Operasional', items: [
    { path: '/bookings', label: 'Booking', icon: CalendarCheck, page: Bookings },
    { path: '/guests', label: 'Tamu', icon: Users, page: Guests },
    { path: '/promo', label: 'Promo', icon: Tag, page: Promos }] },
  { group: 'Keuangan', items: [
    { path: '/income', label: 'Pemasukan', icon: ArrowDownToLine, page: Income },
    { path: '/expense', label: 'Biaya', icon: ArrowUpFromLine, page: Expense },
    { path: '/capital', label: 'Modal', icon: Landmark, page: Capital }] },
  { group: 'Data master', items: [
    { path: '/room-types', label: 'Tipe kamar', icon: Layers, page: RoomTypes },
    { path: '/rooms', label: 'Kamar', icon: BedDouble, page: Rooms },
    { path: '/categories', label: 'Kategori', icon: ListChecks, page: Categories },
    { path: '/kos', label: 'Kos & anggota', icon: Building2, page: KosPage }] },
];
export const ACCOUNT: NavItem = { path: '/account', label: 'Akun', icon: UserCircle, page: Account };
export const ALL_ITEMS = [...NAV.flatMap((g) => g.items), ACCOUNT];
export const HOME = '/dashboard';
// Tab bawah mobile (+ tombol "Menu" buat sisanya).
export const BOTTOM_PATHS = ['/dashboard', '/bookings', '/income', '/rooms'];
