import React, { useState } from 'react';
import { Barcode, Camera } from 'lucide-react';
import { BarcodeScannerModal } from '@/components/pos/BarcodeScannerModal';

export function VariantBarcodeField({
  id = 'variant-barcode',
  label = 'Barcode Varian',
  value = '',
  onChange,
  placeholder = 'Scan atau ketik barcode kemasan...',
  disabled = false,
  helperText,
}) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-xs font-bold text-slate-700 mb-1">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Barcode className="w-4 h-4" />
        </div>

        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-9 pr-24 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none font-mono"
        />

        <div className="absolute right-1.5 inset-y-1.5 flex items-center">
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            disabled={disabled}
            className="px-2.5 py-1 text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 rounded-md border border-red-200 transition-colors flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
            title="Scan Barcode via Kamera"
          >
            <Camera className="w-3.5 h-3.5 text-red-600" />
            <span>Scan</span>
          </button>
        </div>
      </div>

      {helperText && (
        <p className="text-[11px] text-slate-400 mt-1">{helperText}</p>
      )}

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(scannedCode) => {
          onChange(scannedCode);
          setIsScannerOpen(false);
        }}
        onManualSearch={() => setIsScannerOpen(false)}
      />
    </div>
  );
}

export default VariantBarcodeField;
