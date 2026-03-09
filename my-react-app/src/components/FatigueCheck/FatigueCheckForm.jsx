import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../supabaseClient";
import { sessionManager } from "../../utils/sessionManager";
import { getTodayWITA } from "../../utils/dateTimeHelpers";
import { getLocationOptionsAsync, getLocationOptions } from "../../config/siteLocations";
import { fetchUsersForFatigueCheck } from "./fatigueCheckHelpers";
import MobileHeader from "../MobileHeader";
import MobileBottomNavigation from "../MobileBottomNavigation";
import SelectModalWithSearch from "../SelectModalWithSearch";
import FatigueCheckPrint from "./FatigueCheckPrint";
import "./FatigueCheck.css";

const SHIFT_OPTIONS = ["Shift I", "Shift II"];

const TEMPAT_TINGGAL_OPTIONS = [
  { value: "", label: "" },
  { value: "Mess", label: "Mess" },
  { value: "Luar Mess", label: "Luar Mess" },
];

const SOBRIETY_ITEMS = [
  { key: "soberity_1", label: "Sobriety 1 (Berjalan Sempoyongan)" },
  { key: "soberity_2", label: "Sobriety 2 (Menurunkan 1 (satu) kaki sebelum 10 detik)" },
  { key: "soberity_3", label: "Sobriety 3 (Tidak bisa memutar dengan 1 (satu) kaki)" },
  { key: "soberity_4", label: "Sobriety 4 (Kurang tanggap instruksi yang sederhana)" },
];

const TINDAKAN_UNFIT_OPTIONS = [
  "Minum Kafein/Kopi Pahit",
  "Minum air putih",
  "Melakukan perenggangan badan / Olahraga ringan",
  "Istirahat tenang (tanpa tidur) 5-15 menit",
  "Tidur sejenak 15-30 menit (napping)",
  "Tidur > 1 Jam",
  "Dipulangkan ke rumah / Mess",
  "Cuci muka dengan air dingin",
  "Lainnya",
];

const emptyCheck = () => ({
  user_id: "",
  nama: "",
  nrp: "",
  jabatan: "",
  hari_kerja: "",
  jam_tidur: "",
  jam_periksa: "",
  soberity_1: false,
  soberity_2: false,
  soberity_3: false,
  soberity_4: false,
  kontak_radio: "",
  kontak_tatap_muka: "",
  tekanan_darah: "",
  fit: false,
  unfit: false,
  mess_luar_mess: "",
  tindakan_unfit: "",
});

