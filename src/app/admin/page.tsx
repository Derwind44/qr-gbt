'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QrCode, Users, UserPlus, ArrowRight, CheckCircle2, ShieldCheck, LogOut, Database } from 'lucide-react';
import { getAllJemaat } from '@/lib/supabase';
import { Jemaat } from '@/lib/types';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [jemaatList, setJemaatList] = useState<Jemaat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem('admin_authenticated');
      if (auth !== 'true') {
        router.push('/login');
        return;
      }
      setIsAdmin(true);
    }

    async function loadData() {
      try {
        const data = await getAllJemaat();
        setJemaatList(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('admin_authenticated');
      sessionStorage.removeItem('admin_login_time');
    }
    router.push('/login');
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6 py-4 max-w-5xl mx-auto">
      {/* Admin Dashboard Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-[#C5A059]/40 bg-[#FFFDF9] shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-600/30 text-emerald-800 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Admin Logged In — GBT Bethlehem Surabaya</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-[#2B180B] tracking-tight">
              Dashboard Admin
            </h1>
            <p className="text-xs sm:text-sm text-[#6B533E]">
              Kelola pendataan jemaat, pindai QR Code, dan terbitkan Kartu Akses Digital resmi.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-800 border border-rose-600/30 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar / Logout</span>
          </button>
        </div>
      </div>

      {/* Main Submenus (Scan QR & Daftar Jemaat CRUD) */}
      <div className="space-y-3">
        <h2 className="text-xs font-black tracking-widest text-[#3B2211] uppercase px-1">
          SUBMENU MANAJEMEN ADMIN
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Submenu 1: Pindai QR */}
          <Link
            href="/scan"
            className="glass-card p-6 rounded-3xl border-2 border-[#C5A059]/30 hover:border-[#3B2211] space-y-4 group block transition-all shadow-md bg-[#FFFDF9]"
          >
            <div className="w-14 h-14 rounded-2xl bg-espresso-metallic border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] shadow-lg group-hover:scale-105 transition-transform">
              <QrCode className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#2B180B] group-hover:text-[#C5A059] transition-colors">
                1. Pindai QR Code
              </h3>
              <p className="text-xs text-[#6B533E] mt-1 leading-relaxed">
                Scan Kartu QR jemaat via kamera untuk memverifikasi profil, status, dan presensi jemaat.
              </p>
            </div>
            <div className="pt-2 text-xs font-bold text-[#3B2211] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>Mulai Pindai Kamera</span>
              <ArrowRight className="w-4 h-4 text-[#C5A059]" />
            </div>
          </Link>

          {/* Submenu 2: Daftar Jemaat & CRUD */}
          <Link
            href="/jemaat"
            className="glass-card p-6 rounded-3xl border-2 border-[#C5A059]/30 hover:border-[#3B2211] space-y-4 group block transition-all shadow-md bg-[#FFFDF9]"
          >
            <div className="w-14 h-14 rounded-2xl bg-gold-metallic border border-[#C5A059] flex items-center justify-center text-[#2B180B] shadow-lg group-hover:scale-105 transition-transform">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#2B180B] group-hover:text-[#C5A059] transition-colors">
                2. Daftar Jemaat & CRUD
              </h3>
              <p className="text-xs text-[#6B533E] mt-1 leading-relaxed">
                Manajemen data jemaat terdaftar: Cari, Filter, <strong>+ Tambah Baru</strong>, Edit, Hapus, dan Cetak Kartu ID.
              </p>
            </div>
            <div className="pt-2 text-xs font-bold text-[#3B2211] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>Buka Daftar Jemaat ({loading ? '...' : jemaatList.length})</span>
              <ArrowRight className="w-4 h-4 text-[#C5A059]" />
            </div>
          </Link>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <section className="glass-panel rounded-3xl p-6 border border-[#C5A059]/40 space-y-4 bg-[#FFFDF9]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#C5A059]" />
            <h3 className="text-base font-bold text-[#2B180B]">Jemaat Terbaru Didaftarkan</h3>
          </div>
          <Link href="/jemaat" className="text-xs text-[#3B2211] font-bold hover:text-[#C5A059] flex items-center gap-1">
            <span>Kelola Semua ({jemaatList.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-6 text-center text-xs text-[#8C6D4F] animate-pulse">
            Memuat data jemaat terbaru...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {jemaatList.slice(0, 4).map((j) => (
              <Link
                key={j.id}
                href={`/jemaat/${j.id}`}
                className="glass-card p-3.5 rounded-2xl border border-[#C5A059]/30 hover:border-[#3B2211] block group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#3B2211]/10 text-[#3B2211] border border-[#3B2211]/20">
                    {j.id_jemaat || j.id}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    {j.status || 'Aktif'}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-[#2B180B] group-hover:text-[#C5A059] transition-colors truncate">
                  {j.full_name}
                </h4>
                <p className="text-[11px] text-[#6B533E] truncate">
                  {j.joined_divisions?.[0] || j.church_role || 'Jemaat'}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
