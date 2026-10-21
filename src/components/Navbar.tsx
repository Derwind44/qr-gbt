'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { QrCode, Users, LogOut, LayoutDashboard, ClipboardList, LogIn } from 'lucide-react';
import { logoutAdmin, useIsAdmin } from '@/lib/auth';

const NAV_ITEMS = [
  { href: '/admin', label: 'Beranda', icon: LayoutDashboard, match: (p: string) => p === '/admin' },
  { href: '/admin/presensi', label: 'Presensi', icon: ClipboardList, match: (p: string) => p.startsWith('/admin/presensi') },
  { href: '/scan', label: 'Scan QR', icon: QrCode, match: (p: string) => p === '/scan' },
  { href: '/jemaat', label: 'Jemaat', icon: Users, match: (p: string) => p.startsWith('/jemaat') },
];

// Pages with their own sticky action bar hide the bottom navigation
const isFormPage = (p: string) => p === '/jemaat/tambah' || p.endsWith('/edit');

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = useIsAdmin();

  if (pathname === '/login' || (pathname === '/scan' && !isAdmin)) {
    return null;
  }

  const handleLogout = async () => {
    await logoutAdmin();
    router.push('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#FFFDF9]/95 border-b border-[#C5A059]/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 md:h-16 flex items-center justify-between gap-3">
          <Link href={isAdmin ? '/admin' : '/login'} className="flex items-center gap-2.5 min-w-0">
            <span className="w-9 h-9 rounded-full bg-espresso-metallic border border-[#C5A059] overflow-hidden shrink-0">
              <img src="/logo.png" alt="" width={36} height={36} className="w-full h-full object-cover" />
            </span>
            <span className="leading-none">
              <span className="block font-black text-lg text-[#2B180B] tracking-tight">
                bethlehem<span className="text-[#C5A059]">.</span>
              </span>
              <span className="block text-[9px] tracking-[0.2em] text-[#6B533E] uppercase font-bold mt-0.5">surabaya church</span>
            </span>
          </Link>

          <div className="flex items-center gap-1.5">
            {isAdmin && (
              <nav className="hidden md:flex items-center gap-1 mr-2" aria-label="Menu utama">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = item.match(pathname);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={`flex items-center gap-2 px-3.5 h-10 rounded-xl text-sm font-bold transition-colors ${
                        active ? 'bg-espresso-metallic text-[#F3E5C8]' : 'text-[#523A27] hover:bg-[#F3E5C8]/50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? 'text-[#D4AF37]' : 'text-[#8C6D4F]'}`} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            )}

            {isAdmin ? (
              <button type="button" onClick={handleLogout} className="btn btn-ghost btn-sm px-3 text-[#6B533E]">
                <LogOut className="w-4 h-4" />
                <span>Keluar</span>
              </button>
            ) : (
              <Link href="/login" className="btn btn-secondary btn-sm">
                <LogIn className="w-4 h-4" />
                <span>Masuk</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {isAdmin && !isFormPage(pathname) && (
        <nav
          aria-label="Menu utama"
          className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#FFFDF9] border-t border-[#C5A059]/30 shadow-[0_-4px_16px_rgba(59,34,17,0.06)] pb-[env(safe-area-inset-bottom)]"
        >
          <div className="grid grid-cols-4">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex flex-col items-center justify-center gap-1 h-16 text-xs font-bold transition-colors ${
                    active ? 'text-[#2B180B]' : 'text-[#8C6D4F]'
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-14 h-8 rounded-full transition-colors ${
                      active ? 'bg-[#3B2211] text-[#D4AF37]' : ''
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
}
