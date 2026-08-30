import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockService } from '@/services/stockService';
import { productService } from '@/services/productService';
import { useAuthStore } from '@/stores/authStore';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { Boxes, Search, CheckCircle2, Layers } from 'lucide-react';

const MOVEMENT_TYPES = [
  { value: 'stock_in', label: 'Barang Masuk (+)', color: 'text-emerald-700 bg-emerald-50 border-emerald-300 font-bold' },
  { value: 'stock_out', label: 'Barang Keluar (-)', color: 'text-rose-700 bg-rose-50 border-rose-300 font-bold' },
  { value: 'adjustment', label: 'Koreksi Stok (=)', color: 'text-red-700 bg-red-50 border-red-300 font-bold' },
];

export default function StockAdjustmentPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
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
        variantId: selectedVariant?.id || null,
        movementType,
        quantity: Number(quantity),
        notes,
        userId: user?.id,
      }),
    onSuccess: (result) => {
      setSuccess({
        itemLabel: result.itemLabel || selectedProduct.name,
        newStock: result.stockAfter,
        movementType,
      });
      setSelectedProduct(null);
      setSelectedVariant(null);
      setQuantity('');
      setNotes('');
      setSearchTerm('');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
    },
  });

  const handleSelectProduct = (p) => {
    setSelectedProduct(p);
    setSearchTerm(p.name);
    if (p.has_variants && p.product_variants?.length > 0) {
      setSelectedVariant(p.product_variants[0]);
    } else {
      setSelectedVariant(null);
    }
  };

  const currentStock = selectedVariant
    ? selectedVariant.stock
    : selectedProduct?.stock || 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-2xl mx-auto w-full">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Penyesuaian Stok' }]} />

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100 shrink-0">
          <Boxes className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Penyesuaian Stok</h1>
          <p className="text-xs sm:text-sm text-slate-500">Catat mutasi stok produk atau varian secara manual</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Success notification */}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
            <div className="text-sm">
              <p className="font-bold text-emerald-800">Stok berhasil disesuaikan!</p>
              <p className="text-emerald-700 text-xs mt-0.5 font-medium">
                {success.itemLabel} → Stok baru: <strong>{success.newStock}</strong>
              </p>
            </div>
            <button
              onClick={() => setSuccess(null)}
              className="ml-auto text-emerald-600 hover:text-emerald-800 text-xs font-bold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {/* 1. Pilih Produk */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-3 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm">1. Pilih Barang</h3>
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedProduct(null);
                setSelectedVariant(null);
              }}
              placeholder="Ketik nama produk, varian, atau barcode..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-500 font-medium"
            />
          </div>

          {/* Hasil pencarian */}
          {searchTerm.trim().length > 1 && !selectedProduct && (
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
              {productsLoading && <p className="text-center text-xs text-slate-400 py-3">Mencari...</p>}
              {!productsLoading && products.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-3">Barang tidak ditemukan</p>
              )}
              {products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectProduct(p)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-red-50 transition-colors text-sm border-b border-slate-50 last:border-0 cursor-pointer"
                >
                  <div className="text-left truncate">
                    <span className="font-bold text-slate-800">{p.name}</span>
                    {p.has_variants && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
                        {p.product_variants?.length || 0} Varian
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 shrink-0 ml-2 font-semibold">
                    {p.has_variants ? 'Bervarian' : `Stok: ${p.stock}`}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Barang terpilih */}
          {selectedProduct && (
            <div className="bg-red-50/70 border border-red-200 rounded-xl px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-red-900">{selectedProduct.name}</p>
                  <p className="text-xs text-red-700 font-medium">
                    {selectedProduct.has_variants
                      ? `Pilih varian produk di bawah`
                      : `Stok saat ini: ${selectedProduct.stock}`}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedProduct(null);
                    setSelectedVariant(null);
                    setSearchTerm('');
                  }}
                  className="text-xs text-red-600 hover:text-red-800 font-bold cursor-pointer"
                >
                  Ganti
                </button>
              </div>

              {/* Varian Selector jika produk punya varian */}
              {selectedProduct.has_variants && (
                <div className="pt-2 border-t border-red-200/80">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-red-600" />
                    <span>Pilih Varian Spesifik:</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedProduct.product_variants?.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                          selectedVariant?.id === v.id
                            ? 'bg-red-600 text-white border-red-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-red-300'
                        }`}
                      >
                        <p className="font-bold truncate">{v.variant_name}</p>
                        <p
                          className={`text-[11px] mt-0.5 ${
                            selectedVariant?.id === v.id ? 'text-red-100' : 'text-slate-500'
                          }`}
                        >
                          Stok: <strong>{v.stock}</strong>
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. Jenis Perubahan */}
        {selectedProduct && (
          <>
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-3 shadow-xs">
              <h3 className="font-bold text-slate-900 text-sm">2. Jenis Perubahan</h3>
              <div className="grid grid-cols-3 gap-2">
                {MOVEMENT_TYPES.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMovementType(m.value)}
                    className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      movementType === m.value ? m.color : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Jumlah & Catatan */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">3. Jumlah & Catatan</h3>
                <span className="text-xs text-slate-500">
                  Stok saat ini: <strong className="text-slate-800">{currentStock}</strong>
                </span>
              </div>

              <div>
                <label className="text-xs text-slate-600 font-semibold mb-1 block">
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
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-lg font-black text-right outline-none focus:border-red-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 font-semibold mb-1 block">Catatan</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Mis. kiriman supplier, barang retur, dll..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-500 font-medium"
                />
              </div>

              <button
                onClick={() => adjustMutation.mutate()}
                disabled={!quantity || Number(quantity) <= 0 || adjustMutation.isPending}
                className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm transition-all shadow-md shadow-red-500/25 active:scale-95 cursor-pointer"
              >
                {adjustMutation.isPending ? 'Menyimpan...' : 'Simpan Penyesuaian Stok'}
              </button>

              {adjustMutation.isError && (
                <p className="text-xs text-rose-600 font-semibold text-center">
                  {adjustMutation.error?.message}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
