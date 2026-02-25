import { supabase } from "../supabaseClient";
import { fetchActiveMandatesForUser } from "./mandateHelpers";
import { getTodayWITA, getNowWITAISO } from "./dateTimeHelpers";
import { fetchSitesFTWStatusMap } from "./masterDataHelpers";
import {
  buildAttendanceSummaryForUsers,
  resetHariMasukByOff,
} from "./fitToWorkAttendanceHelpers";

export { getTodayWITA };

/**
 * Daftar jabatan bawahan per validator (untuk scope "belum isi FTW")
 * Leading Hand & Plant Leading Hand hanya lihat bawahan mereka.
 * PJO, Asst PJO, SHERQ lihat semua.
 */
function getSubordinateJabatansForValidator(jabatan, mandates) {
  const j = (jabatan || "").trim().replace(/\s+/g, " ");

  // PJO, Asst PJO, SHERQ, Administrator, Admin Site Project → lihat semua (return null = no filter)
  if (
    j === "Penanggung Jawab Operasional" ||
    j === "Asst. Penanggung Jawab Operasional" ||
    j === "SHERQ Officer" ||
    j === "SHE" ||
    j === "Administrator" ||
    j === "Admin Site Project"
  ) {
    return null; // null = semua jabatan
  }

  if (j === "Plant Leading Hand") {
    // Termasuk sesama Leading Hand agar bisa menandai off
    return [
      "Mekanik",
      "Operator Plant",
      "Field Leading Hand",
      "Plant Leading Hand",
    ];
  }

  if (j === "Field Leading Hand") {
    const base = [
      "Operator MMU",
      "Crew",
      "crew",
      "Quality Controller",
      "Quality Control",
      "Blaster",
      "Crew Blasting",
      "Field Leading Hand",
      "Plant Leading Hand",
    ];
    // Mandat PLH->FLH: tambah Mekanik/Operator Plant
    const plhMandate = (mandates || []).find(
      (m) => m.mandate_type === "PLH_TO_FLH",
    );
    if (plhMandate) {
      return [...base, "Mekanik", "Operator Plant"];
    }
    return base;
  }

  return []; // Jabatan lain tidak bisa akses
}

export { getSubordinateJabatansForValidator };

/**
 * Ambil daftar user yang BELUM mengisi Fit To Work hari ini
 * dan BELUM ditandai off.
 * Filter berdasarkan jabatan validator.
 *
 * @param {Object} user - User object validator
 * @param {Array<string>} additionalJabatans - Optional: Jabatan tambahan yang ingin dilihat (misal: sesama LH)
 */
export async function fetchUsersNotYetFilledFTW(user, additionalJabatans = []) {
  if (!user?.site) return [];

  const userSite = user.site;

  // Site dengan FTW disabled: tidak ada yang wajib isi, return kosong
  const ftwStatusMap = await fetchSitesFTWStatusMap();
  if (ftwStatusMap[userSite] === false) return [];

  const jabatan = (user?.jabatan || "").trim();
  const today = getTodayWITA();

  // Cek jabatan validator
  const validatorJabatans = [
    "Field Leading Hand",
    "Plant Leading Hand",
    "Penanggung Jawab Operasional",
    "Asst. Penanggung Jawab Operasional",
    "SHERQ Officer",
    "SHE",
    "Administrator",
    "Admin Site Project",
  ];
  if (!validatorJabatans.includes(jabatan)) {
    return [];
  }

  // Fetch mandates untuk Field Leading Hand (PLH->FLH)
  let mandates = [];
  if (jabatan === "Field Leading Hand") {
    mandates = await fetchActiveMandatesForUser(user.id, userSite);
  }

  const subordinateJabatans = getSubordinateJabatansForValidator(
    jabatan,
    mandates,
  );

  // 1. Ambil semua user di site (filter jabatan jika LH/PLH)
  let usersQuery = supabase
    .from("users")
    .select("id, nama, nrp, jabatan, site")
    .eq("site", userSite)
    .neq("id", user.id); // Exclude self

  if (subordinateJabatans && subordinateJabatans.length > 0) {
    // GABUNGKAN subordinateJabatans dengan additionalJabatans
    // Gunakan Set untuk unique values
    const combinedJabatans = [
      ...new Set([...subordinateJabatans, ...(additionalJabatans || [])]),
    ];
    usersQuery = usersQuery.in("jabatan", combinedJabatans);
  } else if (additionalJabatans && additionalJabatans.length > 0) {
    // Jika subordinateJabatans null (lihat semua), kita abaikan additionalJabatans.
    // Tapi jika subordinateJabatans kosong [] (tidak punya bawahan), kita tetap cek additionalJabatans.
    usersQuery = usersQuery.in("jabatan", additionalJabatans);
  }

  const { data: usersData, error: usersError } = await usersQuery;

  if (usersError || !usersData || usersData.length === 0) {
    return [];
  }

  // 2. User yang sudah isi FTW hari ini (by nrp + tanggal)
  const { data: ftwToday } = await supabase
    .from("fit_to_work")
    .select("nrp")
    .eq("site", userSite)
    .eq("tanggal", today);

  const nrpSudahIsi = new Set((ftwToday || []).map((r) => r.nrp));

  // 3. User yang sudah ditandai off hari ini
  const userIds = usersData.map((u) => u.id);
  const { data: absentToday } = await supabase
    .from("fit_to_work_absent")
    .select("user_id")
    .eq("tanggal", today)
    .in("user_id", userIds);

  const userIdSudahOff = new Set((absentToday || []).map((r) => r.user_id));

  // 4. Filter: user yang belum isi DAN belum off
  const result = usersData.filter(
    (u) => !nrpSudahIsi.has(u.nrp) && !userIdSudahOff.has(u.id),
  );

  return result;
}

