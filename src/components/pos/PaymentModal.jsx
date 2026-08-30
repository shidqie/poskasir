import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
  User,
  UserPlus,
  Search,
  Check,
} from 'lucide-react';
import { QRISDisplay } from '@/components/pos/QRISDisplay';
import { CustomerModal } from '@/components/customers/CustomerModal';
import { customerService } from '@/services/customerService';
import { formatRupiah } from '@/utils/formatters';

const parseRupiah = (value) => {
  const num = Number(String(value).replace(/\D/g, ''));
  return isNaN(num) ? 0 : num;
};

const QUICK_AMOUNTS_BASE = [10000, 20000, 50000, 100000, 200000];

function buildQuickAmounts(total) {
  const exact = total;
  const suggestions = QUICK_AMOUNTS_BASE.map((v) => Math.ceil(total / v) * v).filter(
    (v) => v >= total && v !== exact
  );
  const unique = [...new Set(suggestions)].sort((a, b) => a - b).slice(0, 5);
  return [exact, ...unique];
}

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Tunai', Icon: Banknote, desc: 'Uang Fisik Laci' },
  { id: 'qris', label: 'QRIS', Icon: QrCode, desc: 'Digital / Non-Tunai' },
  { id: 'debt', label: 'Hutang', Icon: BookOpen, desc: 'Catat Bon Pelanggan' },
];

