'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { getJemaatByCodeOrId } from '@/lib/supabase';
import { Jemaat } from '@/lib/types';
import ScanResultModal from '@/components/ScanResultModal';
import { QrCode, Camera, SwitchCamera, AlertCircle, RefreshCw, Sparkles, Keyboard } from 'lucide-react';

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
      // Stop scanner temporarily when code detected
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
        { facingMode: 'environment' }, // Rear camera default
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

  const handleManualSubmit = (e: React.FormEvent) => {
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
          <QrCode className="w-3.5 h-3.5" />
          <span>Pemindai QR Code Jemaat</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
          Scan Kartu QR
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Arahkan kamera ke Kartu QR <code className="text-indigo-300 font-mono">gbt-XXXXXXXXXX</code> untuk memverifikasi dan melihat data utama jemaat.
        </p>
      </div>

      {/* Main Scanner Container */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Scanner Box */}
        <div className="relative w-full aspect-square max-w-md mx-auto rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex flex-col items-center justify-center">
          <div id="qr-reader" className="w-full h-full" />

          {!scanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/90 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg">
                <Camera className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Kamera Belum Aktif</h3>
                <p className="text-xs text-slate-400 max-w-xs">
                  Tekan tombol di bawah untuk mengaktifkan pemindai kamera.
                </p>
              </div>
              <button
                onClick={startScanner}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>Aktifkan Kamera</span>
              </button>
            </div>
          )}

          {/* Scanner Overlay Line when Scanning */}
          {scanning && (
            <div className="absolute inset-x-8 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent animate-scan shadow-lg shadow-indigo-500 pointer-events-none" />
          )}
        </div>

        {/* Camera Controls */}
        {scanning && (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={stopScanner}
              className="px-5 py-2.5 rounded-xl bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <span>Matikan Kamera</span>
            </button>
          </div>
        )}

        {/* Error Notification */}
        {cameraError && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{cameraError}</span>
          </div>
        )}

        {/* Manual Code Input Fallback */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Keyboard className="w-4 h-4 text-indigo-400" />
            <span>Atau Ketik Kode QR Secara Manual (Uji Coba):</span>
          </div>

          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Contoh: gbt-8492019482"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <button
              type="submit"
              disabled={!manualCode.trim() || isSearching}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              {isSearching ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <span>Verifikasi</span>
              )}
            </button>
          </form>

          {/* Quick Demo Code buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
            <span>Contoh Kode Tes:</span>
            {['gbt-8492019482', 'gbt-3920184729', 'gbt-9182736450'].map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setManualCode(code);
                  processQrCode(code);
                }}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 font-mono transition-colors"
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
