/**
 * GOOGLE APPS SCRIPT: Google Form -> Google Sheets -> App API (/api/import/gform)
 *
 * CARA PAKAI:
 * 1. Buka Google Sheet hasil tanggapan Form -> Ekstensi -> Apps Script, paste seluruh kode ini.
 * 2. Project Settings (ikon gerigi) -> Script Properties -> tambah:
 *      APP_URL        = https://domain-aplikasi-anda   (tanpa garis miring di akhir)
 *      IMPORT_SECRET  = sama persis dengan env IMPORT_SECRET di server aplikasi
 *    JANGAN tulis secret / key Supabase di dalam kode.
 * 3. Pemicu (ikon jam):
 *      - onFormSubmit       : Dari spreadsheet -> Saat formulir dikirim
 *      - keepAliveSupabase  : Berbasis waktu -> setiap 3 hari (opsional)
 * 4. Jalankan lockKtpFiles() SATU KALI dari editor untuk menutup akses publik foto KTP lama.
 *
 * Foto KTP TIDAK dibuat publik. Share folder "(File responses)" milik Form ke:
 *   - email Google para pengurus (Viewer), dan
 *   - email service account aplikasi (Viewer), supaya admin bisa melihat KTP di aplikasi.
 * Pastikan "Akses umum" folder = Dibatasi / Restricted.
 */

const COLUMN_KTP = "Foto KTP";

function getConfig() {
  const props = PropertiesService.getScriptProperties();
  const appUrl = props.getProperty("APP_URL");
  const secret = props.getProperty("IMPORT_SECRET");
  if (!appUrl || !secret) throw new Error("Isi APP_URL dan IMPORT_SECRET di Script Properties.");
  return { appUrl: appUrl.replace(/\/+$/, ""), secret: secret };
}

