'use client';

import { useState } from 'react';
import { getJemaatByCodeOrId, supabase } from '@/lib/supabase';
import { Jemaat } from '@/lib/types';
import { useIsAdmin } from '@/lib/auth';
import ScanResultModal from '@/components/ScanResultModal';
import QrScanner from '@/components/QrScanner';
import { BackLink } from '@/components/ui';
import { Keyboard, Loader2, Search } from 'lucide-react';

const DEMO_CODES = ['BU-0001060895', 'tok-sample', 'JE-0002140590'];

export default function ScanPage() {
  const isAdmin = useIsAdmin();
  const [manualCode, setManualCode] = useState('');
  const [scannedResult, setScannedResult] = useState<Jemaat | null>(null);
  const [scannedCode, setScannedCode] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const processQrCode = async (code: string) => {
    if (!code || isSearching) return;
    setIsSearching(true);
    navigator.vibrate?.(50);
    try {
      setScannedResult(await getJemaatByCodeOrId(code));
    } catch (err) {
      console.error(err);
      setScannedResult(null);
    } finally {
      setScannedCode(code);
      setIsModalOpen(true);
      setIsSearching(false);
    }
  };

  const handleManualSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (manualCode.trim()) processQrCode(manualCode.trim());
  };

  return (
    <div className="max-w-md mx-auto space-y-5">
      {!isAdmin && <BackLink href="/login" label="Kembali" />}

      <div className="text-center space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-[#2B180B] tracking-tight">Scan Kartu QR</h1>
        <p className="text-[15px] text-[#6B533E]">Arahkan kamera ke kode QR di kartu jemaat untuk melihat datanya.</p>
      </div>

      <QrScanner
        onScan={processQrCode}
        paused={isModalOpen || isSearching}
        overlay={
          isSearching && (
            <div className="absolute inset-0 bg-[#2B180B]/60 flex flex-col items-center justify-center gap-2 text-[#F3E5C8]">
              <Loader2 className="w-10 h-10 animate-spin text-[#D4AF37]" />
              <p className="font-bold">Mencari data…</p>
            </div>
          )
        }
      />

      <form onSubmit={handleManualSubmit} className="card p-4 space-y-3">
        <label htmlFor="manual-code" className="flex items-center gap-2 text-[15px] font-bold text-[#2B180B]">
          <Keyboard className="w-5 h-5 text-[#C5A059]" />
          QR tidak terbaca? Ketik ID Jemaat
        </label>
        <div className="flex gap-2">
          <input
            id="manual-code"
            type="text"
            placeholder="Contoh: BU-0001060895"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="search"
            className="input font-mono flex-1 min-w-0"
          />
          <button type="submit" disabled={!manualCode.trim() || isSearching} className="btn btn-primary px-4" aria-label="Cari">
            {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5 text-[#D4AF37]" />}
            <span className="hidden min-[380px]:inline">Cari</span>
          </button>
        </div>

        {!supabase && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-sm text-[#6B533E]">
            <span>Contoh tes:</span>
            {DEMO_CODES.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setManualCode(code);
                  processQrCode(code);
                }}
                className="px-2.5 h-9 rounded-lg bg-[#FAF6F0] hover:bg-[#EFE5DB] text-[#3B2211] font-mono font-bold border border-[#C5A059]/30"
              >
                {code}
              </button>
            ))}
          </div>
        )}
      </form>

      <ScanResultModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        jemaat={scannedResult}
        scannedCode={scannedCode}
      />
    </div>
  );
}
