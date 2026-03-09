/**
 * Helper zona waktu WITA (Waktu Indonesia Tengah, UTC+8)
 * Digunakan secara seragam di Fit To Work, Take 5, Hazard, PTO
 */

const WITA_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Tanggal hari ini dalam zona WITA (YYYY-MM-DD)
 * Contoh: pukul 02:00 WITA 16 Feb → "2025-02-16" (bukan "2025-02-15" dari UTC)
 */
export function getTodayWITA() {
  const now = new Date();
  const wita = new Date(now.getTime() + WITA_OFFSET_MS);
  return wita.toISOString().split("T")[0];
}

/**
 * Format timestamp ke tanggal WITA (YYYY-MM-DD)
 */
function formatDateWITA(timestampMs) {
  return new Date(timestampMs + WITA_OFFSET_MS).toISOString().split("T")[0];
}

/**
 * Tanggal relatif dari hari ini dalam zona WITA (YYYY-MM-DD)
 * getDateWITARelative(0) = hari ini, getDateWITARelative(-6) = 6 hari lalu
 */
export function getDateWITARelative(daysOffset = 0) {
  const todayStr = getTodayWITA();
  const base = new Date(todayStr + "T00:00:00+08:00").getTime();
  const target = base + daysOffset * DAY_MS;
  return formatDateWITA(target);
}

/**
 * Tanggal untuk preset bulan (WITA)
 */
export function getMonthBoundaryWITA(type) {
  const todayStr = getTodayWITA();
  const [y, m] = todayStr.split("-").map(Number); // m = 1..12
  if (type === "firstDayThisMonth") {
    return `${y}-${String(m).padStart(2, "0")}-01`;
  }
  if (type === "firstDayLastMonth") {
    const lastM = m === 1 ? 12 : m - 1;
    const lastY = m === 1 ? y - 1 : y;
    return `${lastY}-${String(lastM).padStart(2, "0")}-01`;
  }
  if (type === "lastDayLastMonth") {
    const firstThisMonth = new Date(`${y}-${String(m).padStart(2, "0")}-01T00:00:00+08:00`).getTime();
    return formatDateWITA(firstThisMonth - DAY_MS);
  }
  return todayStr;
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