function onFormSubmit(e) {
  try {
    let formData = {};

    // 1. Ambil data dari Google Form (e.response) atau Google Sheet (e.namedValues)
    if (e && e.response) {
      const itemResponses = e.response.getItemResponses();
      for (let i = 0; i < itemResponses.length; i++) {
        formData[itemResponses[i].getItem().getTitle().trim()] = itemResponses[i].getResponse();
      }
    } else if (e && e.namedValues) {
      for (let key in e.namedValues) {
        let val = e.namedValues[key];
        formData[key.trim()] = Array.isArray(val) ? val[0] : val;
      }
    } else {
      throw new Error("Jalankan lewat pemicu formulir, bukan tombol Run.");
    }

    // 2. Foto Profil: dibuat publik karena tampil di kartu QR dan halaman scan
    let profilePhotoUrl = "";
    let profileId = extractDriveId(formData["Foto Profil"]);
    if (profileId) {
      try {
        DriveApp.getFileById(profileId).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (err) {}
      profilePhotoUrl = "https://lh3.googleusercontent.com/d/" + profileId;
    }

    // 3. Foto KTP: dipastikan PRIVATE (hanya orang/akun yang diberi akses ke foldernya)
    let ktpPhotoUrl = "";
    let ktpId = extractDriveId(formData[COLUMN_KTP]);
    if (ktpId) {
      makePrivate(ktpId);
      ktpPhotoUrl = "https://drive.google.com/open?id=" + ktpId;
    }

    let churchRole = formData["Jabatan Gereja"] || "Anggota";
    let selectedDivisions = parseArrayField(formData["Divisi / Komunitas yang Diikuti"] || formData["Divisi Komunitas"]);

    // 4. id_jemaat dan qr_token dibuat oleh server, tidak dikirim dari sini
    let payload = {
      full_name: formData["Nama Lengkap"] || "Jemaat Baru",
      nik: String(formData["NIK"] || ""),
      gender: formData["Jenis Kelamin"] || "Laki-laki",
      birth_place: formData["Tempat Lahir"] || "",
      birth_date: formatDate(formData["Tanggal Lahir"]),
      address: formData["Alamat"] || "",
      phone: String(formData["Nomor HP / WA"] || ""),
      email: formData["Email"] || "",
      join_year: String(formData["Tahun Bergabung"] || formData["Tahun Masuk"] || new Date().getFullYear()),
      marital_status: formData["Status Pernikahan"] || "Belum Menikah",
      spouse_name: formData["Nama Pasangan (Suami/Istri)"] || formData["Nama Pasangan"] || "",
      children_count: String(formData["Jumlah Anak"] || "0"),
      children_detail: formData["Detail Anak (Nama & Tgl Lahir)"] || formData["Detail Anak"] || "",
      father_name: formData["Nama Ayah Kandung"] || "-",
      mother_name: formData["Nama Ibu Kandung"] || "-",
      church_role: churchRole,
      potentials: parseArrayField(formData["Potensi / Talenta Pelayanan"] || formData["Potensi Pelayanan"]),
      is_joined_division: selectedDivisions.length > 0 ? "Ya" : "Tidak",
      joined_divisions: selectedDivisions,
      category: churchRole === "Pelayan" || churchRole === "Pelayanan/Aktivis gereja" ? "Pelayan" : "Jemaat Umum",
      profile_photo_url: profilePhotoUrl,
      ktp_photo_url: ktpPhotoUrl,
      status: "Aktif"
    };

    // 5. Kirim ke API aplikasi (bukan langsung ke Supabase)
    const config = getConfig();
    let response = UrlFetchApp.fetch(config.appUrl + "/api/import/gform", {
      method: "post",
      contentType: "application/json",
      headers: { "x-import-secret": config.secret },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    Logger.log("Import status " + response.getResponseCode() + ": " + response.getContentText());
  } catch (error) {
    Logger.log("Error onFormSubmit: " + error.toString());
  }
}

/** Mencegah Supabase di-pause (pemicu setiap 3 hari). */
function keepAliveSupabase() {
  try {
    const config = getConfig();
    let res = UrlFetchApp.fetch(config.appUrl + "/api/import/gform", {
      method: "get",
      headers: { "x-import-secret": config.secret },
      muteHttpExceptions: true
    });
    Logger.log("Keep-Alive status: " + res.getResponseCode());
  } catch (err) {
    Logger.log("Keep-Alive Error: " + err.toString());
  }
}

/** SEKALI JALAN: tutup akses publik semua foto KTP yang sudah ada di sheet. */
function lockKtpFiles() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const values = sheet.getDataRange().getValues();
  const col = values[0].map(function (h) { return String(h).trim(); }).indexOf(COLUMN_KTP);
  if (col === -1) throw new Error('Kolom "' + COLUMN_KTP + '" tidak ditemukan.');

  let locked = 0, failed = 0;
  for (let r = 1; r < values.length; r++) {
    String(values[r][col] || "").split(",").forEach(function (link) {
      let id = extractDriveId(link.trim());
      if (!id) return;
      if (makePrivate(id)) locked++; else failed++;
    });
  }
  Logger.log("KTP dikunci: " + locked + ", gagal: " + failed);
}

function makePrivate(fileId) {
  try {
    DriveApp.getFileById(fileId).setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
    return true;
  } catch (err) {
    Logger.log("Gagal mengunci " + fileId + ": " + err);
    return false;
  }
}

function formatDate(raw) {
  if (raw instanceof Date) {
    return raw.getFullYear() + "-" + String(raw.getMonth() + 1).padStart(2, "0") + "-" + String(raw.getDate()).padStart(2, "0");
  }
  return typeof raw === "string" ? raw.trim() : "";
}

// Helper Ekstrak Array (Checkboxes)
function parseArrayField(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") return val.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
  return [];
}

// Helper Ekstrak File ID Google Drive
function extractDriveId(input) {
  if (!input) return "";
  let str = Array.isArray(input) ? input[0] : String(input);
  let match = str.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || str.match(/id=([a-zA-Z0-9_-]+)/) || str.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];
  if (str.length >= 15 && !str.includes("/")) return str.trim();
  return "";
}
