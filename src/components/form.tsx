'use client';

import { useId, useState, type ReactNode } from 'react';
import { AlertCircle, Camera, Check, Link2, Loader2, Trash2 } from 'lucide-react';
import { formatGoogleDriveUrl } from '@/lib/gdrive';

export function Field({
  id,
  label,
  required,
  optional,
  hint,
  error,
  className = '',
  children,
}: {
  id?: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
        {required && <span className="text-rose-600"> *</span>}
        {optional && <span className="font-medium text-sm text-[#8C6D4F]"> (boleh dikosongkan)</span>}
      </label>
      {children}
      {error ? (
        <p id={id ? `${id}-error` : undefined} className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </p>
      ) : (
        hint && <p className="hint mt-1.5">{hint}</p>
      )}
    </div>
  );
}

/** Props to wire an input to its Field error message. */
export function errorProps(id: string, error?: string) {
  return error ? { 'aria-invalid': true as const, 'aria-describedby': `${id}-error` } : {};
}

type Option<T extends string> = T | { value: T; label: string };

function normalize<T extends string>(opt: Option<T>) {
  return typeof opt === 'string' ? { value: opt, label: opt as string } : opt;
}

const COLS = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-2 sm:grid-cols-4', 6: 'grid-cols-6' } as const;

export function RadioGroup<T extends string>({
  id,
  name,
  value,
  options,
  onChange,
  cols = 2,
  compact,
}: {
  id?: string;
  name: string;
  value: T | undefined;
  options: readonly Option<T>[];
  onChange: (value: T) => void;
  cols?: keyof typeof COLS;
  compact?: boolean;
}) {
  return (
    <div id={id} role="radiogroup" className={`grid gap-2 ${COLS[cols]}`}>
      {options.map((raw) => {
        const opt = normalize(raw);
        return (
          <label key={opt.value} className="relative">
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="choice-input"
            />
            <span className={`choice-box ${compact ? 'justify-center px-1' : ''}`}>
              {!compact && (
                <span className="choice-check">
                  <Check className="w-3 h-3" strokeWidth={3.5} />
                </span>
              )}
              <span className="leading-tight">{opt.label}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}

export function CheckboxGroup({
  id,
  values,
  options,
  onChange,
  cols = 2,
}: {
  id?: string;
  values: string[];
  options: readonly string[];
  onChange: (values: string[]) => void;
  cols?: 1 | 2;
}) {
  const toggle = (item: string) =>
    onChange(values.includes(item) ? values.filter((v) => v !== item) : [...values, item]);

  return (
    <div id={id} className={`grid gap-2 ${cols === 1 ? 'grid-cols-1' : 'grid-cols-1 min-[380px]:grid-cols-2'}`}>
      {options.map((item) => (
        <label key={item} className="relative">
          <input type="checkbox" checked={values.includes(item)} onChange={() => toggle(item)} className="choice-input" />
          <span className="choice-box">
            <span className="choice-check">
              <Check className="w-3 h-3" strokeWidth={3.5} />
            </span>
            <span className="leading-tight">{item}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

export function PhotoUpload({
  id,
  label,
  hint,
  value,
  onChange,
  variant = 'portrait',
}: {
  id: string;
  label: string;
  hint?: string;
  value?: string;
  onChange: (url: string) => void;
  variant?: 'portrait' | 'document';
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileId = useId();
  const previewCls = variant === 'portrait' ? 'w-28 h-28 rounded-2xl' : 'w-full max-w-xs aspect-[1.6] rounded-2xl';

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const { uploadPhoto } = await import('@/lib/imageUtils');
      onChange(await uploadPhoto(file));
    } catch (err) {
      console.error(err);
      setError('Foto gagal diproses. Coba pilih foto lain.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <span className="label">{label}</span>
      <input id={fileId} type="file" accept="image/*" onChange={handleFile} className="sr-only" disabled={uploading} />

      {value ? (
        <div className="flex items-center gap-4">
          <div className={`relative overflow-hidden border-2 border-[#C5A059]/50 bg-[#EFE5DB] shrink-0 ${previewCls}`}>
            <img src={formatGoogleDriveUrl(value)} alt={`Pratinjau ${label}`} className="w-full h-full object-cover" />
            {uploading && (
              <div className="absolute inset-0 bg-[#2B180B]/60 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-[#F3E5C8] animate-spin" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor={fileId} className="btn btn-secondary btn-sm cursor-pointer">
              <Camera className="w-4 h-4" /> Ganti Foto
            </label>
            <button type="button" onClick={() => onChange('')} className="btn btn-ghost btn-sm text-rose-700">
              <Trash2 className="w-4 h-4" /> Hapus
            </button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={fileId}
          className={`flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-[#C5A059]/60 bg-[#FAF6F0] cursor-pointer hover:bg-[#F3E5C8]/40 ${
            uploading ? 'pointer-events-none opacity-70' : ''
          }`}
        >
          <span className="w-12 h-12 rounded-xl bg-espresso-metallic flex items-center justify-center text-[#D4AF37] shrink-0">
            {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
          </span>
          <span>
            <span className="block font-bold text-[#2B180B]">{uploading ? 'Mengunggah foto…' : 'Ketuk untuk pilih / ambil foto'}</span>
            <span className="block text-sm text-[#6B533E]">{hint || 'Dari galeri atau kamera HP'}</span>
          </span>
        </label>
      )}

      {error && (
        <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </p>
      )}

      <details className="mt-2 group">
        <summary className="inline-flex items-center gap-1.5 min-h-[40px] text-sm font-semibold text-[#6B533E] cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          <Link2 className="w-4 h-4 text-[#9A7B38]" />
          <span className="underline underline-offset-2">Punya link Google Drive? Tempel di sini</span>
        </summary>
        <input
          id={id}
          type="url"
          inputMode="url"
          value={value?.startsWith('data:') ? '' : value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://drive.google.com/…"
          className="input mt-1"
        />
      </details>
    </div>
  );
}
