'use client';

import { useCallback, useEffect, useState } from 'react';
import { getTrash, purgeJemaat, restoreJemaat, TrashedJemaat } from '@/lib/api';
import { useAdminGuard } from '@/lib/auth';
import { displayName } from '@/lib/options';
import { Alert, Avatar, BackLink, EmptyState, PageHeader, Sheet, Spinner, Toast, useToast } from '@/components/ui';
import { ExternalLink, Loader2, RotateCcw, Trash2 } from 'lucide-react';

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS));
}

export default function SampahPage() {
  const isAdmin = useAdminGuard();
  const [items, setItems] = useState<TrashedJemaat[]>([]);
  const [retentionDays, setRetentionDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<TrashedJemaat | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [driveReminder, setDriveReminder] = useState<{ name: string; url: string } | null>(null);
  const { toast, show } = useToast();

  const load = useCallback(() => {
    getTrash()
      .then((res) => {
        setItems(res.items);
        setRetentionDays(res.retentionDays);
      })
      .catch((err) => show(err.message || 'Gagal memuat sampah.', 'error'))
      .finally(() => setLoading(false));
  }, [show]);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  const handleRestore = async (item: TrashedJemaat) => {
    setBusyId(item.id);
    try {
      await restoreJemaat(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      show(`${displayName(item.full_name)} sudah dipulihkan.`);
    } catch (err) {
      show(err instanceof Error ? err.message : 'Gagal memulihkan data.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const closePurge = () => {
    setPurgeTarget(null);
    setConfirmText('');
  };

  const handlePurge = async () => {
    if (!purgeTarget) return;
    const target = purgeTarget;
    setBusyId(target.id);
    try {
      const { driveKtpUrl } = await purgeJemaat(target.id);
      setItems((prev) => prev.filter((i) => i.id !== target.id));
      closePurge();
      show(`${displayName(target.full_name)} dihapus permanen.`);
      if (driveKtpUrl) setDriveReminder({ name: displayName(target.full_name), url: driveKtpUrl });
    } catch (err) {
      show(err instanceof Error ? err.message : 'Gagal menghapus permanen.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  if (!isAdmin) return null;

  const nameMatches =
    purgeTarget !== null && confirmText.trim().toLowerCase() === purgeTarget.full_name.trim().toLowerCase();

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <BackLink href="/jemaat" label="Daftar Jemaat" />
      <PageHeader
        title="Sampah"
        subtitle={`Data yang dihapus disimpan ${retentionDays} hari sebelum terhapus permanen otomatis.`}
      />

      {driveReminder && (
        <Alert type="warning">
          Foto KTP {driveReminder.name} dari Google Form masih ada di Drive. Hapus manual:{' '}
          <a href={driveReminder.url} target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1">
            buka file <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </Alert>
      )}

      {loading ? (
        <Spinner label="Memuat sampah…" />
      ) : items.length === 0 ? (
        <EmptyState icon={<Trash2 className="w-7 h-7" />} title="Sampah kosong" text="Tidak ada data jemaat yang dihapus." />
      ) : (
        <ul className="card divide-y divide-[#C5A059]/20 overflow-hidden">
          {items.map((item) => {
            const ago = daysAgo(item.deleted_at);
            const left = Math.max(0, retentionDays - ago);
            const busy = busyId === item.id;
            return (
              <li key={item.id} className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar name={item.full_name} src={item.profile_photo_url} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[15px] text-[#2B180B] truncate">{displayName(item.full_name)}</p>
                    <p className="text-sm text-[#6B533E]">
                      Dihapus {ago === 0 ? 'hari ini' : `${ago} hari lalu`} · terhapus permanen dalam {left} hari
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => handleRestore(item)} disabled={busy} className="btn btn-secondary btn-sm">
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                    Pulihkan
                  </button>
                  <button type="button" onClick={() => setPurgeTarget(item)} disabled={busy} className="btn btn-ghost btn-sm text-rose-700">
                    <Trash2 className="w-4 h-4" />
                    Hapus permanen
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Sheet open={purgeTarget !== null} onClose={closePurge} title="Hapus permanen?">
        {purgeTarget && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (nameMatches) handlePurge();
            }}
          >
            <p className="text-[15px] text-[#3B2211] leading-relaxed">
              Semua data <strong>{displayName(purgeTarget.full_name)}</strong>, termasuk foto KTP, akan dihapus selamanya dan
              tidak bisa dipulihkan. Riwayat presensi tetap tersimpan.
            </p>
            <div>
              <label htmlFor="confirm-name" className="label">
                Ketik nama lengkapnya untuk konfirmasi
              </label>
              <input
                id="confirm-name"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={displayName(purgeTarget.full_name)}
                autoComplete="off"
                className="input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={closePurge} className="btn btn-secondary">
                Batal
              </button>
              <button type="submit" disabled={!nameMatches || busyId !== null} className="btn btn-danger-solid">
                {busyId === purgeTarget.id && <Loader2 className="w-4 h-4 animate-spin" />}
                Hapus Permanen
              </button>
            </div>
          </form>
        )}
      </Sheet>

      <Toast toast={toast} />
    </div>
  );
}
