import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/services/productService';
import { priceService } from '@/services/priceService';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StockBadge } from '@/components/common/StockBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Toast } from '@/components/common/Toast';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { EmptyState } from '@/components/common/EmptyState';
import { Alert } from '@/components/common/Alert';
import { EditVariantModal } from '@/components/products/EditVariantModal';
import { VariantPriceHistoryModal } from '@/components/products/VariantPriceHistoryModal';
import { formatRupiah, formatTanggal } from '@/utils/formatters';
import {
  ArrowLeft,
  Edit2,
  Package,
  Barcode,
  History,
  TrendingUp,
  Clock,
  User,
  Layers,
  Plus,
} from 'lucide-react';

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Modals state
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [historyModalVariant, setHistoryModalVariant] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' });

  // Query Detail Produk
  const {
    data: product,
    isLoading: isLoadingProduct,
    isError,
    error,
  } = useQuery({
    queryKey: ['products', id],
    queryFn: () => productService.getProductById(id),
  });

  // Query Riwayat Harga (Produk biasa)
  const { data: priceHistory = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['price-history', id],
    queryFn: () => priceService.getPriceHistory(id),
    enabled: Boolean(id && !product?.has_variants),
  });

  if (isLoadingProduct) {
    return (
      <div className="p-16 text-center">
        <LoadingSpinner size="lg" message="Memuat detail produk..." />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-4">
        <Alert variant="danger" title="Produk Tidak Ditemukan">
          {error?.message || 'Data produk mungkin telah dihapus atau URL tidak valid.'}
        </Alert>
        <Button variant="outline" onClick={() => navigate('/owner/products')}>
          Kembali ke Daftar Barang
        </Button>
      </div>
    );
  }

  const hasVariants = Boolean(product.has_variants);
  const variants = product.product_variants || [];

  // Hitung total stok dan harga minimal untuk produk bervarian
  let totalStock = Number(product.stock) || 0;
  let minPrice = product.selling_price;
  if (hasVariants && variants.length > 0) {
    totalStock = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    const prices = variants.map((v) => Number(v.selling_price) || 0);
    minPrice = Math.min(...prices);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full">
      {/* Breadcrumbs Navigation */}
      <Breadcrumbs
        items={[
          { label: 'Data Master Barang', to: '/owner/products' },
          { label: product.name },
        ]}
      />

      {/* Header Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/owner/products"
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                {product.name}
              </h1>
              <StatusBadge status={product.status} />
              {hasVariants && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200/80 text-xs font-bold">
                  <Layers className="w-3 h-3 text-red-600" />
                  {variants.length} Varian
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Kode Induk: <span className="font-mono font-bold text-slate-700">{product.code}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {hasVariants && (
            <Button
              variant="outline"
              icon={Plus}
              onClick={() => {
                setSelectedVariant(null);
                setIsVariantModalOpen(true);
              }}
            >
              Tambah Varian
            </Button>
          )}
          <Link to={`/owner/products/${product.id}/edit`}>
            <Button variant="primary" icon={Edit2}>
              Ubah Data Barang
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Harga Jual */}
        <Card className="bg-gradient-to-br from-red-50/70 to-rose-50/40 border-red-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-600 text-white shadow-md shadow-red-500/25">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {hasVariants ? 'Harga Mulai Dari' : 'Harga Jual Satuan'}
              </p>
              <p className="text-2xl font-black text-red-950 mt-0.5">
                {formatRupiah(minPrice)}
              </p>
              <p className="text-xs text-slate-500 font-medium">
                per {product.unit?.name} ({product.unit?.symbol})
              </p>
            </div>
          </div>
        </Card>

        {/* Stok Saat Ini */}
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100/50">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-900 text-white shadow-md">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {hasVariants ? 'Total Stok Semua Varian' : 'Stok Tersedia'}
              </p>
              <div className="mt-1">
                <StockBadge
                  stock={totalStock}
                  minimumStock={product.minimum_stock}
                  unitSymbol={product.unit?.symbol || ''}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {hasVariants
                  ? `${variants.length} pilihan varian terdaftar`
                  : `Min. Stok: ${product.minimum_stock} ${product.unit?.symbol}`}
              </p>
            </div>
          </div>
        </Card>

        {/* Barcode & Kategori */}
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100/50">
          <div className="space-y-2">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Kategori
              </p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">
                {product.category?.name || '-'}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200/60">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Tipe Produk
              </p>
              <p className="text-xs font-bold text-slate-700 mt-0.5">
                {hasVariants ? 'Produk Bervarian (Multi-Pilihan)' : 'Produk Tunggal (Standar)'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Jika Produk Memiliki Varian: Tabel Varian */}
      {hasVariants && (
        <Card
          title={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-red-600" />
                <span>Daftar Varian Produk ({variants.length})</span>
              </div>
              <Button
                size="sm"
                variant="primary"
                icon={Plus}
                onClick={() => {
                  setSelectedVariant(null);
                  setIsVariantModalOpen(true);
                }}
              >
                + Tambah Varian
              </Button>
            </div>
          }
          bodyClassName="p-0 overflow-hidden"
        >
          {variants.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="Belum Ada Varian"
              description="Tambahkan varian pertama untuk produk ini."
              actionLabel="Tambah Varian"
              onAction={() => {
                setSelectedVariant(null);
                setIsVariantModalOpen(true);
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Nama Varian & Kode</th>
                    <th className="px-4 py-3.5">Barcode</th>
                    <th className="px-4 py-3.5 text-right">Harga Jual</th>
                    <th className="px-4 py-3.5 text-center">Stok</th>
                    <th className="px-4 py-3.5 text-center">Min. Stok</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {variants.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900">{v.variant_name}</p>
                        <span className="font-mono text-xs text-slate-500 font-semibold">
                          {v.code}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs font-mono text-slate-600">
                        {v.barcode ? (
                          <span className="flex items-center gap-1">
                            <Barcode className="w-3.5 h-3.5 text-slate-400" />
                            {v.barcode}
                          </span>
                        ) : (
                          <span className="italic text-slate-400">Tanpa barcode</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right font-extrabold text-slate-900 font-mono">
                        {formatRupiah(v.selling_price)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <StockBadge
                          stock={v.stock}
                          minimumStock={v.minimum_stock}
                          unitSymbol={v.unit?.symbol || product.unit?.symbol || ''}
                        />
                      </td>
                      <td className="px-4 py-4 text-center text-xs text-slate-600 font-mono">
                        {v.minimum_stock}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <StatusBadge status={v.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setHistoryModalVariant(v);
                              setIsHistoryModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                            title="Lihat Riwayat Harga Varian"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedVariant(v);
                              setIsVariantModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                            title="Edit Varian"
                          >
                            <Edit2 className="w-4 h-4" />
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
      )}

      {/* Tabel Riwayat Perubahan Harga (Hanya untuk produk non-varian) */}
      {!hasVariants && (
        <Card
          title="Riwayat Perubahan Harga Jual"
          subtitle="Log pencatatan otomatis database saat terjadi perubahan harga jual produk"
          action={
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
              <History className="w-3.5 h-3.5" />
              <span>{priceHistory.length} Riwayat Tercatat</span>
            </div>
          }
          bodyClassName="p-0 overflow-hidden"
        >
          {isLoadingHistory ? (
            <div className="py-12 text-center">
              <LoadingSpinner size="md" message="Memuat riwayat harga..." />
            </div>
          ) : priceHistory.length === 0 ? (
            <EmptyState
              icon={History}
              title="Belum Ada Riwayat Perubahan Harga"
              description="Perubahan harga jual produk ini akan otomatis dicatat oleh sistem di tabel ini."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Tanggal Perubahan</th>
                    <th className="px-6 py-3.5 text-right">Harga Lama</th>
                    <th className="px-6 py-3.5 text-right">Harga Baru</th>
                    <th className="px-6 py-3.5 text-right">Perubahan</th>
                    <th className="px-6 py-3.5 text-left">Diubah Oleh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {priceHistory.map((item) => {
                    const oldP = Number(item.old_price) || 0;
                    const newP = Number(item.new_price) || 0;
                    const diff = newP - oldP;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 text-slate-700 text-xs flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatTanggal(item.changed_at)}</span>
                        </td>

                        <td className="px-6 py-4 text-right text-slate-500 font-mono text-xs">
                          {item.old_price ? formatRupiah(item.old_price) : '-'}
                        </td>

                        <td className="px-6 py-4 text-right font-bold text-slate-900 font-mono text-xs">
                          {formatRupiah(item.new_price)}
                        </td>

                        <td className="px-6 py-4 text-right font-mono text-xs">
                          {item.old_price ? (
                            <span
                              className={`font-semibold ${
                                diff > 0
                                  ? 'text-emerald-600'
                                  : diff < 0
                                  ? 'text-red-600'
                                  : 'text-slate-500'
                              }`}
                            >
                              {diff > 0 ? `+${formatRupiah(diff)}` : formatRupiah(diff)}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Harga Awal</span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-slate-600 text-xs">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.changer?.full_name || 'Pemilik'}</span>
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
      )}

      {/* Modal Edit / Tambah Varian */}
      <EditVariantModal
        isOpen={isVariantModalOpen}
        onClose={() => {
          setIsVariantModalOpen(false);
          setSelectedVariant(null);
        }}
        productId={product.id}
        variant={selectedVariant}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['products', id] });
          setToast({
            isOpen: true,
            message: selectedVariant
              ? 'Varian berhasil diperbarui.'
              : 'Varian baru berhasil ditambahkan.',
            type: 'success',
          });
        }}
      />

      {/* Modal Riwayat Harga Varian */}
      <VariantPriceHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setHistoryModalVariant(null);
        }}
        variant={historyModalVariant}
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

export default ProductDetailPage;
