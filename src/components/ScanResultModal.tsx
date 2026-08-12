'use client';

import Link from 'next/link';
import { Jemaat } from '@/lib/types';
import { CheckCircle2, ExternalLink, X, AlertCircle, Phone, Calendar, Shield, Users, Sparkles } from 'lucide-react';
import { formatGoogleDriveUrl } from '@/lib/gdrive';

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

  if (!isOpen) return null;

  const displayId = jemaat?.id_jemaat || jemaat?.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B180B]/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md glass-panel rounded-3xl p-6 border border-[#C5A059]/40 shadow-2xl space-y-4 bg-[#FFFDF9] max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-[#6B533E] hover:text-[#2B180B] hover:bg-[#EFE5DB] transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {jemaat ? (
          <>
            {/* Header Badge */}
            <div className="flex items-center gap-3 pr-8">
              {jemaat.profile_photo_url ? (
                <img
                  src={formatGoogleDriveUrl(jemaat.profile_photo_url)}
                  alt={jemaat.full_name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-[#C5A059]/40 shrink-0 shadow-md"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-espresso-metallic border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] font-serif font-bold text-xl shrink-0 shadow-md">
                  {jemaat.full_name.charAt(0)}
                </div>
              )}
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" />
                  QR Terverifikasi GBT
                </span>
                <h2 className="text-lg sm:text-xl font-black text-[#2B180B] tracking-tight leading-snug">
                  {jemaat.full_name}
                </h2>
              </div>
            </div>

            {/* Primary Data Container */}
            <div className="bg-[#FAF6F0] rounded-2xl p-4 border border-[#C5A059]/30 space-y-3">
              {/* ID Jemaat Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[#C5A059]/20 text-xs">
                <span className="text-[#6B533E] font-bold">ID Jemaat:</span>
                <span className="font-mono font-extrabold text-[#2B180B] px-2.5 py-0.5 rounded bg-[#3B2211]/10 border border-[#3B2211]/20">
                  {displayId}
                </span>
              </div>

              {/* Grid Information */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[#6B533E] block text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Shield className="w-3 h-3 text-[#C5A059]" />
                    Jabatan Gereja
                  </span>
                  <span className="font-bold text-[#2B180B]">
                    {jemaat.church_role === 'Pelayanan/Aktivis gereja' ? 'Pelayan' : (jemaat.church_role || 'Anggota')}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[#6B533E] block text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#C5A059]" />
                    Status Keanggotaan
                  </span>
                  <span className={`font-bold flex items-center gap-1 ${
                    jemaat.status === 'Nonaktif'
                      ? 'text-amber-700'
                      : jemaat.status === 'Meninggal'
                      ? 'text-rose-900 font-black'
                      : 'text-emerald-700'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      jemaat.status === 'Nonaktif'
                        ? 'bg-amber-600'
                        : jemaat.status === 'Meninggal'
                        ? 'bg-rose-900'
                        : 'bg-emerald-600'
                    }`}></span>
                    {jemaat.status || 'Aktif'}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[#6B533E] block text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Users className="w-3 h-3 text-[#C5A059]" />
                    Kategori Jemaat
                  </span>
                  <span className="font-bold text-[#2B180B]">
                    {jemaat.category || 'Jemaat Umum'}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[#6B533E] block text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#C5A059]" />
                    Tahun Bergabung
                  </span>
                  <span className="font-bold text-[#2B180B]">
                    {jemaat.join_year || '2026'}
                  </span>
                </div>
              </div>

              {/* Contact Info */}
              {jemaat.phone && (
                <div className="pt-2 border-t border-[#C5A059]/20 text-xs flex items-center justify-between">
                  <span className="text-[#6B533E] font-bold flex items-center gap-1">
                    <Phone className="w-3 h-3 text-[#C5A059]" />
                    No. WhatsApp / HP:
                  </span>
                  <span className="font-bold font-mono text-[#2B180B]">{jemaat.phone}</span>
                </div>
              )}

              {/* Divisi yang Diikuti */}
              {jemaat.joined_divisions && jemaat.joined_divisions.length > 0 && (
                <div className="pt-2 border-t border-[#C5A059]/20 space-y-1">
                  <span className="text-[#6B533E] block text-[10px] font-bold uppercase tracking-wider">
                    Divisi / Komunitas:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {jemaat.joined_divisions.map((div) => (
                      <span key={div} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#3B2211]/10 text-[#3B2211] border border-[#3B2211]/20">
                        {div}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-2xl bg-[#EFE5DB] hover:bg-[#E5D7C3] text-[#3B2211] font-bold text-xs transition-colors text-center"
              >
                Scan Lagi
              </button>
              <Link
                href={`/jemaat/${jemaat.id}`}
                className="flex-1 py-3 px-4 rounded-2xl bg-espresso-metallic text-[#F3E5C8] font-bold text-xs border border-[#C5A059]/40 transition-all shadow-lg shadow-[#3B2211]/20 flex items-center justify-center gap-2 hover:scale-[1.02]"
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