/**
 * Ambil daftar user beserta ringkasan hari masuk FTW sesuai scope validator.
 * LH/PLH hanya bawahan, SHERQ/Asst PJO/PJO dapat semua user site.
 *
 * @param {Object} user - User object validator
 * @param {Array<string>} additionalJabatans - Optional: Jabatan tambahan yang ingin dilihat
 */
export async function fetchUsersAttendanceForValidator(
  user,
  additionalJabatans = [],
) {
  if (!user?.site) return [];

  const userSite = user.site;
  const jabatan = (user?.jabatan || "").trim();

  const validatorJabatans = [
    "Field Leading Hand",
    "Plant Leading Hand",
    "Penanggung Jawab Operasional",
    "Asst. Penanggung Jawab Operasional",
    "SHERQ Officer",
    "SHE",
    "Administrator",
    "Admin Site Project",
  ];
  if (!validatorJabatans.includes(jabatan)) return [];

  let mandates = [];
  if (jabatan === "Field Leading Hand") {
    mandates = await fetchActiveMandatesForUser(user.id, userSite);
  }

  const subordinateJabatans = getSubordinateJabatansForValidator(
    jabatan,
    mandates,
  );

  let usersQuery = supabase
    .from("users")
    .select("id, nama, nrp, jabatan, site")
    .eq("site", userSite)
    .neq("id", user.id);

  if (subordinateJabatans && subordinateJabatans.length > 0) {
    // GABUNGKAN subordinateJabatans dengan additionalJabatans
    const combinedJabatans = [
      ...new Set([...subordinateJabatans, ...(additionalJabatans || [])]),
    ];
    usersQuery = usersQuery.in("jabatan", combinedJabatans);
  } else if (additionalJabatans && additionalJabatans.length > 0) {
    usersQuery = usersQuery.in("jabatan", additionalJabatans);
  }

  const { data: usersData, error: usersError } = await usersQuery;
  if (usersError || !usersData || usersData.length === 0) return [];

  // --- MODIFIKASI UNTUK 48 JAM TIDUR ---
  // Ambil data FTW hari ini untuk data tidur malam ini (24h)
  const today = getTodayWITA();
  const { data: ftwToday } = await supabase
    .from("fit_to_work")
    .select("nrp, total_jam_tidur, tidak_mengkonsumsi_obat, tidak_ada_masalah_pribadi, siap_bekerja, created_at")
    .eq("site", userSite)
    .eq("tanggal", today);

  const ftwTodayMap = new Map(
    (ftwToday || []).map((r) => [
      r.nrp,
      {
        total_jam_tidur: r.total_jam_tidur,
        tidak_mengkonsumsi_obat: r.tidak_mengkonsumsi_obat,
        tidak_ada_masalah_pribadi: r.tidak_ada_masalah_pribadi,
        siap_bekerja: r.siap_bekerja,
        created_at: r.created_at,
      },
    ]),
  );

  // Hitung tanggal kemarin
  const todayDate = new Date(today);
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split("T")[0];

  // Ambil data FTW kemarin untuk data tidur kemarin (48h part)
  const { data: ftwYesterday } = await supabase
    .from("fit_to_work")
    .select("nrp, total_jam_tidur")
    .eq("site", userSite)
    .eq("tanggal", yesterday);

  const ftwYesterdayMap = new Map(
    (ftwYesterday || []).map((r) => [r.nrp, r.total_jam_tidur]),
  );
  // --------------------------------------

  const derivedSummary = await buildAttendanceSummaryForUsers(usersData, today);
  const summaryMap = new Map((derivedSummary || []).map((s) => [s.user_id, s]));

  return usersData
    .map((u) => {
      const summary = summaryMap.get(u.id);
      const ftwRow = ftwTodayMap.get(u.nrp);

      // Ambil data tidur dan FTW
      const sleepToday = ftwRow
        ? parseFloat(ftwRow.total_jam_tidur) || 0
        : 0;
      const sleepYesterday = ftwYesterdayMap.get(u.nrp)
        ? parseFloat(ftwYesterdayMap.get(u.nrp))
        : 0;
      const sleep48h = sleepToday + sleepYesterday;

      return {
        ...u,
        hari_masuk: summary?.current_hari_masuk || 0,
        attendance_last_ftw_date: summary?.last_ftw_date || null,
        sleep_today: sleepToday,
        sleep_yesterday: sleepYesterday,
        sleep_48h: sleep48h,
        tidak_mengkonsumsi_obat: ftwRow?.tidak_mengkonsumsi_obat ?? true,
        tidak_ada_masalah_pribadi: ftwRow?.tidak_ada_masalah_pribadi ?? true,
        siap_bekerja: ftwRow?.siap_bekerja ?? true,
        ftw_created_at: ftwRow?.created_at || null,
      };
    })
    .sort((a, b) => {
      // Urutan berdasarkan jam pengisian FTW: yang pertama mengisi di atas
      const timeA = a.ftw_created_at ? new Date(a.ftw_created_at).getTime() : Infinity;
      const timeB = b.ftw_created_at ? new Date(b.ftw_created_at).getTime() : Infinity;
      if (timeA !== timeB) return timeA - timeB;
      return (a.nama || "").localeCompare(b.nama || "", "id");
    });
}

