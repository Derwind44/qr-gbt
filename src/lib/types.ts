export interface Jemaat {
  id: string;
  id_jemaat: string; // Format: (2 Inisial Nama)-(4 Digit Random)(DDMMYY), contoh: BU-4829060895
  qr_token: string; // Opaque UUID/Hash encoded in QR code

  // Data Diri
  nik?: string;
  full_name: string;
  gender: 'Laki-laki' | 'Perempuan';
  birth_place: string;
  birth_date: string; // YYYY-MM-DD
  address: string;
  city?: string;
  phone: string;
  email?: string;
  join_year: string; // e.g. "2026"
  ktp_photo_url?: string;
  profile_photo_url?: string;

  // Data Keluarga
  marital_status: 'Menikah' | 'Belum Menikah' | 'Cerai Mati' | 'Cerai Hidup';
  spouse_name?: string;
  children_count?: string;
  children_detail?: string;
  father_name: string; // Wajib
  mother_name: string; // Wajib

  // Data Gereja & Pelayanan
  church_role: 'Anggota' | 'Pelayan' | 'Pelayanan/Aktivis gereja' | string;
  potentials?: string[]; // Checkboxes
  other_potential_desc?: string;
  is_joined_division: 'Ya' | 'Tidak';
  joined_divisions?: string[]; // Checkboxes

  // System Metadata
  category?: string;
  status?: 'Aktif' | 'Nonaktif' | 'Meninggal' | string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ScanResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  jemaat: Jemaat | null;
  scannedCode: string;
}
