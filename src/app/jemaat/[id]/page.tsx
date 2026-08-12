'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getJemaatByCodeOrId, deleteJemaat } from '@/lib/supabase';
import { Jemaat } from '@/lib/types';
import QRCard from '@/components/QRCard';
import AdminLoginModal from '@/components/AdminLoginModal';
import {
  ArrowLeft,
  User,
  CheckCircle2,
  Heart,
  Church,
  FileText,
  Edit,
  Trash2,
} from 'lucide-react';

export default function JemaatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [jemaat, setJemaat] = useState<Jemaat | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'edit' | 'delete' | null>(null);

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

  const handleEditClick = () => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('admin_authenticated') === 'true') {
      router.push(`/jemaat/${id}/edit`);
    } else {
      setPendingAction('edit');
      setShowAdminModal(true);
    }
  };

  const handleDeleteClick = async () => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('admin_authenticated') === 'true') {
      executeDelete();
    } else {
      setPendingAction('delete');
      setShowAdminModal(true);
    }
  };

  const executeDelete = async () => {
    if (!jemaat) return;
    if (confirm(`Apakah Anda yakin ingin menghapus data jemaat "${jemaat.full_name}"?`)) {
      const success = await deleteJemaat(jemaat.id);
      if (success) {
        alert('Data jemaat berhasil dihapus.');
        router.push('/jemaat');
      } else {
        alert('Gagal menghapus data.');
      }
    }
  };

  const handleAdminSuccess = () => {
    if (pendingAction === 'edit') {
      router.push(`/jemaat/${id}/edit`);
    } else if (pendingAction === 'delete') {
      executeDelete();
    }
    setPendingAction(null);
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-[#8C6D4F]">Memuat rincian data jemaat...</p>
      </div>
    );
  }

  if (!jemaat) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#2B180B]">Data Tidak Ditemukan</h2>
        <p className="text-xs text-[#6B533E]">
          Data jemaat dengan ID <code className="text-[#3B2211] font-mono font-bold">{id}</code> tidak ditemukan.
        </p>
        <Link
          href="/jemaat"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3B2211] text-[#F3E5C8] text-xs font-bold hover:opacity-90 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Jemaat</span>
        </Link>
      </div>
    );
  }

  const displayId = jemaat.id_jemaat || jemaat.id;

  return (
    <div className="space-y-6 py-4">
      {/* Top Header & Admin Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#6B533E] hover:text-[#2B180B] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#C5A059]" />
          <span>Kembali ke Daftar</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleEditClick}
            className="px-4 py-2 rounded-xl bg-espresso-metallic text-[#F3E5C8] border border-[#C5A059]/40 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:scale-105"
          >
            <Edit className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Edit Data</span>
          </button>

          <button
            onClick={handleDeleteClick}
            className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-800 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Data</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Complete Profile Information */}
        <div className="lg:col-span-7 space-y-6">
          {/* Header Card */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-[#C5A059]/40 space-y-6 shadow-xl bg-[#FFFDF9]">
            <div className="flex items-start gap-4">
              {jemaat.profile_photo_url ? (
                <img
                  src={jemaat.profile_photo_url}
                  alt={jemaat.full_name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-[#C5A059]/40 shadow-md shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-espresso-metallic border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] font-serif font-extrabold text-2xl shrink-0 shadow-md">
                  {jemaat.full_name.charAt(0)}
                </div>
              )}

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#3B2211] text-[#F3E5C8] border border-[#C5A059]/40">
                    {jemaat.church_role || jemaat.category || 'Anggota'}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 border border-emerald-600/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    {jemaat.status || 'Aktif'}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-[#2B180B] tracking-tight">
                  {jemaat.full_name}
                </h1>
                <p className="text-xs font-mono text-[#3B2211] font-bold">
                  ID Jemaat: {displayId}
                </p>
              </div>
            </div>

            {/* SECTION 1: DATA DIRI */}
            <div className="space-y-3 pt-4 border-t border-[#C5A059]/25">
              <h3 className="font-bold text-[#2B180B] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#C5A059]" /> Data Diri
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="glass-card p-3 rounded-xl border border-[#C5A059]/25 space-y-0.5">
                  <span className="text-[10px] text-[#6B533E]">NIK (KTP)</span>
                  <p className="font-semibold text-[#2B180B] font-mono">{jemaat.nik || '-'}</p>
                </div>

                <div className="glass-card p-3 rounded-xl border border-[#C5A059]/25 space-y-0.5">
                  <span className="text-[10px] text-[#6B533E]">Jenis Kelamin</span>
                  <p className="font-semibold text-[#2B180B]">{jemaat.gender || '-'}</p>
                </div>

                <div className="glass-card p-3 rounded-xl border border-[#C5A059]/25 space-y-0.5">
                  <span className="text-[10px] text-[#6B533E]">Tempat, Tanggal Lahir</span>
                  <p className="font-semibold text-[#2B180B]">
                    {jemaat.birth_place || '-'}, {jemaat.birth_date ? new Date(jemaat.birth_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                  </p>
                </div>

                <div className="glass-card p-3 rounded-xl border border-[#C5A059]/25 space-y-0.5">
                  <span className="text-[10px] text-[#6B533E]">Nomor HP / WA</span>
                  <p className="font-semibold text-[#2B180B]">{jemaat.phone || '-'}</p>
                </div>

                <div className="glass-card p-3 rounded-xl border border-[#C5A059]/25 space-y-0.5">
                  <span className="text-[10px] text-[#6B533E]">Email</span>
                  <p className="font-semibold text-[#2B180B]">{jemaat.email || '-'}</p>
                </div>

                <div className="glass-card p-3 rounded-xl border border-[#C5A059]/25 space-y-0.5">
                  <span className="text-[10px] text-[#6B533E]">Tahun Bergabung</span>
                  <p className="font-semibold text-[#2B180B]">{jemaat.join_year || '-'}</p>
                </div>

                {jemaat.address && (
                  <div className="sm:col-span-2 glass-card p-3 rounded-xl border border-[#C5A059]/25 space-y-0.5">
                    <span className="text-[10px] text-[#6B533E]">Alamat Domisili</span>
                    <p className="font-semibold text-[#2B180B]">{jemaat.address}</p>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 2: DATA KELUARGA */}
            <div className="space-y-3 pt-4 border-t border-[#C5A059]/25">
              <h3 className="font-bold text-[#2B180B] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-600" /> Data Keluarga (Relasi Orang Tua & Pasangan)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="glass-card p-3 rounded-xl border border-[#C5A059]/25 space-y-0.5">
                  <span className="text-[10px] text-[#6B533E]">Nama Ayah Kandung</span>
                  <p className="font-semibold text-[#2B180B]">{jemaat.father_name || '-'}</p>
                </div>

                <div className="glass-card p-3 rounded-xl border border-[#C5A059]/25 space-y-0.5">
                  <span className="text-[10px] text-[#6B533E]">Nama Ibu Kandung</span>
                  <p className="font-semibold text-[#2B180B]">{jemaat.mother_name || '-'}</p>
                </div>

                <div className="glass-card p-3 rounded-xl border border-[#C5A059]/25 space-y-0.5">
                  <span className="text-[10px] text-[#6B533E]">Status Pernikahan</span>
                  <p className="font-semibold text-[#2B180B]">{jemaat.marital_status || '-'}</p>
                </div>

                <div className="glass-card p-3 rounded-xl border border-[#C5A059]/25 space-y-0.5">
                  <span className="text-[10px] text-[#6B533E]">Nama Pasangan</span>
                  <p className="font-semibold text-[#2B180B]">{jemaat.spouse_name || '-'}</p>
                </div>

                {jemaat.children_detail && (
                  <div className="sm:col-span-2 glass-card p-3 rounded-xl border border-[#C5A059]/25 space-y-0.5">
                    <span className="text-[10px] text-[#6B533E]">Detail Anak & Tanggal Lahir</span>
                    <p className="font-semibold text-[#2B180B] whitespace-pre-line">{jemaat.children_detail}</p>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 3: GEREJA & PELAYANAN */}
            <div className="space-y-3 pt-4 border-t border-[#C5A059]/25">
              <h3 className="font-bold text-[#2B180B] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Church className="w-3.5 h-3.5 text-[#C5A059]" /> Jabatan Gereja, Potensi & Divisi
              </h3>

              <div className="space-y-3 text-xs">
                <div className="glass-card p-3 rounded-xl border border-[#C5A059]/25 space-y-0.5">
                  <span className="text-[10px] text-[#6B533E]">Jabatan Dalam Gereja</span>
                  <p className="font-semibold text-[#2B180B]">{jemaat.church_role || 'Anggota'}</p>
                </div>

                <div className="glass-card p-3 rounded-xl border border-[#C5A059]/25 space-y-1">
                  <span className="text-[10px] text-[#6B533E]">Potensi Yang Dimiliki</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {jemaat.potentials && jemaat.potentials.length > 0 ? (
                      jemaat.potentials.map((p) => (
                        <span key={p} className="px-2.5 py-0.5 rounded-lg bg-[#3B2211] text-[#F3E5C8] text-[11px] font-bold border border-[#C5A059]/40">
                          {p}
                        </span>
                      ))
                    ) : (
                      <span className="text-[#8C6D4F]">-</span>
                    )}
                  </div>
                </div>

                {jemaat.joined_divisions && jemaat.joined_divisions.length > 0 && (
                  <div className="glass-card p-3 rounded-xl border border-[#C5A059]/25 space-y-1">
                    <span className="text-[10px] text-[#6B533E]">Divisi yang Diikuti di GBT</span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {jemaat.joined_divisions.map((d) => (
                        <span key={d} className="px-2.5 py-0.5 rounded-lg bg-gold-metallic text-[#2B180B] text-[11px] font-bold border border-[#C5A059]/40">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Foto KTP Preview if exists */}
            {jemaat.ktp_photo_url && (
              <div className="space-y-2 pt-4 border-t border-[#C5A059]/25">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#2B180B] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#C5A059]" /> Lampiran Foto KTP
                </span>
                <img
                  src={jemaat.ktp_photo_url}
                  alt="KTP Jemaat"
                  className="w-full max-h-48 rounded-2xl object-cover border border-[#C5A059]/30 shadow-md"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: QR Digital ID Card Component & Download Button */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full space-y-2 mb-3 text-center lg:text-left">
            <h3 className="text-lg font-bold text-[#2B180B]">Kartu Akses QR Digital</h3>
            <p className="text-xs text-[#6B533E]">
              Kartu resmi GBT Bethlehem Surabaya versi Depan & Belakang.
            </p>
          </div>

          <QRCard jemaat={jemaat} showDownloadBtn={true} />
        </div>
      </div>

      <AdminLoginModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        onSuccess={handleAdminSuccess}
      />
    </div>
  );
}
