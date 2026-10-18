'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { readIsAdmin } from '@/lib/auth';
import { Spinner } from '@/components/ui';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(readIsAdmin() ? '/admin' : '/login');
  }, [router]);

  return <Spinner label="Membuka aplikasi…" />;
}
