import { supabase } from "../supabaseClient";
import { getTodayWITA } from "./dateTimeHelpers";

/**
 * Cek apakah user bisa memberi mandat evaluator (hanya untuk PJO, Evaluator, Plant Leading Hand)
 */
export function canGiveEvaluatorMandate(user) {
  if (!user) return false;
  const roleStr = String(user.role || "").toLowerCase();
  const jabatanStr = String(user.jabatan || "").toLowerCase();
  
  return (
    roleStr.includes("evaluator") ||
    jabatanStr.includes("pjo") ||
    jabatanStr.includes("plant leading hand")
  );
}

/**
 * Ambil daftar user untuk dropdown penerima mandat Evaluator (sesama evaluator di site yang sama)
 */
export async function fetchEvaluatorMandateRecipients(user) {
  if (!user?.site) return [];

  const { data, error } = await supabase
    .from("users")
    .select("id, nama, jabatan, nrp, role")
    .eq("site", user.site)
    .or("role.ilike.%evaluator%,jabatan.ilike.%evaluator%,jabatan.ilike.%pjo%,jabatan.ilike.%plant leading hand%")
    .neq("id", user.id)
    .order("nama", { ascending: true });

  if (error) {
    console.error("Error fetching evaluator mandate recipients:", error);
    return [];
  }
  return data || [];
}

/**
 * Ambil mandat yang **dibuat** oleh user (untuk ditampilkan di list mandat aktif Profil)
 */
export async function fetchEvaluatorMandatesGivenByUser(user) {
  if (!user?.id) return [];
  const today = getTodayWITA();

  const { data, error } = await supabase
    .from("evaluator_mandate")
    .select(`
      *,
      delegated_to:users!delegated_to_user_id(nama, jabatan, nrp)
    `)
    .eq("delegated_by_user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching evaluator mandates given:", error);
    return [];
  }

  const mandates = data || [];
  
  // Periksa mandat yang sudah lewat tanggal berlakunya (expired) namun is_active masih true
  const expiredActiveMandateIds = mandates
    .filter((m) => m.is_active && m.active_until && m.active_until < today)
    .map((m) => m.id);

  if (expiredActiveMandateIds.length > 0) {
    const { error: deactivateExpiredError } = await supabase
      .from("evaluator_mandate")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .in("id", expiredActiveMandateIds);

    if (deactivateExpiredError) {
      console.error("Error deactivating expired evaluator mandates:", deactivateExpiredError);
    }
  }

  return mandates.map((m) =>
    expiredActiveMandateIds.includes(m.id) ? { ...m, is_active: false } : m
  );
}

/**
 * Ambil mandat aktif yang **diterima** oleh user (penting untuk filter Tasklist)
 * Mengembalikan array dari objek mandate.
 */
export async function fetchActiveEvaluatorMandatesForUser(userId, site) {
  if (!userId || !site) return [];

  const today = getTodayWITA();

  const { data, error } = await supabase
    .from("evaluator_mandate")
    .select(`
      *,
      delegated_by:users!delegated_by_user_id(id, nama, nrp, jabatan, role)
    `)
    .eq("delegated_to_user_id", userId)
    .eq("site", site)
    .eq("is_active", true)
    .lte("active_from", today)
    .gte("active_until", today);

  if (error) {
    console.error("Error fetching active evaluator mandates:", error);
    return [];
  }
  return data || [];
}

/**
 * Buat mandat Evaluator baru
 */
export async function createEvaluatorMandate(payload) {
  const { error } = await supabase.from("evaluator_mandate").insert({
    ...payload,
    updated_at: new Date().toISOString(),
  });
  return { error };
}

/**
 * Update mandat Evaluator (misalnya menonaktifkan lebih cepat dari jatuh tempo)
 */
export async function updateEvaluatorMandate(mandateId, updates) {
  const { error } = await supabase
    .from("evaluator_mandate")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", mandateId);
  return { error };
}

/**
 * Nonaktifkan mandat spesifik
 */
export async function deactivateEvaluatorMandate(mandateId) {
  return updateEvaluatorMandate(mandateId, { is_active: false });
}
