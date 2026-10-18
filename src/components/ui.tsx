'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { formatGoogleDriveUrl } from '@/lib/gdrive';

// ---------- Avatar ----------
const AVATAR_SIZES = {
  sm: 'w-10 h-10 text-base rounded-xl',
  md: 'w-12 h-12 text-lg rounded-xl',
  lg: 'w-20 h-20 text-3xl rounded-2xl',
};

export function Avatar({ name, src, size = 'md' }: { name: string; src?: string; size?: keyof typeof AVATAR_SIZES }) {
  const [failed, setFailed] = useState(false);
  const url = formatGoogleDriveUrl(src);
  const cls = `${AVATAR_SIZES[size]} shrink-0`;

  if (url && !failed) {
    return (
      <img
        src={url}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={`${cls} object-cover border border-[#C5A059]/40 bg-[#EFE5DB]`}
      />
    );
  }

  return (
    <div
      aria-hidden
      className={`${cls} bg-espresso-metallic border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] font-serif font-bold`}
    >
      {name.trim().charAt(0).toUpperCase() || '?'}
    </div>
  );
}

// ---------- Status ----------
const STATUS_STYLE: Record<string, { badge: string; dot: string }> = {
  Aktif: { badge: 'bg-emerald-50 text-emerald-800 border-emerald-600/25', dot: 'bg-emerald-600' },
  Nonaktif: { badge: 'bg-amber-50 text-amber-800 border-amber-600/30', dot: 'bg-amber-600' },
  Meninggal: { badge: 'bg-rose-900/10 text-rose-900 border-rose-900/30', dot: 'bg-rose-900' },
};

export function StatusBadge({ status }: { status?: string }) {
  const label = status || 'Aktif';
  const style = STATUS_STYLE[label] ?? STATUS_STYLE.Aktif;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-bold ${style.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {label}
    </span>
  );
}

// ---------- Layout bits ----------
export function BackLink({ href, label, onClick }: { href?: string; label: string; onClick?: () => void }) {
  const cls = 'inline-flex items-center gap-1.5 -ml-2 px-2 min-h-[44px] rounded-xl text-sm font-bold text-[#6B533E] hover:text-[#2B180B] hover:bg-[#EFE5DB]/60';
  const content = (
    <>
      <ArrowLeft className="w-5 h-5 text-[#9A7B38]" />
      <span>{label}</span>
    </>
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {content}
    </button>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-black text-[#2B180B] tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm sm:text-base text-[#6B533E] mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="py-16 flex flex-col items-center gap-3 text-[#6B533E]" role="status">
      <Loader2 className="w-8 h-8 animate-spin text-[#C5A059]" />
      {label && <p className="text-sm font-semibold">{label}</p>}
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="card p-8 text-center flex flex-col items-center gap-3">
      <div className="w-14 h-14 rounded-2xl bg-[#EFE5DB] flex items-center justify-center text-[#3B2211]">{icon}</div>
      <h3 className="text-lg font-bold text-[#2B180B]">{title}</h3>
      {text && <p className="text-sm text-[#6B533E] max-w-sm">{text}</p>}
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}

export function Alert({ type = 'error', children }: { type?: 'error' | 'success' | 'warning'; children: ReactNode }) {
  const style =
    type === 'success'
      ? 'bg-emerald-50 border-emerald-600/30 text-emerald-900'
      : type === 'warning'
      ? 'bg-amber-50 border-amber-600/30 text-amber-900'
      : 'bg-rose-50 border-rose-600/30 text-rose-900';
  const Icon = type === 'success' ? CheckCircle2 : AlertCircle;
  return (
    <div role={type === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2.5 p-3.5 rounded-2xl border text-sm font-semibold ${style}`}>
      <Icon className="w-5 h-5 shrink-0 mt-px" />
      <div>{children}</div>
    </div>
  );
}

// ---------- Bottom sheet / dialog ----------
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-[#2B180B]/70 animate-fadeIn" onClick={onClose} />
      <div className="relative w-full sm:max-w-md max-h-[92dvh] overflow-y-auto bg-[#FFFDF9] rounded-t-3xl sm:rounded-3xl border border-[#C5A059]/40 shadow-2xl animate-sheet pb-[env(safe-area-inset-bottom)]">
        <div className="sm:hidden mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-[#C5A059]/40" aria-hidden />
        <div className="flex items-center justify-between gap-3 px-5 pt-3 sm:pt-5">
          {title ? <h2 className="text-lg font-black text-[#2B180B]">{title}</h2> : <span />}
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="w-11 h-11 -mr-2 rounded-full flex items-center justify-center text-[#6B533E] hover:bg-[#EFE5DB]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-5 pb-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Ya, Hapus',
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Sheet open={open} onClose={onCancel} title={title}>
      <div className="space-y-5">
        <p className="text-[15px] text-[#3B2211] leading-relaxed">{message}</p>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Batal
          </button>
          <button type="button" onClick={onConfirm} disabled={loading} className="btn btn-danger-solid">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </Sheet>
  );
}

// ---------- Toast ----------
type ToastData = { id: number; text: string; type: 'success' | 'error' };

export function useToast() {
  const [toast, setToast] = useState<ToastData | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((text: string, type: ToastData['type'] = 'success') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ id: Date.now(), text, type });
    timer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { toast, show };
}

export function Toast({ toast }: { toast: ToastData | null }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-6 z-[60] flex justify-center px-4 pointer-events-none"
    >
      {toast && (
        <div
          key={toast.id}
          className={`animate-fadeIn flex items-center gap-2.5 max-w-md px-4 py-3 rounded-2xl shadow-xl text-sm font-bold ${
            toast.type === 'success' ? 'bg-[#2B180B] text-[#F3E5C8]' : 'bg-rose-700 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}
    </div>
  );
}
