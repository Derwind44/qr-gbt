'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getJemaatByCodeOrId } from '@/lib/supabase';
import { Jemaat } from '@/lib/types';
import QRCard from '@/components/QRCard';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Tag,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  Building,
} from 'lucide-react';

export default function JemaatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [jemaat, setJemaat] = useState<Jemaat | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDetail() {
      if (!id) return;
      try {
        const data = await getJemaatByCodeOrId(id);
        setJemaat(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400">Memuat rincian data jemaat...</p>
      </div>
    );
  }

  if (!jemaat) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Data Tidak Ditemukan</h2>
        <p className="text-xs text-slate-400">
          Data jemaat dengan ID <code className="text-indigo-300 font-mono">{id}</code> tidak ditemukan di Supabase.
        </p>
        <Link
          href="/jemaat"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Jemaat</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Daftar</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Personal Information Details */}
        <div className="lg:col-span-7 glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6 shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between pb-6 border-b border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {jemaat.category || 'Jemaat Umum'}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {jemaat.status || 'Aktif'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {jemaat.full_name}
              </h1>
              <p className="text-xs font-mono text-indigo-400 font-bold">
                Kode QR: {jemaat.qr_code_data}
              </p>
            </div>
          </div>

          {/* Details Table List */}
          <div className="space-y-4 text-xs sm:text-sm">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] text-indigo-300">
              Informasi Pribadi & Kontak
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="glass-card p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-indigo-400" /> WhatsApp / No HP
                </span>
                <p className="font-semibold text-white">{jemaat.phone || '-'}</p>
              </div>

              <div className="glass-card p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-indigo-400" /> Email
                </span>
                <p className="font-semibold text-white">{jemaat.email || '-'}</p>
              </div>

              <div className="glass-card p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Building className="w-3 h-3 text-indigo-400" /> Kota / Domisili
                </span>
                <p className="font-semibold text-white">{jemaat.city || '-'}</p>
              </div>

              <div className="glass-card p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-indigo-400" /> Tanggal Terdaftar
                </span>
                <p className="font-semibold text-white">
                  {jemaat.created_at
                    ? new Date(jemaat.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Terbaru'}
                </p>
              </div>
            </div>

            {jemaat.address && (
              <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-indigo-400" /> Alamat Lengkap
                </span>
                <p className="font-semibold text-white">{jemaat.address}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: QR Digital ID Card Component & Download Button */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full space-y-3 mb-2 text-center lg:text-left">
            <h3 className="text-lg font-bold text-white">Kartu QR Digital</h3>
            <p className="text-xs text-slate-400">
              Kartu siap unduh ke format PNG atau dicetak langsung.
            </p>
          </div>

          <QRCard jemaat={jemaat} showDownloadBtn={true} />
        </div>
      </div>
    </div>
  );
}
