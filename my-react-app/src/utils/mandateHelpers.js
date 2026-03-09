import { supabase } from "../supabaseClient";
import { getTodayWITA } from "./dateTimeHelpers";

/** Tipe mandat */
export const MANDATE_TYPES = {
  PLH_TO_FLH: "PLH_TO_FLH",
  SHERQ_TO_ASST_PJO_OR_PJO: "SHERQ_TO_ASST_PJO_OR_PJO",
  PJO_TO_ASST_PJO: "PJO_TO_ASST_PJO",
};

/** Jabatan yang bisa memberi mandat & opsi penerima (dropdown) */
export const MANDATE_CONFIG = {
  "Plant Leading Hand": {
    mandateType: MANDATE_TYPES.PLH_TO_FLH,
    recipientJabatans: ["Field Leading Hand"],
  },
  "SHERQ Officer": {
    mandateType: MANDATE_TYPES.SHERQ_TO_ASST_PJO_OR_PJO,
    recipientJabatans: ["Asst. Penanggung Jawab Operasional", "Penanggung Jawab Operasional"],
  },
  "Penanggung Jawab Operasional": {
    mandateType: MANDATE_TYPES.PJO_TO_ASST_PJO,
    recipientJabatans: ["Asst. Penanggung Jawab Operasional"],
  },
};

/**
 * Cek apakah user bisa memberi mandat (Plant Leading Hand, SHERQ Officer, atau PJO)
 */
export function canGiveMandate(jabatan) {
  return !!MANDATE_CONFIG[jabatan];
}

/**
 * Ambil daftar user untuk dropdown penerima mandat (filter by site & jabatan)
 */
export async function fetchMandateRecipients(user) {
  if (!user?.site) return [];
  const config = MANDATE_CONFIG[user.jabatan];
  if (!config) return [];

  const { data, error } = await supabase
    .from("users")
    .select("id, nama, jabatan, nrp")
    .eq("site", user.site)
    .in("jabatan", config.recipientJabatans)
    .neq("id", user.id)
    .order("nama", { ascending: true });

  if (error) {
    console.error("Error fetching mandate recipients:", error);
    return [];
  }
  return data || [];
}

/**
 * Ambil mandat yang dibuat oleh user (untuk ditampilkan di Profile)
 */
export async function fetchMandatesGivenByUser(user) {
  if (!user?.id) return [];
  const today = getTodayWITA();

  const { data, error } = await supabase
    .from("validation_mandate")
    .select(`
      *,
      delegated_to:users!delegated_to_user_id(nama, jabatan, nrp)
    `)
    .eq("delegated_by_user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching mandates given:", error);
    return [];
  }

  const mandates = data || [];
  const expiredActiveMandateIds = mandates
    .filter((m) => m.is_active && m.active_until && m.active_until < today)
    .map((m) => m.id);

  if (expiredActiveMandateIds.length > 0) {
    const { error: deactivateExpiredError } = await supabase
      .from("validation_mandate")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .in("id", expiredActiveMandateIds)
      .eq("delegated_by_user_id", user.id);

    if (deactivateExpiredError) {
      console.error("Error deactivating expired mandates:", deactivateExpiredError);
    }
  }

  return mandates.map((m) =>
    expiredActiveMandateIds.includes(m.id) ? { ...m, is_active: false } : m
  );
}

/**
 * Cek apakah pemberi mandat (delegator) onsite hari ini
 * Onsite = punya record fit_to_work hari ini di site yang sama
 */
export async function isDelegatorOnsite(delegatorUserId, site) {
  if (!delegatorUserId || !site) return false;

  const { data: delegator } = await supabase
    .from("users")
    .select("nrp")
    .eq("id", delegatorUserId)
    .single();

  if (!delegator?.nrp) return false;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startISO = startOfToday.toISOString();

  const { data: ftw } = await supabase
    .from("fit_to_work")
    .select("id")
    .eq("nrp", delegator.nrp)
    .eq("site", site)
    .gte("created_at", startISO)
    .limit(1)
    .maybeSingle();

  return !!ftw;
}

/**
 * Ambil mandat aktif yang diterima user (untuk validasi)
 * Return array of { mandate, delegatedByUser } 
 */
export async function fetchActiveMandatesForUser(userId, site) {
  if (!userId || !site) return [];

  const today = getTodayWITA();

  const { data, error } = await supabase
    .from("validation_mandate")
    .select(`
      *,
      delegated_by:users!delegated_by_user_id(id, nama, nrp, jabatan)
    `)
    .eq("delegated_to_user_id", userId)
    .eq("site", site)
    .eq("is_active", true)
    .lte("active_from", today)
    .gte("active_until", today);

  if (error) {
    console.error("Error fetching active mandates:", error);
    return [];
  }
  return data || [];
}

/**
 * Buat mandat baru
 */
export async function createMandate(payload) {
  const { error } = await supabase.from("validation_mandate").insert({
    ...payload,
    updated_at: new Date().toISOString(),
  });
  return { error };
}

/**
 * Update mandat (untuk nonaktifkan atau ubah periode)
 */
export async function updateMandate(mandateId, updates) {
  const { error } = await supabase
    .from("validation_mandate")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", mandateId);
  return { error };
}

/**
 * Nonaktifkan mandat
 */
export async function deactivateMandate(mandateId) {
  return updateMandate(mandateId, { is_active: false });
}
