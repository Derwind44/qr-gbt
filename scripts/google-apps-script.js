/**
 * GOOGLE APPS SCRIPT: Google Form -> Google Sheets -> Supabase Sync
 * 
 * CARA PAKAI:
 * 1. Buka Google Sheet hasil tanggapan Google Form Anda.
 * 2. Klik menu 'Ekstensi' (Extensions) -> 'Apps Script'.
 * 3. Hapus kode bawaan dan paste seluruh kode di bawah ini.
 * 4. Ganti SUPABASE_URL dan SUPABASE_ANON_KEY sesuai kredensial Supabase Anda.
 * 5. Klik ikon 'Simpan' (Save).
 * 6. Klik menu 'Pemicu' (Triggers) di ikon jam sebelah kiri.
 * 7. Tambah Pemicu baru:
 *    - Fungsi: `onFormSubmit`
 *    - Acara (Event): 'Dari spreadsheet' (From spreadsheet) -> 'Saat formulir dikirim' (On form submit).
 * 8. Simpan dan beri izin akses.
 */

// CONFIGURATION (Sesuaikan dengan project Supabase Anda)
const SUPABASE_URL = "https://YOUR_SUPABASE_PROJECT_REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

// Nama kolom di Google Sheets (sesuaikan jika urutannya berbeda)
const COLUMN_NAMA = "Nama Lengkap";
const COLUMN_HP = "No WhatsApp / HP";
const COLUMN_EMAIL = "Email";
const COLUMN_KATEGORI = "Kategori Jemaat";
const COLUMN_ALAMAT = "Alamat Lengkap";
const COLUMN_KOTA = "Kota";
const COLUMN_QR = "Kode QR"; // Kolom otomatis tempat menyertakan gbt-XXXXXXXXXX

/**
 * Generate kode QR acak format gbt-XXXXXXXXXX (10 digit angka)
 */
function generateQrCodeData() {
  var randomDigits = "";
  for (var i = 0; i < 10; i++) {
    randomDigits += Math.floor(Math.random() * 10);
  }
  return "gbt-" + randomDigits;
}

/**
 * Trigger saat Google Form dikirim
 */
function onFormSubmit(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var lastRow = sheet.getLastRow();
    
    // Ambil data baris terakhir yang baru saja diisi
    var rowValues = sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Map data berdasarkan header kolom
    var rowData = {};
    for (var i = 0; i < headers.length; i++) {
      rowData[headers[i].trim()] = rowValues[i];
    }
    
    // 1. Cek atau Buat Kode QR Format gbt-XXXXXXXXXX
    var qrColIndex = headers.indexOf(COLUMN_QR);
    var qrCodeData = "";
    
    if (qrColIndex !== -1 && rowValues[qrColIndex]) {
      qrCodeData = rowValues[qrColIndex];
    } else {
      qrCodeData = generateQrCodeData();
      
      // Buat kolom QR jika belum ada
      if (qrColIndex === -1) {
        sheet.getRange(1, headers.length + 1).setValue(COLUMN_QR);
        qrColIndex = headers.length;
      }
      // Tuliskan Kode QR ke sheet di baris baru tersebut
      sheet.getRange(lastRow, qrColIndex + 1).setValue(qrCodeData);
    }
    
    // 2. Persiapkan Payload untuk Supabase
    var payload = {
      qr_code_data: qrCodeData,
      full_name: rowData[COLUMN_NAMA] || rowData["Nama"] || "Jemaat Baru",
      phone: String(rowData[COLUMN_HP] || rowData["No HP"] || ""),
      email: rowData[COLUMN_EMAIL] || "",
      category: rowData[COLUMN_KATEGORI] || "Jemaat Umum",
      address: rowData[COLUMN_ALAMAT] || "",
      city: rowData[COLUMN_KOTA] || "",
      status: "Aktif"
    };
    
    // 3. Kirim Data via HTTP POST ke Supabase REST API
    var options = {
      method: "post",
      contentType: "application/json",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": "Bearer " + SUPABASE_ANON_KEY,
        "Prefer": "return=representation"
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    var response = UrlFetchApp.fetch(SUPABASE_URL + "/rest/v1/jemaat", options);
    Logger.log("Supabase Response: " + response.getContentText());
    
  } catch (err) {
    Logger.log("Error Sync to Supabase: " + err.toString());
  }
}
