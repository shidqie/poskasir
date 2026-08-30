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
  Upload,
  Keyboard,
  RefreshCw,
  Zap,
  ZapOff,
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
  } catch (e) {}

  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(80);
    } catch (e) {}
  }
};

const ALL_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.QR_CODE,
];

export function BarcodeScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
  onManualSearch,
}) {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'upload' | 'manual'
  const [cameraError, setCameraError] = useState('');
  const [lastScanned, setLastScanned] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const scannerRef = useRef(null);
  const isLockedRef = useRef(false);
  const fileInputRef = useRef(null);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {}
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const startScanner = async () => {
    await stopScanner();
    setCameraError('');
    setLastScanned('');
    isLockedRef.current = false;

    try {
      const qrCodeId = 'reader-viewport';
      const html5QrCode = new Html5Qrcode(qrCodeId, {
        formatsToSupport: ALL_FORMATS,
        verbose: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
      });

      scannerRef.current = html5QrCode;

      // Coba dapatkan daftar kamera
      let cameraConfig = { facingMode: 'environment' };
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          // Cari kamera belakang
          const backCam = devices.find((d) =>
            /back|rear|belakang|environment/i.test(d.label)
          );
          cameraConfig = backCam ? { deviceId: { exact: backCam.id } } : { deviceId: devices[0].id };
        }
      } catch (e) {
        // Gunakan default facingMode jika getCameras diblokir
        cameraConfig = { facingMode: 'environment' };
      }

      const config = {
        fps: 20,
        aspectRatio: 1.0,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          return {
            width: Math.floor(viewfinderWidth * 0.9),
            height: Math.floor(viewfinderHeight * 0.7),
          };
        },
      };

      await html5QrCode.start(
        cameraConfig,
        config,
        (decodedText) => {
          if (isLockedRef.current) return;
          isLockedRef.current = true;

          playBeep();
          setLastScanned(decodedText);

          if (onScanSuccess) {
            onScanSuccess(decodedText);
          }

          setTimeout(() => {
            isLockedRef.current = false;
            setLastScanned('');
          }, 1200);
        },
        () => {}
      );

      setIsScanning(true);
    } catch (err) {
      console.warn('[BarcodeScanner] Camera init error:', err);
      let msg =
        'Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan di browser.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Izin akses kamera ditolak. Silakan izinkan kamera pada browser Anda.';
      } else if (err.name === 'NotFoundError') {
        msg = 'Kamera tidak terdeteksi pada perangkat ini.';
      }
      setCameraError(msg);
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      const timer = setTimeout(() => {
        startScanner();
      }, 250);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen, activeTab]);

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  // Handler Upload File Gambar Barcode
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setIsUploading(true);

    try {
      const html5QrCode = new Html5Qrcode('file-scanner-temp', {
        formatsToSupport: ALL_FORMATS,
        verbose: false,
      });

      const decodedText = await html5QrCode.scanFile(file, true);
      playBeep();
      setLastScanned(decodedText);

      if (onScanSuccess) {
        onScanSuccess(decodedText);
      }
      setIsUploading(false);
      handleClose();
    } catch (err) {
      console.error('[BarcodeScanner] File scan error:', err);
      setUploadError(
        'Barcode tidak terdeteksi pada foto. Pastikan foto barcode jelas, fokus, dan tidak buram.'
      );
      setIsUploading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    playBeep();
    if (onScanSuccess) {
      onScanSuccess(manualCode.trim());
    }
    setManualCode('');
    handleClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Scan Barcode Produk"
      subtitle="Gunakan kamera, upload foto barcode, atau masukkan kode barcode manual"
      maxWidth="max-w-md"
    >
      <div className="space-y-3.5">
        {/* Hidden container for file decoding */}
        <div id="file-scanner-temp" className="hidden" />

        {/* Tab Selection: Kamera, Upload Foto, Manual */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200/80 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Camera size={14} />
            <span>Kamera</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Upload size={14} />
            <span>Upload Foto</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Keyboard size={14} />
            <span>Ketik Barcode</span>
          </button>
        </div>

        {/* TAB 1: KAMERA SCANNER */}
        {activeTab === 'camera' && (
          <div className="space-y-3">
            {cameraError ? (
              <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
                <div>
                  <p className="font-bold text-sm">Kendala Akses Kamera</p>
                  <p className="text-xs text-rose-600 mt-1 leading-relaxed">{cameraError}</p>
                </div>
                <div className="pt-2 flex justify-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={startScanner}
                    icon={RefreshCw}
                    className="text-xs font-bold rounded-xl"
                  >
                    Coba Lagi
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setActiveTab('manual')}
                    icon={Keyboard}
                    className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl"
                  >
                    Ketik Manual
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-2xl bg-black aspect-square flex items-center justify-center border-2 border-slate-900 shadow-inner">
                {/* Viewport Scanner */}
                <div id="reader-viewport" className="w-full h-full object-cover" />

                {/* Overlay Viewfinder Guide */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                  <div className="w-4/5 h-1/2 border-2 border-red-500 rounded-xl relative shadow-lg bg-red-500/10 flex items-center justify-center">
                    <div className="w-full h-0.5 bg-red-500 animate-pulse shadow-sm shadow-red-500" />
                    <span className="absolute -bottom-7 text-[11px] font-bold text-white bg-black/75 px-3 py-0.5 rounded-full backdrop-blur-xs">
                      Arahkan Barcode ke Garis Merah
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
          </div>
        )}

        {/* TAB 2: UPLOAD FOTO BARCODE */}
        {activeTab === 'upload' && (
          <div className="space-y-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-red-500 rounded-2xl p-8 text-center bg-slate-50 hover:bg-red-50/40 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
                <Upload size={22} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {isUploading ? 'Menganalisis Barcode...' : 'Pilih Foto / Gambar Barcode'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Format JPG, PNG, WEBP dari galeri atau file
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {uploadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-medium">
                <AlertCircle size={16} className="shrink-0 text-rose-500" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: KETIK BARCODE MANUAL */}
        {activeTab === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Nomor Barcode / Kode Barang
              </label>
              <input
                type="text"
                autoFocus
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Contoh: 8992753112345 atau BRG-0001..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold outline-none focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={!manualCode.trim()}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              Cari & Masukkan ke Keranjang
            </Button>
          </form>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-[11px] text-slate-400 font-medium">
            Scanner USB juga aktif otomatis
          </span>

          <Button type="button" variant="outline" size="sm" onClick={handleClose} className="rounded-xl font-bold">
            Tutup
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default BarcodeScannerModal;
