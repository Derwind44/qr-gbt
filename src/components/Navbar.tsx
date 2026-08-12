'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { QrCode, Users, Home, UserPlus, ShieldCheck, LogOut, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem('admin_authenticated');
      setIsAdmin(auth === 'true');
    }
  }, [pathname]);

  // Hide header and bottom navigation completely on public standalone scanner page
  if (pathname === '/qr-scan') {
    return null;
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('admin_authenticated');
      sessionStorage.removeItem('admin_login_time');
    }
    setIsAdmin(false);
    router.push('/login');
  };

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/scan', label: 'Scan QR', icon: QrCode },
    { href: '/jemaat', label: 'Daftar Jemaat', icon: Users },
  ];

  return (
    <>
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-[#C5A059]/30 bg-[#FFFDF9]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Logo - GBT Bethlehem Surabaya */}
          <Link href={isAdmin ? '/admin' : '/login'} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-full bg-espresso-metallic border border-[#C5A059] flex items-center justify-center shadow-md shadow-[#3B2211]/20 group-hover:scale-105 transition-transform overflow-hidden shrink-0">
              <img
                src="/logo.png"
                alt="GBT Bethlehem Surabaya Logo"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="font-black text-base sm:text-lg text-[#2B180B] tracking-tight">
                  bethlehem <span className="text-[#C5A059] font-black text-lg">.</span>
                </span>
              </div>
              <p className="text-[8px] sm:text-[9px] tracking-[0.2em] text-[#6B533E] uppercase font-bold -mt-1">
                surabaya church
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="flex items-center gap-2">
            <nav className="hidden md:flex items-center gap-1 sm:gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                      isActive
                        ? 'bg-espresso-metallic text-[#F3E5C8] shadow-md shadow-[#3B2211]/20 border border-[#C5A059]/40'
                        : 'text-[#523A27] hover:text-[#2B180B] hover:bg-[#F3E5C8]/40'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#D4AF37]' : 'text-[#8C6D4F]'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Public Scan Shortcut Button */}
            <Link
              href="/qr-scan"
              className="px-3 py-1.5 rounded-xl bg-gold-metallic text-[#2B180B] text-xs font-bold shadow-xs hover:scale-105 transition-transform flex items-center gap-1"
            >
              <QrCode className="w-3.5 h-3.5 text-[#2B180B]" />
              <span className="hidden sm:inline">Public Scan</span>
            </Link>

            {/* Admin status indicator / Logout */}
            {isAdmin ? (
              <button
                onClick={handleLogout}
                title="Keluar Admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 border border-rose-600/30 text-rose-800 hover:bg-rose-500/20 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F5EFEB] border border-[#C5A059]/30 text-[#3B2211] hover:bg-[#EFE5DB] transition-all"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Very crucial for Mobile-First experience!) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFDF9]/95 backdrop-blur-lg border-t border-[#C5A059]/30 shadow-2xl px-2 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-[#3B2211] font-black scale-105'
                  : 'text-[#8C6D4F] hover:text-[#2B180B]'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-[#3B2211] text-[#F3E5C8]' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
