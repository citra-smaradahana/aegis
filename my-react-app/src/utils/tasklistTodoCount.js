import { supabase } from "../supabaseClient";
import { fetchActiveEvaluatorMandatesForUser } from "./evaluatorMandateHelpers";

// Cache untuk Tasklist Count
const todoCache = {};
const CACHE_TTL = 30 * 1000; // 30 detik

/**
 * User punya aksi pada hazard report? (PIC, Pelapor, atau Evaluator)
 * Sama dengan logic di TasklistPageMobile
 */
function userHasAction(report, user, activeMandateDelegators = []) {
  const currentName = (user?.nama || user?.user || "").toString().trim().toLowerCase();
  const pic = (report.pic || "").toString().trim().toLowerCase();
  const pelapor = (report.pelapor_nama || "").toString().trim().toLowerCase();
  const evaluators = [
    (report.evaluator_nama || "").toString().trim().toLowerCase(),
    (report.evaluator_nama_2 || "").toString().trim().toLowerCase(),
    (report.evaluator_nama_3 || "").toString().trim().toLowerCase(),
  ].filter(Boolean);
  
  const mandateDelegatorNames = activeMandateDelegators.map((m) =>
    (m.delegated_by?.nama || "").toLowerCase().trim()
  );

  const status = (report.status || "").trim();

  if (currentName === pic && ["Submit", "Progress", "Reject at Open", "Reject at Done"].includes(status)) return true;
  if (currentName === pelapor && status === "Open") return true;

  const isDirectEvaluator = evaluators.includes(currentName);
  const isMandatedEvaluator = evaluators.some((ev) => mandateDelegatorNames.includes(ev));

  if ((isDirectEvaluator || isMandatedEvaluator) && status === "Done") return true;
  return false;
}

/**
 * Jumlah hazard report di To Do yang user harus kerjakan (PIC/Pelapor/Evaluator)
 * Untuk badge notifikasi di bottom nav Tasklist
 */
export async function fetchTasklistTodoCountForUser(user) {
  if (!user?.id || !user?.site) return 0;

  // Cek cache
  const cacheKey = `${user.id}:${user.site}`;
  const cached = todoCache[cacheKey];
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.count;
  }

  const activeMandates = await fetchActiveEvaluatorMandatesForUser(user.id, user.site);

  const { data, error } = await supabase
    .from("hazard_report")
    .select("id, pic, pelapor_nama, evaluator_nama, evaluator_nama_2, evaluator_nama_3, status")
    .eq("lokasi", user.site)
    .not("status", "ilike", "closed")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tasklist todo count:", error);
    return 0;
  }

  const count = (data || []).filter((r) => userHasAction(r, user, activeMandates)).length;
  
  // Simpan cache
  todoCache[cacheKey] = { count, timestamp: Date.now() };

  return count;
}

// Helper untuk invalidate cache saat user melakukan aksi
export function invalidateTasklistTodoCache(userId) {
  if (!userId) return;
  const keys = Object.keys(todoCache).filter(k => k.startsWith(userId));
  keys.forEach(k => delete todoCache[k]);
}
