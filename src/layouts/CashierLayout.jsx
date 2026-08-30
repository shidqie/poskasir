import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import {
  LayoutDashboard,
  Tags,
  ShoppingCart,
  Calculator,
  History,
  DoorClosed,
  LogOut,
  Menu,
  X,
  Store,
  UserCheck,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

export function CashierLayout() {
  const { profile, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('cashier_sidebar_collapsed') === 'true';
  });
  const navigate = useNavigate();

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
      label: 'Buka & Tutup Kasir',
      to: '/closing',
      icon: DoorClosed,
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
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/30 shrink-0">
              <Store className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 truncate">
                <h1 className="font-extrabold text-base tracking-tight leading-none text-white truncate">
                  Kasir Sembako
                </h1>
                <span className="text-[11px] font-semibold text-red-400 block mt-0.5">
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
                  } rounded-xl text-sm font-medium transition-all group relative ${
                    isActive
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/25 font-semibold'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`
                }
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 min-w-0'}`}>
                  <Icon className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

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
              <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                {profile?.full_name?.charAt(0)?.toUpperCase() || 'K'}
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate leading-tight">
                    {profile?.full_name || 'Kasir'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-red-500/20 text-red-300 border border-red-500/30">
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
            } px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Keluar (Logout)</span>}
          </button>
        </div>
      </aside>

      {/* Topbar Mobile */}
      <header className="md:hidden bg-slate-950 text-white border-b border-slate-900 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-red-600/30">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight text-white">Kasir Sembako</h1>
            <span className="text-[10px] text-red-400 font-semibold block">Terminal Kasir</span>
          </div>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg bg-slate-900 text-slate-300 hover:text-white"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs">
          <div className="fixed inset-y-0 left-0 w-72 bg-slate-950 text-white flex flex-col p-4 z-50 border-r border-slate-900 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-900">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-white">Kasir Sembako</h2>
                  <span className="text-[10px] text-red-400">Kasir</span>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto py-3">
              {navItems.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={idx}
                    to={item.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-red-600 text-white font-semibold'
                          : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                  </NavLink>
                );
              })}
            </nav>

            {/* Bottom Mobile Section */}
            <div className="pt-3 border-t border-slate-900 space-y-2">
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <p className="text-xs font-bold text-white truncate">{profile?.full_name}</p>
                <span className="text-[10px] text-red-400 font-medium">Kasir Toko</span>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar (Logout)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main App Content Outlet */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default CashierLayout;
