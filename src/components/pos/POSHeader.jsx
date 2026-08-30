import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import {
  Camera,
  Clock,
  ShieldCheck,
  UserCheck,
  DoorClosed,
  DoorOpen,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { formatRupiah } from '@/utils/formatters';

export function POSHeader({
  onOpenScanner,
  activeSession,
  onOpenCashier,
  onOpenCashMovement,
}) {
  const { profile, role } = useAuthStore();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedDate = time.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const isOpen = activeSession && activeSession.status === 'open';
  const closingUrl = role === 'owner' ? '/owner/closing' : '/closing';

  return (
    <header className="bg-white border-b border-slate-100 px-3 sm:px-5 py-2 shrink-0">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Terminal & Kasir Info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 bg-slate-50 border border-slate-100 p-0.5">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight whitespace-nowrap">
                Terminal Kasir
              </h1>

              {isOpen ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Aktif
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onOpenCashier}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 cursor-pointer shrink-0 transition-colors"
                >
                  <DoorOpen className="w-3 h-3 text-amber-700" />
                  Buka Kasir
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 leading-none mt-0.5 truncate">
              <span className="font-medium text-slate-600 truncate">
                {profile?.full_name || 'Kasir'}
              </span>
              <span>·</span>
              <span className="font-mono text-slate-400 whitespace-nowrap">
                {formattedDate}, {formattedTime}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Minimalist Realtime Shift Saldo Pill */}
        {isOpen && (
          <div className="hidden md:flex items-center gap-2.5 bg-slate-50 border border-slate-200/70 px-3 py-1 rounded-lg text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <span>Laci:</span>
              <span className="font-bold text-slate-800 font-mono">
                {formatRupiah(activeSession.expected_cash || activeSession.opening_cash)}
              </span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1">
              <span>Penjualan:</span>
              <span className="font-bold text-slate-800 font-mono">
                {formatRupiah(activeSession.total_sales || 0)}
              </span>
            </div>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {isOpen && (
            <>
              {onOpenCashMovement && (
                <>
                  <button
                    type="button"
                    onClick={() => onOpenCashMovement('cash_in')}
                    className="hidden xl:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50/50 text-xs font-semibold transition-colors cursor-pointer"
                    title="Catat Uang Masuk ke Kas"
                  >
                    <ArrowDownLeft size={12} className="text-emerald-600" />
                    <span>+ Kas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenCashMovement('cash_out')}
                    className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-700 hover:border-rose-200 hover:bg-rose-50/50 text-xs font-semibold transition-colors cursor-pointer"
                    title="Ambil Uang dari Laci Kas"
                  >
                    <ArrowUpRight size={12} className="text-rose-600" />
                    <span>Tarik Kas</span>
                  </button>
                </>
              )}

              {/* Tombol Tutup Kasir Langsung */}
              <Link
                to={closingUrl}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer"
                title="Tutup Kasir & Rekapitulasi Shift"
              >
                <DoorClosed className="w-3.5 h-3.5 text-slate-600" />
                <span>Tutup Kasir</span>
              </Link>
            </>
          )}

          {!isOpen && (
            <button
              type="button"
              onClick={onOpenCashier}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <DoorOpen className="w-3.5 h-3.5" />
              <span>Buka Kasir</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenScanner}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Camera size={14} />
            <span>Scan Barcode</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default POSHeader;
