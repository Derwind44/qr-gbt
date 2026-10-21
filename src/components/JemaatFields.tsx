'use client';

import { Church, Heart, User } from 'lucide-react';
import type { ReactNode } from 'react';
import { Jemaat } from '@/lib/types';
import { DIVISION_OPTIONS, MARITAL_OPTIONS, POTENTIAL_OPTIONS, STATUS_OPTIONS, todayLocal } from '@/lib/options';
import { CheckboxGroup, Field, PhotoUpload, RadioGroup, errorProps } from './form';

export type JemaatFormData = Partial<Jemaat>;
export type FormErrors = Partial<Record<keyof Jemaat, string>>;

interface SectionProps {
  data: JemaatFormData;
  onChange: (patch: JemaatFormData) => void;
  errors?: FormErrors;
  /** Show required markers for the full registration rules (create mode). */
  strict?: boolean;
}

const fid = (key: keyof Jemaat) => `f-${key}`;

export function validateDataDiri(d: JemaatFormData): FormErrors {
  const e: FormErrors = {};
  if (!d.full_name?.trim()) e.full_name = 'Nama lengkap wajib diisi (sesuai KTP).';
  if (!d.birth_place?.trim()) e.birth_place = 'Tempat lahir wajib diisi.';
  if (!d.birth_date) e.birth_date = 'Tanggal lahir wajib diisi.';
  if (!d.phone?.trim()) e.phone = 'Nomor HP / WA wajib diisi.';
  else if (d.phone.replace(/\D/g, '').length < 9) e.phone = 'Nomor HP sepertinya kurang lengkap.';
  if (!d.address?.trim()) e.address = 'Alamat wajib diisi.';
  if (!d.join_year?.trim()) e.join_year = 'Tahun bergabung wajib diisi.';
  return e;
}

export function validateKeluarga(d: JemaatFormData): FormErrors {
  const e: FormErrors = {};
  if (!d.father_name?.trim()) e.father_name = 'Nama ayah wajib diisi.';
  if (!d.mother_name?.trim()) e.mother_name = 'Nama ibu wajib diisi.';
  return e;
}

export function validateGereja(d: JemaatFormData): FormErrors {
  const e: FormErrors = {};
  if (!d.potentials?.length) e.potentials = 'Pilih minimal 1 potensi.';
  return e;
}

/** Scrolls to (and focuses) the first field that has an error. */
export function focusFirstError(errors: FormErrors) {
  const first = Object.keys(errors)[0] as keyof Jemaat | undefined;
  if (!first) return;
  const el = document.getElementById(fid(first));
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) el.focus({ preventScroll: true });
}

export function SectionHeading({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 pb-4 mb-5 border-b border-[#C5A059]/25">
      <span className="w-10 h-10 rounded-xl bg-[#3B2211] text-[#D4AF37] flex items-center justify-center shrink-0">{icon}</span>
      <div>
        <h2 className="text-lg font-black text-[#2B180B] leading-tight">{title}</h2>
        {subtitle && <p className="text-sm text-[#6B533E]">{subtitle}</p>}
      </div>
    </div>
  );
}

export function DataDiriFields({ data, onChange, errors = {}, strict }: SectionProps) {
  const text = (key: keyof Jemaat) => ({
    id: fid(key),
    value: (data[key] as string) || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ [key]: e.target.value }),
    className: 'input',
    ...errorProps(fid(key), errors[key]),
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
      <Field id={fid('full_name')} label="Nama Lengkap" required error={errors.full_name} hint="Sesuai KTP" className="sm:col-span-2">
        <input {...text('full_name')} type="text" autoComplete="name" autoCapitalize="words" placeholder="Contoh: Budi Santoso" />
      </Field>

      <Field label="Jenis Kelamin" required={strict} className="sm:col-span-2">
        <RadioGroup
          name="gender"
          value={data.gender}
          options={['Laki-laki', 'Perempuan'] as const}
          onChange={(gender) => onChange({ gender })}
        />
      </Field>

      <Field id={fid('birth_place')} label="Tempat Lahir" required={strict} error={errors.birth_place}>
        <input {...text('birth_place')} type="text" autoCapitalize="words" placeholder="Contoh: Surabaya" />
      </Field>

      <Field id={fid('birth_date')} label="Tanggal Lahir" required={strict} error={errors.birth_date}>
        <input {...text('birth_date')} type="date" max={todayLocal()} />
      </Field>

      <Field id={fid('phone')} label="Nomor HP / WhatsApp" required={strict} error={errors.phone}>
        <input {...text('phone')} type="tel" inputMode="tel" autoComplete="tel" placeholder="0812 3456 7890" />
      </Field>

      <Field id={fid('email')} label="Email" optional error={errors.email}>
        <input {...text('email')} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" placeholder="nama@gmail.com" />
      </Field>

      <Field id={fid('address')} label="Alamat Tempat Tinggal" required={strict} error={errors.address} className="sm:col-span-2">
        <textarea {...text('address')} rows={2} autoComplete="street-address" placeholder="Nama jalan, nomor rumah, kelurahan, kecamatan" />
      </Field>

      <Field id={fid('nik')} label="NIK (Nomor KTP)" optional hint="16 angka di KTP">
        <input {...text('nik')} type="text" inputMode="numeric" maxLength={16} placeholder="3578xxxxxxxxxxxx" />
      </Field>

      <Field id={fid('join_year')} label="Tahun Mulai Bergabung" required={strict} error={errors.join_year}>
        <input {...text('join_year')} type="text" inputMode="numeric" maxLength={4} placeholder={String(new Date().getFullYear())} />
      </Field>

      <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
        <PhotoUpload
          id={fid('profile_photo_url')}
          label="Foto Wajah (untuk kartu)"
          hint="Foto jelas, wajah menghadap depan"
          value={data.profile_photo_url}
          onChange={(profile_photo_url) => onChange({ profile_photo_url })}
        />
        <PhotoUpload
          id={fid('ktp_photo_url')}
          label="Foto KTP (boleh dikosongkan)"
          hint="Pastikan tulisan terbaca"
          variant="document"
          kind="ktp"
          value={data.ktp_photo_url}
          onChange={(ktp_photo_url) => onChange({ ktp_photo_url })}
        />
      </div>
    </div>
  );
}

