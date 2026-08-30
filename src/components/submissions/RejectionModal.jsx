import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productSubmissionService } from '@/services/productSubmissionService';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { XCircle, AlertCircle } from 'lucide-react';

const COMMON_REJECTION_REASONS = [
  'Barang sudah terdaftar dengan nama atau kode lain.',
  'Harga jual tidak sesuai dengan kebijakan toko.',
  'Barcode duplikat atau salah ketik.',
  'Informasi barang belum lengkap atau tidak jelas.',
  'Barang tidak dijual di toko ini.',
];

export function RejectionModal({ isOpen, onClose, submission, onSuccess }) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const rejectMutation = useMutation({
    mutationFn: () =>
      productSubmissionService.rejectSubmission({
        submission_id: submission.id,
        rejection_reason: reason,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['product-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['pending-submissions-count'] });
      queryClient.invalidateQueries({ queryKey: ['price-list'] });
      if (onSuccess) onSuccess(data);
      onClose();
      setReason('');
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Gagal menolak pengajuan barang.');
    },
  });

  const handleReject = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMsg('Alasan penolakan wajib diisi agar kasir memahami alasannya.');
      return;
    }
    rejectMutation.mutate();
  };

  if (!submission) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-md"
      title="Tolak Pengajuan Barang"
      subtitle="Berikan alasan penolakan yang jelas agar kasir dapat memperbaikinya"
    >
      <form onSubmit={handleReject} className="space-y-4">
        {/* Info Barang */}
        <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl text-xs space-y-1">
          <p className="font-bold text-rose-900">
            {submission.name} {submission.variant_name ? `(${submission.variant_name})` : ''}
          </p>
          <p className="text-slate-500">
            Diajukan oleh: <strong>{submission.submitter?.full_name || 'Kasir'}</strong>
          </p>
        </div>

        {/* Preset Alasan Cepat */}
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Pilihan Alasan Cepat:
          </span>
          <div className="space-y-1.5">
            {COMMON_REJECTION_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={`w-full text-left p-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  reason === r
                    ? 'bg-rose-50 text-rose-800 border-rose-300 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Input Alasan */}
        <div>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
            Alasan Penolakan <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Tuliskan alasan penolakan secara spesifik..."
            rows={3}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-rose-500 resize-none"
            required
          />
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="py-2.5 text-xs font-bold rounded-xl"
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={XCircle}
            isLoading={rejectMutation.isPending}
            disabled={rejectMutation.isPending}
            className="py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/25 rounded-xl"
          >
            Tolak Pengajuan
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default RejectionModal;
