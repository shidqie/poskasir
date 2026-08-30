import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/components/common/Card';
import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  Store,
  ShieldCheck,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { formatTanggal } from '@/utils/formatters';

export function OwnerDashboard() {
  const { profile } = useAuthStore();
  const today = formatTanggal(new Date());

  const summaryCards = [
    {
      title: 'Pendapatan Hari Ini',
      value: 'Rp0',
      subtitle: 'Total transaksi berhasil',
      icon: DollarSign,
      iconBg: 'bg-emerald-100 text-emerald-600',
    },
    {
      title: 'Transaksi Hari Ini',
      value: '0',
      subtitle: 'Jumlah nota / struk',
      icon: ShoppingCart,
      iconBg: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Barang Terjual',
      value: '0',
      subtitle: 'Total kuantitas barang',
      icon: Package,
      iconBg: 'bg-violet-100 text-violet-600',
    },
    {
      title: 'Rata-Rata Transaksi',
      value: 'Rp0',
      subtitle: 'Nilai belanja per pelanggan',
      icon: TrendingUp,
      iconBg: 'bg-amber-100 text-amber-600',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-600/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/15 text-white backdrop-blur-sm">
              <ShieldCheck className="w-3.5 h-3.5" />
              Panel Manajemen Pemilik
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Selamat datang, {profile?.full_name || 'Pemilik Toko'}
          </h1>
          <p className="text-blue-100 text-sm mt-1">
            Pantau ringkasan aktivitas dan operasional penjualan toko sembako Anda.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/15 shrink-0 flex items-center gap-2.5 text-sm">
          <Calendar className="w-4 h-4 text-blue-200" />
          <span>{today}</span>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {summaryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card key={idx} className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">
                    {card.value}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{card.subtitle}</p>
                </div>
                <div className={`p-3 rounded-xl ${card.iconBg} shrink-0`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Status Fondasi Sistem */}
      <Card
        title="Status Fondasi Aplikasi (Tahap 1)"
        subtitle="Struktur autentikasi, role guard, dan layout berhasil diintegrasikan"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-3.5">
            <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold">Tahap 1 Selesai: Sistem Otentikasi & Hak Akses</p>
              <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
                Akun Pemilik dan Kasir telah dipisahkan menggunakan Supabase Auth & RLS. Anda login sebagai <strong>Pemilik</strong> dengan hak penuh untuk manajemen toko.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50">
              <h4 className="font-semibold text-sm text-slate-900 mb-1">
                Fitur Tahap Berikutnya (Tahap 2):
              </h4>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                <li>Manajemen Kategori & Satuan Barang</li>
                <li>Data Master Barang Sembako (Nama, Harga Jual, Stok)</li>
                <li>Daftar Harga & Pencarian Cepat</li>
                <li>Pencatatan Barang Belum Terdaftar</li>
              </ul>
            </div>
            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50">
              <h4 className="font-semibold text-sm text-slate-900 mb-1">
                Informasi Pengguna Aktif:
              </h4>
              <div className="text-xs text-slate-600 space-y-1">
                <p><span className="font-medium text-slate-700">Nama Lengkap:</span> {profile?.full_name || '-'}</p>
                <p><span className="font-medium text-slate-700">Role Sistem:</span> owner (Pemilik)</p>
                <p><span className="font-medium text-slate-700">Status Akun:</span> Aktif</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default OwnerDashboard;
