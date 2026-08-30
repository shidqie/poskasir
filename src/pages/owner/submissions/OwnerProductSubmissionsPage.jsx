import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productSubmissionService } from '@/services/productSubmissionService';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Toast } from '@/components/common/Toast';
import { Pagination } from '@/components/common/Pagination';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { SubmissionStatusBadge } from '@/components/submissions/SubmissionStatusBadge';
import { ApprovalModal } from '@/components/submissions/ApprovalModal';
import { RejectionModal } from '@/components/submissions/RejectionModal';
import { SubmissionDetailModal } from '@/components/submissions/SubmissionDetailModal';
import { EditSubmissionModal } from '@/components/submissions/EditSubmissionModal';
import {
  Inbox,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Check,
  Eye,
  Pencil,
  Barcode,
  Layers,
  Package,
  Trash2,
  CheckSquare,
  Square,
  AlertTriangle,
} from 'lucide-react';
import { formatRupiah, formatTanggalWaktu } from '@/utils/formatters';

const TABS = [
  { id: 'pending', label: 'Menunggu Persetujuan', icon: Clock },
  { id: 'approved', label: 'Disetujui (Terdaftar)', icon: CheckCircle2 },
  { id: 'rejected', label: 'Ditolak', icon: XCircle },
];

export function OwnerProductSubmissionsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleteConfirmState, setDeleteConfirmState] = useState({
    isOpen: false,
    isBulk: false,
    item: null,
  });

  // Modals state
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [isRejectionOpen, setIsRejectionOpen] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' });

  // Query submissions based on tab and search
  const { data: submissions = [], isLoading, refetch } = useQuery({
    queryKey: ['product-submissions', { status: activeTab, search }],
    queryFn: () => productSubmissionService.getSubmissions({ status: activeTab, search }),
  });

  // Reset current page and selection when tab, search, or pageSize changes
  React.useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [activeTab, search, pageSize]);

  const totalPages = Math.ceil(submissions.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedSubmissions = submissions.slice(startIndex, startIndex + pageSize);

  // Query pending count for badge
  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['pending-submissions-count'],
    queryFn: () => productSubmissionService.getPendingCount(),
    refetchInterval: 10000,
  });

  // Toggle single item selection
  const handleToggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Toggle select all on current page
  const handleToggleSelectAll = () => {
    const allPageIds = paginatedSubmissions.map((s) => s.id);
    const isAllSelected = allPageIds.every((id) => selectedIds.has(id));

    const next = new Set(selectedIds);
    if (isAllSelected) {
      allPageIds.forEach((id) => next.delete(id));
    } else {
      allPageIds.forEach((id) => next.add(id));
    }
    setSelectedIds(next);
  };

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ isBulk, item }) => {
      if (isBulk) {
        await productSubmissionService.bulkDeleteSubmissions(Array.from(selectedIds));
      } else if (item) {
        await productSubmissionService.deleteSubmission(item.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['pending-submissions-count'] });
      queryClient.invalidateQueries({ queryKey: ['price-list'] });
      queryClient.invalidateQueries({ queryKey: ['my-product-submissions'] });
      setSelectedIds(new Set());
      setDeleteConfirmState({ isOpen: false, isBulk: false, item: null });
      setToast({
        isOpen: true,
        message: 'Pengajuan barang berhasil dihapus!',
        type: 'success',
      });
    },
    onError: (err) => {
      setToast({
        isOpen: true,
        message: err.message || 'Gagal menghapus pengajuan.',
        type: 'error',
      });
    },
  });

  const handleOpenDetail = (sub) => {
    setSelectedSubmission(sub);
    setIsDetailOpen(true);
  };

  const handleOpenEdit = (sub) => {
    setSelectedSubmission(sub);
    setIsEditOpen(true);
  };

  const handleOpenApprove = (sub) => {
    setSelectedSubmission(sub);
    setIsApprovalOpen(true);
  };

  const handleOpenReject = (sub) => {
    setSelectedSubmission(sub);
    setIsRejectionOpen(true);
  };

  const isAllPageSelected =
    paginatedSubmissions.length > 0 &&
    paginatedSubmissions.every((s) => selectedIds.has(s.id));

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Pengajuan Barang Baru' }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Pengajuan Barang Baru
            </h1>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                {pendingCount} Menunggu Review
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Review, ubah, setujui, atau hapus pengajuan barang baru dari kasir toko
          </p>
        </div>

        {/* Bulk Action Controls */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 animate-in fade-in">
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={Trash2}
              onClick={() =>
                setDeleteConfirmState({
                  isOpen: true,
                  isBulk: true,
                  item: null,
                })
              }
              className="text-xs font-bold text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100 rounded-xl"
            >
              Hapus {selectedIds.size} Terpilih
            </Button>
          </div>
        )}
      </div>

      {/* Search & Tabs Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tabs Switcher */}
        <div className="bg-slate-100 p-1 rounded-xl flex gap-1 text-xs font-semibold sm:w-auto overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-1.5 px-3 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.id === 'pending' && pendingCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search & Select All Bar */}
        <div className="flex items-center gap-2">
          {submissions.length > 0 && (
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="px-3 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              {isAllPageSelected ? (
                <CheckSquare size={14} className="text-slate-900" />
              ) : (
                <Square size={14} className="text-slate-400" />
              )}
              <span>Pilih Halaman</span>
            </button>
          )}

          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau barcode..."
              className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-slate-400 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Content List */}
      <div>
        {isLoading ? (
          <div className="text-center py-16">
            <LoadingSpinner size="md" message="Memuat daftar pengajuan..." />
          </div>
        ) : submissions.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={
              activeTab === 'pending'
                ? 'Tidak Ada Pengajuan Menunggu'
                : activeTab === 'approved'
                ? 'Belum Ada Pengajuan Disetujui'
                : 'Tidak Ada Pengajuan Ditolak'
            }
            description={
              activeTab === 'pending'
                ? 'Semua pengajuan barang dari kasir telah diproses dan disetujui.'
                : 'Daftar riwayat pengajuan akan tampil di sini.'
            }
          />
        ) : (
          <div className="space-y-6">
            {/* Grid Kartu Pengajuan */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedSubmissions.map((sub) => {
                const isVariant = sub.submission_type === 'new_variant' || Boolean(sub.variant_name);
                const isPending = sub.status === 'pending';
                const isSelected = selectedIds.has(sub.id);

                return (
                  <div
                    key={sub.id}
                    className={`p-4 sm:p-5 rounded-2xl border bg-white transition-all flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? 'border-slate-900 ring-2 ring-slate-900/10'
                        : 'border-slate-200/80 hover:border-slate-400 shadow-xs'
                    }`}
                  >
                    <div className="space-y-2.5">
                      {/* Header Card: Checkbox, Type & Status */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            type="button"
                            onClick={() => handleToggleSelect(sub.id)}
                            className="p-1 text-slate-400 hover:text-slate-900 cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare size={16} className="text-slate-900" />
                            ) : (
                              <Square size={16} />
                            )}
                          </button>

                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              isVariant
                                ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                                : 'bg-slate-100 text-slate-700 border border-slate-200/60'
                            }`}
                          >
                            {isVariant ? <Layers size={11} /> : <Package size={11} />}
                            <span>{isVariant ? 'Varian' : 'Produk'}</span>
                          </span>
                        </div>

                        <SubmissionStatusBadge status={sub.status} />
                      </div>

                      {/* Product Name & Variant */}
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug">
                          {sub.name}
                        </h3>

                        {sub.variant_name && (
                          <p className="text-[11px] font-semibold text-purple-700 mt-1 flex items-center gap-1">
                            <Layers size={11} />
                            <span>Varian: {sub.variant_name}</span>
                          </p>
                        )}

                        {sub.barcode && (
                          <p className="text-[11px] font-mono text-slate-400 flex items-center gap-1 mt-1">
                            <Barcode size={12} />
                            <span>{sub.barcode}</span>
                          </p>
                        )}
                      </div>

                      {/* Price & Unit (Never Cut Off) */}
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-baseline justify-between gap-2">
                        <span className="text-[11px] text-slate-500 font-medium shrink-0">
                          Harga Pengajuan
                        </span>
                        <span className="text-sm sm:text-base font-bold text-slate-900 font-mono text-right truncate">
                          {formatRupiah(sub.selling_price)}
                        </span>
                      </div>

                      {/* Metadata Submitter */}
                      <div className="text-[11px] text-slate-400 space-y-0.5 pt-1">
                        <p>
                          Diajukan oleh:{' '}
                          <strong className="text-slate-600">
                            {sub.submitter?.full_name || 'Kasir'}
                          </strong>
                        </p>
                        <p>{formatTanggalWaktu(sub.submitted_at)}</p>
                      </div>

                      {sub.rejection_reason && (
                        <p className="text-xs text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-100 font-medium">
                          Alasan Tolak: {sub.rejection_reason}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                      <Button
                        type="button"
                        variant="outline"
                        icon={Eye}
                        onClick={() => handleOpenDetail(sub)}
                        className="flex-1 py-1.5 text-xs font-semibold rounded-xl"
                      >
                        Detail
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        icon={Pencil}
                        onClick={() => handleOpenEdit(sub)}
                        className="py-1.5 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 border-slate-200 rounded-xl"
                        title="Ubah Data Pengajuan"
                      >
                        Ubah
                      </Button>

                      {isPending && (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            icon={XCircle}
                            onClick={() => handleOpenReject(sub)}
                            className="px-2 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border-rose-200 rounded-xl shrink-0"
                            title="Tolak Pengajuan"
                          />
                          <Button
                            type="button"
                            variant="primary"
                            icon={Check}
                            onClick={() => handleOpenApprove(sub)}
                            className="py-1.5 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs rounded-xl shrink-0"
                          >
                            Setujui
                          </Button>
                        </>
                      )}

                      {/* Tombol Hapus Langsung */}
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteConfirmState({
                            isOpen: true,
                            isBulk: false,
                            item: sub,
                          })
                        }
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Hapus Pengajuan Ini"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {submissions.length > 0 && (
              <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium">
                  <span>
                    Menampilkan{' '}
                    <strong className="text-slate-900 font-bold">
                      {startIndex + 1} - {Math.min(startIndex + pageSize, submissions.length)}
                    </strong>{' '}
                    dari <strong className="text-slate-900 font-bold">{submissions.length}</strong> pengajuan
                  </span>

                  <span className="text-slate-300 hidden sm:inline">|</span>

                  <div className="flex items-center gap-1.5">
                    <span>Per halaman:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-400 cursor-pointer"
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
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  className="py-0 border-t-0"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <SubmissionDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        submission={selectedSubmission}
        isOwner={true}
        onEditClick={(sub) => {
          setSelectedSubmission(sub);
          setIsEditOpen(true);
        }}
        onApproveClick={(sub) => {
          setSelectedSubmission(sub);
          setIsApprovalOpen(true);
        }}
        onRejectClick={(sub) => {
          setSelectedSubmission(sub);
          setIsRejectionOpen(true);
        }}
      />

      <EditSubmissionModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        submission={selectedSubmission}
        onSuccess={() => {
          setToast({
            isOpen: true,
            message: 'Data pengajuan barang berhasil diperbarui!',
            type: 'success',
          });
          refetch();
        }}
      />

      <ApprovalModal
        isOpen={isApprovalOpen}
        onClose={() => setIsApprovalOpen(false)}
        submission={selectedSubmission}
        onSuccess={() => {
          setToast({
            isOpen: true,
            message: 'Barang berhasil disetujui dan masuk ke Data Barang resmi!',
            type: 'success',
          });
          refetch();
        }}
      />

      <RejectionModal
        isOpen={isRejectionOpen}
        onClose={() => setIsRejectionOpen(false)}
        submission={selectedSubmission}
        onSuccess={() => {
          setToast({
            isOpen: true,
            message: 'Pengajuan barang telah ditolak.',
            type: 'success',
          });
          refetch();
        }}
      />

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        isOpen={deleteConfirmState.isOpen}
        onClose={() =>
          setDeleteConfirmState({ isOpen: false, isBulk: false, item: null })
        }
        onConfirm={() => deleteMutation.mutate(deleteConfirmState)}
        isLoading={deleteMutation.isPending}
        title={
          deleteConfirmState.isBulk
            ? `Hapus ${selectedIds.size} Pengajuan Terpilih?`
            : 'Hapus Pengajuan Barang?'
        }
        message={
          deleteConfirmState.isBulk
            ? `Apakah Anda yakin ingin menghapus ${selectedIds.size} data pengajuan barang yang dipilih secara permanen?`
            : `Pengajuan "${deleteConfirmState.item?.name || ''}" akan dihapus dari daftar pengajuan.`
        }
        confirmText="Hapus Permanen"
        type="danger"
      />

      {/* Toast */}
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
    </div>
  );
}

export default OwnerProductSubmissionsPage;
