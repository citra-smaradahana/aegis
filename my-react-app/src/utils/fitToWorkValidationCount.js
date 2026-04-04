import { supabase } from "../supabaseClient";
import { fetchActiveMandatesForUser } from "./mandateHelpers";

// Cache sederhana untuk menyimpan hasil validasi count
// Format: { [userId]: { count: number, timestamp: number } }
const countCache = {};
const CACHE_TTL = 30 * 1000; // Cache berlaku 30 detik (cukup untuk navigasi antar menu)

/**
 * Mengambil jumlah validasi Fit To Work yang perlu ditindaklanjuti oleh user (berdasarkan jabatan + mandat).
 * Dipakai untuk badge notifikasi (desktop: icon lonceng, mobile: angka di menu Validasi Fit To Work).
 */
export async function fetchValidationCountForUser(user) {
  if (!user?.site || !user?.id) return 0;
  
  // Cek cache dulu
  const cacheKey = `${user.id}:${user.site}`;
  const cached = countCache[cacheKey];
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.count;
  }

  const jabatan = (user?.jabatan || "").toLowerCase().trim();
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

  if (jabatan === "administrator" || jabatan === "admin site project") {
    await addFromQuery(
      baseQuery().in("workflow_status", [
        "Pending",
        "Level1_Review",
        "Level1 Review",
      ]),
    );
  } else if (jabatan === "plant leading hand" || jabatan === "maintenance leading hand") {
    await addFromQuery(
      baseQuery()
        .in("jabatan", ["Mekanik", "Operator Plant"])
        .eq("workflow_status", "Pending"),
    );
  } else if (jabatan === "field leading hand") {
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
        .eq("workflow_status", "Pending"),
    );
    // Mandat PLH->FLH: tambah Mekanik/Operator Plant jika PLH tidak onsite
    const mandates = await fetchActiveMandatesForUser(user.id, userSite);
    const plhMandate = mandates.find((m) => m.mandate_type === "PLH_TO_FLH");
    if (plhMandate) {
      await addFromQuery(
        baseQuery()
          .in("jabatan", ["Mekanik", "Operator Plant"])
          .eq("workflow_status", "Pending"),
      );
    }
  } else if (jabatan === "asst. penanggung jawab operasional") {
    await addFromQuery(
      baseQuery().in("jabatan", ["Blaster"]).eq("workflow_status", "Pending"),
    );
    const mandates = await fetchActiveMandatesForUser(user.id, userSite);
    for (const m of mandates) {
      if (m.mandate_type === "SHERQ_TO_ASST_PJO_OR_PJO") {
        await addFromQuery(
          baseQuery().in("workflow_status", ["Level1_Review", "Level1 Review"]),
        );
      } else if (m.mandate_type === "PJO_TO_ASST_PJO") {
        await addFromQuery(
          baseQuery()
            .in("jabatan", [
              "asst. penanggung jawab operasional",
              "sherq officer",
              "technical service",
              "field leading hand",
              "plant leading hand",
              "maintenance leading hand",
            ])
            .in("workflow_status", [
              "Pending",
              "Level1_Review",
              "Level1 Review",
            ]),
        );
      }
    }
  } else if (jabatan === "penanggung jawab operasional") {
    await addFromQuery(
      baseQuery()
        .in("jabatan", [
          "asst. penanggung jawab operasional",
          "sherq officer",
          "technical service",
          "field leading hand",
          "plant leading hand",
          "maintenance leading hand",
        ])
        .in("workflow_status", ["Pending", "Level1_Review", "Level1 Review"]),
    );
    const mandates = await fetchActiveMandatesForUser(user.id, userSite);
    const sherqMandate = mandates.find(
      (m) => m.mandate_type === "SHERQ_TO_ASST_PJO_OR_PJO",
    );
    if (sherqMandate) {
      await addFromQuery(
        baseQuery().in("workflow_status", ["Level1_Review", "Level1 Review"]),
      );
    }
  } else if (jabatan === "she") {
    await addFromQuery(
      baseQuery().in("workflow_status", [
        "Pending",
        "Level1_Review",
        "Level1 Review",
      ]),
    );
  } else if (jabatan === "sherq officer") {
    await addFromQuery(
      baseQuery().in("workflow_status", ["Level1_Review", "Level1 Review"]),
    );
  } else {
    return 0;
  }

  // Simpan ke cache
  countCache[cacheKey] = { count: ids.size, timestamp: Date.now() };

  return ids.size;
}

// Helper untuk invalidate cache saat user melakukan aksi (approve/reject)
export function invalidateValidationCountCache(userId) {
  if (!userId) return;
  const keys = Object.keys(countCache).filter(k => k.startsWith(userId));
  keys.forEach(k => delete countCache[k]);
}
