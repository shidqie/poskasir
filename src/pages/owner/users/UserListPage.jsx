import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Avatar } from '@/components/common/Avatar';
import { Alert } from '@/components/common/Alert';
import { EmptyState } from '@/components/common/EmptyState';
import { Modal } from '@/components/common/Modal';
import { Users, UserPlus, ToggleLeft, ToggleRight, X, CheckCircle2 } from 'lucide-react';

function formatDate(dt) {
  return new Date(dt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function CreateCashierModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: () => userService.createCashier({ ...form }),
    onSuccess: () => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['cashiers'] });
      setTimeout(() => {
        setSuccess(false);
        setForm({ fullName: '', email: '', password: '' });
        onClose();
      }, 1500);
    },
    onError: (err) => {
      setError(err.message || 'Gagal membuat akun kasir.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    createMutation.mutate();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tambah Kasir Baru"
      subtitle="Daftarkan akun kasir untuk melayani penjualan di toko sembako"
      maxWidth="max-w-md"
    >
      {success ? (
        <div className="py-8 text-center space-y-2">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 size={24} />
          </div>
          <p className="font-bold text-slate-800 text-base">Kasir Berhasil Dibuat!</p>
          <p className="text-xs text-slate-500">Akun kasir sudah aktif dan siap digunakan untuk login.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="danger" title="Terjadi Kesalahan">
              {error}
            </Alert>
          )}

          <Input
            id="cashier-name"
            label="Nama Lengkap"
            placeholder="Contoh: Budi Santoso"
            required
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            disabled={createMutation.isPending}
          />

          <Input
            id="cashier-email"
            type="email"
            label="Alamat Email"
            placeholder="kasir@toko.com"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            disabled={createMutation.isPending}
          />

          <Input
            id="cashier-password"
            type="password"
            label="Kata Sandi Awal"
            placeholder="Minimal 6 karakter"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            disabled={createMutation.isPending}
            helperText="Kasir dapat login langsung dengan email dan kata sandi ini"
          />

          <div className="flex items-center justify-end gap-2.5 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createMutation.isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createMutation.isPending}
            >
              Simpan Kasir
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default function UserListPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: cashiers = [], isLoading, isError, error } = useQuery({
    queryKey: ['cashiers'],
    queryFn: () => userService.getCashiers(),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, newStatus }) => userService.toggleStatus(id, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashiers'] });
    },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Data Kasir' }]} />

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
        <Button
          onClick={() => setIsCreateOpen(true)}
          variant="primary"
          icon={UserPlus}
          className="shrink-0"
        >
          Tambah Kasir
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}
        {isError && (
          <Alert variant="danger" title="Gagal Memuat Data Kasir">
            {error?.message || 'Silakan coba beberapa saat lagi.'}
          </Alert>
        )}
        {!isLoading && !isError && cashiers.length === 0 && (
          <EmptyState
            icon={Users}
            title="Belum Ada Kasir"
            description="Tambahkan kasir pertama untuk mulai melayani penjualan di toko sembako."
            actionLabel="Tambah Kasir Baru"
            onAction={() => setIsCreateOpen(true)}
          />
        )}
        {cashiers.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 flex items-center justify-between gap-3 shadow-xs hover:border-red-200 transition-colors">
            <div className="flex items-center gap-3.5 min-w-0">
              <Avatar name={c.full_name || 'Kasir'} role="kasir" size="md" />
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
