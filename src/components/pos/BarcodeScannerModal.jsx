import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  ShieldAlert,
  Zap,
  ZapOff,
  SwitchCamera,
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
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {}

  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(50);
    } catch (e) {}
  }
};

// Format esensial retail / sembako (ringan & cepat)
const ESSENTIAL_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.QR_CODE,
];

export function BarcodeScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
  onDetected,
  onScan,
  onSuccess,
  onManualSearch,
}) {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'upload' | 'manual'
  const [cameraError, setCameraError] = useState('');
  const [lastScanned, setLastScanned] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isHttpsWarning, setIsHttpsWarning] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [activeCamIndex, setActiveCamIndex] = useState(0);

  const scannerRef = useRef(null);
  const isLockedRef = useRef(false);
  const fileInputRef = useRef(null);
  const isMountedRef = useRef(true);

  const triggerScanSuccess = useCallback(
    (code) => {
      const clean = String(code || '').trim();
      if (!clean) return;
      if (onScanSuccess) onScanSuccess(clean);
      if (onDetected) onDetected(clean);
      if (onScan) onScan(clean);
      if (onSuccess) onSuccess(clean);
    },
    [onScanSuccess, onDetected, onScan, onSuccess]
  );

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

    setIsTorchOn(false);
    setHasTorch(false);

    if (isMountedRef.current) {
      setIsScanning(false);
    }
  };

  const toggleTorch = async () => {
    try {
      if (scannerRef.current && scannerRef.current.applyVideoConstraints) {
        const newState = !isTorchOn;
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ torch: newState }],
        });
        setIsTorchOn(newState);
      }
    } catch (e) {
      console.warn('[BarcodeScanner] Toggle torch error:', e);
    }
  };

  const handleBarcodeFound = (decodedText) => {
    if (isLockedRef.current) return;
    isLockedRef.current = true;

    playBeep();
    setLastScanned(decodedText);
    triggerScanSuccess(decodedText);

    setTimeout(() => {
      if (isMountedRef.current) {
        isLockedRef.current = false;
        setLastScanned('');
      }
    }, 1200);
  };

  const startScanner = async (targetCamId = null) => {
    await stopScanner();
    setCameraError('');
    setLastScanned('');
    setIsHttpsWarning(false);
    isLockedRef.current = false;

    // 1. Cek Dukungan HTTPS / Secure Context pada Browser saat Deploy
    const isLocal =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.endsWith('.localhost'));

    const isSecure = typeof window !== 'undefined' && (window.isSecureContext || isLocal);
    const hasMediaDevices =
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function';

    if (!isSecure || !hasMediaDevices) {
      setIsHttpsWarning(true);
      setCameraError(
        'Kamera browser diblokir karena website tidak berjalan di protokol HTTPS (Koneksi Aman). Browser modern mewajibkan URL berawalan https:// untuk mengakses kamera.'
      );
      return;
    }

    // 2. Cek Daftar Kamera Tersedia pada Perangkat
    let deviceList = [];
    try {
      deviceList = await Html5Qrcode.getCameras();
      if (deviceList && deviceList.length > 0) {
        setCameras(deviceList);
      }
    } catch (camErr) {
      console.warn('[BarcodeScanner] getCameras error:', camErr);
    }

    // 3. Tentukan Target Kamera
    let cameraToUse = { facingMode: 'environment' };

    if (targetCamId) {
      cameraToUse = targetCamId;
    } else if (deviceList && deviceList.length > 0) {
      // Prioritaskan kamera belakang
      const backIndex = deviceList.findIndex(
        (c) =>
          c.label.toLowerCase().includes('back') ||
          c.label.toLowerCase().includes('rear') ||
          c.label.toLowerCase().includes('environment') ||
          c.label.toLowerCase().includes('belakang')
      );

      if (backIndex >= 0) {
        cameraToUse = deviceList[backIndex].id;
        setActiveCamIndex(backIndex);
      } else {
        cameraToUse = deviceList[0].id;
        setActiveCamIndex(0);
      }
    }

    // 4. Inisialisasi Scanner dengan Konfigurasi Responsif
    try {
      const qrCodeId = 'reader-viewport';
      const html5QrCode = new Html5Qrcode(qrCodeId, {
        formatsToSupport: ESSENTIAL_FORMATS,
        verbose: false,
      });

      scannerRef.current = html5QrCode;

      const scanConfig = {
        fps: 20,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          return {
            width: Math.floor(minEdge * 0.85),
            height: Math.floor(minEdge * 0.55),
          };
        },
        aspectRatio: 1.333333,
      };

      await html5QrCode.start(
        cameraToUse,
        scanConfig,
        (decodedText) => handleBarcodeFound(decodedText),
        () => {}
      );

      // Cek apakah senter (torch) tersedia
      try {
        const capabilities = html5QrCode.getRunningTrackCapabilities?.();
        if (capabilities?.torch) {
          setHasTorch(true);
        }
      } catch (e) {}

      setIsScanning(true);
    } catch (err) {
      console.error('[BarcodeScanner] Html5Qrcode camera start error:', err);
      let msg =
        'Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan di pengaturan browser Anda.';

      if (
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError' ||
        String(err).includes('Permission denied')
      ) {
        msg =
          'Izin kamera ditolak. Silakan klik ikon gembok di address bar browser Anda dan izinkan akses Kamera.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'Kamera tidak terdeteksi pada perangkat Anda.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg =
          'Kamera sedang digunakan oleh aplikasi lain. Tutup aplikasi lain yang memakai kamera lalu coba lagi.';
      }

      setCameraError(msg);
      setIsScanning(false);
    }
  };

  const handleSwitchCamera = async () => {
    if (cameras.length <= 1) return;
    const nextIndex = (activeCamIndex + 1) % cameras.length;
    setActiveCamIndex(nextIndex);
    const nextCamera = cameras[nextIndex];
    if (nextCamera) {
      await startScanner(nextCamera.id);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    if (isOpen && activeTab === 'camera') {
      const timer = setTimeout(() => {
        startScanner();
      }, 150);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
    return () => {
      isMountedRef.current = false;
      stopScanner();
    };
  }, [isOpen, activeTab]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');

    try {
      const tempScanner = new Html5Qrcode('file-scanner-temp', {
        formatsToSupport: ESSENTIAL_FORMATS,
        verbose: false,
      });

      const decodedText = await tempScanner.scanFile(file, true);
      tempScanner.clear();

      if (decodedText) {
        handleBarcodeFound(decodedText);
      } else {
        throw new Error('Barcode tidak dapat terbaca dari gambar ini.');
      }
    } catch (err) {
      console.warn('[BarcodeScanner] File scan error:', err);
      setUploadError(
        'Barcode tidak terdeteksi dari foto yang diunggah. Pastikan foto barcode jelas, fokus, dan tidak buram.'
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    triggerScanSuccess(manualCode.trim());
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  const activeCamLabel = cameras[activeCamIndex]?.label || (cameras.length > 0 ? `Kamera ${activeCamIndex + 1}` : 'Kamera Aktif');

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-slate-100 text-slate-900 flex items-center justify-center border border-slate-200 shadow-xs">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
              Pindai Barcode / QR Produk
            </h3>
            <p className="text-[11px] text-slate-500 font-normal mt-0.5">
              Arahkan kamera ke barcode pada kemasan barang
            </p>
          </div>
        </div>
      }
      size="md"
    >
      <div className="space-y-4">
        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-slate-900 text-white shadow-xs font-bold'
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
                ? 'bg-slate-900 text-white shadow-xs font-bold'
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
                ? 'bg-slate-900 text-white shadow-xs font-bold'
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
              <div className="p-5 rounded-3xl bg-rose-50 border border-rose-200 text-rose-800 text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
                <div>
                  <p className="font-bold text-sm">
                    {isHttpsWarning ? 'Wajib Menggunakan HTTPS' : 'Kendala Akses Kamera'}
                  </p>
                  <p className="text-xs text-rose-600 mt-1 leading-relaxed">{cameraError}</p>
                </div>

                {isHttpsWarning && (
                  <div className="p-3 bg-rose-100/70 rounded-2xl text-[11px] text-rose-900 text-left space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <ShieldAlert size={13} />
                      Solusi:
                    </p>
                    <p>
                      Pastikan link website menggunakan protokol aman <strong>https://</strong> untuk membuka akses kamera di browser smartphone.
                    </p>
                  </div>
                )}

                <div className="pt-2 flex flex-wrap justify-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => startScanner()}
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
                    className="text-xs font-bold bg-slate-900 hover:bg-black text-white rounded-xl"
                  >
                    Ketik Barcode Manual
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-3xl bg-slate-950 aspect-4/3 sm:aspect-16/10 flex items-center justify-center border border-slate-800 shadow-2xl">
                {/* Html5Qrcode Viewport */}
                <div
                  id="reader-viewport"
                  className="w-full h-full object-cover"
                />

                {/* Overlay Viewfinder Laser Box */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                  <div className="w-[78%] h-[50%] max-w-[280px] max-h-[140px] border-2 border-emerald-400/90 rounded-2xl relative shadow-[0_0_20px_rgba(52,211,153,0.25)] flex items-center justify-center bg-emerald-500/5">
                    {/* Laser Scanline */}
                    <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse" />
                    
                    {/* Corner Accent Marks */}
                    <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-emerald-300 rounded-tl" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-emerald-300 rounded-tr" />
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-emerald-300 rounded-bl" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-emerald-300 rounded-br" />
                  </div>

                  <span className="mt-3 text-[10px] font-bold text-white/90 bg-slate-900/85 px-3 py-1 rounded-full backdrop-blur-md shadow-md border border-white/10">
                    Posisikan barcode di dalam kotak
                  </span>
                </div>

                {/* Top Controls: Camera Label, Switch Camera, Torch */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20 pointer-events-auto">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900/80 text-white/90 backdrop-blur-md border border-white/15 shadow-sm truncate max-w-[150px]">
                      {activeCamLabel}
                    </span>

                    {cameras.length > 1 && (
                      <button
                        type="button"
                        onClick={handleSwitchCamera}
                        className="p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-black backdrop-blur-md border border-white/15 shadow-sm transition-all active:scale-95 cursor-pointer"
                        title="Ganti Kamera (Depan / Belakang)"
                      >
                        <SwitchCamera size={13} />
                      </button>
                    )}
                  </div>

                  {hasTorch && (
                    <button
                      type="button"
                      onClick={toggleTorch}
                      className={`p-2 rounded-full backdrop-blur-md transition-all cursor-pointer shadow-md border border-white/15 ${
                        isTorchOn
                          ? 'bg-amber-400 text-slate-900 font-bold'
                          : 'bg-slate-900/80 text-white hover:bg-black'
                      }`}
                      title={isTorchOn ? 'Matikan Senter' : 'Nyalakan Senter'}
                    >
                      {isTorchOn ? (
                        <Zap size={14} className="fill-slate-900" />
                      ) : (
                        <ZapOff size={14} />
                      )}
                    </button>
                  )}
                </div>

                {/* Feedback Berhasil Scan */}
                {lastScanned && (
                  <div className="absolute inset-x-4 bottom-4 p-2.5 rounded-2xl bg-emerald-600 text-white text-center text-xs font-bold shadow-xl animate-bounce flex items-center justify-center gap-1.5 z-30">
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
              className="p-8 border-2 border-dashed border-slate-300 hover:border-slate-500 bg-slate-50 hover:bg-slate-100/70 rounded-3xl text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2"
            >
              <Upload className="w-8 h-8 text-slate-400" />
              <div>
                <p className="font-bold text-xs text-slate-800">
                  {isUploading ? 'Sedang Membaca Barcode...' : 'Pilih Foto dari Galeri / Kamera'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Format JPG, PNG, WEBP (maks. 10MB)
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
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-2xl border border-rose-200 flex items-center gap-2 font-medium">
                <AlertCircle size={15} className="shrink-0 text-rose-600" />
                <span>{uploadError}</span>
              </div>
            )}

            <div id="file-scanner-temp" className="hidden" />
          </div>
        )}

        {/* TAB 3: KETIK BARCODE MANUAL */}
        {activeTab === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Nomor Barcode / Kode Barang
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Contoh: 8996001600269 atau BRG-0001"
                  autoFocus
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-medium outline-none focus:bg-white focus:border-slate-400"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={!manualCode.trim()}
              className="w-full py-2.5 text-xs font-bold bg-slate-900 hover:bg-black text-white rounded-2xl shadow-xs cursor-pointer"
            >
              Cari & Masukkan ke Keranjang
            </Button>
          </form>
        )}
      </div>
    </Modal>
  );
}

export default BarcodeScannerModal;
