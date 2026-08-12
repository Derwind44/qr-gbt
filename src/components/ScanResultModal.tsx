'use client';

import Link from 'next/link';
import { Jemaat } from '@/lib/types';
import { CheckCircle2, ExternalLink, X, AlertCircle } from 'lucide-react';
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

  const displayId = jemaat?.id_jemaat || jemaat?.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B180B]/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md glass-panel rounded-3xl p-6 border border-[#C5A059]/40 shadow-2xl space-y-5 bg-[#FFFDF9]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-[#6B533E] hover:text-[#2B180B] hover:bg-[#EFE5DB] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {jemaat ? (
          <>
            {/* Header Badge */}
            <div className="flex items-center gap-3">
              {jemaat.profile_photo_url ? (
                <img
                  src={jemaat.profile_photo_url}
                  alt={jemaat.full_name}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-[#C5A059]/40 shrink-0 shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-espresso-metallic border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] font-serif font-bold shrink-0 shadow-sm">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              )}
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                  QR Terverifikasi GBT
                </span>
                <h2 className="text-xl font-black text-[#2B180B] tracking-tight">
                  {jemaat.full_name}
                </h2>
              </div>
            </div>

            {/* Primary Data Card */}
            <div className="bg-[#FAF6F0] rounded-2xl p-4 border border-[#C5A059]/30 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#C5A059]/20 text-xs">
                <span className="text-[#6B533E] font-bold">ID Jemaat:</span>
                <span className="font-mono font-extrabold text-[#2B180B] px-2 py-0.5 rounded bg-[#3B2211]/10 border border-[#3B2211]/20">
                  {displayId}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[#6B533E] block text-[10px] font-bold">Jabatan / Kategori</span>
                  <span className="font-bold text-[#2B180B]">{jemaat.church_role || jemaat.category || 'Jemaat Umum'}</span>
                </div>
                <div>
                  <span className="text-[#6B533E] block text-[10px] font-bold">Status</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    {jemaat.status || 'Aktif'}
                  </span>
                </div>
              </div>

              {jemaat.phone && (
                <div className="text-xs pt-1">
                  <span className="text-[#6B533E] block text-[10px] font-bold">No. WhatsApp / HP</span>
                  <span className="font-bold text-[#2B180B]">{jemaat.phone}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-2xl bg-[#EFE5DB] hover:bg-[#E5D7C3] text-[#3B2211] font-bold text-xs transition-colors text-center"
              >
                Scan Lagi
              </button>
              <Link
                href={`/jemaat/${jemaat.id}`}
                className="flex-1 py-3 px-4 rounded-2xl bg-espresso-metallic text-[#F3E5C8] font-bold text-xs border border-[#C5A059]/40 transition-all shadow-lg shadow-[#3B2211]/20 flex items-center justify-center gap-2"
              >
                <span>Lihat Detail</span>
                <ExternalLink className="w-4 h-4 text-[#D4AF37]" />
              </Link>
            </div>
          </>
        ) : (
          <>
            {/* Unknown/Not Found State */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-600/30 flex items-center justify-center text-amber-700 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                  Data Tidak Ditemukan
                </span>
                <h2 className="text-lg font-bold text-[#2B180B]">Token QR Tidak Terdaftar</h2>
              </div>
            </div>

            <div className="bg-[#FAF6F0] rounded-2xl p-4 border border-[#C5A059]/30 text-xs text-[#2B180B] space-y-2">
              <p>
                Token QR yang discan: <strong className="font-mono text-[#3B2211] font-bold">{scannedCode}</strong>
              </p>
              <p className="text-[#6B533E]">
                Data belum tersimpan di database Supabase. Pastikan formulir sudah diisi atau buat jemaat baru.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={onClose}
                className="w-full py-3 px-4 rounded-2xl bg-[#3B2211] text-[#F3E5C8] font-bold text-xs transition-colors"
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
