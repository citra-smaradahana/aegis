import React, { useState, useEffect } from "react";
import {
  fetchSitesForAdmin,
  fetchSitesWithFTWStatus,
  updateSiteFTWEnabled,
  insertSite,
  importSeedData,
  updateSite,
  deleteSite,
  fetchSiteLocationsForAdmin,
  insertSiteLocation,
  updateSiteLocation,
  deleteSiteLocation,
  fetchKetidaksesuaianForAdmin,
  insertKetidaksesuaian,
  updateKetidaksesuaian,
  deleteKetidaksesuaian,
  fetchSubKetidaksesuaianForAdmin,
  insertSubKetidaksesuaian,
  updateSubKetidaksesuaian,
  deleteSubKetidaksesuaian,
  fetchProsedurForAdmin,
  fetchProsedurDepartemenForAdmin,
  fetchProsedurForAdminByDepartemenId,
  insertProsedur,
  insertProsedurWithDepartemen,
  updateProsedur,
  deleteProsedur,
  insertProsedurDepartemen,
  updateProsedurDepartemen,
  deleteProsedurDepartemen,
  fetchJabatanForAdmin,
  insertJabatan,
  updateJabatan,
  deleteJabatan,
  fetchAlasanObservasiForAdmin,
  insertAlasanObservasi,
  updateAlasanObservasi,
  deleteAlasanObservasi,
} from "../../utils/masterDataHelpers";
import {
  MENU_KEYS,
  fetchJabatanMenus,
  saveJabatanMenus,
  fetchSiteMenus,
  saveSiteMenus,
  fetchUserMenus,
  saveUserMenus,
} from "../../utils/menuAccessHelpers";
import { supabase } from "../../supabaseClient";

const TYPES = [
  { key: "site", label: "Site" },
  { key: "site_location", label: "Detail Lokasi" },
  { key: "ftw_settings", label: "Pengaturan Fit To Work" },
  { key: "ketidaksesuaian", label: "Ketidaksesuaian" },
  { key: "sub_ketidaksesuaian", label: "Sub Ketidaksesuaian" },
  { key: "prosedur_departemen", label: "Prosedur Departemen" },
  { key: "prosedur", label: "Prosedur" },
  { key: "jabatan", label: "Jabatan" },
  { key: "alasan_observasi", label: "Alasan Observasi" },
  { key: "menu_access", label: "Pengaturan Menu" },
];

