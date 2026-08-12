import { createClient } from '@supabase/supabase-js';
import { Jemaat } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if credentials are valid
const isSupabaseConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  !supabaseUrl.includes('example-project') &&
  !supabaseUrl.includes('YOUR_SUPABASE');

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Admin Authentication Verification
 * Username: adminGBT
 * Password: admin# + DD + MM + YY (2-digit year)
 * Example on 07 Aug 2026 -> admin#070826
 */
export function verifyAdminPassword(password: string): boolean {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  const expectedPassword = `admin#${dd}${mm}${yy}`;

  return password.trim() === expectedPassword;
}

/**
 * Generate Human-Readable ID Jemaat
 * Format: 2 Initials of First Name - 4 Digit Seq - 6 Digit DDMMYY
 * Example: Budi Santoso born 06/08/1995 -> BU-0001060895
 */
export function generateIdJemaat(fullName: string, birthDate: string, seqNumber: number): string {
  const cleanName = fullName.trim().replace(/[^a-zA-Z]/g, '');
  const initials = (cleanName.length >= 2 ? cleanName.substring(0, 2) : (cleanName + 'X').substring(0, 2)).toUpperCase();

  const seqFormatted = String(seqNumber).padStart(4, '0');

  // Format birthDate YYYY-MM-DD to DDMMYY
  let ddmmyy = '010100';
  if (birthDate) {
    const parts = birthDate.split('-');
    if (parts.length === 3) {
      const year = parts[0].slice(-2);
      const month = parts[1].padStart(2, '0');
      const day = parts[2].padStart(2, '0');
      ddmmyy = `${day}${month}${year}`;
    }
  }

  return `${initials}-${seqFormatted}${ddmmyy}`;
}

/**
 * Generate Random Secure QR Token for physical QR card
 */
export function generateQrToken(): string {
  const randomStr = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
  return `tok-${randomStr}`;
}

// Initial fallback mock data
export const DUMMY_JEMAAT_DATA: Jemaat[] = [
  {
    id: '1a829f01-3b4c-4567-8910-111213141516',
    id_jemaat: 'BU-0001060895',
    qr_token: 'tok-budi-santoso-8492019482',
    full_name: 'Budi Santoso',
    gender: 'Laki-laki',
    birth_place: 'Jakarta',
    birth_date: '1995-08-06',
    address: 'Jl. Merdeka No. 12, RT 02/05, Jakarta Pusat',
    phone: '081234567890',
    email: 'budi.santoso@gmail.com',
    join_year: '2020',
    marital_status: 'Menikah',
    spouse_name: 'Siti Rahmawati',
    children_count: '1',
    children_detail: 'Anak 1: Rian Santoso (12/04/2021)',
    father_name: 'Santoso Wijaya',
    mother_name: 'Maria Hartati',
    church_role: 'Pelayanan/Aktivis gereja',
    potentials: ['IT / Multimedia', 'Sound system'],
    is_joined_division: 'Ya',
    joined_divisions: ['Divisi Muda YOBEL'],
    category: 'Pelayan',
    status: 'Aktif',
    created_at: new Date().toISOString(),
  },
  {
    id: '2b930g02-4c5d-5678-9011-222324252627',
    id_jemaat: 'SI-0002150596',
    qr_token: 'tok-siti-rahmawati-3920184729',
    full_name: 'Siti Rahmawati',
    gender: 'Perempuan',
    birth_place: 'Surabaya',
    birth_date: '1996-05-15',
    address: 'Jl. Melati No. 45, Surabaya',
    phone: '085678901234',
    email: 'siti.rahma@gmail.com',
    join_year: '2021',
    marital_status: 'Menikah',
    spouse_name: 'Budi Santoso',
    children_count: '1',
    children_detail: 'Anak 1: Rian Santoso (12/04/2021)',
    father_name: 'Ahmad Rahmad',
    mother_name: 'Sulastri',
    church_role: 'Pelayanan/Aktivis gereja',
    potentials: ['Vocal', 'Musik'],
    is_joined_division: 'Ya',
    joined_divisions: ['Divisi Wanita HANA'],
    category: 'Pelayan',
    status: 'Aktif',
    created_at: new Date().toISOString(),
  },
  {
    id: '3c041h03-5d6e-6789-0122-333435363738',
    id_jemaat: 'DA-0003201198',
    qr_token: 'tok-daniel-wijaya-9182736450',
    full_name: 'Daniel Wijaya',
    gender: 'Laki-laki',
    birth_place: 'Bandung',
    birth_date: '1998-11-20',
    address: 'Jl. Mawar No. 8, Bandung',
    phone: '087812345678',
    email: 'daniel.w@gmail.com',
    join_year: '2022',
    marital_status: 'Belum Menikah',
    father_name: 'Hendra Wijaya',
    mother_name: 'Linaawati',
    church_role: 'Anggota',
    potentials: ['IT / Multimedia'],
    is_joined_division: 'Ya',
    joined_divisions: ['Divisi Dewasa Muda XTION'],
    category: 'Pemuda',
    status: 'Aktif',
    created_at: new Date().toISOString(),
  },
];

