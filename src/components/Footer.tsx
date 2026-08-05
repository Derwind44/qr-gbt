import { ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/60 py-6 mt-16">
      <div className="max-w-6xl mx-auto px-4 text-center sm:flex sm:items-center sm:justify-between">
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Terintegrasi Google Forms, Google Sheets, Supabase & Next.js Vercel</span>
        </div>
        <p className="text-xs text-slate-500 mt-2 sm:mt-0 flex items-center justify-center gap-1">
          Dibuat dengan <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" /> untuk GBT
        </p>
      </div>
    </footer>
  );
}
