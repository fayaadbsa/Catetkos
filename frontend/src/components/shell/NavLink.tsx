import { NavLink as RRNavLink, type NavLinkProps } from 'react-router-dom';

// Alias tipis ke NavLink react-router (aktif kalau path sama persis).
export function NavLink(p: NavLinkProps) {
  return <RRNavLink end {...p} />;
}
