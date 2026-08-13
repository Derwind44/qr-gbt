'use client';

import { useState } from 'react';
import { ShieldCheck, Lock, X, AlertCircle } from 'lucide-react';
import { verifyAdminPassword } from '@/lib/supabase';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdminLoginModal({ isOpen, onClose, onSuccess }: AdminLoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError('');

    if (username.trim() !== 'adminGBT') {
      setError('Username admin tidak valid.');
      return;
    }

    if (!verifyAdminPassword(password)) {
      setError('Password admin salah.');
      return;
    }

    // Save session in sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('admin_authenticated', 'true');
      sessionStorage.setItem('admin_login_time', new Date().toISOString());
    }

    setPassword('');
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B180B]/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel max-w-md w-full rounded-3xl p-6 sm:p-8 border border-[#C5A059]/40 shadow-2xl relative space-y-5 bg-[#FFFDF9]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#6B533E] hover:text-[#2B180B] hover:bg-[#EFE5DB] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#3B2211] border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] shadow-lg">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-[#2B180B]">Akses Khusus Admin</h2>
          <p className="text-xs text-[#6B533E]">
            Masukkan Username dan Password Admin GBT Bethlehem Surabaya.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#2B180B]">Username Admin</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan Username"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#C5A059]/40 text-sm text-[#2B180B] focus:outline-none focus:border-[#3B2211] font-bold"
            />
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
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#C5A059]/40 text-sm text-[#2B180B] focus:outline-none focus:border-[#3B2211] font-bold"
              />
              <Lock className="w-4 h-4 text-[#8C6D4F] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 rounded-xl bg-[#EFE5DB] hover:bg-[#E5D7C3] text-[#3B2211] text-xs font-bold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="w-1/2 py-2.5 rounded-xl bg-espresso-metallic text-[#F3E5C8] border border-[#C5A059]/40 text-xs font-bold shadow-lg shadow-[#3B2211]/20 transition-all hover:scale-105"
            >
              Masuk / Verifikasi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
