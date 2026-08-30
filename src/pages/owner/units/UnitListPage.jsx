import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { unitService } from '@/services/unitService';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Toast } from '@/components/common/Toast';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { EmptyState } from '@/components/common/EmptyState';
import { Alert } from '@/components/common/Alert';
import { UnitFormModal } from './UnitFormModal';
import { Plus, Edit2, ToggleLeft, ToggleRight, Scale, Search, Check, X, Trash2 } from 'lucide-react';

export function UnitListPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    unit: null,
  });
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    unit: null,
  });
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' });

  // Query Satuan
  const { data: units = [], isLoading, isError, error } = useQuery({
    queryKey: ['units'],
    queryFn: () => unitService.getUnits(),
  });

  // Mutation Tambah / Update Satuan
  const saveMutation = useMutation({
    mutationFn: (unitData) => {
      if (selectedUnit) {
        return unitService.updateUnit(selectedUnit.id, unitData);
      }
      return unitService.createUnit(unitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      setToast({
        isOpen: true,
        message: selectedUnit
          ? 'Satuan berhasil diperbarui.'
          : 'Satuan baru berhasil ditambahkan.',
        type: 'success',
      });
      setIsModalOpen(false);
      setSelectedUnit(null);
    },
  });

  // Mutation Toggle Status
  const toggleStatusMutation = useMutation({
    mutationFn: (unit) =>
      unitService.updateUnit(unit.id, { status: !unit.status }),
    onSuccess: (_, unit) => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      setToast({
        isOpen: true,
        message: `Status satuan berhasil diubah menjadi ${
          !unit.status ? 'Aktif' : 'Tidak Aktif'
        }.`,
        type: 'success',
      });
    },
  });

  // Mutation Hapus Satuan
  const deleteMutation = useMutation({
    mutationFn: (id) => unitService.deleteUnit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      setToast({
        isOpen: true,
        message: 'Satuan berhasil dihapus.',
        type: 'success',
      });
      setDeleteDialog({ isOpen: false, unit: null });
    },
    onError: (err) => {
      setToast({
        isOpen: true,
        message: err.message || 'Gagal menghapus satuan.',
        type: 'error',
      });
      setDeleteDialog({ isOpen: false, unit: null });
    },
  });

  const handleOpenAdd = () => {
    setSelectedUnit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (unit) => {
    setSelectedUnit(unit);
    setIsModalOpen(true);
  };

  const handleToggleClick = (unit) => {
    setConfirmDialog({
      isOpen: true,
      unit: unit,
    });
  };

  const handleConfirmToggle = async () => {
    if (confirmDialog.unit) {
      await toggleStatusMutation.mutateAsync(confirmDialog.unit);
      setConfirmDialog({ isOpen: false, unit: null });
    }
  };

  const handleDeleteClick = (unit) => {
    setDeleteDialog({
      isOpen: true,
      unit: unit,
    });
  };

  const handleConfirmDelete = async () => {
    if (deleteDialog.unit) {
      await deleteMutation.mutateAsync(deleteDialog.unit.id);
    }
  };

  // Filter Satuan
  const filteredUnits = units.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Satuan Barang' }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Satuan Barang
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Kelola satuan ukuran unit barang (Pcs, Kg, Dus, Liter, dll)
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={handleOpenAdd}
          variant="primary"
          icon={Plus}
          className="shrink-0"
        >
          Tambah Satuan
        </Button>
      </div>

      {/* Toolbar & Search */}
      <Card bodyClassName="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Cari nama atau simbol satuan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors"
            />
          </div>

          <div className="text-xs text-slate-500">
            Total: <span className="font-semibold text-slate-900">{filteredUnits.length}</span> satuan
          </div>
        </div>
      </Card>

      {/* Main Table Content */}
      <Card bodyClassName="p-0 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center">
            <LoadingSpinner size="md" message="Memuat data satuan..." />
          </div>
        ) : isError ? (
          <div className="p-6">
            <Alert variant="danger" title="Gagal Memuat Data Satuan">
              {error?.message || 'Silakan coba beberapa saat lagi.'}
            </Alert>
          </div>
        ) : filteredUnits.length === 0 ? (
          <EmptyState
            icon={Scale}
            title={searchTerm ? 'Satuan Tidak Ditemukan' : 'Belum Ada Satuan'}
            description={
              searchTerm
                ? `Tidak ditemukan satuan dengan kata kunci "${searchTerm}".`
                : 'Klik tombol Tambah Satuan untuk mendaftarkan unit ukuran barang baru.'
            }
            actionLabel={searchTerm ? null : 'Tambah Satuan Baru'}
            onAction={handleOpenAdd}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Nama Satuan</th>
                  <th className="px-6 py-3.5">Simbol</th>
                  <th className="px-6 py-3.5 text-center">Tipe Desimal</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredUnits.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 text-slate-900 font-semibold">
                      {u.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-mono text-xs font-bold border border-slate-200">
                        {u.symbol}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {u.allow_decimal ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                          <Check className="w-3.5 h-3.5 text-red-600" />
                          Ya (Pecahan/Timbangan)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                          <X className="w-3.5 h-3.5 text-slate-400" />
                          Tidak (Bilangan Bulat)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                          title="Ubah Satuan"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleClick(u)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            u.status
                              ? 'text-emerald-600 hover:bg-emerald-50'
                              : 'text-slate-400 hover:bg-slate-100'
                          }`}
                          title={u.status ? 'Nonaktifkan Satuan' : 'Aktifkan Satuan'}
                        >
                          {u.status ? (
                            <ToggleRight className="w-5 h-5" />
                          ) : (
                            <ToggleLeft className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteClick(u)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Hapus Satuan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Form Modal */}
      <UnitFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(data) => saveMutation.mutateAsync(data)}
        initialData={selectedUnit}
        isLoading={saveMutation.isPending}
      />

      {/* Toggle Status Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, unit: null })}
        onConfirm={handleConfirmToggle}
        title={confirmDialog.unit?.status ? 'Nonaktifkan Satuan?' : 'Aktifkan Satuan?'}
        message={
          confirmDialog.unit?.status
            ? `Satuan "${confirmDialog.unit?.name}" akan diset tidak aktif. Satuan yang tidak aktif tidak akan muncul saat membuat produk baru.`
            : `Satuan "${confirmDialog.unit?.name}" akan diaktifkan kembali.`
        }
        confirmText={confirmDialog.unit?.status ? 'Nonaktifkan' : 'Aktifkan'}
        type={confirmDialog.unit?.status ? 'warning' : 'info'}
        isLoading={toggleStatusMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, unit: null })}
        onConfirm={handleConfirmDelete}
        title="Hapus Satuan?"
        message={`Apakah Anda yakin ingin menghapus satuan "${deleteDialog.unit?.name} (${deleteDialog.unit?.symbol})"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Satuan"
        type="danger"
        isLoading={deleteMutation.isPending}
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

export default UnitListPage;