const FatigueCheckForm = ({ user: userProp, onBack, onNavigate, tasklistTodoCount = 0 }) => {
  const sessionUser = userProp || sessionManager.getSession();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [user, setUser] = useState(null);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth <= 768);
  const [workerList, setWorkerList] = useState([]);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [workerModalIndex, setWorkerModalIndex] = useState(null);
  const [workerSearchQuery, setWorkerSearchQuery] = useState("");
  const [showTempatTinggalModal, setShowTempatTinggalModal] = useState(false);
  const [tempatTinggalModalIndex, setTempatTinggalModalIndex] = useState(null);
  const [tempatTinggalSearchQuery, setTempatTinggalSearchQuery] = useState("");
  const [showTindakanUnfitModal, setShowTindakanUnfitModal] = useState(false);
  const [tindakanUnfitModalIndex, setTindakanUnfitModalIndex] = useState(null);
  const [tindakanUnfitSearchQuery, setTindakanUnfitSearchQuery] = useState("");
  const [locationOptions, setLocationOptions] = useState([]);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [shiftSearchQuery, setShiftSearchQuery] = useState("");
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);

  const [formData, setFormData] = useState({
    date: getTodayWITA(),
    shift: "",
    site: "",
    location: "",
  });

  const [checks, setChecks] = useState([emptyCheck()]);

  const btnPrimary = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "10px 20px",
    borderRadius: 12,
    fontWeight: 600,
    color: "#fff",
    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
    border: "none",
    boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
    cursor: "pointer",
  };
  const btnDanger = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    borderRadius: 8,
    fontWeight: 500,
    fontSize: 14,
    color: "#fff",
    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    border: "none",
    cursor: "pointer",
  };
  const btnOutline = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 20px",
    borderRadius: 12,
    fontWeight: 600,
    color: "#4f46e5",
    background: "#fff",
    border: "2px solid #a5b4fc",
    cursor: "pointer",
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Lokasi Pemeriksaan: opsi sesuai site (sama Take 5, Hazard Report)
  useEffect(() => {
    if (!formData.site) {
      setLocationOptions(getLocationOptions(formData.site));
      return;
    }
    let cancelled = false;
    getLocationOptionsAsync(formData.site).then((opts) => {
      if (!cancelled) setLocationOptions(opts || getLocationOptions(formData.site) || []);
    });
    return () => { cancelled = true; };
  }, [formData.site]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const authUser = (await supabase.auth.getUser())?.data?.user;
      const userId = authUser?.id || sessionUser?.id;
      if (!userId && !sessionUser) return;

      let userData = null;
      if (userId) {
        const res = await supabase.from("users").select("*").eq("id", userId).maybeSingle();
        userData = res?.data;
      }
      setUser(userData || sessionUser);

      const siteValue = userData?.site || sessionUser?.site || "";
      setFormData((prev) => ({
        ...prev,
        site: siteValue,
      }));

      const u = userData || sessionUser;
      if (u?.site) {
        const list = await fetchUsersForFatigueCheck(u);
        setWorkerList(list || []);
      }
    } catch (e) {
      console.error("Error loading fatigue check data:", e);
      setErrorMsg(e.message || "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  };

  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckChange = (index, field, value) => {
    const next = [...checks];
    next[index] = { ...next[index], [field]: value };
    setChecks(next);
  };

  const addCheck = () => setChecks([...checks, emptyCheck()]);

  const removeCheck = (index) => {
    if (checks.length <= 1) return;
    const next = [...checks];
    next.splice(index, 1);
    setChecks(next);
  };

  const openWorkerModal = (index) => {
    setWorkerModalIndex(index);
    setWorkerSearchQuery("");
    setShowWorkerModal(true);
  };

  const selectWorker = (w, indexOverride) => {
    const idx = indexOverride ?? workerModalIndex;
    if (idx === null || idx === undefined) return;
    setChecks((prev) => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        user_id: w.id,
        nama: w.nama || "",
        nrp: w.nrp || "",
        jabatan: w.jabatan || "",
        hari_kerja: String(w.hari_masuk ?? ""),
        jam_tidur: String(w.sleep_today ?? w.sleep_48h ?? ""),
      };
      return next;
    });
    setShowWorkerModal(false);
    setWorkerModalIndex(null);
  };

  /** Pekerja yang bisa dipilih untuk pengecekan idx (exclude yang sudah dipilih di pengecekan lain) */
  const getAvailableWorkersForIndex = (idx) =>
    workerList.filter((w) => !checks.some((c, i) => i !== idx && c.user_id === w.id));

  const filteredWorkers = getAvailableWorkersForIndex(workerModalIndex ?? 0).filter((w) =>
    (w.nama || "").toLowerCase().includes((workerSearchQuery || "").toLowerCase())
  );

  const getValidationErrors = () => {
    const errors = [];
    if (!formData.date?.trim()) errors.push("Hari / Tanggal");
    if (formData.date && formData.date > getTodayWITA()) errors.push("Tanggal tidak boleh melebihi hari ini");
    if (!formData.shift?.trim()) errors.push("Shift Kerja");
    if (!formData.site?.trim()) errors.push("Site");
    if (!formData.location?.trim()) errors.push("Lokasi Pemeriksaan");
    const selectedUserIds = new Set();
    checks.forEach((c, i) => {
      if (!c.user_id) errors.push(`Pengecekan ${i + 1}: Pilih Nama Pekerja`);
      else if (selectedUserIds.has(c.user_id)) errors.push(`Pengecekan ${i + 1}: Nama pekerja tidak boleh duplikat`);
      else if (!c.jam_periksa?.trim()) errors.push(`Pengecekan ${i + 1}: Jam Periksa`);
      else if (!c.mess_luar_mess?.trim()) errors.push(`Pengecekan ${i + 1}: Tempat Tinggal`);
      else if (!c.fit && !c.unfit) errors.push(`Pengecekan ${i + 1}: Pilih Fit atau Unfit`);
      if (c.user_id) selectedUserIds.add(c.user_id);
    });
    return errors;
  };

  const handleSave = () => {
    const errs = getValidationErrors();
    if (errs.length > 0) {
      setShowValidationModal(true);
      return;
    }
    setShowConfirmSave(true);
  };

  const doSave = async () => {
    try {
      if (!user) {
        alert("Sesi habis, silakan login ulang.");
        return;
      }
      setShowConfirmSave(false);

      const payload = {
        date: formData.date,
        shift: formData.shift,
        site: formData.site,
        location: formData.location,
        inspector_id: user.id,
        inspector_name: user.nama || "",
        inspector_jabatan: user.jabatan || "",
        checks: checks.filter((c) => c.user_id),
        status: "Closed",
        approver_id: user.id,
        approver_name: user.nama || "",
        approver_jabatan: user.jabatan || "",
      };

      const { error } = await supabase.from("fatigue_checks").insert(payload).select().single();
      if (error) throw error;

      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
        if (onBack) onBack();
      }, 500);
    } catch (err) {
      console.error("Gagal menyimpan Fatigue Check:", err);
      alert(`Gagal menyimpan: ${err.message}`);
    }
  };

  if (loading) return <div className="p-8 text-center">Memuat data...</div>;
  if (errorMsg)
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 mb-4">{errorMsg}</p>
        <button onClick={onBack} style={btnOutline}>← Kembali</button>
      </div>
    );

  const canAccess = ["Field Leading Hand", "Plant Leading Hand"].includes(sessionUser?.jabatan || "");
  if (!canAccess) {
    return (
      <div className="p-8 text-center">
        <p className="text-amber-600 mb-4">Hanya Field Leading Hand atau Plant Leading Hand yang dapat mengisi Fatigue Check.</p>
        <button onClick={onBack} style={btnOutline}>← Kembali</button>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        minHeight: isMobile ? "100vh" : "100vh",
        background: isMobile ? "#f8fafc" : "transparent",
        paddingBottom: isMobile ? "calc(90px + env(safe-area-inset-bottom))" : 0,
      }}
    >
      {isMobile && (
        <MobileHeader
          user={user || sessionUser}
          onBack={onBack}
          title="Fatigue Check Report"
        />
      )}

      <div style={{ padding: isMobile ? "16px" : "24px", maxWidth: 900, margin: "0 auto", paddingTop: isMobile ? 76 : undefined }}>
        {!isMobile && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#111827" }}>
              Formulir Pemeriksaan Kelelahan (Fatigue Check)
            </h1>
            <button onClick={onBack} style={btnOutline}>← Kembali</button>
          </div>
        )}

        {/* Header */}
        <div className="fatigue-check-section" style={{ marginBottom: 24 }}>
          <div className="fatigue-check-section-header">Data Umum</div>
          <div style={{ padding: 24, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            <div className="fatigue-check-field">
              <label className="fatigue-check-field-label">Hari / Tanggal</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleHeaderChange}
                max={getTodayWITA()}
                className="fatigue-check-field-value"
                style={{ width: "100%" }}
              />
            </div>
            <div className="fatigue-check-field">
              <label className="fatigue-check-field-label">Shift Kerja</label>
              {isMobile ? (
                <div
                  onClick={() => { setShiftSearchQuery(""); setShowShiftModal(true); }}
                  className="fatigue-check-dropdown-trigger"
                >
                  {formData.shift || "-- Pilih Shift --"} ▼
                </div>
              ) : (
                <select
                  name="shift"
                  value={formData.shift}
                  onChange={handleHeaderChange}
                  className="fatigue-check-field-value"
                  style={{ width: "100%" }}
                >
                  <option value="">-- Pilih Shift --</option>
                  {SHIFT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="fatigue-check-field">
              <label className="fatigue-check-field-label">Site</label>
              <input
                type="text"
                name="site"
                value={formData.site}
                readOnly
                className="fatigue-check-field-value readonly"
                style={{ width: "100%", cursor: "not-allowed" }}
              />
            </div>
            <div className="fatigue-check-field">
              <label className="fatigue-check-field-label">Lokasi Pemeriksaan</label>
              {isMobile ? (
                <div
                  onClick={() => { setLocationSearchQuery(""); setShowLocationModal(true); }}
                  className="fatigue-check-dropdown-trigger"
                >
                  {formData.location || "-- Pilih Lokasi --"} ▼
                </div>
              ) : (
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleHeaderChange}
                  className="fatigue-check-field-value"
                  style={{ width: "100%" }}
                >
                  <option value="">-- Pilih Lokasi --</option>
                  {locationOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Pengecekan per pekerja */}
        <div className="fatigue-check-section">
          <div className="fatigue-check-section-header">Pengecekan Pekerja</div>
          <div style={{ padding: 24 }}>
            {checks.map((check, idx) => (
              <div key={idx} className="fatigue-check-card">
                <div className="fatigue-check-card-header">
                  <span className="fatigue-check-card-title">Pengecekan #{idx + 1}</span>
                  <button onClick={() => removeCheck(idx)} style={btnDanger} disabled={checks.length <= 1}>
                    ✕ Hapus
                  </button>
                </div>

                <div className="fatigue-check-grid" style={{ marginBottom: 16 }}>
                  <div className="fatigue-check-field">
                    <label className="fatigue-check-field-label">Nama Pekerja *</label>
                    {isMobile ? (
                      <div
                        onClick={() => openWorkerModal(idx)}
                        className="fatigue-check-dropdown-trigger"
                        style={{ color: check.nama ? "#0f172a" : "#475569" }}
                      >
                        {check.nama || "-- Pilih Pekerja --"} ▼
                      </div>
                    ) : (
                      <select
                        value={check.user_id}
                        onChange={(e) => {
                          const id = e.target.value;
                          const w = getAvailableWorkersForIndex(idx).find((x) => x.id === id);
                          if (w) selectWorker(w, idx);
                        }}
                        className="fatigue-check-field-value"
                        style={{ width: "100%" }}
                      >
                        <option value="">-- Pilih Pekerja --</option>
                        {getAvailableWorkersForIndex(idx).map((w) => (
                          <option key={w.id} value={w.id}>{w.nama}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="fatigue-check-field">
                    <label className="fatigue-check-field-label">NIK/NRP</label>
                    <input type="text" value={check.nrp} readOnly className="fatigue-check-field-value readonly" style={{ width: "100%" }} />
                  </div>
                  <div className="fatigue-check-field">
                    <label className="fatigue-check-field-label">Jabatan</label>
                    <input type="text" value={check.jabatan} readOnly className="fatigue-check-field-value readonly" style={{ width: "100%" }} />
                  </div>
                  <div className="fatigue-check-field">
                    <label className="fatigue-check-field-label">Hari Kerja</label>
                    <input type="text" value={check.hari_kerja} readOnly className="fatigue-check-field-value readonly" style={{ width: "100%" }} />
                  </div>
                  <div className="fatigue-check-field">
                    <label className="fatigue-check-field-label">Jam Tidur 1x24</label>
                    <input type="text" value={check.jam_tidur} readOnly className="fatigue-check-field-value readonly" style={{ width: "100%" }} />
                  </div>
                  <div className="fatigue-check-field">
                    <label className="fatigue-check-field-label">Jam Periksa *</label>
                    <input
                      type="time"
                      value={check.jam_periksa}
                      onChange={(e) => handleCheckChange(idx, "jam_periksa", e.target.value)}
                      className="fatigue-check-field-value"
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>

                <div className="fatigue-check-sobriety-list">
                  <div className="fatigue-check-sobriety-title">Sobriety Test</div>
                  <div className="fatigue-check-sobriety-hint">Centang jika terdapat temuan</div>
                  {SOBRIETY_ITEMS.map((item) => (
                    <div key={item.key} className="fatigue-check-sobriety-row">
                      <span className="fatigue-check-sobriety-label">{item.label}</span>
                      <label className="fatigue-check-sobriety-checkbox">
                        <input
                          type="checkbox"
                          checked={check[item.key]}
                          onChange={(e) => handleCheckChange(idx, item.key, e.target.checked)}
                        />
                        <span className="fatigue-check-checkbox-label">Unfit</span>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="fatigue-check-grid" style={{ marginBottom: 16 }}>
                  <div className="fatigue-check-field">
                    <label className="fatigue-check-field-label">Kontak Radio (Jam)</label>
                    <input
                      type="time"
                      value={check.kontak_radio || ""}
                      onChange={(e) => handleCheckChange(idx, "kontak_radio", e.target.value)}
                      className="fatigue-check-field-value"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div className="fatigue-check-field">
                    <label className="fatigue-check-field-label">Tatap Muka (Jam)</label>
                    <input
                      type="time"
                      value={check.kontak_tatap_muka || ""}
                      onChange={(e) => handleCheckChange(idx, "kontak_tatap_muka", e.target.value)}
                      className="fatigue-check-field-value"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div className="fatigue-check-field">
                    <label className="fatigue-check-field-label">Tekanan Darah</label>
                    <input
                      type="text"
                      value={check.tekanan_darah}
                      onChange={(e) => handleCheckChange(idx, "tekanan_darah", e.target.value)}
                      placeholder="120/80"
                      className="fatigue-check-field-value"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div className="fatigue-check-field">
                    <label className="fatigue-check-field-label">Tempat Tinggal *</label>
                    {isMobile ? (
                      <div
                        onClick={() => {
                          setTempatTinggalModalIndex(idx);
                          setTempatTinggalSearchQuery("");
                          setShowTempatTinggalModal(true);
                        }}
                        className="fatigue-check-dropdown-trigger"
                      >
                        {check.mess_luar_mess || "-- Pilih --"} ▼
                      </div>
                    ) : (
                      <select
                        value={check.mess_luar_mess}
                        onChange={(e) => handleCheckChange(idx, "mess_luar_mess", e.target.value)}
                        className="fatigue-check-field-value"
                        style={{ width: "100%" }}
                      >
                        {TEMPAT_TINGGAL_OPTIONS.map((opt) => (
                          <option key={opt.value || "empty"} value={opt.value}>{opt.label || "-- Pilih --"}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div className="fatigue-check-field fatigue-check-fit-unfit" style={{ marginBottom: 16 }}>
                  <label className="fatigue-check-field-label">Kriteria Fit / Unfit *</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setChecks((prev) => {
                          const next = [...prev];
                          next[idx] = { ...next[idx], fit: true, unfit: false };
                          return next;
                        });
                      }}
                      style={{
                        padding: "12px 20px",
                        backgroundColor: check.fit ? "#10b981" : "rgba(0,0,0,0)",
                        color: check.fit ? "white" : "#10b981",
                        border: "2px solid #10b981",
                        borderRadius: 8,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        minWidth: isMobile ? 100 : 120,
                      }}
                    >
                      Fit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setChecks((prev) => {
                          const next = [...prev];
                          next[idx] = { ...next[idx], fit: false, unfit: true };
                          return next;
                        });
                      }}
                      style={{
                        padding: "12px 20px",
                        backgroundColor: check.unfit ? "#ef4444" : "rgba(0,0,0,0)",
                        color: check.unfit ? "white" : "#ef4444",
                        border: "2px solid #ef4444",
                        borderRadius: 8,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        minWidth: isMobile ? 100 : 120,
                      }}
                    >
                      Unfit
                    </button>
                  </div>
                </div>

                {check.unfit && (
                  <div className="fatigue-check-field">
                    <label className="fatigue-check-field-label">Tindakan jika Unfit</label>
                    {isMobile ? (
                      <div
                        onClick={() => {
                          setTindakanUnfitModalIndex(idx);
                          setTindakanUnfitSearchQuery("");
                          setShowTindakanUnfitModal(true);
                        }}
                        className="fatigue-check-dropdown-trigger"
                      >
                        {check.tindakan_unfit || "-- Pilih --"} ▼
                      </div>
                    ) : (
                      <select
                        value={check.tindakan_unfit}
                        onChange={(e) => handleCheckChange(idx, "tindakan_unfit", e.target.value)}
                        className="fatigue-check-field-value"
                        style={{ width: "100%" }}
                      >
                        <option value="">-- Pilih --</option>
                        {TINDAKAN_UNFIT_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addCheck}
              className="fatigue-check-add-btn"
              style={{ ...btnPrimary, padding: "12px 24px", fontSize: 15, width: "100%", marginTop: 8 }}
            >
              + Tambah Pengecekan
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 24, marginBottom: isMobile ? 32 : 0, justifyContent: isMobile ? "stretch" : "flex-end", flexWrap: "wrap" }}>
          {!isMobile && (
            <>
              <button onClick={onBack} style={btnOutline}>Batal</button>
              <button
                onClick={() => setShowPreview(true)}
                style={btnOutline}
              >
                👁️ Lihat Preview
              </button>
            </>
          )}
          <button onClick={handleSave} style={{ ...btnPrimary, width: isMobile ? "100%" : undefined }}>💾 Simpan Laporan</button>
        </div>
      </div>

      {/* Modal Pilih Pekerja (Mobile) */}
      {isMobile && showWorkerModal && (
        <SelectModalWithSearch
          title="Pilih Pekerja"
          options={filteredWorkers.map((w) => w.nama)}
          searchQuery={workerSearchQuery}
          onSearchChange={setWorkerSearchQuery}
          show={showWorkerModal}
          onClose={() => {
            setShowWorkerModal(false);
            setWorkerModalIndex(null);
          }}
          onSelect={(nama) => {
            const w = filteredWorkers.find((x) => x.nama === nama);
            if (w) selectWorker(w);
          }}
          placeholder="Ketik nama pekerja..."
        />
      )}

      {/* Modal Shift (Mobile) */}
      {isMobile && showShiftModal && (
        <SelectModalWithSearch
          title="Pilih Shift"
          options={SHIFT_OPTIONS}
          searchQuery={shiftSearchQuery}
          onSearchChange={setShiftSearchQuery}
          show={showShiftModal}
          onClose={() => setShowShiftModal(false)}
          onSelect={(val) => {
            handleHeaderChange({ target: { name: "shift", value: val } });
            setShowShiftModal(false);
          }}
          placeholder="Ketik untuk mencari..."
        />
      )}

      {/* Modal Lokasi Pemeriksaan (Mobile) */}
      {isMobile && showLocationModal && (
        <SelectModalWithSearch
          title="Pilih Lokasi Pemeriksaan"
          options={locationOptions}
          searchQuery={locationSearchQuery}
          onSearchChange={setLocationSearchQuery}
          show={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          onSelect={(val) => {
            handleHeaderChange({ target: { name: "location", value: val } });
            setShowLocationModal(false);
          }}
          placeholder="Ketik untuk mencari..."
        />
      )}

      {/* Modal Tempat Tinggal (Mobile) */}
      {isMobile && showTempatTinggalModal && (
        <SelectModalWithSearch
          title="Tempat Tinggal"
          options={["-- Pilih --", "Mess", "Luar Mess"]}
          searchQuery={tempatTinggalSearchQuery}
          onSearchChange={setTempatTinggalSearchQuery}
          show={showTempatTinggalModal}
          onClose={() => {
            setShowTempatTinggalModal(false);
            setTempatTinggalModalIndex(null);
          }}
          onSelect={(val) => {
            if (tempatTinggalModalIndex !== null) {
              handleCheckChange(tempatTinggalModalIndex, "mess_luar_mess", val === "-- Pilih --" ? "" : val);
            }
            setShowTempatTinggalModal(false);
            setTempatTinggalModalIndex(null);
          }}
          placeholder="Ketik untuk mencari..."
        />
      )}

      {/* Modal Tindakan jika Unfit (Mobile) */}
      {isMobile && showTindakanUnfitModal && (
        <SelectModalWithSearch
          title="Tindakan jika Unfit"
          options={["-- Pilih --", ...TINDAKAN_UNFIT_OPTIONS]}
          searchQuery={tindakanUnfitSearchQuery}
          onSearchChange={setTindakanUnfitSearchQuery}
          show={showTindakanUnfitModal}
          onClose={() => {
            setShowTindakanUnfitModal(false);
            setTindakanUnfitModalIndex(null);
          }}
          onSelect={(val) => {
            if (tindakanUnfitModalIndex !== null) {
              handleCheckChange(tindakanUnfitModalIndex, "tindakan_unfit", val === "-- Pilih --" ? "" : val);
            }
            setShowTindakanUnfitModal(false);
            setTindakanUnfitModalIndex(null);
          }}
          placeholder="Ketik untuk mencari..."
        />
      )}

      {/* Modal Preview */}
      {showPreview && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.6)",
            padding: 20,
          }}
          onClick={() => setShowPreview(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              width: "95vw",
              maxWidth: 1200,
              maxHeight: "90vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: 16, borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>Preview Cetak PDF</h3>
              <button
                onClick={() => setShowPreview(false)}
                style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#6b7280" }}
              >
                ✕
              </button>
            </div>
            <div style={{ overflow: "auto", padding: 24, flex: 1, minHeight: 0 }}>
              <FatigueCheckPrint
                report={{
                  date: formData.date,
                  shift: formData.shift,
                  site: formData.site,
                  location: formData.location,
                  inspector_name: user?.nama || sessionUser?.nama,
                  inspector_jabatan: user?.jabatan || sessionUser?.jabatan,
                  checks: checks,
                }}
              />
            </div>
            <div style={{ padding: 16, borderTop: "1px solid #e5e7eb" }}>
              <button onClick={() => setShowPreview(false)} style={btnOutline}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Validasi */}
      {showValidationModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setShowValidationModal(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 20,
              maxWidth: 340,
              width: "100%",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12, color: "#0f172a" }}>Lengkapi data berikut</div>
            <ul style={{ margin: "0 0 16px 0", paddingLeft: 20, color: "#1f2937", fontSize: 14, lineHeight: 1.8 }}>
              {getValidationErrors().map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setShowValidationModal(false)}
              style={{
                width: "100%",
                padding: 12,
                background: "#4f46e5",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Baik
            </button>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Simpan */}
      {showConfirmSave && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
            padding: 16,
          }}
          onClick={() => setShowConfirmSave(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 24,
              maxWidth: 360,
              width: "100%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ margin: "0 0 24px 0", fontSize: 16, textAlign: "center", color: "#0f172a" }}>
              Apakah anda yakin menyimpan laporan Fatigue Check ini?
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => setShowConfirmSave(false)} style={btnOutline}>Batal</button>
              <button onClick={doSave} style={btnPrimary}>Ya, Simpan</button>
            </div>
          </div>
        </div>
      )}

      {showSuccessToast && (
        <div
          style={{
            position: "fixed",
            top: isMobile ? 80 : 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 2100,
            background: "#10b981",
            color: "#fff",
            padding: "14px 24px",
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          Laporan Fatigue Check berhasil disimpan!
        </div>
      )}

      {isMobile && onNavigate && (
        <MobileBottomNavigation
          activeTab={null}
          tasklistTodoCount={tasklistTodoCount}
          onNavigate={(tab) => {
            if (tab === "home") onNavigate("dashboard");
            else if (tab === "tasklist") onNavigate("tasklist");
          }}
        />
      )}
    </div>
  );
};

export default FatigueCheckForm;
