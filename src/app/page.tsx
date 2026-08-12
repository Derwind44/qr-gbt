'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem('admin_authenticated');
      if (auth === 'true') {
        router.replace('/admin');
      } else {
        router.replace('/login');
      }
    }
  }, [router]);

  return (
    <div className="py-20 text-center space-y-3">
      <div className="w-10 h-10 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-xs font-bold text-[#8C6D4F]">Mengarahkan ke Portal GBT Bethlehem Surabaya...</p>
    </div>
  );
}
