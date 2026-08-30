import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productSubmissionService } from '@/services/productSubmissionService';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Toast } from '@/components/common/Toast';
import { SubmissionStatusBadge } from '@/components/submissions/SubmissionStatusBadge';
import { ApprovalModal } from '@/components/submissions/ApprovalModal';
import { RejectionModal } from '@/components/submissions/RejectionModal';
import { SubmissionDetailModal } from '@/components/submissions/SubmissionDetailModal';
import {
  Inbox,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Check,
  Eye,
  Barcode,
  Layers,
  Package,
} from 'lucide-react';
import { formatRupiah, formatTanggalWaktu } from '@/utils/formatters';

const TABS = [
  { id: 'pending', label: 'Menunggu Persetujuan', icon: Clock },
  { id: 'approved', label: 'Disetujui (Terdaftar)', icon: CheckCircle2 },
  { id: 'rejected', label: 'Ditolak', icon: XCircle },
];

export function OwnerProductSubmissionsPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [search, setSearch] = useState('');

  // Modals state
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [isRejectionOpen, setIsRejectionOpen] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' });

  // Query submissions based on tab and search
  const { data: submissions = [], isLoading, refetch } = useQuery({
    queryKey: ['product-submissions', { status: activeTab, search }],
    queryFn: () => productSubmissionService.getSubmissions({ status: activeTab, search }),
  });

  // Query pending count for badge
  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['pending-submissions-count'],
    queryFn: () => productSubmissionService.getPendingCount(),
    refetchInterval: 10000,
  });

  const handleOpenDetail = (sub) => {
    setSelectedSubmission(sub);
    setIsDetailOpen(true);
  };

  const handleOpenApprove = (sub) => {
    setSelectedSubmission(sub);
    setIsApprovalOpen(true);
  };

  const handleOpenReject = (sub) => {
    setSelectedSubmission(sub);
    setIsRejectionOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Pengajuan Barang Baru' }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100 shrink-0">
            <Inbox className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Pengajuan Barang Baru
              </h1>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                  {pendingCount} Menunggu Review
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Review dan setujui pengajuan barang baru dari kasir toko sebelum masuk ke Data Barang resmi
            </p>
          </div>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tabs Switcher */}
        <div className="bg-slate-200/80 p-1 rounded-xl flex gap-1 text-xs font-bold sm:w-auto overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-3 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-red-600 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.id === 'pending' && pendingCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-black">
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Box */}
        <div className="relative sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau barcode..."
            className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-red-500 bg-white"
          />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {submissions.map((sub) => {
              const isVariant = sub.submission_type === 'new_variant';
              const isPending = sub.status === 'pending';

              return (
                <div
                  key={sub.id}
                  className="p-4 sm:p-5 rounded-2xl border bg-white border-slate-200/90 hover:border-red-200 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    {/* Header Card: Type & Status */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          isVariant
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {isVariant ? <Layers size={11} /> : <Package size={11} />}
                        <span>{isVariant ? 'Varian Baru' : 'Produk Baru'}</span>
                      </span>

                      <SubmissionStatusBadge status={sub.status} />
                    </div>

                    {/* Product Name */}
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug">
                        {isVariant && sub.parent_product
                          ? `${sub.parent_product.name} — ${sub.variant_name || sub.name}`
                          : sub.name}
                      </h3>
                      {sub.barcode && (
                        <p className="text-[11px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                          <Barcode size={12} />
                          <span>{sub.barcode}</span>
                        </p>
                      )}
                    </div>

                    {/* Price & Unit */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">Harga Pengajuan:</span>
                      <span className="text-base font-black text-red-600 font-mono">
                        {formatRupiah(sub.selling_price)}
                      </span>
                    </div>

                    {/* Metadata Submitter */}
                    <div className="text-[11px] text-slate-400 space-y-0.5 pt-1">
                      <p>
                        Diajukan oleh: <strong className="text-slate-600">{sub.submitter?.full_name || 'Kasir'}</strong>
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
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      icon={Eye}
                      onClick={() => handleOpenDetail(sub)}
                      className="flex-1 py-2 text-xs font-bold rounded-xl"
                    >
                      Detail
                    </Button>

                    {isPending && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          icon={XCircle}
                          onClick={() => handleOpenReject(sub)}
                          className="px-2.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 border-rose-200 rounded-xl"
                          title="Tolak Pengajuan"
                        />
                        <Button
                          type="button"
                          variant="primary"
                          icon={Check}
                          onClick={() => handleOpenApprove(sub)}
                          className="py-2 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs rounded-xl"
                        >
                          Setujui
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <SubmissionDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        submission={selectedSubmission}
        isOwner={true}
        onApproveClick={(sub) => {
          setSelectedSubmission(sub);
          setIsApprovalOpen(true);
        }}
        onRejectClick={(sub) => {
          setSelectedSubmission(sub);
          setIsRejectionOpen(true);
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
