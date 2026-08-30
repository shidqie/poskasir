import React, { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { productSubmissionService } from '@/services/productSubmissionService';
import { cashierSessionService } from '@/services/cashierSessionService';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  BookOpen,
  ArrowLeftRight,
  DoorClosed,
  DoorOpen,
  Package,
  Tags,
  Layers,
  Scale,
  Inbox,
  BarChart3,
  Users,
  LogOut,
  Menu,
  X,
  Store,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

export function OwnerLayout() {
  const { profile, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('owner_sidebar_collapsed') === 'true';
  });

  // Query jumlah pengajuan barang baru yang pending
  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['pending-submissions-count'],
    queryFn: () => productSubmissionService.getPendingCount(),
    refetchInterval: 10000,
  });

  // Query sesi kasir aktif
  const { data: activeSession } = useQuery({
    queryKey: ['active-cashier-session', profile?.id],
    queryFn: () => cashierSessionService.getActiveSession(profile?.id),
    refetchInterval: 10000,
  });

  const isSessionOpen = activeSession && activeSession.status === 'open';

  // Menu navigasi yang rapi, langsung, dan mudah diakses (tanpa dropdown bertumpuk)
  const navSections = [
    {
      title: 'UTAMA',
      items: [
        {
          label: 'Dashboard',
          to: '/owner/dashboard',
          icon: LayoutDashboard,
        },
        {
          label: 'Terminal Kasir / POS',
          to: '/owner/pos',
          icon: Store,
          badge: isSessionOpen ? 'Buka' : null,
          badgeColor: 'bg-emerald-500 text-white',
        },
      ],
    },
    {
      title: 'TRANSAKSI & KEUANGAN',
      items: [
        {
          label: 'Riwayat Penjualan',
          to: '/owner/transactions',
          icon: Receipt,
        },
        {
          label: 'Hutang Pelanggan',
          to: '/owner/debts',
          icon: BookOpen,
        },
        {
          label: 'Kas Masuk & Keluar',
          to: '/owner/cash-movements',
          icon: ArrowLeftRight,
        },
        {
          label: isSessionOpen ? 'Tutup Kasir (Shift)' : 'Buka Kasir',
          to: '/owner/closings',
          icon: isSessionOpen ? DoorClosed : DoorOpen,
          badge: isSessionOpen ? 'Aktif' : null,
          badgeColor: 'bg-emerald-500 text-white',
        },
      ],
    },
    {
      title: 'KATALOG & STOK',
      items: [
        {
          label: 'Data Master Barang',
          to: '/owner/products',
          icon: Package,
        },
        {
          label: 'Cek Daftar Harga',
          to: '/owner/prices',
          icon: Tags,
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
          label: 'Penyesuaian Stok',
          to: '/owner/stock-adjustment',
          icon: Scale,
        },
        {
          label: 'Pengajuan Barang',
          to: '/owner/product-submissions',
          icon: Inbox,
          badge: pendingCount > 0 ? pendingCount : null,
          badgeColor: 'bg-amber-500 text-white',
        },
      ],
    },
    {
      title: 'LAPORAN & PENGGUNA',
      items: [
        {
          label: 'Laporan Penjualan',
          to: '/owner/reports',
          icon: BarChart3,
        },
        {
          label: 'Data Kasir & Pengguna',
          to: '/owner/users',
          icon: Users,
        },
      ],
    },
  ];

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('owner_sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar Desktop (Collapsible & Direct 1-Click Access) */}
      <aside
        className={`hidden md:flex flex-col bg-slate-950 text-slate-100 shrink-0 border-r border-slate-900 transition-all duration-200 select-none ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div
          className={`p-4 border-b border-slate-900 flex items-center ${
            isCollapsed ? 'justify-center' : 'justify-between gap-3'
          }`}
        >
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
                  Panel Pemilik
                </span>
              </div>
            )}
          </div>

          {/* Minimize / Expand Button */}
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

        {/* Expand Button when Collapsed */}
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

        {/* Navigation Sections */}
        <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto custom-scrollbar">
          {navSections.map((sec, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 py-1 text-[10px] font-black tracking-wider text-slate-500 uppercase">
                  {sec.title}
                </div>
              )}
              {isCollapsed && sIdx > 0 && (
                <div className="border-t border-slate-800/80 my-1 mx-2" />
              )}

              {sec.items.map((item, iIdx) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={iIdx}
                    to={item.to}
                    title={isCollapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `flex items-center ${
                        isCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
                      } rounded-xl text-xs font-semibold transition-all group relative cursor-pointer ${
                        isActive
                          ? 'bg-red-600 text-white font-bold shadow-md shadow-red-600/25'
                          : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 transition-colors`} />
                      {!isCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </div>

                    {!isCollapsed && item.badge !== null && item.badge !== undefined && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-md font-black shrink-0 ${
                          item.badgeColor || 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {/* Dot Indicator for Collapsed Mode */}
                    {isCollapsed && item.badge !== null && item.badge !== undefined && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-slate-950" />
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Info & Logout Footer */}
        <div className="p-3 border-t border-slate-900 bg-slate-950/80">
          <div
            className={`flex items-center ${
              isCollapsed ? 'justify-center' : 'justify-between gap-2'
            }`}
          >
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">
                  {profile?.full_name || 'Pemilik Toko'}
                </p>
                <p className="text-[10px] text-slate-500 truncate">{profile?.email}</p>
              </div>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors cursor-pointer shrink-0"
              title="Keluar Akun"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Mobile Header Bar */}
        <header className="md:hidden bg-slate-950 text-white px-4 py-3 flex items-center justify-between border-b border-slate-900 sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-white p-0.5 shrink-0">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="leading-tight">
              <h2 className="font-bold text-sm text-white leading-none">Kasir Sembako</h2>
              <span className="text-[10px] text-red-400 font-medium">Panel Pemilik</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-xl bg-slate-900 text-slate-200 hover:text-white"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Mobile Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Drawer Content */}
            <div className="relative w-4/5 max-w-xs bg-slate-950 text-white h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-left duration-200">
              <div className="p-4 border-b border-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-white p-0.5 shrink-0">
                    <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Kasir Sembako</h3>
                    <span className="text-[10px] text-red-400">Panel Pemilik</span>
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

              {/* Mobile Navigation List */}
              <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
                {navSections.map((sec, sIdx) => (
                  <div key={sIdx} className="space-y-1">
                    <div className="px-3 py-1 text-[10px] font-black tracking-wider text-slate-500 uppercase">
                      {sec.title}
                    </div>
                    {sec.items.map((item, iIdx) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={iIdx}
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
                          {item.badge !== null && item.badge !== undefined && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                                item.badgeColor || 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                ))}
              </nav>

              {/* Mobile User & Logout Footer */}
              <div className="p-3.5 border-t border-slate-900 bg-slate-950/90 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">
                    {profile?.full_name || 'Pemilik Toko'}
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

        {/* Page Content */}
        <main className="flex-1 min-w-0 bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default OwnerLayout;
