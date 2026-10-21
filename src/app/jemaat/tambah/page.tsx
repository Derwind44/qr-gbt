'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createJemaat } from '@/lib/api';
import { Jemaat } from '@/lib/types';
import { displayName } from '@/lib/options';
import { useAdminGuard } from '@/lib/auth';
import QRCard from '@/components/QRCard';
import { Alert, BackLink } from '@/components/ui';
import {
  DataDiriFields,
  GerejaFields,
  KeluargaFields,
  SECTIONS,
  SectionHeading,
  focusFirstError,
  validateDataDiri,
  validateGereja,
  validateKeluarga,
  type FormErrors,
  type JemaatFormData,
} from '@/components/JemaatFields';
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, UserPlus, Eye } from 'lucide-react';

const INITIAL_FORM: JemaatFormData = {
  nik: '',
  full_name: '',
  gender: 'Laki-laki',
  birth_place: '',
  birth_date: '',
  address: '',
  phone: '',
  email: '',
  join_year: new Date().getFullYear().toString(),
  ktp_photo_url: '',
  profile_photo_url: '',
  marital_status: 'Belum Menikah',
  spouse_name: '',
  children_count: '0',
  children_detail: '',
  father_name: '',
  mother_name: '',
  church_role: 'Anggota',
  status: 'Aktif',
  potentials: [],
  other_potential_desc: '',
  is_joined_division: 'Tidak',
  joined_divisions: [],
};

const VALIDATORS = [validateDataDiri, validateKeluarga, validateGereja];

function deriveCategory(data: JemaatFormData) {
  if (data.church_role === 'Pelayanan/Aktivis gereja') return 'Pelayan';
  if (data.joined_divisions?.includes('Divisi Muda YOBEL')) return 'Pemuda';
  if (data.joined_divisions?.includes('Divisi Anak WONDERFUL KIDS')) return 'Anak';
  return 'Jemaat Umum';
}

export default function TambahJemaatPage() {
  const isAdmin = useAdminGuard();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<JemaatFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [createdJemaat, setCreatedJemaat] = useState<Jemaat | null>(null);

  const updateForm = (patch: JemaatFormData) => {
    setFormData((prev) => ({ ...prev, ...patch }));
    const keys = Object.keys(patch) as (keyof Jemaat)[];
    if (keys.some((k) => errors[k])) {
      setErrors((prev) => {
        const next = { ...prev };
        keys.forEach((k) => delete next[k]);
        return next;
      });
    }
  };

  const goToStep = (next: number) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setSubmitError('');

    const stepErrors = VALIDATORS[step](formData);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) {
      focusFirstError(stepErrors);
      return;
    }

    if (step < SECTIONS.length - 1) {
      goToStep(step + 1);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        joined_divisions: formData.is_joined_division === 'Ya' ? formData.joined_divisions : [],
        category: deriveCategory(formData),
        status: formData.status || 'Aktif',
      } as Parameters<typeof createJemaat>[0];

      setCreatedJemaat(await createJemaat(payload));
      window.scrollTo({ top: 0 });
    } catch (err) {
      console.error(err);
      setSubmitError('Gagal menyimpan data. Periksa koneksi internet lalu coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setErrors({});
    setCreatedJemaat(null);
    setStep(0);
    window.scrollTo({ top: 0 });
  };

  if (!isAdmin) return null;

  if (createdJemaat) {
    return (
      <div className="max-w-lg mx-auto space-y-5 animate-fadeIn">
        <div className="card p-6 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black text-[#2B180B]">Berhasil Didaftarkan!</h1>
          <p className="text-[15px] text-[#6B533E]">
            <strong className="text-[#2B180B]">{displayName(createdJemaat.full_name)}</strong> sudah terdaftar dengan ID
          </p>
          <p className="inline-block px-4 py-1.5 rounded-xl bg-[#3B2211]/10 font-mono font-black text-lg text-[#3B2211]">
            {createdJemaat.id_jemaat}
          </p>
        </div>

        <div className="card p-5">
          <h2 className="text-base font-black text-[#2B180B]">Kartu QR</h2>
          <p className="text-sm text-[#6B533E] mb-4">Unduh kartu lalu kirimkan ke jemaat.</p>
          <QRCard jemaat={createdJemaat} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button type="button" onClick={resetForm} className="btn btn-primary">
            <UserPlus className="w-5 h-5 text-[#D4AF37]" />
            Daftarkan Jemaat Lain
          </button>
          <Link href={`/jemaat/${createdJemaat.id}`} className="btn btn-secondary">
            <Eye className="w-5 h-5" />
            Lihat Data Lengkap
          </Link>
        </div>
        <Link href="/jemaat" className="btn btn-ghost w-full">
          Kembali ke Daftar Jemaat
        </Link>
      </div>
    );
  }

  const section = SECTIONS[step];
  const isLast = step === SECTIONS.length - 1;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <BackLink href="/jemaat" label="Daftar Jemaat" />

      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#2B180B] tracking-tight">Tambah Jemaat Baru</h1>
        <p className="text-[15px] text-[#6B533E]">Isi data di bawah. Kartu QR akan dibuat otomatis.</p>
      </div>

      {/* Progress */}
      <div aria-label={`Langkah ${step + 1} dari ${SECTIONS.length}`}>
        <div className="flex items-center justify-between text-sm font-bold mb-2">
          <span className="text-[#2B180B]">
            Langkah {step + 1} dari {SECTIONS.length}
          </span>
          <span className="text-[#6B533E]">{section.title}</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {SECTIONS.map((s, i) => (
            <div key={s.title}>
              <div className={`h-2 rounded-full transition-colors ${i <= step ? 'bg-gold-metallic' : 'bg-[#EFE5DB]'}`} />
              <p className={`hidden sm:block text-xs font-semibold mt-1.5 ${i === step ? 'text-[#2B180B]' : 'text-[#8C6D4F]'}`}>{s.title}</p>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div key={step} className="card p-5 sm:p-7 animate-fadeIn">
          <SectionHeading icon={section.icon} title={section.title} subtitle={section.subtitle} />
          {step === 0 && <DataDiriFields data={formData} onChange={updateForm} errors={errors} strict />}
          {step === 1 && <KeluargaFields data={formData} onChange={updateForm} errors={errors} strict />}
          {step === 2 && <GerejaFields data={formData} onChange={updateForm} errors={errors} strict />}
        </div>

        {submitError && (
          <div className="mt-4">
            <Alert>{submitError}</Alert>
          </div>
        )}

        {/* Tombol navigasi menempel di bawah layar */}
        <div className="sticky bottom-0 z-20 -mx-4 sm:mx-0 mt-4 px-4 sm:px-0 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-[#FAF6F0]/95 border-t border-[#C5A059]/25 sm:border-0">
          <div className="flex gap-3">
            {step > 0 && (
              <button type="button" onClick={() => goToStep(step - 1)} className="btn btn-secondary">
                <ChevronLeft className="w-5 h-5" />
                Kembali
              </button>
            )}
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Menyimpan…
                </>
              ) : isLast ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-[#D4AF37]" />
                  Simpan & Buat Kartu QR
                </>
              ) : (
                <>
                  Lanjut
                  <ChevronRight className="w-5 h-5 text-[#D4AF37]" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
