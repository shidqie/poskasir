import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
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
  Lock,
} from 'lucide-react';

export function CashierLayout() {
  const { profile, logout } = useAuthStore();
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar Desktop (Collapsible) */}
      <aside
        className={`hidden md:flex flex-col bg-slate-950 text-slate-100 shrink-0 border-r border-slate-900 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className={`p-4 border-b border-slate-900 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between gap-3'}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/30 shrink-0">
              <Store className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 truncate">
                <h1 className="font-black text-base tracking-tight leading-none text-white truncate">
                  Kasir Sembako
                </h1>
                <span className="text-[11px] font-bold text-red-400 block mt-0.5">
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
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
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
                  } rounded-xl text-xs font-bold transition-all group relative cursor-pointer ${
                    isActive
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/25'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`
                }
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 min-w-0'}`}>
                  <Icon className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!isCollapsed && item.badge && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${item.badgeColor}`}>
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
            className={`p-2.5 bg-slate-900/90 rounded-2xl border border-slate-800/80 ${
              isCollapsed ? 'flex justify-center' : ''
            }`}
            title={isCollapsed ? `${profile?.full_name || 'Kasir'} (Kasir)` : undefined}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center font-black text-xs shrink-0">
                {profile?.full_name?.charAt(0)?.toUpperCase() || 'K'}
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate leading-tight">
                    {profile?.full_name || 'Kasir'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                      <UserCheck className="w-2.5 h-2.5" />
                      Kasir
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            title={isCollapsed ? 'Keluar (Logout)' : undefined}
            className={`w-full flex items-center ${
              isCollapsed ? 'justify-center' : 'gap-3'
            } px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Keluar (Logout)</span>}
          </button>
        </div>
      </aside>

      {/* Topbar Mobile */}
      <header className="md:hidden bg-slate-950 text-white border-b border-slate-900 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm leading-tight text-white">Kasir Sembako</h1>
            <span className="text-[10px] text-red-400 font-bold block">Terminal Kasir</span>
          </div>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[57px] bg-slate-950/95 z-50 p-4 overflow-y-auto space-y-3">
          <nav className="space-y-1">
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={idx}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold ${
                      isActive
                        ? 'bg-red-600 text-white'
                        : 'text-slate-300 hover:bg-slate-900'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-slate-900">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-rose-600/20 text-rose-300 font-bold text-xs"
            >
              <LogOut size={16} />
              <span>Keluar (Logout)</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default CashierLayout;
