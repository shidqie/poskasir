import { useState, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '@/services/transactionService';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Toast } from '@/components/common/Toast';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import TransactionSuccessModal from '@/components/pos/TransactionSuccessModal';
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
} from 'lucide-react';
import { formatRupiah } from '@/utils/formatters';

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

// Tab 1 — Hitung Barang & Pembayaran
function ItemCalculator() {
  const queryClient = useQueryClient();
  const [entries, setEntries] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [inputLabel, setInputLabel] = useState('');
  const [receivedInput, setReceivedInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [completedTrx, setCompletedTrx] = useState(null);
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' });
  const inputRef = useRef(null);

  const total = entries.reduce((s, e) => s + e.amount, 0);
  const received = parseRaw(receivedInput);
  const change = received >= total ? received - total : 0;
  const isShortage = total > 0 && received > 0 && received < total;

  // Preset tombol uang cepat
  const quickReceivedAmounts = total > 0
    ? [
        total,
        50000,
        100000,
        200000,
        Math.ceil(total / 10000) * 10000,
        Math.ceil(total / 50000) * 50000,
      ]
        .filter((v, idx, arr) => v >= total && arr.indexOf(v) === idx)
        .sort((a, b) => a - b)
        .slice(0, 5)
    : [50000, 100000, 200000];

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

  // Mutation simpan transaksi kalkulator cepat ke laporan
  const saveMutation = useMutation({
    mutationFn: () =>
      transactionService.processQuickCalculatorSale({
        entries,
        paymentAmount: received || total,
        paymentMethod,
      }),
    onSuccess: (data) => {
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

  const handleSaveTransaction = () => {
    if (entries.length === 0) return;
    if (paymentMethod === 'cash' && received > 0 && received < total) {
      setToast({
        isOpen: true,
        message: 'Nominal uang diterima kurang dari total belanja.',
        type: 'warning',
      });
      return;
    }
    saveMutation.mutate();
  };

  return (
    <div className="space-y-4">
      {/* 1. Input Nilai Barang */}
      <Card bodyClassName="p-4 sm:p-5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-black text-right outline-none focus:border-red-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Quick nominal buttons */}
        <div className="flex flex-wrap gap-1.5 pt-1">
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

      {/* 2. Daftar Entri Barang & Ringkasan */}
      {entries.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs space-y-0">
          {/* Item List Header */}
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Daftar Belanjaan ({entries.length} Item)
            </span>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-rose-600 hover:text-rose-800 text-xs font-bold cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
            {entries.map((e, idx) => (
              <div key={e.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-red-50 text-red-700 text-xs font-black flex items-center justify-center shrink-0 border border-red-100">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-bold text-slate-800 truncate">{e.label}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-black text-slate-900 font-mono">
                    {formatRupiah(e.amount)}
                  </span>
                  <button
                    onClick={() => handleRemove(e.id)}
                    className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-colors cursor-pointer"
                    title="Hapus baris"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Subtotal Banner */}
          <div className="bg-gradient-to-r from-red-50 to-rose-50 px-5 py-4 flex items-center justify-between border-t border-red-100">
            <div>
              <p className="text-xs font-bold text-red-900 uppercase tracking-wider">
                Total Belanja
              </p>
              <p className="text-[11px] text-red-700 font-medium mt-0.5">
                {entries.length} item terhitung
              </p>
            </div>
            <span className="text-2xl font-black text-red-600 font-mono">
              {formatRupiah(total)}
            </span>
          </div>

          {/* 3. Input Uang Diterima & Pilihan Metode Pembayaran */}
          <div className="p-5 border-t border-slate-100 bg-white space-y-4">
            {/* Pilihan Metode Bayar */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">
                Metode Pembayaran
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
                      {idx === 0 && amt === total ? 'Uang Pas' : formatRupiah(amt)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Kembalian Banner Highlight */}
            {paymentMethod === 'cash' && received >= total && received > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between">
                <span className="font-bold text-emerald-800 text-xs flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-emerald-600" />
                  Uang Kembalian Pelanggan:
                </span>
                <span className="text-xl font-black text-emerald-700 font-mono">
                  {formatRupiah(change)}
                </span>
              </div>
            )}

            {/* Tombol Utama: Simpan Transaksi & Masuk ke Laporan Harian */}
            <Button
              onClick={handleSaveTransaction}
              isLoading={saveMutation.isPending}
              disabled={saveMutation.isPending || isShortage}
              variant="primary"
              icon={CheckCircle2}
              className="w-full py-4 text-sm font-bold bg-gradient-to-r from-red-600 via-red-700 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white shadow-lg shadow-red-500/25 active:scale-95 cursor-pointer rounded-xl"
            >
              Selesaikan Transaksi & Masukkan ke Laporan Harian
            </Button>
          </div>
        </div>
      )}

      {entries.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/90 text-slate-400 shadow-xs">
          <Calculator size={36} className="mx-auto mb-2 opacity-30 text-red-600" />
          <p className="text-sm font-bold text-slate-700">Belum ada item belanja</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Tambahkan harga barang di atas untuk menghitung total & mencatat langsung ke laporan kasir.
          </p>
        </div>
      )}

      {/* Modal Sukses Transaksi + Cetak Struk */}
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

// Tab 2 — Hitung Kembalian Cepat
function ChangeCalculator() {
  const queryClient = useQueryClient();
  const [totalInput, setTotalInput] = useState('');
  const [receivedInput, setReceivedInput] = useState('');
  const [completedTrx, setCompletedTrx] = useState(null);
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' });

  const total = parseRaw(totalInput);
  const received = parseRaw(receivedInput);
  const change = received >= total ? received - total : 0;
  const shortage = total > 0 && received > 0 && received < total ? total - received : 0;
  const quickAmounts = total
    ? [total, ...QUICK_AMOUNTS.map((v) => Math.ceil(total / v) * v).filter((v) => v > total)].slice(0, 6)
    : [];

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
    <div className="space-y-4">
      <Card bodyClassName="p-4 sm:p-5 space-y-4">
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
          <div className="flex flex-wrap gap-1.5">
            {quickAmounts.map((v, i) => (
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
                {i === 0 ? 'Uang Pas' : `Rp${(v / 1000).toFixed(0)}rb`}
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Hasil Hitungan */}
      {(total > 0 || received > 0) && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-3 shadow-xs">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 font-medium">Total Tagihan</span>
            <span className="font-bold text-slate-900 font-mono">{formatRupiah(total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 font-medium">Uang Diterima</span>
            <span className="font-bold text-slate-900 font-mono">{formatRupiah(received)}</span>
          </div>
          <div className="h-px bg-slate-100" />
          {shortage > 0 && (
            <div className="flex justify-between items-baseline">
              <span className="font-bold text-rose-600">Kurang Bayar</span>
              <span className="text-2xl font-black text-rose-600 font-mono">{formatRupiah(shortage)}</span>
            </div>
          )}
          {change >= 0 && received > 0 && (
            <div className="flex justify-between items-baseline">
              <span className="font-bold text-emerald-700">Kembalian</span>
              <span className="text-2xl font-black text-emerald-600 font-mono">{formatRupiah(change)}</span>
            </div>
          )}

          {total > 0 && (
            <div className="pt-2">
              <Button
                onClick={() => saveMutation.mutate()}
                isLoading={saveMutation.isPending}
                disabled={shortage > 0 || saveMutation.isPending}
                variant="primary"
                icon={FileSpreadsheet}
                className="w-full py-3.5 text-sm font-bold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/25 rounded-xl cursor-pointer"
              >
                Catat Transaksi Ini ke Laporan Harian
              </Button>
            </div>
          )}
        </div>
      )}

      {(total > 0 || received > 0) && (
        <button
          onClick={handleReset}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors cursor-pointer bg-white"
        >
          <RefreshCw size={14} />
          Reset Hitungan
        </button>
      )}

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
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-lg mx-auto w-full">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Kalkulator Cepat' }]} />

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100 shrink-0">
          <Calculator className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Kalkulator Cepat</h1>
          <p className="text-xs sm:text-sm text-slate-500">Hitung belanja & catat langsung ke laporan harian</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-200/80 p-1 rounded-xl flex gap-1 text-xs sm:text-sm font-bold">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 rounded-lg transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white text-red-600 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {activeTab === 'items' && <ItemCalculator />}
        {activeTab === 'change' && <ChangeCalculator />}
      </div>
    </div>
  );
}
