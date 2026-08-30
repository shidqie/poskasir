import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/common/Button';
import { Camera, Clock, User, ShieldCheck, UserCheck, DoorOpen, DoorClosed, Coins, Wallet } from 'lucide-react';
import { formatRupiah } from '@/utils/formatters';

export function POSHeader({ onOpenScanner, activeSession, onOpenCashier }) {
  const { profile, role } = useAuthStore();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const formattedDate = time.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const isOpen = activeSession && activeSession.status === 'open';

  return (
    <header className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-2.5 shrink-0 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Terminal & Kasir Info */}
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Terminal Kasir / POS
              </h1>
              {isOpen ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Sesi Aktif
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onOpenCashier}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 cursor-pointer"
                >
                  <DoorClosed className="w-3 h-3 text-amber-700" />
                  Kasir Belum Dibuka
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
              <span className="flex items-center gap-1 font-bold text-slate-700">
                {role === 'owner' ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5 text-red-600" />
                )}
                {profile?.full_name || 'Kasir'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-mono text-slate-400">
                <Clock className="w-3 h-3 text-slate-400" />
                {formattedDate}, {formattedTime}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Realtime Shift Saldo Pill (If active session) */}
        {isOpen && (
          <div className="hidden md:flex items-center gap-3 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl text-xs">
            <div className="flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-slate-500 font-medium">Saldo Awal:</span>
              <span className="font-bold text-slate-800 font-mono">
                {formatRupiah(activeSession.opening_cash)}
              </span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-red-600" />
              <span className="text-slate-500 font-medium">Penjualan:</span>
              <span className="font-black text-red-600 font-mono">
                {formatRupiah(activeSession.total_sales || 0)}
              </span>
            </div>
          </div>
        )}

        {/* Right: Barcode Scanner Trigger Button */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="primary"
            icon={Camera}
            onClick={onOpenScanner}
            className="w-full sm:w-auto shadow-xs shadow-red-500/25 text-xs py-2 font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl"
          >
            Scan Barcode
          </Button>
        </div>
      </div>
    </header>
  );
}

export default POSHeader;
