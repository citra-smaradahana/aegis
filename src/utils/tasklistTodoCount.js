import { supabase } from "../supabaseClient";

/**
 * User punya aksi pada hazard report? (PIC, Pelapor, atau Evaluator)
 * Sama dengan logic di TasklistPageMobile
 */
function userHasAction(report, user) {
  const currentName = (user?.nama || user?.user || "").toString().trim().toLowerCase();
  const pic = (report.pic || "").toString().trim().toLowerCase();
  const pelapor = (report.pelapor_nama || "").toString().trim().toLowerCase();
  const evaluator = (report.evaluator_nama || "").toString().trim().toLowerCase();
  const status = (report.status || "").trim();

  if (currentName === pic && ["Submit", "Progress", "Reject at Open", "Reject at Done"].includes(status)) return true;
  if (currentName === pelapor && status === "Open") return true;
  if (currentName === evaluator && status === "Done") return true;
  return false;
}

/**
 * Jumlah hazard report di To Do yang user harus kerjakan (PIC/Pelapor/Evaluator)
 * Untuk badge notifikasi di bottom nav Tasklist
 */
export async function fetchTasklistTodoCountForUser(user) {
  if (!user?.id || !user?.site) return 0;

  const { data, error } = await supabase
    .from("hazard_report")
    .select("id, pic, pelapor_nama, evaluator_nama, status")
    .eq("lokasi", user.site)
    .not("status", "ilike", "closed")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tasklist todo count:", error);
    return 0;
  }

  const count = (data || []).filter((r) => userHasAction(r, user)).length;
  return count;
}
