import { Jemaat } from './types';

export const POTENTIAL_OPTIONS = [
  'IT / Multimedia',
  'Sound system',
  'Musik',
  'Vocal',
  'Pemerhati',
  'Pengajar/Guru',
  'Administrasi',
  'Lain Lain',
];

export const DIVISION_OPTIONS = [
  'Divisi Anak WONDERFUL KIDS',
  'Divisi Muda YOBEL',
  'Divisi Dewasa Muda XTION',
  'Divisi Wanita HANA',
  'Divisi Keluarga KEMAS',
];

export const MARITAL_OPTIONS = ['Belum Menikah', 'Menikah', 'Cerai Mati', 'Cerai Hidup'] as const;

export const STATUS_OPTIONS = ['Aktif', 'Nonaktif', 'Meninggal'] as const;

export const CATEGORY_FILTERS = ['Semua', 'Pelayan', 'Pemuda', 'Anak', 'Jemaat Umum'];

export function roleLabel(j: Pick<Jemaat, 'church_role'>): string {
  if (j.church_role === 'Pelayanan/Aktivis gereja') return 'Pelayan';
  return j.church_role || 'Anggota';
}

/** Local date as YYYY-MM-DD (toISOString would give yesterday's date before 07:00 WIB). */
export function todayLocal(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function formatDate(value?: string, style: 'long' | 'full' = 'long'): string {
  if (!value) return '-';
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  if (isNaN(date.getTime())) return value;
  return style === 'full'
    ? date.toLocaleDateString('id-ID', { dateStyle: 'full' })
    : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** 0812xxxx -> 62812xxxx for wa.me links */
export function toWhatsAppNumber(phone?: string): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('0')) digits = `62${digits.slice(1)}`;
  else if (digits.startsWith('8')) digits = `62${digits}`;
  return digits.length >= 9 ? digits : null;
}
