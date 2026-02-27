import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../supabaseClient";
import Cropper from "react-easy-crop";
import getCroppedImg from "../Dropzone/cropImageUtil";
import SelectModalWithSearch from "../SelectModalWithSearch";
import MobileHeader from "../MobileHeader";
import MobileBottomNavigation from "../MobileBottomNavigation";
import {
  shouldUseLocationSelector,
  getLocationOptions,
  getLocationOptionsAsync,
  allowsCustomInput,
  CUSTOM_INPUT_SITES,
} from "../../config/siteLocations";
import { getTodayWITA } from "../../utils/dateTimeHelpers";
import { fetchProsedur, fetchAlasanObservasi, fetchProsedurDepartemen } from "../../utils/masterDataHelpers";

const alasanObservasiFallback = [
  "Pekerja Baru", "Kinerja Pekerja Kurang Baik", "Tes Praktek", "Kinerja Pekerja Baik",
  "Observasi Rutin", "Baru Terjadi Insiden", "Pekerja Dengan Pengetahuan Terbatas",
];

const prosedurFallback = [
  "Prosedur Kerja Aman", "Prosedur Penggunaan APD", "Prosedur Operasi Mesin",
  "Prosedur Pekerjaan di Ketinggian", "Prosedur Pekerjaan Panas",
  "Prosedur Pengangkatan Manual", "Prosedur Pekerjaan di Ruang Terbatas",
];

