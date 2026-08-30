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
      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Nama (opsional)</label>
            <input
              type="text"
              value={inputLabel}
              onChange={(e) => setInputLabel(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Mis. Beras, Gula..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Harga / Jumlah</label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Rp</span>
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                value={inputValue ? Number(inputValue.replace(/\D/g, '')).toLocaleString('id-ID') : ''}
                onChange={(e) => setInputValue(e.target.value.replace(/\D/g, ''))}
                onKeyDown={handleKey}
                placeholder="0"
                className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm text-right outline-none focus:border-blue-400"
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
              className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors"
            >
              {v >= 1000 ? `${v / 1000}rb` : v}
            </button>
          ))}
        </div>

        <button
          onClick={handleAdd}
          disabled={!parseRaw(inputValue)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold text-sm transition-colors"
        >
          <Plus size={16} />
          Tambah
        </button>
      </div>

      {/* Daftar entri */}
      {entries.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {entries.map((e, idx) => (
              <div key={e.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-gray-700 truncate">{e.label}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-semibold text-gray-800">
                    {formatRupiah(e.amount)}
                  </span>
                  <button
                    onClick={() => handleRemove(e.id)}
                    className="w-6 h-6 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="bg-blue-50 px-4 py-3 flex items-center justify-between border-t border-blue-100">
            <span className="font-semibold text-blue-800 text-sm">{entries.length} Item — Total</span>
            <span className="text-xl font-black text-blue-700">{formatRupiah(total)}</span>
          </div>

          <div className="px-4 py-3 flex justify-end">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors"
            >
              <RotateCcw size={13} />
              Reset Semua
            </button>
          </div>
        </div>
      )}

      {entries.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          <Calculator size={36} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Belum ada item. Tambahkan di atas.</p>
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
      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4">
        <div>
          <label className="text-xs text-gray-500 font-medium mb-1 block">Total Belanja</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
            <input
              type="text"
              inputMode="numeric"
              value={totalInput ? Number(totalInput.replace(/\D/g, '')).toLocaleString('id-ID') : ''}
              onChange={(e) => setTotalInput(e.target.value.replace(/\D/g, ''))}
              placeholder="0"
              className="w-full pl-9 pr-4 py-3 border-2 border-gray-200 rounded-xl text-right text-lg font-semibold outline-none focus:border-blue-400 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500 font-medium mb-1 block">Uang Diterima</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
            <input
              type="text"
              inputMode="numeric"
              value={receivedInput ? Number(receivedInput.replace(/\D/g, '')).toLocaleString('id-ID') : ''}
              onChange={(e) => setReceivedInput(e.target.value.replace(/\D/g, ''))}
              placeholder="0"
              className={`w-full pl-9 pr-4 py-3 border-2 rounded-xl text-right text-lg font-semibold outline-none transition-colors ${
                shortage > 0
                  ? 'border-red-300 bg-red-50 text-red-700'
                  : change > 0
                  ? 'border-green-300 bg-green-50 text-green-700'
                  : 'border-gray-200 focus:border-blue-400'
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
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                  received === v
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
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
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total</span>
            <span className="font-semibold">{formatRupiah(total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Diterima</span>
            <span className="font-semibold">{formatRupiah(received)}</span>
          </div>
          <div className="h-px bg-gray-100" />
          {shortage > 0 && (
            <div className="flex justify-between">
              <span className="font-semibold text-red-600">Kurang</span>
              <span className="text-xl font-black text-red-600">{formatRupiah(shortage)}</span>
            </div>
          )}
          {change >= 0 && received > 0 && (
            <div className="flex justify-between">
              <span className="font-semibold text-green-700">Kembalian</span>
              <span className="text-xl font-black text-green-700">{formatRupiah(change)}</span>
            </div>
          )}
        </div>
      )}

      {(total > 0 || received > 0) && (
        <button
          onClick={handleReset}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={14} />
          Reset
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <Calculator size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Kalkulator Cepat</h1>
              <p className="text-xs text-gray-500">Bantu hitung barang & kembalian</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6">
        <div className="max-w-lg mx-auto flex">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-5">
        {activeTab === 'items' && <ItemCalculator />}
        {activeTab === 'change' && <ChangeCalculator />}
      </div>
    </div>
  );
}
