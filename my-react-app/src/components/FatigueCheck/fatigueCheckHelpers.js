/**
 * Helper untuk Fatigue Check - fetch user list dengan data FTW untuk Leading Hand
 */
import { fetchUsersAttendanceForValidator } from "../../utils/fitToWorkAbsentHelpers";

const LEADING_HAND_JABATAN = ["Field Leading Hand", "Plant Leading Hand"];

/**
 * Fetch daftar user yang bisa dicek oleh Leading Hand (subordinate).
 * Pemeriksaan tidak termasuk Leading Hand, sehingga Leading Hand di-exclude dari list.
 * Return: array of { id, nama, nrp, jabatan, ... } terurut abjad berdasarkan nama.
 */
export async function fetchUsersForFatigueCheck(user) {
  const list = await fetchUsersAttendanceForValidator(user, []);
  const filtered = (list || []).filter(
    (u) => !LEADING_HAND_JABATAN.includes((u.jabatan || "").trim())
  );
  return filtered.sort((a, b) =>
    (a.nama || "").localeCompare(b.nama || "", "id")
  );
}
