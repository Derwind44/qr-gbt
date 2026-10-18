'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getJemaatByCodeOrId, updateJemaat } from '@/lib/supabase';
import { Jemaat } from '@/lib/types';
import { useAdminGuard } from '@/lib/auth';
import { setFlash } from '@/lib/flash';
import { Alert, BackLink, EmptyState, Spinner } from '@/components/ui';
import {
  DataDiriFields,
  GerejaFields,
  KeluargaFields,
  SECTIONS,
  SectionHeading,
  focusFirstError,
  type FormErrors,
  type JemaatFormData,
} from '@/components/JemaatFields';
import { Loader2, Save, UserX } from 'lucide-react';

export default function EditJemaatPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isAdmin = useAdminGuard();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<JemaatFormData>({});

  useEffect(() => {
    if (!id) return;
    getJemaatByCodeOrId(id)
      .then((item) => {
        if (!item) {
          setNotFound(true);
          return;
        }
        const divisions = item.joined_divisions || [];
        setFormData({
          ...item,
          father_name: item.father_name || '-',
          mother_name: item.mother_name || '-',
          join_year: item.join_year || '2026',
          potentials: item.potentials || [],
          joined_divisions: divisions,
          is_joined_division: divisions.length > 0 ? 'Ya' : item.is_joined_division || 'Tidak',
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const updateForm = (patch: JemaatFormData) => {
    setFormData((prev) => ({ ...prev, ...patch }));
    if ('full_name' in patch && errors.full_name) setErrors({});
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.full_name?.trim()) {
      const errs = { full_name: 'Nama lengkap wajib diisi.' };
      setErrors(errs);
      focusFirstError(errs);
      return;
    }

    const payloadToSave: Partial<Jemaat> = {
      ...formData,
      father_name: formData.father_name?.trim() || '-',
      mother_name: formData.mother_name?.trim() || '-',
      joined_divisions: formData.is_joined_division === 'Ya' ? formData.joined_divisions : [],
    };

    setSaving(true);
    try {
      const res = await updateJemaat(id, payloadToSave);
      if (res) {
        setFlash('Perubahan data berhasil disimpan.');
        router.push(`/jemaat/${id}`);
        return;
      }
      setErrorMsg('Gagal menyimpan perubahan. Coba lagi.');
    } catch (err) {
      console.error(err);
      setErrorMsg('Terjadi kesalahan saat menyimpan. Periksa koneksi internet.');
    }
    setSaving(false);
  };

  if (!isAdmin) return null;
  if (loading) return <Spinner label="Memuat data jemaat…" />;

  if (notFound) {
    return (
      <div className="max-w-md mx-auto pt-8">
        <EmptyState
          icon={<UserX className="w-7 h-7" />}
          title="Data tidak ditemukan"
          action={
            <Link href="/jemaat" className="btn btn-primary">
              Kembali ke Daftar Jemaat
            </Link>
          }
        />
      </div>
    );
  }

  const sectionProps = { data: formData, onChange: updateForm, errors };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <BackLink href={`/jemaat/${id}`} label="Batal" />

      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#2B180B] tracking-tight">Ubah Data Jemaat</h1>
        <p className="text-sm font-mono font-bold text-[#6B533E]">{formData.id_jemaat || id}</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <section className="card p-5 sm:p-7">
          <SectionHeading {...SECTIONS[0]} />
          <DataDiriFields {...sectionProps} />
        </section>
        <section className="card p-5 sm:p-7">
          <SectionHeading {...SECTIONS[1]} />
          <KeluargaFields {...sectionProps} />
        </section>
        <section className="card p-5 sm:p-7">
          <SectionHeading {...SECTIONS[2]} />
          <GerejaFields {...sectionProps} />
        </section>

        {errorMsg && <Alert>{errorMsg}</Alert>}

        <div className="sticky bottom-0 z-20 -mx-4 sm:mx-0 px-4 sm:px-0 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-[#FAF6F0]/95 border-t border-[#C5A059]/25 sm:border-0">
          <div className="flex gap-3">
            <Link href={`/jemaat/${id}`} className="btn btn-secondary">
              Batal
            </Link>
            <button type="submit" disabled={saving} className="btn btn-primary flex-1">
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 text-[#D4AF37]" />}
              {saving ? 'Menyimpan…' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
