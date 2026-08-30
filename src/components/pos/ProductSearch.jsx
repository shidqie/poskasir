import React, { useRef, useEffect } from 'react';
import { Search, X, Camera } from 'lucide-react';

export function ProductSearch({
  value,
  onChange,
  onClear,
  onSubmit,
  onOpenScanner,
  autoFocus = true,
  placeholder = 'Cari nama barang, kode (BRG-...), atau barcode...',
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (onSubmit && value.trim()) {
        onSubmit(value.trim());
      }
    }
  };

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
        <Search className="w-4 h-4" />
      </div>

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full pl-9 pr-16 py-2 text-xs sm:text-sm bg-slate-50/90 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-slate-400 transition-all placeholder:text-slate-400 font-medium"
      />

      <div className="absolute inset-y-0 right-0 pr-1.5 flex items-center gap-1">
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="p-1 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
            title="Hapus pencarian"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {onOpenScanner && (
          <button
            type="button"
            onClick={onOpenScanner}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-black text-white transition-colors flex items-center justify-center cursor-pointer shadow-xs"
            title="Buka Kamera Scan Barcode / QR"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export default ProductSearch;
