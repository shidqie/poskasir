import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '@/services/customerService';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { User, Phone, MapPin, FileText, UserPlus, Save } from 'lucide-react';

export function CustomerModal({
  isOpen,
  onClose,
  customer = null, // null for add, object for edit
  onSuccess,
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const isEdit = Boolean(customer?.id);

  useEffect(() => {
    if (customer) {
      setName(customer.name || '');
      setPhone(customer.phone || '');
      setAddress(customer.address || '');
      setNotes(customer.notes || '');
    } else {
      setName('');
      setPhone('');
      setAddress('');
      setNotes('');
    }
    setErrorMsg('');
  }, [customer, isOpen]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error('Nama pelanggan wajib diisi.');

      if (isEdit) {
        return await customerService.updateCustomer(customer.id, {
          name: name.trim(),
          phone: phone.trim() || null,
          address: address.trim() || null,
          notes: notes.trim() || null,
        });
      } else {
        return await customerService.createCustomer({
          name: name.trim(),
          phone: phone.trim() || null,
          address: address.trim() || null,
          notes: notes.trim() || null,
        });
      }
    },
    onSuccess: (savedData) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers-with-debt'] });
      if (onSuccess) onSuccess(savedData);
      onClose();
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Gagal menyimpan data pelanggan.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    saveMutation.mutate();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-red-50 text-red-600">
            {isEdit ? <User size={18} /> : <UserPlus size={18} />}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isEdit ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}
            </h3>
            <p className="text-xs text-slate-400 font-normal">
              {isEdit
                ? 'Perbarui informasi kontak pelanggan'
                : 'Catat pelanggan baru untuk transaksi hutang atau bon'}
            </p>
          </div>
        </div>
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
            {errorMsg}
          </div>
        )}

        {/* Nama Pelanggan (Wajib) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Nama Pelanggan <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama pelanggan..."
              className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
            />
          </div>
        </div>

        {/* Nomor HP / WhatsApp (Opsional) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Nomor HP / WhatsApp <span className="text-slate-400 font-normal">(Opsional)</span>
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Nomor HP / WhatsApp..."
              className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
            />
          </div>
        </div>

        {/* Alamat (Opsional) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Alamat / Lokasi <span className="text-slate-400 font-normal">(Opsional)</span>
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Alamat / lokasi..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
            />
          </div>
        </div>

        {/* Catatan (Opsional) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Catatan Tambahan <span className="text-slate-400 font-normal">(Opsional)</span>
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan khusus pelanggan..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
            />
          </div>
        </div>

        {/* Tombol Aksi */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={saveMutation.isPending}
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={Save}
            loading={saveMutation.isPending}
          >
            {isEdit ? 'Perbarui Data' : 'Simpan Pelanggan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CustomerModal;
