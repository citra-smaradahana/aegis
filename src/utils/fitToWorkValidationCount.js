import { supabase } from "../supabaseClient";

/**
 * Mengambil jumlah validasi Fit To Work yang perlu ditindaklanjuti oleh user (berdasarkan jabatan).
 * Dipakai untuk badge notifikasi (desktop: icon lonceng, mobile: angka di menu Validasi Fit To Work).
 */
export async function fetchValidationCountForUser(user) {
  if (!user?.site) return 0;
  const jabatan = (user?.jabatan || "").trim();
  const userSite = user.site;

  let query = supabase
    .from("fit_to_work")
    .select("*", { count: "exact", head: true })
    .eq("site", userSite)
    .eq("status_fatigue", "Not Fit To Work");

  if (user?.role === "admin" || jabatan === "Admin") {
    query = query.in("workflow_status", ["Pending", "Level1_Review", "Level1 Review"]);
  } else if (jabatan === "Plant Leading Hand") {
    query = query
      .in("jabatan", ["Mekanik", "Operator Plant"])
      .eq("workflow_status", "Pending");
  } else if (jabatan === "Field Leading Hand") {
    query = query
      .in("jabatan", [
        "Operator MMU",
        "Crew",
        "crew",
        "Quality Controller",
        "Quality Control",
        "Blaster",
        "Crew Blasting",
      ])
      .eq("workflow_status", "Pending");
  } else if (jabatan === "Asst. Penanggung Jawab Operasional") {
    query = query
      .in("jabatan", ["Blaster", "Field Leading Hand", "Plant Leading Hand"])
      .eq("workflow_status", "Pending");
  } else if (jabatan === "Penanggung Jawab Operasional") {
    query = query
      .in("jabatan", [
        "Asst. Penanggung Jawab Operasional",
        "SHERQ Officer",
        "Technical Service",
        "Field Leading Hand",
        "Plant Leading Hand",
      ])
      .in("workflow_status", ["Pending", "Level1_Review", "Level1 Review"]);
  } else if (jabatan === "SHE") {
    query = query.in("workflow_status", ["Pending", "Level1_Review", "Level1 Review"]);
  } else if (jabatan === "SHERQ Officer") {
    query = query.in("workflow_status", ["Level1_Review", "Level1 Review"]);
  } else {
    return 0;
  }

  const { count, error } = await query;
  if (error) return 0;
  return typeof count === "number" ? Math.max(0, count) : 0;
}
