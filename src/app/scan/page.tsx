'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { getJemaatByCodeOrId } from '@/lib/supabase';
import { Jemaat } from '@/lib/types';
import ScanResultModal from '@/components/ScanResultModal';
import { QrCode, Camera, AlertCircle, RefreshCw, Keyboard } from 'lucide-react';

export default function ScanPage() {
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [scannedResult, setScannedResult] = useState<Jemaat | null>(null);
  const [scannedCode, setScannedCode] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Process code (from camera scan or manual input)
  const processQrCode = async (code: string) => {
    if (!code || isSearching) return;
    setIsSearching(true);

    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.pause(true);
      }

      const result = await getJemaatByCodeOrId(code);
      setScannedCode(code);
      setScannedResult(result);
      setIsModalOpen(true);
    } catch (err) {
      console.error(err);
      setScannedCode(code);
      setScannedResult(null);
      setIsModalOpen(true);
    } finally {
      setIsSearching(false);
    }
  };

  const startScanner = async () => {
    setCameraError(null);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('qr-reader');
      }

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          processQrCode(decodedText);
        },
        () => {
          // ignore frame errors
        }
      );
      setScanning(true);
    } catch (err: any) {
      console.error('Camera Error:', err);
      setCameraError('Gagal mengakses kamera. Pastikan izin kamera telah diberikan.');
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.error(err);
      }
    }
    setScanning(false);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    if (html5QrCodeRef.current) {
      try {
        html5QrCodeRef.current.resume();
      } catch (err) {
        // ignore
      }
    }
  };

  const handleManualSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      processQrCode(manualCode.trim());
    }
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#3B2211]/10 border border-[#C5A059]/40 text-[#3B2211] text-xs font-bold">
          <QrCode className="w-3.5 h-3.5 text-[#C5A059]" />
          <span>Pemindai QR Code Jemaat GBT</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-[#2B180B]">
          Scan Kartu Akses QR
        </h1>
        <p className="text-xs sm:text-sm text-[#6B533E] max-w-md mx-auto">
          Arahkan kamera ke Kartu QR <code className="text-[#3B2211] font-mono font-bold">BU-0001060895</code> untuk verifikasi instan.
        </p>
      </div>

      {/* Main Scanner Container */}
      <div className="glass-panel rounded-3xl p-6 border border-[#C5A059]/40 space-y-6 shadow-xl relative overflow-hidden bg-[#FFFDF9]">
        {/* Scanner Box */}
        <div className="relative w-full aspect-square max-w-md mx-auto rounded-2xl overflow-hidden bg-[#2B180B] border-2 border-[#C5A059]/50 flex flex-col items-center justify-center">
          <div id="qr-reader" className="w-full h-full" />

          {!scanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#2B180B]/95 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#3B2211] border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] shadow-lg">
                <Camera className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#F3E5C8]">Kamera Belum Aktif</h3>
                <p className="text-xs text-[#EAD6B0] max-w-xs">
                  Tekan tombol di bawah untuk mengaktifkan pemindai kamera.
                </p>
              </div>
              <button
                onClick={startScanner}
                className="px-6 py-3 rounded-2xl bg-gold-metallic text-[#2B180B] font-bold text-sm shadow-lg shadow-[#C5A059]/30 transition-all hover:scale-105 flex items-center gap-2"
              >
                <Camera className="w-4 h-4 text-[#2B180B]" />
                <span>Aktifkan Kamera</span>
              </button>
            </div>
          )}

          {/* Scanner Overlay Line when Scanning */}
          {scanning && (
            <div className="absolute inset-x-8 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent animate-scan shadow-lg shadow-[#D4AF37] pointer-events-none" />
          )}
        </div>

        {/* Camera Controls */}
        {scanning && (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={stopScanner}
              className="px-5 py-2.5 rounded-xl bg-rose-500/10 text-rose-800 border border-rose-600/30 hover:bg-rose-500/20 text-xs font-bold transition-colors"
            >
              <span>Matikan Kamera</span>
            </button>
          </div>
        )}

        {/* Error Notification */}
        {cameraError && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{cameraError}</span>
          </div>
        )}

        {/* Manual Code Input Fallback */}
        <div className="pt-4 border-t border-[#C5A059]/30 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#2B180B]">
            <Keyboard className="w-4 h-4 text-[#C5A059]" />
            <span>Ketik ID / Kode QR Secara Manual:</span>
          </div>

          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Contoh: BU-0001060895"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#C5A059]/40 text-sm text-[#2B180B] placeholder-[#8C6D4F] focus:outline-none focus:border-[#3B2211] font-mono font-bold"
            />
            <button
              type="submit"
              disabled={!manualCode.trim() || isSearching}
              className="px-5 py-2.5 rounded-xl bg-espresso-metallic text-[#F3E5C8] border border-[#C5A059]/40 text-xs font-bold disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              {isSearching ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <span>Verifikasi</span>
              )}
            </button>
          </form>

          {/* Quick Demo Code buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-[#6B533E]">
            <span>Contoh Tes:</span>
            {['BU-0001060895', 'tok-sample', 'JE-0002140590'].map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setManualCode(code);
                  processQrCode(code);
                }}
                className="px-2.5 py-0.5 rounded-md bg-[#FAF6F0] hover:bg-[#EFE5DB] text-[#3B2211] font-mono font-bold border border-[#C5A059]/30 transition-colors"
              >
                {code}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Result Pop-up Modal */}
      <ScanResultModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        jemaat={scannedResult}
        scannedCode={scannedCode}
      />
    </div>
  );
}
