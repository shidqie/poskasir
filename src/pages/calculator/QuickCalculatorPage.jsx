import { useState, useCallback, useRef } from 'react';
import { Plus, Trash2, RotateCcw, Calculator, RefreshCw } from 'lucide-react';

const formatRupiah = (num) =>
  num === 0 ? 'Rp0' : `Rp${num.toLocaleString('id-ID')}`;

const parseRaw = (v) => {
  const n = Number(String(v).replace(/\D/g, ''));
  return isNaN(n) ? 0 : n;
};

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000, 100000];

// Tab 1 — Hitung Barang: Kalkulator akumulator sederhana
function ItemCalculator() {
  const [entries, setEntries] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [inputLabel, setInputLabel] = useState('');
  const inputRef = useRef(null);

  const total = entries.reduce((s, e) => s + e.amount, 0);

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
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') handleAdd();
  };

  return (
    <div className="space-y-4">
      {/* Input baris */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 space-y-3 shadow-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-500 font-semibold mb-1 block">Nama (opsional)</label>
            <input
              type="text"
              value={inputLabel}
              onChange={(e) => setInputLabel(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Mis. Beras, Gula..."
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-500 font-medium"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 font-semibold mb-1 block">Harga / Jumlah</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Rp</span>
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                value={inputValue ? Number(inputValue.replace(/\D/g, '')).toLocaleString('id-ID') : ''}
                onChange={(e) => setInputValue(e.target.value.replace(/\D/g, ''))}
                onKeyDown={handleKey}
                placeholder="0"
                className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-right outline-none focus:border-red-500"
              />
            </div>
          </div>
        </div>

        {/* Quick amounts */}
        <div className="flex flex-wrap gap-1.5">
          {QUICK_AMOUNTS.map((v) => (
            <button
              key={v}
              onClick={() => setInputValue(String(v))}
              className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 transition-colors cursor-pointer"
            >
              {v >= 1000 ? `${v / 1000}rb` : v}
            </button>
          ))}
        </div>

        <button
          onClick={handleAdd}
          disabled={!parseRaw(inputValue)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm transition-all shadow-md shadow-red-500/25 active:scale-95 cursor-pointer"
        >
          <Plus size={16} />
          Tambah
        </button>
      </div>

      {/* Daftar entri */}
      {entries.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
          <div className="divide-y divide-slate-100">
            {entries.map((e, idx) => (
              <div key={e.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-red-50 text-red-700 text-xs font-black flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-bold text-slate-800 truncate">{e.label}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-black text-slate-900">
                    {formatRupiah(e.amount)}
                  </span>
                  <button
                    onClick={() => handleRemove(e.id)}
                    className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="bg-red-50/80 px-5 py-3.5 flex items-center justify-between border-t border-red-100">
            <span className="font-bold text-red-900 text-sm">{entries.length} Item — Total Belanja</span>
            <span className="text-xl font-black text-red-600">{formatRupiah(total)}</span>
          </div>

          <div className="px-4 py-3 flex justify-end">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <RotateCcw size={13} />
              Reset Semua
            </button>
          </div>
        </div>
      )}

      {entries.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-400">
          <Calculator size={36} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm font-bold text-slate-700">Belum ada item</p>
          <p className="text-xs text-slate-400 mt-0.5">Tambahkan nilai belanjaan di atas untuk kalkulasi cepat.</p>
        </div>
      )}
    </div>
  );
}

// Tab 2 — Hitung Kembalian
function ChangeCalculator() {
  const [totalInput, setTotalInput] = useState('');
  const [receivedInput, setReceivedInput] = useState('');

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

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 space-y-4 shadow-xs">
        <div>
          <label className="text-xs text-slate-500 font-semibold mb-1 block">Total Belanja</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</span>
            <input
              type="text"
              inputMode="numeric"
              value={totalInput ? Number(totalInput.replace(/\D/g, '')).toLocaleString('id-ID') : ''}
              onChange={(e) => setTotalInput(e.target.value.replace(/\D/g, ''))}
              placeholder="0"
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-right text-lg font-black outline-none focus:border-red-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-500 font-semibold mb-1 block">Uang Diterima</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</span>
            <input
              type="text"
              inputMode="numeric"
              value={receivedInput ? Number(receivedInput.replace(/\D/g, '')).toLocaleString('id-ID') : ''}
              onChange={(e) => setReceivedInput(e.target.value.replace(/\D/g, ''))}
              placeholder="0"
              className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl text-right text-lg font-black outline-none transition-colors ${
                shortage > 0
                  ? 'border-rose-300 bg-rose-50 text-rose-700'
                  : change > 0
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
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
      </div>

      {/* Hasil */}
      {(total > 0 || received > 0) && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-3 shadow-xs">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 font-medium">Total Tagihan</span>
            <span className="font-bold text-slate-900">{formatRupiah(total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 font-medium">Uang Diterima</span>
            <span className="font-bold text-slate-900">{formatRupiah(received)}</span>
          </div>
          <div className="h-px bg-slate-100" />
          {shortage > 0 && (
            <div className="flex justify-between items-baseline">
              <span className="font-bold text-rose-600">Kurang Bayar</span>
              <span className="text-2xl font-black text-rose-600">{formatRupiah(shortage)}</span>
            </div>
          )}
          {change >= 0 && received > 0 && (
            <div className="flex justify-between items-baseline">
              <span className="font-bold text-emerald-700">Kembalian</span>
              <span className="text-2xl font-black text-emerald-600">{formatRupiah(change)}</span>
            </div>
          )}
        </div>
      )}

      {(total > 0 || received > 0) && (
        <button
          onClick={handleReset}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <RefreshCw size={14} />
          Reset Hitungan
        </button>
      )}
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
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100 shrink-0">
          <Calculator className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Kalkulator Cepat</h1>
          <p className="text-xs sm:text-sm text-slate-500">Hitung total belanja & kembalian praktis</p>
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
