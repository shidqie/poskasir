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

const NATIVE_FORMATS = ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code'];

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

  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const isLockedRef = useRef(false);
  const fileInputRef = useRef(null);
  const isMountedRef = useRef(true);
  const nativeDetectLoopRef = useRef(null);

  const triggerScanSuccess = useCallback((code) => {
    const clean = String(code || '').trim();
    if (!clean) return;
    if (onScanSuccess) onScanSuccess(clean);
    if (onDetected) onDetected(clean);
    if (onScan) onScan(clean);
    if (onSuccess) onSuccess(clean);
  }, [onScanSuccess, onDetected, onScan, onSuccess]);

  const stopScanner = async () => {
    if (nativeDetectLoopRef.current) {
      cancelAnimationFrame(nativeDetectLoopRef.current);
      nativeDetectLoopRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      mediaStreamRef.current = null;
    }

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
      if (mediaStreamRef.current) {
        const track = mediaStreamRef.current.getVideoTracks()[0];
        if (track) {
          const newState = !isTorchOn;
          await track.applyConstraints({
            advanced: [{ torch: newState }],
          });
          setIsTorchOn(newState);
        }
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

  const startScanner = async () => {
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

    // 2. CEK APAKAH PERANGKAT MENDUKUNG NATIVE BarcodeDetector (Hardware Accelerated, <10ms)
    const hasNativeBarcodeDetector =
      typeof window !== 'undefined' &&
      'BarcodeDetector' in window &&
      typeof window.BarcodeDetector === 'function';

    if (hasNativeBarcodeDetector) {
      try {
        const supported = await window.BarcodeDetector.getSupportedFormats();
        const availableFormats = NATIVE_FORMATS.filter((f) => supported.includes(f));
        const detector = new window.BarcodeDetector({
          formats: availableFormats.length > 0 ? availableFormats : supported,
        });

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
          },
          audio: false,
        });

        mediaStreamRef.current = stream;

        // Cek dukungan senter (torch)
        const track = stream.getVideoTracks()[0];
        if (track) {
          const capabilities = track.getCapabilities ? track.getCapabilities() : {};
          if (capabilities.torch) {
            setHasTorch(true);
          }
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsScanning(true);

          let isDetecting = false;
          const detectFrame = async () => {
            if (!isMountedRef.current || !mediaStreamRef.current) return;

            if (!isDetecting && !isLockedRef.current && videoRef.current && videoRef.current.readyState >= 2) {
              isDetecting = true;
              try {
                const barcodes = await detector.detect(videoRef.current);
                if (barcodes && barcodes.length > 0) {
                  const first = barcodes[0].rawValue;
                  if (first) {
                    handleBarcodeFound(first);
                  }
                }
              } catch (e) {}
              isDetecting = false;
            }

            nativeDetectLoopRef.current = requestAnimationFrame(detectFrame);
          };

          nativeDetectLoopRef.current = requestAnimationFrame(detectFrame);
          return;
        }
      } catch (nativeErr) {
        console.warn('[BarcodeScanner] Native BarcodeDetector attempt skipped, falling back to Html5Qrcode:', nativeErr);
        await stopScanner();
      }
    }

    // 3. FALLBACK: Html5Qrcode Berkecepatan Tinggi (Optimized Configuration)
    try {
      const qrCodeId = 'reader-viewport';
      const html5QrCode = new Html5Qrcode(qrCodeId, {
        formatsToSupport: ESSENTIAL_FORMATS,
        verbose: false,
      });

      scannerRef.current = html5QrCode;

      const scanConfig = {
        fps: 15, // Optimal 15 FPS: tidak membebani CPU HP sehingga scanning sangat responsif
        aspectRatio: 1.333333,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          return {
            width: Math.floor(viewfinderWidth * 0.88),
            height: Math.floor(viewfinderHeight * 0.65),
          };
        },
        videoConstraints: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
        },
      };

      await html5QrCode.start(
        { facingMode: 'environment' },
        scanConfig,
        (decodedText) => handleBarcodeFound(decodedText),
        () => {}
      );

      setIsScanning(true);
    } catch (err) {
      console.error('[BarcodeScanner] Html5Qrcode camera error:', err);
      let msg = 'Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan di pengaturan browser Anda.';

      if (
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError' ||
        String(err).includes('Permission denied')
      ) {
        msg = 'Izin kamera ditolak. Silakan klik ikon gembok / perizinan di address bar browser Anda dan izinkan Kamera.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'Kamera tidak terdeteksi pada perangkat Anda.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'Kamera sedang digunakan oleh aplikasi lain. Tutup aplikasi lain yang menggunakan kamera lalu coba lagi.';
      }

      setCameraError(msg);
      setIsScanning(false);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    if (isOpen && activeTab === 'camera') {
      const timer = setTimeout(() => {
        startScanner();
      }, 200);
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
      // 1. Coba decode via Native BarcodeDetector jika ada
      if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        try {
          const detector = new window.BarcodeDetector({ formats: NATIVE_FORMATS });
          const imgBitmap = await createImageBitmap(file);
          const results = await detector.detect(imgBitmap);
          if (results && results.length > 0 && results[0].rawValue) {
            handleBarcodeFound(results[0].rawValue);
            setIsUploading(false);
            return;
          }
        } catch (e) {}
      }

      // 2. Fallback scan file dengan Html5Qrcode
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
        'Barcode tidak terdeteksi dari foto yang diunggah. Pastikan foto barcode jelas, fokus, dan tidak silau.'
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200 shadow-xs">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 leading-tight">
              Pindai Barcode Produk
            </h3>
            <p className="text-[11px] text-slate-500 font-normal">
              Arahkan kamera ke kemasan barcode
            </p>
          </div>
        </div>
      }
      size="md"
    >
      <div className="space-y-4">
        {/* Tab Switcher: Kamera | Upload | Ketik Manual */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
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
                  <p className="font-bold text-sm">
                    {isHttpsWarning ? 'Wajib Menggunakan HTTPS' : 'Kendala Akses Kamera'}
                  </p>
                  <p className="text-xs text-rose-600 mt-1 leading-relaxed">{cameraError}</p>
                </div>

                {isHttpsWarning && (
                  <div className="p-2.5 bg-rose-100/70 rounded-xl text-[11px] text-rose-900 text-left space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <ShieldAlert size={13} />
                      Solusi Deployment:
                    </p>
                    <p>1. Pastikan domain hosting (Vercel, Cloudflare, dll.) menggunakan SSL / HTTPS aktif.</p>
                  </div>
                )}

                <div className="pt-2 flex flex-wrap justify-center gap-2">
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
                    Ketik Barcode
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-2xl bg-black aspect-[4/3] flex items-center justify-center border-2 border-slate-900 shadow-inner">
                {/* Native Video Element */}
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Html5Qrcode Fallback Viewport Container */}
                <div id="reader-viewport" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />

                {/* Overlay Viewfinder Guide */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                  <div className="w-[85%] h-[55%] border-2 border-red-500 rounded-2xl relative shadow-lg bg-red-500/5 flex items-center justify-center">
                    <div className="w-full h-0.5 bg-red-500 shadow-sm shadow-red-500" />
                    <span className="absolute -bottom-6 text-[10px] font-bold text-white bg-black/80 px-3 py-0.5 rounded-full backdrop-blur-xs">
                      Posisikan garis merah pada barcode
                    </span>
                  </div>
                </div>

                {/* Tombol Senter (Flashlight) jika didukung HP */}
                {hasTorch && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition-all cursor-pointer shadow-md ${
                      isTorchOn
                        ? 'bg-amber-400 text-slate-900 font-bold'
                        : 'bg-black/60 text-white hover:bg-black/80'
                    }`}
                    title={isTorchOn ? 'Matikan Senter' : 'Nyalakan Senter'}
                  >
                    {isTorchOn ? <Zap size={16} className="fill-slate-900" /> : <ZapOff size={16} />}
                  </button>
                )}

                {/* Feedback Berhasil Scan */}
                {lastScanned && (
                  <div className="absolute inset-x-4 top-4 p-2.5 rounded-xl bg-emerald-600 text-white text-center text-xs font-bold shadow-lg animate-bounce flex items-center justify-center gap-1.5 z-20">
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
                  Format JPG, PNG, WEBP dari galeri kamera HP
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
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
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
              Gunakan Barcode Ini
            </Button>
          </form>
        )}

        {/* Hidden temp element for file scanning */}
        <div id="file-scanner-temp" className="hidden" />

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-[11px] text-slate-400 font-medium">
            Scanner USB / Bluetooth juga otomatis aktif
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
