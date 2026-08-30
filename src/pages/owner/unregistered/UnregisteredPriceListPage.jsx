import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { unregisteredPriceService } from '@/services/unregisteredPriceService';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Select } from '@/components/common/Select';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { EmptyState } from '@/components/common/EmptyState';
import { Alert } from '@/components/common/Alert';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Toast } from '@/components/common/Toast';
import { UnregisteredPriceModal } from '@/components/prices/UnregisteredPriceModal';
import { ConvertToProductModal } from './ConvertToProductModal';
import { formatRupiah, formatTanggal } from '@/utils/formatters';
import {
  Tag,
  Plus,
  Search,
  Sparkles,
  Barcode,
  Clock,
  User,
  PowerOff,
  CheckCircle2,
} from 'lucide-react';

export function UnregisteredPriceListPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('pending');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [convertModal, setConvertModal] = useState({ isOpen: false, item: null });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, item: null });
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' });

  // Query Data
  const {
    data: items = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['unregistered-prices', { search, status }],
    queryFn: () => unregisteredPriceService.getUnregisteredPrices({ search, status }),
  });

  // Mutation Tambah Harga Sementara
  const addMutation = useMutation({
    mutationFn: (data) => unregisteredPriceService.createUnregisteredPrice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unregistered-prices'] });
      queryClient.invalidateQueries({ queryKey: ['prices'] });
      setToast({
        isOpen: true,
        message: 'Harga barang belum terdaftar berhasil dicatat.',
        type: 'success',
      });
    },
  });

  // Mutation Konversi ke Data Barang
  const convertMutation = useMutation({
    mutationFn: ({ id, productData }) =>
      unregisteredPriceService.convertToProduct(id, productData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unregistered-prices'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['prices'] });
      setToast({
        isOpen: true,
        message: 'Barang berhasil dikonversi menjadi Data Barang resmi!',
        type: 'success',
      });
    },
  });

  // Mutation Deactivate
  const deactivateMutation = useMutation({
    mutationFn: (id) => unregisteredPriceService.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unregistered-prices'] });
      queryClient.invalidateQueries({ queryKey: ['prices'] });
      setToast({
        isOpen: true,
        message: 'Data harga sementara berhasil dinonaktifkan.',
        type: 'success',
      });
    },
  });

  const handleDeactivateClick = (item) => {
    setConfirmDialog({
      isOpen: true,
      item,
    });
  };

  const handleConfirmDeactivate = async () => {
    if (confirmDialog.item) {
      await deactivateMutation.mutateAsync(confirmDialog.item.id);
      setConfirmDialog({ isOpen: false, item: null });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Barang Belum Terdaftar' }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Barang Belum Terdaftar
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Daftar harga sementara yang dicatat oleh Kasir/Pemilik saat melayani transaksi
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          variant="primary"
          icon={Plus}
          className="shrink-0"
        >
          Tambah Harga Sementara
        </Button>
      </div>

      {/* Toolbar & Filter */}
      <Card bodyClassName="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Cari nama atau barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              placeholder={null}
              options={[
                { value: 'all', label: 'Semua Status' },
                { value: 'pending', label: 'Belum Terdaftar (Pending)' },
                { value: 'converted', label: 'Telah Jadi Produk' },
                { value: 'inactive', label: 'Dinonaktifkan' },
              ]}
              selectClassName="py-2 bg-slate-50"
            />

            <span className="text-xs text-slate-500 whitespace-nowrap">
              Total: <span className="font-bold text-slate-900">{items.length}</span>
            </span>
          </div>
        </div>
      </Card>

      {/* Main Table */}
      <Card bodyClassName="p-0 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center">
            <LoadingSpinner size="md" message="Memuat data harga sementara..." />
          </div>
        ) : isError ? (
          <div className="p-6">
            <Alert variant="danger" title="Gagal Memuat Data">
              {error?.message || 'Silakan coba beberapa saat lagi.'}
            </Alert>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Tag}
            title={search ? 'Data Tidak Ditemukan' : 'Tidak Ada Catatan Harga Sementara'}
            description={
              status === 'pending'
                ? 'Semua harga sementara telah dikonversi atau belum ada data baru yang dicatat.'
                : 'Pilih filter status lain atau tambahkan catatan harga sementara baru.'
            }
            actionLabel="Tambah Harga Sementara"
            onAction={() => setIsAddModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Nama & Barcode</th>
                  <th className="px-6 py-3.5 text-right">Harga Jual</th>
                  <th className="px-6 py-3.5">Satuan</th>
                  <th className="px-6 py-3.5">Dibuat Oleh</th>
                  <th className="px-6 py-3.5">Tanggal</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Nama & Barcode */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-900 line-clamp-1">
                          {item.name}
                        </p>
                        {item.barcode ? (
                          <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500 font-mono">
                            <Barcode className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.barcode}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Tanpa Barcode</span>
                        )}
                        {item.notes && (
                          <p className="text-xs text-slate-500 mt-1 italic line-clamp-1">
                            Ket: {item.notes}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Harga Jual */}
                    <td className="px-6 py-4 text-right font-bold text-slate-900 font-mono">
                      {formatRupiah(item.selling_price)}
                    </td>

                    {/* Satuan */}
                    <td className="px-6 py-4 text-slate-600">
                      {item.unit_name || <span className="text-slate-400">-</span>}
                    </td>

                    {/* Dibuat Oleh */}
                    <td className="px-6 py-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.creator?.full_name || 'Kasir'}</span>
                      </div>
                    </td>

                    {/* Tanggal */}
                    <td className="px-6 py-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatTanggal(item.created_at)}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={item.status} type="unregistered_status" />
                    </td>

                    {/* Aksi */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="primary"
                              icon={Sparkles}
                              onClick={() => setConvertModal({ isOpen: true, item })}
                              className="text-xs py-1.5 px-2.5"
                            >
                              Jadikan Data Barang
                            </Button>
                            <button
                              onClick={() => handleDeactivateClick(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Nonaktifkan Catatan Ini"
                            >
                              <PowerOff className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {item.status === 'converted' && (
                          <span className="text-xs text-emerald-600 font-semibold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Telah Menjadi Produk
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Tambah Harga Sementara */}
      <UnregisteredPriceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={(data) => addMutation.mutateAsync(data)}
        isLoading={addMutation.isPending}
      />

      {/* Modal Konversi ke Data Barang */}
      <ConvertToProductModal
        isOpen={convertModal.isOpen}
        onClose={() => setConvertModal({ isOpen: false, item: null })}
        unregisteredItem={convertModal.item}
        onSubmit={(id, productData) =>
          convertMutation.mutateAsync({ id, productData })
        }
        isLoading={convertMutation.isPending}
      />

      {/* Dialog Konfirmasi Nonaktifkan */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, item: null })}
        onConfirm={handleConfirmDeactivate}
        title="Nonaktifkan Harga Sementara?"
        message={`Data "${confirmDialog.item?.name}" akan dinonaktifkan dan tidak akan muncul lagi di pencarian harga.`}
        confirmText="Nonaktifkan"
        type="warning"
        isLoading={deactivateMutation.isPending}
      />

      {/* Toast Feedback */}
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
    </div>
  );
}

export default UnregisteredPriceListPage;
