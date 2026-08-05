import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Data QR Gereja - Pemindai & Kartu Digital Jemaat',
  description:
    'Aplikasi Pemindai QR Code Jemaat & Direktori Data Terintegrasi Google Form, Google Sheets, dan Supabase',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 selection:bg-indigo-500 selection:text-white">
        <Navbar />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
