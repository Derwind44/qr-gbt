'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getJemaatByCodeOrId } from '@/lib/supabase';
import {
  getSessions,
  createSession,
  recordPresensi,
  getPresensiBySession,
  toggleSessionActive,
  deleteSession,
  Session,
  PresensiRecord,
} from '@/lib/presensi';
import { useAdminGuard } from '@/lib/auth';
import { formatDate, todayLocal } from '@/lib/options';
import QrScanner from '@/components/QrScanner';
import { BackLink, ConfirmDialog, EmptyState, PageHeader, Sheet, Toast, useToast } from '@/components/ui';
import { Field } from '@/components/form';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileImage,
  FileSpreadsheet,
  Keyboard,
  Loader2,
  Lock,
  LockOpen,
  Plus,
  Trash2,
  XCircle,
} from 'lucide-react';

type FeedbackType = 'success' | 'duplicate' | 'not_found';
interface ScanFeedback {
  type: FeedbackType;
  name: string;
}

const FEEDBACK_STYLE: Record<FeedbackType, { box: string; icon: typeof CheckCircle2; title: string; vibrate: number[] }> = {
  success: { box: 'bg-emerald-600 text-white', icon: CheckCircle2, title: 'Hadir tercatat', vibrate: [80] },
  duplicate: { box: 'bg-amber-500 text-[#2B180B]', icon: AlertTriangle, title: 'Sudah tercatat sebelumnya', vibrate: [50, 60, 50] },
  not_found: { box: 'bg-rose-600 text-white', icon: XCircle, title: 'QR tidak dikenal', vibrate: [250] },
};

const timeOf = (iso: string) => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

const fileSafe = (s: string) => s.replace(/[^\w-]+/g, '_');

