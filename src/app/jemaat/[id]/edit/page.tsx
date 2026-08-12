'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getJemaatByCodeOrId, updateJemaat } from '@/lib/supabase';
import { Jemaat } from '@/lib/types';
import AdminLoginModal from '@/components/AdminLoginModal';
import {
  ArrowLeft,
  User,
  Heart,
  Church,
  AlertCircle,
  ShieldCheck,
  Save,
} from 'lucide-react';

export default function EditJemaatPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showAdminModal, setShowAdminModal] = useState(false);

  const [formData, setFormData] = useState<Partial<Jemaat>>({
    full_name: '',
    nik: '',
    gender: 'Laki-laki',
    birth_place: '',
    birth_date: '1995-08-06',
    address: '',
    phone: '',
    email: '',
    join_year: '2026',
    marital_status: 'Belum Menikah',
    spouse_name: '',
    children_count: '0',
    children_detail: '',
    father_name: '',
    mother_name: '',
    church_role: 'Anggota',
    potentials: [],
    other_potential_desc: '',
    is_joined_division: 'Tidak',
    joined_divisions: [],
    category: 'Jemaat Umum',
    status: 'Aktif',
    ktp_photo_url: '',
    profile_photo_url: '',
  });

  useEffect(() => {
    // Check admin authentication
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem('admin_authenticated');
      if (auth !== 'true') {
        setShowAdminModal(true);
      }
    }

    async function loadDetail() {
      if (!id) return;
      try {
        const item = await getJemaatByCodeOrId(id);
        if (item) {
          setFormData({
            ...item,
            father_name: item.father_name || '-',
            mother_name: item.mother_name || '-',
            join_year: item.join_year || '2026',
            potentials: item.potentials || [],
            joined_divisions: item.joined_divisions || [],
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [id]);

  const potentialOptions = [
    'IT / Multimedia',
    'Sound system',
    'Musik',
    'Vocal',
    'Pemerhati',
    'Pengajar/Guru',
    'Administrasi',
    'Lain Lain',
  ];

  const divisionOptions = [
    'Divisi Anak WONDERFUL KIDS',
    'Divisi Muda YOBEL',
    'Divisi Dewasa Muda XTION',
    'Divisi Wanita HANA',
    'Divisi Keluarga KEMAS',
  ];

  const togglePotential = (item: string) => {
    const list = formData.potentials || [];
    const exists = list.includes(item);
    const updated = exists ? list.filter((p) => p !== item) : [...list, item];
    setFormData({ ...formData, potentials: updated });
  };

  const toggleDivision = (item: string) => {
    const list = formData.joined_divisions || [];
    const exists = list.includes(item);
    const updated = exists ? list.filter((d) => d !== item) : [...list, item];
    setFormData({ ...formData, joined_divisions: updated });
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.full_name?.trim()) {
      setErrorMsg('Nama Lengkap wajib diisi.');
      return;
    }

    const payloadToSave: Partial<Jemaat> = {
      ...formData,
      father_name: formData.father_name?.trim() || '-',
      mother_name: formData.mother_name?.trim() || '-',
    };

    setSaving(true);
    try {
      const res = await updateJemaat(id, payloadToSave);
      if (res) {
        alert('Data jemaat berhasil diperbarui!');
        router.push(`/jemaat/${id}`);
      } else {
        setErrorMsg('Gagal memperbarui data.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Terjadi kesalahan saat menyimpan perubahan.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-[#8C6D4F] animate-pulse">
        Memuat form edit jemaat...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* Back Button */}
      <Link
        href={`/jemaat/${id}`}
        className="inline-flex items-center gap-2 text-xs font-bold text-[#6B533E] hover:text-[#2B180B] transition-colors"
      >
        <ArrowLeft className="w-4 h-4 text-[#C5A059]" />
        <span>Batal & Kembali ke Detail</span>
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-600/30 text-emerald-800 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Panel Edit Admin GBT</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#2B180B]">Edit Data Jemaat</h1>
          <p className="text-xs text-[#3B2211] font-mono font-bold">
            ID Jemaat: {formData.id_jemaat || id}
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-6 sm:p-8 border border-[#C5A059]/40 space-y-8 shadow-xl bg-[#FFFDF9]">
        {/* Section 1: Data Diri */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[#2B180B] font-bold text-sm border-b border-[#C5A059]/25 pb-3">
            <User className="w-4 h-4 text-[#C5A059]" />
            <span>1. Informasi Data Diri</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="space-y-1.5">
              <label className="font-bold text-[#2B180B]">Nama Lengkap *</label>
              <input
                type="text"
                value={formData.full_name || ''}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#C5A059]/40 text-[#2B180B] focus:outline-none focus:border-[#3B2211]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-[#2B180B]">NIK (KTP)</label>
              <input
                type="text"
                value={formData.nik || ''}
                onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#C5A059]/40 text-[#2B180B] focus:outline-none focus:border-[#3B2211]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-[#2B180B]">Jenis Kelamin</label>
              <select
                value={formData.gender || 'Laki-laki'}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#C5A059]/40 text-[#2B180B] focus:outline-none focus:border-[#3B2211]"
              >
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-[#2B180B]">Tempat Lahir</label>
              <input
                type="text"
                value={formData.birth_place || ''}
                onChange={(e) => setFormData({ ...formData, birth_place: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#C5A059]/40 text-[#2B180B] focus:outline-none focus:border-[#3B2211]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-[#2B180B]">Tanggal Lahir</label>
              <input
                type="date"
                value={formData.birth_date || ''}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#C5A059]/40 text-[#2B180B] focus:outline-none focus:border-[#3B2211]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-[#2B180B]">Nomor HP / WA</label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#C5A059]/40 text-[#2B180B] focus:outline-none focus:border-[#3B2211]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-[#2B180B]">Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#C5A059]/40 text-[#2B180B] focus:outline-none focus:border-[#3B2211]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-[#2B180B]">Tahun Bergabung</label>
              <input
                type="text"
                value={formData.join_year || ''}
                onChange={(e) => setFormData({ ...formData, join_year: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#C5A059]/40 text-[#2B180B] focus:outline-none focus:border-[#3B2211]"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="font-bold text-[#2B180B]">Alamat Domisili</label>
              <textarea
                rows={2}
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#C5A059]/40 text-[#2B180B] focus:outline-none focus:border-[#3B2211] resize-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Data Keluarga */}
        <div className="space-y-4 pt-4 border-t border-[#C5A059]/25">
          <div className="flex items-center gap-2 text-[#2B180B] font-bold text-sm border-b border-[#C5A059]/25 pb-3">
            <Heart className="w-4 h-4 text-rose-600" />
            <span>2. Informasi Data Keluarga</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="space-y-1.5">
              <label className="font-bold text-[#2B180B]">Nama Lengkap Ayah Kandung *</label>
              <input
                type="text"
                value={formData.father_name || ''}
                onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#C5A059]/40 text-[#2B180B] focus:outline-none focus:border-[#3B2211]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-[#2B180B]">Nama Lengkap Ibu Kandung *</label>
              <input
                type="text"
                value={formData.mother_name || ''}
                onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#C5A059]/40 text-[#2B180B] focus:outline-none focus:border-[#3B2211]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-[#2B180B]">Status Pernikahan</label>
              <select
                value={formData.marital_status || 'Belum Menikah'}
                onChange={(e) => setFormData({ ...formData, marital_status: e.target.value as any })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#C5A059]/40 text-[#2B180B] focus:outline-none focus:border-[#3B2211]"
              >
                <option value="Menikah">Menikah</option>
                <option value="Belum Menikah">Belum Menikah</option>
                <option value="Cerai Mati">Cerai Mati</option>
                <option value="Cerai Hidup">Cerai Hidup</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-[#2B180B]">Nama Pasangan</label>
              <input
                type="text"
                value={formData.spouse_name || ''}
                onChange={(e) => setFormData({ ...formData, spouse_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#C5A059]/40 text-[#2B180B] focus:outline-none focus:border-[#3B2211]"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="font-bold text-[#2B180B]">Detail Anak & Tanggal Lahir</label>
              <textarea
                rows={2}
                value={formData.children_detail || ''}
                onChange={(e) => setFormData({ ...formData, children_detail: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#C5A059]/40 text-[#2B180B] focus:outline-none focus:border-[#3B2211] resize-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Gereja & Pelayanan */}
        <div className="space-y-4 pt-4 border-t border-[#C5A059]/25">
          <div className="flex items-center gap-2 text-[#2B180B] font-bold text-sm border-b border-[#C5A059]/25 pb-3">
            <Church className="w-4 h-4 text-[#C5A059]" />
            <span>3. Informasi Gereja & Pelayanan</span>
          </div>

          <div className="space-y-4 text-xs sm:text-sm">
            <div className="space-y-1.5">
              <label className="font-bold text-[#2B180B]">Jabatan Gereja</label>
              <select
                value={formData.church_role || 'Anggota'}
                onChange={(e) => setFormData({ ...formData, church_role: e.target.value as any })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#C5A059]/40 text-[#2B180B] focus:outline-none focus:border-[#3B2211]"
              >
                <option value="Anggota">Anggota</option>
                <option value="Pelayanan/Aktivis gereja">Pelayanan/Aktivis gereja</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="font-bold text-[#2B180B]">Potensi Yang Dimiliki</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {potentialOptions.map((item) => {
                  const isSel = (formData.potentials || []).includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => togglePotential(item)}
                      className={`p-2.5 rounded-xl text-xs font-bold text-left border transition-all ${
                        isSel
                          ? 'bg-[#3B2211] text-[#F3E5C8] border-[#C5A059] shadow-sm'
                          : 'bg-[#FAF6F0] text-[#6B533E] border-[#C5A059]/25 hover:text-[#2B180B]'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-bold text-[#2B180B]">Divisi yang Diikuti</label>
              <div className="space-y-2">
                {divisionOptions.map((div) => {
                  const isSel = (formData.joined_divisions || []).includes(div);
                  return (
                    <button
                      key={div}
                      type="button"
                      onClick={() => toggleDivision(div)}
                      className={`w-full p-3 rounded-xl text-xs text-left font-bold border transition-all ${
                        isSel
                          ? 'bg-gold-metallic text-[#2B180B] border-[#C5A059] shadow-sm'
                          : 'bg-[#FAF6F0] border-[#C5A059]/25 text-[#6B533E] hover:text-[#2B180B]'
                      }`}
                    >
                      {div}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-6 border-t border-[#C5A059]/25 flex justify-end gap-4">
          <Link
            href={`/jemaat/${id}`}
            className="px-5 py-2.5 rounded-xl bg-[#EFE5DB] hover:bg-[#E5D7C3] text-[#3B2211] text-xs font-bold transition-colors"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-7 py-2.5 rounded-xl bg-espresso-metallic text-[#F3E5C8] text-xs font-black border border-[#C5A059]/40 shadow-lg shadow-[#3B2211]/20 transition-all flex items-center gap-2 hover:scale-105 disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-[#D4AF37]" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </button>
        </div>
      </form>

      <AdminLoginModal
        isOpen={showAdminModal}
        onClose={() => router.push(`/jemaat/${id}`)}
        onSuccess={() => setShowAdminModal(false)}
      />
    </div>
  );
}
