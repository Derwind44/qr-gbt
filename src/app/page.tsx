'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { refreshAdminSession } from '@/lib/auth';
import { Spinner } from '@/components/ui';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    refreshAdminSession().then((ok) => router.replace(ok ? '/admin' : '/login'));
  }, [router]);

  return <Spinner label="Membuka aplikasi…" />;
}
