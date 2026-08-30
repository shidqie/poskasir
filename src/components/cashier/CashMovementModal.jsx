import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cashMovementService } from '@/services/cashMovementService';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { formatRupiah } from '@/utils/formatters';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
  User,
  Tag,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';

const CASH_OUT_CATEGORIES = [
  'Pengambilan Pemilik',
  'Belanja Kebutuhan Toko',
  'Setor / Pindah Uang',
  'Operasional',
  'Lainnya',
];

const CASH_IN_CATEGORIES = [
  'Tambahan Uang Kembalian',
  'Setoran Tambahan Modal',
  'Pengembalian Belanja Toko',
  'Lainnya',
];

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000];

const PERSON_PRESETS = ['Pemilik', 'Kasir 01', 'Karyawan Toko'];

const parseRaw = (v) => {
  const n = Number(String(v).replace(/\D/g, ''));
  return isNaN(n) ? 0 : n;
};

export function CashMovementModal({
  isOpen,
  onClose,
  sessionId,
  currentAvailableCash = 0,
  defaultType = 'cash_out', // 'cash_out' | 'cash_in'
  onSuccess,
}) {
  const queryClient = useQueryClient();
  const [movementType, setMovementType] = useState(defaultType);
  const [amountInput, setAmountInput] = useState('');
  const [category, setCategory] = useState(
    defaultType === 'cash_out' ? CASH_OUT_CATEGORIES[0] : CASH_IN_CATEGORIES[0]
  );
  const [personName, setPersonName] = useState('Pemilik');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const isCashOut = movementType === 'cash_out';
  const numericAmount = parseRaw(amountInput);
  const isOverWithdrawal = isCashOut && numericAmount > currentAvailableCash;

  useEffect(() => {
    if (isOpen) {
      setMovementType(defaultType);
      setAmountInput('');
      setCategory(defaultType === 'cash_out' ? CASH_OUT_CATEGORIES[0] : CASH_IN_CATEGORIES[0]);
      setPersonName('Pemilik');
      setNotes('');
      setErrorMsg('');
    }
  }, [isOpen, defaultType]);

  const handleTypeSwitch = (type) => {
    setMovementType(type);
    setCategory(type === 'cash_out' ? CASH_OUT_CATEGORIES[0] : CASH_IN_CATEGORIES[0]);
    setErrorMsg('');
  };

  const recordMutation = useMutation({
    mutationFn: () => {
      if (!numericAmount || numericAmount <= 0) {
        throw new Error('Nominal uang harus lebih dari Rp 0.');
      }
      if (isOverWithdrawal) {
        throw new Error(
          `Nominal pengambilan (${formatRupiah(numericAmount)}) melebihi saldo tunai fisik yang tersedia (${formatRupiah(currentAvailableCash)}).`
        );
      }
      if (!personName.trim()) {
        throw new Error('Nama yang mengambil/menyetor uang wajib diisi.');
      }
      if (!category) {
        throw new Error('Keperluan kategori wajib dipilih.');
      }

      return cashMovementService.recordCashMovement({
        cashier_session_id: sessionId,
        movement_type: movementType,
        amount: numericAmount,
        category,
        person_name: personName.trim(),
        notes,
      });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['active-cashier-session'] });
      queryClient.invalidateQueries({ queryKey: ['session-cash-movements'] });
      queryClient.invalidateQueries({ queryKey: ['all-cash-movements'] });
      if (onSuccess) onSuccess(res);
      onClose();
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Gagal mencatat pergerakan kas.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isOverWithdrawal) {
      setErrorMsg(
        `Nominal pengambilan (${formatRupiah(numericAmount)}) melebihi saldo tunai yang tersedia (${formatRupiah(currentAvailableCash)}).`
      );
      return;
    }
    recordMutation.mutate();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div
            className={`p-2 rounded-xl ${
              isCashOut ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            {isCashOut ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isCashOut ? 'Ambil Uang dari Kas (Kas Keluar)' : 'Tambah Kas Masuk'}
            </h3>
            <p className="text-xs text-slate-400 font-normal">
              {isCashOut
                ? 'Catat pengambilan uang fisik laci kasir'
                : 'Catat tambahan uang tunai masuk ke laci'}
            </p>
          </div>
        </div>
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Toggle Buttons */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => handleTypeSwitch('cash_out')}
            className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isCashOut
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpRight size={14} />
            <span>− Ambil Uang (Kas Keluar)</span>
          </button>

          <button
            type="button"
            onClick={() => handleTypeSwitch('cash_in')}
            className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              !isCashOut
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownLeft size={14} />
            <span>+ Kas Masuk</span>
          </button>
        </div>

        {/* Saldo Fisik Laci Saat Ini Card */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Saldo Tunai Fisik Laci Saat Ini:</span>
            <span className="font-black text-slate-900 font-mono text-sm">
              {formatRupiah(currentAvailableCash)}
            </span>
          </div>
          {isCashOut && (
            <p className="text-[10px] text-slate-400">
              *Pengambilan uang tidak boleh melebihi saldo fisik yang ada di laci kasir.
            </p>
          )}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Input Nominal */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-700">
              Nominal Uang (Rp) <span className="text-red-500">*</span>
            </label>
            {isCashOut && currentAvailableCash > 0 && (
              <button
                type="button"
                onClick={() => {
                  setAmountInput(String(currentAvailableCash));
                  setErrorMsg('');
                }}
                className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
              >
                Ambil Semua Saldo ({formatRupiah(currentAvailableCash)})
              </button>
            )}
          </div>

          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
              Rp
            </span>
            <input
              type="text"
              required
              autoFocus
              value={amountInput ? formatRupiah(numericAmount).replace('Rp ', '') : ''}
              onChange={(e) => {
                setAmountInput(e.target.value.replace(/\D/g, ''));
                setErrorMsg('');
              }}
              placeholder="0"
              className={`w-full pl-10 pr-4 py-3 rounded-2xl font-black font-mono text-lg outline-none focus:ring-2 border bg-slate-50 ${
                isOverWithdrawal
                  ? 'border-rose-500 text-rose-700 focus:ring-rose-500'
                  : 'border-slate-200 text-slate-900 focus:ring-red-500 focus:bg-white'
              }`}
            />
          </div>

          {isOverWithdrawal && (
            <p className="text-[11px] font-bold text-rose-600">
              * Nominal pengambilan melebihi saldo tunai fisik yang tersedia di laci.
            </p>
          )}

          {/* Quick Preset Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {QUICK_AMOUNTS.filter((a) => !isCashOut || a <= currentAvailableCash).map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => {
                  setAmountInput(String(amt));
                  setErrorMsg('');
                }}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                {formatRupiah(amt)}
              </button>
            ))}
          </div>
        </div>

        {/* Diambil Oleh / Disetor Oleh */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            {isCashOut ? 'Diambil Oleh' : 'Disetor Oleh'} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="Nama yang mengambil / menyetor..."
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Preset Buttons for Person */}
          <div className="flex gap-1.5 pt-0.5">
            {PERSON_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPersonName(p)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-colors cursor-pointer ${
                  personName === p
                    ? 'bg-red-50 text-red-700 border-red-200 font-black'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Keperluan / Kategori */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            Keperluan / Kategori <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
            >
              {(isCashOut ? CASH_OUT_CATEGORIES : CASH_IN_CATEGORIES).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Catatan (Opsional) */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block">
            Catatan Tambahan <span className="text-slate-400 font-normal">(Opsional)</span>
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tambahan keperluan kas..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>
        </div>

        {/* Saldo Akhir Perkiraan */}
        {numericAmount > 0 && !isOverWithdrawal && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center justify-between font-medium ${
              isCashOut
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            <span>Sisa Saldo Tunai di Laci:</span>
            <span className="font-black font-mono text-sm">
              {formatRupiah(
                isCashOut
                  ? currentAvailableCash - numericAmount
                  : currentAvailableCash + numericAmount
              )}
            </span>
          </div>
        )}

        {/* Tombol Aksi */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={recordMutation.isPending}
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={recordMutation.isPending}
            disabled={!numericAmount || isOverWithdrawal}
            className={`font-bold ${
              isCashOut
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isCashOut ? 'Catat Ambil Uang' : 'Catat Kas Masuk'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CashMovementModal;
