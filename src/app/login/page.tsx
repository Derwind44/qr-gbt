'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { verifyAdminPassword } from '@/lib/supabase';
import { ShieldCheck, Lock, User, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem('admin_authenticated');
      if (auth === 'true') {
        router.push('/admin');
      }
    }
  }, [router]);

  const handleLogin = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (username.trim() !== 'adminGBT') {
      setErrorMsg('Username Admin tidak valid.');
      return;
    }

    if (!verifyAdminPassword(password)) {
      setErrorMsg('Password Admin salah.');
      return;
    }

    setLoading(true);

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('admin_authenticated', 'true');
      sessionStorage.setItem('admin_login_time', new Date().toISOString());
    }

    setTimeout(() => {
      router.push('/admin');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-center items-center px-4 py-12">
      {/* Container */}
      <div className="w-full max-w-md space-y-6">
        {/* Brand Hero Box */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-espresso-metallic border-2 border-[#D4AF37] flex items-center justify-center mx-auto shadow-xl overflow-hidden shrink-0">
            <img
              src="/logo.png"
              alt="GBT Bethlehem Surabaya Logo"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#2B180B] tracking-tight">
              bethlehem <span className="text-[#C5A059] font-black text-3xl">.</span>
            </h1>
            <p className="text-[10px] tracking-[0.25em] text-[#6B533E] uppercase font-bold">
              surabaya church
            </p>
          </div>
        </div>

        {/* Login Form Box */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-[#C5A059]/40 space-y-6 shadow-2xl bg-[#FFFDF9]">
          <div className="flex items-center justify-center gap-2 pb-3 border-b border-[#C5A059]/25 text-[#2B180B] font-extrabold text-sm">
            <ShieldCheck className="w-5 h-5 text-[#C5A059]" />
            <span>Login Portal Admin GBT</span>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-600/30 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#2B180B]">Username Admin</label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan Username"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FFFDF9] border border-[#C5A059]/40 text-sm text-[#2B180B] font-bold focus:outline-none focus:border-[#3B2211]"
                />
                <User className="w-4 h-4 text-[#8C6D4F] absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#2B180B]">Password Admin</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FFFDF9] border border-[#C5A059]/40 text-sm text-[#2B180B] font-bold focus:outline-none focus:border-[#3B2211]"
                />
                <Lock className="w-4 h-4 text-[#8C6D4F] absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-espresso-metallic text-[#F3E5C8] font-black text-sm border border-[#C5A059]/40 shadow-xl shadow-[#3B2211]/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              {loading ? 'Masuk ke Dashboard...' : 'MASUK SEBAGAI ADMIN'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