export default function PaymentModal({ isOpen, onClose, total, onConfirm, isProcessing }) {
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'qris' | 'debt'
  const [receivedInput, setReceivedInput] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const inputRef = useRef(null);

  // Query customers for debt payment selection
  const { data: customers = [], refetch: refetchCustomers } = useQuery({
    queryKey: ['pos-customers-list', customerSearch],
    queryFn: () => customerService.getCustomers({ search: customerSearch, limit: 20 }),
    enabled: isOpen && paymentMethod === 'debt',
  });

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const received = parseRupiah(receivedInput);
  const change = received >= total ? received - total : 0;
  const isShortage = paymentMethod === 'cash' && received > 0 && received < total;

  // Validation if user can proceed with checkout
  let canPay = false;
  if (paymentMethod === 'cash') {
    canPay = received >= total;
  } else if (paymentMethod === 'qris') {
    canPay = true;
  } else if (paymentMethod === 'debt') {
    canPay = Boolean(selectedCustomerId);
  }

  const quickAmounts = buildQuickAmounts(total);

  // Reset modal state on open
  useEffect(() => {
    if (isOpen) {
      setPaymentMethod('cash');
      setReceivedInput('');
      setSelectedCustomerId('');
      setCustomerSearch('');
      setIsCustomerDropdownOpen(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleReceivedChange = useCallback((e) => {
    const raw = e.target.value.replace(/\D/g, '');
    setReceivedInput(raw ? Number(raw).toLocaleString('id-ID') : '');
  }, []);

  const handleQuickAmount = useCallback((amount) => {
    setReceivedInput(Number(amount).toLocaleString('id-ID'));
  }, []);

  const handleConfirm = useCallback(() => {
    if (!canPay || isProcessing) return;

    if (paymentMethod === 'debt' && !selectedCustomerId) return;

    const finalReceived = paymentMethod === 'cash' ? received : 0;
    onConfirm({
      paymentMethod,
      paymentAmount: finalReceived,
      changeAmount: paymentMethod === 'cash' ? finalReceived - total : 0,
      customerId: paymentMethod === 'debt' ? selectedCustomerId : null,
    });
  }, [canPay, isProcessing, paymentMethod, received, total, selectedCustomerId, onConfirm]);

  // Keyboard shortcuts: Enter to confirm, Esc to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Enter' && canPay && !isProcessing && !isCustomerDropdownOpen) {
        handleConfirm();
      }
      if (e.key === 'Escape' && !isProcessing) {
        if (isCustomerDropdownOpen) {
          setIsCustomerDropdownOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, canPay, isProcessing, isCustomerDropdownOpen, handleConfirm, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs"
        onClick={!isProcessing ? onClose : undefined}
      />

      {/* Modal Card */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 via-red-700 to-rose-800 px-5 py-4 flex items-center justify-between text-white">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-200 block">
              Proses Pembayaran Kasir
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xs text-red-100 font-medium">Total:</span>
              <span className="text-xl font-black font-mono">
                {formatRupiah(total)}
              </span>
            </div>
          </div>
          {!isProcessing && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={16} className="text-white" />
            </button>
          )}
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Payment Method Selector (Tunai, QRIS, Hutang) */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Pilih Metode Pembayaran:
            </p>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map(({ id, label, Icon, desc }) => {
                const isSelected = paymentMethod === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(id);
                      setIsCustomerDropdownOpen(false);
                    }}
                    disabled={isProcessing}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border-2 transition-all cursor-pointer text-center ${
                      isSelected
                        ? id === 'debt'
                          ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm'
                          : 'border-red-600 bg-red-50/70 text-red-900 shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1.5 ${
                        isSelected
                          ? id === 'debt'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-red-600 text-white shadow-xs'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      <Icon size={16} />
                    </div>
                    <p className="text-xs font-black leading-none">{label}</p>
                    <span className="text-[9px] text-slate-400 font-medium mt-0.5 block truncate max-w-full">
                      {desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 1. PEMBAYARAN TUNAI (Uang Diterima & Kembalian)                            */}
          {/* ========================================================================= */}
          {paymentMethod === 'cash' && (
            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Uang Tunai Diterima (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                    Rp
                  </span>
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    value={receivedInput}
                    onChange={handleReceivedChange}
                    disabled={isProcessing}
                    placeholder="0"
                    className={`w-full pl-11 pr-4 py-3 border-2 rounded-2xl text-right text-lg sm:text-xl font-black outline-none transition-colors font-mono ${
                      isShortage
                        ? 'border-rose-400 bg-rose-50/50 text-rose-700'
                        : received >= total && received > 0
                        ? 'border-emerald-500 bg-emerald-50/30 text-emerald-900'
                        : 'border-slate-200 focus:border-red-500 bg-white'
                    }`}
                  />
                </div>
              </div>

              {/* Quick Nominal Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handleQuickAmount(amount)}
                    disabled={isProcessing}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer active:scale-95 ${
                      received === amount
                        ? 'bg-red-600 text-white border-red-600 shadow-xs'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-red-50 hover:text-red-700'
                    }`}
                  >
                    {amount === total ? 'Uang Pas' : formatRupiah(amount)}
                  </button>
                ))}
              </div>

              {/* Shortage indicator */}
              {isShortage && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-bold">
                  <AlertCircle size={15} className="shrink-0 text-rose-500" />
                  <span>Kurang: {formatRupiah(total - received)}</span>
                </div>
              )}

              {/* Kembalian Box */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Uang Kembalian:
                  </span>
                  <span
                    className={`text-lg sm:text-xl font-black font-mono ${
                      change > 0 ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    {formatRupiah(change)}
                  </span>
                </div>
                {received >= total && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                    {change === 0 ? 'Uang Pas' : 'Lunas'}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. PEMBAYARAN QRIS (Digital)                                              */}
          {/* ========================================================================= */}
          {paymentMethod === 'qris' && (
            <div className="space-y-3 pt-1">
              <div className="p-3 bg-red-50/60 border border-red-200/90 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-red-500 font-bold uppercase block">
                    Total Tagihan QRIS:
                  </span>
                  <span className="text-lg sm:text-xl font-black text-red-700 font-mono">
                    {formatRupiah(total)}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-black text-xs">
                  Nominal Pas
                </span>
              </div>

              <QRISDisplay totalAmount={total} />
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. TRANSAKSI HUTANG (PILIH PELANGGAN & BON)                                */}
          {/* ========================================================================= */}
          {paymentMethod === 'debt' && (
            <div className="space-y-3.5 pt-1">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-amber-700 font-bold uppercase block">
                    Total Hutang / Bon:
                  </span>
                  <span className="text-lg sm:text-xl font-black text-amber-900 font-mono">
                    {formatRupiah(total)}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-black text-xs">
                  Belum Bayar
                </span>
              </div>

              {/* Pemilih Pelanggan */}
              <div className="space-y-1.5 relative">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Pilih Pelanggan <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddCustomerModalOpen(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                  >
                    <UserPlus size={13} />
                    <span>+ Tambah Pelanggan</span>
                  </button>
                </div>

                {/* Dropdown Input / Selector */}
                <div className="relative">
                  <div
                    onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                    className={`w-full p-3 bg-slate-50 border-2 rounded-2xl flex items-center justify-between cursor-pointer transition-colors ${
                      selectedCustomerId
                        ? 'border-amber-500 bg-amber-50/40 text-slate-900'
                        : 'border-slate-200 text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <User size={16} className={selectedCustomerId ? 'text-amber-600' : 'text-slate-400'} />
                      <span className="font-bold text-xs sm:text-sm truncate">
                        {selectedCustomer ? selectedCustomer.name : 'Pilih nama pelanggan berhutang...'}
                      </span>
                    </div>
                    {selectedCustomer?.phone && (
                      <span className="text-[11px] font-mono text-slate-400 shrink-0 ml-2">
                        {selectedCustomer.phone}
                      </span>
                    )}
                  </div>

                  {/* Customer Dropdown Popover */}
                  {isCustomerDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 space-y-2 animate-in fade-in duration-150">
                      <div className="relative">
                        <Search size={14} className="text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          autoFocus
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          placeholder="Ketik nama pelanggan..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                        />
                      </div>

                      <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                        {customers.length === 0 ? (
                          <div className="py-4 text-center text-xs text-slate-400 space-y-1.5">
                            <p>Pelanggan "{customerSearch}" belum ada.</p>
                            <button
                              type="button"
                              onClick={() => {
                                setIsCustomerDropdownOpen(false);
                                setIsAddCustomerModalOpen(true);
                              }}
                              className="text-xs font-bold text-red-600 hover:underline"
                            >
                              + Tambah "{customerSearch}" Sekarang
                            </button>
                          </div>
                        ) : (
                          customers.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setSelectedCustomerId(c.id);
                                setIsCustomerDropdownOpen(false);
                              }}
                              className="w-full py-2 px-2.5 rounded-lg flex items-center justify-between hover:bg-amber-50 text-left transition-colors cursor-pointer"
                            >
                              <div>
                                <p className="font-bold text-xs text-slate-900">{c.name}</p>
                                {c.phone && <span className="text-[10px] text-slate-400 font-mono">{c.phone}</span>}
                              </div>
                              {selectedCustomerId === c.id && (
                                <Check size={14} className="text-amber-600 shrink-0" />
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Konfirmasi Transaksi Hutang Box */}
              {selectedCustomer && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
                  <p className="font-bold">Konfirmasi Pencatatan Hutang:</p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Transaksi sebesar <strong>{formatRupiah(total)}</strong> akan dicatat ke buku piutang atas nama <strong>{selectedCustomer.name}</strong> dan stok barang akan langsung berkurang.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Confirmation Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!canPay || isProcessing}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                canPay && !isProcessing
                  ? paymentMethod === 'debt'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/25 active:scale-95 cursor-pointer'
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/25 active:scale-95 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isProcessing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Memproses Transaksi...</span>
                </>
              ) : paymentMethod === 'debt' ? (
                <>
                  <BookOpen size={18} />
                  <span>Simpan sebagai Hutang</span>
                </>
              ) : paymentMethod === 'qris' ? (
                <>
                  <CheckCircle2 size={18} />
                  <span>Konfirmasi Pembayaran QRIS</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>Konfirmasi Pembayaran Tunai</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal Tambah Pelanggan Baru */}
      <CustomerModal
        isOpen={isAddCustomerModalOpen}
        onClose={() => setIsAddCustomerModalOpen(false)}
        onSuccess={(newCust) => {
          refetchCustomers();
          if (newCust?.id) {
            setSelectedCustomerId(newCust.id);
          }
        }}
      />
    </div>
  );
}
