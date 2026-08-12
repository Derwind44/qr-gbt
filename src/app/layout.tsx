import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'GBT Bethlehem Surabaya - System QR Badge & Data Jemaat',
  description:
    'Aplikasi Pemindai QR Code Jemaat & Direktori Data GBT Bethlehem Surabaya',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased min-h-screen flex flex-col bg-[#FAF6F0] text-[#2B180B] selection:bg-[#3B2211] selection:text-[#F3E5C8]">
        <Navbar />
        <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-4">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
