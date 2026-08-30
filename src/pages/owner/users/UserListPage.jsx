import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { Users, UserPlus, ToggleLeft, ToggleRight, X, CheckCircle2 } from 'lucide-react';

function formatDate(dt) {
  return new Date(dt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function CreateCashierModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [success, setSuccess] = useState(false);

  const createMutation = useMutation({
    mutationFn: () => userService.createCashier({ ...form }),
    onSuccess: () => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['cashiers'] });
      setTimeout(() => { setSuccess(false); setForm({ fullName: '', email: '', password: '' }); onClose(); }, 2000);
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="bg-gradient-to-r from-red-600 to-rose-700 px-5 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-base">Tambah Kasir Baru</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white">
            <X size={14} />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-2" />
            <p className="font-bold text-slate-800">Kasir berhasil dibuat!</p>
            <p className="text-xs text-slate-500 mt-1">Akun kasir aktif dan siap digunakan.</p>
          </div>
        ) : (
          <div className="p-5 space-y-3">
            <div>
              <label className="text-xs text-slate-600 font-semibold mb-1 block">Nama Lengkap</label>
              <input type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Mis. Siti Rahma" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-500 font-medium" />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-semibold mb-1 block">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="kasir@toko.com" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-500 font-medium" />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-semibold mb-1 block">Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min. 6 karakter" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-500 font-medium" />
            </div>

            <button
              onClick={() => createMutation.mutate()}
              disabled={!form.fullName || !form.email || !form.password || createMutation.isPending}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm transition-all shadow-md shadow-red-500/25 active:scale-95 cursor-pointer"
            >
              {createMutation.isPending ? 'Membuat akun...' : 'Buat Akun Kasir'}
            </button>
            {createMutation.isError && (
              <p className="text-xs text-red-600 font-semibold text-center">{createMutation.error?.message}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function UserListPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: cashiers = [], isLoading } = useQuery({
    queryKey: ['cashiers'],
    queryFn: () => userService.getCashiers(),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, newStatus }) => userService.toggleCashierStatus(id, newStatus),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cashiers'] }),
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Data Kasir</h1>
            <p className="text-xs sm:text-sm text-slate-500">{cashiers.length} kasir terdaftar di toko</p>
          </div>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all shadow-md shadow-red-500/25 active:scale-95 cursor-pointer"
        >
          <UserPlus size={16} />
          Tambah Kasir
        </button>
      </div>

      <div className="space-y-3">
        {isLoading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}
        {!isLoading && cashiers.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-400">
            <Users size={36} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm font-bold text-slate-700">Belum ada kasir</p>
            <p className="text-xs text-slate-400 mt-1">Tambahkan kasir pertama untuk mulai melayani penjualan.</p>
          </div>
        )}
        {cashiers.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 flex items-center justify-between gap-3 shadow-xs hover:border-red-200 transition-colors">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-100 font-black text-sm flex items-center justify-center shrink-0">
                {c.full_name?.charAt(0)?.toUpperCase() || 'K'}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 text-sm truncate">{c.full_name}</p>
                <p className="text-xs text-slate-400">Bergabung {formatDate(c.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${c.status ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                {c.status ? 'Aktif' : 'Nonaktif'}
              </span>
              <button
                onClick={() => toggleMutation.mutate({ id: c.id, newStatus: !c.status })}
                disabled={toggleMutation.isPending}
                className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                title={c.status ? 'Nonaktifkan' : 'Aktifkan'}
              >
                {c.status
                  ? <ToggleRight size={28} className="text-emerald-500" />
                  : <ToggleLeft size={28} className="text-slate-300" />
                }
              </button>
            </div>
          </div>
        ))}
      </div>

      <CreateCashierModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
