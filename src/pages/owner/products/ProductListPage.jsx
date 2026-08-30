import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/services/productService';
import { categoryService } from '@/services/categoryService';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Select } from '@/components/common/Select';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { EmptyState } from '@/components/common/EmptyState';
import { Alert } from '@/components/common/Alert';
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
  Trash2,
  ToggleLeft,
  ToggleRight,
  Barcode,
  Layers,
  PackagePlus,
} from 'lucide-react';
import { QuickRestockModal } from '@/components/stock/QuickRestockModal';

export function ProductListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Filters State
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');

  // Confirmation & Toast & Restock State
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, product: null });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, product: null });
  const [restockTarget, setRestockTarget] = useState({ product: null, variant: null });
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
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      setToast({
        isOpen: true,
        message: 'Status produk berhasil diubah.',
        type: 'success',
      });
    },
    onError: (err) => {
      setToast({
        isOpen: true,
        message: err.message || 'Gagal mengubah status produk.',
        type: 'danger',
      });
    },
  });

  // Delete Product Mutation
  const deleteMutation = useMutation({
    mutationFn: (productId) => productService.deleteProduct(productId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      setToast({
        isOpen: true,
        message: result.message || 'Barang berhasil dihapus.',
        type: result.softDeleted ? 'warning' : 'success',
      });
      setDeleteDialog({ isOpen: false, product: null });
    },
    onError: (err) => {
      setToast({
        isOpen: true,
        message: err.message || 'Gagal menghapus barang.',
        type: 'danger',
      });
      setDeleteDialog({ isOpen: false, product: null });
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
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Data Master Barang' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Data Master Barang
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Katalog produk toko sembako, varian produk, barcode, kategori, satuan, harga jual, dan stok
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => navigate('/owner/stock-adjustment')}
            variant="outline"
            icon={PackagePlus}
            className="shrink-0 font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 text-xs sm:text-sm py-2 sm:py-2.5 rounded-xl cursor-pointer"
          >
            + Restok / Penyesuaian
          </Button>

          <Button
            onClick={() => navigate('/owner/products/new')}
            variant="primary"
            icon={Plus}
            className="shrink-0 font-bold text-xs sm:text-sm py-2 sm:py-2.5 rounded-xl cursor-pointer"
          >
            Tambah Barang
          </Button>
        </div>
      </div>

      {/* Toolbar & Filter */}
      <Card bodyClassName="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Cari nama / varian / kode / barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Filter Kategori */}
          <Select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            placeholder="Semua Kategori"
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            selectClassName="py-2 bg-slate-50"
          />

          {/* Filter Status */}
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            placeholder={null}
            options={[
              { value: 'all', label: 'Semua Status' },
              { value: 'true', label: 'Aktif' },
              { value: 'false', label: 'Tidak Aktif' },
            ]}
            selectClassName="py-2 bg-slate-50"
          />

          {/* Filter Stok */}
          <Select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            placeholder={null}
            options={[
              { value: 'all', label: 'Semua Status Stok' },
              { value: 'available', label: 'Stok Tersedia' },
              { value: 'low', label: 'Stok Menipis' },
              { value: 'out_of_stock', label: 'Stok Habis (0)' },
            ]}
            selectClassName="py-2 bg-slate-50"
          />
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
          <div className="p-6">
            <Alert variant="danger" title="Gagal Memuat Data Barang">
              {error?.message || 'Silakan coba beberapa saat lagi atau hubungi administrator.'}
            </Alert>
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title={
              search || categoryId || status !== 'all' || stockFilter !== 'all'
                ? 'Barang Tidak Ditemukan'
                : 'Belum Ada Data Master Barang'
            }
            description={
              search || categoryId || status !== 'all' || stockFilter !== 'all'
                ? 'Coba sesuaikan kata kunci pencarian atau filter yang Anda pilih.'
                : 'Klik tombol Tambah Barang untuk mendaftarkan produk sembako baru ke sistem.'
            }
            actionLabel={
              search || categoryId || status !== 'all' || stockFilter !== 'all'
                ? null
                : 'Tambah Barang Baru'
            }
            onAction={() => navigate('/owner/products/new')}
          />
        ) : (
          <div>
            {/* 1. Mobile Card List View (< 768px) */}
            <div className="md:hidden divide-y divide-slate-100">
              {products.map((p) => {
                const hasVariants = Boolean(p.has_variants && p.product_variants?.length > 0);
                const variantCount = p.product_variants?.length || 0;

                let displayPrice = p.selling_price;
                let displayStock = p.stock;
                let minStock = p.minimum_stock;
                let isStartingPrice = false;

                if (hasVariants) {
                  const variants = p.product_variants || [];
                  const prices = variants.map((v) => Number(v.selling_price) || 0);
                  const stocks = variants.map((v) => Number(v.stock) || 0);
                  const minStocks = variants.map((v) => Number(v.minimum_stock) || 0);

                  displayPrice = prices.length > 0 ? Math.min(...prices) : 0;
                  isStartingPrice = prices.length > 1;
                  displayStock = stocks.reduce((a, b) => a + b, 0);
                  minStock = minStocks.reduce((a, b) => a + b, 0);
                }

                return (
                  <div key={p.id} className="p-3.5 space-y-2.5 bg-white hover:bg-slate-50/70 transition-colors">
                    {/* Header Row: Name & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/owner/products/${p.id}`}
                          className="font-bold text-sm text-slate-900 hover:text-red-600 line-clamp-1"
                        >
                          {p.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-mono">
                          <span className="font-semibold text-slate-700">{p.code}</span>
                          {p.barcode && !hasVariants && (
                            <span className="flex items-center gap-1 text-slate-400 truncate max-w-[120px]">
                              <Barcode className="w-3 h-3 shrink-0" />
                              {p.barcode}
                            </span>
                          )}
                        </div>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>

                    {/* Middle Row: Category, Variants, Price, Stock */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          {p.category?.name || '-'}
                        </span>
                        {hasVariants && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200/80 font-bold text-[11px]">
                            <Layers className="w-3 h-3" />
                            {variantCount} Varian
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="font-black text-sm text-red-600 font-mono">
                          {isStartingPrice && <span className="text-[10px] text-slate-400 font-normal mr-1">Mulai</span>}
                          {formatRupiah(displayPrice)}
                        </span>
                      </div>
                    </div>

                    {/* Stock & Quick Actions Row */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500 font-medium">Stok:</span>
                        <StockBadge
                          stock={displayStock}
                          minimumStock={minStock}
                          unitSymbol={p.unit?.symbol || ''}
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setRestockTarget({ product: p, variant: null })}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold text-xs flex items-center gap-1 min-h-[36px]"
                          title="Tambah Stok Masuk"
                        >
                          <PackagePlus className="w-3.5 h-3.5" />
                          <span>+ Stok</span>
                        </button>

                        <Link
                          to={`/owner/products/${p.id}/edit`}
                          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 font-semibold text-xs flex items-center justify-center min-w-[36px] min-h-[36px]"
                          title="Ubah Data"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          onClick={() => handleToggleClick(p)}
                          className={`p-2 rounded-xl border font-semibold text-xs flex items-center justify-center min-w-[36px] min-h-[36px] ${
                            p.status
                              ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                              : 'border-slate-200 text-slate-400 hover:bg-slate-100'
                          }`}
                          title={p.status ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          {p.status ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteDialog({ isOpen: true, product: p })}
                          className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 font-semibold text-xs flex items-center justify-center min-w-[36px] min-h-[36px] transition-colors cursor-pointer"
                          title="Hapus Barang"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 2. Desktop Table View (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Produk</th>
                    <th className="px-4 py-3.5">Kategori</th>
                    <th className="px-4 py-3.5 text-center">Varian</th>
                    <th className="px-5 py-3.5 text-right">Harga</th>
                    <th className="px-4 py-3.5 text-center">Stok</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {products.map((p) => {
                    const hasVariants = Boolean(p.has_variants && p.product_variants?.length > 0);
                    const variantCount = p.product_variants?.length || 0;

                    let displayPrice = p.selling_price;
                    let displayStock = p.stock;
                    let minStock = p.minimum_stock;
                    let isStartingPrice = false;

                    if (hasVariants) {
                      const variants = p.product_variants || [];
                      const prices = variants.map((v) => Number(v.selling_price) || 0);
                      const stocks = variants.map((v) => Number(v.stock) || 0);
                      const minStocks = variants.map((v) => Number(v.minimum_stock) || 0);

                      displayPrice = prices.length > 0 ? Math.min(...prices) : 0;
                      isStartingPrice = prices.length > 1;
                      displayStock = stocks.reduce((a, b) => a + b, 0);
                      minStock = minStocks.reduce((a, b) => a + b, 0);
                    }

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Produk & Barcode/Kode */}
                        <td className="px-5 py-4">
                          <div>
                            <Link
                              to={`/owner/products/${p.id}`}
                              className="font-bold text-slate-900 hover:text-red-600 transition-colors line-clamp-1 text-sm"
                            >
                              {p.name}
                            </Link>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-mono">
                              <span className="font-semibold text-slate-600">{p.code}</span>
                              {p.barcode && !hasVariants && (
                                <span className="flex items-center gap-0.5 text-slate-400">
                                  <Barcode className="w-3 h-3" />
                                  {p.barcode}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Kategori */}
                        <td className="px-4 py-4 text-slate-700">
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                            {p.category?.name || '-'}
                          </span>
                        </td>

                        {/* Varian */}
                        <td className="px-4 py-4 text-center">
                          {hasVariants ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200/80 text-xs font-bold">
                              <Layers className="w-3 h-3 text-red-600" />
                              {variantCount} Varian
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 font-normal">
                              Tidak Ada Varian
                            </span>
                          )}
                        </td>

                        {/* Harga Jual */}
                        <td className="px-5 py-4 text-right font-bold text-slate-900">
                          {hasVariants && isStartingPrice && (
                            <span className="text-[11px] text-slate-400 font-normal mr-1">
                              Mulai
                            </span>
                          )}
                          {formatRupiah(displayPrice)}
                        </td>

                        {/* Stok */}
                        <td className="px-4 py-4 text-center">
                          <StockBadge
                            stock={displayStock}
                            minimumStock={minStock}
                            unitSymbol={p.unit?.symbol || ''}
                          />
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4 text-center">
                          <StatusBadge status={p.status} />
                        </td>

                        {/* Aksi */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Tombol Tambah Stok Cepat */}
                            <button
                              type="button"
                              onClick={() => setRestockTarget({ product: p, variant: null })}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer"
                              title="Tambah Stok Masuk"
                            >
                              <PackagePlus className="w-4 h-4" />
                            </button>

                            <Link
                              to={`/owner/products/${p.id}`}
                              className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Lihat Detail Produk & Varian"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>

                            <Link
                              to={`/owner/products/${p.id}/edit`}
                              className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Ubah Data Barang"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Link>

                            <button
                              onClick={() => handleToggleClick(p)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
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

                            <button
                              type="button"
                              onClick={() => setDeleteDialog({ isOpen: true, product: p })}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Hapus Barang"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      {/* Modal Tambah Stok Cepat */}
      <QuickRestockModal
        isOpen={Boolean(restockTarget.product)}
        onClose={() => setRestockTarget({ product: null, variant: null })}
        product={restockTarget.product}
        variant={restockTarget.variant}
        onSuccess={({ newStock, added }) => {
          setToast({
            isOpen: true,
            message: `Stok berhasil ditambah (+${added})! Total stok sekarang: ${newStock}`,
            type: 'success',
          });
        }}
      />

      {/* Toggle Status Confirmation Dialog */}
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, product: null })}
        onConfirm={() => {
          if (deleteDialog.product) {
            deleteMutation.mutate(deleteDialog.product.id);
          }
        }}
        title="Hapus Data Barang?"
        message={`Apakah Anda yakin ingin menghapus barang "${deleteDialog.product?.name}"? Jika barang ini sudah pernah ada transaksi di kasir, statusnya akan dinonaktifkan secara aman agar arsip laporan tetap rapi.`}
        confirmText="Hapus Barang"
        type="danger"
        isLoading={deleteMutation.isPending}
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
