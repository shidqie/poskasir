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
  ToggleLeft,
  ToggleRight,
  Barcode,
  Layers,
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

        <Button
          onClick={() => navigate('/owner/products/new')}
          variant="primary"
          icon={Plus}
          className="shrink-0"
        >
          Tambah Barang
        </Button>
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
          <div className="overflow-x-auto">
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

                  // Hitung harga & stok
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
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
