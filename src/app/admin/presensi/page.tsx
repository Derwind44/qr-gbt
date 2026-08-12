'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
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
import AdminLoginModal from '@/components/AdminLoginModal';
import {
  Camera,
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Plus,
  Users,
  Download,
  Trash2,
  RefreshCw,
  CalendarDays,
  X,
  FileImage,
  FileText,
  ToggleLeft,
} from 'lucide-react';
import { toPng } from 'html-to-image';

// =====================
// SCAN FEEDBACK TYPE
// =====================
type FeedbackType = 'success' | 'duplicate' | 'not_found';
interface ScanFeedback {
  type: FeedbackType;
  name: string;
  id_jemaat?: string;
}

export default function AdminPresensiPage() {
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [presensiList, setPresensiList] = useState<PresensiRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ScanFeedback | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionDate, setNewSessionDate] = useState(new Date().toISOString().slice(0, 10));
  const [newSessionDesc, setNewSessionDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recapCardRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;

  // ---- AUTH CHECK ----
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem('admin_authenticated');
      if (auth !== 'true') setShowAdminModal(true);
    }
  }, []);

  // ---- LOAD SESSIONS ----
  const loadSessions = useCallback(async () => {
    try {
      const data = await getSessions();
      setSessions(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // ---- LOAD PRESENSI FOR ACTIVE SESSION ----
  const loadPresensi = useCallback(async (sessionId: string) => {
    try {
      const data = await getPresensiBySession(sessionId);
      setPresensiList(data);
      setTotalCount(data.length);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (activeSessionId) loadPresensi(activeSessionId);
    else {
      setPresensiList([]);
      setTotalCount(0);
    }
  }, [activeSessionId, loadPresensi]);

  // ---- FEEDBACK HELPER ----
  const showFeedback = (fb: ScanFeedback) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setFeedback(fb);
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 3500);
  };

  // ---- PROCESS SCANNED QR ----
  const processQrCode = useCallback(
    async (code: string) => {
      if (!code || isSearching || !activeSessionId) return;
      setIsSearching(true);

      try {
        // Pause scanner while processing
        if (html5QrCodeRef.current?.isScanning) {
          await html5QrCodeRef.current.pause(true);
        }

        // Look up jemaat
        const jemaat = await getJemaatByCodeOrId(code);
        if (!jemaat) {
          showFeedback({ type: 'not_found', name: code });
          return;
        }

        // Record presensi
        const result = await recordPresensi({
          session_id: activeSessionId,
          jemaat_id: jemaat.id || jemaat.id_jemaat || code,
          id_jemaat: jemaat.id_jemaat || code,
          full_name: jemaat.full_name,
        });

        if (result.status === 'duplicate') {
          showFeedback({ type: 'duplicate', name: jemaat.full_name, id_jemaat: jemaat.id_jemaat });
        } else if (result.status === 'success') {
          showFeedback({ type: 'success', name: jemaat.full_name, id_jemaat: jemaat.id_jemaat });
          // Prepend to list & update counter
          setPresensiList((prev) => [result.record, ...prev]);
          setTotalCount((c) => c + 1);
        } else {
          showFeedback({ type: 'not_found', name: code });
        }
      } catch (err) {
        console.error(err);
        showFeedback({ type: 'not_found', name: code });
      } finally {
        setIsSearching(false);
        // Resume scanner
        if (html5QrCodeRef.current) {
          try { html5QrCodeRef.current.resume(); } catch (_) {}
        }
      }
    },
    [activeSessionId, isSearching]
  );

  // ---- CAMERA ----
  const startScanner = async () => {
    setCameraError(null);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('presensi-qr-reader');
      }
      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        { fps: 12, qrbox: { width: 220, height: 220 } },
        (decoded) => { processQrCode(decoded); },
        () => {}
      );
      setScanning(true);
    } catch (err: any) {
      console.error(err);
      setCameraError('Gagal membuka kamera. Izinkan akses kamera di browser Anda.');
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current?.isScanning) {
      try { await html5QrCodeRef.current.stop(); } catch (_) {}
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
    };
  }, []);

  // ---- CREATE SESSION ----
  const handleCreateSession = async () => {
    if (!newSessionName.trim()) return;
    setIsCreating(true);
    try {
      const session = await createSession({
        name: newSessionName.trim(),
        event_date: newSessionDate,
        description: newSessionDesc.trim() || undefined,
      });
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.id);
      setShowCreateModal(false);
      setNewSessionName('');
      setNewSessionDesc('');
    } catch (err) {
      console.error(err);
      alert('Gagal membuat sesi. Coba lagi.');
    } finally {
      setIsCreating(false);
    }
  };

  // ---- DELETE SESSION ----
  const handleDeleteSession = async (id: string) => {
    if (!confirm('Hapus sesi ini beserta semua data presensinya? Tindakan ini tidak bisa dibatalkan.')) return;
    try {
      await deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (activeSessionId === id) setActiveSessionId(null);
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus sesi.');
    }
  };

  // ---- TOGGLE SESSION ACTIVE ----
  const handleToggleActive = async (session: Session) => {
    try {
      await toggleSessionActive(session.id, !session.is_active);
      setSessions((prev) => prev.map((s) => s.id === session.id ? { ...s, is_active: !s.is_active } : s));
    } catch (err) {
      console.error(err);
    }
  };

  // ---- EXPORT CSV ----
  const exportCSV = () => {
    if (!activeSession || presensiList.length === 0) return;
    const header = 'No,ID Jemaat,Nama Lengkap,Waktu Scan\n';
    const rows = presensiList.map((r, i) =>
      `${i + 1},${r.id_jemaat},"${r.full_name}",${new Date(r.scan_time).toLocaleString('id-ID')}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `presensi_${activeSession.name.replace(/\s+/g, '_')}_${activeSession.event_date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---- EXPORT JPG ----
  const exportJPG = async () => {
    if (!recapCardRef.current || !activeSession) return;
    try {
      const dataUrl = await toPng(recapCardRef.current, { quality: 1.0, pixelRatio: 2, cacheBust: true });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `rekap_presensi_${activeSession.name.replace(/\s+/g, '_')}_${activeSession.event_date}.jpg`;
      a.click();
    } catch (err) {
      console.error(err);
      alert('Gagal mengekspor gambar. Coba lagi.');
    }
  };

  // ---- FEEDBACK COLORS ----
  const feedbackColor = feedback?.type === 'success'
    ? 'bg-emerald-500/15 border-emerald-600/40 text-emerald-800'
    : feedback?.type === 'duplicate'
    ? 'bg-amber-500/15 border-amber-600/40 text-amber-800'
    : 'bg-rose-500/15 border-rose-600/40 text-rose-800';

  const feedbackIcon = feedback?.type === 'success'
    ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
    : feedback?.type === 'duplicate'
    ? <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
    : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />;

  return (
    <>
      <AdminLoginModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        onSuccess={() => setShowAdminModal(false)}
      />

      <div className="max-w-5xl mx-auto space-y-6 py-4 pb-24 md:pb-6">
        {/* Page Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3B2211]/10 border border-[#C5A059]/40 text-[#3B2211] text-xs font-bold mb-2">
              <ClipboardList className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Presensi Ibadah — Khusus Admin</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#2B180B]">
              Absensi & Presensi Ibadah
            </h1>
            <p className="text-xs text-[#6B533E] mt-1">
              Pilih atau buat sesi ibadah, lalu scan QR jemaat untuk mencatat kehadiran secara real-time.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-espresso-metallic text-[#F3E5C8] font-bold text-sm border border-[#C5A059]/40 shadow-lg hover:scale-[1.02] transition-transform"
          >
            <Plus className="w-4 h-4 text-[#D4AF37]" />
            <span>Buat Sesi Baru</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ======= LEFT: SESSIONS PANEL ======= */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-sm font-bold text-[#2B180B] flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-[#C5A059]" />
              Daftar Sesi Ibadah
            </h2>

            {sessions.length === 0 ? (
              <div className="glass-panel rounded-2xl p-6 text-center border border-[#C5A059]/30 bg-[#FFFDF9]">
                <ClipboardList className="w-8 h-8 text-[#C5A059] mx-auto mb-2 opacity-50" />
                <p className="text-xs text-[#6B533E]">Belum ada sesi ibadah. Buat sesi baru untuk memulai.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {sessions.map((session) => {
                  const isActive = session.id === activeSessionId;
                  return (
                    <div
                      key={session.id}
                      onClick={() => setActiveSessionId(session.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isActive
                          ? 'bg-[#3B2211] border-[#C5A059] text-[#F3E5C8] shadow-lg'
                          : 'bg-[#FFFDF9] border-[#C5A059]/30 text-[#2B180B] hover:border-[#C5A059]/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${session.is_active ? 'bg-emerald-500' : 'bg-[#8C6D4F]'}`}></span>
                            <p className={`font-bold text-xs leading-snug truncate ${isActive ? 'text-[#F3E5C8]' : 'text-[#2B180B]'}`}>
                              {session.name}
                            </p>
                          </div>
                          <p className={`text-[10px] ${isActive ? 'text-[#EAD6B0]' : 'text-[#6B533E]'}`}>
                            {new Date(session.event_date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                          {session.description && (
                            <p className={`text-[10px] mt-0.5 truncate ${isActive ? 'text-[#EAD6B0]' : 'text-[#8C6D4F]'}`}>
                              {session.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleActive(session); }}
                            title={session.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                            className={`p-1 rounded-lg text-xs transition-colors ${isActive ? 'hover:bg-white/10 text-[#EAD6B0]' : 'hover:bg-[#EFE5DB] text-[#8C6D4F]'}`}
                          >
                            <ToggleLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }}
                            title="Hapus Sesi"
                            className={`p-1 rounded-lg text-xs transition-colors ${isActive ? 'hover:bg-white/10 text-rose-300' : 'hover:bg-rose-50 text-rose-400'}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ======= RIGHT: SCANNER + PRESENSI ======= */}
          <div className="lg:col-span-3 space-y-4">
            {/* Active Session Info */}
            {activeSession ? (
              <div className="glass-panel rounded-2xl p-4 border border-[#C5A059]/40 bg-[#FFFDF9] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-espresso-metallic flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="font-black text-[#2B180B] text-sm leading-tight">{activeSession.name}</p>
                    <p className="text-[10px] text-[#6B533E]">
                      {new Date(activeSession.event_date + 'T00:00:00').toLocaleDateString('id-ID', { dateStyle: 'full' })}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-3xl font-black text-[#2B180B]">{totalCount}</p>
                  <p className="text-[10px] text-[#6B533E] font-bold">Jemaat Hadir</p>
                </div>
              </div>
            ) : (
              <div className="glass-panel rounded-2xl p-4 border border-[#C5A059]/30 bg-[#FFFDF9] text-center">
                <p className="text-xs text-[#6B533E] font-bold">← Pilih Sesi Ibadah dari daftar untuk mulai scan presensi</p>
              </div>
            )}

            {/* Scan Feedback Toast */}
            {feedback && (
              <div className={`flex items-center gap-3 p-3.5 rounded-2xl border text-sm font-bold animate-fadeIn ${feedbackColor}`}>
                {feedbackIcon}
                <div>
                  {feedback.type === 'success' && <span>✅ <strong>{feedback.name}</strong> — HADIR dicatat</span>}
                  {feedback.type === 'duplicate' && <span>⚠️ <strong>{feedback.name}</strong> — Sudah presensi di sesi ini</span>}
                  {feedback.type === 'not_found' && <span>❌ QR tidak ditemukan: <strong>{feedback.name}</strong></span>}
                </div>
              </div>
            )}

            {/* Scanner Box */}
            {activeSession && (
              <div className="glass-panel rounded-3xl p-4 border border-[#C5A059]/40 bg-[#FFFDF9] space-y-3">
                <div className="relative w-full aspect-square max-w-xs mx-auto rounded-2xl overflow-hidden bg-[#2B180B] border-2 border-[#C5A059]/50">
                  <div id="presensi-qr-reader" className="w-full h-full" />

                  {!scanning && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-5 text-center bg-[#2B180B]/95 space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-[#3B2211] border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] shadow-lg">
                        <Camera className="w-7 h-7" />
                      </div>
                      <p className="text-xs text-[#EAD6B0]">
                        {activeSession ? 'Tekan tombol untuk memulai scan presensi.' : 'Pilih sesi ibadah terlebih dahulu.'}
                      </p>
                      {activeSession && (
                        <button
                          onClick={startScanner}
                          className="px-5 py-2.5 rounded-2xl bg-gold-metallic text-[#2B180B] font-bold text-sm shadow-lg flex items-center gap-2"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Aktifkan Kamera Scanner</span>
                        </button>
                      )}
                    </div>
                  )}

                  {scanning && (
                    <div className="absolute inset-x-8 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent animate-scan shadow-lg shadow-[#D4AF37] pointer-events-none" />
                  )}
                </div>

                {cameraError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{cameraError}</span>
                  </div>
                )}

                {scanning && (
                  <div className="flex justify-center">
                    <button
                      onClick={stopScanner}
                      className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-800 border border-rose-600/30 text-xs font-bold"
                    >
                      Matikan Kamera
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* PRESENSI LIST + EXPORT */}
            {activeSession && (
              <div className="glass-panel rounded-3xl p-4 border border-[#C5A059]/40 bg-[#FFFDF9] space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="font-bold text-sm text-[#2B180B]">Log Kehadiran Real-time</h2>
                  {presensiList.length > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={exportCSV}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/10 border border-emerald-600/30 text-emerald-800 text-xs font-bold hover:bg-emerald-600/20 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Ekspor CSV</span>
                      </button>
                      <button
                        onClick={exportJPG}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C5A059]/15 border border-[#C5A059]/40 text-[#3B2211] text-xs font-bold hover:bg-[#C5A059]/25 transition-colors"
                      >
                        <FileImage className="w-3.5 h-3.5" />
                        <span>Ekspor JPG</span>
                      </button>
                    </div>
                  )}
                </div>

                {presensiList.length === 0 ? (
                  <p className="text-xs text-[#6B533E] text-center py-6">Belum ada jemaat yang discan di sesi ini.</p>
                ) : (
                  <div className="space-y-1.5 max-h-72 overflow-y-auto">
                    {presensiList.map((record, i) => (
                      <div key={record.id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#FAF6F0] border border-[#C5A059]/20 text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-[#C5A059] font-bold w-5 text-right shrink-0">{presensiList.length - i}</span>
                          <div>
                            <p className="font-bold text-[#2B180B] leading-tight">{record.full_name}</p>
                            <p className="text-[10px] text-[#6B533E] font-mono">{record.id_jemaat}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-[#8C6D4F] shrink-0">
                          {new Date(record.scan_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden Recap Card for JPG Export */}
      {activeSession && (
        <div className="fixed -left-[9999px] -top-[9999px]" aria-hidden>
          <div
            ref={recapCardRef}
            className="w-[480px] p-8 rounded-3xl border-2 border-[#C5A059]/60 bg-[#FFFDF9] font-sans"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <div className="text-center mb-6">
              <p className="text-[10px] tracking-widest text-[#C5A059] font-black uppercase mb-1">GBT Bethlehem Surabaya</p>
              <h2 className="text-2xl font-black text-[#2B180B]">{activeSession.name}</h2>
              <p className="text-xs text-[#6B533E] mt-1">
                {new Date(activeSession.event_date + 'T00:00:00').toLocaleDateString('id-ID', { dateStyle: 'full' })}
              </p>
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
                  <span className="text-[#8C6D4F] font-mono text-[10px]">
                    {new Date(r.scan_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {presensiList.length > 15 && (
                <p className="text-[10px] text-[#6B533E] text-center pt-2">...dan {presensiList.length - 15} jemaat lainnya. Download CSV untuk data lengkap.</p>
              )}
            </div>
            <p className="text-[9px] text-[#C5A059] text-center mt-5 tracking-widest uppercase font-bold">
              qr-gbt.vercel.app · Sistem Presensi Digital GBT
            </p>
          </div>
        </div>
      )}

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B180B]/70 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#FFFDF9] rounded-3xl p-6 border border-[#C5A059]/40 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#EFE5DB] text-[#6B533E] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-black text-[#2B180B] text-lg">Buat Sesi Ibadah Baru</h3>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#2B180B]">Nama Sesi Ibadah <span className="text-rose-600">*</span></label>
                <input
                  type="text"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="Contoh: Ibadah Minggu Raya 1"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#C5A059]/40 text-[#2B180B] text-sm focus:outline-none focus:border-[#3B2211]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#2B180B]">Tanggal Ibadah <span className="text-rose-600">*</span></label>
                <input
                  type="date"
                  value={newSessionDate}
                  onChange={(e) => setNewSessionDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#C5A059]/40 text-[#2B180B] text-sm focus:outline-none focus:border-[#3B2211]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#2B180B]">Keterangan (opsional)</label>
                <input
                  type="text"
                  value={newSessionDesc}
                  onChange={(e) => setNewSessionDesc(e.target.value)}
                  placeholder="Contoh: Pkl 07.00 WIB"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#C5A059]/40 text-[#2B180B] text-sm focus:outline-none focus:border-[#3B2211]"
                />
              </div>
            </div>

            <button
              onClick={handleCreateSession}
              disabled={!newSessionName.trim() || isCreating}
              className="w-full py-3 rounded-2xl bg-espresso-metallic text-[#F3E5C8] font-bold text-sm border border-[#C5A059]/40 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isCreating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 text-[#D4AF37]" />}
              <span>{isCreating ? 'Membuat Sesi...' : 'Buat Sesi Ibadah'}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
