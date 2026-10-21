'use client';

import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Jemaat } from '@/lib/types';
import { displayName } from '@/lib/options';
import { Download, RotateCw, Loader2 } from 'lucide-react';
import { formatGoogleDriveUrl } from '@/lib/gdrive';

interface QRCardProps {
  jemaat: Jemaat;
  showDownloadBtn?: boolean;
}

function splitNameToMaxTwoLines(fullName: string): string[] {
  if (!fullName) return [''];
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return [fullName];

  // Keep single line if short enough (<= 20 chars and <= 3 words)
  if (fullName.length <= 20 && words.length <= 3) {
    return [fullName];
  }

  // Split into 2 balanced lines
  const mid = Math.ceil(words.length / 2);
  const firstLine = words.slice(0, mid).join(' ');
  const secondLine = words.slice(mid).join(' ');

  return [firstLine, secondLine];
}

export default function QRCard({ jemaat, showDownloadBtn = true }: QRCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  const displayId = jemaat.id_jemaat || jemaat.id;
  const qrValue = jemaat.qr_token || jemaat.id_jemaat || jemaat.id;

  const rawRole = jemaat.church_role === 'Pelayanan/Aktivis gereja' ? 'Pelayan' : (jemaat.church_role || 'Anggota Jemaat');
  let mainDivision = rawRole;
  if (mainDivision === 'Pelayanan/Aktivis gereja') mainDivision = 'Pelayan';

  let categoryText = jemaat.category || rawRole;
  if (categoryText === 'Pelayanan/Aktivis gereja') categoryText = 'Pelayan';

  const phoneText = jemaat.phone || '-';
  const nameLines = splitNameToMaxTwoLines(displayName(jemaat.full_name));

  // Card is valid for 3 years from when the record (and its card) was created, not from join_year.
  const issuedYear = new Date(jemaat.created_at || Date.now()).getFullYear();
  const validUntilText = `VALID UNTIL: DEC ${(isNaN(issuedYear) ? new Date().getFullYear() : issuedYear) + 3}`;

  const handleDownloadCard = async () => {
    if (!cardRef.current || isDownloading) return;
    try {
      setIsDownloading(true);
      setDownloadError('');

      const { toPng } = await import('html-to-image');
      const targetEl = cardRef.current;
      const dataUrl = await toPng(targetEl, {
        quality: 1.0,
        pixelRatio: 3,
        cacheBust: true,
      });

      const fileName = `kartu_jemaat_${jemaat.full_name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${activeSide}.png`;
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('html-to-image error:', err);
      setDownloadError('Gagal mengunduh kartu. Periksa koneksi lalu coba lagi.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Side Switcher */}
      <div className="grid grid-cols-2 w-full max-w-[340px] p-1 rounded-2xl bg-[#EFE5DB] border border-[#C5A059]/30" role="tablist" aria-label="Sisi kartu">
        {(['front', 'back'] as const).map((side) => (
          <button
            key={side}
            type="button"
            role="tab"
            aria-selected={activeSide === side}
            onClick={() => setActiveSide(side)}
            className={`h-11 rounded-xl text-sm font-bold transition-colors ${
              activeSide === side ? 'bg-[#3B2211] text-[#F3E5C8] shadow' : 'text-[#6B533E] hover:text-[#2B180B]'
            }`}
          >
            {side === 'front' ? 'Depan' : 'Belakang (QR)'}
          </button>
        ))}
      </div>

      {/* 3D Flip Card Outer Container */}
      <div className="w-full max-w-[340px] aspect-[5/8] relative [perspective:1000px] shrink-0">
        {/* 3D Flipping Card Element */}
        <div
          id="printable-qr-card"
          ref={cardRef}
          className={`w-full h-full rounded-[32px] border-2 border-[#C5A059]/40 shadow-2xl relative transition-all duration-700 [transform-style:preserve-3d] ${
            activeSide === 'back' ? '[transform:rotateY(180deg)]' : '[transform:rotateY(0deg)]'
          }`}
          style={{
            boxShadow: '0 20px 40px -15px rgba(59, 34, 17, 0.2), 0 0 25px rgba(197, 160, 89, 0.25)',
          }}
        >
          {/* FRONT SIDE FACE */}
          <div className="absolute inset-0 w-full h-full rounded-[32px] overflow-hidden bg-[#FFFDF9] [backface-visibility:hidden]">
            {/* LAYER 1: Photo (z-0, BEHIND card template) */}
            <div className="absolute top-[4.8%] left-[12%] right-[12%] h-[40%] overflow-hidden flex items-center justify-center bg-[#FAF6F0] z-0">
              {jemaat.profile_photo_url ? (
                <img
                  src={formatGoogleDriveUrl(jemaat.profile_photo_url)}
                  alt={jemaat.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#FAF6F0] to-[#EFE5DB] text-[#3B2211]">
                  <span className="text-5xl font-black font-serif text-[#C5A059]">
                    {jemaat.full_name.charAt(0)}
                  </span>
                  <span className="text-[10px] text-[#6B533E] font-bold mt-1">Foto Jemaat</span>
                </div>
              )}
            </div>

            {/* LAYER 2: ID Card Template Image */}
            <img
              src="/notext_front_idcard.png"
              alt=""
              decoding="async"
              className="absolute inset-0 w-full h-full object-fill z-10 pointer-events-none"
            />

            {/* LAYER 3: Dynamic Text Overlays */}
            <div className="absolute inset-0 z-20 pointer-events-none">
              {/* Dynamic Full Name Overlay */}
              <div className="absolute top-[54%] left-4 right-4 text-center">
                <h2 className="text-xl font-black text-[#2D190B] tracking-tight leading-tight line-clamp-2 px-1">
                  {nameLines.map((line, index) => (
                    <span key={index} className="block">
                      {line}
                    </span>
                  ))}
                </h2>
              </div>

              {/* Dynamic Division Text Overlay */}
              <div className="absolute top-[65.2%] left-0 right-0 text-center">
                <span className="font-bold text-sm text-[#FFFDF9] tracking-wide uppercase">
                  {mainDivision}
                </span>
              </div>

              {/* Dynamic Table Values Overlay (ID No, Category, Phone) */}
              <div className="absolute top-[73.5%] left-[36%] right-4 space-y-[7px] text-xs font-mono font-extrabold text-[#2D190B]">
                <div className="truncate font-sans font-bold text-xs">{displayId}</div>
                <div className="truncate font-sans font-bold text-xs">{categoryText}</div>
                <div className="truncate font-sans font-bold text-xs">{phoneText}</div>
              </div>
            </div>
          </div>

          {/* BACK SIDE FACE */}
          <div className="absolute inset-0 w-full h-full rounded-[32px] overflow-hidden bg-[#FFFDF9] [backface-visibility:hidden] [transform:rotateY(180deg)]">
            {/* LAYER 1: Back Card Template Image */}
            <img
              src="/notext_back_idcard.png"
              alt=""
              decoding="async"
              className="absolute inset-0 w-full h-full object-fill z-10 pointer-events-none"
            />

            {/* LAYER 2: QR Code & Valid Until Overlays */}
            <div className="absolute inset-0 z-20 pointer-events-none">
              {/* Dynamic QR Code Overlay Container */}
              <div className="absolute top-[25%] left-0 right-0 flex justify-center">
                <div className="p-2 bg-white rounded-2xl border-2 border-[#3B2211] shadow-lg flex items-center justify-center">
                  <QRCodeSVG
                    value={qrValue}
                    size={120}
                    level="H"
                    includeMargin={false}
                  />
                </div>
              </div>

              {/* Dynamic Valid Until Expiry Overlay */}
              <div className="absolute bottom-[4%] right-[3%] left-[45%] text-center">
                <p className="text-[10px] font-black text-[#3B2211] tracking-tight">
                  {validUntilText}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {showDownloadBtn && (
        <div className="w-full max-w-[340px] space-y-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadCard}
              disabled={isDownloading}
              className="btn btn-primary flex-1"
            >
              {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5 text-[#D4AF37]" />}
              {isDownloading ? 'Menyiapkan gambar…' : activeSide === 'front' ? 'Unduh Kartu Depan' : 'Unduh Kartu Belakang'}
            </button>
            <button
              type="button"
              onClick={() => setActiveSide(activeSide === 'front' ? 'back' : 'front')}
              aria-label="Balik kartu"
              title="Balik kartu"
              className="btn btn-secondary w-12 px-0"
            >
              <RotateCw className="w-5 h-5" />
            </button>
          </div>
          {downloadError && <p className="text-sm font-semibold text-rose-700 text-center" role="alert">{downloadError}</p>}
        </div>
      )}
    </div>
  );
}
