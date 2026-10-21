'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { QrCode, Users, UserPlus, ChevronRight, ClipboardList } from 'lucide-react';
import { getAllJemaat } from '@/lib/api';
import { Jemaat } from '@/lib/types';
import { useAdminGuard } from '@/lib/auth';
import { displayName, roleLabel } from '@/lib/options';
import { Avatar, StatusBadge } from '@/components/ui';

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 18) return 'Selamat sore';
  return 'Selamat malam';
}

const SHORTCUTS = [
  { href: '/scan', label: 'Scan Kartu QR', desc: 'Cek data jemaat', icon: QrCode, tone: 'bg-gold-metallic text-[#2B180B]' },
  { href: '/jemaat/tambah', label: 'Tambah Jemaat', desc: 'Daftarkan baru', icon: UserPlus, tone: 'bg-espresso-metallic text-[#D4AF37]' },
  { href: '/jemaat', label: 'Daftar Jemaat', desc: 'Cari & kartu QR', icon: Users, tone: 'bg-[#EFE5DB] text-[#3B2211]' },
];

export default function AdminDashboardPage() {
  const isAdmin = useAdminGuard();
  const [jemaatList, setJemaatList] = useState<Jemaat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllJemaat()
      .then(setJemaatList)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(
    () => [
      { label: 'Total Jemaat', value: jemaatList.length },
      { label: 'Aktif', value: jemaatList.filter((j) => !j.status || j.status === 'Aktif').length },
      { label: 'Pelayan', value: jemaatList.filter((j) => roleLabel(j) === 'Pelayan').length },
    ],
    [jemaatList]
  );

  if (!isAdmin) return null;

  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <p className="text-sm font-semibold text-[#6B533E]">{today}</p>
        <h1 className="text-2xl sm:text-3xl font-black text-[#2B180B] tracking-tight">{greeting()}, Admin 👋</h1>
      </div>

      {/* Aksi utama */}
      <Link
        href="/admin/presensi"
        className="flex items-center gap-4 p-5 rounded-3xl bg-espresso-metallic border border-[#C5A059]/50 shadow-lg shadow-[#3B2211]/20 active:scale-[0.98] transition-transform"
      >
        <span className="w-14 h-14 rounded-2xl bg-gold-metallic flex items-center justify-center shrink-0">
          <ClipboardList className="w-7 h-7 text-[#2B180B]" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-lg font-black text-[#F3E5C8]">Mulai Presensi Ibadah</span>
          <span className="block text-sm text-[#EAD6B0]">Catat kehadiran jemaat dengan scan kartu QR</span>
        </span>
        <ChevronRight className="w-6 h-6 text-[#D4AF37] shrink-0" />
      </Link>

      {/* Pintasan */}
      <div className="grid grid-cols-3 gap-3">
        {SHORTCUTS.map(({ href, label, desc, icon: Icon, tone }) => (
          <Link
            key={href}
            href={href}
            className="card p-3 sm:p-4 flex flex-col items-center sm:items-start text-center sm:text-left gap-2.5 hover:border-[#C5A059] active:scale-[0.97] transition-transform"
          >
            <span className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tone}`}>
              <Icon className="w-6 h-6" />
            </span>
            <span>
              <span className="block text-sm sm:text-base font-bold text-[#2B180B] leading-tight">{label}</span>
              <span className="hidden sm:block text-sm text-[#6B533E]">{desc}</span>
            </span>
          </Link>
        ))}
      </div>

      {/* Ringkasan */}
      <section aria-label="Ringkasan" className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="card p-4 text-center">
            {loading ? (
              <div className="skeleton h-8 w-12 mx-auto" />
            ) : (
              <p className="text-2xl sm:text-3xl font-black text-[#2B180B]">{s.value}</p>
            )}
            <p className="text-xs sm:text-sm font-semibold text-[#6B533E] mt-1">{s.label}</p>
          </div>
        ))}
      </section>

      {/* Jemaat terbaru */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Baru Didaftarkan</h2>
          <Link href="/jemaat" className="inline-flex items-center gap-0.5 min-h-[40px] text-sm font-bold text-[#3B2211]">
            Lihat semua <ChevronRight className="w-4 h-4 text-[#C5A059]" />
          </Link>
        </div>

        <div className="card divide-y divide-[#C5A059]/20 overflow-hidden">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3.5">
                  <div className="skeleton w-10 h-10" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-2/3" />
                    <div className="skeleton h-3 w-1/3" />
                  </div>
                </div>
              ))
            : jemaatList.slice(0, 5).map((j) => (
                <Link key={j.id} href={`/jemaat/${j.id}`} className="flex items-center gap-3 p-3.5 hover:bg-[#FAF6F0] active:bg-[#F3E5C8]/40">
                  <Avatar name={j.full_name} src={j.profile_photo_url} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[15px] text-[#2B180B] truncate">{displayName(j.full_name)}</p>
                    <p className="text-sm text-[#6B533E] truncate">{roleLabel(j)}</p>
                  </div>
                  <StatusBadge status={j.status} />
                </Link>
              ))}
          {!loading && jemaatList.length === 0 && (
            <p className="p-6 text-center text-sm text-[#6B533E]">Belum ada jemaat terdaftar.</p>
          )}
        </div>
      </section>
    </div>
  );
}
