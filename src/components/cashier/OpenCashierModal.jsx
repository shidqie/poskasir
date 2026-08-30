import React, { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useCashierSessionStore } from '@/stores/cashierSessionStore';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Toast } from '@/components/common/Toast';
import { DoorOpen, Coins, Clock, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatRupiah, formatTanggal, formatWaktu } from '@/utils/formatters';

const parseRaw = (v) => {
  const n = Number(String(v).replace(/\D/g, ''));
  return isNaN(n) ? 0 : n;
};

const INITIAL_CASH_PRESETS = [50000, 100000, 200000, 300000, 500000];

export function OpenCashierModal({ isOpen, onClose, onSuccess }) {
  const { profile } = useAuthStore();
  const { openSession, isLoading } = useCashierSessionStore();

  const [openingCashInput, setOpeningCashInput] = useState('200000');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const now = new Date();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const initialCash = parseRaw(openingCashInput);
    if (initialCash < 0) {
      setErrorMsg('Saldo awal tunai tidak boleh bernilai negatif.');
      return;
    }

    try {
      const session = await openSession({
        opening_cash: initialCash,
        notes,
      });
      if (onSuccess) onSuccess(session);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal membuka sesi kasir.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-md"
      title="Buka Sesi Kasir Baru"
      subtitle="Masukkan saldo awal tunai fisik di laci kasir untuk uang kembalian"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Info Kasir & Jam Buka */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Nama Kasir:
            </span>
            <span className="font-bold text-slate-900">{profile?.full_name || 'Kasir'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Waktu Buka:
            </span>
            <span className="font-bold text-slate-900">
              {formatTanggal(now)} &bull; {formatWaktu(now)} WIB
            </span>
          </div>
        </div>

        {/* Input Saldo Awal Tunai */}
        <div>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
            Saldo Awal Tunai (Rp) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
              Rp
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={
                openingCashInput
                  ? Number(openingCashInput.replace(/\D/g, '')).toLocaleString('id-ID')
                  : ''
              }
              onChange={(e) => setOpeningCashInput(e.target.value.replace(/\D/g, ''))}
              placeholder="0"
              className="w-full pl-11 pr-4 py-3.5 border-2 border-slate-200 rounded-xl text-right text-xl font-black outline-none focus:border-red-500 transition-colors font-mono"
              autoFocus
            />
          </div>
        </div>

        {/* Preset Chips Saldo Awal */}
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Pilihan Cepat Saldo Awal:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {INITIAL_CASH_PRESETS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setOpeningCashInput(String(amt))}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  parseRaw(openingCashInput) === amt
                    ? 'bg-red-600 text-white border-red-600 shadow-xs shadow-red-500/25'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-red-50 hover:text-red-700'
                }`}
              >
                {formatRupiah(amt)}
              </button>
            ))}
          </div>
        </div>

        {/* Catatan Sesi */}
        <div>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
            Catatan Awal Sesi (opsional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: Pecahan 2rb ada 25 lembar, 5rb ada 10 lembar..."
            rows={2}
            className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-red-500 resize-none"
          />
        </div>

        {/* Error Feedback */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-medium">
            <AlertCircle size={16} className="shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="py-3 text-xs font-bold rounded-xl"
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={DoorOpen}
            isLoading={isLoading}
            disabled={isLoading}
            className="py-3 text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/25 rounded-xl"
          >
            Buka Kasir
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default OpenCashierModal;
