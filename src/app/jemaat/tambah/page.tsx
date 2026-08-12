'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createJemaat } from '@/lib/supabase';
import { Jemaat } from '@/lib/types';
import QRCard from '@/components/QRCard';
import { formatGoogleDriveUrl } from '@/lib/gdrive';
import {
  ArrowLeft,
  CheckCircle2,
  User,
  Heart,
  Church,
  Upload,
  AlertCircle,
  Sparkles,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

export default function TambahJemaatPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem('admin_authenticated');
      if (auth !== 'true') {
        router.push('/login');
      }
    }
  }, [router]);

  // Step Management (1: Data Diri, 2: Data Keluarga, 3: Gereja & Pelayanan, 4: Sukses/Preview QR)
  const [currentStep, setCurrentStep] = useState(1);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdJemaat, setCreatedJemaat] = useState<Jemaat | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Section 1: Data Diri
    nik: '',
    full_name: '',
    gender: 'Laki-laki' as 'Laki-laki' | 'Perempuan',
    birth_place: '',
    birth_date: '1995-08-06',
    address: '',
    phone: '',
    email: '',
    join_year: new Date().getFullYear().toString(),
    ktp_photo_url: '',
    profile_photo_url: '',

    // Section 2: Data Keluarga
    marital_status: 'Belum Menikah' as 'Menikah' | 'Belum Menikah' | 'Cerai Mati' | 'Cerai Hidup',
    spouse_name: '',
    children_count: '0',
    children_detail: '',
    father_name: '',
    mother_name: '',

    // Section 3: Gereja & Pelayanan
    church_role: 'Anggota' as 'Anggota' | 'Pelayanan/Aktivis gereja',
    status: 'Aktif' as 'Aktif' | 'Nonaktif' | 'Meninggal',
    potentials: [] as string[],
    other_potential_desc: '',
    is_joined_division: 'Tidak' as 'Ya' | 'Tidak',
    joined_divisions: [] as string[],
  });

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

  const [uploadingState, setUploadingState] = useState<{ ktp: boolean; profile: boolean }>({ ktp: false, profile: false });

  // Image Upload Handlers: Compress & Upload directly to Google Drive via Service Account
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'ktp_photo_url' | 'profile_photo_url') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const stateKey = fieldName === 'ktp_photo_url' ? 'ktp' : 'profile';
    setUploadingState((prev) => ({ ...prev, [stateKey]: true }));

    try {
      const { compressImage } = await import('@/lib/imageUtils');
      const compressedDataUrl = await compressImage(file, 800, 0.7);

      const resBlob = await fetch(compressedDataUrl);
      const blob = await resBlob.blob();
      const uploadFile = new File([blob], file.name, { type: file.type || 'image/jpeg' });

      const uploadFormData = new FormData();
      uploadFormData.append('file', uploadFile);

      const apiRes = await fetch('/api/upload-drive', {
        method: 'POST',
        body: uploadFormData,
      });

      const apiData = await apiRes.json();
      if (apiRes.ok && apiData.url) {
        setFormData((prev) => ({ ...prev, [fieldName]: apiData.url }));
      } else {
        setFormData((prev) => ({ ...prev, [fieldName]: compressedDataUrl }));
      }
    } catch (err) {
      console.error('FileUpload error:', err);
    } finally {
      setUploadingState((prev) => ({ ...prev, [stateKey]: false }));
    }
  };

  const togglePotential = (item: string) => {
    setFormData((prev) => {
      const exists = prev.potentials.includes(item);
      const updated = exists ? prev.potentials.filter((p) => p !== item) : [...prev.potentials, item];
      return { ...prev, potentials: updated };
    });
  };

  const toggleDivision = (item: string) => {
    setFormData((prev) => {
      const exists = prev.joined_divisions.includes(item);
      const updated = exists ? prev.joined_divisions.filter((d) => d !== item) : [...prev.joined_divisions, item];
      return { ...prev, joined_divisions: updated };
    });
  };

  // Step Validation
  const validateStep1 = () => {
    if (!formData.full_name.trim()) return 'Nama Lengkap wajib diisi sesuai KTP.';
    if (!formData.birth_place.trim()) return 'Tempat Lahir wajib diisi.';
    if (!formData.birth_date) return 'Tanggal Lahir wajib diisi.';
    if (!formData.address.trim()) return 'Alamat domisili wajib diisi.';
    if (!formData.phone.trim()) return 'Nomor HP / WA wajib diisi.';
    if (!formData.join_year.trim()) return 'Tahun bergabung wajib diisi.';
    return null;
  };

  const validateStep2 = () => {
    if (!formData.father_name.trim()) return 'Nama Ayah wajib diisi.';
    if (!formData.mother_name.trim()) return 'Nama Ibu wajib diisi.';
    return null;
  };

  const validateStep3 = () => {
    if (formData.potentials.length === 0) return 'Pilih setidaknya 1 Potensi yang dimiliki.';
    return null;
  };

  const handleNextStep = () => {
    setErrorMsg('');
    if (currentStep === 1) {
      const err = validateStep1();
      if (err) {
        setErrorMsg(err);
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const err = validateStep2();
      if (err) {
        setErrorMsg(err);
        return;
      }
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    setErrorMsg('');
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const err = validateStep3();
    if (err) {
      setErrorMsg(err);
      return;
    }

    setLoading(true);

    try {
      let category = 'Jemaat Umum';
      if (formData.church_role === 'Pelayanan/Aktivis gereja') {
        category = 'Pelayan';
      } else if (formData.joined_divisions.includes('Divisi Muda YOBEL')) {
        category = 'Pemuda';
      } else if (formData.joined_divisions.includes('Divisi Anak WONDERFUL KIDS')) {
        category = 'Anak';
      }

      const newJemaat = await createJemaat({
        ...formData,
        category,
        status: formData.status || 'Aktif',
      });

      setCreatedJemaat(newJemaat);
      setCurrentStep(4);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Gagal menyimpan data jemaat. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* Back Link */}
      <Link
        href="/jemaat"
        className="inline-flex items-center gap-2 text-xs font-bold text-[#6B533E] hover:text-[#2B180B] transition-colors"
      >
        <ArrowLeft className="w-4 h-4 text-[#C5A059]" />
        <span>Kembali ke Daftar Jemaat</span>
      </Link>

      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#3B2211]/10 border border-[#C5A059]/40 text-[#3B2211] text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
          <span>Form Data Jemaat GBT Bethlehem Surabaya</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-[#2B180B]">Formulir Pendaftaran Jemaat Baru</h1>
        <p className="text-xs sm:text-sm text-[#6B533E]">
          Isi seluruh informasi di bawah ini untuk menerbitkan ID Jemaat unik dan Kartu QR Digital.
        </p>
      </div>

      {/* Stepper Progress Bar */}
      {currentStep <= 3 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4 border-b border-[#C5A059]/30 pb-4">
          <div className={`flex items-center gap-2 p-3 rounded-2xl border transition-all ${currentStep === 1 ? 'bg-[#3B2211] text-[#F3E5C8] border-[#C5A059] font-bold shadow-md' : 'bg-[#FAF6F0] border-[#C5A059]/25 text-[#6B533E]'}`}>
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${currentStep === 1 ? 'bg-gold-metallic text-[#2B180B]' : 'bg-[#EFE5DB] text-[#3B2211]'}`}>1</div>
            <span className="text-xs hidden sm:inline">1. Data Diri</span>
          </div>

          <div className={`flex items-center gap-2 p-3 rounded-2xl border transition-all ${currentStep === 2 ? 'bg-[#3B2211] text-[#F3E5C8] border-[#C5A059] font-bold shadow-md' : 'bg-[#FAF6F0] border-[#C5A059]/25 text-[#6B533E]'}`}>
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${currentStep === 2 ? 'bg-gold-metallic text-[#2B180B]' : 'bg-[#EFE5DB] text-[#3B2211]'}`}>2</div>
            <span className="text-xs hidden sm:inline">2. Data Keluarga</span>
          </div>

          <div className={`flex items-center gap-2 p-3 rounded-2xl border transition-all ${currentStep === 3 ? 'bg-[#3B2211] text-[#F3E5C8] border-[#C5A059] font-bold shadow-md' : 'bg-[#FAF6F0] border-[#C5A059]/25 text-[#6B533E]'}`}>
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${currentStep === 3 ? 'bg-gold-metallic text-[#2B180B]' : 'bg-[#EFE5DB] text-[#3B2211]'}`}>3</div>
            <span className="text-xs hidden sm:inline">3. Gereja & Pelayanan</span>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 text-xs flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Content Container */}
      {currentStep <= 3 ? (
        <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-6 sm:p-8 border border-[#C5A059]/40 space-y-6 shadow-xl bg-[#FFFDF9]">
          {/* STEP 1: DATA DIRI */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-center gap-2 text-[#2B180B] font-bold text-sm border-b border-[#C5A059]/25 pb-3">
                <User className="w-4 h-4 text-[#C5A059]" />
                <span>Bagian 1: Data Diri (Sesuai KTP)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="space-y-1.5">
                  <label className="font-bold text-[#2B180B]">1. Nomor Identitas Kependudukan (NIK - KTP)</label>
                  <input
                    type="text"
                    value={formData.nik}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                    placeholder="357801XXXXXXXXXX"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#C5A059]/40 text-[#2B180B] focus:outline-none focus:border-[#3B2211]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[#2B180B]">2. Nama Lengkap (Sesuai KTP) <span className="text-rose-600">*</span></label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Contoh: Budi Santoso"
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#C5A059]/40 text-[#2B180B] focus:outline-none focus:border-[#3B2211]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[#2B180B]">3. Jenis Kelamin <span className="text-rose-600">*</span></label>
                  <div className="flex items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-[#2B180B] font-semibold">
                      <input
                        type="radio"
                        name="gender"
                        value="Laki-laki"
                        checked={formData.gender === 'Laki-laki'}
                        onChange={() => setFormData({ ...formData, gender: 'Laki-laki' })}
                        className="accent-[#3B2211] w-4 h-4"
                      />
                      <span>Laki - laki</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-[#2B180B] font-semibold">
                      <input
                        type="radio"
                        name="gender"
                        value="Perempuan"
                        checked={formData.gender === 'Perempuan'}
                        onChange={() => setFormData({ ...formData, gender: 'Perempuan' })}
                        className="accent-[#3B2211] w-4 h-4"
                      />
                      <span>Perempuan</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[#2B180B]">4. Tempat Lahir <span className="text-rose-600">*</span></label>
                  <input
                    type="text"
                    value={formData.birth_place}
                    onChange={(e) => setFormData({ ...formData, birth_place: e.target.value })}
                    placeholder="Contoh: Surabaya"
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#C5A059]/40 text-[#2B180B] focus:outline-none focus:border-[#3B2211]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[#2B180B]">5. Tanggal Lahir <span className="text-rose-600">*</span></label>
                  <input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#C5A059]/40 text-[#2B180B] focus:outline-none focus:border-[#3B2211]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[#2B180B]">6. Nomor HP / WA <span className="text-rose-600">*</span></label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="081234567890"
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#C5A059]/40 text-[#2B180B] focus:outline-none focus:border-[#3B2211]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[#2B180B]">7. Alamat Email (Bila ada)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nama@gmail.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#C5A059]/40 text-[#2B180B] focus:outline-none focus:border-[#3B2211]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[#2B180B]">8. Tahun Bergabung <span className="text-rose-600">*</span></label>
                  <input
                    type="number"
                    value={formData.join_year}
                    onChange={(e) => setFormData({ ...formData, join_year: e.target.value })}
                    placeholder="2026"
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#C5A059]/40 text-[#2B180B] focus:outline-none focus:border-[#3B2211]"
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="font-bold text-[#2B180B]">9. Alamat domisili <span className="text-rose-600">*</span></label>
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Alamat tempat tinggal lengkap..."
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#C5A059]/40 text-[#2B180B] focus:outline-none focus:border-[#3B2211] resize-none"
                  />
                </div>

                {/* Upload Foto KTP & Foto Pribadi */}
                <div className="space-y-2">
                  <label className="font-bold text-[#2B180B]">10. Foto KTP (URL Google Drive / File)</label>
                  <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#C5A059]/40 space-y-3">
                    <input
                      type="text"
                      value={formData.ktp_photo_url}
                      onChange={(e) => setFormData({ ...formData, ktp_photo_url: e.target.value })}
                      placeholder="Paste Link Google Drive atau URL foto KTP..."
                      className="w-full px-3.5 py-2 rounded-xl bg-[#FFFDF9] border border-[#C5A059]/40 text-xs text-[#2B180B] focus:outline-none focus:border-[#3B2211]"
                    />
                    <div className="flex items-center gap-3">
                      {formData.ktp_photo_url ? (
                        <img src={formatGoogleDriveUrl(formData.ktp_photo_url)} alt="KTP Preview" className="h-16 rounded-xl object-cover border border-[#C5A059]/40 shadow-sm" />
                      ) : (
                        <div className="h-16 w-24 rounded-xl border border-dashed border-[#C5A059]/50 flex flex-col items-center justify-center text-[10px] text-[#6B533E]">
                          <Upload className="w-4 h-4 text-[#C5A059]" />
                          <span>Atau Upload</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'ktp_photo_url')}
                        className="text-xs text-[#6B533E] file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:bg-[#3B2211] file:text-[#F3E5C8] hover:file:bg-[#2B180B] cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-[#2B180B]">11. Foto Profil Pribadi <span className="text-rose-600">*</span></label>
                  <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#C5A059]/40 space-y-3">
                    <input
                      type="text"
                      value={formData.profile_photo_url}
                      onChange={(e) => setFormData({ ...formData, profile_photo_url: e.target.value })}
                      placeholder="Paste Link Google Drive atau URL foto profil..."
                      className="w-full px-3.5 py-2 rounded-xl bg-[#FFFDF9] border border-[#C5A059]/40 text-xs text-[#2B180B] focus:outline-none focus:border-[#3B2211]"
                    />
                    <div className="flex items-center gap-3">
                      {formData.profile_photo_url ? (
                        <img src={formatGoogleDriveUrl(formData.profile_photo_url)} alt="Foto Pribadi Preview" className="h-16 w-16 rounded-2xl object-cover border-2 border-[#C5A059] shadow-sm" />
                      ) : (
                        <div className="h-16 w-16 rounded-2xl border border-dashed border-[#C5A059]/50 flex flex-col items-center justify-center text-[10px] text-[#6B533E]">
                          <Upload className="w-4 h-4 text-[#C5A059]" />
                          <span>Upload</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'profile_photo_url')}
                        className="text-xs text-[#6B533E] file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:bg-gold-metallic file:text-[#2B180B] hover:file:opacity-90 cursor-pointer font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: DATA KELUARGA */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-center gap-2 text-[#2B180B] font-bold text-sm border-b border-[#C5A059]/25 pb-3">
                <Heart className="w-4 h-4 text-rose-600" />
                <span>Bagian 2: Data Keluarga</span>
              </div>

              <div className="space-y-4 text-xs sm:text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-[#2B180B]">1. Nama Lengkap Ayah Kandung <span className="text-rose-600">*</span></label>
                    <input
                      type="text"
                      value={formData.father_name}
                      onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                      placeholder="Nama lengkap ayah..."
                      required
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#C5A059]/40 text-[#2B180B] focus:outline-none focus:border-[#3B2211]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-[#2B180B]">2. Nama Lengkap Ibu Kandung <span className="text-rose-600">*</span></label>
                    <input
                      type="text"
                      value={formData.mother_name}
                      onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
                      placeholder="Nama lengkap ibu..."
                      required
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#C5A059]/40 text-[#2B180B] focus:outline-none focus:border-[#3B2211]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-[#2B180B]">3. Status Pernikahan <span className="text-rose-600">*</span></label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {['Menikah', 'Belum Menikah', 'Cerai Mati', 'Cerai Hidup'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setFormData({ ...formData, marital_status: st as any })}
                        className={`p-3 rounded-2xl text-xs font-bold text-center border transition-all ${
                          formData.marital_status === st
                            ? 'bg-[#3B2211] text-[#F3E5C8] border-[#C5A059] shadow-md'
                            : 'bg-[#FAF6F0] text-[#6B533E] border-[#C5A059]/25 hover:text-[#2B180B]'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {formData.marital_status === 'Menikah' && (
                  <div className="space-y-1.5">
                    <label className="font-bold text-[#2B180B]">4. Nama Lengkap Pasangan (Suami / Istri)</label>
                    <input
                      type="text"
                      value={formData.spouse_name}
                      onChange={(e) => setFormData({ ...formData, spouse_name: e.target.value })}
                      placeholder="Nama lengkap pasangan..."
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#C5A059]/40 text-[#2B180B] focus:outline-none focus:border-[#3B2211]"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="font-bold text-[#2B180B]">5. Jumlah Anak</label>
                  <div className="flex items-center gap-2">
                    {['0', '1', '2', '3', '4', '5+'].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setFormData({ ...formData, children_count: num })}
                        className={`w-10 h-10 rounded-xl font-bold text-xs border transition-all ${
                          formData.children_count === num
                            ? 'bg-[#3B2211] text-[#F3E5C8] border-[#C5A059] shadow-md'
                            : 'bg-[#FAF6F0] text-[#6B533E] border-[#C5A059]/25 hover:text-[#2B180B]'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[#2B180B]">6. Tuliskan semua nama anak dan tanggal lahir (bila ada)</label>
                  <textarea
                    rows={3}
                    value={formData.children_detail}
                    onChange={(e) => setFormData({ ...formData, children_detail: e.target.value })}
                    placeholder="Contoh: 1. Rian (12/04/2021), 2. Clarissa (05/09/2024)"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#C5A059]/40 text-[#2B180B] focus:outline-none focus:border-[#3B2211] resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: GEREJA & PELAYANAN */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-center gap-2 text-[#2B180B] font-bold text-sm border-b border-[#C5A059]/25 pb-3">
                <Church className="w-4 h-4 text-[#C5A059]" />
                <span>Bagian 3: Jabatan Gereja, Potensi & Divisi</span>
              </div>

              <div className="space-y-5 text-xs sm:text-sm">
                <div className="space-y-2">
                  <label className="font-bold text-[#2B180B]">1. Jabatan Dalam Gereja <span className="text-rose-600">*</span></label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-[#2B180B] font-semibold">
                      <input
                        type="radio"
                        name="church_role"
                        value="Anggota"
                        checked={formData.church_role === 'Anggota'}
                        onChange={() => setFormData({ ...formData, church_role: 'Anggota' })}
                        className="accent-[#3B2211] w-4 h-4"
                      />
                      <span>Anggota</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-[#2B180B] font-semibold">
                      <input
                        type="radio"
                        name="church_role"
                        value="Pelayanan/Aktivis gereja"
                        checked={formData.church_role === 'Pelayanan/Aktivis gereja'}
                        onChange={() => setFormData({ ...formData, church_role: 'Pelayanan/Aktivis gereja' })}
                        className="accent-[#3B2211] w-4 h-4"
                      />
                      <span>Pelayanan / Aktivis gereja</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-[#2B180B]">Status Keanggotaan <span className="text-rose-600">*</span></label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'Aktif', label: 'Aktif', color: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
                      { id: 'Nonaktif', label: 'Nonaktif', color: 'bg-amber-50 text-amber-800 border-amber-300' },
                      { id: 'Meninggal', label: 'Meninggal', color: 'bg-zinc-100 text-zinc-900 border-zinc-400' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, status: st.id as any })}
                        className={`p-3 rounded-2xl text-xs font-bold text-center border transition-all ${
                          formData.status === st.id
                            ? 'bg-[#3B2211] text-[#F3E5C8] border-[#C5A059] shadow-md ring-2 ring-[#C5A059]'
                            : `${st.color} hover:opacity-80`
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-[#2B180B]">2. Potensi Yang Dimiliki <span className="text-rose-600">*</span> (boleh pilih lebih dari 1)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {potentialOptions.map((item) => {
                      const isSelected = formData.potentials.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => togglePotential(item)}
                          className={`p-3 rounded-2xl text-xs font-bold text-left flex items-center gap-2 border transition-all ${
                            isSelected
                              ? 'bg-[#3B2211] text-[#F3E5C8] border-[#C5A059] shadow-md'
                              : 'bg-[#FAF6F0] text-[#6B533E] border-[#C5A059]/25 hover:text-[#2B180B]'
                          }`}
                        >
                          <input type="checkbox" checked={isSelected} readOnly className="accent-[#D4AF37] w-4 h-4 shrink-0" />
                          <span className="truncate">{item}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {formData.potentials.some((p) => p.toLowerCase().includes('lain')) && (
                  <div className="space-y-1.5">
                    <label className="font-bold text-[#2B180B]">3. Deskripsi Potensi Lainnya</label>
                    <input
                      type="text"
                      value={formData.other_potential_desc}
                      onChange={(e) => setFormData({ ...formData, other_potential_desc: e.target.value })}
                      placeholder="Jelaskan keahlian/potensi Anda..."
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#C5A059]/40 text-[#2B180B] focus:outline-none focus:border-[#3B2211]"
                    />
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t border-[#C5A059]/25">
                  <label className="font-bold text-[#2B180B]">4. Apakah telah bergabung dalam DIVISI di GBT BETHLEHEM? <span className="text-rose-600">*</span></label>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer text-[#2B180B] font-semibold">
                      <input
                        type="radio"
                        name="is_joined_division"
                        value="Ya"
                        checked={formData.is_joined_division === 'Ya'}
                        onChange={() => setFormData({ ...formData, is_joined_division: 'Ya' })}
                        className="accent-[#3B2211] w-4 h-4"
                      />
                      <span>Ya</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-[#2B180B] font-semibold">
                      <input
                        type="radio"
                        name="is_joined_division"
                        value="Tidak"
                        checked={formData.is_joined_division === 'Tidak'}
                        onChange={() => setFormData({ ...formData, is_joined_division: 'Tidak' })}
                        className="accent-[#3B2211] w-4 h-4"
                      />
                      <span>Tidak</span>
                    </label>
                  </div>
                </div>

                {formData.is_joined_division === 'Ya' && (
                  <div className="space-y-2">
                    <label className="font-bold text-[#2B180B]">5. Divisi mana yang telah diikuti? (boleh pilih lebih dari 1)</label>
                    <div className="space-y-2">
                      {divisionOptions.map((div) => {
                        const isSelected = formData.joined_divisions.includes(div);
                        return (
                          <label
                            key={div}
                            onClick={() => toggleDivision(div)}
                            className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-gold-metallic text-[#2B180B] border-[#C5A059] font-bold shadow-sm'
                                : 'bg-[#FAF6F0] border-[#C5A059]/25 text-[#6B533E] hover:text-[#2B180B]'
                            }`}
                          >
                            <input type="checkbox" checked={isSelected} readOnly className="accent-[#3B2211] w-4 h-4" />
                            <span>{div}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-4 border-t border-[#C5A059]/25 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-5 py-2.5 rounded-xl bg-[#EFE5DB] hover:bg-[#E5D7C3] text-[#3B2211] text-xs font-bold flex items-center gap-2 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </button>
            ) : <div />}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-2.5 rounded-xl bg-espresso-metallic text-[#F3E5C8] text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#3B2211]/20 transition-all border border-[#C5A059]/40"
              >
                <span>Lanjut</span>
                <ChevronRight className="w-4 h-4 text-[#D4AF37]" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 rounded-2xl bg-espresso-metallic text-[#F3E5C8] text-sm font-black flex items-center gap-2 shadow-xl shadow-[#3B2211]/25 border border-[#C5A059]/50 transition-all hover:scale-105 disabled:opacity-50"
              >
                <CheckCircle2 className="w-5 h-5 text-[#D4AF37]" />
                <span>{loading ? 'Menyimpan Data...' : 'Submit & Generasi Kartu QR'}</span>
              </button>
            )}
          </div>
        </form>
      ) : (
        /* STEP 4: SUCCESS RESULT & QR CARD DISPLAY */
        <div className="glass-panel rounded-3xl p-8 border border-emerald-600/30 text-center space-y-6 shadow-xl animate-fadeIn bg-[#FFFDF9]">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-600/30 flex items-center justify-center text-emerald-700 mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#2B180B]">Pendaftaran Berhasil!</h2>
            <p className="text-xs text-[#6B533E] max-w-md mx-auto">
              Data jemaat atas nama <strong>{createdJemaat?.full_name}</strong> telah berhasil disimpan.
            </p>
            <p className="text-sm font-mono font-bold text-[#3B2211] pt-1">
              ID Jemaat: {createdJemaat?.id_jemaat}
            </p>
          </div>

          {/* QR Card Preview */}
          {createdJemaat && (
            <div className="pt-4 flex flex-col items-center">
              <QRCard jemaat={createdJemaat} showDownloadBtn={true} />
            </div>
          )}

          <div className="pt-6 flex flex-wrap items-center justify-center gap-4 border-t border-[#C5A059]/25">
            <button
              onClick={() => {
                setCreatedJemaat(null);
                setCurrentStep(1);
              }}
              className="px-5 py-2.5 rounded-xl bg-[#EFE5DB] hover:bg-[#E5D7C3] text-[#3B2211] text-xs font-bold transition-colors"
            >
              + Tambah Jemaat Lain
            </button>
            <Link
              href="/jemaat"
              className="px-6 py-2.5 rounded-xl bg-espresso-metallic text-[#F3E5C8] text-xs font-bold border border-[#C5A059]/40 shadow-md transition-all"
            >
              Lihat Semua Daftar Jemaat
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
