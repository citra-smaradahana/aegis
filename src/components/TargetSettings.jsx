import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { CUSTOM_INPUT_SITES } from "../config/siteLocations";

const MODULES = [
  { key: "hazard", label: "Hazard Report" },
  { key: "take_5", label: "Take 5" },
  { key: "pto", label: "PTO" },
];

function TargetSettings({ user, onBack, embedded = false, darkTheme = false }) {
  const [activeModule, setActiveModule] = useState("hazard");
  const [targets, setTargets] = useState([]);
  const [jabatanList, setJabatanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Role Restriction Logic
  // Lock site selection if user is assigned to a specific site (not Head Office)
  const userSite = user?.site || "";
  const isRestricted =
    userSite && userSite !== "Head Office" && user?.jabatan !== "Administrator";

  // Filter state (untuk admin memfilter tabel)
  const [filterSite, setFilterSite] = useState("");

  // Form state untuk tambah/edit
  const [editingId, setEditingId] = useState(null);
  const [formSite, setFormSite] = useState(isRestricted ? userSite : "");
  const [formJabatan, setFormJabatan] = useState("");
  const [formTarget, setFormTarget] = useState(0);
  const formRef = useRef(null);

  useEffect(() => {
    fetchTargets();
  }, [activeModule]);

  // Reset formSite jika restricted user (safety check)
  useEffect(() => {
    if (isRestricted && userSite) {
      setFormSite(userSite);
    }
  }, [isRestricted, userSite]);

  // Fetch jabatan berdasarkan site yang dipilih
  const fetchJabatanList = async (site, includeJabatan = null) => {
    if (!site) {
      setJabatanList([]);
      return;
    }
    try {
      // 1. Get all available jabatans from users table for this site
      const { data, error: err } = await supabase
        .from("users")
        .select("jabatan")
        .not("jabatan", "is", null)
        .eq("site", site);

      if (err) throw err;

      let unique = [
        ...new Set((data || []).map((r) => r.jabatan).filter(Boolean)),
      ].sort();

      // 2. Filter out jabatans that already have a target for this module & site
      // (unless it's the jabatan currently being edited)
      if (targets.length > 0) {
        const existingJabatans = targets
          .filter((t) => t.site === site && t.jabatan !== includeJabatan)
          .map((t) => t.jabatan);

        unique = unique.filter((j) => !existingJabatans.includes(j));
      }

      // 3. Ensure the currently edited jabatan is always in the list
      if (includeJabatan && !unique.includes(includeJabatan)) {
        unique = [includeJabatan, ...unique].sort();
      }

      setJabatanList(unique);
    } catch (e) {
      console.error("Error fetching jabatan:", e);
      setJabatanList([]);
    }
  };

  const handleSiteChange = (newSite) => {
    setFormSite(newSite);
    setFormJabatan(""); // Reset jabatan saat site berubah
    fetchJabatanList(newSite);
  };

  useEffect(() => {
    if (formSite) {
      // Re-fetch jabatan list whenever site changes or targets update
      fetchJabatanList(formSite, editingId ? formJabatan : null);
    } else {
      setJabatanList([]);
    }
  }, [formSite, editingId, targets]); // Added targets dependency to refresh list after add/delete

  const fetchTargets = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from("target_per_jabatan_site")
        .select("*")
        .eq("module", activeModule)
        .order("site")
        .order("jabatan");

      // Jika restricted, hanya ambil data site tersebut
      if (isRestricted && userSite) {
        query = query.eq("site", userSite);
      }

      const { data, error: err } = await query;
      if (err) throw err;
      setTargets(data || []);
    } catch (e) {
      console.error("Error fetching targets:", e);
      setError(e.message || "Gagal memuat data target");
      setTargets([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormSite(isRestricted ? userSite : "");
    setFormJabatan("");
    setFormTarget(0);
  };

  // Reset hanya jabatan & target (site tetap) - setelah berhasil tambah
  const resetFormAfterAdd = () => {
    setEditingId(null);
    setFormJabatan("");
    setFormTarget(0);
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setFormSite(row.site);
    setFormJabatan(row.jabatan);
    setFormTarget(row.target_per_bulan || 0);
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSave = async () => {
    if (!formSite || !formJabatan) {
      setError("Site dan Jabatan wajib diisi");
      return;
    }
    if (formTarget < 0) {
      setError("Target tidak boleh negatif");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        module: activeModule,
        site: formSite,
        jabatan: formJabatan,
        target_per_bulan: Number(formTarget),
      };
      if (editingId) {
        const { error: err } = await supabase
          .from("target_per_jabatan_site")
          .update(payload)
          .eq("id", editingId);
        if (err) throw err;
        resetForm();
      } else {
        const { error: err } = await supabase
          .from("target_per_jabatan_site")
          .insert(payload);
        if (err) throw err;
        resetFormAfterAdd(); // Site tetap, hanya jabatan & target direset
      }
      fetchTargets();
    } catch (e) {
      console.error("Error saving target:", e);
      setError(e.message || "Gagal menyimpan target");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus target ini?")) return;
    setSaving(true);
    setError(null);
    try {
      const { error: err } = await supabase
        .from("target_per_jabatan_site")
        .delete()
        .eq("id", id);
      if (err) throw err;
      resetForm();
      fetchTargets();
    } catch (e) {
      console.error("Error deleting target:", e);
      setError(e.message || "Gagal menghapus target");
    } finally {
      setSaving(false);
    }
  };

  const moduleLabel =
    MODULES.find((m) => m.key === activeModule)?.label || activeModule;

  const isDark = !!darkTheme;

  return (
    <div
      style={{
        padding: embedded ? 0 : 24,
        maxWidth: embedded ? "100%" : 1000,
        width: embedded ? "100%" : "auto",
        margin: embedded ? 0 : "0 auto",
        background: embedded ? "transparent" : "#f9fafb",
        minHeight: embedded ? "auto" : "100vh",
        ...(embedded && {
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }),
      }}
    >
      {/* Header - seragam dengan tab lain */}
      <div
        style={{
          marginBottom: "30px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          flexShrink: 0,
        }}
      >
        {!embedded && onBack && (
          <button
            onClick={onBack}
            style={{
              alignSelf: "flex-start",
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              background: "#fff",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            ← Kembali
          </button>
        )}
        <h2
          style={{
            margin: 0,
            marginBottom: "10px",
            fontSize: 22,
            color: isDark ? "#ffffff" : "#111827",
          }}
        >
          ⚙️ Pengaturan Target per Jabatan & Site
        </h2>
        <p
          style={{
            color: isDark ? "rgba(255,255,255,0.9)" : "#6b7280",
            margin: 0,
            fontSize: 14,
          }}
        >
          Target diberikan per bulan untuk setiap kombinasi Jabatan dan Site.
        </p>
      </div>

      {/* Sub-tabs - seragam dengan tab utama */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 24,
          flexShrink: 0,
        }}
      >
        {MODULES.map((m) => (
          <button
            key={m.key}
            onClick={() => {
              setActiveModule(m.key);
              resetForm();
            }}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: isDark
                ? "1px solid rgba(255,255,255,0.3)"
                : "1px solid #d1d5db",
              background:
                activeModule === m.key
                  ? "#ea580c"
                  : isDark
                    ? "rgba(255,255,255,0.1)"
                    : "#fff",
              color:
                activeModule === m.key
                  ? "#fff"
                  : isDark
                    ? "#ffffff"
                    : "#374151",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: activeModule === m.key ? 600 : 400,
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {error && (
        <div
          style={{
            padding: 12,
            background: "#fef2f2",
            color: "#dc2626",
            borderRadius: 8,
            marginBottom: 16,
            flexShrink: 0,
          }}
        >
          {error}
        </div>
      )}

      {/* Form tambah/edit - card style seragam */}
      <div
        ref={formRef}
        style={{
          background: "#fff",
          padding: 20,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          marginBottom: 24,
          boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
          flexShrink: 0,
        }}
      >
        <h3
          style={{
            margin: "0 0 16px 0",
            fontSize: 16,
            color: "#111827",
            fontWeight: 600,
          }}
        >
          {editingId ? "Edit Target" : "Tambah Target"}
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
            alignItems: "flex-end",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 4,
                color: "#111827",
              }}
            >
              Site
            </label>
            <select
              value={formSite}
              onChange={(e) => handleSiteChange(e.target.value)}
              disabled={isRestricted}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #d1d5db",
                fontSize: 14,
                color: "#111827",
                background: isRestricted ? "#f3f4f6" : "#fff",
              }}
            >
              <option value="">-- Pilih Site --</option>
              {CUSTOM_INPUT_SITES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 4,
                color: "#111827",
              }}
            >
              Jabatan
            </label>
            <select
              value={formJabatan}
              onChange={(e) => setFormJabatan(e.target.value)}
              disabled={!formSite}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #d1d5db",
                fontSize: 14,
                color: "#111827",
              }}
            >
              <option value="">
                {formSite
                  ? "-- Pilih Jabatan --"
                  : "-- Pilih Site terlebih dahulu --"}
              </option>
              {jabatanList.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 4,
                color: "#111827",
              }}
            >
              Target per Bulan
            </label>
            <input
              type="number"
              min={0}
              value={formTarget}
              onChange={(e) => setFormTarget(Number(e.target.value) || 0)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #d1d5db",
                fontSize: 14,
                color: "#111827",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                border: "none",
                background: "#ea580c",
                color: "#fff",
                cursor: saving ? "not-allowed" : "pointer",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {saving ? "Menyimpan..." : editingId ? "Simpan" : "Tambah"}
            </button>
            {editingId && (
              <button
                onClick={resetForm}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  color: "#374151",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                Batal
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabel target - kontainer scroll, halaman fix */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          overflow: "hidden",
          boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
          ...(embedded && {
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }),
        }}
      >
        <h3
          style={{
            margin: 0,
            padding: 16,
            borderBottom: "1px solid #e5e7eb",
            fontSize: 16,
            color: "#111827",
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          Target {moduleLabel}
        </h3>
        {loading ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: "#374151",
              fontSize: 14,
            }}
          >
            Memuat...
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
              overflowY: embedded ? "auto" : "visible",
              flex: embedded ? 1 : undefined,
              minHeight: embedded ? 0 : undefined,
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th
                    style={{
                      padding: 12,
                      textAlign: "left",
                      borderBottom: "1px solid #e5e7eb",
                      color: "#111827",
                      fontWeight: 600,
                    }}
                  >
                    Site
                  </th>
                  <th
                    style={{
                      padding: 12,
                      textAlign: "left",
                      borderBottom: "1px solid #e5e7eb",
                      color: "#111827",
                      fontWeight: 600,
                    }}
                  >
                    Jabatan
                  </th>
                  <th
                    style={{
                      padding: 12,
                      textAlign: "right",
                      borderBottom: "1px solid #e5e7eb",
                      color: "#111827",
                      fontWeight: 600,
                    }}
                  >
                    Target/Bulan
                  </th>
                  <th
                    style={{
                      padding: 12,
                      width: 120,
                      borderBottom: "1px solid #e5e7eb",
                      color: "#111827",
                      fontWeight: 600,
                    }}
                  >
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {targets.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        padding: 40,
                        textAlign: "center",
                        color: "#374151",
                        fontSize: 14,
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      Belum ada target. Tambah target di atas.
                    </td>
                  </tr>
                ) : (
                  targets
                    .filter((row) => !filterSite || row.site === filterSite)
                    .map((row) => (
                      <tr
                        key={row.id}
                        style={{ borderBottom: "1px solid #f3f4f6" }}
                      >
                        <td style={{ padding: 12, color: "#111827" }}>
                          {row.site}
                        </td>
                        <td style={{ padding: 12, color: "#111827" }}>
                          {row.jabatan}
                        </td>
                        <td
                          style={{
                            padding: 12,
                            textAlign: "right",
                            color: "#111827",
                          }}
                        >
                          {row.target_per_bulan}
                        </td>
                        <td style={{ padding: 12 }}>
                          <button
                            onClick={() => handleEdit(row)}
                            style={{
                              padding: "4px 10px",
                              marginRight: 8,
                              borderRadius: 4,
                              border: "1px solid #d1d5db",
                              background: "#fff",
                              color: "#374151",
                              cursor: "pointer",
                              fontSize: 12,
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(row.id)}
                            disabled={saving}
                            style={{
                              padding: "4px 10px",
                              borderRadius: 4,
                              border: "1px solid #fecaca",
                              background: "#fef2f2",
                              color: "#dc2626",
                              cursor: saving ? "not-allowed" : "pointer",
                              fontSize: 12,
                            }}
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default TargetSettings;
