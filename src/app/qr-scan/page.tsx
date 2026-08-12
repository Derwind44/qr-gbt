'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { getJemaatByCodeOrId } from '@/lib/supabase';
import { Jemaat } from '@/lib/types';
import ScanResultModal from '@/components/ScanResultModal';
import { QrCode, Camera, AlertCircle, RefreshCw, Keyboard, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function PublicScanPage() {
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [scannedResult, setScannedResult] = useState<Jemaat | null>(null);
  const [scannedCode, setScannedCode] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

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
        html5QrCodeRef.current = new Html5Qrcode('public-qr-reader');
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
        () => {}
      );
      setScanning(true);
    } catch (err: any) {
      console.error('Camera Error:', err);
      setCameraError('Gagal mengakses kamera HP. Pastikan Anda mengizinkan akses kamera.');
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
      } catch (err) {}
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
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-between p-3 sm:p-6 pb-20 md:pb-6">
      {/* Top Header - Public Scan (Standalone Header, No Footer) */}
      <div className="flex items-center justify-between bg-[#FFFDF9] p-3 sm:p-4 rounded-2xl border border-[#C5A059]/40 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#3B2211] border border-[#D4AF37] flex items-center justify-center shadow-sm overflow-hidden shrink-0">
            <img
              src="/logo.png"
              alt="GBT Bethlehem Surabaya Logo"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div>
            <h1 className="font-extrabold text-sm sm:text-base text-[#2B180B] leading-tight">
              bethlehem <span className="text-[#C5A059] font-black text-base">.</span>
            </h1>
            <p className="text-[8px] sm:text-[9px] tracking-[0.2em] text-[#6B533E] uppercase font-bold">
              PEMINDAI QR PUBLIK
            </p>
          </div>
        </div>

        <Link
          href="/login"
          className="px-3.5 py-1.5 rounded-xl bg-espresso-metallic text-[#F3E5C8] text-xs font-bold border border-[#C5A059]/40 shadow-sm flex items-center gap-1.5 hover:scale-105 transition-transform"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Login Admin</span>
        </Link>
      </div>

      {/* Main Mobile Scanner Area */}
      <div className="my-auto py-4 space-y-4 max-w-md mx-auto w-full">
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-[#2B180B]">
            Pindai Kartu Akses QR
          </h2>
          <p className="text-xs text-[#6B533E]">
            Arahkan kamera ke Kartu QR Jemaat untuk verifikasi cepat.
          </p>
        </div>

        {/* Camera Box Frame */}
        <div className="glass-panel rounded-3xl p-4 border-2 border-[#C5A059]/50 shadow-2xl bg-[#FFFDF9] space-y-4">
          <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[#2B180B] border border-[#C5A059]/50 flex flex-col items-center justify-center">
            <div id="public-qr-reader" className="w-full h-full" />

            {!scanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#2B180B]/95 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[#3B2211] border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] shadow-lg">
                  <Camera className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[#F3E5C8]">Kamera Belum Aktif</h3>
                  <p className="text-xs text-[#EAD6B0]">
                    Tekan tombol untuk membuka kamera pemindai.
                  </p>
                </div>
                <button
                  onClick={startScanner}
                  className="px-6 py-3.5 rounded-2xl bg-gold-metallic text-[#2B180B] font-extrabold text-sm shadow-xl shadow-[#C5A059]/30 transition-all active:scale-95 flex items-center gap-2"
                >
                  <Camera className="w-5 h-5 text-[#2B180B]" />
                  <span>Aktifkan Kamera Pemindai</span>
                </button>
              </div>
            )}

            {scanning && (
              <div className="absolute inset-x-6 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent animate-scan shadow-lg shadow-[#D4AF37] pointer-events-none" />
            )}
          </div>

          {scanning && (
            <div className="flex justify-center">
              <button
                onClick={stopScanner}
                className="px-5 py-2 rounded-xl bg-rose-500/10 text-rose-800 border border-rose-600/30 text-xs font-bold"
              >
                Matikan Kamera
              </button>
            </div>
          )}

          {cameraError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Manual Input Fallback */}
          <div className="pt-2 border-t border-[#C5A059]/25 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#2B180B]">
              <Keyboard className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Ketik Kode QR Secara Manual:</span>
            </div>

            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="BU-0001060895"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#FFFDF9] border border-[#C5A059]/40 text-xs text-[#2B180B] font-mono font-bold focus:outline-none focus:border-[#3B2211]"
              />
              <button
                type="submit"
                disabled={!manualCode.trim() || isSearching}
                className="px-4 py-2 rounded-xl bg-espresso-metallic text-[#F3E5C8] text-xs font-bold border border-[#C5A059]/40 disabled:opacity-50"
              >
                {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>Cari</span>}
              </button>
            </form>
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