/**
 * Fetch all Jemaat (from Supabase or local storage fallback)
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
 * Get Jemaat by qr_token, id_jemaat, or UUID id
 */
export async function getJemaatByCodeOrId(queryStr: string): Promise<Jemaat | null> {
  const clean = queryStr.trim();
  if (!clean) return null;

  if (supabase) {
    try {
      // 1. By UUID id
      const { data: byUuid } = await supabase.from('jemaat').select('*').eq('id', clean).maybeSingle();
      if (byUuid) return byUuid as Jemaat;

      // 2. By id_jemaat
      const { data: byIdJemaat } = await supabase.from('jemaat').select('*').eq('id_jemaat', clean).maybeSingle();
      if (byIdJemaat) return byIdJemaat as Jemaat;

      // 3. By qr_token
      const { data: byTok } = await supabase.from('jemaat').select('*').eq('qr_token', clean).maybeSingle();
      if (byTok) return byTok as Jemaat;
    } catch (e) {
      console.warn('Supabase get error:', e);
    }
  }

  // Fallback lookup from local list
  const list = await getAllJemaat();
  const match = list.find(
    (item) =>
      item.qr_token === clean ||
      item.id_jemaat?.toLowerCase() === clean.toLowerCase() ||
      item.id === clean
  );

  return match || null;
}

/**
 * Helper to clean payload before inserting/updating to Supabase
 */
function cleanPayload(obj: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    const val = obj[key];
    if (val !== undefined && val !== null) {
      cleaned[key] = val;
    }
  });
  return cleaned;
}

/**
 * Create new Jemaat
 */
