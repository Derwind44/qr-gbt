'use client';

import Link from 'next/link';
import { JemaatPublic } from '@/lib/types';
import { BadgeCheck, ChevronRight, SearchX, QrCode } from 'lucide-react';
import { useIsAdmin } from '@/lib/auth';
import { roleLabel } from '@/lib/options';
import { Avatar, Sheet, StatusBadge } from './ui';

interface ScanResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  jemaat: JemaatPublic | null;
  scannedCode: string;
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-[13px] font-semibold text-[#6B533E]">{label}</dt>
      <dd className="text-[15px] font-bold text-[#2B180B] break-words">{value || '—'}</dd>
    </div>
  );
}

export default function ScanResultModal({ isOpen, onClose, jemaat, scannedCode }: ScanResultModalProps) {
  const isAdmin = useIsAdmin();

  return (
    <Sheet open={isOpen} onClose={onClose} title={jemaat ? 'Hasil Scan' : 'QR Tidak Dikenal'}>
      {jemaat ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar name={jemaat.full_name} src={jemaat.profile_photo_url} size="lg" />
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700">
                <BadgeCheck className="w-4 h-4" />
                Jemaat terdaftar
              </p>
              <h3 className="text-xl font-black text-[#2B180B] leading-tight break-words">{jemaat.full_name}</h3>
              <p className="text-sm font-mono font-bold text-[#6B533E]">{jemaat.id_jemaat || jemaat.id}</p>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-[#FAF6F0] border border-[#C5A059]/30">
            <Info label="Peran" value={roleLabel(jemaat)} />
            <div>
              <dt className="text-[13px] font-semibold text-[#6B533E]">Status</dt>
              <dd className="mt-0.5">
                <StatusBadge status={jemaat.status} />
              </dd>
            </div>
            <Info label="Kategori" value={jemaat.category || 'Jemaat Umum'} />
            <Info label="Bergabung" value={jemaat.join_year} />
            {jemaat.joined_divisions && jemaat.joined_divisions.length > 0 && (
              <div className="col-span-2">
                <dt className="text-[13px] font-semibold text-[#6B533E]">Divisi</dt>
                <dd className="flex flex-wrap gap-1.5 mt-1">
                  {jemaat.joined_divisions.map((div) => (
                    <span key={div} className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#3B2211]/10 text-[#3B2211]">
                      {div}
                    </span>
                  ))}
                </dd>
              </div>
            )}
          </dl>

          <div className={`grid gap-3 ${isAdmin ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              <QrCode className="w-5 h-5" />
              Scan Lagi
            </button>
            {isAdmin && (
              <Link href={`/jemaat/${jemaat.id}`} className="btn btn-primary">
                Lihat Detail
                <ChevronRight className="w-5 h-5 text-[#D4AF37]" />
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-600/30">
            <SearchX className="w-8 h-8 text-amber-700 shrink-0" />
            <p className="text-[15px] text-amber-900">
              Kode ini belum terdaftar sebagai jemaat. Pastikan kartu yang di-scan adalah kartu jemaat GBT Bethlehem.
            </p>
          </div>
          <p className="text-sm text-[#6B533E] break-all">
            Kode terbaca: <span className="font-mono font-bold text-[#3B2211]">{scannedCode}</span>
          </p>
          <button type="button" onClick={onClose} className="btn btn-primary w-full">
            <QrCode className="w-5 h-5 text-[#D4AF37]" />
            Coba Scan Lagi
          </button>
        </div>
      )}
    </Sheet>
  );
}
