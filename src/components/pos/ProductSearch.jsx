import React, { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

export function ProductSearch({
  value,
  onChange,
  onClear,
  autoFocus = true,
  placeholder = 'Cari nama barang, kode (BRG-...), atau barcode...',
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

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
        placeholder={placeholder}
        className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all placeholder:text-slate-400 font-medium"
      />

      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
          title="Hapus pencarian"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export default ProductSearch;
