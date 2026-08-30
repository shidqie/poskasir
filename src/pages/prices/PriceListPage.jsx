import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { priceService } from '@/services/priceService';
import { productSubmissionService } from '@/services/productSubmissionService';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Toast } from '@/components/common/Toast';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { EmptyState } from '@/components/common/EmptyState';
import { SubmissionStatusBadge } from '@/components/submissions/SubmissionStatusBadge';
import { ProductSubmissionModal } from '@/components/submissions/ProductSubmissionModal';
import { SubmissionDetailModal } from '@/components/submissions/SubmissionDetailModal';
import { ApprovalModal } from '@/components/submissions/ApprovalModal';
import { BarcodeScannerModal } from '@/components/pos/BarcodeScannerModal';
import { formatRupiah, formatTanggal, formatTanggalWaktu } from '@/utils/formatters';
import { getProductCategoryTheme, getProductDummyImage } from '@/utils/dummyImages';
import {
  Tags,
  Search,
  Plus,
  Barcode,
  Layers,
  Camera,
  X,
  Package,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  Eye,
  Send,
} from 'lucide-react';

function PriceItemCard({ item, isOwnerView, onConvert, onDetail }) {
  const [imgError, setImgError] = useState(false);
  const isRegistered = item.sourceType === 'registered' || item.status === 'approved';
  const isPending = item.status === 'pending' || item.sourceType === 'unregistered';
  const categoryName = item.categoryName || 'Sembako';
  const theme = getProductCategoryTheme(item.name, categoryName);
  const IconComponent = theme.Icon;
  const imageUrl = item.image_url || getProductDummyImage(item.name, categoryName);

  return (
    <div
      className={`p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 hover:shadow-md bg-white flex flex-col justify-between ${
        isRegistered
          ? 'border-slate-200/90 shadow-xs hover:border-red-300'
          : 'border-amber-200/90 bg-amber-50/15 shadow-xs hover:border-amber-400'
      }`}
    >
      <div>
        {/* Product Thumbnail & Overlay Badges */}
        <div
          className={`relative w-full h-24 sm:h-28 rounded-xl overflow-hidden mb-2 bg-gradient-to-br ${theme.bgGradient} flex items-center justify-center`}
        >
          {!imgError ? (
            <img
              src={imageUrl}
              alt={item.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-white drop-shadow-xs">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs mb-1">
                <IconComponent className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-black tracking-wider uppercase opacity-90">
                {theme.tag}
              </span>
            </div>
          )}

          {/* Top-Left Category Pill */}
          <div className="absolute top-1.5 left-1.5 max-w-[85px]">
            <span className="inline-block truncate px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-black/60 text-white backdrop-blur-xs shadow-xs">
              {categoryName}
            </span>
          </div>

          {/* Top-Right Status Badge */}
          <div className="absolute top-1.5 right-1.5">
            {isRegistered ? (
              <span className="inline-block px-1.5 py-0.5 rounded-md text-[9px] font-black bg-emerald-600 text-white shadow-xs">
                Terdaftar
              </span>
            ) : (
              <span className="inline-block px-1.5 py-0.5 rounded-md text-[9px] font-black bg-amber-500 text-white shadow-xs animate-pulse">
                Belum Terdaftar
              </span>
            )}
          </div>
        </div>

        {/* Nama Barang */}
        <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug line-clamp-2">
          {item.name}
        </h3>

        {/* Barcode & Kode */}
        <div className="flex flex-wrap items-center gap-1 mt-1 text-[10px] font-mono text-slate-500">
          {item.code && (
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[9px] border border-slate-200/80">
              {item.code}
            </span>
          )}
          {item.barcode && (
            <span className="flex items-center gap-0.5 text-slate-500 text-[9px] bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60 truncate max-w-[110px]">
              <Barcode className="w-2.5 h-2.5 text-slate-400" />
              {item.barcode}
            </span>
          )}
          {item.unitName && (
            <span className="text-[10px] text-slate-400 font-sans">
              /{item.unitName}
            </span>
          )}
        </div>

        {/* Pending Approval Badge Notice */}
        {isPending && (
          <div className="mt-1.5">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded border border-amber-200">
              <Clock size={10} />
              <span>Menunggu Persetujuan</span>
            </span>
          </div>
        )}
      </div>

      {/* Harga & Tombol Aksi */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[9px] text-slate-400 block uppercase font-semibold">Harga Jual</span>
          <span className="text-sm sm:text-base font-black text-red-600 font-mono">
            {formatRupiah(item.selling_price || item.price)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {isOwnerView && isPending && onConvert && (
            <Button
              type="button"
              variant="primary"
              onClick={() => onConvert(item)}
              className="py-1 px-2.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
            >
              Setujui
            </Button>
          )}

          {onDetail && (
            <button
              type="button"
              onClick={() => onDetail(item)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Lihat Detail"
            >
              <Eye size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function PriceListPage({ isOwnerView = false }) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'my_submissions'
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [initialBarcode, setInitialBarcode] = useState('');
  const [selectedItemDetail, setSelectedItemDetail] = useState(null);
  const [approvalItem, setApprovalItem] = useState(null);
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' });

  // 1. Query Semua Harga (Produk Resmi + Pengajuan Pending)
  const { data: priceItems = [], isLoading: pricesLoading } = useQuery({
    queryKey: ['price-list', { search, selectedCategory }],
    queryFn: () => priceService.getAllPrices({ search, categoryId: selectedCategory === 'all' ? '' : selectedCategory }),
  });

  // 2. Query Pengajuan Kasir ("Pengajuan Saya")
  const { data: mySubmissions = [], isLoading: mySubmissionsLoading } = useQuery({
    queryKey: ['my-product-submissions', user?.id, search],
    queryFn: () => productSubmissionService.getSubmissions({ submittedBy: isOwnerView ? null : user?.id, search }),
    enabled: activeTab === 'my_submissions',
  });

  const handleScanDetected = (barcodeText) => {
    setIsScannerOpen(false);
    setSearch(barcodeText);
  };

  const handleOpenSubmissionWithBarcode = (barcode = '') => {
    setInitialBarcode(barcode);
    setIsSubmissionModalOpen(true);
  };

  const filteredPrices = priceItems;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Daftar & Cek Harga' }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100 shrink-0">
            <Tags className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Daftar & Cek Harga
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Cek harga resmi, barang belum terdaftar & riwayat pengajuan barang baru
            </p>
          </div>
        </div>

        {/* Tombol Ajukan Barang Baru */}
        <Button
          onClick={() => handleOpenSubmissionWithBarcode('')}
          variant="primary"
          icon={Send}
          className="py-2.5 px-4 text-xs sm:text-sm font-bold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/25 rounded-xl self-start sm:self-auto cursor-pointer"
        >
          + Ajukan Barang Baru
        </Button>
      </div>

      {/* Tabs Navigation: Semua Harga vs Pengajuan Saya */}
      <div className="bg-slate-200/80 p-1 rounded-xl flex gap-1 text-xs sm:text-sm font-bold sm:w-80">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'all'
              ? 'bg-white text-red-600 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Semua Harga</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('my_submissions')}
          className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'my_submissions'
              ? 'bg-white text-red-600 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{isOwnerView ? 'Semua Pengajuan' : 'Pengajuan Saya'}</span>
        </button>
      </div>

      {/* Search & Scan Barcode Tools */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama barang atau nomor barcode..."
              className="w-full pl-10 pr-9 py-2.5 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-red-500 bg-slate-50/50 focus:bg-white transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            icon={Camera}
            onClick={() => setIsScannerOpen(true)}
            className="px-3.5 py-2.5 text-xs font-bold shrink-0 rounded-xl border-slate-200 hover:border-red-500 hover:text-red-600"
          >
            Scan Kamera
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SEMUA HARGA (PRODUK RESMI + PENGAJUAN PENDING) */}
      {/* ========================================================================= */}
      {activeTab === 'all' && (
        <div>
          {pricesLoading ? (
            <div className="text-center py-16">
              <LoadingSpinner size="md" message="Memuat daftar harga..." />
            </div>
          ) : filteredPrices.length === 0 ? (
            <EmptyState
              icon={Tags}
              title="Barang Tidak Ditemukan"
              description={`Tidak ditemukan barang dengan kata kunci "${search}". Anda dapat mengajukannya sebagai barang baru.`}
              action={
                <Button
                  onClick={() => handleOpenSubmissionWithBarcode(search)}
                  variant="primary"
                  icon={Plus}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md"
                >
                  Ajukan "{search}" Sebagai Barang Baru
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
              {filteredPrices.map((item) => (
                <PriceItemCard
                  key={item.id}
                  item={item}
                  isOwnerView={isOwnerView}
                  onConvert={(sub) => setApprovalItem(sub)}
                  onDetail={(sub) => setSelectedItemDetail(sub)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PENGAJUAN SAYA (STATUS PENGAJUAN BARANG) */}
      {/* ========================================================================= */}
      {activeTab === 'my_submissions' && (
        <div>
          {mySubmissionsLoading ? (
            <div className="text-center py-16">
              <LoadingSpinner size="md" message="Memuat riwayat pengajuan..." />
            </div>
          ) : mySubmissions.length === 0 ? (
            <EmptyState
              icon={Send}
              title="Belum Ada Pengajuan Barang"
              description="Anda belum pernah mengajukan barang baru ke Pemilik. Klik tombol di bawah untuk mengajukan."
              action={
                <Button
                  onClick={() => handleOpenSubmissionWithBarcode('')}
                  variant="primary"
                  icon={Plus}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md"
                >
                  Ajukan Barang Baru Sekarang
                </Button>
              }
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Barang / Varian</th>
                      <th className="py-3.5 px-4 text-right">Harga Jual</th>
                      <th className="py-3.5 px-4">Barcode</th>
                      <th className="py-3.5 px-4">Tanggal Pengajuan</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mySubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div>
                            <p>{sub.name}</p>
                            {sub.variant_name && (
                              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 mt-0.5 inline-block">
                                Varian: {sub.variant_name}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-black font-mono text-red-600 text-right">
                          {formatRupiah(sub.selling_price)}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-500">
                          {sub.barcode || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {formatTanggal(sub.submitted_at)}
                        </td>
                        <td className="py-3.5 px-4">
                          <SubmissionStatusBadge status={sub.status} />
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Button
                            type="button"
                            variant="outline"
                            icon={Eye}
                            onClick={() => setSelectedItemDetail(sub)}
                            className="py-1 px-2.5 text-[11px] font-bold rounded-lg"
                          >
                            Detail
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Ajukan Barang Baru */}
      <ProductSubmissionModal
        isOpen={isSubmissionModalOpen}
        onClose={() => setIsSubmissionModalOpen(false)}
        initialBarcode={initialBarcode}
        onSuccess={() => {
          setToast({
            isOpen: true,
            message: 'Pengajuan barang berhasil dikirim! Menunggu persetujuan Pemilik.',
            type: 'success',
          });
          queryClient.invalidateQueries({ queryKey: ['price-list'] });
          queryClient.invalidateQueries({ queryKey: ['my-product-submissions'] });
        }}
      />

      {/* Modal Detail Pengajuan */}
      <SubmissionDetailModal
        isOpen={Boolean(selectedItemDetail)}
        onClose={() => setSelectedItemDetail(null)}
        submission={selectedItemDetail}
        isOwner={isOwnerView}
      />

      {/* Modal Approval (Jika diakses via Owner) */}
      <ApprovalModal
        isOpen={Boolean(approvalItem)}
        onClose={() => setApprovalItem(null)}
        submission={approvalItem}
        onSuccess={() => {
          setToast({
            isOpen: true,
            message: 'Barang berhasil disetujui & resmi masuk Data Barang!',
            type: 'success',
          });
          queryClient.invalidateQueries({ queryKey: ['price-list'] });
        }}
      />

      {/* Modal Scanner Kamera */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onDetected={handleScanDetected}
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

export default PriceListPage;
