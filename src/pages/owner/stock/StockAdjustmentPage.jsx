import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockService } from '@/services/stockService';
import { productService } from '@/services/productService';
import { barcodeService } from '@/services/barcodeService';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Toast } from '@/components/common/Toast';
import { BarcodeScannerModal } from '@/components/pos/BarcodeScannerModal';
import { formatTanggalWaktu } from '@/utils/formatters';
import {
  Boxes,
  Search,
  CheckCircle2,
  Layers,
  Camera,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Clock,
  User,
  PackageCheck,
  AlertCircle,
  X,
} from 'lucide-react';

const MOVEMENT_TYPES = [
  {
    value: 'stock_in',
    label: '+ Barang Masuk / Restok',
    description: 'Menambah jumlah stok dari kulakan / supplier',
    color: 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20',
    inactive: 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50',
    icon: TrendingUp,
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  {
    value: 'stock_out',
    label: '- Barang Keluar / Rusak / Hilang',
    description: 'Mengurangi stok karena rusak, kedaluwarsa, atau hilang',
    color: 'border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-500/20',
    inactive: 'border-slate-200 bg-white text-slate-700 hover:border-rose-300 hover:bg-rose-50/50',
    icon: TrendingDown,
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
  },
  {
    value: 'adjustment',
    label: '= Koreksi / Stok Opname',
    description: 'Menyesuaikan nilai stok dengan hasil hitung fisik',
    color: 'border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20',
    inactive: 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/50',
    icon: RefreshCw,
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
  },
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
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' });

  // 1. Query Daftar Produk (Langsung tampil agar tidak kosong saat halaman dimuat)
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products-for-adjustment', searchTerm],
    queryFn: () => productService.getProducts({ search: searchTerm }),
  });

  // 2. Query Riwayat Mutasi Stok Terkini
  const { data: recentMovements = [], isLoading: movementsLoading } = useQuery({
    queryKey: ['recent-stock-movements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          id,
          movement_type,
          quantity,
          stock_before,
          stock_after,
          notes,
          created_at,
          product:products(id, name, code, unit:units(symbol)),
          variant:product_variants(id, variant_name, code, unit:units(symbol)),
          created_by_profile:profiles!created_by(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(15);
      if (error) throw error;
      return data || [];
    },
  });

  // 3. Mutasi Penyesuaian Stok
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
      setToast({
        isOpen: true,
        message: `Stok "${result.itemLabel || selectedProduct.name}" berhasil diperbarui! Stok sekarang: ${result.stockAfter}`,
        type: 'success',
      });
      setSelectedProduct(null);
      setSelectedVariant(null);
      setQuantity('');
      setNotes('');
      setSearchTerm('');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-for-adjustment'] });
      queryClient.invalidateQueries({ queryKey: ['recent-stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
    },
    onError: (err) => {
      setToast({
        isOpen: true,
        message: err.message || 'Gagal menyimpan penyesuaian stok.',
        type: 'danger',
      });
    },
  });

  const handleSelectProduct = (p) => {
    setSelectedProduct(p);
    if (p.has_variants && p.product_variants?.length > 0) {
      setSelectedVariant(p.product_variants[0]);
    } else {
      setSelectedVariant(null);
    }
  };

  const handleBarcodeScanned = async (code) => {
    setIsScannerOpen(false);
    try {
      const result = await barcodeService.lookupBarcode(code);
      if (result.found && result.data) {
        const item = result.data;
        const targetProdId = item.productId || item.id;
        let matched = products.find((p) => p.id === targetProdId);

        if (!matched) {
          // Ambil detail produk jika belum ada di list
          matched = await productService.getProductById(targetProdId);
        }

        if (matched) {
          handleSelectProduct(matched);
          if (item.variantId && matched.product_variants) {
            const v = matched.product_variants.find((pv) => pv.id === item.variantId);
            if (v) setSelectedVariant(v);
          }
          setToast({
            isOpen: true,
            message: `Produk "${matched.name}" berhasil dipilih via barcode!`,
            type: 'success',
          });
        }
      } else {
        setToast({
          isOpen: true,
          message: `Barcode "${code}" tidak ditemukan dalam sistem.`,
          type: 'danger',
        });
      }
    } catch (e) {
      console.error('Scan barcode error:', e);
    }
  };

  const currentStock = selectedVariant
    ? Number(selectedVariant.stock || 0)
    : Number(selectedProduct?.stock || 0);

  const unitSymbol = selectedVariant?.unit?.symbol || selectedProduct?.unit?.symbol || 'Pcs';

  // Perhitungan Stok Akhir Simulasi
  const inputQty = Number(quantity) || 0;
  let calculatedNewStock = currentStock;
  if (movementType === 'stock_in') {
    calculatedNewStock = currentStock + inputQty;
  } else if (movementType === 'stock_out') {
    calculatedNewStock = Math.max(0, currentStock - inputQty);
  } else if (movementType === 'adjustment') {
    calculatedNewStock = inputQty;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Penyesuaian Stok' }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-red-50 text-red-600 border border-red-100 shrink-0">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Penyesuaian Stok Barang</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Catat mutasi barang masuk (kulakan), barang keluar, atau koreksi opname fisik toko
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => setIsScannerOpen(true)}
          variant="outline"
          icon={Camera}
          className="font-bold border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-xl text-xs sm:text-sm py-2.5 cursor-pointer shrink-0"
        >
          Scan Barcode Barang
        </Button>
      </div>

      {/* Grid 2 Kolom: Form Input (Kiri) & Log Mutasi (Kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* KOLOM KIRI: FORM PENYESUAIAN (7 Kolom) */}
        <div className="lg:col-span-7 space-y-5">
          {/* LANGKAH 1: PILIH BARANG */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-black flex items-center justify-center">
                  1
                </span>
                Pilih Barang yang Disesuaikan
              </h3>

              {selectedProduct && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProduct(null);
                    setSelectedVariant(null);
                  }}
                  className="text-xs text-red-600 hover:text-red-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <X size={14} />
                  <span>Ganti Barang</span>
                </button>
              )}
            </div>

            {/* Jika Belum Ada Barang Terpilih -> Tampilkan Pencarian & List Produk */}
            {!selectedProduct ? (
              <div className="space-y-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Ketik nama produk, kode, atau barcode..."
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* List Produk Cepat */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-64 overflow-y-auto bg-white shadow-inner">
                  {productsLoading && (
                    <p className="text-center text-xs text-slate-400 py-6">Memuat katalog barang...</p>
                  )}
                  {!productsLoading && products.length === 0 && (
                    <div className="text-center py-6 px-4">
                      <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                      <p className="text-xs font-bold text-slate-600">Barang tidak ditemukan</p>
                      <p className="text-[11px] text-slate-400">Coba gunakan kata kunci pencarian lain</p>
                    </div>
                  )}
                  {products.map((p) => {
                    const hasVariants = Boolean(p.has_variants && p.product_variants?.length > 0);
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleSelectProduct(p)}
                        className="p-3 hover:bg-red-50/70 transition-colors flex items-center justify-between gap-3 cursor-pointer text-left"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-slate-900 truncate">{p.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                            <span className="font-mono">{p.code}</span>
                            <span>•</span>
                            <span>{p.category?.name || 'Tanpa Kategori'}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {hasVariants ? (
                            <span className="px-2 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-600 border border-red-200 inline-flex items-center gap-1">
                              <Layers size={12} />
                              {p.product_variants.length} Varian
                            </span>
                          ) : (
                            <span className="font-bold text-xs text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                              Stok: {p.stock} {p.unit?.symbol || ''}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Kartu Barang Terpilih */
              <div className="p-4 rounded-2xl bg-gradient-to-r from-red-50/80 to-amber-50/40 border border-red-200 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                      Barang Terpilih
                    </span>
                    <h4 className="font-bold text-base text-slate-900 mt-1">{selectedProduct.name}</h4>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Kode: {selectedProduct.code} {selectedProduct.barcode ? `| Barcode: ${selectedProduct.barcode}` : ''}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 block">Stok Saat Ini:</span>
                    <span className="text-lg font-black text-slate-900 font-mono">
                      {currentStock} {unitSymbol}
                    </span>
                  </div>
                </div>

                {/* Pemilih Varian Jika Produk Bervarian */}
                {selectedProduct.has_variants && (
                  <div className="pt-3 border-t border-red-200/80 space-y-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Layers size={14} className="text-red-600" />
                      <span>Pilih Varian Spesifik:</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {selectedProduct.product_variants?.map((v) => {
                        const isSelected = selectedVariant?.id === v.id;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => setSelectedVariant(v)}
                            className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-red-600 text-white border-red-600 shadow-sm'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-red-300'
                            }`}
                          >
                            <p className="font-bold truncate">{v.variant_name}</p>
                            <p
                              className={`text-[11px] mt-0.5 ${
                                isSelected ? 'text-red-100' : 'text-slate-500'
                              }`}
                            >
                              Stok: <strong>{v.stock}</strong> {v.unit?.symbol || unitSymbol}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* LANGKAH 2: JENIS PERUBAHAN & LANGKAH 3: JUMLAH */}
          {selectedProduct && (
            <div className="space-y-5 animate-fadeIn">
              {/* Langkah 2 */}
              <Card className="p-5 space-y-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-black flex items-center justify-center">
                    2
                  </span>
                  Pilih Jenis Mutasi Stok
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {MOVEMENT_TYPES.map((m) => {
                    const isSelected = movementType === m.value;
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setMovementType(m.value)}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected ? m.color : m.inactive
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon size={16} />
                          <span className="font-bold text-xs">{m.label}</span>
                        </div>
                        <p className="text-[11px] mt-2 opacity-80 leading-relaxed font-normal">
                          {m.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* Langkah 3: Jumlah, Simulasi & Catatan */}
              <Card className="p-5 space-y-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-black flex items-center justify-center">
                    3
                  </span>
                  Jumlah Perubahan & Catatan
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Input Jumlah */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      {movementType === 'adjustment'
                        ? 'Stok Fisik Sebenarnya (Nilai Akhir)'
                        : 'Jumlah Unit (' + unitSymbol + ')'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="any"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="0"
                        autoFocus
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xl font-black text-right outline-none focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 font-mono"
                      />
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        {unitSymbol}
                      </span>
                    </div>
                  </div>

                  {/* Simulasi Live Perhitungan Stok */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-center">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Simulasi Perubahan:
                    </span>
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <span className="text-slate-600">{currentStock}</span>
                      <ArrowRight size={14} className="text-slate-400" />
                      <span
                        className={`text-base font-black font-mono ${
                          calculatedNewStock > currentStock
                            ? 'text-emerald-600'
                            : calculatedNewStock < currentStock
                            ? 'text-rose-600'
                            : 'text-slate-900'
                        }`}
                      >
                        {calculatedNewStock} {unitSymbol}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      {movementType === 'stock_in' && `Bertambah +${inputQty} ${unitSymbol}`}
                      {movementType === 'stock_out' && `Berkurang -${inputQty} ${unitSymbol}`}
                      {movementType === 'adjustment' && `Diselaraskan menjadi ${inputQty} ${unitSymbol}`}
                    </span>
                  </div>
                </div>

                {/* Catatan / Keterangan */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Catatan / Alasan Penyesuaian (Opsional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Kulakan baru supplier, Barang rusak di rak, Selisih hitung opname..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  />
                </div>

                {/* Tombol Simpan */}
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    onClick={() => adjustMutation.mutate()}
                    disabled={!quantity || Number(quantity) < 0 || adjustMutation.isPending}
                    isLoading={adjustMutation.isPending}
                    icon={PackageCheck}
                    className="w-full py-3.5 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 cursor-pointer"
                  >
                    Simpan Penyesuaian Stok
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* KOLOM KANAN: LOG RIWAYAT MUTASI TERKINI (5 Kolom) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <h3 className="font-bold text-slate-900 text-sm">Riwayat Mutasi Terkini</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">15 Terakhir</span>
            </div>

            {movementsLoading ? (
              <p className="text-center text-xs text-slate-400 py-8">Memuat riwayat mutasi...</p>
            ) : recentMovements.length === 0 ? (
              <div className="text-center py-8 px-4 text-slate-400">
                <Boxes className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                <p className="text-xs font-bold text-slate-600">Belum Ada Riwayat Mutasi</p>
                <p className="text-[11px]">Setiap penyesuaian stok akan tercatat otomatis di sini.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto pr-1">
                {recentMovements.map((mov) => {
                  const isStockIn = mov.movement_type === 'stock_in';
                  const isStockOut = mov.movement_type === 'stock_out';
                  const pName = mov.product?.name || 'Produk';
                  const vName = mov.variant?.variant_name;
                  const unit = mov.variant?.unit?.symbol || mov.product?.unit?.symbol || 'Pcs';

                  return (
                    <div key={mov.id} className="py-3 text-xs space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-slate-900 text-sm leading-tight">
                            {pName} {vName ? `(${vName})` : ''}
                          </p>
                          <span className="text-[11px] text-slate-400">
                            {formatTanggalWaktu(mov.created_at)}
                          </span>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] shrink-0 ${
                            isStockIn
                              ? 'bg-emerald-100 text-emerald-800'
                              : isStockOut
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {isStockIn ? '+ Masuk' : isStockOut ? '- Keluar' : '= Koreksi'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg font-mono">
                        <span>
                          Jumlah: <strong>{mov.quantity} {unit}</strong>
                        </span>
                        <span>
                          {mov.stock_before} → <strong>{mov.stock_after} {unit}</strong>
                        </span>
                      </div>

                      {mov.notes && (
                        <p className="text-[11px] text-slate-500 italic line-clamp-1">
                          "{mov.notes}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Modal Scanner Barcode Kamera */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleBarcodeScanned}
      />

      {/* Toast Notifikasi */}
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
    </div>
  );
}
