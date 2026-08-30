import React, { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { productSubmissionService } from '@/services/productSubmissionService';
import { cashierSessionService } from '@/services/cashierSessionService';
import {
  LayoutDashboard,
  Package,
  Layers,
  Scale,
  Tags,
  Receipt,
  BarChart3,
  Users,
  LogOut,
  Menu,
  X,
  Store,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Inbox,
  DoorClosed,
  Circle,
  FileSpreadsheet,
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

  // Nav Groups Structure with Sub-menus
  const navSections = [
    {
      type: 'link',
      label: 'Dashboard',
      to: '/owner/dashboard',
      icon: LayoutDashboard,
    },
    {
      type: 'group',
      id: 'pos-transaksi',
      label: 'Transaksi & Kasir',
      icon: Store,
      children: [
        {
          label: 'Terminal Kasir / POS',
          to: '/owner/pos',
          badge: isSessionOpen ? 'Buka' : 'Terkunci',
          badgeColor: isSessionOpen ? 'bg-emerald-500 text-white' : 'bg-rose-500/80 text-white',
        },
        { label: 'Riwayat Transaksi', to: '/owner/transactions' },
        { label: 'Hutang Pelanggan', to: '/owner/debts' },
        { label: 'Kas Keluar & Masuk', to: '/owner/cash-movements' },
        {
          label: isSessionOpen ? 'Tutup Kasir (Shift)' : 'Buka Kasir',
          to: '/owner/closings',
          badge: isSessionOpen ? 'Aktif' : 'Buka',
          badgeColor: isSessionOpen ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white',
        },
      ],
    },
    {
      type: 'group',
      id: 'katalog-stok',
      label: 'Katalog & Stok',
      icon: Package,
      badge: pendingCount > 0 ? pendingCount : null,
      children: [
        { label: 'Data Master Barang', to: '/owner/products' },
        { label: 'Kategori Barang', to: '/owner/categories' },
        { label: 'Satuan Barang', to: '/owner/units' },
        { label: 'Cek Daftar Harga', to: '/owner/prices' },
        { label: 'Penyesuaian Stok', to: '/owner/stock-adjustment' },
        {
          label: 'Pengajuan Barang',
          to: '/owner/product-submissions',
          badge: pendingCount > 0 ? pendingCount : null,
        },
      ],
    },
    {
      type: 'group',
      id: 'laporan-analisis',
      label: 'Laporan & Analisis',
      icon: BarChart3,
      children: [
        { label: 'Laporan Penjualan', to: '/owner/reports' },
      ],
    },
    {
      type: 'group',
      id: 'karyawan-akun',
      label: 'Karyawan & Akun',
      icon: Users,
      children: [
        { label: 'Data Kasir / Pengguna', to: '/owner/users' },
      ],
    },
  ];

  // Accordion state: open by default if child is active
  const [openGroups, setOpenGroups] = useState(() => {
    const initial = { 'pos-transaksi': true, 'katalog-stok': true };
    navSections.forEach((section) => {
      if (section.type === 'group') {
        const hasActiveChild = section.children.some((child) =>
          location.pathname.startsWith(child.to)
        );
        if (hasActiveChild) initial[section.id] = true;
      }
    });
    return initial;
  });

  // Auto expand parent group when navigating to a child page
  useEffect(() => {
    navSections.forEach((section) => {
      if (section.type === 'group') {
        const hasActiveChild = section.children.some((child) =>
          location.pathname.startsWith(child.to)
        );
        if (hasActiveChild) {
          setOpenGroups((prev) => ({ ...prev, [section.id]: true }));
        }
      }
    });
  }, [location.pathname]);

  const toggleGroup = (groupId) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

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
      {/* Sidebar Desktop (Collapsible with Sub-menus) */}
      <aside
        className={`hidden md:flex flex-col bg-slate-950 text-slate-100 shrink-0 border-r border-slate-900 transition-all duration-300 ${
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
            <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg shadow-red-600/30 shrink-0 bg-white p-0.5 border border-slate-800">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 truncate">
                <h1 className="font-black text-base tracking-tight leading-none text-white truncate">
                  Kasir Sembako
                </h1>
                <span className="text-[11px] font-bold text-red-400 block mt-0.5">
                  Panel Pemilik
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

        {/* Navigation Menu with Sub-menus */}
        <nav className="flex-1 px-3 py-3 space-y-1.5 overflow-y-auto custom-scrollbar">
          {navSections.map((section, idx) => {
            // Case 1: Standalone Single Link
            if (section.type === 'link') {
              const Icon = section.icon;
              return (
                <NavLink
                  key={idx}
                  to={section.to}
                  title={isCollapsed ? section.label : undefined}
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
                    {!isCollapsed && <span className="truncate">{section.label}</span>}
                  </div>

                  {/* Floating Tooltip in Collapsed Mode */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 z-50 transition-opacity border border-slate-800">
                      {section.label}
                    </div>
                  )}
                </NavLink>
              );
            }

            // Case 2: Group with Sub-menu
            const Icon = section.icon;
            const isOpen = Boolean(openGroups[section.id]);
            const isAnyChildActive = section.children.some((c) =>
              location.pathname.startsWith(c.to)
            );

            return (
              <div key={section.id} className="relative group">
                {/* Group Header Button */}
                <button
                  type="button"
                  onClick={() => (isCollapsed ? toggleSidebar() : toggleGroup(section.id))}
                  title={isCollapsed ? section.label : undefined}
                  className={`w-full flex items-center ${
                    isCollapsed ? 'justify-center px-2 py-3' : 'justify-between px-3 py-2.5'
                  } rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isAnyChildActive
                      ? 'bg-slate-900 text-white border border-slate-800'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 min-w-0'}`}>
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isAnyChildActive ? 'text-red-500' : 'text-slate-400'
                      }`}
                    />
                    {!isCollapsed && (
                      <span className="truncate text-left">{section.label}</span>
                    )}
                  </div>

                  {!isCollapsed && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {section.badge && (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-black">
                          {section.badge}
                        </span>
                      )}
                      {isOpen ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </div>
                  )}
                </button>

                {/* Sub-menu Items (Expanded Mode) */}
                {!isCollapsed && isOpen && (
                  <div className="pl-4 pr-1 py-1 space-y-0.5 mt-0.5 border-l-2 border-slate-800/80 ml-4 animate-in slide-in-from-top-2 duration-150">
                    {section.children.map((child) => (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            isActive
                              ? 'bg-red-600/20 text-red-400 font-bold border border-red-500/30'
                              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                          }`
                        }
                      >
                        <span className="truncate">{child.label}</span>
                        {child.badge && (
                          <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[9px] font-black">
                            {child.badge}
                          </span>
                        )}
                      </NavLink>
                    ))}
                  </div>
                )}

                {/* Floating Flyout Menu when Collapsed Mode */}
                {isCollapsed && (
                  <div className="absolute left-full top-0 ml-3 w-52 bg-slate-900 text-white rounded-2xl shadow-2xl p-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-50 transition-all border border-slate-800 space-y-1">
                    <div className="px-2.5 py-1 text-[11px] font-black text-red-400 border-b border-slate-800 flex items-center justify-between">
                      <span>{section.label}</span>
                      {section.badge && (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[9px]">
                          {section.badge}
                        </span>
                      )}
                    </div>
                    {section.children.map((child) => (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            isActive
                              ? 'bg-red-600 text-white font-bold'
                              : 'text-slate-300 hover:bg-slate-800'
                          }`
                        }
                      >
                        <span>{child.label}</span>
                        {child.badge && (
                          <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[9px]">
                            {child.badge}
                          </span>
                        )}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
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
            title={isCollapsed ? `${profile?.full_name || 'Pemilik'} (Pemilik Toko)` : undefined}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center font-black text-xs shrink-0">
                {profile?.full_name?.charAt(0)?.toUpperCase() || 'P'}
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate leading-tight">
                    {profile?.full_name || 'Pemilik'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      Pemilik
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
          <div className="w-8 h-8 rounded-xl overflow-hidden shadow-md shrink-0 bg-white p-0.5 border border-slate-800">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm leading-tight text-white">Kasir Sembako</h1>
            <span className="text-[10px] text-red-400 font-bold block">Panel Pemilik</span>
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
          <nav className="space-y-2">
            {navSections.map((section, idx) => {
              if (section.type === 'link') {
                const Icon = section.icon;
                return (
                  <NavLink
                    key={idx}
                    to={section.to}
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
                      <span>{section.label}</span>
                    </div>
                  </NavLink>
                );
              }

              const Icon = section.icon;
              const isOpen = Boolean(openGroups[section.id]);

              return (
                <div key={section.id} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => toggleGroup(section.id)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold text-slate-300 bg-slate-900/60 border border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} className="text-red-500" />
                      <span>{section.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {section.badge && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black">
                          {section.badge}
                        </span>
                      )}
                      {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="pl-6 space-y-1 py-1">
                      {section.children.map((child) => (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs ${
                              isActive
                                ? 'bg-red-600/30 text-red-300 font-bold border border-red-500/30'
                                : 'text-slate-400 hover:text-white'
                            }`
                          }
                        >
                          <span>{child.label}</span>
                          {child.badge && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black">
                              {child.badge}
                            </span>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
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

export default OwnerLayout;
