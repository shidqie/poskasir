import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockService } from '@/services/stockService';
import { productService } from '@/services/productService';
import { useAuthStore } from '@/stores/authStore';
import { Boxes, Search, CheckCircle2 } from 'lucide-react';

const MOVEMENT_TYPES = [
  { value: 'stock_in', label: 'Barang Masuk (+)', color: 'text-green-600 bg-green-50 border-green-200' },
  { value: 'stock_out', label: 'Barang Keluar (-)', color: 'text-red-600 bg-red-50 border-red-200' },
  { value: 'adjustment', label: 'Koreksi Stok (=)', color: 'text-blue-600 bg-blue-50 border-blue-200' },
];

export default function StockAdjustmentPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [movementType, setMovementType] = useState('stock_in');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [success, setSuccess] = useState(null);

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products-search', searchTerm],
    queryFn: () => productService.getProducts({ search: searchTerm }),
    enabled: searchTerm.trim().length > 1,
  });

  const adjustMutation = useMutation({
    mutationFn: () =>
      stockService.adjustStock({
        productId: selectedProduct.id,
        movementType,
        quantity: Number(quantity),
        notes,
        userId: user?.id,
      }),
    onSuccess: (result) => {
      setSuccess({ product: selectedProduct, newStock: result.stockAfter, movementType });
      setSelectedProduct(null);
      setQuantity('');
      setNotes('');
      setSearchTerm('');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <Boxes size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">Penyesuaian Stok</h1>
            <p className="text-xs text-gray-500">Catat perubahan stok barang secara manual</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        {/* Success notification */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle2 size={20} className="text-green-600 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-green-800">Stok berhasil disesuaikan!</p>
              <p className="text-green-700 text-xs mt-0.5">
                {success.product.name} → Stok baru: <strong>{success.newStock}</strong>
              </p>
            </div>
            <button onClick={() => setSuccess(null)} className="ml-auto text-green-500 hover:text-green-700 text-xs">Tutup</button>
          </div>
        )}

        {/* Pilih Produk */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
          <h3 className="font-semibold text-gray-800 text-sm">1. Pilih Barang</h3>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setSelectedProduct(null); }}
              placeholder="Ketik nama atau barcode barang..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
            />
          </div>

          {/* Hasil pencarian */}
          {searchTerm.trim().length > 1 && !selectedProduct && (
            <div className="border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
              {productsLoading && <p className="text-center text-xs text-gray-400 py-3">Mencari...</p>}
              {!productsLoading && products.length === 0 && (
                <p className="text-center text-xs text-gray-400 py-3">Barang tidak ditemukan</p>
              )}
              {products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedProduct(p); setSearchTerm(p.name); }}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-50 transition-colors text-sm border-b border-gray-50 last:border-0"
                >
                  <span className="font-medium text-gray-800 text-left truncate">{p.name}</span>
                  <span className="text-xs text-gray-500 shrink-0 ml-2">Stok: {p.stock}</span>
                </button>
              ))}
            </div>
          )}

          {/* Barang terpilih */}
          {selectedProduct && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-800">{selectedProduct.name}</p>
                <p className="text-xs text-blue-600">Stok saat ini: {selectedProduct.stock}</p>
              </div>
              <button onClick={() => { setSelectedProduct(null); setSearchTerm(''); }}
                className="text-xs text-blue-500 hover:text-blue-700">Ganti</button>
            </div>
          )}
        </div>

        {/* Jenis Perubahan */}
        {selectedProduct && (
          <>
            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
              <h3 className="font-semibold text-gray-800 text-sm">2. Jenis Perubahan</h3>
              <div className="grid grid-cols-3 gap-2">
                {MOVEMENT_TYPES.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMovementType(m.value)}
                    className={`py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all ${
                      movementType === m.value ? m.color : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
              <h3 className="font-semibold text-gray-800 text-sm">3. Jumlah & Catatan</h3>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  {movementType === 'adjustment' ? 'Stok Akhir (nilai baru)' : 'Jumlah'}
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.001"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-lg font-semibold text-right outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Catatan</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Mis. barang baru datang dari supplier..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
                />
              </div>

              <button
                onClick={() => adjustMutation.mutate()}
                disabled={!quantity || Number(quantity) <= 0 || adjustMutation.isPending}
                className="w-full py-3 rounded-xl bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold transition-colors"
              >
                {adjustMutation.isPending ? 'Menyimpan...' : 'Simpan Penyesuaian Stok'}
              </button>

              {adjustMutation.isError && (
                <p className="text-xs text-red-600 text-center">{adjustMutation.error?.message}</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