/**
 * Tandai user sebagai off/tidak hadir untuk hari ini.
 * Hanya jabatan tertentu (PJO, Asst PJO, SHERQ, SHE, Administrator) yang berwenang.
 */
export async function markUserOff(userId, validatorUser) {
  if (!userId || !validatorUser?.id) {
    return { error: "User ID dan validator wajib" };
  }
  if (!canMarkUserOff(validatorUser?.jabatan)) {
    return { error: "Tidak memiliki wewenang untuk menandai off karyawan" };
  }

  // Leading Hand hanya boleh menandai off user dalam scope tanggung jawab jabatan.
  const validatorJabatan = (validatorUser?.jabatan || "").trim();
  if (
    validatorJabatan === "Field Leading Hand" ||
    validatorJabatan === "Plant Leading Hand"
  ) {
    const { data: targetUser, error: targetUserError } = await supabase
      .from("users")
      .select("id, jabatan, site")
      .eq("id", userId)
      .maybeSingle();

    if (targetUserError || !targetUser) {
      return { error: "Data karyawan target tidak ditemukan" };
    }
    if (targetUser.site !== validatorUser.site) {
      return { error: "Tidak memiliki wewenang lintas site" };
    }

    let mandates = [];
    if (validatorJabatan === "Field Leading Hand") {
      mandates = await fetchActiveMandatesForUser(
        validatorUser.id,
        validatorUser.site,
      );
    }

    const allowedJabatans = getSubordinateJabatansForValidator(
      validatorJabatan,
      mandates,
    );
    if (!allowedJabatans?.includes(targetUser.jabatan)) {
      return {
        error: "Tidak memiliki wewenang untuk menandai off jabatan ini",
      };
    }
  }

  const today = getTodayWITA();

  const { error } = await supabase.from("fit_to_work_absent").upsert(
    {
      user_id: userId,
      tanggal: today,
      marked_by: validatorUser.id,
      created_at: getNowWITAISO(),
    },
    { onConflict: "user_id,tanggal" },
  );

  if (error) {
    console.error("Error marking user off:", error);
    return { error: error.message };
  }

  const attendanceReset = await resetHariMasukByOff(
    userId,
    validatorUser.site,
    "off_marked",
  );
  if (attendanceReset?.error) {
    console.error("Attendance reset warning:", attendanceReset.error);
  }

  return { success: true };
}

