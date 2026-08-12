'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function QrScanRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/scan');
  }, [router]);
  return null;
}
