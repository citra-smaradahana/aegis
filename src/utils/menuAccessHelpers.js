/**
 * Helper untuk Pengaturan Menu (akses per jabatan, per site, override per user)
 */
import { supabase } from "../supabaseClient";
import { invalidateMasterDataCache } from "./masterDataHelpers";

/** Daftar menu yang bisa dikonfigurasi (urutan tampil) */
export const MENU_KEYS = [
  { key: "fit-to-work", label: "Fit To Work", icon: "👷" },
  { key: "fit-to-work-validation", label: "Validasi Fit To Work", icon: "✅" },
  { key: "daily-attendance", label: "Laporan (Daily Attendance)", icon: "📄" },
  { key: "take-5", label: "Take 5", icon: "⏰" },
  { key: "hazard", label: "Hazard", icon: "⚠️" },
  { key: "pto", label: "PTO", icon: "📋" },
];

/** Default menu untuk user biasa (jika tidak ada config di DB) */
const DEFAULT_REGULAR_MENUS = ["fit-to-work", "take-5", "hazard"];

/** Default menu untuk jabatan level supervisor (jika tidak ada config) */
const DEFAULT_SUPERVISOR_MENUS = [
  "fit-to-work",
  "fit-to-work-validation",
  "daily-attendance",
  "take-5",
  "hazard",
  "pto",
];

const DEFAULT_SUPERVISOR_JABATAN = [
  "Administrator",
  "Admin Site Project",
  "SHERQ Officer",
  "Field Leading Hand",
  "Plant Leading Hand",
  "Technical Service",
  "Asst. Penanggung Jawab Operasional",
  "Penanggung Jawab Operasional",
];

const cache = {};
const CACHE_TTL = 60 * 1000;

function getCached(key) {
  const entry = cache[key];
  if (!entry || Date.now() - entry.ts > CACHE_TTL) return null;
  return entry.data;
}

function setCached(key, data) {
  cache[key] = { data, ts: Date.now() };
}

export function invalidateMenuAccessCache() {
  Object.keys(cache).forEach((k) => delete cache[k]);
  invalidateMasterDataCache();
}

/**
 * Ambil daftar menu yang boleh diakses user.
 * Logika: (jabatan_menus ∪ user_menus) ∩ site_menus
 * Jika tidak ada config di DB, fallback ke default berdasarkan jabatan.
 */
