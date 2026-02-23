import { supabase } from "../supabaseClient";
import { getTodayWITA } from "./dateTimeHelpers";

function getPreviousDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function computeHariMasukFromSets(ftwDates, absentDates, anchorDate) {
  let startDate = anchorDate;
  // LOGIKA BARU: Optimistic count
  // Selalu mulai hitung dari hari ini (anchorDate), KECUALI jika hari ini sudah ditandai Absent.
  // Walaupun hari ini belum ada di ftwDates (belum submit), kita anggap hari ini sbg hari kerja ke-1.
  if (absentDates.has(anchorDate)) {
    // Jika hari ini libur, maka hitungan hari ini 0.
    // Kita cek hari sebelumnya.
    startDate = getPreviousDate(anchorDate);
  } else {
    // Jika hari ini TIDAK libur, kita anggap ini adalah hari kerja aktif.
    // Lanjut hitung mundur.
  }

  let cursor = startDate;
  let count = 0;
  let lastFtwDate = null;

  while (cursor) {
    if (absentDates.has(cursor)) break;

    // Khusus untuk anchorDate (Hari Ini), kita tidak cek ftwDates.
    // Kita anggap user "sedang" bekerja hari ini.
    if (cursor !== anchorDate && !ftwDates.has(cursor)) break;

    count += 1;
    // Update lastFtwDate jika ditemukan record nyata di ftwDates
    if (!lastFtwDate && ftwDates.has(cursor)) lastFtwDate = cursor;

    cursor = getPreviousDate(cursor);
  }

  return { count, lastFtwDate };
}

async function getAttendanceSummary(userId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .from("fit_to_work_attendance_summary")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching attendance summary:", error);
    return null;
  }
  return data || null;
}

async function deriveHariMasukFromHistory(user, anchorDate) {
  if (!user?.id || !user?.nrp || !user?.site || !anchorDate) {
    return { count: 0, lastFtwDate: null };
  }

  const { data: ftwRows, error: ftwError } = await supabase
    .from("fit_to_work")
    .select("tanggal")
    .eq("site", user.site)
    .eq("nrp", user.nrp)
    .lte("tanggal", anchorDate);

  if (ftwError) {
    console.error("Error reading FTW history for attendance:", ftwError);
    return { count: 0, lastFtwDate: null };
  }

  const { data: absentRows, error: absentError } = await supabase
    .from("fit_to_work_absent")
    .select("tanggal")
    .eq("user_id", user.id)
    .lte("tanggal", anchorDate);

  if (absentError) {
    console.error("Error reading absent history for attendance:", absentError);
    return { count: 0, lastFtwDate: null };
  }

  const ftwDates = new Set(
    (ftwRows || []).map((r) => r.tanggal).filter(Boolean),
  );
  const absentDates = new Set(
    (absentRows || []).map((r) => r.tanggal).filter(Boolean),
  );

  return computeHariMasukFromSets(ftwDates, absentDates, anchorDate);
}

export async function buildAttendanceSummaryForUsers(
  users,
  anchorDate = getTodayWITA(),
) {
  if (!Array.isArray(users) || users.length === 0) return [];

  const validUsers = users.filter((u) => u?.id && u?.nrp && u?.site);
  if (validUsers.length === 0) return [];

  const site = validUsers[0].site;
  const nrps = [...new Set(validUsers.map((u) => u.nrp))];
  const userIds = [...new Set(validUsers.map((u) => u.id))];

  const { data: ftwRows, error: ftwError } = await supabase
    .from("fit_to_work")
    .select("nrp, tanggal")
    .eq("site", site)
    .in("nrp", nrps)
    .lte("tanggal", anchorDate);

  if (ftwError) {
    console.error("Error reading FTW history for bulk attendance:", ftwError);
    return [];
  }

  const { data: absentRows, error: absentError } = await supabase
    .from("fit_to_work_absent")
    .select("user_id, tanggal")
    .in("user_id", userIds)
    .lte("tanggal", anchorDate);

  if (absentError) {
    console.error(
      "Error reading absent history for bulk attendance:",
      absentError,
    );
    return [];
  }

  const ftwMap = new Map();
  for (const row of ftwRows || []) {
    if (!row?.nrp || !row?.tanggal) continue;
    if (!ftwMap.has(row.nrp)) ftwMap.set(row.nrp, new Set());
    ftwMap.get(row.nrp).add(row.tanggal);
  }

  const absentMap = new Map();
  for (const row of absentRows || []) {
    if (!row?.user_id || !row?.tanggal) continue;
    if (!absentMap.has(row.user_id)) absentMap.set(row.user_id, new Set());
    absentMap.get(row.user_id).add(row.tanggal);
  }

  const summaries = validUsers.map((u) => {
    const computed = computeHariMasukFromSets(
      ftwMap.get(u.nrp) || new Set(),
      absentMap.get(u.id) || new Set(),
      anchorDate,
    );
    return {
      user_id: u.id,
      site: u.site,
      current_hari_masuk: computed.count,
      last_ftw_date: computed.lastFtwDate,
      updated_at: new Date().toISOString(),
    };
  });

  const { error: upsertError } = await supabase
    .from("fit_to_work_attendance_summary")
    .upsert(summaries, { onConflict: "user_id" });
  if (upsertError) {
    console.error("Error syncing bulk attendance summary:", upsertError);
  }

  return summaries;
}

export async function fetchCurrentHariMasukForUser(
  user,
  anchorDate = getTodayWITA(),
) {
  if (!user?.id) return 0;

  const summary = await getAttendanceSummary(user.id);
  if (summary && summary.current_hari_masuk > 0) {
    return summary.current_hari_masuk;
  }

  const derived = await deriveHariMasukFromHistory(user, anchorDate);
  const payload = {
    user_id: user.id,
    site: user.site,
    current_hari_masuk: derived.count,
    last_ftw_date: derived.lastFtwDate,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("fit_to_work_attendance_summary")
    .upsert(payload, { onConflict: "user_id" });

  if (error) {
    console.error("Error syncing attendance summary from history:", error);
  }

  return derived.count;
}

export async function recordFitToWorkSubmissionAttendance(user, tanggal) {
  if (!user?.id || !user?.site || !tanggal) {
    return { error: "Data user/site/tanggal tidak lengkap" };
  }

  const derived = await deriveHariMasukFromHistory(user, tanggal);

  const payload = {
    user_id: user.id,
    site: user.site,
    current_hari_masuk: derived.count,
    last_ftw_date: derived.lastFtwDate,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("fit_to_work_attendance_summary")
    .upsert(payload, { onConflict: "user_id" });

  if (error) {
    console.error("Error updating attendance summary after FTW submit:", error);
    return { error: error.message };
  }

  return { success: true, currentHariMasuk: derived.count };
}

export async function resetHariMasukByOff(
  userId,
  site,
  resetReason = "off_marked",
) {
  if (!userId || !site) {
    return { error: "Data user/site tidak lengkap" };
  }

  const payload = {
    user_id: userId,
    site,
    current_hari_masuk: 0,
    last_reset_at: new Date().toISOString(),
    last_reset_reason: resetReason,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("fit_to_work_attendance_summary")
    .upsert(payload, { onConflict: "user_id" });

  if (error) {
    console.error("Error resetting attendance summary on off:", error);
    return { error: error.message };
  }

  return { success: true };
}