// Modal untuk memilih person (observer, observee, PIC) - return id
const PersonSelectModal = ({
  show,
  onClose,
  title,
  options,
  value,
  onSelect,
  searchQuery,
  onSearchChange,
}) => {
  if (!show) return null;
  const filtered = options
    .filter((o) =>
      (o.nama || "").toLowerCase().includes((searchQuery || "").toLowerCase())
    )
    .sort((a, b) => (a.nama || "").localeCompare(b.nama || "", "id"));
  const getDisplayName = (o) => `${o.nama || ""} - ${o.jabatan || ""}`.trim();
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 70,
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 1100,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: 16, borderBottom: "1px solid #e5e7eb", flexShrink: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>{title}</div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Ketik untuk mencari..."
            autoComplete="off"
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              fontSize: 16,
              boxSizing: "border-box",
            }}
          />
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          <div
            onClick={() => onSelect(null)}
            style={{
              padding: "14px 16px",
              fontSize: 16,
              color: "#6b7280",
              cursor: "pointer",
              borderBottom: "1px solid #f3f4f6",
            }}
          >
            Tidak ada (Kosongkan)
          </div>
          {filtered.map((o) => (
            <div
              key={o.id}
              onClick={() => onSelect(o.id)}
              style={{
                padding: "14px 16px",
                fontSize: 16,
                color: "#1f2937",
                cursor: "pointer",
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              {getDisplayName(o)}
            </div>
          ))}
          {filtered.length === 0 && options.length > 0 && (
            <div style={{ padding: 24, textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
              Tidak ada yang sesuai
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function PTOFormMobile({ user, onBack, onNavigate, tasklistTodoCount = 0 }) {
  const [formData, setFormData] = useState({
    tanggal: getTodayWITA(),
    site: user?.site || "",
    detailLokasi: "",
    alasanObservasi: "",
    prosedur: "",
    observerTambahan: "",
    observee: "",
    pekerjaanYangDilakukan: "",
    langkahKerjaAman: null,
    apdSesuai: null,
    areaKerjaAman: null,
    peralatanAman: null,
    peduliKeselamatan: null,
    pahamResikoProsedur: null,
    tindakanPerbaikan: "",
    picTindakLanjut: "",
    fotoTemuan: null,
  });

  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [sites, setSites] = useState([]);
  const [observers, setObservers] = useState([]);
  const [observees, setObservees] = useState([]);
  const [pics, setPICs] = useState([]);
  const [alasanObservasiOptions, setAlasanObservasiOptions] = useState(alasanObservasiFallback);
  const [prosedurOptions, setProsedurOptions] = useState(prosedurFallback);
  const [detailLokasiOptions, setDetailLokasiOptions] = useState([]);
  const [prosedurDepartemenList, setProsedurDepartemenList] = useState([]);
  const [prosedurDepartemenOptions, setProsedurDepartemenOptions] = useState([]);
  const [selectedProsedurDepartemenName, setSelectedProsedurDepartemenName] = useState("");
  const [selectedProsedurDepartemenId, setSelectedProsedurDepartemenId] = useState(null);

  const [showObserverModal, setShowObserverModal] = useState(false);
  const [showObserveeModal, setShowObserveeModal] = useState(false);
  const [showPICModal, setShowPICModal] = useState(false);
  const [showProsedurDepartemenModal, setShowProsedurDepartemenModal] = useState(false);
  const [personSearch, setPersonSearch] = useState("");
  const [prosedurDepartemenSearchQuery, setProsedurDepartemenSearchQuery] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);

  const [showCropper, setShowCropper] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const [showSiteModal, setShowSiteModal] = useState(false);
  const [showDetailLokasiModal, setShowDetailLokasiModal] = useState(false);
  const [showAlasanModal, setShowAlasanModal] = useState(false);
  const [showProsedurModal, setShowProsedurModal] = useState(false);
  const [siteSearchQuery, setSiteSearchQuery] = useState("");
  const [detailLokasiSearchQuery, setDetailLokasiSearchQuery] = useState("");
  const [alasanSearchQuery, setAlasanSearchQuery] = useState("");
  const [prosedurSearchQuery, setProsedurSearchQuery] = useState("");
  const [showCustomDetailInput, setShowCustomDetailInput] = useState(false);
  const fotoCameraRef = useRef();
  const fotoGalleryRef = useRef();

  useEffect(() => {
    setShowCustomDetailInput(false);
    setFormData((p) => ({ ...p, detailLokasi: "" }));
  }, [formData.site]);

  useEffect(() => {
    if (!formData.site) {
      setDetailLokasiOptions(getLocationOptions(formData.site) || []);
      return;
    }
    let cancelled = false;
    getLocationOptionsAsync(formData.site).then((opts) => {
      if (!cancelled) setDetailLokasiOptions(opts || getLocationOptions(formData.site) || []);
    });
    return () => { cancelled = true; };
  }, [formData.site]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const [alasan, dept] = await Promise.all([fetchAlasanObservasi(), fetchProsedurDepartemen()]);
      if (cancelled) return;
      if (alasan?.length > 0) setAlasanObservasiOptions(alasan);
      setProsedurDepartemenList(dept || []);
      setProsedurDepartemenOptions((dept || []).map((d) => d.name));
      if (selectedProsedurDepartemenId) {
        const prosedur = await fetchProsedur(selectedProsedurDepartemenId);
        setProsedurOptions(prosedur || []);
      } else {
        const prosedur = await fetchProsedur();
        setProsedurOptions(prosedur || []);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [selectedProsedurDepartemenId]);

  useEffect(() => {
    const f = async () => {
      const { data } = await supabase.from("users").select("site").not("site", "is", null);
      if (data) setSites([...new Set(data.map((u) => u.site))]);
    };
    f();
  }, []);

  useEffect(() => {
    if (!formData.site || !user?.id) return;
    const jabatanObserver = [
      "Pengawas",
      "Technical Service",
      "SHERQ Officer",
      "Assisten Penanggung Jawab Operasional",
      "Penanggung Jawab Operasional",
    ];
    const run = async () => {
      let q = supabase.from("users").select("id, nama, jabatan").eq("site", formData.site).neq("id", user.id);
      if (formData.observee) q = q.neq("id", formData.observee);
      const { data } = await q.in("jabatan", jabatanObserver);
      setObservers(data || []);
    };
    run();
  }, [formData.site, formData.observee, user?.id]);

  useEffect(() => {
    if (!formData.site || !user?.id) return;
    const run = async () => {
      let q = supabase.from("users").select("id, nama, jabatan").eq("site", formData.site).neq("id", user.id);
      if (formData.observerTambahan) q = q.neq("id", formData.observerTambahan);
      const { data } = await q;
      setObservees(data || []);
    };
    run();
  }, [formData.site, formData.observerTambahan, user?.id]);

  useEffect(() => {
    if (!formData.site || !user?.id) return;
    const run = async () => {
      let q = supabase.from("users").select("id, nama, jabatan").eq("site", formData.site).neq("id", user.id);
      if (formData.observerTambahan) q = q.neq("id", formData.observerTambahan);
      const { data } = await q;
      setPICs(data || []);
    };
    run();
  }, [formData.site, formData.observerTambahan, user?.id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleChecklistChange = (key, val) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  const hasNegativeAnswers = () =>
    formData.langkahKerjaAman === false ||
    formData.apdSesuai === false ||
    formData.areaKerjaAman === false ||
    formData.peralatanAman === false ||
    formData.peduliKeselamatan === false ||
    formData.pahamResikoProsedur === false;

  const totalPages = hasNegativeAnswers() ? 4 : 3;

  const validatePage = () => {
    if (page === 1)
      return (
        formData.tanggal &&
        formData.site &&
        formData.detailLokasi &&
        formData.alasanObservasi &&
        selectedProsedurDepartemenId &&
        formData.prosedur
      );
    if (page === 2) return formData.observee && formData.pekerjaanYangDilakukan;
    if (page === 3)
      return [
        formData.langkahKerjaAman,
        formData.apdSesuai,
        formData.areaKerjaAman,
        formData.peralatanAman,
        formData.peduliKeselamatan,
        formData.pahamResikoProsedur,
      ].every((v) => v !== null);
    return formData.tindakanPerbaikan && formData.picTindakLanjut;
  };

  const isValidUUID = (v) => v && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

  const handleSubmit = async () => {
    if (!validatePage()) {
      setError("Mohon lengkapi semua field yang diperlukan");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let fotoUrl = null;
      if (formData.fotoTemuan) {
        const fileName = `${Date.now()}_${formData.fotoTemuan.name}`;
        const { error: uploadError } = await supabase.storage.from("pto-evidence").upload(fileName, formData.fotoTemuan);
        if (uploadError) throw new Error(`Gagal upload foto: ${uploadError.message}`);
        const { data: urlData } = supabase.storage.from("pto-evidence").getPublicUrl(fileName);
        fotoUrl = urlData.publicUrl;
      }

      const status = hasNegativeAnswers() ? "pending" : "closed";
      const ptoData = {
        tanggal: formData.tanggal,
        site: formData.site,
        detail_lokasi: formData.detailLokasi,
        alasan_observasi: formData.alasanObservasi,
        observer_id: user.id,
        observer_tambahan_id: isValidUUID(formData.observerTambahan) ? formData.observerTambahan : null,
        observee_id: isValidUUID(formData.observee) ? formData.observee : null,
        pekerjaan_yang_dilakukan: formData.pekerjaanYangDilakukan,
        prosedur_id: formData.prosedur || null,
        langkah_kerja_aman: formData.langkahKerjaAman,
        apd_sesuai: formData.apdSesuai,
        area_kerja_aman: formData.areaKerjaAman,
        peralatan_aman: formData.peralatanAman,
        peduli_keselamatan: formData.peduliKeselamatan,
        paham_resiko_prosedur: formData.pahamResikoProsedur,
        tindakan_perbaikan: formData.tindakanPerbaikan || null,
        pic_tindak_lanjut_id: isValidUUID(formData.picTindakLanjut) ? formData.picTindakLanjut : null,
        foto_temuan: fotoUrl,
        status,
        created_by: user.id,
      };

      const { data, error: insertErr } = await supabase
        .from("planned_task_observation")
        .insert([ptoData])
        .select();

      if (insertErr) throw insertErr;

      if (status === "pending" && formData.tindakanPerbaikan && formData.picTindakLanjut) {
        await supabase.rpc("create_hazard_report_from_pto", { pto_id: data[0].id });
      }
      setSuccess(true);
    } catch (err) {
      console.error("PTO submit error:", err);
      setError("Terjadi kesalahan saat menyimpan data PTO");
    } finally {
      setSubmitting(false);
    }
  };

  const onCropComplete = useCallback((_, croppedAreaPx) => {
    setCroppedAreaPixels(croppedAreaPx);
  }, []);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setCropImageSrc(URL.createObjectURL(f));
      setShowCropper(true);
    }
    e.target.value = "";
  };

  const handleCropConfirm = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;
    try {
      const blob = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      const file = new File([blob], "pto-foto.jpg", { type: "image/jpeg" });
      setFormData((prev) => ({ ...prev, fotoTemuan: file }));
      setShowCropper(false);
      URL.revokeObjectURL(cropImageSrc);
      setCropImageSrc(null);
    } catch (e) {
      console.error("Crop error:", e);
      setShowCropper(false);
      if (cropImageSrc?.startsWith("blob:")) URL.revokeObjectURL(cropImageSrc);
      setCropImageSrc(null);
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    if (cropImageSrc?.startsWith("blob:")) URL.revokeObjectURL(cropImageSrc);
    setCropImageSrc(null);
  };

  // Mobile styles - header tetap di atas, konten yang scroll (sama Hazard Report)
  const contentStyle = {
    width: "100%",
    height: "100vh",
    maxHeight: "-webkit-fill-available",
    background: "#f3f4f6",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    overflow: "hidden",
    paddingTop: 60,
  };

  const scrollContentStyle = {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    overflowX: "hidden",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  };

  const cardStyle = {
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
    paddingTop: 6,
    paddingRight: 6,
    paddingBottom: 100,
    paddingLeft: 6,
    width: "100%",
    maxWidth: 425,
    marginTop: 0,
  };

  const labelStyle = {
    fontWeight: 600,
    color: "#222",
    marginBottom: 4,
    display: "block",
    fontSize: 14,
  };

  const inputStyle = {
    width: "100%",
    borderRadius: 8,
    padding: "12px 16px",
    fontSize: 14,
    border: "1px solid #d1d5db",
    backgroundColor: "#fff",
    color: "#222",
    boxSizing: "border-box",
  };

  const tapFieldStyle = {
    ...inputStyle,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
  };

  const checklistBtn = (active, color) => ({
    flex: 1,
    minWidth: 60,
    maxWidth: 100,
    padding: "8px 12px",
    borderRadius: 8,
    border: `2px solid ${color}`,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    background: active ? color : "#fff",
    color: active ? "#fff" : color,
  });

  const navBtn = (disabled) => ({
    padding: "10px 20px",
    borderRadius: 8,
    border: "none",
    fontSize: 14,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    background: disabled ? "#d1d5db" : "#ea580c",
    color: "#fff",
    opacity: disabled ? 0.7 : 1,
  });

  const getPersonLabel = (id, list) => {
    if (!id) return "";
    const p = (list || []).find((o) => o.id === id);
    return p ? `${p.nama} - ${p.jabatan}` : "";
  };

  // Crop modal
  if (showCropper && cropImageSrc) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 1000, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
          <Cropper
            image={cropImageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{ containerStyle: { width: "100%", height: "100%" } }}
          />
        </div>
        <div style={{ padding: 20, background: "#1f2937", display: "flex", justifyContent: "center", gap: 16 }}>
          <button type="button" onClick={handleCropCancel} style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Batal</button>
          <button type="button" onClick={handleCropConfirm} style={{ background: "#22c55e", color: "#fff", border: "none", borderRadius: 8, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Simpan</button>
        </div>
      </div>
    );
  }

  // Success screen
  if (success) {
    return (
      <div style={contentStyle}>
        <MobileHeader user={user} onBack={onBack} title="PTO" showBack={true} />
        <div style={scrollContentStyle}>
        <div style={{ ...cardStyle, marginTop: 24, padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h3 style={{ marginBottom: 12, color: "#10b981" }}>Berhasil!</h3>
          <p style={{ marginBottom: 24, color: "#374151" }}>
            Data PTO berhasil disimpan.
            {hasNegativeAnswers() && (
              <span style={{ display: "block", marginTop: 8, fontSize: 13, color: "#f59e0b" }}>
                ⚠️ Hazard report telah dibuat otomatis untuk tindak lanjut temuan.
              </span>
            )}
          </p>
          <button onClick={onBack} style={navBtn(false)}>Kembali ke Menu</button>
        </div>
        </div>
        <MobileBottomNavigation
          activeTab="home"
          tasklistTodoCount={tasklistTodoCount}
          onNavigate={(tab) => {
            if (tab === "home") onBack && onBack();
            else if (tab === "profile") onNavigate && onNavigate("profile");
            else if (tab === "tasklist") onNavigate && onNavigate("tasklist");
          }}
        />
      </div>
    );
  }

  const fieldMargin = {
    width: "90%",
    maxWidth: 320,
    marginLeft: "auto",
    marginRight: "auto",
    marginTop: 8,
    marginBottom: 4,
    boxSizing: "border-box",
  };

  return (
    <div style={contentStyle}>
      <MobileHeader user={user} onBack={onBack} title="PTO" showBack={true} />

      <div style={scrollContentStyle}>
        <div style={{ ...cardStyle, marginTop: 16 }}>
        {/* Progress indicator - 3 titik seperti Hazard Report */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 8,
            gap: 6,
          }}
        >
          {[1, 2, 3, 4].map((n) => {
            if (n > totalPages) return null;
            return (
              <div
                key={n}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: page >= n ? "#2563eb" : "#e5e7eb",
                }}
              />
            );
          })}
        </div>

        {error && (
          <div style={{ ...fieldMargin, background: "#fef2f2", color: "#dc2626", padding: 12, borderRadius: 8, fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* Page 1 */}
        {page === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={fieldMargin}>
              <label style={labelStyle}>Tanggal *</label>
              <input type="date" name="tanggal" value={formData.tanggal} readOnly style={{ ...inputStyle, background: "#f9fafb", cursor: "default" }} />
            </div>
            <div style={fieldMargin}>
              <label style={labelStyle}>Lokasi (Site) *</label>
              <div
                onClick={() => {
                  setSiteSearchQuery("");
                  setShowSiteModal(true);
                }}
                style={tapFieldStyle}
              >
                <span style={{ color: formData.site ? "#222" : "#6b7280" }}>
                  {formData.site || "Pilih Lokasi"}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
              </div>
            </div>
            <div style={fieldMargin}>
              <label style={labelStyle}>Detail Lokasi *</label>
              {shouldUseLocationSelector(formData.site) ? (
                <>
                  <div
                    onClick={() => {
                      if (formData.site) {
                        setDetailLokasiSearchQuery("");
                        setShowDetailLokasiModal(true);
                      }
                    }}
                    style={{
                      ...tapFieldStyle,
                      backgroundColor: !formData.site ? "#f3f4f6" : "#fff",
                      cursor: !formData.site ? "not-allowed" : "pointer",
                      color: !formData.site ? "#9ca3af" : undefined,
                    }}
                  >
                    <span style={{ color: formData.detailLokasi || showCustomDetailInput ? "#222" : "#6b7280" }}>
                      {showCustomDetailInput
                        ? formData.detailLokasi || "Ketik detail lokasi lainnya..."
                        : formData.detailLokasi || (!formData.site ? "Pilih lokasi terlebih dahulu" : "Pilih Detail Lokasi")}
                    </span>
                    {formData.site && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
                    )}
                  </div>
                  {showCustomDetailInput && (
                    <input
                      type="text"
                      name="detailLokasi"
                      value={formData.detailLokasi}
                      onChange={handleInputChange}
                      placeholder="Ketik detail lokasi lainnya..."
                      style={{ ...inputStyle, marginTop: 8 }}
                    />
                  )}
                </>
              ) : (
                <input
                  type="text"
                  name="detailLokasi"
                  value={formData.detailLokasi}
                  onChange={handleInputChange}
                  placeholder="Ketik detail lokasi"
                  style={inputStyle}
                />
              )}
            </div>
            <div style={fieldMargin}>
              <label style={labelStyle}>Alasan Observasi *</label>
              <div onClick={() => { setAlasanSearchQuery(""); setShowAlasanModal(true); }} style={tapFieldStyle}>
                <span style={{ color: formData.alasanObservasi ? "#222" : "#6b7280" }}>
                  {formData.alasanObservasi || "Pilih Alasan Observasi"}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
              </div>
            </div>
            <div style={fieldMargin}>
              <label style={labelStyle}>Prosedur Departemen</label>
              <div
                onClick={() => { setProsedurDepartemenSearchQuery(""); setShowProsedurDepartemenModal(true); }}
                style={tapFieldStyle}
              >
                <span style={{ color: selectedProsedurDepartemenName ? "#222" : "#6b7280" }}>
                  {selectedProsedurDepartemenName || "Pilih Prosedur Departemen"}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
              </div>
            </div>
            <div style={fieldMargin}>
              <label style={labelStyle}>Prosedur (Opsional)</label>
              <div
                onClick={() => {
                  if (!selectedProsedurDepartemenId) {
                    setToastMsg("Pilih Prosedur Departemen terlebih dahulu");
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 500);
                    return;
                  }
                  setProsedurSearchQuery("");
                  setShowProsedurModal(true);
                }}
                style={{
                  ...tapFieldStyle,
                  background: !selectedProsedurDepartemenId ? "#f3f4f6" : undefined,
                  color: !selectedProsedurDepartemenId ? "#9ca3af" : undefined,
                  cursor: !selectedProsedurDepartemenId ? "not-allowed" : "pointer",
                }}
              >
                <span style={{ color: formData.prosedur ? "#222" : "#6b7280" }}>
                  {formData.prosedur || "Pilih Prosedur"}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
              </div>
            </div>
          </div>
        )}

        {/* Page 2 */}
        {page === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={fieldMargin}>
              <label style={labelStyle}>Observer Tambahan (Opsional)</label>
              <div onClick={() => { setPersonSearch(""); setShowObserverModal(true); }} style={tapFieldStyle}>
                <span style={{ color: formData.observerTambahan ? "#222" : "#6b7280" }}>
                  {getPersonLabel(formData.observerTambahan, observers) || "Pilih Observer Tambahan"}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
              </div>
            </div>
            <div style={fieldMargin}>
              <label style={labelStyle}>Observee *</label>
              <div onClick={() => { setPersonSearch(""); setShowObserveeModal(true); }} style={tapFieldStyle}>
                <span style={{ color: formData.observee ? "#222" : "#6b7280" }}>
                  {getPersonLabel(formData.observee, observees) || "Pilih Observee"}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
              </div>
            </div>
            <div style={fieldMargin}>
              <label style={labelStyle}>Pekerjaan Yang Dilakukan *</label>
              <textarea
                name="pekerjaanYangDilakukan"
                value={formData.pekerjaanYangDilakukan}
                onChange={handleInputChange}
                rows={4}
                placeholder="Jelaskan pekerjaan yang sedang dilakukan..."
                style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
              />
            </div>
          </div>
        )}

        {/* Page 3 - Checklist */}
        {page === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { key: "langkahKerjaAman", q: "Apakah langkah kerja aman dilakukan?" },
              { key: "apdSesuai", q: "Apakah pekerja menggunakan APD yang sesuai?" },
              { key: "areaKerjaAman", q: "Apakah area kerja aman?" },
              { key: "peralatanAman", q: "Apakah peralatan yang digunakan telah sesuai dan aman?" },
              { key: "peduliKeselamatan", q: "Apakah pekerja peduli dengan keselamatan rekan kerjanya?" },
              { key: "pahamResikoProsedur", q: "Apakah pekerja memahami resiko pekerjaan dan prosedur kerjanya?" },
            ].map(({ key, q }) => (
              <div key={key} style={fieldMargin}>
                <div style={{ ...labelStyle, marginBottom: 8 }}>{q}</div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                  <button type="button" onClick={() => handleChecklistChange(key, true)} style={checklistBtn(formData[key] === true, "#22c55e")}>Iya</button>
                  <button type="button" onClick={() => handleChecklistChange(key, false)} style={checklistBtn(formData[key] === false, "#ef4444")}>Tidak</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Page 4 */}
        {page === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={fieldMargin}>
              <label style={labelStyle}>Tindakan Perbaikan *</label>
              <textarea
                name="tindakanPerbaikan"
                value={formData.tindakanPerbaikan}
                onChange={handleInputChange}
                rows={4}
                placeholder="Jelaskan tindakan perbaikan..."
                style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
              />
            </div>
            <div style={fieldMargin}>
              <label style={labelStyle}>PIC Tindak Lanjut *</label>
              <div onClick={() => { setPersonSearch(""); setShowPICModal(true); }} style={tapFieldStyle}>
                <span style={{ color: formData.picTindakLanjut ? "#222" : "#6b7280" }}>
                  {getPersonLabel(formData.picTindakLanjut, pics) || "Pilih PIC Tindak Lanjut"}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
              </div>
            </div>
            <div style={fieldMargin}>
              <label style={labelStyle}>Foto Temuan (Opsional)</label>
              {!formData.fotoTemuan ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => fotoCameraRef.current?.click()}
                    style={{
                      flex: 1,
                      padding: "12px",
                      background: "#f3f4f6",
                      border: "2px dashed #d1d5db",
                      borderRadius: 8,
                      fontSize: 13,
                      color: "#6b7280",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <span>📷</span> Kamera
                  </button>
                  <button
                    type="button"
                    onClick={() => fotoGalleryRef.current?.click()}
                    style={{
                      flex: 1,
                      padding: "12px",
                      background: "#f3f4f6",
                      border: "2px dashed #d1d5db",
                      borderRadius: 8,
                      fontSize: 13,
                      color: "#6b7280",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <span>🖼️</span> Galeri
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <img
                    src={URL.createObjectURL(formData.fotoTemuan)}
                    alt="Preview"
                    style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8 }}
                  />
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, fotoTemuan: null }))}
                    style={{ padding: "8px 16px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer" }}
                  >
                    Ganti Foto
                  </button>
                </div>
              )}
              <input
                ref={fotoCameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              <input
                ref={fotoGalleryRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </div>
          </div>
        )}

        {/* Navigation - sama seperti Hazard Report */}
        <div
          style={{
            width: "90%",
            maxWidth: 320,
            margin: "8px auto 0 auto",
          }}
        >
          {page === 1 ? (
            <button
              type="button"
              onClick={() => setPage(2)}
              disabled={!validatePage()}
              style={{
                background: validatePage() ? "#2563eb" : "#9ca3af",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "8px 0",
                fontSize: 13,
                fontWeight: 600,
                cursor: validatePage() ? "pointer" : "not-allowed",
                width: "100%",
                opacity: validatePage() ? 1 : 0.6,
              }}
            >
              Lanjutkan
            </button>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => setPage((p) => p - 1)}
                style={{
                  background: "#6b7280",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 0",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  flex: 1,
          }}
        >
          Kembali
        </button>
              {page < 4 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (page === 3 && !hasNegativeAnswers()) handleSubmit();
                    else setPage((p) => p + 1);
                  }}
                  disabled={page === 3 && !hasNegativeAnswers() ? !validatePage() : !validatePage()}
                  style={{
                    background: validatePage() ? "#2563eb" : "#9ca3af",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 0",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: validatePage() ? "pointer" : "not-allowed",
                    flex: 1,
                    opacity: validatePage() ? 1 : 0.6,
                  }}
                >
                  {page === 3 && !hasNegativeAnswers() ? "Simpan" : "Lanjutkan"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || !validatePage()}
                  style={{
                    background: submitting || !validatePage() ? "#9ca3af" : "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 0",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: submitting || !validatePage() ? "not-allowed" : "pointer",
                    flex: 1,
                    opacity: submitting || !validatePage() ? 0.6 : 1,
                  }}
                >
                  {submitting ? "Menyimpan..." : "Simpan"}
                </button>
              )}
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Popup dari bawah (sama Hazard Report) - navbar tetap terlihat */}
      <SelectModalWithSearch
        title="Pilih Prosedur Departemen"
        options={prosedurDepartemenOptions}
        onSelect={async (val) => {
          setSelectedProsedurDepartemenName(val || "");
          const found = (prosedurDepartemenList || []).find((d) => d.name === val);
          const id = found?.id || null;
          setSelectedProsedurDepartemenId(id);
          setFormData((p) => ({ ...p, prosedur: "" }));
          setShowProsedurDepartemenModal(false);
          setProsedurDepartemenSearchQuery("");
          const list = await fetchProsedur(id);
          setProsedurOptions(list || []);
        }}
        searchQuery={prosedurDepartemenSearchQuery}
        onSearchChange={setProsedurDepartemenSearchQuery}
        show={showProsedurDepartemenModal}
        onClose={() => setShowProsedurDepartemenModal(false)}
      />
      {showToast && (
        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: "80px",
            transform: "translateX(-50%)",
            background: "rgba(17,24,39,0.95)",
            color: "#fff",
            padding: "10px 14px",
            borderRadius: 8,
            fontSize: 12,
            zIndex: 3000,
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
          {toastMsg}
        </div>
      )}
      <SelectModalWithSearch
        title="Pilih Lokasi"
        options={CUSTOM_INPUT_SITES}
        onSelect={(val) => {
          setFormData((p) => ({ ...p, site: val }));
          setShowSiteModal(false);
          setSiteSearchQuery("");
        }}
        searchQuery={siteSearchQuery}
        onSearchChange={setSiteSearchQuery}
        show={showSiteModal}
        onClose={() => setShowSiteModal(false)}
      />
      <SelectModalWithSearch
        title="Pilih Detail Lokasi"
        options={[
          ...(detailLokasiOptions || []),
          ...(allowsCustomInput(formData.site) ? ["Lainnya"] : []),
        ]}
        onSelect={(val) => {
          setShowDetailLokasiModal(false);
          setDetailLokasiSearchQuery("");
          if (val === "Lainnya") {
            setShowCustomDetailInput(true);
            setFormData((p) => ({ ...p, detailLokasi: "" }));
          } else {
            setShowCustomDetailInput(false);
            setFormData((p) => ({ ...p, detailLokasi: val }));
          }
        }}
        searchQuery={detailLokasiSearchQuery}
        onSearchChange={setDetailLokasiSearchQuery}
        show={showDetailLokasiModal}
        onClose={() => setShowDetailLokasiModal(false)}
      />
      <SelectModalWithSearch
        title="Pilih Alasan Observasi"
        options={alasanObservasiOptions}
        onSelect={(val) => {
          setFormData((p) => ({ ...p, alasanObservasi: val }));
          setShowAlasanModal(false);
          setAlasanSearchQuery("");
        }}
        searchQuery={alasanSearchQuery}
        onSearchChange={setAlasanSearchQuery}
        show={showAlasanModal}
        onClose={() => setShowAlasanModal(false)}
      />
      <SelectModalWithSearch
        title="Pilih Prosedur"
        options={["Tidak ada", ...prosedurOptions]}
        onSelect={(val) => {
          setFormData((p) => ({ ...p, prosedur: val === "Tidak ada" ? "" : val }));
          setShowProsedurModal(false);
          setProsedurSearchQuery("");
        }}
        searchQuery={prosedurSearchQuery}
        onSearchChange={setProsedurSearchQuery}
        show={showProsedurModal}
        onClose={() => setShowProsedurModal(false)}
      />

      <PersonSelectModal
        show={showObserverModal}
        onClose={() => setShowObserverModal(false)}
        title="Observer Tambahan"
        options={observers}
        value={formData.observerTambahan}
        onSelect={(id) => { setFormData((p) => ({ ...p, observerTambahan: id || "" })); setShowObserverModal(false); }}
        searchQuery={personSearch}
        onSearchChange={setPersonSearch}
      />
      <PersonSelectModal
        show={showObserveeModal}
        onClose={() => setShowObserveeModal(false)}
        title="Pilih Observee"
        options={observees}
        value={formData.observee}
        onSelect={(id) => { setFormData((p) => ({ ...p, observee: id || "" })); setShowObserveeModal(false); }}
        searchQuery={personSearch}
        onSearchChange={setPersonSearch}
      />
      <PersonSelectModal
        show={showPICModal}
        onClose={() => setShowPICModal(false)}
        title="PIC Tindak Lanjut"
        options={pics}
        value={formData.picTindakLanjut}
        onSelect={(id) => { setFormData((p) => ({ ...p, picTindakLanjut: id || "" })); setShowPICModal(false); }}
        searchQuery={personSearch}
        onSearchChange={setPersonSearch}
      />

      {/* Bottom Navigation - selaras dengan Take5/Hazard */}
      <MobileBottomNavigation
        activeTab="home"
        tasklistTodoCount={tasklistTodoCount}
        onNavigate={(tab) => {
          if (tab === "home") onBack && onBack();
          else if (tab === "profile") onNavigate && onNavigate("profile");
          else if (tab === "tasklist") onNavigate && onNavigate("tasklist");
        }}
      />
    </div>
  );
}

export default PTOFormMobile;
