import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Building2,
  ClipboardList,
  Globe2,
  LayoutDashboard,
  LogOut,
  MapPin,
  UserCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { canAccess, roleLabel } from '@/lib/units';

function navItemsFor(role) {
  const items = [];
  if (canAccess(role, 'pusat')) {
    items.push({ to: '/pusat', label: 'Dasbor Pusat', icon: Globe2 });
  }
  if (canAccess(role, 'wilayah')) {
    items.push({ to: '/wilayah', label: 'Dasbor Wilayah', icon: Building2 });
  }
  items.push({ to: '/kota', label: 'Dasbor Kota/Kab.', icon: LayoutDashboard });
  items.push({ to: '/tugas', label: 'Daftar Tugas', icon: ClipboardList });
  items.push({ to: '/institusi', label: 'Profil Institusi', icon: Building2 });
  items.push({ to: '/profil', label: 'Profil', icon: UserCircle });
  return items;
}

const LOGO_URL =
  'https://horizons-cdn.hostinger.com/07e427fa-d575-42a9-9e54-1062f7b90da9/16154b93057f5dee94b031eafddd81f4.png';

function Brand({ compact = false }) {
  return (
    <div className={cn('flex items-center', compact ? 'gap-2' : 'gap-3')}>
      <img
        src={LOGO_URL}
        alt="STAR-PK"
        className={cn(
          'object-contain object-left',
          compact ? 'h-9 w-auto max-w-[160px]' : 'h-11 w-auto max-w-[200px]',
        )}
      />
    </div>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const role = user?.role;
  const navItems = navItemsFor(role);

  const lokasi = [
    user?.provinsi,
    user?.kabupaten_kota,
    user?.unit_kerja,
  ].filter(Boolean).join(' · ');

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const linkClass = ({ isActive }) =>
    cn(
      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
      isActive
        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
    );

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-sidebar-background md:flex">
        <div className="border-b border-sidebar-border px-5 py-5">
          <Brand />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass}>
              <item.icon className="h-4 w-4" strokeWidth={2.2} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <div className="mb-3 px-1">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">
              {user?.name || user?.email}
            </p>
            <p className="text-xs text-sidebar-foreground/60">
              {roleLabel(role)}
            </p>
            {lokasi && (
              <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-sidebar-foreground/50">
                <MapPin className="h-3 w-3 shrink-0" />
                {lokasi}
              </p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-4 w-4" strokeWidth={2.2} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Bilah atas mobile */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-sidebar-border bg-sidebar-background px-4 py-3 md:hidden">
        <Brand />
        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60',
                )
              }
              aria-label={item.label}
            >
              <item.icon className="h-5 w-5" strokeWidth={2.2} />
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60"
            aria-label="Keluar"
          >
            <LogOut className="h-5 w-5" strokeWidth={2.2} />
          </button>
        </div>
      </header>

      <main className="px-4 py-6 sm:px-6 md:ml-64 md:px-8 md:py-8">
        <div className="mx-auto w-full max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