/**
 * Batalkan tanda off (Tandai On / Hadir) - hapus record dari fit_to_work_absent
 * Hanya PJO, Asst PJO, SHERQ yang dapat melakukan revisi ini
 */
export async function unmarkUserOff(userId) {
  if (!userId) return { error: "User ID wajib" };

  const today = getTodayWITA();

  const { error } = await supabase
    .from("fit_to_work_absent")
    .delete()
    .eq("user_id", userId)
    .eq("tanggal", today);

  if (error) {
    console.error("Error unmarking user off:", error);
    return { error: error.message };
  }

  return { success: true };
}

/**
 * Jabatan yang dapat melihat dan merevisi daftar "Sudah Ditandai Off" (Tandai On / Hadir).
 * Admin Site Project tidak termasuk - read only untuk validasi FTW.
 */
const CAN_REVISE_OFF_JABATANS = [
  "Penanggung Jawab Operasional",
  "Asst. Penanggung Jawab Operasional",
  "SHERQ Officer",
  "SHE",
  "Administrator",
];

export function canReviseOffStatus(jabatan) {
  return CAN_REVISE_OFF_JABATANS.includes((jabatan || "").trim());
}

/**
 * Jabatan yang dapat melakukan Tandai Off / Tandai On karyawan.
 * PJO, Asst PJO, SHERQ, SHE, Administrator, Field LH, Plant LH.
 * Untuk LH, pembatasan user per jabatan dilakukan di markUserOff().
 */
const CAN_MARK_USER_OFF_JABATANS = [
  "Penanggung Jawab Operasional",
  "Asst. Penanggung Jawab Operasional",
  "SHERQ Officer",
  "SHE",
  "Administrator",
  "Field Leading Hand",
  "Plant Leading Hand",
];

export function canMarkUserOff(jabatan) {
  return CAN_MARK_USER_OFF_JABATANS.includes((jabatan || "").trim());
}

/**
 * Ambil daftar user yang SUDAH ditandai off hari ini
 * Hanya untuk PJO, Asst PJO, SHERQ - untuk revisi (Tandai On / Hadir)
 */
export async function fetchUsersMarkedOffToday(user) {
  if (!user?.site) return [];
  if (!canReviseOffStatus(user?.jabatan)) return [];

  const today = getTodayWITA();
  const userSite = user.site;

  const { data: absentRecords, error } = await supabase
    .from("fit_to_work_absent")
    .select("user_id")
    .eq("tanggal", today);

  if (error || !absentRecords || absentRecords.length === 0) return [];

  const userIds = [...new Set(absentRecords.map((r) => r.user_id))];

  const { data: usersData, error: usersError } = await supabase
    .from("users")
    .select("id, nama, nrp, jabatan, site")
    .in("id", userIds)
    .eq("site", userSite);

  if (usersError || !usersData) return [];

  return usersData;
}

/**
 * Cek apakah user saat ini wajib mengisi Fit To Work hari ini dan belum mengisi
 * (belum ada record di fit_to_work, dan tidak ditandai off)
 * Untuk badge notifikasi di menu Fit To Work
 */
export async function userNeedsToFillFTWToday(user) {
  if (!user?.id || !user?.nrp || !user?.site) return false;

  // Site dengan FTW disabled: tidak wajib mengisi (user tetap boleh mengisi)
  const ftwStatusMap = await fetchSitesFTWStatusMap();
  if (ftwStatusMap[user.site] === false) return false;

  const today = getTodayWITA();

  // 1. Cek apakah sudah isi FTW hari ini
  const { data: ftwRecord } = await supabase
    .from("fit_to_work")
    .select("id")
    .eq("site", user.site)
    .eq("nrp", user.nrp)
    .eq("tanggal", today)
    .limit(1)
    .maybeSingle();

  if (ftwRecord) return false; // Sudah isi

  // 2. Cek apakah ditandai off
  const { data: absentRecord } = await supabase
    .from("fit_to_work_absent")
    .select("id")
    .eq("user_id", user.id)
    .eq("tanggal", today)
    .limit(1)
    .maybeSingle();

  if (absentRecord) return false; // Ditandai off, tidak wajib isi

  return true;
}