export async function fetchAllowedMenusForUser(user) {
  if (!user?.id) return DEFAULT_REGULAR_MENUS;

  const cacheKey = `menus:${user.id}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const jabatanName = (user.jabatan || "").trim();
  const siteName = (user.site || "").trim();

  try {
    let jabatanMenus = [];
    let siteMenuKeys = null; // null = tidak filter (semua boleh)
    let userOverrides = [];

    if (jabatanName) {
      const { data: jabatanRow } = await supabase
        .from("master_jabatan")
        .select("id")
        .eq("name", jabatanName)
        .maybeSingle();

      if (jabatanRow?.id) {
        const { data: jm } = await supabase
          .from("master_jabatan_menu")
          .select("menu_key")
          .eq("jabatan_id", jabatanRow.id)
          .order("sort_order", { ascending: true });
        jabatanMenus = (jm || []).map((r) => r.menu_key);
      }
    }

    if (siteName) {
      const { data: siteRow } = await supabase
        .from("master_sites")
        .select("id")
        .eq("name", siteName)
        .maybeSingle();

      if (siteRow?.id) {
        const { data: sm } = await supabase
          .from("master_site_menu")
          .select("menu_key, enabled")
          .eq("site_id", siteRow.id);

        if (sm && sm.length > 0) {
          siteMenuKeys = new Set(sm.filter((r) => r.enabled).map((r) => r.menu_key));
        }
      }
    }

    const { data: um } = await supabase
      .from("user_menu")
      .select("menu_key")
      .eq("user_id", user.id);
    userOverrides = (um || []).map((r) => r.menu_key);

    // Jika user punya override, gunakan sebagai set lengkap (bisa tambah maupun hapus menu)
    let combined =
      userOverrides.length > 0 ? userOverrides : [...new Set([...jabatanMenus, ...userOverrides])];

    if (combined.length === 0) {
      combined =
        DEFAULT_SUPERVISOR_JABATAN.includes(jabatanName) ? DEFAULT_SUPERVISOR_MENUS : DEFAULT_REGULAR_MENUS;
    }

    let result = combined;
    if (siteMenuKeys !== null && siteMenuKeys.size > 0) {
      result = combined.filter((k) => siteMenuKeys.has(k));
    }

    const ordered = MENU_KEYS.filter((m) => result.includes(m.key)).map((m) => m.key);
    const rest = result.filter((k) => !ordered.includes(k));
    const final = [...ordered, ...rest];

    setCached(cacheKey, final);
    return final;
  } catch (e) {
    console.warn("fetchAllowedMenusForUser error:", e);
    return DEFAULT_SUPERVISOR_JABATAN.includes(jabatanName) ? DEFAULT_SUPERVISOR_MENUS : DEFAULT_REGULAR_MENUS;
  }
}

/** Cek apakah user punya akses ke menu tertentu */
export async function canAccessMenu(user, menuKey) {
  const menus = await fetchAllowedMenusForUser(user);
  return menus.includes(menuKey);
}

/** Cek sync (tanpa fetch) - untuk komponen yang sudah punya allowedMenus */
export function canAccessMenuSync(allowedMenus, menuKey) {
  return Array.isArray(allowedMenus) && allowedMenus.includes(menuKey);
}

// ------------ CRUD untuk Admin Pengaturan Menu ------------

/** Fetch menu default per jabatan */
export async function fetchJabatanMenus(jabatanId) {
  if (!jabatanId) return [];
  const { data } = await supabase
    .from("master_jabatan_menu")
    .select("menu_key, sort_order")
    .eq("jabatan_id", jabatanId)
    .order("sort_order", { ascending: true });
  return (data || []).map((r) => r.menu_key);
}

/** Simpan menu default per jabatan (replace) */
export async function saveJabatanMenus(jabatanId, menuKeys) {
  if (!jabatanId) return;
  await supabase.from("master_jabatan_menu").delete().eq("jabatan_id", jabatanId);
  if (menuKeys && menuKeys.length > 0) {
    await supabase.from("master_jabatan_menu").insert(
      menuKeys.map((k, i) => ({
        jabatan_id: jabatanId,
        menu_key: k,
        sort_order: i,
      }))
    );
  }
  invalidateMenuAccessCache();
}

/** Fetch menu per site (menu_key, enabled) */
export async function fetchSiteMenus(siteId) {
  if (!siteId) return [];
  const { data } = await supabase
    .from("master_site_menu")
    .select("menu_key, enabled, sort_order")
    .eq("site_id", siteId)
    .order("sort_order", { ascending: true });
  return data || [];
}

/** Simpan menu per site (array of { menu_key, enabled }) */
export async function saveSiteMenus(siteId, items) {
  if (!siteId) return;
  await supabase.from("master_site_menu").delete().eq("site_id", siteId);
  if (items && items.length > 0) {
    await supabase.from("master_site_menu").insert(
      items.map((item, i) => ({
        site_id: siteId,
        menu_key: item.menu_key,
        enabled: item.enabled !== false,
        sort_order: i,
      }))
    );
  }
  invalidateMenuAccessCache();
}

/** Fetch override menu per user */
export async function fetchUserMenus(userId) {
  if (!userId) return [];
  const { data } = await supabase.from("user_menu").select("menu_key").eq("user_id", userId);
  return (data || []).map((r) => r.menu_key);
}

/** Simpan override menu per user (additive - hanya menu tambahan) */
export async function saveUserMenus(userId, menuKeys) {
  if (!userId) return;
  await supabase.from("user_menu").delete().eq("user_id", userId);
  if (menuKeys && menuKeys.length > 0) {
    await supabase.from("user_menu").insert(menuKeys.map((k) => ({ user_id: userId, menu_key: k })));
  }
  invalidateMenuAccessCache();
}
