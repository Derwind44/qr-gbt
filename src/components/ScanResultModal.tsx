'use client';

import Link from 'next/link';
import { Jemaat } from '@/lib/types';
import { CheckCircle2, User, Phone, MapPin, ExternalLink, X, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

interface ScanResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  jemaat: Jemaat | null;
  scannedCode: string;
}

export default function ScanResultModal({
  isOpen,
  onClose,
  jemaat,
  scannedCode,
}: ScanResultModalProps) {
  useEffect(() => {
    if (isOpen && jemaat) {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 },
      });
    }
  }, [isOpen, jemaat]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md glass-panel rounded-3xl p-6 border border-slate-700 shadow-2xl space-y-5 bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/50">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {jemaat ? (
          <>
            {/* Header Badge */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  QR ValidTerdeteksi
                </span>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {jemaat.full_name}
                </h2>
              </div>
            </div>

            {/* Primary Data Card */}
            <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                <span className="text-slate-400">Kode QR:</span>
                <span className="font-mono font-bold text-indigo-300 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                  {jemaat.qr_code_data}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Kategori</span>
                  <span className="font-medium text-slate-200">{jemaat.category || 'Jemaat Umum'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Status</span>
                  <span className="font-medium text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    {jemaat.status || 'Aktif'}
                  </span>
                </div>
              </div>

              {jemaat.phone && (
                <div className="text-xs pt-1">
                  <span className="text-slate-400 block text-[10px]">No. WhatsApp / HP</span>
                  <span className="font-medium text-slate-200">{jemaat.phone}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition-colors text-center"
              >
                Scan Lagi
              </button>
              <Link
                href={`/jemaat/${jemaat.id}`}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
              >
                <span>Lihat Detail</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </>
        ) : (
          <>
            {/* Unknown/Not Found State */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Data Tidak Ditemukan
                </span>
                <h2 className="text-lg font-bold text-white">Kode Tidak Terdaftar</h2>
              </div>
            </div>

            <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800 text-xs text-slate-300 space-y-2">
              <p>
                Kode QR yang discan adalah: <strong className="font-mono text-indigo-300">{scannedCode}</strong>
              </p>
              <p className="text-slate-400">
                Data belum ada di Supabase. Pastikan formulir Google Form sudah diisi atau buat data baru.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={onClose}
                className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-colors"
              >
                Coba Scan Ulang
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
