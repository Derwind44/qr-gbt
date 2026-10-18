import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'GBT Bethlehem Surabaya - System QR Badge & Data Jemaat',
  description:
    'Aplikasi Pemindai QR Code Jemaat & Direktori Data GBT Bethlehem Surabaya',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#FFFDF9',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased min-h-dvh flex flex-col bg-[#FAF6F0] text-[#2B180B] selection:bg-[#3B2211] selection:text-[#F3E5C8]">
        <Navbar />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-10">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
