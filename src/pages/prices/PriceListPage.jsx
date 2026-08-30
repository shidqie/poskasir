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
import { Pagination } from '@/components/common/Pagination';
import { SubmissionStatusBadge } from '@/components/submissions/SubmissionStatusBadge';
import { ProductSubmissionModal } from '@/components/submissions/ProductSubmissionModal';
import { SubmissionDetailModal } from '@/components/submissions/SubmissionDetailModal';
import { ApprovalModal } from '@/components/submissions/ApprovalModal';
import { BarcodeScannerModal } from '@/components/pos/BarcodeScannerModal';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
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
  const dummyTheme = getProductCategoryTheme(categoryName);
  const dummyImgUrl = getProductDummyImage(categoryName);

  return (
    <div
      className={`rounded-2xl border bg-white overflow-hidden transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
        isRegistered
          ? 'border-slate-200/90 hover:border-red-200'
          : 'border-amber-200/90 bg-amber-50/10 hover:border-amber-400'
      }`}
    >
      {/* Product Image / Icon Banner */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-100 flex items-center justify-center">
        {item.image_url && !imgError ? (
          <img
            src={item.image_url}
            alt={item.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center p-3 text-center"
            style={{
              background: `linear-gradient(135deg, ${dummyTheme.bg} 0%, #1e293b 100%)`,
              color: '#ffffff',
            }}
          >
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center mb-1.5 border border-white/20">
              <Package size={18} className="text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-white/90 truncate max-w-full px-2">
              {categoryName}
            </span>
          </div>
        )}

        {/* Status Badge Over Image */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          <span
            className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
              isRegistered
                ? 'bg-slate-900/80 text-white backdrop-blur-xs'
                : 'bg-amber-500 text-white shadow-xs'
            }`}
          >
            {categoryName}
          </span>

          {!isRegistered && (
            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 shadow-xs">
              Belum Terdaftar
            </span>
          )}
        </div>
      </div>

      {/* Product Information */}
      <div className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between space-y-2.5">
        <div>
          <div className="flex items-start justify-between gap-1">
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug line-clamp-2">
              {item.name}
            </h3>
          </div>

          {item.variantName && (
            <p className="text-[11px] font-semibold text-purple-700 mt-0.5 flex items-center gap-1">
              <Layers size={11} />
              <span>Varian: {item.variantName}</span>
            </p>
          )}

          {item.barcode && (
            <p className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-1">
              <Barcode size={11} />
              <span>{item.barcode}</span>
            </p>
          )}
        </div>

        {/* Status Pengajuan jika Pending */}
        {isPending && (
          <div className="text-[10px] text-amber-800 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200/80 font-medium flex items-center gap-1">
            <Clock size={11} className="shrink-0 text-amber-600" />
            <span>Menunggu Persetujuan</span>
          </div>
        )}

        {/* Price Tag & Action */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-medium text-slate-400 block uppercase tracking-wider">
              Harga Jual
            </span>
            <span className="text-xs sm:text-sm font-black text-red-600 font-mono tracking-tight">
              {formatRupiah(item.selling_price)}
            </span>
          </div>

          {isOwnerView && isPending && onConvert && (
            <Button
              type="button"
              variant="primary"
              onClick={() => onConvert(item.rawSubmission)}
              className="py-1 px-2.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
            >
              Setujui
            </Button>
          )}

          {onDetail && (
            <button
              type="button"
              onClick={() => onDetail(item)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [initialBarcode, setInitialBarcode] = useState('');
  const [selectedItemDetail, setSelectedItemDetail] = useState(null);
  const [approvalItem, setApprovalItem] = useState(null);
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' });

  // Reset page when tab, search, or pageSize changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search, selectedCategory, pageSize]);

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
    setToast({
      isOpen: true,
      message: `Mencari barang barcode: ${barcodeText}`,
      type: 'info',
    });
  };

  // Hardware USB Scanner listener untuk halaman Cek Harga
  useBarcodeScanner((barcode) => {
    handleScanDetected(barcode);
  });

  const handleOpenSubmissionWithBarcode = (barcode = '') => {
    setInitialBarcode(barcode);
    setIsSubmissionModalOpen(true);
  };

  const filteredPrices = priceItems;

  // Pagination for Tab 1 (Semua Harga)
  const totalPagesPrices = Math.ceil(filteredPrices.length / pageSize) || 1;
  const startPriceIdx = (currentPage - 1) * pageSize;
  const paginatedPrices = filteredPrices.slice(startPriceIdx, startPriceIdx + pageSize);

  // Pagination for Tab 2 (Pengajuan Saya)
  const totalPagesSubmissions = Math.ceil(mySubmissions.length / pageSize) || 1;
  const startSubIdx = (currentPage - 1) * pageSize;
  const paginatedSubmissions = mySubmissions.slice(startSubIdx, startSubIdx + pageSize);

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
        <div className="space-y-6">
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
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md cursor-pointer"
                >
                  Ajukan "{search}" Sebagai Barang Baru
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
                {paginatedPrices.map((item) => (
                  <PriceItemCard
                    key={item.id}
                    item={item}
                    isOwnerView={isOwnerView}
                    onConvert={(sub) => setApprovalItem(sub)}
                    onDetail={(sub) => setSelectedItemDetail(sub)}
                  />
                ))}
              </div>

              {/* Pagination Controls Tab 1 */}
              {filteredPrices.length > 0 && (
                <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium">
                    <span>
                      Menampilkan{' '}
                      <strong className="text-slate-900 font-bold">
                        {startPriceIdx + 1} - {Math.min(startPriceIdx + pageSize, filteredPrices.length)}
                      </strong>{' '}
                      dari <strong className="text-slate-900 font-bold">{filteredPrices.length}</strong> barang
                    </span>

                    <span className="text-slate-300 hidden sm:inline">|</span>

                    <div className="flex items-center gap-1.5">
                      <span>Per halaman:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-red-500 cursor-pointer"
                      >
                        <option value={12}>12</option>
                        <option value={24}>24</option>
                        <option value={48}>48</option>
                        <option value={96}>96</option>
                      </select>
                    </div>
                  </div>

                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPagesPrices}
                    onPageChange={setCurrentPage}
                    className="py-0 border-t-0"
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PENGAJUAN SAYA (STATUS PENGAJUAN BARANG) */}
      {/* ========================================================================= */}
      {activeTab === 'my_submissions' && (
        <div className="space-y-6">
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
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md cursor-pointer"
                >
                  Ajukan Barang Baru Sekarang
                </Button>
              }
            />
          ) : (
            <>
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
                      {paginatedSubmissions.map((sub) => (
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

              {/* Pagination Controls Tab 2 */}
              {mySubmissions.length > 0 && (
                <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium">
                    <span>
                      Menampilkan{' '}
                      <strong className="text-slate-900 font-bold">
                        {startSubIdx + 1} - {Math.min(startSubIdx + pageSize, mySubmissions.length)}
                      </strong>{' '}
                      dari <strong className="text-slate-900 font-bold">{mySubmissions.length}</strong> pengajuan
                    </span>

                    <span className="text-slate-300 hidden sm:inline">|</span>

                    <div className="flex items-center gap-1.5">
                      <span>Per halaman:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-red-500 cursor-pointer"
                      >
                        <option value={12}>12</option>
                        <option value={24}>24</option>
                        <option value={48}>48</option>
                        <option value={96}>96</option>
                      </select>
                    </div>
                  </div>

                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPagesSubmissions}
                    onPageChange={setCurrentPage}
                    className="py-0 border-t-0"
                  />
                </div>
              )}
            </>
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
        onScanSuccess={handleScanDetected}
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
