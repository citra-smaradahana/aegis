/**
 * Mapping nama user ke file e-signature di public/
 * File esign: budiwaspodo.png, erwinwahyu.png, sukron.png, deni.png, jumaing.png
 */
const ESIGN_MAP = {
  "budi waspodo": "budiwaspodo.png",
  "budi wasopodo": "budiwaspodo.png",
  "erwin wahyu budianto": "erwinwahyu.png",
  "erwin wahyu": "erwinwahyu.png",
  "ahmad sukron": "sukron.png",
  "sukron": "sukron.png",
  "deni setiawan": "deni.png",
  "deni": "deni.png",
  "jumaing": "jumaing.png",
};

/**
 * Ambil path esign berdasarkan nama (case-insensitive, trim)
 * @param {string} nama - Nama user (inspector/approver)
 * @returns {string|null} Path seperti "/budiwaspodo.png" atau null jika tidak ada
 */
export function getEsignPath(nama) {
  if (!nama || typeof nama !== "string") return null;
  const key = nama.trim().toLowerCase();
  if (!key) return null;
  const filename = ESIGN_MAP[key];
  return filename ? `/${filename}` : null;
}
