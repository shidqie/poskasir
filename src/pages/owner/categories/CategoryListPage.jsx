import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '@/services/categoryService';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Toast } from '@/components/common/Toast';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { EmptyState } from '@/components/common/EmptyState';
import { Alert } from '@/components/common/Alert';
import { CategoryFormModal } from './CategoryFormModal';
import { Plus, Edit2, ToggleLeft, ToggleRight, Layers, Search } from 'lucide-react';

export function CategoryListPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    category: null,
  });
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' });

  // Query Data Kategori
  const { data: categories = [], isLoading, isError, error } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories(),
  });

  // Mutation Tambah / Update Kategori
  const saveMutation = useMutation({
    mutationFn: (categoryData) => {
      if (selectedCategory) {
        return categoryService.updateCategory(selectedCategory.id, categoryData);
      }
      return categoryService.createCategory(categoryData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setToast({
        isOpen: true,
        message: selectedCategory
          ? 'Kategori berhasil diperbarui.'
          : 'Kategori baru berhasil ditambahkan.',
        type: 'success',
      });
      setIsModalOpen(false);
      setSelectedCategory(null);
    },
  });

  // Mutation Toggle Status
  const toggleStatusMutation = useMutation({
    mutationFn: (category) =>
      categoryService.updateCategory(category.id, { status: !category.status }),
    onSuccess: (_, category) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setToast({
        isOpen: true,
        message: `Status kategori berhasil diubah menjadi ${
          !category.status ? 'Aktif' : 'Tidak Aktif'
        }.`,
        type: 'success',
      });
    },
  });

  const handleOpenAdd = () => {
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setSelectedCategory(cat);
    setIsModalOpen(true);
  };

  const handleToggleClick = (cat) => {
    setConfirmDialog({
      isOpen: true,
      category: cat,
    });
  };

  const handleConfirmToggle = async () => {
    if (confirmDialog.category) {
      await toggleStatusMutation.mutateAsync(confirmDialog.category);
      setConfirmDialog({ isOpen: false, category: null });
    }
  };

  // Filter Kategori
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Kategori Barang' }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Kategori Barang
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Kelola kelompok jenis barang untuk kemudahan pencarian dan penataan toko
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
          Tambah Kategori
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
              placeholder="Cari kategori..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors"
            />
          </div>

          <div className="text-xs text-slate-500">
            Total: <span className="font-semibold text-slate-900">{filteredCategories.length}</span> kategori
          </div>
        </div>
      </Card>

      {/* Main Table Content */}
      <Card bodyClassName="p-0 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center">
            <LoadingSpinner size="md" message="Memuat data kategori..." />
          </div>
        ) : isError ? (
          <div className="p-6">
            <Alert variant="danger" title="Gagal Memuat Data Kategori">
              {error?.message || 'Silakan coba beberapa saat lagi.'}
            </Alert>
          </div>
        ) : filteredCategories.length === 0 ? (
          <EmptyState
            icon={Layers}
            title={searchTerm ? 'Kategori Tidak Ditemukan' : 'Belum Ada Kategori'}
            description={
              searchTerm
                ? `Tidak ditemukan kategori dengan kata kunci "${searchTerm}".`
                : 'Klik tombol Tambah Kategori untuk menambahkan kelompok produk baru.'
            }
            actionLabel={searchTerm ? null : 'Tambah Kategori Baru'}
            onAction={handleOpenAdd}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Nama Kategori</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 text-slate-900 font-semibold">
                      {cat.name}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={cat.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(cat)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Ubah Nama Kategori"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleClick(cat)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            cat.status
                              ? 'text-emerald-600 hover:bg-emerald-50'
                              : 'text-slate-400 hover:bg-slate-100'
                          }`}
                          title={cat.status ? 'Nonaktifkan Kategori' : 'Aktifkan Kategori'}
                        >
                          {cat.status ? (
                            <ToggleRight className="w-5 h-5" />
                          ) : (
                            <ToggleLeft className="w-5 h-5" />
                          )}
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
      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(data) => saveMutation.mutateAsync(data)}
        initialData={selectedCategory}
        isLoading={saveMutation.isPending}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, category: null })}
        onConfirm={handleConfirmToggle}
        title={confirmDialog.category?.status ? 'Nonaktifkan Kategori?' : 'Aktifkan Kategori?'}
        message={
          confirmDialog.category?.status
            ? `Kategori "${confirmDialog.category?.name}" akan diset tidak aktif. Kategori yang tidak aktif tidak akan muncul saat membuat produk baru.`
            : `Kategori "${confirmDialog.category?.name}" akan diaktifkan kembali.`
        }
        confirmText={confirmDialog.category?.status ? 'Nonaktifkan' : 'Aktifkan'}
        type={confirmDialog.category?.status ? 'warning' : 'info'}
        isLoading={toggleStatusMutation.isPending}
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

export default CategoryListPage;
