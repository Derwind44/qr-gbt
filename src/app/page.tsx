'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { QrCode, Users, Search, Sparkles, ArrowRight, ShieldCheck, Database, CheckCircle2 } from 'lucide-react';
import { getAllJemaat } from '@/lib/supabase';
import { Jemaat } from '@/lib/types';

export default function HomePage() {
  const [jemaatList, setJemaatList] = useState<Jemaat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  return (
    <div className="space-y-10 py-4">
      {/* Hero Section */}
      <section className="relative glass-panel rounded-3xl p-8 sm:p-12 overflow-hidden border border-slate-800 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sistem Kartu QR & Absensi Digital Jemaat GBT</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Pindai Cepat & Kelola Data Jemaat dengan <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400">Kode QR</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Aplikasi verifikasi data terintegrasi dari <strong>Google Form &rarr; Google Sheets &rarr; Supabase</strong>. Pindai kode QR <code className="text-indigo-300 font-mono text-xs px-1.5 py-0.5 rounded bg-indigo-500/20">gbt-XXXXXXXXXX</code> untuk verifikasi instan.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link
              href="/scan"
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 flex items-center gap-2.5"
            >
              <QrCode className="w-5 h-5" />
              <span>Buka Pemindai QR</span>
            </Link>

            <Link
              href="/jemaat"
              className="px-6 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-medium text-sm border border-slate-700 transition-all flex items-center gap-2"
            >
              <Users className="w-5 h-5 text-indigo-400" />
              <span>Lihat Daftar Orang ({loading ? '...' : jemaatList.length})</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="glass-card rounded-2xl p-6 space-y-3 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <QrCode className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Scan Kamera QR</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Cukup arahkan kamera ke Kartu QR jemaat. Sistem langsung menampilkan data nama & primary info secara instan.
          </p>
          <Link href="/scan" className="text-xs text-indigo-400 font-semibold flex items-center gap-1 hover:underline pt-1">
            <span>Mulai Scan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 2 */}
        <div className="glass-card rounded-2xl p-6 space-y-3 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Daftar & Cari Jemaat</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Cari data orang berdasarkan nama, nomor HP, atau kode unik <code className="text-indigo-300">gbt-XXXXXXXXXX</code> secara cepat.
          </p>
          <Link href="/jemaat" className="text-xs text-purple-400 font-semibold flex items-center gap-1 hover:underline pt-1">
            <span>Cari Data</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 3 */}
        <div className="glass-card rounded-2xl p-6 space-y-3 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Database className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Unduh Kartu QR</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Lihat rincian lengkap jemaat dan unduh kartu QR ID berformat PNG siap cetak / dibagikan ke WhatsApp.
          </p>
          <Link href="/jemaat" className="text-xs text-emerald-400 font-semibold flex items-center gap-1 hover:underline pt-1">
            <span>Lihat Kartu</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* Quick Recent Jemaat Preview */}
      <section className="glass-panel rounded-3xl p-6 sm:p-8 space-y-5 border border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Ringkasan Data Terbaru</h2>
            <p className="text-xs text-slate-400">Data jemaat yang tersimpan di Supabase</p>
          </div>
          <Link href="/jemaat" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
            <span>Lihat Semua ({jemaatList.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500 animate-pulse">
            Memuat data jemaat...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {jemaatList.slice(0, 4).map((j) => (
              <Link
                key={j.id}
                href={`/jemaat/${j.id}`}
                className="glass-card p-4 rounded-xl space-y-2 border border-slate-800/80 hover:border-indigo-500/40 block group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-bold border border-indigo-500/20">
                    {j.qr_code_data}
                  </span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {j.status || 'Aktif'}
                  </span>
                </div>
                <h4 className="font-semibold text-sm text-white group-hover:text-indigo-300 transition-colors truncate">
                  {j.full_name}
                </h4>
                <p className="text-xs text-slate-400 truncate">
                  {j.category || 'Jemaat Umum'} • {j.city || 'Indonesia'}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
