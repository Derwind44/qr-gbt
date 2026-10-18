'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { verifyAdminPassword } from '@/lib/supabase';
import { readIsAdmin, setAdminSession } from '@/lib/auth';
import { Lock, User, Eye, EyeOff, Loader2, QrCode } from 'lucide-react';
import Link from 'next/link';
import { Alert } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (readIsAdmin()) router.replace('/admin');
  }, [router]);

  const handleLogin = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password) {
      setErrorMsg('Isi username dan password terlebih dahulu.');
      return;
    }

    if (username.trim() !== 'adminGBT') {
      setErrorMsg('Username tidak dikenal. Periksa huruf besar/kecil.');
      return;
    }

    if (!verifyAdminPassword(password)) {
      setErrorMsg('Password salah. Silakan coba lagi.');
      return;
    }

    setLoading(true);
    setAdminSession();
    router.replace('/admin');
  };

  return (
    <div className="min-h-[85dvh] flex flex-col justify-center items-center py-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 rounded-full bg-espresso-metallic border-2 border-[#D4AF37] mx-auto shadow-lg overflow-hidden">
            <img src="/logo.png" alt="Logo GBT Bethlehem Surabaya" width={80} height={80} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-3xl font-black text-[#2B180B] tracking-tight">
              bethlehem<span className="text-[#C5A059]">.</span>
            </p>
            <p className="text-[11px] tracking-[0.25em] text-[#6B533E] uppercase font-bold">surabaya church</p>
          </div>
        </div>

        <div className="card p-6 sm:p-7 space-y-5 shadow-xl">
          <div>
            <h1 className="text-xl font-black text-[#2B180B]">Masuk Admin</h1>
            <p className="text-sm text-[#6B533E] mt-0.5">Khusus pengurus data jemaat GBT Bethlehem.</p>
          </div>

          {errorMsg && <Alert>{errorMsg}</Alert>}

          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            <div>
              <label htmlFor="username" className="label">
                Username
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-[#8C6D4F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                  className="input pl-11"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-[#8C6D4F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                  className="input pl-11 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl flex items-center justify-center text-[#6B533E] hover:bg-[#EFE5DB]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full mt-2">
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {loading ? 'Masuk…' : 'Masuk'}
            </button>
          </form>
        </div>

        <Link href="/scan" className="btn btn-ghost w-full">
          <QrCode className="w-5 h-5 text-[#9A7B38]" />
          Cek Kartu QR Jemaat
        </Link>
      </div>
    </div>
  );
}
