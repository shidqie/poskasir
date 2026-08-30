import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import {
  Camera,
  X,
  AlertCircle,
  Sparkles,
  Search,
  Volume2,
  VolumeX,
} from 'lucide-react';

// Helper Web Audio API Beep & Vibration
const playBeep = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // 880Hz beep
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {
    // Audio Context not permitted or supported
  }

  // Haptic feedback
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(80);
    } catch (e) {}
  }
};

export function BarcodeScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
  onManualSearch,
}) {
  const [cameraError, setCameraError] = useState('');
  const [lastScanned, setLastScanned] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);

  const scannerRef = useRef(null);
  const isLockedRef = useRef(false);

  useEffect(() => {
    let html5QrCode = null;

    if (isOpen) {
      setCameraError('');
      setLastScanned('');
      isLockedRef.current = false;

      const initScanner = async () => {
        try {
          const qrCodeId = 'reader-viewport';
          html5QrCode = new Html5Qrcode(qrCodeId, {
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.QR_CODE,
            ],
            verbose: false,
          });

          scannerRef.current = html5QrCode;

          const config = {
            fps: 15,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              return {
                width: Math.floor(minEdge * 0.85),
                height: Math.floor(minEdge * 0.55),
              };
            },
            aspectRatio: 1.0,
          };

          // Mulai scanner dengan preferensi kamera belakang
          await html5QrCode.start(
            { facingMode: 'environment' },
            config,
            (decodedText) => {
              // Mekanisme Scan Lock / Debounce agar 1 barcode tidak terbaca berkali-kali dalam 1 detik
              if (isLockedRef.current) return;
              isLockedRef.current = true;

              playBeep();
              setLastScanned(decodedText);

              // Callback hasil scan
              onScanSuccess(decodedText);

              // Cooldown 1.2 detik sebelum bisa scan lagi
              setTimeout(() => {
                isLockedRef.current = false;
                setLastScanned('');
              }, 1200);
            },
            () => {
              // Frame scan error (normal jika belum ada barcode di viewport)
            }
          );

          setIsScanning(true);
        } catch (err) {
          console.error('[BarcodeScanner] Error camera:', err);
          let msg =
            'Tidak dapat mengakses kamera perangkat. Pastikan izin kamera telah diberikan di browser.';
          if (err.name === 'NotAllowedError') {
            msg = 'Izin kamera ditolak. Aktifkan izin kamera di pengaturan browser Anda.';
          } else if (err.name === 'NotFoundError') {
            msg = 'Kamera tidak ditemukan pada perangkat Anda.';
          }
          setCameraError(msg);
          setIsScanning(false);
        }
      };

      // Timeout kecil untuk memastikan elemen DOM siap
      const timer = setTimeout(() => {
        initScanner();
      }, 200);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current && scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => {});
          scannerRef.current.clear();
        }
      };
    }
  }, [isOpen]);

  const handleClose = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {}
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Scan Barcode Produk"
      subtitle="Arahkan kamera ke barcode pada kemasan barang (Indomie, Sabun, Minuman, dll.)"
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        {cameraError ? (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <div>
              <p className="font-bold text-sm">Gagal Mengakses Kamera</p>
              <p className="text-xs text-red-600 mt-1">{cameraError}</p>
            </div>
            <div className="pt-2 flex justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  handleClose();
                  if (onManualSearch) onManualSearch();
                }}
                icon={Search}
              >
                Cari Manual Saja
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl bg-black aspect-square flex items-center justify-center border-2 border-slate-800 shadow-inner">
            {/* Viewport Scanner Target */}
            <div id="reader-viewport" className="w-full h-full object-cover" />

            {/* Overlay Viewfinder Guide */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
              <div className="w-3/4 h-1/2 border-2 border-blue-400 rounded-xl relative shadow-lg bg-blue-500/5 flex items-center justify-center">
                <div className="w-full h-0.5 bg-red-500/80 animate-pulse" />
                <span className="absolute -bottom-7 text-[11px] font-bold text-white bg-black/60 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                  Posisikan Barcode di Sini
                </span>
              </div>
            </div>

            {/* Feedback Berhasil Scan */}
            {lastScanned && (
              <div className="absolute inset-x-4 top-4 p-2.5 rounded-xl bg-emerald-600 text-white text-center text-xs font-bold shadow-lg animate-bounce flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Barcode Terdeteksi: {lastScanned}</span>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              handleClose();
              if (onManualSearch) onManualSearch();
            }}
            icon={Search}
          >
            Cari Manual
          </Button>

          <Button type="button" variant="outline" size="sm" onClick={handleClose}>
            Tutup Scanner
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default BarcodeScannerModal;
