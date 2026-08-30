import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { cashierSessionService } from '@/services/cashierSessionService';
import {
  LayoutDashboard,
  Tags,
  ShoppingCart,
  Calculator,
  History,
  DoorClosed,
  DoorOpen,
  LogOut,
  Menu,
  X,
  Store,
  UserCheck,
  PanelLeftClose,
  PanelLeftOpen,
  BookOpen,
} from 'lucide-react';

export function CashierLayout() {
  const { profile, logout } = useAuthStore();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('cashier_sidebar_collapsed') === 'true';
  });
  const navigate = useNavigate();

  // Query sesi kasir aktif
  const { data: activeSession } = useQuery({
    queryKey: ['active-cashier-session', profile?.id],
    queryFn: () => cashierSessionService.getActiveSession(profile?.id),
    refetchInterval: 10000,
  });

  const isSessionOpen = activeSession && activeSession.status === 'open';

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('cashier_sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    {
      label: 'Dashboard',
      to: '/cashier/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Kasir / POS',
      to: '/pos',
      icon: ShoppingCart,
      badge: !isSessionOpen ? 'Terkunci' : 'Buka',
      badgeColor: !isSessionOpen ? 'bg-rose-500/80 text-white' : 'bg-emerald-500 text-white',
    },
    {
      label: 'Daftar & Cek Harga',
      to: '/price-list',
      icon: Tags,
    },
    {
      label: 'Hutang Pelanggan',
      to: '/debts',
      icon: BookOpen,
    },
    {
      label: 'Kalkulator Cepat',
      to: '/quick-calculator',
      icon: Calculator,
    },
    {
      label: 'Riwayat Transaksi',
      to: '/transactions',
      icon: History,
    },
    {
      label: isSessionOpen ? 'Tutup Kasir (Shift)' : 'Buka Kasir',
      to: '/closing',
      icon: isSessionOpen ? DoorClosed : DoorOpen,
      badge: isSessionOpen ? 'Aktif' : 'Buka',
      badgeColor: isSessionOpen ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white',
    },
  ];

  // Quick 5 primary items for mobile bottom navigation
  const bottomNavItems = [
    { label: 'Dashboard', to: '/cashier/dashboard', icon: LayoutDashboard },
    { label: 'POS', to: '/pos', icon: ShoppingCart },
    { label: 'Cek Harga', to: '/price-list', icon: Tags },
    { label: 'Kalkulator', to: '/quick-calculator', icon: Calculator },
    { label: 'Transaksi', to: '/transactions', icon: History },
  ];

  // Sembunyikan bottom navigation saat di halaman POS agar tidak bertabrakan dengan floating cart bar
  const isPosPage = location.pathname === '/pos' || location.pathname === '/owner/pos';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar Desktop (Collapsible) */}
      <aside
        className={`hidden md:flex flex-col bg-slate-950 text-slate-100 shrink-0 border-r border-slate-900 transition-all duration-200 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className={`p-4 border-b border-slate-900 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between gap-3'}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-lg shadow-red-600/30 shrink-0 bg-white p-0.5 border border-slate-800">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 truncate">
                <h1 className="font-black text-sm tracking-tight leading-none text-white truncate">
                  Kasir Sembako
                </h1>
                <span className="text-[10px] font-bold text-red-400 block mt-0.5">
                  Terminal Kasir
                </span>
              </div>
            )}
          </div>

          {/* Minimize / Expand Toggle Button */}
          <button
            type="button"
            onClick={toggleSidebar}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer shrink-0 ${
              isCollapsed ? 'hidden' : 'block'
            }`}
            title={isCollapsed ? 'Perbesar Sidebar' : 'Kecilkan Sidebar'}
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Collapsed Expand Quick Button */}
        {isCollapsed && (
          <div className="px-3 pt-2">
            <button
              type="button"
              onClick={toggleSidebar}
              className="w-full flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
              title="Perbesar Sidebar"
            >
              <PanelLeftOpen className="w-4 h-4 text-red-500" />
            </button>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-3 space-y-1.5 overflow-y-auto custom-scrollbar">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={idx}
                to={item.to}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center ${
                    isCollapsed ? 'justify-center px-2 py-3' : 'justify-between px-3 py-2.5'
                  } rounded-xl text-xs font-semibold transition-all group relative cursor-pointer ${
                    isActive
                      ? 'bg-red-600 text-white font-bold shadow-md shadow-red-600/25'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                  }`
                }
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5 min-w-0'}`}>
                  <Icon className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!isCollapsed && item.badge && (
                  <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}

                {/* Floating Tooltip in Collapsed Mode */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 z-50 transition-opacity border border-slate-800">
                    {item.label}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Section: Profile Card + Logout */}
        <div className="p-3 border-t border-slate-900 space-y-2">
          {/* User Card */}
          <div
            className={`p-2.5 bg-slate-900/90 rounded-xl border border-slate-800/80 ${
              isCollapsed ? 'flex justify-center' : ''
            }`}
            title={isCollapsed ? `${profile?.full_name || 'Kasir'} (Kasir)` : undefined}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center font-black text-xs shrink-0">
                {profile?.full_name?.charAt(0)?.toUpperCase() || 'K'}
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate leading-tight">
                    {profile?.full_name || 'Kasir'}
                  </p>
                  <span className="text-[9px] font-semibold text-slate-500 block">
                    {profile?.email}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            title={isCollapsed ? 'Keluar (Logout)' : undefined}
            className={`w-full flex items-center ${
              isCollapsed ? 'justify-center' : 'gap-2.5'
            } px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      {/* Main Content & Mobile Viewport */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Topbar Mobile */}
        <header className="md:hidden bg-slate-950 text-white border-b border-slate-900 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden shadow-md shrink-0 bg-white p-0.5 border border-slate-800">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm leading-tight text-white">Kasir Sembako</h1>
              <span className="text-[10px] text-red-400 font-bold block">Terminal Kasir</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isSessionOpen ? (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Sesi Aktif
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Tutup
              </span>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white"
              aria-label="Menu Kasir"
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </header>

        {/* Mobile Menu Drawer (Overlay) */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative w-4/5 max-w-xs bg-slate-950 text-white h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-left duration-200">
              <div className="p-4 border-b border-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-white p-0.5 shrink-0">
                    <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Kasir Sembako</h3>
                    <span className="text-[10px] text-red-400">Terminal Kasir</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 px-3 py-3 space-y-1.5 overflow-y-auto">
                {navItems.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={idx}
                      to={item.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-red-600 text-white font-bold shadow-md shadow-red-600/30'
                            : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                        }`
                      }
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </nav>

              <div className="p-3.5 border-t border-slate-900 bg-slate-950/90 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">
                    {profile?.full_name || 'Petugas Kasir'}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">{profile?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className={`flex-1 min-w-0 ${!isPosPage ? 'pb-16 md:pb-0' : ''}`}>
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation Bar (Hidden on POS page to avoid clash with Floating Cart) */}
        {!isPosPage && (
          <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 px-1.5 py-1 flex items-center justify-around shadow-2xl safe-area-pb">
            {bottomNavItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={idx}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[56px] min-h-[44px] ${
                      isActive
                        ? 'text-red-600 font-bold'
                        : 'text-slate-500 hover:text-slate-900 font-medium'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 mb-0.5" />
                  <span className="text-[10px] leading-none tracking-tight truncate max-w-[64px]">
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}

export default CashierLayout;
