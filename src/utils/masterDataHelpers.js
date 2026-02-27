import { supabase } from "../supabaseClient";

/** Cache sederhana agar tidak fetch berulang */
const cache = {};
const CACHE_TTL = 60 * 1000; // 1 menit

function getCached(key) {
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    delete cache[key];
    return null;
  }
  return entry.data;
}

function setCached(key, data) {
  cache[key] = { data, ts: Date.now() };
}

/** Invalidate cache (panggil setelah CRUD di AdminSettings) */
export function invalidateMasterDataCache() {
  Object.keys(cache).forEach((k) => delete cache[k]);
}

// ------------ CRUD untuk AdminSettings ------------

/** Sites: fetch all dengan id */
export async function fetchSitesForAdmin() {
  const { data } = await supabase
    .from("master_sites")
    .select("id, name, sort_order, fit_to_work_enabled")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  return (data || []).map((r) => ({
    ...r,
    fit_to_work_enabled: r.fit_to_work_enabled !== false,
  }));
}

/** Sites dengan status Fit To Work untuk Pengaturan FTW */
export async function fetchSitesWithFTWStatus() {
  const data = await fetchSitesForAdmin();
  return data;
}

/** Update status Fit To Work wajib per site */
export async function updateSiteFTWEnabled(siteId, enabled) {
  await supabase
    .from("master_sites")
    .update({ fit_to_work_enabled: !!enabled })
    .eq("id", siteId);
  invalidateMasterDataCache();
}

/** Map site name -> fit_to_work_enabled (untuk cek kewajiban FTW per site) */
export async function fetchSitesFTWStatusMap() {
  const key = "sites_ftw_status";
  const c = getCached(key);
  if (c) return c;
  const { data, error } = await supabase
    .from("master_sites")
    .select("name, fit_to_work_enabled");
  if (error) return {};
  const map = {};
  (data || []).forEach((r) => {
    map[r.name] = r.fit_to_work_enabled !== false;
  });
  setCached(key, map);
  return map;
}

export async function insertSite(name) {
  const { data } = await supabase
    .from("master_sites")
    .insert({ name: name.trim() })
    .select("id")
    .single();
  invalidateMasterDataCache();
  return data;
}

export async function updateSite(id, name) {
  await supabase
    .from("master_sites")
    .update({ name: name.trim() })
    .eq("id", id);
  invalidateMasterDataCache();
}

export async function deleteSite(id) {
  await supabase.from("master_sites").delete().eq("id", id);
  invalidateMasterDataCache();
}

