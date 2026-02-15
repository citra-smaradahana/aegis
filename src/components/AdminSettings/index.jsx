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
  insertProsedur,
  updateProsedur,
  deleteProsedur,
  fetchJabatanForAdmin,
  insertJabatan,
  updateJabatan,
  deleteJabatan,
  fetchAlasanObservasiForAdmin,
  insertAlasanObservasi,
  updateAlasanObservasi,
  deleteAlasanObservasi,
} from "../../utils/masterDataHelpers";

const TYPES = [
  { key: "site", label: "Site" },
  { key: "site_location", label: "Detail Lokasi" },
  { key: "ftw_settings", label: "Pengaturan Fit To Work" },
  { key: "ketidaksesuaian", label: "Ketidaksesuaian" },
  { key: "sub_ketidaksesuaian", label: "Sub Ketidaksesuaian" },
  { key: "prosedur", label: "Prosedur" },
  { key: "jabatan", label: "Jabatan" },
  { key: "alasan_observasi", label: "Alasan Observasi" },
];

function AdminSettings({ user, onBack }) {
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
    activeType === "site_location" || activeType === "sub_ketidaksesuaian";
  const isFTWSettings = activeType === "ftw_settings";

  const loadParentItems = async () => {
    if (activeType === "site_location") {
      const data = await fetchSitesForAdmin();
      setParentItems(data);
      setSelectedParentId((prev) => (data.length ? data[0]?.id || prev : null));
    } else if (activeType === "sub_ketidaksesuaian") {
      const data = await fetchKetidaksesuaianForAdmin();
      setParentItems(data);
      setSelectedParentId((prev) => (data.length ? data[0]?.id || prev : null));
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
      } else if (activeType === "prosedur") {
        const data = await fetchProsedurForAdmin();
        setItems(data);
      } else if (activeType === "jabatan") {
        const data = await fetchJabatanForAdmin();
        setItems(data);
      } else if (activeType === "alasan_observasi") {
        const data = await fetchAlasanObservasiForAdmin();
        setItems(data);
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
      } else if (activeType === "prosedur") {
        if (editingItem) await updateProsedur(editingItem.id, formName);
        else await insertProsedur(formName);
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
    activeType === "site_location" ? "Site" : "Ketidaksesuaian";

  const canImport =
    ["site", "ketidaksesuaian", "prosedur", "jabatan", "alasan_observasi"].includes(activeType) &&
    items.length === 0 &&
    !loading;

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
        maxWidth: 1000,
        margin: "0 auto",
        width: "100%",
        padding: "40px 20px",
      }}
    >
      <h2
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: "#60a5fa",
          margin: "0 0 24px 0",
        }}
      >
        Pengaturan Master Data
      </h2>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 20,
          borderBottom: "1px solid #374151",
          paddingBottom: 12,
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
              padding: "8px 14px",
              background: activeType === t.key ? "#60a5fa" : "#374151",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

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
  );
}

export default AdminSettings;
