'use client';

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import type { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, Loader2, AlertCircle } from 'lucide-react';

const GRANTED_KEY = 'qr_camera_granted';
const SAME_CODE_COOLDOWN_MS = 2500;

interface QrScannerProps {
  onScan: (code: string) => void | Promise<void>;
  /** Freeze the camera (e.g. while a result sheet is open). */
  paused?: boolean;
  /** Prevent starting the camera, showing this message instead. */
  disabledMessage?: ReactNode;
  /** Content drawn on top of the camera view (scan feedback). */
  overlay?: ReactNode;
  /** Start automatically if the camera permission was granted before. */
  autoStart?: boolean;
}

type ScannerState = 'idle' | 'starting' | 'scanning' | 'error';

function cameraErrorMessage(err: unknown): string {
  const text = String((err as Error)?.name || err);
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    return 'Kamera hanya bisa dipakai lewat alamat https://';
  }
  if (/NotAllowed|Permission/i.test(text)) {
    return 'Izin kamera ditolak. Ketuk ikon gembok di alamat browser → izinkan Kamera, lalu coba lagi.';
  }
  if (/NotFound|Overconstrained/i.test(text)) return 'Kamera tidak ditemukan di perangkat ini.';
  if (/NotReadable|TrackStart/i.test(text)) return 'Kamera sedang dipakai aplikasi lain. Tutup aplikasi itu lalu coba lagi.';
  return 'Kamera tidak bisa dibuka. Coba lagi atau muat ulang halaman.';
}

export default function QrScanner({ onScan, paused, disabledMessage, overlay, autoStart = true }: QrScannerProps) {
  const elementId = `qr-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const mountedRef = useRef(true);
  const busyRef = useRef(false);
  const lastRef = useRef({ code: '', at: 0 });
  const onScanRef = useRef(onScan);
  const [state, setState] = useState<ScannerState>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    onScanRef.current = onScan;
  });

  const handleDecode = useCallback((text: string) => {
    const now = Date.now();
    const last = lastRef.current;
    // Ignore the same card while it stays in front of the camera
    if (text === last.code && now - last.at < SAME_CODE_COOLDOWN_MS) {
      last.at = now;
      return;
    }
    if (busyRef.current) return;
    lastRef.current = { code: text, at: now };
    busyRef.current = true;
    Promise.resolve(onScanRef.current(text)).finally(() => {
      busyRef.current = false;
    });
  }, []);

  const stop = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (scanner) {
      try {
        if (scanner.isScanning) await scanner.stop();
        scanner.clear();
      } catch {
        // ignore
      }
    }
    if (mountedRef.current) setState('idle');
  }, []);

  const start = useCallback(async () => {
    if (scannerRef.current) return;
    setError('');
    setState('starting');
    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
      if (!mountedRef.current) return;

      const scanner = new Html5Qrcode(elementId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        useBarCodeDetectorIfSupported: true,
        verbose: false,
      });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          aspectRatio: 1,
          qrbox: (w: number, h: number) => {
            const size = Math.max(160, Math.floor(Math.min(w, h) * 0.7));
            return { width: size, height: size };
          },
        },
        handleDecode,
        () => {}
      );

      if (!mountedRef.current || scannerRef.current !== scanner) {
        await scanner.stop().catch(() => {});
        return;
      }
      try {
        localStorage.setItem(GRANTED_KEY, '1');
      } catch {
        // ignore
      }
      setState('scanning');
    } catch (err) {
      console.error('Camera error:', err);
      scannerRef.current = null;
      if (mountedRef.current) {
        setError(cameraErrorMessage(err));
        setState('error');
      }
    }
  }, [elementId, handleDecode]);

  // Auto start (only when permission was granted earlier) & cleanup
  useEffect(() => {
    mountedRef.current = true;
    let granted = false;
    try {
      granted = localStorage.getItem(GRANTED_KEY) === '1';
    } catch {
      // ignore
    }
    const timer = autoStart && granted && !disabledMessage ? setTimeout(start, 0) : undefined;

    return () => {
      clearTimeout(timer);
      mountedRef.current = false;
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner?.isScanning) scanner.stop().then(() => scanner.clear()).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (disabledMessage && scannerRef.current) stop();
  }, [disabledMessage, stop]);

  useEffect(() => {
    const scanner = scannerRef.current;
    if (!scanner || state !== 'scanning') return;
    try {
      if (paused) scanner.pause(true);
      else scanner.resume();
    } catch {
      // already in the requested state
    }
  }, [paused, state]);

  const scanning = state === 'scanning';

  return (
    <div className="space-y-3">
      <div className="relative w-full max-w-sm mx-auto aspect-square rounded-3xl overflow-hidden bg-[#2B180B] border-2 border-[#C5A059]/50 shadow-lg">
        <div id={elementId} className="absolute inset-0" />

        {scanning && !paused && (
          <>
            <div className="absolute inset-x-[15%] top-[15%] h-[70%] pointer-events-none" aria-hidden>
              <div className="h-full animate-scan">
                <div className="h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent shadow-[0_0_8px_#D4AF37]" />
              </div>
            </div>
            <p className="absolute top-3 inset-x-0 text-center text-sm font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] pointer-events-none">
              Arahkan ke kode QR di kartu
            </p>
          </>
        )}

        {!scanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center bg-[#2B180B]">
            {disabledMessage ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-[#3B2211] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                  <CameraOff className="w-8 h-8" />
                </div>
                <div className="text-[15px] text-[#F3E5C8] max-w-xs">{disabledMessage}</div>
              </>
            ) : state === 'starting' ? (
              <>
                <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin" />
                <p className="text-[15px] font-semibold text-[#F3E5C8]">Membuka kamera…</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-[#3B2211] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                  {state === 'error' ? <AlertCircle className="w-8 h-8" /> : <Camera className="w-8 h-8" />}
                </div>
                <p className="text-[15px] text-[#F3E5C8] max-w-xs">
                  {state === 'error' ? error : 'Ketuk tombol di bawah, lalu izinkan akses kamera bila diminta.'}
                </p>
                <button type="button" onClick={start} className="btn btn-gold btn-lg px-7">
                  <Camera className="w-5 h-5" />
                  {state === 'error' ? 'Coba Lagi' : 'Nyalakan Kamera'}
                </button>
              </>
            )}
          </div>
        )}

        {overlay}
      </div>

      {scanning && (
        <div className="flex justify-center">
          <button type="button" onClick={stop} className="btn btn-ghost btn-sm">
            <CameraOff className="w-4 h-4" />
            Matikan Kamera
          </button>
        </div>
      )}
    </div>
  );
}
