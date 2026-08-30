import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import {
  LayoutDashboard,
  Package,
  Layers,
  Scale,
  Tags,
  Tag,
  Receipt,
  BarChart3,
  Calculator,
  Users,
  LogOut,
  Menu,
  X,
  Store,
  ShieldCheck,
} from 'lucide-react';

export function OwnerLayout() {
  const { profile, user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    {
      label: 'Dashboard',
      to: '/owner/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Data Master Barang',
      to: '/owner/products',
      icon: Package,
    },
    {
      label: 'Kategori Barang',
      to: '/owner/categories',
      icon: Layers,
    },
    {
      label: 'Satuan Barang',
      to: '/owner/units',
      icon: Scale,
    },
    {
      label: 'Cek Daftar Harga',
      to: '/owner/prices',
      icon: Tags,
    },
    {
      label: 'Barang Belum Terdaftar',
      to: '/owner/unregistered-products',
      icon: Tag,
    },
    {
      label: 'Transaksi',
      to: '#',
      icon: Receipt,
      badge: 'Tahap 3',
      disabled: true,
    },
    {
      label: 'Laporan Penjualan',
      to: '#',
      icon: BarChart3,
      badge: 'Tahap 7',
      disabled: true,
    },
    {
      label: 'Closing Kasir',
      to: '#',
      icon: Calculator,
      badge: 'Tahap 7',
      disabled: true,
    },
    {
      label: 'Data Kasir',
      to: '#',
      icon: Users,
      badge: 'Mendatang',
      disabled: true,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-100 shrink-0 border-r border-slate-800">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight leading-none text-white">
              Kasir Sembako
            </h1>
            <span className="text-[11px] font-medium text-slate-400">
              Panel Pemilik Toko
            </span>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-sm shrink-0">
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'P'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">
                {profile?.full_name || 'Pemilik'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  Pemilik
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            if (item.disabled) {
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-slate-500 opacity-60 cursor-not-allowed select-none"
                  title="Fitur ini akan diimplementasikan pada tahap selanjutnya"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                      {item.badge}
                    </span>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={idx}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
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

        {/* Logout Section */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar (Logout)</span>
          </button>
        </div>
      </aside>

      {/* Topbar Mobile */}
      <header className="md:hidden bg-slate-900 text-white border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight text-white">Kasir Sembako</h1>
            <span className="text-[10px] text-slate-400">Pemilik</span>
          </div>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white focus:outline-none"
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm flex flex-col">
          <div className="bg-slate-900 w-4/5 max-w-sm h-full flex flex-col p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-white">Kasir Sembako</h2>
                  <span className="text-[10px] text-slate-400">Menu Pemilik</span>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 border-b border-slate-800">
              <p className="text-xs text-slate-400 font-medium">Masuk sebagai:</p>
              <p className="text-sm font-semibold text-white truncate mt-0.5">
                {profile?.full_name || 'Pemilik'}
              </p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Pemilik
              </span>
            </div>

            <nav className="flex-1 py-4 space-y-1.5 overflow-y-auto">
              {navItems.map((item, idx) => {
                const Icon = item.icon;
                if (item.disabled) {
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-500 opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  );
                }

                return (
                  <NavLink
                    key={idx}
                    to={item.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                        isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
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

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar (Logout)</span>
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default OwnerLayout;
