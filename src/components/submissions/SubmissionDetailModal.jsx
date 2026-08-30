import React from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { SubmissionStatusBadge } from './SubmissionStatusBadge';
import { formatRupiah, formatTanggalWaktu } from '@/utils/formatters';
import {
  Package,
  Barcode,
  Clock,
  User,
  Layers,
  Check,
  XCircle,
  FileText,
  AlertCircle,
  Tag,
} from 'lucide-react';

export function SubmissionDetailModal({
  isOpen,
  onClose,
  submission,
  isOwner = false,
  onApproveClick,
  onRejectClick,
}) {
  if (!submission) return null;

  const isPending = submission.status === 'pending';
  const isApproved = submission.status === 'approved';
  const isRejected = submission.status === 'rejected';
  const isVariant = submission.submission_type === 'new_variant';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-lg"
      title="Rincian Pengajuan Barang"
      subtitle={`ID: #${submission.id?.slice(0, 8)} • Diajukan ${formatTanggalWaktu(submission.submitted_at)}`}
    >
      <div className="space-y-4">
        {/* Status Banner */}
        <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Status Pengajuan:
          </span>
          <SubmissionStatusBadge status={submission.status} showUnregisteredLabel={isPending} />
        </div>

        {/* Info Grid */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3 text-xs">
          <div className="flex justify-between items-start pb-2.5 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Nama Barang</span>
            <span className="font-bold text-slate-900 text-right max-w-[240px]">
              {submission.name}
            </span>
          </div>

          {isVariant && (
            <div className="flex justify-between items-start pb-2.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Nama Varian</span>
              <span className="font-bold text-slate-900 text-right">
                {submission.variant_name || '—'}
              </span>
            </div>
          )}

          {isVariant && submission.parent_product && (
            <div className="flex justify-between items-start pb-2.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Produk Induk</span>
              <span className="font-bold text-red-600 text-right">
                {submission.parent_product.name} ({submission.parent_product.code})
              </span>
            </div>
          )}

          <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Harga Jual</span>
            <span className="font-black text-red-600 font-mono text-sm">
              {formatRupiah(submission.selling_price)}
            </span>
          </div>

          <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Barcode / SKU</span>
            <span className="font-mono font-bold text-slate-700">
              {submission.barcode || '— (Tidak Ada)'}
            </span>
          </div>

          <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Satuan</span>
            <span className="font-bold text-slate-800">
              {submission.unit ? `${submission.unit.name} (${submission.unit.symbol})` : '—'}
            </span>
          </div>

          <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Diajukan Oleh</span>
            <span className="font-bold text-slate-800">
              {submission.submitter?.full_name || 'Kasir'}
            </span>
          </div>

          {submission.notes && (
            <div className="pt-1">
              <span className="text-slate-400 font-bold block mb-1">Catatan Pengaju:</span>
              <p className="p-2.5 bg-slate-50 rounded-xl text-slate-700 font-medium border border-slate-100">
                {submission.notes}
              </p>
            </div>
          )}
        </div>

        {/* Rejection Reason Card */}
        {isRejected && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-rose-800 font-bold">
              <AlertCircle size={15} />
              <span>Alasan Penolakan Pemilik:</span>
            </div>
            <p className="text-rose-900 font-medium leading-relaxed bg-white/70 p-2.5 rounded-xl border border-rose-100">
              {submission.rejection_reason || 'Tidak ada keterangan spesifik.'}
            </p>
            {submission.reviewed_at && (
              <p className="text-[10px] text-rose-600 mt-1">
                Ditolak pada {formatTanggalWaktu(submission.reviewed_at)} oleh{' '}
                {submission.reviewer?.full_name || 'Pemilik'}
              </p>
            )}
          </div>
        )}

        {/* Approved Card */}
        {isApproved && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
              <Check size={15} />
              <span>Barang Resmi Terdaftar di Data Barang:</span>
            </div>
            <p className="text-emerald-900 font-medium">
              Barang ini telah disetujui pada {formatTanggalWaktu(submission.reviewed_at)} dan aktif untuk transaksi kasir.
            </p>
          </div>
        )}

        {/* Owner Action Buttons (If pending and isOwner) */}
        {isOwner && isPending && (
          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              icon={XCircle}
              onClick={() => {
                onClose();
                if (onRejectClick) onRejectClick(submission);
              }}
              className="py-3 text-xs font-bold text-rose-600 hover:bg-rose-50 border-rose-200 rounded-xl"
            >
              Tolak Pengajuan
            </Button>
            <Button
              type="button"
              variant="primary"
              icon={Check}
              onClick={() => {
                onClose();
                if (onApproveClick) onApproveClick(submission);
              }}
              className="py-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 rounded-xl"
            >
              Setujui & Daftarkan
            </Button>
          </div>
        )}

        {!isOwner && (
          <div className="pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full py-2.5 text-xs font-bold rounded-xl"
            >
              Tutup
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default SubmissionDetailModal;
