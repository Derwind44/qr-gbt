'use client';

import { usePathname } from 'next/navigation';
import { ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();

  // Hide footer completely on standalone Public Scanner route (/qr-scan)
  if (pathname === '/qr-scan') {
    return null;
  }

  return (
    <footer className="w-full border-t border-[#C5A059]/30 bg-[#FFFDF9] py-6 mt-12 mb-16 md:mb-0">
      <div className="max-w-6xl mx-auto px-4 text-center sm:flex sm:items-center sm:justify-between">
        <div className="flex items-center justify-center gap-2 text-xs text-[#6B533E]">
          <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
          <span>Sistem Resmi GBT Bethlehem Surabaya</span>
        </div>
        <p className="text-xs text-[#8C6D4F] mt-2 sm:mt-0 flex items-center justify-center gap-1 font-medium">
          Dibuat dengan sepenuh <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600 inline" /> untuk GBT
        </p>
      </div>
    </footer>
  );
}