export async function createJemaat(
  input: Omit<Jemaat, 'id' | 'id_jemaat' | 'qr_token'> & { id_jemaat?: string; qr_token?: string }
): Promise<Jemaat> {
  const currentList = await getAllJemaat();
  const nextSeq = currentList.length + 1;

  const id_jemaat = input.id_jemaat || generateIdJemaat(input.full_name, input.birth_date, nextSeq);
  const qr_token = input.qr_token || generateQrToken();
  const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}`;

  const newJemaat: Jemaat = {
    ...input,
    id: newId,
    id_jemaat,
    qr_token,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (supabase) {
    try {
      const payload = cleanPayload(newJemaat);
      const { data, error } = await supabase
        .from('jemaat')
        .insert([payload])
        .select('*')
        .maybeSingle();

      if (!error && data) {
        saveToLocalStorage(data as Jemaat);
        return data as Jemaat;
      }
      console.error('Supabase insert error detail:', error);
    } catch (err) {
      console.error('Supabase insert exception:', err);
    }
  }

  // Local storage fallback
  saveToLocalStorage(newJemaat);
  return newJemaat;
}

/**
 * Update existing Jemaat
 */
export async function updateJemaat(idOrCode: string, updates: Partial<Jemaat>): Promise<Jemaat | null> {
  const existing = await getJemaatByCodeOrId(idOrCode);
  const targetId = existing ? existing.id : (idOrCode.includes('-') && idOrCode.length > 20 ? idOrCode : `id-${Date.now()}`);
  const targetIdJemaat = existing ? existing.id_jemaat : idOrCode;

  const updatedJemaat: Jemaat = {
    ...(existing || {}),
    ...updates,
    id: targetId,
    updated_at: new Date().toISOString(),
  } as Jemaat;

  if (supabase) {
    try {
      const payload = cleanPayload(updatedJemaat);

      // Stage 1: Try update by UUID id
      const { data: updateById, error: errById } = await supabase
        .from('jemaat')
        .update(payload)
        .eq('id', targetId)
        .select('*')
        .maybeSingle();

      if (!errById && updateById) {
        saveToLocalStorage(updateById as Jemaat);
        return updateById as Jemaat;
      }

      // Stage 2: Try update by id_jemaat if different
      if (targetIdJemaat && targetIdJemaat !== targetId) {
        const { data: updateByCode, error: errByCode } = await supabase
          .from('jemaat')
          .update(payload)
          .eq('id_jemaat', targetIdJemaat)
          .select('*')
          .maybeSingle();

        if (!errByCode && updateByCode) {
          saveToLocalStorage(updateByCode as Jemaat);
          return updateByCode as Jemaat;
        }
      }

      // Stage 3: Upsert if row doesn't exist in Supabase DB yet
      const { data: upsertData, error: upsertErr } = await supabase
        .from('jemaat')
        .upsert([payload])
        .select('*')
        .maybeSingle();

      if (!upsertErr && upsertData) {
        saveToLocalStorage(upsertData as Jemaat);
        return upsertData as Jemaat;
      }

      console.error('Supabase update/upsert error detail:', upsertErr || errById);
    } catch (e) {
      console.error('Supabase update exception:', e);
    }
  }

  // Fallback local storage update
  saveToLocalStorage(updatedJemaat);
  return updatedJemaat;
}

/**
 * Delete Jemaat
 */
export async function deleteJemaat(idOrCode: string): Promise<boolean> {
  const existing = await getJemaatByCodeOrId(idOrCode);
  const targetId = existing ? existing.id : idOrCode;

  if (supabase) {
    try {
      const { error } = await supabase.from('jemaat').delete().eq('id', targetId);
      if (!error) {
        removeFromLocalStorage(targetId, existing?.id_jemaat);
        return true;
      }
      console.error('Supabase delete error:', error);
    } catch (e) {
      console.error('Supabase delete exception:', e);
    }
  }

  // Fallback local storage delete
  removeFromLocalStorage(targetId, existing?.id_jemaat);
  return true;
}

/**
 * Helper to update local storage item
 */
function saveToLocalStorage(item: Jemaat) {
  if (typeof window === 'undefined') return;
  try {
    const local = localStorage.getItem('qr_jemaat_data');
    let list: Jemaat[] = local ? JSON.parse(local) : [...DUMMY_JEMAAT_DATA];
    const idx = list.findIndex((j) => j.id === item.id || j.id_jemaat === item.id_jemaat);
    if (idx !== -1) {
      list[idx] = item;
    } else {
      list = [item, ...list];
    }
    localStorage.setItem('qr_jemaat_data', JSON.stringify(list));
  } catch (err) {
    console.warn('Save to localStorage failed:', err);
  }
}

/**
 * Helper to remove local storage item
 */
function removeFromLocalStorage(id: string, idJemaat?: string) {
  if (typeof window === 'undefined') return;
  try {
    const local = localStorage.getItem('qr_jemaat_data');
    if (!local) return;
    let list: Jemaat[] = JSON.parse(local);
    list = list.filter((j) => j.id !== id && j.id_jemaat !== idJemaat);
    localStorage.setItem('qr_jemaat_data', JSON.stringify(list));
  } catch (err) {
    console.warn('Remove from localStorage failed:', err);
  }
}
