'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllJemaat } from '@/lib/supabase';
import { Jemaat } from '@/lib/types';
import { Search, Users, Filter, CheckCircle2, ChevronRight, QrCode, Phone, MapPin, Tag } from 'lucide-react';

export default function JemaatListPage() {
  const [jemaatList, setJemaatList] = useState<Jemaat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getAllJemaat();
        setJemaatList(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filtered List
  const filteredList = jemaatList.filter((item) => {
    const matchesSearch =
      item.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.qr_code_data.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.phone && item.phone.includes(searchQuery)) ||
      (item.city && item.city.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'Semua' || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = ['Semua', 'Jemaat Umum', 'Pelayan', 'Pemuda', 'Anak'];

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Direktori Jemaat GBT</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
            Daftar Orang & Kartu QR
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Cari data jemaat atau klik pada salah satu nama untuk melihat detail & mengunduh Kartu QR.
          </p>
        </div>

        <Link
          href="/scan"
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 shrink-0 self-start md:self-auto"
        >
          <QrCode className="w-4 h-4" />
          <span>Pemindai QR Kamera</span>
        </Link>
      </div>

      {/* Controls Bar: Search Input & Category Filter */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari Nama, No HP, atau Kode (gbt-XXXXXXXXXX)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="py-16 text-center text-sm text-slate-400 animate-pulse">
          Memuat daftar jemaat dari Supabase...
        </div>
      ) : filteredList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map((item) => (
            <Link
              key={item.id}
              href={`/jemaat/${item.id}`}
              className="glass-card rounded-2xl p-5 border border-slate-800/80 hover:border-indigo-500/40 flex flex-col justify-between space-y-4 group transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {item.qr_code_data}
                  </span>
                  <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {item.status || 'Aktif'}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-lg text-white group-hover:text-indigo-300 transition-colors">
                    {item.full_name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <Tag className="w-3 h-3 text-indigo-400" />
                    <span>{item.category || 'Jemaat Umum'}</span>
                  </div>
                </div>
              </div>

              {/* Sub Info & View Detail Link */}
              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-3">
                  {item.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-500" />
                      {item.phone}
                    </span>
                  )}
                  {item.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {item.city}
                    </span>
                  )}
                </div>

                <span className="text-indigo-400 font-semibold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                  Detail <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-3xl p-12 text-center space-y-3 border border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Tidak Ada Data Ditemukan</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Tidak ditemukan jemaat dengan kata kunci "{searchQuery}". Coba ubah kata kunci pencarian Anda.
          </p>
        </div>
      )}
    </div>
  );
}