export default function AdminPresensiPage() {
  const isAdmin = useAdminGuard();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [presensiList, setPresensiList] = useState<PresensiRecord[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [feedback, setFeedback] = useState<ScanFeedback | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [manualBusy, setManualBusy] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState(todayLocal);
  const [newDesc, setNewDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Session | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recapCardRef = useRef<HTMLDivElement>(null);
  const { toast, show } = useToast();

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;

  // Previously used session names as one-tap suggestions
  const nameSuggestions = useMemo(() => [...new Set(sessions.map((s) => s.name))].slice(0, 4), [sessions]);

  useEffect(() => {
    getSessions()
      .then(setSessions)
      .catch((err) => {
        console.error(err);
        show('Gagal memuat sesi. Periksa koneksi internet.', 'error');
      })
      .finally(() => setLoadingSessions(false));
  }, [show]);

  const selectSession = (id: string | null) => {
    setActiveSessionId(id);
    setFeedback(null);
    setPresensiList([]);
    setLoadingList(!!id);
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    if (!activeSessionId) return;
    let cancelled = false;
    getPresensiBySession(activeSessionId)
      .then((data) => !cancelled && setPresensiList(data))
      .catch(console.error)
      .finally(() => !cancelled && setLoadingList(false));
    return () => {
      cancelled = true;
    };
  }, [activeSessionId]);

  useEffect(() => () => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
  }, []);

  const showFeedback = (fb: ScanFeedback) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    navigator.vibrate?.(FEEDBACK_STYLE[fb.type].vibrate);
    setFeedback(fb);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 3000);
  };

  // QrScanner always calls the latest version of this function, so state here is never stale.
  const processQrCode = async (code: string) => {
    const sessionId = activeSessionId;
    if (!code || !sessionId) return;
    try {
      const jemaat = await getJemaatByCodeOrId(code);
      if (!jemaat) {
        showFeedback({ type: 'not_found', name: code });
        return;
      }

      const result = await recordPresensi({
        session_id: sessionId,
        jemaat_id: jemaat.id || jemaat.id_jemaat || code,
        id_jemaat: jemaat.id_jemaat || code,
        full_name: jemaat.full_name,
      });

      if (result.status === 'duplicate') {
        showFeedback({ type: 'duplicate', name: jemaat.full_name });
      } else if (result.status === 'success') {
        showFeedback({ type: 'success', name: jemaat.full_name });
        setPresensiList((prev) => [result.record, ...prev]);
      } else {
        showFeedback({ type: 'not_found', name: code });
      }
    } catch (err) {
      console.error(err);
      showFeedback({ type: 'not_found', name: code });
    }
  };

  const handleManualSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const code = manualCode.trim();
    if (!code || manualBusy) return;
    setManualBusy(true);
    await processQrCode(code);
    setManualBusy(false);
    setManualCode('');
  };

  const openCreate = () => {
    setNewName('');
    setNewDesc('');
    setNewDate(todayLocal());
    setShowCreate(true);
  };

  const handleCreateSession = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!newName.trim() || isCreating) return;
    setIsCreating(true);
    try {
      const session = await createSession({
        name: newName.trim(),
        event_date: newDate,
        description: newDesc.trim() || undefined,
      });
      setSessions((prev) => [session, ...prev]);
      selectSession(session.id);
      setShowCreate(false);
      show('Sesi dibuat. Silakan mulai scan.');
    } catch (err) {
      console.error(err);
      show('Gagal membuat sesi. Coba lagi.', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSession(deleteTarget.id);
      setSessions((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      if (activeSessionId === deleteTarget.id) selectSession(null);
      show('Sesi dihapus.');
    } catch (err) {
      console.error(err);
      show('Gagal menghapus sesi.', 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleToggleActive = async (session: Session) => {
    try {
      await toggleSessionActive(session.id, !session.is_active);
      setSessions((prev) => prev.map((s) => (s.id === session.id ? { ...s, is_active: !s.is_active } : s)));
      show(session.is_active ? 'Sesi ditutup.' : 'Sesi dibuka kembali.');
    } catch (err) {
      console.error(err);
      show('Gagal mengubah status sesi.', 'error');
    }
  };

  const exportCSV = () => {
    if (!activeSession || presensiList.length === 0) return;
    const quote = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const header = 'No,ID Jemaat,Nama Lengkap,Waktu Scan\n';
    const rows = [...presensiList]
      .reverse()
      .map((r, i) =>
        [i + 1, quote(r.id_jemaat), quote(r.full_name), quote(new Date(r.scan_time).toLocaleString('id-ID'))].join(',')
      )
      .join('\n');
    // BOM so Excel reads names with accents correctly
    const blob = new Blob(['﻿' + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `presensi_${fileSafe(activeSession.name)}_${activeSession.event_date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJPG = async () => {
    if (!recapCardRef.current || !activeSession || exporting) return;
    setExporting(true);
    try {
      const { toJpeg } = await import('html-to-image');
      const dataUrl = await toJpeg(recapCardRef.current, { quality: 0.95, pixelRatio: 2, cacheBust: true, backgroundColor: '#FFFDF9' });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `rekap_presensi_${fileSafe(activeSession.name)}_${activeSession.event_date}.jpg`;
      a.click();
    } catch (err) {
      console.error(err);
      show('Gagal membuat gambar. Coba lagi.', 'error');
    } finally {
      setExporting(false);
    }
  };

  if (!isAdmin) return null;

  const totalCount = presensiList.length;
  const fb = feedback ? FEEDBACK_STYLE[feedback.type] : null;

  return (
    <>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ======= DAFTAR SESI ======= */}
        <div className={`lg:col-span-5 space-y-4 ${activeSession ? 'hidden lg:block' : ''}`}>
          <PageHeader title="Presensi Ibadah" subtitle="Pilih sesi ibadah, lalu scan kartu QR jemaat yang hadir." />

          <button type="button" onClick={openCreate} className="btn btn-primary btn-lg w-full">
            <Plus className="w-5 h-5 text-[#D4AF37]" />
            Buat Sesi Ibadah Baru
          </button>

          <h2 className="section-title pt-2">Sesi Ibadah</h2>

          {loadingSessions ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-[76px] rounded-2xl" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="w-7 h-7" />}
              title="Belum ada sesi"
              text="Buat sesi untuk ibadah hari ini, misalnya “Ibadah Minggu Raya 1”."
            />
          ) : (
            <ul className="space-y-2">
              {sessions.map((session) => {
                const selected = session.id === activeSessionId;
                return (
                  <li key={session.id}>
                    <button
                      type="button"
                      onClick={() => selectSession(session.id)}
                      aria-current={selected || undefined}
                      className={`w-full text-left flex items-center gap-3 p-4 rounded-2xl border transition-colors ${
                        selected
                          ? 'bg-[#3B2211] border-[#C5A059] text-[#F3E5C8]'
                          : 'bg-[#FFFDF9] border-[#C5A059]/30 hover:border-[#C5A059]/70 active:bg-[#F3E5C8]/40'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-[15px] truncate ${selected ? '' : 'text-[#2B180B]'}`}>{session.name}</p>
                        <p className={`text-sm ${selected ? 'text-[#EAD6B0]' : 'text-[#6B533E]'}`}>
                          {formatDate(session.event_date)}
                          {session.description && ` · ${session.description}`}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
                          session.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-[#EFE5DB] text-[#6B533E]'
                        }`}
                      >
                        {session.is_active ? 'Dibuka' : 'Ditutup'}
                      </span>
                      <ChevronRight className={`w-5 h-5 shrink-0 ${selected ? 'text-[#D4AF37]' : 'text-[#C5A059]'}`} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ======= SESI AKTIF ======= */}
        {activeSession ? (
          <div className="lg:col-span-7 space-y-4">
            <div className="lg:hidden">
              <BackLink label="Semua sesi" onClick={() => selectSession(null)} />
            </div>

            <div className="card p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-black text-[#2B180B] leading-tight">{activeSession.name}</h1>
                <p className="text-sm text-[#6B533E]">{formatDate(activeSession.event_date, 'full')}</p>
              </div>
              <div className="text-center shrink-0 px-4 py-2 rounded-2xl bg-espresso-metallic" aria-live="polite">
                <p className="text-3xl font-black text-[#F3E5C8] leading-none">{totalCount}</p>
                <p className="text-xs font-bold text-[#D4AF37] mt-1">Hadir</p>
              </div>
            </div>

            <QrScanner
              key={activeSession.id}
              onScan={processQrCode}
              disabledMessage={
                !activeSession.is_active && (
                  <div className="space-y-3">
                    <p>Sesi ini sudah ditutup. Buka kembali untuk melanjutkan scan.</p>
                    <button type="button" onClick={() => handleToggleActive(activeSession)} className="btn btn-gold">
                      <LockOpen className="w-5 h-5" />
                      Buka Sesi
                    </button>
                  </div>
                )
              }
              overlay={
                feedback &&
                fb && (
                  <div role="status" className={`absolute inset-x-3 bottom-3 animate-fadeIn flex items-center gap-3 p-4 rounded-2xl shadow-xl ${fb.box}`}>
                    <fb.icon className="w-8 h-8 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold opacity-90">{fb.title}</p>
                      <p className="text-lg font-black leading-tight truncate">{feedback.name}</p>
                    </div>
                  </div>
                )
              }
            />

            {activeSession.is_active && (
              <details className="card">
                <summary className="flex items-center gap-2 p-4 min-h-[48px] text-[15px] font-bold text-[#2B180B] cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <Keyboard className="w-5 h-5 text-[#C5A059]" />
                  Kartu rusak / tidak terbaca? Ketik ID
                </summary>
                <form onSubmit={handleManualSubmit} className="flex gap-2 px-4 pb-4">
                  <input
                    type="text"
                    aria-label="ID Jemaat"
                    placeholder="Contoh: BU-0001060895"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck={false}
                    className="input font-mono flex-1 min-w-0"
                  />
                  <button type="submit" disabled={!manualCode.trim() || manualBusy} className="btn btn-primary px-4">
                    {manualBusy ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Catat'}
                  </button>
                </form>
              </details>
            )}

            {/* Daftar hadir */}
            <section className="card p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-black text-[#2B180B]">Daftar Hadir</h2>
                <span className="text-sm font-semibold text-[#6B533E]">{totalCount} orang</span>
              </div>

              {totalCount > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={exportCSV} className="btn btn-secondary btn-sm">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                    Unduh Excel
                  </button>
                  <button type="button" onClick={exportJPG} disabled={exporting} className="btn btn-secondary btn-sm">
                    {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileImage className="w-4 h-4 text-[#9A7B38]" />}
                    Unduh Gambar
                  </button>
                </div>
              )}

              {loadingList ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="skeleton h-14" />
                  ))}
                </div>
              ) : totalCount === 0 ? (
                <p className="text-sm text-[#6B533E] text-center py-6">Belum ada jemaat yang di-scan di sesi ini.</p>
              ) : (
                <ol className="divide-y divide-[#C5A059]/20 max-h-[420px] overflow-y-auto -mx-1 px-1">
                  {presensiList.map((record, i) => (
                    <li key={record.id} className="flex items-center gap-3 py-2.5">
                      <span className="w-7 text-right font-mono text-sm font-bold text-[#9A7B38] shrink-0">{totalCount - i}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[15px] text-[#2B180B] truncate">{record.full_name}</p>
                        <p className="text-[13px] text-[#6B533E] font-mono truncate">{record.id_jemaat}</p>
                      </div>
                      <span className="text-sm text-[#6B533E] shrink-0">{timeOf(record.scan_time)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            {/* Pengaturan sesi (dijauhkan dari tombol utama supaya tidak tersentuh) */}
            <section className="pt-2 space-y-2">
              <h2 className="section-title">Pengaturan Sesi</h2>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => handleToggleActive(activeSession)} className="btn btn-secondary btn-sm">
                  {activeSession.is_active ? <Lock className="w-4 h-4" /> : <LockOpen className="w-4 h-4" />}
                  {activeSession.is_active ? 'Tutup Sesi' : 'Buka Sesi'}
                </button>
                <button type="button" onClick={() => setDeleteTarget(activeSession)} className="btn btn-danger btn-sm">
                  <Trash2 className="w-4 h-4" />
                  Hapus Sesi
                </button>
              </div>
            </section>
          </div>
        ) : (
          <div className="hidden lg:flex lg:col-span-7 card p-10 flex-col items-center justify-center text-center gap-3 min-h-[360px]">
            <ClipboardList className="w-10 h-10 text-[#C5A059]" />
            <p className="text-base font-bold text-[#2B180B]">Pilih sesi ibadah di sebelah kiri</p>
            <p className="text-sm text-[#6B533E]">atau buat sesi baru untuk mulai mencatat kehadiran.</p>
          </div>
        )}
      </div>

      {/* Kartu rekap tersembunyi untuk ekspor gambar */}
      {activeSession && (
        <div className="fixed -left-[9999px] -top-[9999px]" aria-hidden>
          <div ref={recapCardRef} className="w-[480px] p-8 rounded-3xl border-2 border-[#C5A059]/60 bg-[#FFFDF9] font-sans">
            <div className="text-center mb-6">
              <p className="text-[10px] tracking-widest text-[#C5A059] font-black uppercase mb-1">GBT Bethlehem Surabaya</p>
              <h2 className="text-2xl font-black text-[#2B180B]">{activeSession.name}</h2>
              <p className="text-xs text-[#6B533E] mt-1">{formatDate(activeSession.event_date, 'full')}</p>
            </div>
            <div className="text-center py-4 border-y border-[#C5A059]/30 mb-5">
              <p className="text-6xl font-black text-[#2B180B]">{totalCount}</p>
              <p className="text-sm text-[#6B533E] font-bold mt-1">Total Jemaat Hadir</p>
            </div>
            <div className="space-y-1.5">
              {presensiList.slice(0, 15).map((r, i) => (
                <div key={r.id} className="flex items-center justify-between text-xs border-b border-[#C5A059]/15 pb-1">
                  <span className="text-[#C5A059] font-bold w-6 shrink-0">{i + 1}.</span>
                  <span className="flex-1 font-bold text-[#2B180B]">{r.full_name}</span>
                  <span className="text-[#8C6D4F] font-mono text-[10px]">{timeOf(r.scan_time)}</span>
                </div>
              ))}
              {presensiList.length > 15 && (
                <p className="text-[10px] text-[#6B533E] text-center pt-2">
                  ...dan {presensiList.length - 15} jemaat lainnya. Unduh Excel untuk data lengkap.
                </p>
              )}
            </div>
            <p className="text-[9px] text-[#C5A059] text-center mt-5 tracking-widest uppercase font-bold">
              qr-gbt.vercel.app · Sistem Presensi Digital GBT
            </p>
          </div>
        </div>
      )}

      {/* Buat sesi */}
      <Sheet open={showCreate} onClose={() => setShowCreate(false)} title="Buat Sesi Ibadah">
        <form onSubmit={handleCreateSession} className="space-y-4">
          <Field id="session-name" label="Nama Ibadah" required>
            <input
              id="session-name"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Contoh: Ibadah Minggu Raya 1"
              autoCapitalize="words"
              className="input"
            />
            {nameSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {nameSuggestions.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setNewName(name)}
                    className="h-9 px-3 rounded-full bg-[#EFE5DB] text-[#3B2211] text-sm font-semibold border border-[#C5A059]/30"
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </Field>
          <Field id="session-date" label="Tanggal" required>
            <input id="session-date" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="input" />
          </Field>
          <Field id="session-desc" label="Keterangan" optional>
            <input
              id="session-desc"
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Contoh: Pukul 07.00 WIB"
              className="input"
            />
          </Field>
          <button type="submit" disabled={!newName.trim() || !newDate || isCreating} className="btn btn-primary btn-lg w-full">
            {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5 text-[#D4AF37]" />}
            {isCreating ? 'Membuat sesi…' : 'Buat & Mulai Scan'}
          </button>
        </form>
      </Sheet>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus sesi ini?"
        message={
          <>
            Sesi <strong>{deleteTarget?.name}</strong> beserta seluruh data kehadirannya akan dihapus permanen.
          </>
        }
        confirmLabel="Ya, Hapus Sesi"
        loading={deleting}
        onConfirm={handleDeleteSession}
        onCancel={() => setDeleteTarget(null)}
      />

      <Toast toast={toast} />
    </>
  );
}