/** Site Locations */
export async function fetchSiteLocationsForAdmin(siteId) {
  if (!siteId) return [];
  const { data } = await supabase
    .from("master_site_locations")
    .select("id, name, sort_order")
    .eq("site_id", siteId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  return data || [];
}

export async function insertSiteLocation(siteId, name) {
  const { data } = await supabase
    .from("master_site_locations")
    .insert({ site_id: siteId, name: name.trim() })
    .select("id")
    .single();
  invalidateMasterDataCache();
  return data;
}

export async function updateSiteLocation(id, name) {
  await supabase
    .from("master_site_locations")
    .update({ name: name.trim() })
    .eq("id", id);
  invalidateMasterDataCache();
}

export async function deleteSiteLocation(id) {
  await supabase.from("master_site_locations").delete().eq("id", id);
  invalidateMasterDataCache();
}

/** Ketidaksesuaian */
export async function fetchKetidaksesuaianForAdmin() {
  const { data } = await supabase
    .from("master_ketidaksesuaian")
    .select("id, name, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  return data || [];
}

export async function insertKetidaksesuaian(name) {
  const { data } = await supabase
    .from("master_ketidaksesuaian")
    .insert({ name: name.trim() })
    .select("id")
    .single();
  invalidateMasterDataCache();
  return data;
}

export async function updateKetidaksesuaian(id, name) {
  await supabase
    .from("master_ketidaksesuaian")
    .update({ name: name.trim() })
    .eq("id", id);
  invalidateMasterDataCache();
}

export async function deleteKetidaksesuaian(id) {
  await supabase.from("master_ketidaksesuaian").delete().eq("id", id);
  invalidateMasterDataCache();
}

/** Sub Ketidaksesuaian */
export async function fetchSubKetidaksesuaianForAdmin(ketidaksesuaianId) {
  if (!ketidaksesuaianId) return [];
  const { data } = await supabase
    .from("master_sub_ketidaksesuaian")
    .select("id, name, sort_order")
    .eq("ketidaksesuaian_id", ketidaksesuaianId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  return data || [];
}

export async function insertSubKetidaksesuaian(ketidaksesuaianId, name) {
  const { data } = await supabase
    .from("master_sub_ketidaksesuaian")
    .insert({ ketidaksesuaian_id: ketidaksesuaianId, name: name.trim() })
    .select("id")
    .single();
  invalidateMasterDataCache();
  return data;
}

export async function updateSubKetidaksesuaian(id, name) {
  await supabase
    .from("master_sub_ketidaksesuaian")
    .update({ name: name.trim() })
    .eq("id", id);
  invalidateMasterDataCache();
}

export async function deleteSubKetidaksesuaian(id) {
  await supabase.from("master_sub_ketidaksesuaian").delete().eq("id", id);
  invalidateMasterDataCache();
}

/** Prosedur Departemen */
export async function fetchProsedurDepartemenForAdmin() {
  const { data } = await supabase
    .from("master_prosedur_departemen")
    .select("id, name, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  return data || [];
}

export async function insertProsedurDepartemen(name) {
  const { data } = await supabase
    .from("master_prosedur_departemen")
    .insert({ name: name.trim() })
    .select("id")
    .single();
  invalidateMasterDataCache();
  return data;
}

export async function updateProsedurDepartemen(id, name) {
  await supabase
    .from("master_prosedur_departemen")
    .update({ name: name.trim() })
    .eq("id", id);
  invalidateMasterDataCache();
}

export async function deleteProsedurDepartemen(id) {
  await supabase.from("master_prosedur_departemen").delete().eq("id", id);
  invalidateMasterDataCache();
}

/** Prosedur */
export async function fetchProsedurForAdmin() {
  const { data } = await supabase
    .from("master_prosedur")
    .select("id, name, sort_order, departemen_id")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  return data || [];
}

export async function insertProsedur(name, departemenId = null) {
  const { data } = await supabase
    .from("master_prosedur")
    .insert({ name: name.trim(), departemen_id: departemenId })
    .select("id")
    .single();
  invalidateMasterDataCache();
  return data;
}

export async function updateProsedur(id, name, departemenId = null) {
  await supabase
    .from("master_prosedur")
    .update({ name: name.trim(), departemen_id: departemenId })
    .eq("id", id);
  invalidateMasterDataCache();
}

export async function deleteProsedur(id) {
  await supabase.from("master_prosedur").delete().eq("id", id);
  invalidateMasterDataCache();
}

/** Jabatan */
export async function fetchJabatanForAdmin() {
  const { data } = await supabase
    .from("master_jabatan")
    .select("id, name, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  return data || [];
}

export async function insertJabatan(name) {
  const { data } = await supabase
    .from("master_jabatan")
    .insert({ name: name.trim() })
    .select("id")
    .single();
  invalidateMasterDataCache();
  return data;
}

export async function updateJabatan(id, name) {
  await supabase
    .from("master_jabatan")
    .update({ name: name.trim() })
    .eq("id", id);
  invalidateMasterDataCache();
}

export async function deleteJabatan(id) {
  await supabase.from("master_jabatan").delete().eq("id", id);
  invalidateMasterDataCache();
}

/** Alasan Observasi */
export async function fetchAlasanObservasiForAdmin() {
  const { data } = await supabase
    .from("master_alasan_observasi")
    .select("id, name, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  return data || [];
}

export async function insertAlasanObservasi(name) {
  const { data } = await supabase
    .from("master_alasan_observasi")
    .insert({ name: name.trim() })
    .select("id")
    .single();
  invalidateMasterDataCache();
  return data;
}

export async function updateAlasanObservasi(id, name) {
  await supabase
    .from("master_alasan_observasi")
    .update({ name: name.trim() })
    .eq("id", id);
  invalidateMasterDataCache();
}

export async function deleteAlasanObservasi(id) {
  await supabase.from("master_alasan_observasi").delete().eq("id", id);
  invalidateMasterDataCache();
}

/** Import data awal dari config (untuk tabel kosong) */
const SITES_DEFAULT = [
  "Head Office",
  "Balikpapan",
  "ADRO",
  "AMMP",
  "BSIB",
  "GAMR",
  "HRSB",
  "HRSE",
  "PABB",
  "PBRB",
  "PKJA",
  "PPAB",
  "PSMM",
  "REBH",
  "RMTU",
  "PMTU",
];
const PROSEDUR_DEFAULT = [
  "Prosedur Kerja Aman",
  "Prosedur Penggunaan APD",
  "Prosedur Operasi Mesin",
  "Prosedur Pekerjaan di Ketinggian",
  "Prosedur Pekerjaan Panas",
  "Prosedur Pengangkatan Manual",
  "Prosedur Pekerjaan di Ruang Terbatas",
];
const JABATAN_DEFAULT = [
  "Penanggung Jawab Operasional",
  "Asst. Penanggung Jawab Operasional",
  "SHERQ Officer",
  "SHERQ Supervisor",
  "SHERQ System & Compliance Officer",
  "Technical Service",
  "Field Leading Hand",
  "Plant Leading Hand",
  "Operator MMU",
  "Operator Plant",
  "Operator WOPP",
  "Mekanik",
  "Crew",
  "Administrator",
  "Admin Site Project",
  "Blaster",
  "Quality Controller",
  "Training & Development Specialist",
];
const ALASAN_OBSERVASI_DEFAULT = [
  "Pekerja Baru",
  "Kinerja Pekerja Kurang Baik",
  "Tes Praktek",
  "Kinerja Pekerja Baik",
  "Observasi Rutin",
  "Baru Terjadi Insiden",
  "Pekerja Dengan Pengetahuan Terbatas",
];

async function upsertIgnore(table, row, conflictCols) {
  const { error } = await supabase.from(table).upsert(row, {
    onConflict: conflictCols,
    ignoreDuplicates: true,
  });
  if (error) throw error;
}

export async function importSeedData() {
  invalidateMasterDataCache();

  // Sites
  for (let i = 0; i < SITES_DEFAULT.length; i++) {
    await upsertIgnore(
      "master_sites",
      { name: SITES_DEFAULT[i], sort_order: i + 1 },
      "name",
    );
  }

  // Site locations untuk BSIB
  const { data: bsibSite } = await supabase
    .from("master_sites")
    .select("id")
    .eq("name", "BSIB")
    .single();
  if (bsibSite) {
    const bsibLocs = [
      "Office",
      "Workshop",
      "OSP",
      "PIT A",
      "PIT C",
      "PIT E",
      "Candrian",
      "HLO",
    ];
    for (let i = 0; i < bsibLocs.length; i++) {
      await upsertIgnore(
        "master_site_locations",
        { site_id: bsibSite.id, name: bsibLocs[i], sort_order: i + 1 },
        "site_id,name",
      );
    }
  }

  // Ketidaksesuaian + Sub
  const { SUB_OPTIONS } = await import(
    "../config/hazardKetidaksesuaianOptions"
  );
  const ketKeys = Object.keys(SUB_OPTIONS || {});
  for (let i = 0; i < ketKeys.length; i++) {
    await upsertIgnore(
      "master_ketidaksesuaian",
      { name: ketKeys[i], sort_order: i + 1 },
      "name",
    );
    const { data: kRow } = await supabase
      .from("master_ketidaksesuaian")
      .select("id")
      .eq("name", ketKeys[i])
      .single();
    if (kRow?.id) {
      const subs = SUB_OPTIONS[ketKeys[i]] || [];
      for (let j = 0; j < subs.length; j++) {
        await upsertIgnore(
          "master_sub_ketidaksesuaian",
          { ketidaksesuaian_id: kRow.id, name: subs[j], sort_order: j + 1 },
          "ketidaksesuaian_id,name",
        );
      }
    }
  }

  // Prosedur
  for (let i = 0; i < PROSEDUR_DEFAULT.length; i++) {
    await upsertIgnore(
      "master_prosedur",
      { name: PROSEDUR_DEFAULT[i], sort_order: i + 1 },
      "name",
    );
  }

  // Jabatan
  for (let i = 0; i < JABATAN_DEFAULT.length; i++) {
    await upsertIgnore(
      "master_jabatan",
      { name: JABATAN_DEFAULT[i], sort_order: i + 1 },
      "name",
    );
  }

  // Alasan Observasi
  for (let i = 0; i < ALASAN_OBSERVASI_DEFAULT.length; i++) {
    await upsertIgnore(
      "master_alasan_observasi",
      { name: ALASAN_OBSERVASI_DEFAULT[i], sort_order: i + 1 },
      "name",
    );
  }
}

/** Fetch sites */
export async function fetchSites() {
  const c = getCached("sites");
  if (c) return c;
  const { data, error } = await supabase
    .from("master_sites")
    .select("id, name, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) return [];
  const result = (data || []).map((r) => r.name);
  setCached("sites", result);
  return result;
}

/** Fetch site locations untuk site tertentu */
export async function fetchSiteLocations(siteName) {
  if (!siteName) return [];
  const key = `site_locations_${siteName}`;
  const c = getCached(key);
  if (c) return c;
  const { data: siteRow } = await supabase
    .from("master_sites")
    .select("id")
    .eq("name", siteName)
    .single();
  if (!siteRow) return [];
  const { data, error } = await supabase
    .from("master_site_locations")
    .select("name")
    .eq("site_id", siteRow.id)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) return [];
  const result = (data || []).map((r) => r.name);
  setCached(key, result);
  return result;
}

/** Fetch ketidaksesuaian */
export async function fetchKetidaksesuaian() {
  const c = getCached("ketidaksesuaian");
  if (c) return c;
  const { data, error } = await supabase
    .from("master_ketidaksesuaian")
    .select("id, name, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) return [];
  const result = (data || []).map((r) => ({ id: r.id, name: r.name }));
  setCached("ketidaksesuaian", result);
  return result;
}

/** Fetch sub ketidaksesuaian untuk ketidaksesuaian tertentu */
export async function fetchSubKetidaksesuaian(ketidaksesuaianId) {
  if (!ketidaksesuaianId) return [];
  const key = `sub_ket_${ketidaksesuaianId}`;
  const c = getCached(key);
  if (c) return c;
  const { data, error } = await supabase
    .from("master_sub_ketidaksesuaian")
    .select("id, name")
    .eq("ketidaksesuaian_id", ketidaksesuaianId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) return [];
  const result = (data || []).map((r) => r.name);
  setCached(key, result);
  return result;
}

/** Fetch prosedur departemen */
export async function fetchProsedurDepartemen() {
  const c = getCached("prosedur_departemen");
  if (c) return c;
  const { data, error } = await supabase
    .from("master_prosedur_departemen")
    .select("id, name, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) return [];
  const result = (data || []).map((r) => ({ id: r.id, name: r.name }));
  setCached("prosedur_departemen", result);
  return result;
}

/** Fetch prosedur (optionally by departemenId) */
export async function fetchProsedur(departemenId = null) {
  const cacheKey = departemenId ? `prosedur_${departemenId}` : "prosedur";
  const c = getCached(cacheKey);
  if (c) return c;

  let query = supabase
    .from("master_prosedur")
    .select("id, name, sort_order, departemen_id")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (departemenId) {
    query = query.eq("departemen_id", departemenId);
  }

  const { data, error } = await query;
  if (error) return [];

  // Return array of strings for backward compatibility if no dept selected,
  // or logic needs to handle objects.
  // Existing code expects array of strings.
  // But if we filter by department, we likely want just names.
  const result = (data || []).map((r) => r.name);
  setCached(cacheKey, result);
  return result;
}

/** Fetch jabatan */
export async function fetchJabatan() {
  const c = getCached("jabatan");
  if (c) return c;
  const { data, error } = await supabase
    .from("master_jabatan")
    .select("id, name, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) return [];
  const result = (data || []).map((r) => ({ value: r.name, label: r.name }));
  setCached("jabatan", result);
  return result;
}

/** Bentuk SUB_OPTIONS untuk HazardForm dari DB */
export async function fetchKetidaksesuaianSubOptions() {
  const kets = await fetchKetidaksesuaian();
  if (!kets || kets.length === 0) return null;
  const subs = {};
  for (const k of kets) {
    const arr = await fetchSubKetidaksesuaian(k.id);
    subs[k.name] = arr || [];
  }
  return subs;
}

/** Fetch alasan observasi */
export async function fetchAlasanObservasi() {
  const c = getCached("alasan_observasi");
  if (c) return c;
  const { data, error } = await supabase
    .from("master_alasan_observasi")
    .select("id, name, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) return [];
  const result = (data || []).map((r) => r.name);
  setCached("alasan_observasi", result);
  return result;
}
