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
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Calendar,
  Heart,
  Church,
  FileText,
  Edit,
  Trash2,
  ShieldCheck,
  Tag,
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
          Data jemaat dengan ID <code className="text-indigo-300 font-mono">{id}</code> tidak ditemukan.
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

  const displayId = jemaat.id_jemaat || jemaat.id;

  return (
    <div className="space-y-6 py-4">
      {/* Top Header & Admin Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleEditClick}
            className="px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Data</span>
          </button>

          <button
            onClick={handleDeleteClick}
            className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
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
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6 shadow-2xl">
            <div className="flex items-start gap-4">
              {jemaat.profile_photo_url ? (
                <img
                  src={jemaat.profile_photo_url}
                  alt={jemaat.full_name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-lg shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-2xl shrink-0">
                  {jemaat.full_name.charAt(0)}
                </div>
              )}

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {jemaat.church_role || jemaat.category || 'Anggota'}
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
                  ID Jemaat: {displayId}
                </p>
              </div>
            </div>

            {/* SECTION 1: DATA DIRI */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] text-indigo-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Data Diri
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="glass-card p-3 rounded-xl border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400">NIK (KTP)</span>
                  <p className="font-semibold text-white font-mono">{jemaat.nik || '-'}</p>
                </div>

                <div className="glass-card p-3 rounded-xl border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400">Jenis Kelamin</span>
                  <p className="font-semibold text-white">{jemaat.gender || '-'}</p>
                </div>

                <div className="glass-card p-3 rounded-xl border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400">Tempat, Tanggal Lahir</span>
                  <p className="font-semibold text-white">
                    {jemaat.birth_place || '-'}, {jemaat.birth_date ? new Date(jemaat.birth_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                  </p>
                </div>

                <div className="glass-card p-3 rounded-xl border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400">Nomor HP / WA</span>
                  <p className="font-semibold text-white">{jemaat.phone || '-'}</p>
                </div>

                <div className="glass-card p-3 rounded-xl border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400">Email</span>
                  <p className="font-semibold text-white">{jemaat.email || '-'}</p>
                </div>

                <div className="glass-card p-3 rounded-xl border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400">Tahun Bergabung</span>
                  <p className="font-semibold text-white">{jemaat.join_year || '-'}</p>
                </div>

                {jemaat.address && (
                  <div className="sm:col-span-2 glass-card p-3 rounded-xl border border-slate-800 space-y-0.5">
                    <span className="text-[10px] text-slate-400">Alamat Domisili</span>
                    <p className="font-semibold text-white">{jemaat.address}</p>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 2: DATA KELUARGA */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] text-indigo-300 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-400" /> Data Keluarga (Relasi Orang Tua & Pasangan)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="glass-card p-3 rounded-xl border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400">Nama Ayah Kandung</span>
                  <p className="font-semibold text-white">{jemaat.father_name || '-'}</p>
                </div>

                <div className="glass-card p-3 rounded-xl border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400">Nama Ibu Kandung</span>
                  <p className="font-semibold text-white">{jemaat.mother_name || '-'}</p>
                </div>

                <div className="glass-card p-3 rounded-xl border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400">Status Pernikahan</span>
                  <p className="font-semibold text-white">{jemaat.marital_status || '-'}</p>
                </div>

                <div className="glass-card p-3 rounded-xl border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400">Nama Pasangan</span>
                  <p className="font-semibold text-white">{jemaat.spouse_name || '-'}</p>
                </div>

                {jemaat.children_detail && (
                  <div className="sm:col-span-2 glass-card p-3 rounded-xl border border-slate-800 space-y-0.5">
                    <span className="text-[10px] text-slate-400">Detail Anak & Tanggal Lahir</span>
                    <p className="font-semibold text-white whitespace-pre-line">{jemaat.children_detail}</p>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 3: GEREJA & PELAYANAN */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] text-indigo-300 flex items-center gap-1.5">
                <Church className="w-3.5 h-3.5 text-purple-400" /> Jabatan Gereja, Potensi & Divisi
              </h3>

              <div className="space-y-3 text-xs">
                <div className="glass-card p-3 rounded-xl border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400">Jabatan Dalam Gereja</span>
                  <p className="font-semibold text-white">{jemaat.church_role || 'Anggota'}</p>
                </div>

                <div className="glass-card p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400">Potensi Yang Dimiliki</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {jemaat.potentials && jemaat.potentials.length > 0 ? (
                      jemaat.potentials.map((p) => (
                        <span key={p} className="px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 text-[11px] font-semibold border border-indigo-500/30">
                          {p}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </div>
                </div>

                {jemaat.joined_divisions && jemaat.joined_divisions.length > 0 && (
                  <div className="glass-card p-3 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400">Divisi yang Diikuti di GBT</span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {jemaat.joined_divisions.map((d) => (
                        <span key={d} className="px-2.5 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 text-[11px] font-semibold border border-purple-500/30">
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
              <div className="space-y-2 pt-4 border-t border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Lampiran Foto KTP
                </span>
                <img
                  src={jemaat.ktp_photo_url}
                  alt="KTP Jemaat"
                  className="w-full max-h-48 rounded-2xl object-cover border border-slate-800 shadow-md"
                />
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

      <AdminLoginModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        onSuccess={handleAdminSuccess}
      />
    </div>
  );
}

