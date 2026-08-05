export interface Jemaat {
  id: string;
  qr_code_data: string; // Format: gbt-XXXXXXXXXX
  full_name: string;
  phone?: string;
  email?: string;
  category?: string; // Jemaat Umum, Pelayan, Pemuda, Anak, dll.
  address?: string;
  city?: string;
  status?: string; // Aktif, Non-Aktif
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
