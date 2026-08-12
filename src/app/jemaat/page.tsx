'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAllJemaat } from '@/lib/supabase';
import { Jemaat } from '@/lib/types';
import { Search, Users, Filter, CheckCircle2, ChevronRight, QrCode, Phone, Tag, UserPlus } from 'lucide-react';

export default function JemaatListPage() {
  const router = useRouter();
  const [jemaatList, setJemaatList] = useState<Jemaat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem('admin_authenticated');
      if (auth !== 'true') {
        router.push('/login');
        return;
      }
    }

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
  }, [router]);

  // Filtered List
  const filteredList = jemaatList.filter((item) => {
    const codeStr = (item.id_jemaat || '').toLowerCase();
    const nameStr = item.full_name.toLowerCase();
    const phoneStr = item.phone || '';
    const cityStr = (item.city || item.address || '').toLowerCase();

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      nameStr.includes(q) ||
      codeStr.includes(q) ||
      phoneStr.includes(q) ||
      cityStr.includes(q);

    const matchesCategory =
      selectedCategory === 'Semua' || item.category === selectedCategory || item.church_role === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = ['Semua', 'Pelayan', 'Pemuda', 'Anak', 'Jemaat Umum'];

  return (
    <div className="space-y-6 py-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#3B2211]/10 border border-[#C5A059]/40 text-[#3B2211] text-xs font-bold mb-2">
            <Users className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Direktori Jemaat GBT Bethlehem Surabaya</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#2B180B]">
            Daftar Jemaat & Kartu QR
          </h1>
          <p className="text-xs sm:text-sm text-[#6B533E]">
            Cari data jemaat atau klik nama untuk melihat rincian & mengunduh Kartu Akses QR.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
          <Link
            href="/jemaat/tambah"
            className="px-5 py-3 rounded-2xl bg-espresso-metallic hover:opacity-95 text-[#F3E5C8] font-bold text-sm shadow-lg shadow-[#3B2211]/20 border border-[#C5A059]/40 transition-all flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4 text-[#D4AF37]" />
            <span>+ Tambah Jemaat</span>
          </Link>

          <Link
            href="/scan"
            className="px-5 py-3 rounded-2xl bg-gold-metallic hover:opacity-95 text-[#2B180B] font-bold text-sm shadow-lg shadow-[#C5A059]/25 transition-all flex items-center justify-center gap-2"
          >
            <QrCode className="w-4 h-4 text-[#2B180B]" />
            <span>Pemindai QR</span>
          </Link>
        </div>
      </div>

      {/* Controls Bar: Search Input & Category Filter */}
      <div className="glass-panel p-4 rounded-2xl border border-[#C5A059]/30 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-[#8C6D4F] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari Nama, HP, atau ID (BU-0001060895)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#C5A059]/40 text-sm text-[#2B180B] placeholder-[#8C6D4F] focus:outline-none focus:border-[#3B2211]"
          />
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          <Filter className="w-3.5 h-3.5 text-[#8C6D4F] shrink-0 hidden sm:block" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#3B2211] text-[#F3E5C8] shadow-sm border border-[#C5A059]/40'
                  : 'bg-[#FAF6F0] text-[#6B533E] hover:text-[#2B180B] border border-[#C5A059]/25'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-[#8C6D4F] animate-pulse">
          Memuat data jemaat...
        </div>
      ) : filteredList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map((item) => {
            const displayId = item.id_jemaat || item.id;
            return (
              <Link
                key={item.id}
                href={`/jemaat/${item.id}`}
                className="glass-card rounded-2xl p-5 border border-[#C5A059]/30 hover:border-[#C5A059] flex flex-col justify-between space-y-4 group transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-[#3B2211]/10 text-[#3B2211] border border-[#3B2211]/20">
                      {displayId}
                    </span>
                    <span className={`text-xs font-bold flex items-center gap-1 ${
                      item.status === 'Nonaktif'
                        ? 'text-amber-700'
                        : item.status === 'Meninggal'
                        ? 'text-rose-900 font-black'
                        : 'text-emerald-700'
                    }`}>
                      <CheckCircle2 className={`w-3 h-3 ${
                        item.status === 'Nonaktif'
                          ? 'text-amber-600'
                          : item.status === 'Meninggal'
                          ? 'text-rose-800'
                          : 'text-emerald-600'
                      }`} />
                      {item.status || 'Aktif'}
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    {item.profile_photo_url ? (
                      <img src={item.profile_photo_url} alt={item.full_name} className="w-12 h-12 rounded-xl object-cover border-2 border-[#C5A059]/40 shrink-0 shadow-sm" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-espresso-metallic border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] font-serif font-bold text-lg shrink-0 shadow-sm">
                        {item.full_name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-base text-[#2B180B] group-hover:text-[#C5A059] transition-colors line-clamp-1">
                        {item.full_name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-[#6B533E] mt-0.5">
                        <Tag className="w-3 h-3 text-[#C5A059]" />
                        <span>{item.church_role || item.category || 'Jemaat Umum'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub Info & View Detail Link */}
                <div className="pt-3 border-t border-[#C5A059]/20 flex items-center justify-between text-xs text-[#6B533E]">
                  <div className="flex items-center gap-3 truncate">
                    {item.phone && (
                      <span className="flex items-center gap-1 truncate">
                        <Phone className="w-3 h-3 text-[#8C6D4F]" />
                        {item.phone}
                      </span>
                    )}
                  </div>

                  <span className="text-[#3B2211] font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform shrink-0">
                    Detail <ChevronRight className="w-4 h-4 text-[#C5A059]" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel rounded-3xl p-12 text-center space-y-3 border border-[#C5A059]/30">
          <div className="w-12 h-12 rounded-2xl bg-[#EFE5DB] flex items-center justify-center text-[#3B2211] mx-auto border border-[#C5A059]/30">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#2B180B]">Tidak Ada Data Ditemukan</h3>
          <p className="text-xs text-[#6B533E] max-w-sm mx-auto">
            Tidak ditemukan jemaat dengan kata kunci "{searchQuery}". Coba ubah kata kunci pencarian Anda.
          </p>
        </div>
      )}
    </div>
  );
}
