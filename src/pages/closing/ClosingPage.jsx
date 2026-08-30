import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { transactionService } from '@/services/transactionService';
import { closingService } from '@/services/closingService';
import { DoorClosed, CheckCircle2, AlertCircle } from 'lucide-react';

const formatRupiah = (v) => `Rp${Number(v || 0).toLocaleString('id-ID')}`;

const parseRaw = (v) => {
  const n = Number(String(v).replace(/\D/g, ''));
  return isNaN(n) ? 0 : n;
};

export default function ClosingPage() {
  const { user, profile } = useAuthStore();
  const queryClient = useQueryClient();
  const [actualInput, setActualInput] = useState('');
  const [notes, setNotes] = useState('');

  // Ambil data transaksi hari ini
  const { data: todaySummary = {}, isLoading: summaryLoading } = useQuery({
    queryKey: ['today-summary', user?.id],
    queryFn: () => transactionService.getTodaySummary(user?.id),
    enabled: !!user?.id,
  });

  // Cek closing hari ini sudah dilakukan?
  const { data: existingClosing, isLoading: closingLoading } = useQuery({
    queryKey: ['today-closing', user?.id],
    queryFn: () => closingService.getTodayClosing(user?.id),
    enabled: !!user?.id,
  });

  const actualCash = parseRaw(actualInput);
  const systemCash = todaySummary.totalRevenue || 0;
  const difference = actualCash - systemCash;

  const closingMutation = useMutation({
    mutationFn: () =>
      closingService.createClosing({
        cashierId: user?.id,
        transactionCount: todaySummary.transactionCount || 0,
        totalSales: systemCash,
        systemCash,
        actualCash,
        notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-closing'] });
      queryClient.invalidateQueries({ queryKey: ['closings'] });
    },
  });

  const isLoading = summaryLoading || closingLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Sudah tutup kasir hari ini
  if (existingClosing || closingMutation.isSuccess) {
    const closing = closingMutation.data || existingClosing;
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-lg">
          <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-1">Kasir Sudah Ditutup</h2>
          <p className="text-sm text-slate-500 mb-5">Anda sudah melakukan closing hari ini.</p>

          <div className="space-y-2 text-sm text-left bg-slate-50 border border-slate-100 rounded-xl p-4">
            <div className="flex justify-between">
              <span className="text-slate-500">Transaksi</span>
              <span className="font-bold text-slate-800">{closing?.transaction_count || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Penjualan</span>
              <span className="font-bold text-slate-800">{formatRupiah(closing?.total_sales)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Uang Aktual</span>
              <span className="font-bold text-slate-800">{formatRupiah(closing?.actual_cash)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <span className="font-bold text-slate-700">Selisih</span>
              <span className={`font-black ${Number(closing?.difference) === 0 ? 'text-emerald-600' : Number(closing?.difference) > 0 ? 'text-red-600' : 'text-rose-600'}`}>
                {formatRupiah(Math.abs(closing?.difference || 0))}
                {Number(closing?.difference) > 0 ? ' (Lebih)' : Number(closing?.difference) < 0 ? ' (Kurang)' : ' (Pas)'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-lg mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100 shrink-0">
          <DoorClosed className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Tutup Kasir (Closing)</h1>
          <p className="text-xs sm:text-sm text-slate-500">Closing harian — {profile?.full_name}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Ringkasan Sistem */}
        <div className="bg-gradient-to-r from-red-600 via-red-700 to-rose-800 rounded-2xl p-5 text-white shadow-lg shadow-red-600/15 border border-red-500/30">
          <p className="text-red-100 text-xs font-medium mb-1">Total Penjualan Hari Ini (Sistem)</p>
          <p className="text-3xl font-black">{formatRupiah(systemCash)}</p>
          <p className="text-red-200 text-xs mt-1">{todaySummary.transactionCount || 0} transaksi selesai</p>
        </div>

        {/* Form Closing */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4 shadow-xs">
          <div>
            <label className="text-xs text-slate-600 font-semibold mb-1 block">Uang Fisik yang Dihitung (Rp)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={actualInput ? Number(actualInput.replace(/\D/g, '')).toLocaleString('id-ID') : ''}
                onChange={(e) => setActualInput(e.target.value.replace(/\D/g, ''))}
                placeholder="0"
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-right text-lg font-black outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>

          {/* Selisih */}
          {actualCash > 0 && (
            <div className={`rounded-xl p-3.5 flex items-center gap-2.5 ${
              difference === 0 ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : difference > 0 ? 'bg-amber-50 border border-amber-200 text-amber-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}>
              <AlertCircle size={18} className={difference === 0 ? 'text-emerald-600' : difference > 0 ? 'text-amber-600' : 'text-rose-600'} />
              <div className="text-sm">
                <span className="font-black">
                  Selisih: {formatRupiah(Math.abs(difference))}
                </span>
                <span className="text-xs ml-1 font-semibold opacity-80">
                  {difference === 0 ? '(Uang pas)' : difference > 0 ? '(Lebih)' : '(Kurang)'}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-slate-600 font-semibold mb-1 block">Catatan (opsional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Mis. ada kembalian salah Rp500, dll..."
              rows={3}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-500 font-medium resize-none"
            />
          </div>

          <button
            onClick={() => closingMutation.mutate()}
            disabled={!actualCash || closingMutation.isPending}
            className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-base transition-all shadow-md shadow-red-500/25 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            {closingMutation.isPending ? (
              <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Menyimpan...</>
            ) : (
              <><DoorClosed size={16} />Tutup Kasir Sekarang</>
            )}
          </button>

          {closingMutation.isError && (
            <p className="text-xs text-rose-600 font-semibold text-center">
              {closingMutation.error?.message || 'Gagal menyimpan closing.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
