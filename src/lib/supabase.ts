import { createClient } from '@supabase/supabase-js';
import { Jemaat } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if credentials are placeholders or valid
const isSupabaseConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  !supabaseUrl.includes('example-project') &&
  !supabaseUrl.includes('YOUR_SUPABASE');

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Initial fallback mock data for testing before Supabase is connected
export const DUMMY_JEMAAT_DATA: Jemaat[] = [
  {
    id: '1a829f01-3b4c-4567-8910-111213141516',
    qr_code_data: 'gbt-8492019482',
    full_name: 'Budi Santoso',
    phone: '081234567890',
    email: 'budi.santoso@gmail.com',
    category: 'Jemaat Umum',
    address: 'Jl. Merdeka No. 12, RT 02/05',
    city: 'Jakarta Pusat',
    status: 'Aktif',
    created_at: new Date().toISOString(),
  },
  {
    id: '2b930g02-4c5d-5678-9011-222324252627',
    qr_code_data: 'gbt-3920184729',
    full_name: 'Siti Rahmawati',
    phone: '085678901234',
    email: 'siti.rahma@gmail.com',
    category: 'Pelayan',
    address: 'Jl. Melati No. 45',
    city: 'Surabaya',
    status: 'Aktif',
    created_at: new Date().toISOString(),
  },
  {
    id: '3c041h03-5d6e-6789-0122-333435363738',
    qr_code_data: 'gbt-9182736450',
    full_name: 'Daniel Wijaya',
    phone: '087812345678',
    email: 'daniel.w@gmail.com',
    category: 'Pemuda',
    address: 'Jl. Mawar No. 8',
    city: 'Bandung',
    status: 'Aktif',
    created_at: new Date().toISOString(),
  },
  {
    id: '4d152i04-6e7f-7890-1233-444546474849',
    qr_code_data: 'gbt-5463728190',
    full_name: 'Grace Nathania',
    phone: '082198765432',
    email: 'grace.n@gmail.com',
    category: 'Jemaat Umum',
    address: 'Jl. Diponegoro No. 88',
    city: 'Semarang',
    status: 'Aktif',
    created_at: new Date().toISOString(),
  },
  {
    id: '5e263j05-7f8g-8901-2344-555657585960',
    qr_code_data: 'gbt-1029384756',
    full_name: 'Michael Christian',
    phone: '081399887766',
    email: 'michael.c@gmail.com',
    category: 'Anak',
    address: 'Jl. Pemuda No. 101',
    city: 'Yogyakarta',
    status: 'Aktif',
    created_at: new Date().toISOString(),
  },
];

/**
 * Fetch all Jemaat (from Supabase or local mock fallback)
 */
export async function getAllJemaat(): Promise<Jemaat[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('jemaat')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as Jemaat[];
      }
    } catch (e) {
      console.warn('Fallback to local data due to Supabase error:', e);
    }
  }

  // Fallback to local storage or dummy data if browser environment
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('qr_jemaat_data');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (err) {
        // use default
      }
    }
  }
  return DUMMY_JEMAAT_DATA;
}

/**
 * Get Jemaat by QR Code format (gbt-XXXXXXXXXX) or ID
 */
export async function getJemaatByCodeOrId(codeOrId: string): Promise<Jemaat | null> {
  const cleanCode = codeOrId.trim();

  if (supabase) {
    try {
      // First check by qr_code_data
      const { data: byQr, error: errQr } = await supabase
        .from('jemaat')
        .select('*')
        .eq('qr_code_data', cleanCode)
        .single();

      if (!errQr && byQr) {
        return byQr as Jemaat;
      }

      // Second check by UUID id
      const { data: byId, error: errId } = await supabase
        .from('jemaat')
        .select('*')
        .eq('id', cleanCode)
        .single();

      if (!errId && byId) {
        return byId as Jemaat;
      }
    } catch (e) {
      console.warn('Supabase fetch failed, trying local fallback:', e);
    }
  }

  // Fallback lookup from list
  const list = await getAllJemaat();
  const match = list.find(
    (item) =>
      item.qr_code_data.toLowerCase() === cleanCode.toLowerCase() ||
      item.id === cleanCode
  );

  return match || null;
}
