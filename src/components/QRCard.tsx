'use client';

import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Jemaat } from '@/lib/types';
import { Download, Printer, CheckCircle2, User, Phone, MapPin, Tag } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QRCardProps {
  jemaat: Jemaat;
  showDownloadBtn?: boolean;
}

export default function QRCard({ jemaat, showDownloadBtn = true }: QRCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Download QR Code image
  const handleDownloadQR = () => {
    setIsDownloading(true);
    try {
      // Find SVG inside card
      const svgElement = cardRef.current?.querySelector('svg');
      if (!svgElement) {
        alert('Gagal menemukan QR Code untuk diunduh');
        setIsDownloading(false);
        return;
      }

      // Convert SVG to Canvas and Download as PNG
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width + 80;
        canvas.height = img.height + 120;
        if (ctx) {
          // Fill background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw Title
          ctx.fillStyle = '#1e1b4b';
          ctx.font = 'bold 20px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('KARTU QR JEMAAT GBT', canvas.width / 2, 40);

          // Draw QR Image
          ctx.drawImage(img, 40, 60);

          // Draw Member Name & Code
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 18px sans-serif';
          ctx.fillText(jemaat.full_name, canvas.width / 2, canvas.height - 40);

          ctx.fillStyle = '#475569';
          ctx.font = '14px monospace';
          ctx.fillText(jemaat.qr_code_data, canvas.width / 2, canvas.height - 18);

          // Trigger download
          const pngUrl = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = `QR_${jemaat.full_name.replace(/\s+/g, '_')}_${jemaat.qr_code_data}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);

          // Confetti celebration
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.8 },
          });
        }
        setIsDownloading(false);
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (err) {
      console.error(err);
      alert('Gagal mengunduh QR Code');
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Digital ID Card Frame */}
      <div
        id="printable-qr-card"
        ref={cardRef}
        className="w-full max-w-sm glass-panel rounded-3xl p-6 border border-slate-700/80 shadow-2xl relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900/90 to-indigo-950/40"
      >
        {/* Top Decorative Banner */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400" />

        {/* Card Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase">
              Gereja GBT - Kartu Akses Digital
            </span>
            <h3 className="text-xl font-bold text-white tracking-tight">{jemaat.full_name}</h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {jemaat.status || 'Aktif'}
          </span>
        </div>

        {/* QR Code Canvas Frame */}
        <div className="bg-white p-5 rounded-2xl shadow-inner flex flex-col items-center justify-center my-2 border border-slate-200">
          <QRCodeSVG
            value={jemaat.qr_code_data}
            size={180}
            level="H"
            includeMargin={true}
          />
          <div className="mt-3 text-center">
            <p className="text-xs font-mono font-bold text-slate-800 tracking-wider">
              {jemaat.qr_code_data}
            </p>
            <p className="text-[10px] text-slate-500">Scan QR ini untuk melihat data</p>
          </div>
        </div>

        {/* Card Details */}
        <div className="space-y-2 mt-4 text-xs text-slate-300">
          {jemaat.category && (
            <div className="flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Kategori: <strong className="text-slate-100">{jemaat.category}</strong></span>
            </div>
          )}
          {jemaat.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>HP: <strong className="text-slate-100">{jemaat.phone}</strong></span>
            </div>
          )}
          {jemaat.city && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Kota: <strong className="text-slate-100">{jemaat.city}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {showDownloadBtn && (
        <div className="flex items-center gap-3 w-full max-w-sm">
          <button
            onClick={handleDownloadQR}
            disabled={isDownloading}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloading ? 'Mengunduh...' : 'Unduh QR Code (PNG)'}</span>
          </button>
          <button
            onClick={handlePrint}
            title="Cetak Kartu"
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
