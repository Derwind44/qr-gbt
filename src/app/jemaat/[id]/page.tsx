'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getJemaatByCodeOrId, deleteJemaat } from '@/lib/api';
import { Jemaat } from '@/lib/types';
import { useAdminGuard } from '@/lib/auth';
import { setFlash, takeFlash } from '@/lib/flash';
import { formatDate, roleLabel, toWhatsAppNumber } from '@/lib/options';
import { privateDriveImageUrl } from '@/lib/gdrive';
import QRCard from '@/components/QRCard';
import {
  Avatar,
  BackLink,
  ConfirmDialog,
  EmptyState,
  Spinner,
  StatusBadge,
  Toast,
  useToast,
} from '@/components/ui';
import { User, Heart, Church, FileText, Pencil, Trash2, Phone, MessageCircle, UserX, QrCode } from 'lucide-react';

function InfoSection({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-base font-black text-[#2B180B] mb-4">
        <span className="text-[#C5A059]">{icon}</span>
        {title}
      </h2>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">{children}</dl>
    </section>
  );
}

function InfoRow({ label, value, wide, mono }: { label: string; value?: ReactNode; wide?: boolean; mono?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <dt className="text-[13px] font-semibold text-[#6B533E]">{label}</dt>
      <dd className={`text-[15px] font-semibold text-[#2B180B] mt-0.5 break-words whitespace-pre-line ${mono ? 'font-mono' : ''}`}>
        {value || <span className="text-[#8C6D4F] font-normal">—</span>}
      </dd>
    </div>
  );
}

function Tags({ items, gold }: { items?: string[]; gold?: boolean }) {
  if (!items?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {items.map((t) => (
        <span
          key={t}
          className={`px-2.5 py-1 rounded-lg text-sm font-bold ${gold ? 'bg-gold-metallic text-[#2B180B]' : 'bg-[#3B2211] text-[#F3E5C8]'}`}
        >
          {t}
        </span>
      ))}
    </div>
  );
}

export default function JemaatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isAdmin = useAdminGuard();

  const [jemaat, setJemaat] = useState<Jemaat | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'data' | 'kartu'>('data');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast, show } = useToast();

  useEffect(() => {
    const flash = takeFlash();
    if (flash) show(flash);
    if (!id) return;
    getJemaatByCodeOrId(id)
      .then(setJemaat)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, show]);

  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.push('/jemaat');
  };

  const handleDelete = async () => {
    if (!jemaat) return;
    setDeleting(true);
    const success = await deleteJemaat(jemaat.id);
    setDeleting(false);
    if (success) {
      setFlash(`Data ${jemaat.full_name} sudah dihapus.`);
      router.push('/jemaat');
    } else {
      setConfirmOpen(false);
      show('Gagal menghapus data. Coba lagi.', 'error');
    }
  };

  if (!isAdmin) return null;
  if (loading) return <Spinner label="Memuat data jemaat…" />;

  if (!jemaat) {
    return (
      <div className="max-w-md mx-auto pt-8">
        <EmptyState
          icon={<UserX className="w-7 h-7" />}
          title="Data tidak ditemukan"
          text={`Jemaat dengan ID ${id} tidak ada atau sudah dihapus.`}
          action={
            <Link href="/jemaat" className="btn btn-primary">
              Kembali ke Daftar Jemaat
            </Link>
          }
        />
      </div>
    );
  }

  const waNumber = toWhatsAppNumber(jemaat.phone);
  const birth = [jemaat.birth_place, jemaat.birth_date ? formatDate(jemaat.birth_date) : ''].filter(Boolean).join(', ');

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <BackLink label="Kembali" onClick={goBack} />

      {/* Profil singkat */}
      <div className="card p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <Avatar name={jemaat.full_name} src={jemaat.profile_photo_url} size="lg" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-black text-[#2B180B] tracking-tight leading-tight break-words">{jemaat.full_name}</h1>
            <p className="text-sm font-mono font-bold text-[#6B533E]">{jemaat.id_jemaat || jemaat.id}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-[#3B2211] text-[#F3E5C8] text-xs font-bold">{roleLabel(jemaat)}</span>
              <StatusBadge status={jemaat.status} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-5">
          {waNumber ? (
            <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm flex-col h-16 gap-1 text-emerald-800">
              <MessageCircle className="w-5 h-5" />
              WhatsApp
            </a>
          ) : (
            <span className="btn btn-secondary btn-sm flex-col h-16 gap-1 opacity-50 cursor-not-allowed">
              <MessageCircle className="w-5 h-5" />
              WhatsApp
            </span>
          )}
          {jemaat.phone ? (
            <a href={`tel:${jemaat.phone.replace(/[^\d+]/g, '')}`} className="btn btn-secondary btn-sm flex-col h-16 gap-1">
              <Phone className="w-5 h-5" />
              Telepon
            </a>
          ) : (
            <span className="btn btn-secondary btn-sm flex-col h-16 gap-1 opacity-50 cursor-not-allowed">
              <Phone className="w-5 h-5" />
              Telepon
            </span>
          )}
          <Link href={`/jemaat/${id}/edit`} className="btn btn-primary btn-sm flex-col h-16 gap-1">
            <Pencil className="w-5 h-5 text-[#D4AF37]" />
            Ubah Data
          </Link>
        </div>
      </div>

      {/* Tab (HP saja) */}
      <div className="lg:hidden grid grid-cols-2 p-1 rounded-2xl bg-[#EFE5DB] border border-[#C5A059]/30" role="tablist">
        {[
          { key: 'data' as const, label: 'Data Jemaat', icon: User },
          { key: 'kartu' as const, label: 'Kartu QR', icon: QrCode },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-bold transition-colors ${
              tab === key ? 'bg-[#3B2211] text-[#F3E5C8] shadow' : 'text-[#6B533E]'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className={`lg:col-span-7 space-y-4 ${tab === 'data' ? '' : 'hidden lg:block'}`}>
          <InfoSection icon={<User className="w-5 h-5" />} title="Data Diri">
            <InfoRow label="Jenis Kelamin" value={jemaat.gender} />
            <InfoRow label="Tempat, Tanggal Lahir" value={birth} />
            <InfoRow label="Nomor HP / WA" value={jemaat.phone} />
            <InfoRow label="Email" value={jemaat.email} />
            <InfoRow label="NIK (KTP)" value={jemaat.nik} mono />
            <InfoRow label="Tahun Bergabung" value={jemaat.join_year} />
            <InfoRow label="Alamat" value={jemaat.address} wide />
          </InfoSection>

          <InfoSection icon={<Heart className="w-5 h-5" />} title="Data Keluarga">
            <InfoRow label="Nama Ayah" value={jemaat.father_name} />
            <InfoRow label="Nama Ibu" value={jemaat.mother_name} />
            <InfoRow label="Status Pernikahan" value={jemaat.marital_status} />
            <InfoRow label="Nama Pasangan" value={jemaat.spouse_name} />
            <InfoRow label="Jumlah Anak" value={jemaat.children_count} />
            {jemaat.children_detail && <InfoRow label="Nama & Tanggal Lahir Anak" value={jemaat.children_detail} wide />}
          </InfoSection>

          <InfoSection icon={<Church className="w-5 h-5" />} title="Gereja & Pelayanan">
            <InfoRow label="Peran di Gereja" value={roleLabel(jemaat)} />
            <InfoRow label="Status Keanggotaan" value={jemaat.status || 'Aktif'} />
            <InfoRow
              label="Potensi / Keahlian"
              value={
                jemaat.potentials?.length ? (
                  <>
                    <Tags items={jemaat.potentials} />
                    {jemaat.other_potential_desc && <span className="block mt-1.5 text-sm">{jemaat.other_potential_desc}</span>}
                  </>
                ) : undefined
              }
              wide
            />
            <InfoRow label="Divisi yang Diikuti" value={jemaat.joined_divisions?.length ? <Tags items={jemaat.joined_divisions} gold /> : undefined} wide />
          </InfoSection>

          {jemaat.ktp_photo_url && (
            <section className="card p-5 sm:p-6">
              <h2 className="flex items-center gap-2 text-base font-black text-[#2B180B] mb-3">
                <FileText className="w-5 h-5 text-[#C5A059]" />
                Foto KTP
              </h2>
              <a href={privateDriveImageUrl(jemaat.ktp_photo_url)} target="_blank" rel="noopener noreferrer" className="block">
                <img
                  src={privateDriveImageUrl(jemaat.ktp_photo_url)}
                  alt="Foto KTP"
                  loading="lazy"
                  decoding="async"
                  className="w-full max-w-sm rounded-2xl object-cover border border-[#C5A059]/30"
                />
                <span className="block mt-2 text-sm font-semibold text-[#6B533E]">Ketuk foto untuk memperbesar</span>
              </a>
            </section>
          )}

          <button type="button" onClick={() => setConfirmOpen(true)} className="btn btn-danger w-full">
            <Trash2 className="w-5 h-5" />
            Hapus Data Jemaat
          </button>
        </div>

        <div className={`lg:col-span-5 lg:sticky lg:top-24 ${tab === 'kartu' ? '' : 'hidden lg:block'}`}>
          <div className="card p-5 sm:p-6">
            <h2 className="text-base font-black text-[#2B180B]">Kartu QR Jemaat</h2>
            <p className="text-sm text-[#6B533E] mb-4">Unduh lalu kirim ke jemaat atau cetak.</p>
            <QRCard jemaat={jemaat} />
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Hapus data jemaat?"
        message={
          <>
            Data <strong>{jemaat.full_name}</strong> akan dihapus permanen dan kartu QR-nya tidak bisa dipakai lagi.
          </>
        }
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
      <Toast toast={toast} />
    </div>
  );
}
