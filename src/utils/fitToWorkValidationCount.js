import { supabase } from "../supabaseClient";
import { fetchActiveMandatesForUser } from "./mandateHelpers";

/**
 * Mengambil jumlah validasi Fit To Work yang perlu ditindaklanjuti oleh user (berdasarkan jabatan + mandat).
 * Dipakai untuk badge notifikasi (desktop: icon lonceng, mobile: angka di menu Validasi Fit To Work).
 */
export async function fetchValidationCountForUser(user) {
  if (!user?.site) return 0;
  const jabatan = (user?.jabatan || "").trim();
  const userSite = user.site;
  const ids = new Set();

  const addFromQuery = async (q) => {
    const { data, error } = await q.select("id");
    if (!error && data) data.forEach((r) => ids.add(r.id));
  };

  const baseQuery = () =>
    supabase
      .from("fit_to_work")
      .select("id")
      .eq("site", userSite)
      .eq("status_fatigue", "Not Fit To Work");

  if (jabatan === "Administrator" || jabatan === "Admin Site Project") {
    await addFromQuery(baseQuery().in("workflow_status", ["Pending", "Level1_Review", "Level1 Review"]));
  } else if (jabatan === "Plant Leading Hand") {
    await addFromQuery(
      baseQuery().in("jabatan", ["Mekanik", "Operator Plant"]).eq("workflow_status", "Pending")
    );
  } else if (jabatan === "Field Leading Hand") {
    await addFromQuery(
      baseQuery()
        .in("jabatan", [
          "Operator MMU",
          "Crew",
          "crew",
          "Quality Controller",
          "Quality Control",
          "Blaster",
          "Crew Blasting",
        ])
        .eq("workflow_status", "Pending")
    );
    // Mandat PLH->FLH: tambah Mekanik/Operator Plant jika PLH tidak onsite
    const mandates = await fetchActiveMandatesForUser(user.id, userSite);
    const plhMandate = mandates.find((m) => m.mandate_type === "PLH_TO_FLH");
    if (plhMandate) {
      await addFromQuery(
        baseQuery().in("jabatan", ["Mekanik", "Operator Plant"]).eq("workflow_status", "Pending")
      );
    }
  } else if (jabatan === "Asst. Penanggung Jawab Operasional") {
    await addFromQuery(
      baseQuery()
        .in("jabatan", ["Blaster", "Field Leading Hand", "Plant Leading Hand"])
        .eq("workflow_status", "Pending")
    );
    const mandates = await fetchActiveMandatesForUser(user.id, userSite);
    for (const m of mandates) {
      if (m.mandate_type === "SHERQ_TO_ASST_PJO_OR_PJO") {
        await addFromQuery(baseQuery().in("workflow_status", ["Level1_Review", "Level1 Review"]));
      } else if (m.mandate_type === "PJO_TO_ASST_PJO") {
        await addFromQuery(
          baseQuery()
            .in("jabatan", [
              "Asst. Penanggung Jawab Operasional",
              "SHERQ Officer",
              "Technical Service",
              "Field Leading Hand",
              "Plant Leading Hand",
            ])
            .in("workflow_status", ["Pending", "Level1_Review", "Level1 Review"])
        );
      }
    }
  } else if (jabatan === "Penanggung Jawab Operasional") {
    await addFromQuery(
      baseQuery()
        .in("jabatan", [
          "Asst. Penanggung Jawab Operasional",
          "SHERQ Officer",
          "Technical Service",
          "Field Leading Hand",
          "Plant Leading Hand",
        ])
        .in("workflow_status", ["Pending", "Level1_Review", "Level1 Review"])
    );
    const mandates = await fetchActiveMandatesForUser(user.id, userSite);
    const sherqMandate = mandates.find((m) => m.mandate_type === "SHERQ_TO_ASST_PJO_OR_PJO");
    if (sherqMandate) {
      await addFromQuery(baseQuery().in("workflow_status", ["Level1_Review", "Level1 Review"]));
    }
  } else if (jabatan === "SHE") {
    await addFromQuery(baseQuery().in("workflow_status", ["Pending", "Level1_Review", "Level1 Review"]));
  } else if (jabatan === "SHERQ Officer") {
    await addFromQuery(baseQuery().in("workflow_status", ["Level1_Review", "Level1 Review"]));
  } else {
    return 0;
  }

  return ids.size;
}
