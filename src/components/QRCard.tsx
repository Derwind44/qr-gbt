'use client';

import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Jemaat } from '@/lib/types';
import { Download, RotateCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toPng } from 'html-to-image';
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

  // Find split index between 1 and words.length - 1 that minimizes line length difference
  let bestSplit = 1;
  let minDiff = Infinity;

  for (let i = 1; i < words.length; i++) {
    const line1 = words.slice(0, i).join(' ');
    const line2 = words.slice(i).join(' ');
    const diff = Math.abs(line1.length - line2.length);

    if (diff < minDiff) {
      minDiff = diff;
      bestSplit = i;
    }
  }

  return [
    words.slice(0, bestSplit).join(' '),
    words.slice(bestSplit).join(' ')
  ];
}

export default function QRCard({ jemaat, showDownloadBtn = true }: QRCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [isDownloading, setIsDownloading] = useState(false);

  const displayId = jemaat.id_jemaat || jemaat.id;
  const qrValue = jemaat.qr_token || jemaat.id_jemaat || jemaat.id;

  const rawRole = jemaat.church_role === 'Pelayanan/Aktivis gereja' ? 'Pelayan' : (jemaat.church_role || 'Anggota Jemaat');
  let mainDivision = jemaat.joined_divisions?.[0] || rawRole;
  if (mainDivision === 'Pelayanan/Aktivis gereja') mainDivision = 'Pelayan';

  let categoryText = jemaat.category || rawRole;
  if (categoryText === 'Pelayanan/Aktivis gereja') categoryText = 'Pelayan';

  const phoneText = jemaat.phone || '-';
  const nameLines = splitNameToMaxTwoLines(jemaat.full_name);

  // Calculate Next Level Year
  const nextLevelYear = jemaat.join_year ? parseInt(jemaat.join_year) + 5 : new Date().getFullYear() + 5;
  const validUntilText = `${jemaat.birth_date || 'DD/MM'} - ${nextLevelYear}`;

  // Pixel-Perfect Screenshot Download using native browser renderer via html-to-image
  const handleDownloadCard = async () => {
    setIsDownloading(true);
    try {
      const cardElement = cardRef.current;
      if (!cardElement) return;

      // 100% exact 1:1 pixel-perfect screenshot of the rendered DOM card element
      const dataUrl = await toPng(cardElement, {
        pixelRatio: 3,
        cacheBust: true,
        quality: 1.0,
      });

      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = `Kartu_GBT_${activeSide === 'front' ? 'Depan' : 'Belakang'}_${jemaat.full_name.replace(/\s+/g, '_')}_${displayId}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (err) {
      console.error('html-to-image error:', err);
      alert('Gagal mengunduh kartu. Silakan coba lagi.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Side Switcher Pills */}
      <div className="flex items-center gap-2 bg-[#EFE5DB] p-1 rounded-2xl border border-[#C5A059]/30">
        <button
          type="button"
          onClick={() => setActiveSide('front')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeSide === 'front'
              ? 'bg-[#3B2211] text-[#F3E5C8] shadow-md shadow-[#3B2211]/30'
              : 'text-[#6B533E] hover:text-[#2B180B]'
          }`}
        >
          Depan (Front Card)
        </button>
        <button
          type="button"
          onClick={() => setActiveSide('back')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeSide === 'back'
              ? 'bg-[#3B2211] text-[#F3E5C8] shadow-md shadow-[#3B2211]/30'
              : 'text-[#6B533E] hover:text-[#2B180B]'
          }`}
        >
          Belakang (Back - QR)
        </button>
      </div>

      {/* Dynamic ID Card DOM Element */}
      <div
        id="printable-qr-card"
        ref={cardRef}
        className="w-full max-w-[340px] aspect-[5/8] rounded-[32px] border-2 border-[#C5A059]/40 shadow-2xl relative overflow-hidden bg-[#FFFDF9] transition-all duration-300 shrink-0"
        style={{
          boxShadow: '0 20px 40px -15px rgba(59, 34, 17, 0.2), 0 0 25px rgba(197, 160, 89, 0.25)',
        }}
      >
        {/* FRONT SIDE */}
        {activeSide === 'front' ? (
          <div className="relative w-full h-full">
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

            {/* LAYER 2: ID Card Template Image (z-10, with transparent window, overlays ON TOP of photo!) */}
            <img
              src="/notext_front_idcard.png"
              alt="Front Template"
              className="absolute inset-0 w-full h-full object-fill z-10 pointer-events-none"
            />

            {/* LAYER 3: Dynamic Text Overlays (z-20) */}
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
        ) : (
          /* BACK SIDE */
          <div className="relative w-full h-full">
            {/* LAYER 1: Back Card Template Image */}
            <img
              src="/notext_back_idcard.png"
              alt="Back Template"
              className="absolute inset-0 w-full h-full object-fill z-10 pointer-events-none"
            />

            {/* LAYER 2: QR Code & Valid Until Overlays (z-20) */}
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

              {/* Dynamic Valid Until Expiry Overlay (Directly beneath VALID UNTIL label) */}
              <div className="absolute bottom-[4%] right-[3%] left-[45%] text-center">
                <p className="text-[10px] font-black text-[#3B2211] tracking-tight">
                  {validUntilText}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {showDownloadBtn && (
        <div className="flex items-center gap-3 w-full max-w-[340px]">
          <button
            type="button"
            onClick={handleDownloadCard}
            disabled={isDownloading}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-espresso-metallic text-[#F3E5C8] font-bold text-xs shadow-lg shadow-[#3B2211]/20 transition-all hover:scale-[1.02] active:scale-[0.98] border border-[#C5A059]/40 disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-[#D4AF37]" />
            <span>{isDownloading ? 'Mengunduh PNG...' : `Unduh ${activeSide === 'front' ? 'Kartu Depan' : 'QR Belakang'} (PNG)`}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSide((prev) => (prev === 'front' ? 'back' : 'front'))}
            title="Balik Kartu (Flip Card)"
            className="p-3 rounded-2xl bg-[#FFFDF9] hover:bg-[#FAF6F0] text-[#3B2211] border border-[#C5A059]/40 shadow-sm transition-all"
          >
            <RotateCw className="w-4 h-4 text-[#C5A059]" />
          </button>
        </div>
      )}
    </div>
  );
}
