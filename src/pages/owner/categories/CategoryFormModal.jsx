import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';

export function CategoryFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isLoading = false,
}) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
    } else {
      setName('');
    }
    setError('');
  }, [initialData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama kategori wajib diisi.');
      return;
    }
    try {
      await onSubmit({ name: name.trim() });
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan kategori.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Ubah Kategori Barang' : 'Tambah Kategori Barang'}
      subtitle="Kategori digunakan untuk mengelompokkan jenis produk di toko"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="category-name"
          name="name"
          label="Nama Kategori"
          placeholder="Contoh: Sembako, Minuman, Bumbu..."
          required
          autoFocus
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          error={error}
          disabled={isLoading}
        />

        <div className="flex items-center justify-end gap-2.5 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {initialData ? 'Simpan Perubahan' : 'Tambah Kategori'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CategoryFormModal;
