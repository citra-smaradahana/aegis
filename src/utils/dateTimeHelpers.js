/**
 * Helper zona waktu WITA (Waktu Indonesia Tengah, UTC+8)
 * Digunakan secara seragam di Fit To Work, Take 5, Hazard, PTO
 */

/**
 * Tanggal hari ini dalam zona WITA (YYYY-MM-DD)
 * Contoh: pukul 02:00 WITA 16 Feb → "2025-02-16" (bukan "2025-02-15" dari UTC)
 */
export function getTodayWITA() {
  const now = new Date();
  const wita = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return wita.toISOString().split("T")[0];
}

/**
 * Timestamp ISO saat ini, dikonversi ke WITA untuk konsistensi
 * Untuk created_at, updated_at - format ISO8601 dengan offset +08:00
 */
export function getNowWITAISO() {
  const now = new Date();
  const wita = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const iso = wita.toISOString();
  // Ganti Z dengan +08:00 agar eksplisit WITA
  return iso.replace("Z", "+08:00");
}