function AdminSettings({ user, onBack }) {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth <= 768);
  const [activeType, setActiveType] = useState("site");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const [parentItems, setParentItems] = useState([]);
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formName, setFormName] = useState("");
  const [importing, setImporting] = useState(false);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);

  const needsParent =
    activeType === "site_location" ||
    activeType === "sub_ketidaksesuaian" ||
    activeType === "prosedur";
  const isFTWSettings = activeType === "ftw_settings";
  const isMenuAccess = activeType === "menu_access";

  // State untuk Pengaturan Menu
  const [menuSubTab, setMenuSubTab] = useState("jabatan");
  const [menuJabatanId, setMenuJabatanId] = useState(null);
  const [menuSiteId, setMenuSiteId] = useState(null);
  const [menuUserId, setMenuUserId] = useState(null);
  const [menuSelectedKeys, setMenuSelectedKeys] = useState([]);
  const [menuSiteItems, setMenuSiteItems] = useState([]);
  const [menuJabatanDefault, setMenuJabatanDefault] = useState([]);
  const [menuUsers, setMenuUsers] = useState([]);
  const [menuUserSiteFilter, setMenuUserSiteFilter] = useState("");
  const [menuUserJabatanFilter, setMenuUserJabatanFilter] = useState("");
  const [menuUserEditModal, setMenuUserEditModal] = useState(null);

  const loadParentItems = async () => {
    if (activeType === "site_location") {
      const data = await fetchSitesForAdmin();
      setParentItems(data);
      setSelectedParentId((prev) => (data.length ? data[0]?.id || prev : null));
    } else if (activeType === "sub_ketidaksesuaian") {
      const data = await fetchKetidaksesuaianForAdmin();
      setParentItems(data);
      setSelectedParentId((prev) => (data.length ? data[0]?.id || prev : null));
    } else if (activeType === "prosedur") {
      const data = await fetchProsedurDepartemenForAdmin();
      setParentItems(data);
      setSelectedParentId((prev) => (data.length ? data[0]?.id || prev : null));
    } else if (activeType === "menu_access") {
      const [jabatanData, siteData] = await Promise.all([
        fetchJabatanForAdmin(),
        fetchSitesForAdmin(),
      ]);
      setParentItems(jabatanData);
      setItems(siteData);
      if (!menuJabatanId && jabatanData.length) setMenuJabatanId(jabatanData[0].id);
      if (!menuSiteId && siteData.length) setMenuSiteId(siteData[0].id);
    } else {
      setParentItems([]);
      setSelectedParentId(null);
    }
  };

  const loadItems = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeType === "site") {
        const data = await fetchSitesForAdmin();
        setItems(data);
      } else if (activeType === "ftw_settings") {
        const data = await fetchSitesWithFTWStatus();
        setItems(data);
      } else if (activeType === "site_location") {
        if (selectedParentId) {
          const data = await fetchSiteLocationsForAdmin(selectedParentId);
          setItems(data);
        } else setItems([]);
      } else if (activeType === "ketidaksesuaian") {
        const data = await fetchKetidaksesuaianForAdmin();
        setItems(data);
      } else if (activeType === "sub_ketidaksesuaian") {
        if (selectedParentId) {
          const data = await fetchSubKetidaksesuaianForAdmin(selectedParentId);
          setItems(data);
        } else setItems([]);
      } else if (activeType === "prosedur_departemen") {
        const data = await fetchProsedurDepartemenForAdmin();
        setItems(data);
      } else if (activeType === "prosedur") {
        if (selectedParentId) {
          const data = await fetchProsedurForAdminByDepartemenId(selectedParentId);
          setItems(data);
        } else {
          setItems([]);
        }
      } else if (activeType === "jabatan") {
        const data = await fetchJabatanForAdmin();
        setItems(data);
      } else if (activeType === "alasan_observasi") {
        const data = await fetchAlasanObservasiForAdmin();
        setItems(data);
      } else if (activeType === "menu_access") {
        const { data: usersData } = await supabase.from("users").select("id, nama, jabatan, site").order("nama");
        setMenuUsers(usersData || []);
      }
    } catch (err) {
      setError(err?.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParentItems();
  }, [activeType]);

  useEffect(() => {
    loadItems();
  }, [activeType, selectedParentId]);

  // Load menu config saat sub-tab atau selection berubah (Pengaturan Menu)
  useEffect(() => {
    if (activeType !== "menu_access") return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (menuSubTab === "jabatan" && menuJabatanId) {
          const keys = await fetchJabatanMenus(menuJabatanId);
          if (!cancelled) setMenuSelectedKeys(keys);
        } else if (menuSubTab === "site" && menuSiteId) {
          const rows = await fetchSiteMenus(menuSiteId);
          if (!cancelled) {
            setMenuSiteItems(
              MENU_KEYS.map((m) => {
                const r = rows.find((x) => x.menu_key === m.key);
                return { menu_key: m.key, enabled: r ? r.enabled : true };
              })
            );
          }
        } else if (menuSubTab === "user" && menuUserId) {
          const [overrideKeys, u] = await Promise.all([
            fetchUserMenus(menuUserId),
            supabase.from("users").select("jabatan").eq("id", menuUserId).maybeSingle(),
          ]);
          if (!cancelled) {
            const jabatanName = u?.data?.jabatan || "";
            const { data: jRow } = await supabase
              .from("master_jabatan")
              .select("id")
              .eq("name", jabatanName)
              .maybeSingle();
            const jabatanKeys = jRow?.id ? await fetchJabatanMenus(jRow.id) : [];
            setMenuJabatanDefault(jabatanKeys);
            setMenuSelectedKeys(overrideKeys.length > 0 ? overrideKeys : jabatanKeys);
          }
        } else {
          if (!cancelled) setMenuSelectedKeys([]);
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || "Gagal memuat");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [activeType, menuSubTab, menuJabatanId, menuSiteId, menuUserId]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const openAdd = () => {
    setEditingItem(null);
    setFormName("");
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormName(item.name);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormName("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (activeType === "site") {
        if (editingItem) await updateSite(editingItem.id, formName);
        else await insertSite(formName);
      } else if (activeType === "site_location") {
        if (!selectedParentId) {
          setError("Pilih site terlebih dahulu");
          setSaving(false);
          return;
        }
        if (editingItem) await updateSiteLocation(editingItem.id, formName);
        else await insertSiteLocation(selectedParentId, formName);
      } else if (activeType === "ketidaksesuaian") {
        if (editingItem) await updateKetidaksesuaian(editingItem.id, formName);
        else await insertKetidaksesuaian(formName);
      } else if (activeType === "sub_ketidaksesuaian") {
        if (!selectedParentId) {
          setError("Pilih ketidaksesuaian terlebih dahulu");
          setSaving(false);
          return;
        }
        if (editingItem)
          await updateSubKetidaksesuaian(editingItem.id, formName);
        else await insertSubKetidaksesuaian(selectedParentId, formName);
      } else if (activeType === "prosedur_departemen") {
        if (editingItem) await updateProsedurDepartemen(editingItem.id, formName);
        else await insertProsedurDepartemen(formName);
      } else if (activeType === "prosedur") {
        if (!selectedParentId) {
          setError("Pilih Prosedur Departemen terlebih dahulu");
          setSaving(false);
          return;
        }
        if (editingItem) {
          await updateProsedur(editingItem.id, formName);
        } else {
          await insertProsedurWithDepartemen(selectedParentId, formName);
        }
      } else if (activeType === "jabatan") {
        if (editingItem) await updateJabatan(editingItem.id, formName);
        else await insertJabatan(formName);
      } else if (activeType === "alasan_observasi") {
        if (editingItem)
          await updateAlasanObservasi(editingItem.id, formName);
        else await insertAlasanObservasi(formName);
      }
      closeForm();
      loadItems();
      if (needsParent) loadParentItems();
    } catch (err) {
      setError(err?.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteConfirm = (item) => setDeleteConfirmItem(item);
  const closeDeleteConfirm = () => setDeleteConfirmItem(null);

  const handleDeleteConfirm = async () => {
    const item = deleteConfirmItem;
    if (!item) return;
    closeDeleteConfirm();
    try {
      if (activeType === "site") await deleteSite(item.id);
      else if (activeType === "site_location")
        await deleteSiteLocation(item.id);
      else if (activeType === "ketidaksesuaian")
        await deleteKetidaksesuaian(item.id);
      else if (activeType === "sub_ketidaksesuaian")
        await deleteSubKetidaksesuaian(item.id);
      else if (activeType === "prosedur_departemen")
        await deleteProsedurDepartemen(item.id);
      else if (activeType === "prosedur") await deleteProsedur(item.id);
      else if (activeType === "jabatan") await deleteJabatan(item.id);
      else if (activeType === "alasan_observasi")
        await deleteAlasanObservasi(item.id);
      loadItems();
      if (needsParent) loadParentItems();
    } catch (err) {
      setError(err?.message || "Gagal menghapus");
    }
  };

  const parentLabel =
    activeType === "site_location"
      ? "Site"
      : activeType === "sub_ketidaksesuaian"
      ? "Ketidaksesuaian"
      : activeType === "prosedur"
      ? "Prosedur Departemen"
      : "";

  const canImport =
    ["site", "ketidaksesuaian", "prosedur", "jabatan", "alasan_observasi"].includes(activeType) &&
    items.length === 0 &&
    !loading;

  const handleSaveMenuConfig = async () => {
    setSaving(true);
    setError(null);
    try {
      if (menuSubTab === "jabatan" && menuJabatanId) {
        await saveJabatanMenus(menuJabatanId, menuSelectedKeys);
      } else if (menuSubTab === "site" && menuSiteId) {
        await saveSiteMenus(menuSiteId, menuSiteItems);
      } else if (menuSubTab === "user" && menuUserId) {
        await saveUserMenus(menuUserId, menuSelectedKeys);
      }
    } catch (err) {
      setError(err?.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const handleFTWToggle = async (siteItem) => {
    const newVal = !siteItem.fit_to_work_enabled;
    setSaving(true);
    setError(null);
    try {
      await updateSiteFTWEnabled(siteItem.id, newVal);
      setItems((prev) =>
        prev.map((s) =>
          s.id === siteItem.id ? { ...s, fit_to_work_enabled: newVal } : s
        )
      );
    } catch (err) {
      setError(err?.message || "Gagal mengubah pengaturan");
    } finally {
      setSaving(false);
    }
  };

  const handleImportSeed = async () => {
    setImporting(true);
    setError(null);
    try {
      await importSeedData();
      await loadParentItems();
      await loadItems();
    } catch (err) {
      setError(err?.message || "Gagal import data awal");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div
      style={{
        width: "100%",
        height: isMobile ? "auto" : "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: isMobile ? "visible" : "hidden",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          width: "100%",
          padding: isMobile ? "40px 20px" : "24px 20px",
          flex: isMobile ? "none" : 1,
          display: "flex",
          flexDirection: "column",
          minHeight: isMobile ? "auto" : 0,
        }}
      >
        <h2
          style={{
            flexShrink: 0,
            fontSize: 28,
            fontWeight: 800,
            color: "#60a5fa",
            margin: "0 0 20px 0",
          }}
        >
          Pengaturan Master Data
        </h2>

        {/* Tab bar - seperti Validasi Fit To Work */}
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            backgroundColor: "#1f2937",
            borderRadius: "12px",
            padding: "4px",
            marginBottom: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
            overflowX: "auto",
            ...(isMobile && {
              position: "sticky",
              top: 0,
              zIndex: 100,
            }),
          }}
        >
          {TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setActiveType(t.key);
                setShowForm(false);
              }}
              style={{
                flex: isMobile ? "0 0 auto" : 1,
                minWidth: 90,
                padding: isMobile ? "10px 12px" : "12px 16px",
                border: "none",
                borderRadius: "8px",
                background: activeType === t.key ? "#3b82f6" : "transparent",
                color: activeType === t.key ? "#fff" : "#9ca3af",
                fontWeight: activeType === t.key ? 600 : 500,
                fontSize: isMobile ? "12px" : "13px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content container - scrollable */}
        <div
          style={{
            flex: isMobile ? "none" : 1,
            minHeight: isMobile ? "auto" : 0,
            overflowY: isMobile ? "visible" : "auto",
            overflowX: "hidden",
          }}
        >
      {isMenuAccess ? (
        <div style={{ padding: "16px 0" }}>
          {error && (
            <div style={{ padding: 12, background: "#7f1d1d", color: "#fecaca", borderRadius: 8, marginBottom: 16 }}>
              {error}
            </div>
          )}

          {/* Sub-tab bar */}
          <div
            style={{
              display: "flex",
              backgroundColor: "#111827",
              borderRadius: 10,
              padding: 4,
              marginBottom: 24,
              border: "1px solid #374151",
            }}
          >
            {["jabatan", "site", "user"].map((tab) => (
              <button
                key={tab}
                onClick={() => setMenuSubTab(tab)}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  background: menuSubTab === tab ? "#3b82f6" : "transparent",
                  color: menuSubTab === tab ? "#fff" : "#9ca3af",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  cursor: "pointer",
                  fontWeight: menuSubTab === tab ? 600 : 500,
                  transition: "all 0.2s ease",
                }}
              >
                {tab === "jabatan" ? "Default per Jabatan" : tab === "site" ? "Menu per Site" : "Override per User"}
              </button>
            ))}
          </div>

          {/* Card container */}
          <div
            style={{
              background: "#1f2937",
              border: "1px solid #374151",
              borderRadius: 12,
              padding: 24,
              marginBottom: 20,
            }}
          >
          {menuSubTab === "jabatan" && (
            <>
              <label style={{ display: "block", marginBottom: 8, color: "#9ca3af", fontSize: 13, fontWeight: 500 }}>Pilih Jabatan</label>
              <select
                value={menuJabatanId || ""}
                onChange={(e) => setMenuJabatanId(e.target.value || null)}
                style={{
                  padding: "10px 14px",
                  background: "#111827",
                  border: "1px solid #374151",
                  borderRadius: 8,
                  color: "#e5e7eb",
                  fontSize: 14,
                  minWidth: 280,
                  marginBottom: 16,
                }}
              >
                <option value="">-- Pilih Jabatan --</option>
                {parentItems.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <p style={{ color: "#6b7280", fontSize: 12, marginBottom: 16, lineHeight: 1.5 }}>
                Centang menu yang menjadi default untuk jabatan ini.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {MENU_KEYS.map((m) => (
                  <label key={m.key} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", color: "#e5e7eb", fontSize: 14 }}>
                    <input
                      type="checkbox"
                      checked={menuSelectedKeys.includes(m.key)}
                      onChange={(e) => {
                        if (e.target.checked) setMenuSelectedKeys((prev) => [...prev, m.key]);
                        else setMenuSelectedKeys((prev) => prev.filter((k) => k !== m.key));
                      }}
                      style={{ width: 18, height: 18, cursor: "pointer" }}
                    />
                    <span>{m.icon} {m.label}</span>
                  </label>
                ))}
              </div>
            </>
          )}

          {menuSubTab === "site" && (
            <>
              <label style={{ display: "block", marginBottom: 8, color: "#9ca3af", fontSize: 13, fontWeight: 500 }}>Pilih Site</label>
              <select
                value={menuSiteId || ""}
                onChange={(e) => setMenuSiteId(e.target.value || null)}
                style={{
                  padding: "10px 14px",
                  background: "#111827",
                  border: "1px solid #374151",
                  borderRadius: 8,
                  color: "#e5e7eb",
                  fontSize: 14,
                  minWidth: 280,
                  marginBottom: 16,
                }}
              >
                <option value="">-- Pilih Site --</option>
                {items.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <p style={{ color: "#6b7280", fontSize: 12, marginBottom: 16, lineHeight: 1.5 }}>
                Centang menu yang tersedia untuk site ini. Kosongkan = semua menu dari jabatan/user tetap tampil.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {MENU_KEYS.map((m) => {
                  const item = menuSiteItems.find((x) => x.menu_key === m.key) || { menu_key: m.key, enabled: true };
                  return (
                    <label key={m.key} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", color: "#e5e7eb", fontSize: 14 }}>
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={(e) => {
                          setMenuSiteItems((prev) => {
                            const base = prev.length ? prev : MENU_KEYS.map((x) => ({ menu_key: x.key, enabled: true }));
                            return base.map((x) => (x.menu_key === m.key ? { ...x, enabled: e.target.checked } : x));
                          });
                        }}
                        style={{ width: 18, height: 18, cursor: "pointer" }}
                      />
                      <span>{m.icon} {m.label}</span>
                    </label>
                  );
                })}
              </div>
            </>
          )}

          {menuSubTab === "user" && (
            <>
              <p style={{ color: "#6b7280", fontSize: 12, marginBottom: 20, lineHeight: 1.5 }}>
                Filter Site dan Jabatan, lalu pilih user untuk mengubah menu tambahan (override).
              </p>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 20 }}>
                <div style={{ flex: "1 1 200px" }}>
                  <label style={{ display: "block", marginBottom: 8, color: "#9ca3af", fontSize: 13, fontWeight: 500 }}>Filter Site</label>
                  <select
                    value={menuUserSiteFilter}
                    onChange={(e) => setMenuUserSiteFilter(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "#111827",
                      border: "1px solid #374151",
                      borderRadius: 8,
                      color: "#e5e7eb",
                      fontSize: 14,
                    }}
                  >
                    <option value="">-- Semua Site --</option>
                    {[...new Set(menuUsers.map((u) => u.site).filter(Boolean))].sort().map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: "1 1 220px" }}>
                  <label style={{ display: "block", marginBottom: 8, color: "#9ca3af", fontSize: 13, fontWeight: 500 }}>Filter Jabatan</label>
                  <select
                    value={menuUserJabatanFilter}
                    onChange={(e) => setMenuUserJabatanFilter(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "#111827",
                      border: "1px solid #374151",
                      borderRadius: 8,
                      color: "#e5e7eb",
                      fontSize: 14,
                    }}
                  >
                    <option value="">-- Semua Jabatan --</option>
                    {[...new Set(menuUsers.map((u) => u.jabatan).filter(Boolean))].sort().map((j) => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div
                style={{
                  background: "#111827",
                  border: "1px solid #374151",
                  borderRadius: 10,
                  overflow: "hidden",
                  maxHeight: 340,
                  overflowY: "auto",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#1f2937", color: "#9ca3af" }}>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600 }}>Nama</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600 }}>Site</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600 }}>Jabatan</th>
                      <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, fontWeight: 600, width: 120 }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menuUsers
                      .filter((u) => (!menuUserSiteFilter || u.site === menuUserSiteFilter) && (!menuUserJabatanFilter || u.jabatan === menuUserJabatanFilter))
                      .map((u) => (
                        <tr key={u.id} style={{ borderTop: "1px solid #374151" }}>
                          <td style={{ padding: "12px 16px", color: "#e5e7eb", fontSize: 14 }}>{u.nama || "-"}</td>
                          <td style={{ padding: "12px 16px", color: "#94a3b8", fontSize: 13 }}>{u.site || "-"}</td>
                          <td style={{ padding: "12px 16px", color: "#94a3b8", fontSize: 13 }}>{u.jabatan || "-"}</td>
                          <td style={{ padding: "12px 16px", textAlign: "right" }}>
                            <button
                              type="button"
                              onClick={() => {
                                setMenuUserId(u.id);
                                setMenuUserEditModal(u);
                              }}
                              style={{
                                padding: "8px 14px",
                                background: "#3b82f6",
                                color: "#fff",
                                border: "none",
                                borderRadius: 8,
                                fontSize: 13,
                                cursor: "pointer",
                                fontWeight: 500,
                              }}
                            >
                              Ubah Menu
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {menuUsers.filter((u) => (!menuUserSiteFilter || u.site === menuUserSiteFilter) && (!menuUserJabatanFilter || u.jabatan === menuUserJabatanFilter)).length === 0 && (
                  <div style={{ padding: 40, textAlign: "center", color: "#6b7280", fontSize: 14 }}>
                    Tidak ada user. Sesuaikan filter Site/Jabatan.
                  </div>
                )}
              </div>
              {menuUserEditModal && (
                <div
                  style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.65)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000,
                    padding: 24,
                  }}
                  onClick={() => setMenuUserEditModal(null)}
                >
                  <div
                    style={{
                      background: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: 12,
                      padding: 28,
                      maxWidth: 440,
                      width: "100%",
                      maxHeight: "90vh",
                      overflowY: "auto",
                      boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 style={{ margin: "0 0 6px 0", color: "#e5e7eb", fontSize: 18, fontWeight: 600 }}>
                      Ubah Menu: {menuUserEditModal.nama}
                    </h3>
                    <p style={{ margin: "0 0 20px 0", color: "#6b7280", fontSize: 13 }}>
                      {menuUserEditModal.site} · {menuUserEditModal.jabatan}
                    </p>
                    <p style={{ color: "#9ca3af", fontSize: 12, marginBottom: 6 }}>
                      Default jabatan: {menuJabatanDefault.join(", ") || "(belum diatur)"}
                    </p>
                    <p style={{ color: "#6b7280", fontSize: 12, marginBottom: 16, lineHeight: 1.5 }}>
                      Centang menu yang boleh diakses user. Bisa menambah atau menghapus dari default jabatan (untuk site lain nanti).
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                      {MENU_KEYS.map((m) => (
                        <label key={m.key} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", color: "#e5e7eb", fontSize: 14 }}>
                          <input
                            type="checkbox"
                            checked={menuSelectedKeys.includes(m.key)}
                            onChange={(e) => {
                              if (e.target.checked) setMenuSelectedKeys((prev) => [...prev, m.key]);
                              else setMenuSelectedKeys((prev) => prev.filter((k) => k !== m.key));
                            }}
                            style={{ width: 18, height: 18, cursor: "pointer" }}
                          />
                          <span>{m.icon} {m.label}</span>
                        </label>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", paddingTop: 4 }}>
                      <button
                        type="button"
                        onClick={() => setMenuUserEditModal(null)}
                        style={{
                          padding: "10px 20px",
                          background: "#374151",
                          color: "#e5e7eb",
                          border: "none",
                          borderRadius: 8,
                          fontSize: 14,
                          cursor: "pointer",
                        }}
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setSaving(true);
                          setError(null);
                          try {
                            await saveUserMenus(menuUserId, menuSelectedKeys);
                            setMenuUserEditModal(null);
                          } catch (err) {
                            setError(err?.message || "Gagal menyimpan");
                          } finally {
                            setSaving(false);
                          }
                        }}
                        disabled={saving}
                        style={{
                          padding: "10px 20px",
                          background: saving ? "#6b7280" : "#22c55e",
                          color: "#fff",
                          border: "none",
                          borderRadius: 8,
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: saving ? "not-allowed" : "pointer",
                        }}
                      >
                        {saving ? "Menyimpan..." : "Simpan"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          </div>

          {menuSubTab !== "user" && (
            <button
              onClick={handleSaveMenuConfig}
              disabled={saving || loading}
              style={{
                padding: "12px 28px",
                background: saving || loading ? "#6b7280" : "#22c55e",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: saving || loading ? "not-allowed" : "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }}
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          )}
        </div>
      ) : (
      <>
      {needsParent && (
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              marginBottom: 6,
              color: "#9ca3af",
              fontSize: 14,
            }}
          >
            Pilih {parentLabel}
          </label>
          <select
            value={selectedParentId || ""}
            onChange={(e) => setSelectedParentId(e.target.value || null)}
            style={{
              padding: "10px 12px",
              background: "#111827",
              border: "1px solid #374151",
              borderRadius: 8,
              color: "#e5e7eb",
              fontSize: 14,
              minWidth: 240,
            }}
          >
            <option value="">-- Pilih --</option>
            {parentItems.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <span style={{ color: "#9ca3af", fontSize: 14 }}>
          {TYPES.find((t) => t.key === activeType)?.label || ""}
        </span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {isFTWSettings && (
            <span style={{ color: "#6b7280", fontSize: 12 }}>
              Toggle OFF = site tidak wajib FTW (user tetap boleh mengisi)
            </span>
          )}
          {canImport && (
            <button
              onClick={handleImportSeed}
              disabled={importing}
              style={{
                padding: "8px 16px",
                background: importing ? "#6b7280" : "#22c55e",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 14,
                cursor: importing ? "not-allowed" : "pointer",
                fontWeight: 500,
              }}
            >
              {importing ? "Mengimport..." : "Import Data Awal"}
            </button>
          )}
          {!isFTWSettings && (
          <button
            onClick={openAdd}
            disabled={needsParent && !selectedParentId}
          style={{
            padding: "8px 16px",
            background:
              needsParent && !selectedParentId ? "#4b5563" : "#60a5fa",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 14,
            cursor:
              needsParent && !selectedParentId ? "not-allowed" : "pointer",
          }}
        >
          + Tambah
        </button>
          )}
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: 12,
            background: "#7f1d1d",
            color: "#fecaca",
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>
          Memuat...
        </div>
      ) : (
        <div
          style={{
            background: "#1f2937",
            border: "1px solid #374151",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {items.length === 0 ? (
            <div
              style={{
                padding: 48,
                textAlign: "center",
                color: "#9ca3af",
              }}
            >
              {needsParent && !selectedParentId
                ? `Pilih ${parentLabel} terlebih dahulu`
                : isFTWSettings
                ? "Belum ada site. Tambah site di tab Site terlebih dahulu."
                : "Belum ada data. Klik Tambah untuk menambah."}
            </div>
          ) : isFTWSettings ? (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#111827", color: "#9ca3af" }}>
                  <th
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    Site
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: 12,
                      fontWeight: 600,
                      width: 180,
                    }}
                  >
                    Wajib Fit To Work
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    style={{ borderTop: "1px solid #374151" }}
                  >
                    <td
                      style={{
                        padding: "12px 16px",
                        color: "#e5e7eb",
                        fontSize: 14,
                      }}
                    >
                      {item.name}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        verticalAlign: "middle",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleFTWToggle(item)}
                        disabled={saving}
                        style={{
                          padding: "6px 14px",
                          background: item.fit_to_work_enabled ? "#22c55e" : "#6b7280",
                          color: "#fff",
                          border: "none",
                          borderRadius: 8,
                          fontSize: 13,
                          cursor: saving ? "not-allowed" : "pointer",
                          fontWeight: 500,
                        }}
                      >
                        {item.fit_to_work_enabled ? "ON" : "OFF"}
                      </button>
                      <span
                        style={{
                          marginLeft: 10,
                          color: "#9ca3af",
                          fontSize: 12,
                        }}
                      >
                        {item.fit_to_work_enabled ? "Wajib" : "Tidak wajib (opsional)"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#111827", color: "#9ca3af" }}>
                  <th
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    Nama
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      textAlign: "right",
                      fontSize: 12,
                      fontWeight: 600,
                      width: 140,
                    }}
                  >
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      borderTop: "1px solid #374151",
                    }}
                  >
                    <td
                      style={{
                        padding: "12px 16px",
                        color: "#e5e7eb",
                        fontSize: 14,
                      }}
                    >
                      {item.name}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        textAlign: "right",
                      }}
                    >
                      <button
                        onClick={() => openEdit(item)}
                        style={{
                          padding: "6px 12px",
                          background: "#374151",
                          color: "#e5e7eb",
                          border: "none",
                          borderRadius: 6,
                          fontSize: 12,
                          cursor: "pointer",
                          marginRight: 8,
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(item)}
                        style={{
                          padding: "6px 12px",
                          background: "#7f1d1d",
                          color: "#fecaca",
                          border: "none",
                          borderRadius: 6,
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      </>
    )}
        </div>
        {/* End content container */}

      {deleteConfirmItem && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1001,
            padding: 20,
          }}
          onClick={closeDeleteConfirm}
        >
          <div
            style={{
              background: "#1f2937",
              border: "1px solid #374151",
              borderRadius: 12,
              padding: 24,
              maxWidth: 400,
              width: "100%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                margin: "0 0 16px 0",
                color: "#e5e7eb",
                fontSize: 18,
              }}
            >
              Konfirmasi Hapus
            </h3>
            <p
              style={{
                margin: "0 0 24px 0",
                color: "#9ca3af",
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              Hapus &quot;{deleteConfirmItem.name}&quot;?
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={closeDeleteConfirm}
                style={{
                  padding: "10px 20px",
                  background: "#374151",
                  color: "#e5e7eb",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                style={{
                  padding: "10px 20px",
                  background: "#7f1d1d",
                  color: "#fecaca",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
          onClick={closeForm}
        >
          <div
            style={{
              background: "#1f2937",
              border: "1px solid #374151",
              borderRadius: 12,
              padding: 24,
              maxWidth: 400,
              width: "100%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                margin: "0 0 20px 0",
                color: "#e5e7eb",
                fontSize: 18,
              }}
            >
              {editingItem ? "Edit" : "Tambah"}{" "}
              {TYPES.find((t) => t.key === activeType)?.label || ""}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    color: "#9ca3af",
                    fontSize: 14,
                  }}
                >
                  Nama *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: "#111827",
                    border: "1px solid #374151",
                    borderRadius: 8,
                    color: "#e5e7eb",
                    fontSize: 14,
                  }}
                  placeholder="Nama"
                />
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={closeForm}
                  style={{
                    padding: "10px 20px",
                    background: "#374151",
                    color: "#e5e7eb",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "10px 20px",
                    background: saving ? "#6b7280" : "#60a5fa",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: saving ? "not-allowed" : "pointer",
                  }}
                >
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default AdminSettings;
