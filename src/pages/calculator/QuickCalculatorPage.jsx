import { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '@/services/transactionService';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Toast } from '@/components/common/Toast';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import TransactionSuccessModal from '@/components/pos/TransactionSuccessModal';
import { QRISDisplay } from '@/components/pos/QRISDisplay';
import {
  Plus,
  Trash2,
  RotateCcw,
  Calculator,
  RefreshCw,
  Banknote,
  QrCode,
  CreditCard,
  CheckCircle2,
  FileSpreadsheet,
  Coins,
  FileText,
  BookmarkPlus,
  ArrowRight,
  Clock,
  Check,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';
import { formatRupiah, formatTanggal } from '@/utils/formatters';

const parseRaw = (v) => {
  const n = Number(String(v).replace(/\D/g, ''));
  return isNaN(n) ? 0 : n;
};

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000, 100000];

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Tunai', icon: Banknote },
  { id: 'qris', label: 'QRIS', icon: QrCode },
  { id: 'transfer', label: 'Transfer', icon: CreditCard },
];

const DRAFT_STORAGE_KEY = 'quick_calc_drafts';

// Tab 1 — Hitung Barang & Pembayaran (Full 2-Column Responsive Layout)
function ItemCalculator() {
  const queryClient = useQueryClient();
  const [entries, setEntries] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [inputLabel, setInputLabel] = useState('');
  const [receivedInput, setReceivedInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [completedTrx, setCompletedTrx] = useState(null);
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' });
  const [savedDrafts, setSavedDrafts] = useState([]);
  const inputRef = useRef(null);

  // Load saved drafts from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (stored) setSavedDrafts(JSON.parse(stored));
    } catch (e) {}
  }, []);

  const total = entries.reduce((s, e) => s + e.amount, 0);
  const received = parseRaw(receivedInput);
  const change = received >= total ? received - total : 0;
  const isShortage = total > 0 && received > 0 && received < total;

  // Preset tombol uang cepat
  const standardDenominations = [10000, 20000, 50000, 100000, 200000];
  const quickReceivedAmounts =
    total > 0
      ? [
          total,
          ...standardDenominations.filter((v) => v >= total),
          Math.ceil(total / 10000) * 10000,
          Math.ceil(total / 50000) * 50000,
        ]
          .filter((v, idx, arr) => v > 0 && arr.indexOf(v) === idx)
          .sort((a, b) => a - b)
          .slice(0, 6)
      : standardDenominations;

  const handleAdd = useCallback(() => {
    const amount = parseRaw(inputValue);
    if (!amount) return;
    setEntries((prev) => [
      ...prev,
      { id: Date.now(), label: inputLabel.trim() || `Item ${prev.length + 1}`, amount },
    ]);
    setInputValue('');
    setInputLabel('');
    inputRef.current?.focus();
  }, [inputValue, inputLabel]);

  const handleRemove = (id) => setEntries((prev) => prev.filter((e) => e.id !== id));

  const handleReset = () => {
    setEntries([]);
    setInputValue('');
    setInputLabel('');
    setReceivedInput('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') handleAdd();
  };

  // Simpan antrean draft ke localStorage
  const handleSaveAsDraft = () => {
    if (entries.length === 0) return;
    const newDraft = {
      id: `draft-${Date.now()}`,
      createdAt: new Date().toISOString(),
      entries,
      total,
      paymentMethod,
      receivedInput,
    };
    const updated = [newDraft, ...savedDrafts.slice(0, 9)];
    setSavedDrafts(updated);
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
    setToast({
      isOpen: true,
      message: 'Transaksi berhasil disimpan sebagai Draft antrean.',
      type: 'success',
    });
    handleReset();
  };

  // Muat draft kembali ke kalkulator
  const handleLoadDraft = (draft) => {
    setEntries(draft.entries || []);
    setPaymentMethod(draft.paymentMethod || 'cash');
    setReceivedInput(draft.receivedInput || '');
    const updated = savedDrafts.filter((d) => d.id !== draft.id);
    setSavedDrafts(updated);
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
    setToast({
      isOpen: true,
      message: 'Draft belanjaan berhasil dimuat ke kalkulator.',
      type: 'success',
    });
  };

  const handleDeleteDraft = (draftId) => {
    const updated = savedDrafts.filter((d) => d.id !== draftId);
    setSavedDrafts(updated);
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  // Mutation simpan transaksi kalkulator cepat ke laporan
  const saveMutation = useMutation({
    mutationFn: () =>
      transactionService.processQuickCalculatorSale({
        entries,
        paymentAmount: received || total,
        paymentMethod,
      }),
    onSuccess: (data) => {
      setIsReviewModalOpen(false);
      setCompletedTrx(data);
      queryClient.invalidateQueries({ queryKey: ['today-summary'] });
      queryClient.invalidateQueries({ queryKey: ['daily-sales'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['report-summary'] });
      queryClient.invalidateQueries({ queryKey: ['report-top-products'] });
    },
    onError: (err) => {
      setToast({
        isOpen: true,
        message: err.message || 'Gagal mencatat transaksi ke laporan.',
        type: 'error',
      });
    },
  });

  const handleOpenReview = () => {
    if (entries.length === 0) return;
    if (paymentMethod === 'cash' && received > 0 && received < total) {
      setToast({
        isOpen: true,
        message: 'Nominal uang diterima kurang dari total belanja.',
        type: 'warning',
      });
      return;
    }
    setIsReviewModalOpen(true);
  };

  const handleConfirmFinal = () => {
    saveMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* 0. Antrean Draft Tersimpan Banner (Jika Ada) */}
      {savedDrafts.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-amber-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-700" />
              Antrean Draft Tersimpan ({savedDrafts.length})
            </span>
            <span className="text-xs text-amber-700 font-medium">Klik "Muat" untuk melanjutkan transaksi</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {savedDrafts.map((d) => (
              <div
                key={d.id}
                className="p-3 bg-white rounded-xl border border-amber-200/80 flex items-center justify-between gap-2 text-xs shadow-xs"
              >
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 truncate">
                    {d.entries.length} Item &bull; {formatRupiah(d.total)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {formatTanggal(d.createdAt)} &bull; {d.paymentMethod.toUpperCase()}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleLoadDraft(d)}
                    className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-bold border border-red-200 transition-colors cursor-pointer text-xs"
                  >
                    Muat
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteDraft(d.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Hapus Draft"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main 2-Column Full Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Input Nilai & Pengaturan Pembayaran (5 Kolom) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card 1: Input Barang */}
          <Card
            header={
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-red-600" />
                <span className="font-bold text-sm text-slate-800">Tambah Item Belanja</span>
              </div>
            }
            bodyClassName="p-4 sm:p-5 space-y-3.5"
          >
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-600 font-bold mb-1 block">
                  Nama Barang (opsional)
                </label>
                <input
                  type="text"
                  value={inputLabel}
                  onChange={(e) => setInputLabel(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Mis. Beras, Minyak, Telur..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-500 font-medium"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600 font-bold mb-1 block">
                  Harga / Jumlah (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    Rp
                  </span>
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    value={inputValue ? Number(inputValue.replace(/\D/g, '')).toLocaleString('id-ID') : ''}
                    onChange={(e) => setInputValue(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={handleKey}
                    placeholder="0"
                    className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-base font-black text-right outline-none focus:border-red-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Quick nominal buttons */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Pilihan Cepat Nominal:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_AMOUNTS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setInputValue(String(v))}
                    className="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 transition-colors cursor-pointer border border-red-200/60"
                  >
                    {v >= 1000 ? `${v / 1000}rb` : v}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleAdd}
              disabled={!parseRaw(inputValue)}
              variant="primary"
              icon={Plus}
              className="w-full py-3 bg-red-600 hover:bg-red-700 font-bold text-sm shadow-md shadow-red-500/20 cursor-pointer"
            >
              Tambah ke Hitungan
            </Button>
          </Card>

          {/* Card 2: Pengaturan Pembayaran (Jika ada item) */}
          {entries.length > 0 && (
            <Card
              header={
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-red-600" />
                  <span className="font-bold text-sm text-slate-800">Metode & Uang Diterima</span>
                </div>
              }
              bodyClassName="p-4 sm:p-5 space-y-4"
            >
              {/* Pilihan Metode Bayar */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">
                  Pilih Metode Pembayaran
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map((m) => {
                    const Icon = m.icon;
                    const isActive = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(m.id);
                          if (m.id !== 'cash') {
                            setReceivedInput(String(total));
                          }
                        }}
                        className={`py-2.5 px-2 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-red-600 text-white border-red-600 shadow-xs shadow-red-500/25'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Input Uang Tunai Diterima */}
              {paymentMethod === 'cash' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Uang Diterima (Cash)
                    </label>
                    {received > 0 && (
                      <span
                        className={`text-xs font-bold ${
                          isShortage ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        {isShortage
                          ? `Kurang ${formatRupiah(total - received)}`
                          : `Kembalian: ${formatRupiah(change)}`}
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                      Rp
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={receivedInput ? Number(receivedInput.replace(/\D/g, '')).toLocaleString('id-ID') : ''}
                      onChange={(e) => setReceivedInput(e.target.value.replace(/\D/g, ''))}
                      placeholder={Number(total).toLocaleString('id-ID')}
                      className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl text-right text-lg font-black outline-none transition-colors font-mono ${
                        isShortage
                          ? 'border-rose-300 bg-rose-50/50 text-rose-700'
                          : received >= total && received > 0
                          ? 'border-emerald-400 bg-emerald-50/50 text-emerald-800'
                          : 'border-slate-200 focus:border-red-500'
                      }`}
                    />
                  </div>

                  {/* Preset Tombol Cepat Nominal */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {quickReceivedAmounts.map((amt, idx) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setReceivedInput(String(amt))}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                          received === amt
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-700'
                        }`}
                      >
                        {amt === total ? 'Uang Pas' : amt >= 1000 ? `Rp${(amt / 1000).toFixed(0)}rb` : `Rp${amt}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tampilan QRIS Dinamis & Statis */}
              {paymentMethod === 'qris' && (
                <div className="pt-1">
                  <QRISDisplay totalAmount={total} merchantName="WARUNG GARINUL, PACET" />
                </div>
              )}

              {/* Tampilan Rekening Transfer Bank */}
              {paymentMethod === 'transfer' && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
                    <span className="font-bold text-slate-700 uppercase tracking-wider">
                      Rekening Transfer Toko
                    </span>
                    <span className="text-red-600 font-mono font-bold text-sm">
                      {formatRupiah(total)}
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">BCA: 123-456-7890</p>
                        <p className="text-[11px] text-slate-500">a.n. Akhfa Shidqie Muttaqien</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-extrabold text-xs border border-blue-200">
                        BCA
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">Mandiri: 900-00-1234567-8</p>
                        <p className="text-[11px] text-slate-500">a.n. Warung Garinul</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-extrabold text-xs border border-amber-200">
                        Mandiri
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Kolom Kanan: Daftar Belanjaan, Subtotal & Tombol Selesai (7 Kolom) */}
        <div className="lg:col-span-7 space-y-5">
          {entries.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs space-y-0">
              {/* Header List */}
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-red-600" />
                  Daftar Belanjaan ({entries.length} Item)
                </span>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 text-rose-600 hover:text-rose-800 text-xs font-bold cursor-pointer hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <RotateCcw size={13} />
                  <span>Reset Semua</span>
                </button>
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
                {entries.map((e, idx) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="w-7 h-7 rounded-full bg-red-50 text-red-700 text-xs font-black flex items-center justify-center shrink-0 border border-red-100 font-mono">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-bold text-slate-800 truncate">{e.label}</span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-base font-black text-slate-900 font-mono">
                        {formatRupiah(e.amount)}
                      </span>
                      <button
                        onClick={() => handleRemove(e.id)}
                        className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-colors cursor-pointer"
                        title="Hapus baris"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Subtotal Banner */}
              <div className="bg-gradient-to-r from-red-50 via-rose-50 to-red-50 px-6 py-5 flex items-center justify-between border-t border-red-100">
                <div>
                  <p className="text-xs font-bold text-red-900 uppercase tracking-wider">
                    Total Belanjaan
                  </p>
                  <p className="text-xs text-red-700 font-medium mt-0.5">
                    {entries.length} item terhitung
                  </p>
                </div>
                <span className="text-3xl font-black text-red-600 font-mono">
                  {formatRupiah(total)}
                </span>
              </div>

              {/* Highlight Kembalian Banner */}
              {paymentMethod === 'cash' && received >= total && received > 0 && (
                <div className="bg-emerald-50 border-t border-emerald-200 px-6 py-4 flex items-center justify-between">
                  <span className="font-bold text-emerald-800 text-sm flex items-center gap-2">
                    <Coins className="w-5 h-5 text-emerald-600" />
                    Uang Kembalian Pelanggan:
                  </span>
                  <span className="text-2xl font-black text-emerald-700 font-mono">
                    {formatRupiah(change)}
                  </span>
                </div>
              )}

              {/* Actions Footer: Simpan Draft & Lanjutkan ke Konfirmasi */}
              <div className="p-6 border-t border-slate-100 bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    icon={BookmarkPlus}
                    onClick={handleSaveAsDraft}
                    className="sm:col-span-1 py-4 text-xs font-bold text-slate-700 border-slate-300 hover:bg-slate-50 rounded-xl"
                  >
                    Simpan Draft
                  </Button>

                  <Button
                    type="button"
                    variant="primary"
                    icon={ArrowRight}
                    onClick={handleOpenReview}
                    disabled={isShortage}
                    className="sm:col-span-2 py-4 text-sm font-bold bg-gradient-to-r from-red-600 via-red-700 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white shadow-lg shadow-red-500/25 active:scale-95 cursor-pointer rounded-xl"
                  >
                    Tinjau & Konfirmasi Pembayaran
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[350px] flex flex-col items-center justify-center text-center py-16 px-6 bg-white rounded-2xl border border-slate-200/90 text-slate-400 shadow-xs space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center mx-auto">
                <Calculator size={32} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">Belum Ada Item Belanja</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                  Ketik harga barang di formulir sebelah kiri untuk mulai menghitung total belanja & mencatat ke laporan.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal 1: Review & Konfirmasi Draft Transaksi Sebelum Masuk Penjualan */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        maxWidth="max-w-md"
        title="Konfirmasi Transaksi Penjualan"
        subtitle="Periksa kembali ringkasan belanja & pembayaran sebelum dicatat ke laporan resmi"
      >
        <div className="space-y-4">
          {/* Ringkasan Belanja Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-200">
              <span className="font-semibold uppercase tracking-wider">Item Belanja ({entries.length})</span>
              <span className="font-mono">Harga</span>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto divide-y divide-slate-100">
              {entries.map((item, idx) => (
                <div key={item.id || idx} className="flex justify-between items-center text-xs pt-1.5">
                  <span className="font-medium text-slate-800 truncate pr-2">
                    {idx + 1}. {item.label}
                  </span>
                  <span className="font-bold text-slate-900 font-mono shrink-0">
                    {formatRupiah(item.amount)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-200 space-y-1.5">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-700">Total Tagihan</span>
                <span className="text-lg font-black text-red-600 font-mono">{formatRupiah(total)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Metode Pembayaran</span>
                <span className="font-bold text-slate-800 uppercase px-2 py-0.5 rounded bg-slate-200/70">
                  {paymentMethod}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Uang Diterima</span>
                <span className="font-bold text-slate-900 font-mono">
                  {formatRupiah(received || total)}
                </span>
              </div>
              {paymentMethod === 'cash' && change > 0 && (
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-xs font-bold text-emerald-800">Kembalian</span>
                  <span className="text-base font-black text-emerald-700 font-mono">
                    {formatRupiah(change)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Notice */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Setelah dikonfirmasi, transaksi ini akan <strong>resmi tercatat di Laporan Penjualan Hari Ini & Closing Kasir</strong>.
            </p>
          </div>

          {/* Action Buttons Modal */}
          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReviewModalOpen(false)}
              disabled={saveMutation.isPending}
              className="py-2.5 text-xs font-bold rounded-xl"
            >
              Edit Lagi
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleConfirmFinal}
              isLoading={saveMutation.isPending}
              icon={Check}
              className="py-2.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/25 rounded-xl"
            >
              Konfirmasi & Masuk Laporan
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 2: Sukses Transaksi + Cetak Struk */}
      <TransactionSuccessModal
        isOpen={Boolean(completedTrx)}
        transaction={completedTrx}
        onNewTransaction={() => {
          setCompletedTrx(null);
          handleReset();
        }}
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

// Tab 2 — Hitung Kembalian Cepat (Full 2-Column Responsive Layout)
function ChangeCalculator() {
  const queryClient = useQueryClient();
  const [totalInput, setTotalInput] = useState('');
  const [receivedInput, setReceivedInput] = useState('');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [completedTrx, setCompletedTrx] = useState(null);
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' });

  const total = parseRaw(totalInput);
  const received = parseRaw(receivedInput);
  const change = received >= total ? received - total : 0;
  const shortage = total > 0 && received > 0 && received < total ? total - received : 0;

  const standardDenominations = [10000, 20000, 50000, 100000, 200000];
  const quickAmounts =
    total > 0
      ? [
          total,
          ...standardDenominations.filter((v) => v >= total),
          Math.ceil(total / 10000) * 10000,
          Math.ceil(total / 50000) * 50000,
        ]
          .filter((v, idx, arr) => v > 0 && arr.indexOf(v) === idx)
          .sort((a, b) => a - b)
          .slice(0, 6)
      : standardDenominations;

  const handleReset = () => {
    setTotalInput('');
    setReceivedInput('');
  };

  // Simpan transaksi hitung kembalian cepat ke laporan
  const saveMutation = useMutation({
    mutationFn: () =>
      transactionService.processQuickCalculatorSale({
        entries: [{ label: 'Belanja Cepat', amount: total }],
        paymentAmount: received || total,
        paymentMethod: 'cash',
      }),
    onSuccess: (data) => {
      setIsReviewModalOpen(false);
      setCompletedTrx(data);
      queryClient.invalidateQueries({ queryKey: ['today-summary'] });
      queryClient.invalidateQueries({ queryKey: ['daily-sales'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['report-summary'] });
    },
    onError: (err) => {
      setToast({
        isOpen: true,
        message: err.message || 'Gagal menyimpan transaksi ke laporan.',
        type: 'error',
      });
    },
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Kolom Kiri: Input Nilai Tagihan & Uang Diterima */}
      <div className="lg:col-span-6 space-y-4">
        <Card
          header={
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-red-600" />
              <span className="font-bold text-sm text-slate-800">Input Tagihan & Uang Tunai</span>
            </div>
          }
          bodyClassName="p-4 sm:p-5 space-y-4"
        >
          <div>
            <label className="text-xs text-slate-600 font-bold mb-1 block">
              Total Belanja (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={totalInput ? Number(totalInput.replace(/\D/g, '')).toLocaleString('id-ID') : ''}
                onChange={(e) => setTotalInput(e.target.value.replace(/\D/g, ''))}
                placeholder="0"
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-right text-lg font-black outline-none focus:border-red-500 transition-colors font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-600 font-bold mb-1 block">
              Uang Diterima (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={receivedInput ? Number(receivedInput.replace(/\D/g, '')).toLocaleString('id-ID') : ''}
                onChange={(e) => setReceivedInput(e.target.value.replace(/\D/g, ''))}
                placeholder="0"
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl text-right text-lg font-black outline-none transition-colors font-mono ${
                  shortage > 0
                    ? 'border-rose-300 bg-rose-50/50 text-rose-700'
                    : change > 0
                    ? 'border-emerald-400 bg-emerald-50/50 text-emerald-800'
                    : 'border-slate-200 focus:border-red-500'
                }`}
              />
            </div>
          </div>

          {/* Quick amounts based on total */}
          {quickAmounts.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Pecahan Uang Tunai Cepat:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickAmounts.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setReceivedInput(String(v))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      received === v
                        ? 'bg-red-600 text-white border-red-600 shadow-xs shadow-red-500/25'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-red-50 hover:text-red-700'
                    }`}
                  >
                    {v === total ? 'Uang Pas' : v >= 1000 ? `Rp${(v / 1000).toFixed(0)}rb` : `Rp${v}`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Kolom Kanan: Hasil Hitungan & Aksi Konfirmasi */}
      <div className="lg:col-span-6 space-y-4">
        {(total > 0 || received > 0) ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">
                Ringkasan Pembayaran
              </h3>
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-slate-500 hover:text-rose-600 text-xs font-bold cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Total Tagihan</span>
                <span className="font-bold text-slate-900 font-mono">{formatRupiah(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Uang Diterima</span>
                <span className="font-bold text-slate-900 font-mono">{formatRupiah(received)}</span>
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            {shortage > 0 && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex justify-between items-baseline">
                <span className="font-bold text-rose-700">Kurang Bayar</span>
                <span className="text-2xl font-black text-rose-600 font-mono">{formatRupiah(shortage)}</span>
              </div>
            )}

            {change >= 0 && received > 0 && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex justify-between items-baseline">
                <span className="font-bold text-emerald-800">Uang Kembalian</span>
                <span className="text-3xl font-black text-emerald-600 font-mono">{formatRupiah(change)}</span>
              </div>
            )}

            {total > 0 && (
              <div className="pt-2">
                <Button
                  onClick={() => setIsReviewModalOpen(true)}
                  disabled={shortage > 0}
                  variant="primary"
                  icon={FileSpreadsheet}
                  className="w-full py-4 text-sm font-bold bg-gradient-to-r from-red-600 via-red-700 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white shadow-lg shadow-red-500/25 rounded-xl cursor-pointer"
                >
                  Tinjau & Konfirmasi ke Laporan Penjualan
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl border border-slate-200/90 text-slate-400 shadow-xs space-y-2">
            <Coins size={36} className="mx-auto opacity-30 text-emerald-600" />
            <h4 className="font-bold text-slate-800 text-sm">Belum Ada Nominal Dihitung</h4>
            <p className="text-xs text-slate-400 max-w-xs">
              Masukkan total belanja & uang yang dibayarkan pembeli untuk menghitung kembalian otomatis.
            </p>
          </div>
        )}
      </div>

      {/* Modal Konfirmasi Hitung Kembalian */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        maxWidth="max-w-sm"
        title="Konfirmasi Penjualan Cepat"
        subtitle="Simpan transaksi langsung ke laporan penjualan harian"
      >
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Total Belanja</span>
              <span className="font-bold text-slate-900 font-mono">{formatRupiah(total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Uang Diterima</span>
              <span className="font-bold text-slate-900 font-mono">{formatRupiah(received || total)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-emerald-700">
              <span>Kembalian</span>
              <span className="font-mono text-sm">{formatRupiah(change)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReviewModalOpen(false)}
              disabled={saveMutation.isPending}
              className="py-2.5 text-xs font-bold rounded-xl"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => saveMutation.mutate()}
              isLoading={saveMutation.isPending}
              icon={Check}
              className="py-2.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl"
            >
              Konfirmasi
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Sukses Transaksi */}
      <TransactionSuccessModal
        isOpen={Boolean(completedTrx)}
        transaction={completedTrx}
        onNewTransaction={() => {
          setCompletedTrx(null);
          handleReset();
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

const TABS = [
  { id: 'items', label: 'Hitung Barang' },
  { id: 'change', label: 'Hitung Kembalian' },
];

export default function QuickCalculatorPage() {
  const [activeTab, setActiveTab] = useState('items');

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Kalkulator Cepat' }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100 shrink-0">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Kalkulator Cepat</h1>
            <p className="text-xs sm:text-sm text-slate-500">Hitung belanja, simpan draft & konfirmasi penjualan</p>
          </div>
        </div>

        {/* Tabs Switcher in Header */}
        <div className="bg-slate-200/80 p-1 rounded-xl flex gap-1 text-xs sm:text-sm font-bold sm:w-80">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-red-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'items' && <ItemCalculator />}
        {activeTab === 'change' && <ChangeCalculator />}
      </div>
    </div>
  );
}