export function KeluargaFields({ data, onChange, errors = {}, strict }: SectionProps) {
  const text = (key: keyof Jemaat) => ({
    id: fid(key),
    value: (data[key] as string) || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ [key]: e.target.value }),
    className: 'input',
    ...errorProps(fid(key), errors[key]),
  });

  const showSpouse = data.marital_status === 'Menikah' || !!data.spouse_name;
  const showChildren = data.children_count !== '0' || !!data.children_detail;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
      <Field id={fid('father_name')} label="Nama Ayah Kandung" required={strict} error={errors.father_name}>
        <input {...text('father_name')} type="text" autoCapitalize="words" placeholder="Nama lengkap ayah" />
      </Field>

      <Field id={fid('mother_name')} label="Nama Ibu Kandung" required={strict} error={errors.mother_name}>
        <input {...text('mother_name')} type="text" autoCapitalize="words" placeholder="Nama lengkap ibu" />
      </Field>

      <Field label="Status Pernikahan" required={strict} className="sm:col-span-2">
        <RadioGroup
          name="marital_status"
          value={data.marital_status}
          options={MARITAL_OPTIONS}
          cols={4}
          onChange={(marital_status) => onChange({ marital_status })}
        />
      </Field>

      {showSpouse && (
        <Field id={fid('spouse_name')} label="Nama Suami / Istri" optional className="sm:col-span-2 animate-fadeIn">
          <input {...text('spouse_name')} type="text" autoCapitalize="words" placeholder="Nama lengkap pasangan" />
        </Field>
      )}

      <Field label="Jumlah Anak" className="sm:col-span-2">
        <RadioGroup
          name="children_count"
          value={data.children_count}
          options={['0', '1', '2', '3', '4', '5+'] as const}
          cols={6}
          compact
          onChange={(children_count) => onChange({ children_count })}
        />
      </Field>

      {showChildren && (
        <Field id={fid('children_detail')} label="Nama & Tanggal Lahir Anak" optional className="sm:col-span-2 animate-fadeIn">
          <textarea {...text('children_detail')} rows={3} placeholder={'Contoh:\n1. Rian – 12/04/2021\n2. Clarissa – 05/09/2024'} />
        </Field>
      )}
    </div>
  );
}

export function GerejaFields({ data, onChange, errors = {}, strict }: SectionProps) {
  const potentials = data.potentials || [];
  const hasOther = potentials.some((p) => p.toLowerCase().includes('lain'));

  return (
    <div className="space-y-6">
      <Field label="Peran di Gereja" required={strict}>
        <RadioGroup
          name="church_role"
          value={data.church_role}
          options={[
            { value: 'Anggota', label: 'Anggota Jemaat' },
            { value: 'Pelayanan/Aktivis gereja', label: 'Pelayan / Aktivis' },
          ]}
          onChange={(church_role) => onChange({ church_role })}
        />
      </Field>

      <Field label="Status Keanggotaan" required={strict}>
        <RadioGroup
          name="status"
          value={data.status || 'Aktif'}
          options={STATUS_OPTIONS}
          cols={3}
          compact
          onChange={(status) => onChange({ status })}
        />
      </Field>

      <Field id={fid('potentials')} label="Potensi / Keahlian" required={strict} hint="Boleh pilih lebih dari satu" error={errors.potentials}>
        <CheckboxGroup id={fid('potentials')} values={potentials} options={POTENTIAL_OPTIONS} onChange={(v) => onChange({ potentials: v })} />
      </Field>

      {hasOther && (
        <Field id={fid('other_potential_desc')} label="Sebutkan keahlian lainnya" optional className="animate-fadeIn">
          <input
            id={fid('other_potential_desc')}
            type="text"
            value={data.other_potential_desc || ''}
            onChange={(e) => onChange({ other_potential_desc: e.target.value })}
            placeholder="Contoh: Desain grafis, konseling"
            className="input"
          />
        </Field>
      )}

      <Field label="Sudah ikut Divisi di GBT Bethlehem?" required={strict}>
        <RadioGroup
          name="is_joined_division"
          value={data.is_joined_division}
          options={[
            { value: 'Ya', label: 'Sudah' },
            { value: 'Tidak', label: 'Belum' },
          ]}
          onChange={(is_joined_division) => onChange({ is_joined_division })}
        />
      </Field>

      {data.is_joined_division === 'Ya' && (
        <Field label="Divisi yang diikuti" hint="Boleh pilih lebih dari satu" className="animate-fadeIn">
          <CheckboxGroup
            values={data.joined_divisions || []}
            options={DIVISION_OPTIONS}
            cols={1}
            onChange={(v) => onChange({ joined_divisions: v })}
          />
        </Field>
      )}
    </div>
  );
}

export const SECTIONS = [
  { title: 'Data Diri', subtitle: 'Identitas sesuai KTP', icon: <User className="w-5 h-5" /> },
  { title: 'Data Keluarga', subtitle: 'Orang tua, pasangan & anak', icon: <Heart className="w-5 h-5" /> },
  { title: 'Gereja & Pelayanan', subtitle: 'Peran, potensi & divisi', icon: <Church className="w-5 h-5" /> },
];
