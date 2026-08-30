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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Sudah tutup kasir hari ini
  if (existingClosing || closingMutation.isSuccess) {
    const closing = closingMutation.data || existingClosing;
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 p-6 text-center">
          <CheckCircle2 size={48} className="text-green-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900 mb-1">Kasir Sudah Ditutup</h2>
          <p className="text-sm text-gray-500 mb-5">Anda sudah melakukan closing hari ini.</p>

          <div className="space-y-2 text-sm text-left bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between">
              <span className="text-gray-500">Transaksi</span>
              <span className="font-semibold">{closing?.transaction_count || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total Penjualan</span>
              <span className="font-semibold">{formatRupiah(closing?.total_sales)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Uang Aktual</span>
              <span className="font-semibold">{formatRupiah(closing?.actual_cash)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold text-gray-700">Selisih</span>
              <span className={`font-bold ${Number(closing?.difference) === 0 ? 'text-green-600' : Number(closing?.difference) > 0 ? 'text-blue-600' : 'text-red-600'}`}>
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
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <DoorClosed size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">Tutup Kasir</h1>
            <p className="text-xs text-gray-500">Closing harian — {profile?.full_name}</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 sm:px-6 py-5 space-y-4">
        {/* Ringkasan Sistem */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
          <p className="text-blue-100 text-xs mb-1">Total Penjualan Hari Ini (Sistem)</p>
          <p className="text-3xl font-black">{formatRupiah(systemCash)}</p>
          <p className="text-blue-200 text-xs mt-1">{todaySummary.transactionCount || 0} transaksi selesai</p>
        </div>

        {/* Form Closing */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Uang Fisik yang Dihitung (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={actualInput ? Number(actualInput.replace(/\D/g, '')).toLocaleString('id-ID') : ''}
                onChange={(e) => setActualInput(e.target.value.replace(/\D/g, ''))}
                placeholder="0"
                className="w-full pl-9 pr-4 py-3 border-2 border-gray-200 rounded-xl text-right text-lg font-semibold outline-none focus:border-blue-400 transition-colors"
              />
            </div>
          </div>

          {/* Selisih */}
          {actualCash > 0 && (
            <div className={`rounded-xl p-3 flex items-center gap-2 ${
              difference === 0 ? 'bg-green-50 border border-green-200'
              : difference > 0 ? 'bg-blue-50 border border-blue-200'
              : 'bg-red-50 border border-red-200'
            }`}>
              <AlertCircle size={16} className={difference === 0 ? 'text-green-600' : difference > 0 ? 'text-blue-600' : 'text-red-600'} />
              <div className="text-sm">
                <span className={`font-semibold ${difference === 0 ? 'text-green-700' : difference > 0 ? 'text-blue-700' : 'text-red-700'}`}>
                  Selisih: {formatRupiah(Math.abs(difference))}
                </span>
                <span className="text-xs ml-1 opacity-70">
                  {difference === 0 ? '(Uang pas)' : difference > 0 ? '(Lebih)' : '(Kurang)'}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Catatan (opsional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Mis. ada kembalian salah Rp500, dll..."
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 resize-none"
            />
          </div>

          <button
            onClick={() => closingMutation.mutate()}
            disabled={!actualCash || closingMutation.isPending}
            className="w-full py-3 rounded-xl bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {closingMutation.isPending ? (
              <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Menyimpan...</>
            ) : (
              <><DoorClosed size={16} />Tutup Kasir Sekarang</>
            )}
          </button>

          {closingMutation.isError && (
            <p className="text-xs text-red-600 text-center">
              {closingMutation.error?.message || 'Gagal menyimpan closing.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
