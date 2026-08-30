import { useEffect, useRef } from 'react';

/**
 * Custom Hook untuk mendeteksi input dari Hardware Barcode Scanner (USB / Bluetooth / Keyboard Wedge)
 * Scanner fisik mengirimkan karakter sangat cepat (< 50ms per key) diakhiri tombol 'Enter'.
 *
 * @param {Function} onScan Callback ketika barcode selesai di-scan
 * @param {Object} options Opsi konfigurasi (disabled, minLength, maxInterval)
 */
export function useBarcodeScanner(onScan, options = {}) {
  const {
    disabled = false,
    minLength = 3,
    maxInterval = 60, // ms toleransi antar ketukan scanner
  } = options;

  const bufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e) => {
      // Abaikan tombol modifier (Shift, Ctrl, Alt, Meta)
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) {
        return;
      }

      const now = Date.now();
      const interval = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Jika jeda terlalu lama (manusia mengetik manual santai), reset buffer kecuali scanner
      if (interval > maxInterval) {
        bufferRef.current = '';
      }

      if (e.key === 'Enter') {
        const scannedText = bufferRef.current.trim();
        bufferRef.current = '';

        if (scannedText.length >= minLength) {
          e.preventDefault();
          e.stopPropagation();
          if (onScanRef.current) {
            onScanRef.current(scannedText);
          }
        }
        return;
      }

      // Jika karakter tunggal (huruf, angka, simbol)
      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [disabled, minLength, maxInterval]);
}

export default useBarcodeScanner;
