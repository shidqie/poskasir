import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/services/productService';
import { categoryService } from '@/services/categoryService';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StockBadge } from '@/components/common/StockBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Toast } from '@/components/common/Toast';
import { formatRupiah } from '@/utils/formatters';
import {
  Package,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  ToggleLeft,
  ToggleRight,
  Barcode,
  AlertCircle,
} from 'lucide-react';

export function ProductListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Filters State
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');

  // Confirmation & Toast State
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, product: null });
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' });

  // Query Kategori untuk dropdown filter
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', 'active'],
    queryFn: () => categoryService.getCategories({ onlyActive: true }),
  });

  // Query Data Barang
  const {
    data: products = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['products', { search, categoryId, status, stockFilter }],
    queryFn: () =>
      productService.getProducts({
        search,
        categoryId,
        status,
        stockFilter,
      }),
  });

  // Toggle Status Mutation
  const toggleMutation = useMutation({
    mutationFn: (product) =>
      productService.toggleProductStatus(product.id, product.status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setToast({
        isOpen: true,
        message: 'Status produk berhasil diubah.',
        type: 'success',
      });
    },
  });

  const handleToggleClick = (product) => {
    setConfirmDialog({
      isOpen: true,
      product,
    });
  };

  const handleConfirmToggle = async () => {
    if (confirmDialog.product) {
      await toggleMutation.mutateAsync(confirmDialog.product);
      setConfirmDialog({ isOpen: false, product: null });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Data Master Barang
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Kelola seluruh produk, harga jual, stok, dan barcode barang sembako
            </p>
          </div>
        </div>

        <Button
          onClick={() => navigate('/owner/products/new')}
          variant="primary"
          icon={Plus}
          className="shrink-0"
        >
          Tambah Barang
        </Button>
      </div>

      {/* Filter & Toolbar Box */}
      <Card bodyClassName="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Pencarian */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Cari nama / kode / barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Filter Kategori */}
          <div>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            >
              <option value="all">Semua Status</option>
              <option value="true">Aktif</option>
              <option value="false">Tidak Aktif</option>
            </select>
          </div>

          {/* Filter Stok */}
          <div>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            >
              <option value="all">Semua Status Stok</option>
              <option value="available">Stok Tersedia</option>
              <option value="low">Stok Menipis (Di Bawah Min)</option>
              <option value="out_of_stock">Stok Habis (0)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
          <span>Menampilkan hasil pencarian produk:</span>
          <span className="font-semibold text-slate-900">{products.length} barang</span>
        </div>
      </Card>

      {/* Main Table */}
      <Card bodyClassName="p-0 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center">
            <LoadingSpinner size="md" message="Memuat data master barang..." />
          </div>
        ) : isError ? (
          <div className="py-12 text-center text-red-600">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
            <p className="font-semibold text-sm">Gagal memuat data barang</p>
            <p className="text-xs text-slate-500 mt-1">{error?.message || 'Silakan coba kembali'}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700 text-sm">
              {search || categoryId || status !== 'all' || stockFilter !== 'all'
                ? 'Barang tidak ditemukan'
                : 'Belum ada data master barang'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {search || categoryId || status !== 'all' || stockFilter !== 'all'
                ? 'Coba sesuaikan kata kunci pencarian atau filter yang dipilih'
                : 'Klik tombol Tambah Barang untuk mendaftarkan produk sembako baru.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Nama & Barcode</th>
                  <th className="px-6 py-3.5">Kode</th>
                  <th className="px-6 py-3.5">Kategori</th>
                  <th className="px-6 py-3.5 text-right">Harga Jual</th>
                  <th className="px-6 py-3.5 text-center">Stok</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Nama & Barcode */}
                    <td className="px-6 py-4">
                      <div>
                        <Link
                          to={`/owner/products/${p.id}`}
                          className="font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1"
                        >
                          {p.name}
                        </Link>
                        {p.barcode ? (
                          <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500 font-mono">
                            <Barcode className="w-3.5 h-3.5 text-slate-400" />
                            <span>{p.barcode}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Tanpa Barcode</span>
                        )}
                      </div>
                    </td>

                    {/* Kode */}
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-xs text-slate-700 border border-slate-200 font-bold">
                        {p.code}
                      </span>
                    </td>

                    {/* Kategori */}
                    <td className="px-6 py-4 text-slate-700">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                        {p.category?.name || '-'}
                      </span>
                    </td>

                    {/* Harga Jual */}
                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                      {formatRupiah(p.selling_price)}
                    </td>

                    {/* Stok */}
                    <td className="px-6 py-4 text-center">
                      <StockBadge
                        stock={p.stock}
                        minimumStock={p.minimum_stock}
                        unitSymbol={p.unit?.symbol || ''}
                      />
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={p.status} />
                    </td>

                    {/* Aksi */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/owner/products/${p.id}`}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                          title="Lihat Detail & Riwayat Harga"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/owner/products/${p.id}/edit`}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                          title="Ubah Data Barang"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleToggleClick(p)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            p.status
                              ? 'text-emerald-600 hover:bg-emerald-50'
                              : 'text-slate-400 hover:bg-slate-100'
                          }`}
                          title={p.status ? 'Nonaktifkan Produk' : 'Aktifkan Produk'}
                        >
                          {p.status ? (
                            <ToggleRight className="w-5 h-5" />
                          ) : (
                            <ToggleLeft className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, product: null })}
        onConfirm={handleConfirmToggle}
        title={confirmDialog.product?.status ? 'Nonaktifkan Barang?' : 'Aktifkan Barang?'}
        message={
          confirmDialog.product?.status
            ? `Produk "${confirmDialog.product?.name}" akan diset tidak aktif. Produk tidak akan muncul di kasir.`
            : `Produk "${confirmDialog.product?.name}" akan diaktifkan kembali untuk operasional kasir.`
        }
        confirmText={confirmDialog.product?.status ? 'Nonaktifkan' : 'Aktifkan'}
        type={confirmDialog.product?.status ? 'warning' : 'info'}
        isLoading={toggleMutation.isPending}
      />

      {/* Toast Feedback */}
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
    </div>
  );
}

export default ProductListPage;
