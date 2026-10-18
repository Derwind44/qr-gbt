'use client';

import { usePathname } from 'next/navigation';
import { ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();

  if (pathname === '/qr-scan' || pathname === '/login') {
    return null;
  }

  return (
    <footer className="hidden md:block w-full border-t border-[#C5A059]/30 bg-[#FFFDF9] py-6">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-[#6B533E]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
          <span>Sistem Resmi GBT Bethlehem Surabaya</span>
        </div>
        <p className="flex items-center gap-1 font-medium">
          Dibuat dengan sepenuh <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600 inline" /> untuk GBT
        </p>
      </div>
    </footer>
  );
}
