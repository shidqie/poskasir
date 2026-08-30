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
      <div className="relative w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 flex items-center justify-between">
          <h2 className="text-white font-semibold">Tambah Kasir Baru</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <X size={14} className="text-white" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <CheckCircle2 size={40} className="text-green-500 mx-auto mb-2" />
            <p className="font-semibold text-gray-800">Kasir berhasil dibuat!</p>
            <p className="text-xs text-gray-500 mt-1">Link konfirmasi dikirim ke email kasir.</p>
          </div>
        ) : (
          <div className="p-5 space-y-3">
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">Nama Lengkap</label>
              <input type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Mis. Budi Santoso" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="kasir@toko.com" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min. 6 karakter" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400" />
            </div>

            <button
              onClick={() => createMutation.mutate()}
              disabled={!form.fullName || !form.email || !form.password || createMutation.isPending}
              className="w-full py-3 rounded-xl bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold text-sm transition-colors"
            >
              {createMutation.isPending ? 'Membuat akun...' : 'Buat Akun Kasir'}
            </button>
            {createMutation.isError && (
              <p className="text-xs text-red-600 text-center">{createMutation.error?.message}</p>
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
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <Users size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">Data Kasir</h1>
              <p className="text-xs text-gray-500">{cashiers.length} kasir terdaftar</p>
            </div>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <UserPlus size={14} />
            Tambah Kasir
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 space-y-2">
        {isLoading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}
        {!isLoading && cashiers.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Users size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Belum ada kasir. Tambahkan kasir pertama.</p>
          </div>
        )}
        {cashiers.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">
                {c.full_name?.charAt(0)?.toUpperCase() || 'K'}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{c.full_name}</p>
                <p className="text-xs text-gray-400">Bergabung {formatDate(c.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${c.status ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {c.status ? 'Aktif' : 'Nonaktif'}
              </span>
              <button
                onClick={() => toggleMutation.mutate({ id: c.id, newStatus: !c.status })}
                disabled={toggleMutation.isPending}
                className="text-gray-400 hover:text-blue-600 transition-colors"
                title={c.status ? 'Nonaktifkan' : 'Aktifkan'}
              >
                {c.status
                  ? <ToggleRight size={24} className="text-green-500" />
                  : <ToggleLeft size={24} className="text-gray-400" />
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
