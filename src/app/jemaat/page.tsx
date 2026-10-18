'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getAllJemaat } from '@/lib/supabase';
import { Jemaat } from '@/lib/types';
import { useAdminGuard } from '@/lib/auth';
import { takeFlash } from '@/lib/flash';
import { CATEGORY_FILTERS, roleLabel } from '@/lib/options';
import { Search, Users, ChevronRight, UserPlus, X, SearchX } from 'lucide-react';
import { Avatar, EmptyState, PageHeader, StatusBadge, Toast, useToast } from '@/components/ui';

const PAGE_SIZE = 40;

function matchesCategory(item: Jemaat, category: string) {
  return category === 'Semua' || item.category === category || item.church_role === category;
}

export default function JemaatListPage() {
  const isAdmin = useAdminGuard();
  const [jemaatList, setJemaatList] = useState<Jemaat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const deferredQuery = useDeferredValue(searchQuery);
  const { toast, show } = useToast();

  useEffect(() => {
    const flash = takeFlash();
    if (flash) show(flash);

    getAllJemaat()
      .then(setJemaatList)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [show]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of CATEGORY_FILTERS) counts[cat] = jemaatList.filter((j) => matchesCategory(j, cat)).length;
    return counts;
  }, [jemaatList]);

  const filteredList = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return jemaatList.filter((item) => {
      if (!matchesCategory(item, selectedCategory)) return false;
      if (!q) return true;
      return (
        item.full_name.toLowerCase().includes(q) ||
        (item.id_jemaat || '').toLowerCase().includes(q) ||
        (item.phone || '').includes(q) ||
        (item.city || item.address || '').toLowerCase().includes(q)
      );
    });
  }, [jemaatList, deferredQuery, selectedCategory]);

  if (!isAdmin) return null;

  const changeSearch = (value: string) => {
    setSearchQuery(value);
    setVisibleCount(PAGE_SIZE);
  };

  const changeCategory = (value: string) => {
    setSelectedCategory(value);
    setVisibleCount(PAGE_SIZE);
  };

  const resetFilters = () => {
    changeSearch('');
    changeCategory('Semua');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <PageHeader
        title="Daftar Jemaat"
        subtitle={loading ? 'Memuat data…' : `${jemaatList.length} jemaat terdaftar`}
        action={
          <Link href="/jemaat/tambah" className="btn btn-primary hidden sm:inline-flex">
            <UserPlus className="w-5 h-5 text-[#D4AF37]" />
            Tambah Jemaat
          </Link>
        }
      />

      {/* Pencarian & filter (menempel di atas saat di-scroll) */}
      <div className="sticky top-14 md:top-16 z-30 -mx-4 px-4 sm:mx-0 sm:px-0 py-2 bg-[#FAF6F0] space-y-2.5">
        <div className="relative">
          <Search className="w-5 h-5 text-[#8C6D4F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            inputMode="search"
            enterKeyHint="search"
            aria-label="Cari jemaat"
            placeholder="Cari nama, no. HP, atau ID…"
            value={searchQuery}
            onChange={(e) => changeSearch(e.target.value)}
            className="input pl-11 pr-12 [&::-webkit-search-cancel-button]:hidden"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => changeSearch('')}
              aria-label="Hapus pencarian"
              className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl flex items-center justify-center text-[#6B533E] hover:bg-[#EFE5DB]"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0" role="group" aria-label="Filter kategori">
          {CATEGORY_FILTERS.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => changeCategory(cat)}
                aria-pressed={active}
                className={`shrink-0 inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-sm font-bold border transition-colors ${
                  active
                    ? 'bg-[#3B2211] text-[#F3E5C8] border-[#3B2211]'
                    : 'bg-[#FFFDF9] text-[#6B533E] border-[#C5A059]/35 hover:text-[#2B180B]'
                }`}
              >
                {cat}
                {!loading && (
                  <span className={`text-xs font-semibold ${active ? 'text-[#D4AF37]' : 'text-[#8C6D4F]'}`}>{categoryCounts[cat]}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="card divide-y divide-[#C5A059]/20 overflow-hidden" aria-busy>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3.5">
              <div className="skeleton w-12 h-12" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-2/3" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : jemaatList.length === 0 ? (
        <EmptyState
          icon={<Users className="w-7 h-7" />}
          title="Belum ada data jemaat"
          text="Mulai dengan mendaftarkan jemaat pertama."
          action={
            <Link href="/jemaat/tambah" className="btn btn-primary">
              <UserPlus className="w-5 h-5 text-[#D4AF37]" /> Tambah Jemaat
            </Link>
          }
        />
      ) : filteredList.length === 0 ? (
        <EmptyState
          icon={<SearchX className="w-7 h-7" />}
          title="Tidak ditemukan"
          text={searchQuery ? `Tidak ada jemaat yang cocok dengan "${searchQuery}".` : 'Tidak ada jemaat di kategori ini.'}
          action={
            <button type="button" onClick={resetFilters} className="btn btn-secondary">
              Tampilkan semua jemaat
            </button>
          }
        />
      ) : (
        <>
          {(searchQuery || selectedCategory !== 'Semua') && (
            <p className="text-sm text-[#6B533E] px-1" aria-live="polite">
              Ditemukan <strong className="text-[#2B180B]">{filteredList.length}</strong> jemaat
            </p>
          )}
          <ul className="card divide-y divide-[#C5A059]/20 overflow-hidden">
            {filteredList.slice(0, visibleCount).map((item) => (
              <li key={item.id}>
                <Link
                  href={`/jemaat/${item.id}`}
                  className="flex items-center gap-3 p-3.5 min-h-[72px] hover:bg-[#FAF6F0] active:bg-[#F3E5C8]/40"
                >
                  <Avatar name={item.full_name} src={item.profile_photo_url} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[15px] text-[#2B180B] truncate">{item.full_name}</p>
                    <p className="text-sm text-[#6B533E] truncate">
                      {roleLabel(item)}
                      <span className="text-[#C5A059]"> · </span>
                      <span className="font-mono text-[13px]">{item.id_jemaat || item.id}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {item.status && item.status !== 'Aktif' && <StatusBadge status={item.status} />}
                    <ChevronRight className="w-5 h-5 text-[#C5A059]" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {filteredList.length > visibleCount && (
            <button type="button" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)} className="btn btn-secondary w-full">
              Tampilkan lebih banyak ({filteredList.length - visibleCount} lagi)
            </button>
          )}
        </>
      )}

      {/* Tombol tambah melayang (HP) */}
      <Link
        href="/jemaat/tambah"
        className="sm:hidden fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30 btn btn-primary rounded-full shadow-xl shadow-[#3B2211]/30 px-5"
      >
        <UserPlus className="w-5 h-5 text-[#D4AF37]" />
        Tambah
      </Link>

      <Toast toast={toast} />
    </div>
  );
}
