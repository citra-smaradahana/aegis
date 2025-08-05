import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../../supabaseClient";
import Cropper from "react-easy-crop";
import getCroppedImg from "../Dropzone/cropImageUtil";
import {
  getLocationOptions,
  allowsCustomInput,
  shouldUseLocationSelector,
} from "../../config/siteLocations";
import PendingTake5List from "./PendingTake5List";
import LocationDetailSelector from "../LocationDetailSelector";

const lokasiOptions = [
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

function HazardFormDesktop({ user }) {
  // Multi-page state
  const [page, setPage] = useState(1);
  // Form state
  const [form, setForm] = useState({
    lokasi: "",
    detailLokasi: "",
    keteranganLokasi: "",
    pic: "",
    ketidaksesuaian: "",
    subKetidaksesuaian: "",
    quickAction: "",
    deskripsiTemuan: "",
  });
  const [evidence, setEvidence] = useState(null);
  const [evidencePreview, setEvidencePreview] = useState(null);
  const fileInputRef = useRef();
  const [, setTake5Pending] = useState([]);
  const [selectedTake5, setSelectedTake5] = useState(null);
  const [selectedTake5Id, setSelectedTake5Id] = useState(null);
  const [picOptions, setPicOptions] = useState([]);
  const [, setLocationOptions] = useState([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Crop state
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCrop, setShowCrop] = useState(false);
  const [rawImage, setRawImage] = useState(null);

  // Fetch Take 5 pending (Stop pekerjaan)
  useEffect(() => {
    supabase
      .from("take_5")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .then(({ data }) => setTake5Pending(data || []));
  }, [user.id]);

  // Prefill lokasi/dll jika Take 5 dipilih
  useEffect(() => {
    if (selectedTake5) {
      setForm((prev) => ({
        ...prev,
        lokasi: selectedTake5.site,
        detailLokasi: selectedTake5.detail_lokasi,
      }));
    }
  }, [selectedTake5]);

  // Fetch PIC options by lokasi
  useEffect(() => {
    async function fetchPIC() {
      if (!form.lokasi) {
        setPicOptions([]);
        return;
      }
      const { data, error } = await supabase
        .from("users")
        .select("nama")
        .eq("site", form.lokasi);
      if (!error && data) {
        // Filter out current user dari PIC options
        const filteredPIC = data
          .map((u) => u.nama)
          .filter(Boolean)
          .filter((nama) => nama !== user.nama); // Exclude current user
        setPicOptions(filteredPIC);
      } else {
        setPicOptions([]);
      }
    }
    fetchPIC();
  }, [form.lokasi, user.nama]);

  // Update location options when lokasi changes
  useEffect(() => {
    if (form.lokasi) {
      const options = getLocationOptions(form.lokasi);
      setLocationOptions(options);
      // Reset detail lokasi when lokasi changes
      setForm((prev) => ({ ...prev, detailLokasi: "" }));
      setShowCustomInput(false);
    } else {
      setLocationOptions([]);
      setForm((prev) => ({ ...prev, detailLokasi: "" }));
      setShowCustomInput(false);
    }
  }, [form.lokasi]);

  // Handle detail lokasi change
  const handleDetailLokasiChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Show custom input if "Lainnya" is selected or if site allows custom input
    if (
      value === "Lainnya" ||
      (allowsCustomInput(form.lokasi) && value === "")
    ) {
      setShowCustomInput(true);
      setForm((prev) => ({ ...prev, detailLokasi: "" }));
    } else {
      setShowCustomInput(false);
    }
  };

  // Evidence preview
  useEffect(() => {
    if (evidence) {
      const url = URL.createObjectURL(evidence);
      setEvidencePreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setEvidencePreview(null);
    }
  }, [evidence]);

  // Handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "lokasi") setForm((prev) => ({ ...prev, pic: "" }));
  };

  const handleEvidence = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setRawImage(URL.createObjectURL(file));
      setShowCrop(true);
    }
  };

  const handleClickCamera = () => {
    fileInputRef.current?.click();
  };

  const handleClickPreview = () => {
    fileInputRef.current?.click();
  };

  const handleNext = () => setPage((p) => p + 1);
  const handleBack = () => setPage((p) => p - 1);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    try {
      const croppedImage = await getCroppedImg(rawImage, croppedAreaPixels);
      const file = new File([croppedImage], "evidence.jpg", {
        type: "image/jpeg",
      });
      setEvidence(file);
      setShowCrop(false);
      setRawImage(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCropCancel = () => {
    setShowCrop(false);
    setRawImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSelectTake5 = (take5) => {
    setSelectedTake5(take5);
    setSelectedTake5Id(take5.id);

    // Auto-fill form dengan data Take 5
    setForm({
      ...form,
      lokasi: take5.site,
      detailLokasi: take5.detail_lokasi,
      keteranganLokasi: take5.potensi_bahaya,
      ketidaksesuaian: "Safety", // Default value
      subKetidaksesuaian: take5.potensi_bahaya,
      quickAction: "STOP pekerjaan sesuai Take 5",
      deskripsiTemuan: take5.bukti_perbaikan
        ? `Kondisi kerja tidak aman berdasarkan Take 5 tanggal ${take5.tanggal}. ${take5.aman}\n\nDeskripsi dari Take 5:\n${take5.bukti_perbaikan}`
        : `Kondisi kerja tidak aman berdasarkan Take 5 tanggal ${take5.tanggal}. ${take5.aman}`,
    });

    // Jika ada foto dari Take 5, set sebagai evidence preview
    if (take5.bukti_url) {
      setEvidencePreview(take5.bukti_url);
      // Note: User masih perlu upload foto baru karena kita tidak bisa langsung menggunakan URL dari Take 5
    }
  };

  async function uploadEvidence() {
    if (!evidence) return null;
    const fileExt = evidence.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `hazard-evidence/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("img-test")
      .upload(filePath, evidence);

    if (uploadError) {
      throw new Error("Error uploading evidence");
    }

    const { data } = supabase.storage.from("img-test").getPublicUrl(filePath);
    return data.publicUrl;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      let evidenceUrl = null;
      if (evidence) {
        evidenceUrl = await uploadEvidence();
      } else if (selectedTake5?.bukti_url) {
        // Jika tidak ada foto baru tapi ada foto dari Take 5, gunakan foto dari Take 5
        evidenceUrl = selectedTake5.bukti_url;
      }

      const { error } = await supabase.from("hazard_report").insert({
        user_id: user.id,
        user_nama: user.nama,
        user_jabatan: user.jabatan,
        user_perusahaan: user.perusahaan,
        lokasi: form.lokasi,
        detail_lokasi: form.detailLokasi,
        keterangan_lokasi: form.keteranganLokasi,
        pic: form.pic,
        ketidaksesuaian: form.ketidaksesuaian,
        sub_ketidaksesuaian: form.subKetidaksesuaian,
        quick_action: form.quickAction,
        deskripsi_temuan: form.deskripsiTemuan,
        evidence_url: evidenceUrl,
        take_5_id: selectedTake5?.id || null,
        status: "Open",
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Jika ada Take 5 yang dipilih, update status menjadi "done"
      if (selectedTake5?.id) {
        const { error: updateError } = await supabase
          .from("take_5")
          .update({ status: "done" })
          .eq("id", selectedTake5.id);

        if (updateError) {
          console.error("Error updating Take 5 status:", updateError);
        }
      }

      setSubmitSuccess(true);
      setForm({
        lokasi: "",
        detailLokasi: "",
        keteranganLokasi: "",
        pic: "",
        ketidaksesuaian: "",
        subKetidaksesuaian: "",
        quickAction: "",
        deskripsiTemuan: "",
      });
      setEvidence(null);
      setEvidencePreview(null);
      setSelectedTake5(null);
      setSelectedTake5Id(null);
      setPage(1);

      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error submitting hazard report:", error);
      setSubmitError("Gagal menyimpan hazard report. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  // Crop modal
  if (showCrop) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.8)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <div
          style={{
            position: "relative",
            width: 400,
            height: 400,
            background: "#fff",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <Cropper
            image={rawImage}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{ containerStyle: { width: "100%", height: "100%" } }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 20,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              gap: 20,
            }}
          >
            <button
              onClick={handleCropCancel}
              style={{
                background: "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: 40,
                height: 40,
                fontSize: 18,
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
            <button
              onClick={handleCropSave}
              style={{
                background: "#22c55e",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: 40,
                height: 40,
                fontSize: 18,
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              ✓
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100vw",
        minHeight: "100vh",
        background: "#e0e7ff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 18,
          boxShadow: "0 4px 24px #2563eb33",
          padding: 36,
          maxWidth: 700,
          width: "100%",
          margin: "40px auto",
        }}
      >
        <h2
          style={{
            fontWeight: 900,
            fontSize: 28,
            color: "#2563eb",
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          Hazard Report
        </h2>

        {/* Progress Indicator */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 24,
            gap: 8,
          }}
        >
          {[1, 2, 3].map((pageNum) => (
            <div
              key={pageNum}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: page >= pageNum ? "#2563eb" : "#e5e7eb",
                color: page >= pageNum ? "#fff" : "#9ca3af",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                fontSize: 16,
                position: "relative",
              }}
            >
              {pageNum}
              {pageNum < 3 && (
                <div
                  style={{
                    position: "absolute",
                    right: -12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 24,
                    height: 2,
                    background: page > pageNum ? "#2563eb" : "#e5e7eb",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Pending Take 5 List */}
        <PendingTake5List
          user={user}
          onSelectTake5={handleSelectTake5}
          selectedTake5Id={selectedTake5Id}
        />

        {/* Page Title */}
        <div
          style={{
            textAlign: "center",
            marginBottom: 24,
            color: "#6b7280",
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          {page === 1 && "📍 Informasi Lokasi"}
          {page === 2 && "⚠️ Detail Ketidaksesuaian"}
          {page === 3 && "📷 Evidence & Deskripsi"}
        </div>
        <form
          onSubmit={handleSubmit}
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 18,
            height: "400px", // Tinggi tetap 400px
          }}
        >
          {/* Multi-page form */}

          {/* PAGE 1: Lokasi dan PIC */}
          {page === 1 && (
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <>
                <div style={{ marginBottom: 6 }}>
                  <label
                    style={{
                      fontWeight: 600,
                      color: "#222",
                      marginBottom: 4,
                      display: "block",
                      textAlign: "center",
                    }}
                  >
                    Lokasi (Site)
                  </label>
                  <select
                    name="lokasi"
                    value={form.lokasi}
                    onChange={handleChange}
                    required
                    disabled={!!selectedTake5}
                    style={{
                      width: "100%",
                      borderRadius: 8,
                      padding: 8,
                      fontSize: 15,
                    }}
                  >
                    <option value="">Pilih Lokasi</option>
                    {lokasiOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: 6 }}>
                  <label
                    style={{
                      fontWeight: 600,
                      color: "#222",
                      marginBottom: 4,
                      display: "block",
                      textAlign: "center",
                    }}
                  >
                    Detail Lokasi
                  </label>
                  {shouldUseLocationSelector(form.lokasi) ? (
                    <>
                      <LocationDetailSelector
                        site={form.lokasi}
                        value={form.detailLokasi}
                        onChange={handleDetailLokasiChange}
                        placeholder={
                          !form.lokasi
                            ? "Pilih lokasi terlebih dahulu"
                            : !!selectedTake5
                            ? "Diisi otomatis dari Take 5"
                            : "Pilih Detail Lokasi"
                        }
                        disabled={!!selectedTake5 || !form.lokasi}
                        required
                      />
                      {showCustomInput && (
                        <input
                          type="text"
                          name="detailLokasi"
                          value={form.detailLokasi}
                          onChange={handleChange}
                          required
                          placeholder="Ketik detail lokasi lainnya..."
                          style={{
                            width: "100%",
                            borderRadius: 8,
                            padding: 8,
                            fontSize: 15,
                            marginTop: 8,
                          }}
                        />
                      )}
                    </>
                  ) : (
                    <input
                      type="text"
                      name="detailLokasi"
                      value={form.detailLokasi}
                      onChange={handleChange}
                      required
                      disabled={!!selectedTake5}
                      placeholder="Ketik detail lokasi..."
                      style={{
                        width: "100%",
                        borderRadius: 8,
                        padding: 8,
                        fontSize: 15,
                        backgroundColor: !!selectedTake5 ? "#f3f4f6" : "#fff",
                        color: !!selectedTake5 ? "#9ca3af" : "#000",
                      }}
                    />
                  )}
                </div>

                <div style={{ marginBottom: 6 }}>
                  <label
                    style={{
                      fontWeight: 600,
                      color: "#222",
                      marginBottom: 4,
                      display: "block",
                      textAlign: "center",
                    }}
                  >
                    Keterangan Lokasi
                  </label>
                  <textarea
                    name="keteranganLokasi"
                    value={form.keteranganLokasi}
                    onChange={handleChange}
                    required
                    placeholder="Jelaskan detail lokasi temuan hazard"
                    style={{
                      width: "100%",
                      borderRadius: 8,
                      padding: 8,
                      fontSize: 15,
                      resize: "vertical",
                    }}
                  />
                </div>

                <div style={{ marginBottom: 6 }}>
                  <label
                    style={{
                      fontWeight: 600,
                      color: "#222",
                      marginBottom: 4,
                      display: "block",
                      textAlign: "center",
                    }}
                  >
                    PIC (Person In Charge)
                  </label>
                  <select
                    name="pic"
                    value={form.pic}
                    onChange={handleChange}
                    required
                    disabled={!form.lokasi}
                    style={{
                      width: "100%",
                      borderRadius: 8,
                      padding: 8,
                      fontSize: 15,
                      backgroundColor: !form.lokasi ? "#f3f4f6" : "#fff",
                      color: !form.lokasi ? "#9ca3af" : "#000",
                      cursor: !form.lokasi ? "not-allowed" : "pointer",
                    }}
                  >
                    <option value="">
                      {!form.lokasi
                        ? "Pilih lokasi terlebih dahulu"
                        : "Pilih PIC"}
                    </option>
                    {picOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tombol Navigasi - Halaman 1 */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "auto",
                    gap: 16,
                  }}
                >
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={page === 1}
                    style={{
                      background: page === 1 ? "#f3f4f6" : "#6b7280",
                      color: page === 1 ? "#9ca3af" : "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "12px 24px",
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: page === 1 ? "not-allowed" : "pointer",
                      opacity: page === 1 ? 0.5 : 1,
                    }}
                  >
                    ← Kembali
                  </button>

                  <div style={{ flex: 1, textAlign: "center" }}>
                    <span
                      style={{
                        fontSize: 14,
                        color: "#6b7280",
                        fontWeight: 500,
                      }}
                    >
                      Halaman {page} dari 3
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={
                      !form.lokasi ||
                      !form.detailLokasi ||
                      !form.keteranganLokasi ||
                      !form.pic
                    }
                    style={{
                      background: "#2563eb",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "12px 24px",
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Selanjutnya →
                  </button>
                </div>
              </>
            </div>
          )}

          {/* PAGE 2: Ketidaksesuaian dan Deskripsi */}
          {page === 2 && (
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <>
                <div style={{ marginBottom: 6 }}>
                  <label
                    style={{
                      fontWeight: 600,
                      color: "#222",
                      marginBottom: 4,
                      display: "block",
                      textAlign: "center",
                    }}
                  >
                    Ketidaksesuaian
                  </label>
                  <select
                    name="ketidaksesuaian"
                    value={form.ketidaksesuaian}
                    onChange={handleChange}
                    required
                    style={{
                      width: "100%",
                      borderRadius: 8,
                      padding: 8,
                      fontSize: 15,
                    }}
                  >
                    <option value="">Pilih Ketidaksesuaian</option>
                    <option value="Safety">Safety</option>
                    <option value="Quality">Quality</option>
                    <option value="Environment">Environment</option>
                    <option value="Health">Health</option>
                  </select>
                </div>

                <div style={{ marginBottom: 6 }}>
                  <label
                    style={{
                      fontWeight: 600,
                      color: "#222",
                      marginBottom: 4,
                      display: "block",
                      textAlign: "center",
                    }}
                  >
                    Sub Ketidaksesuaian
                  </label>
                  <input
                    type="text"
                    name="subKetidaksesuaian"
                    value={form.subKetidaksesuaian}
                    onChange={handleChange}
                    required
                    placeholder="Contoh: PPE, Housekeeping, dll"
                    style={{
                      width: "100%",
                      borderRadius: 8,
                      padding: 8,
                      fontSize: 15,
                    }}
                  />
                </div>

                <div style={{ marginBottom: 6 }}>
                  <label
                    style={{
                      fontWeight: 600,
                      color: "#222",
                      marginBottom: 4,
                      display: "block",
                      textAlign: "center",
                    }}
                  >
                    Quick Action
                  </label>
                  <textarea
                    name="quickAction"
                    value={form.quickAction}
                    onChange={handleChange}
                    required
                    placeholder="Tindakan cepat yang sudah dilakukan"
                    style={{
                      width: "100%",
                      borderRadius: 8,
                      padding: 8,
                      fontSize: 15,
                      resize: "vertical",
                    }}
                  />
                </div>

                {/* Tombol Navigasi - Halaman 2 */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "auto",
                    gap: 16,
                  }}
                >
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={page === 1}
                    style={{
                      background: page === 1 ? "#f3f4f6" : "#6b7280",
                      color: page === 1 ? "#9ca3af" : "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "12px 24px",
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: page === 1 ? "not-allowed" : "pointer",
                      opacity: page === 1 ? 0.5 : 1,
                    }}
                  >
                    ← Kembali
                  </button>

                  <div style={{ flex: 1, textAlign: "center" }}>
                    <span
                      style={{
                        fontSize: 14,
                        color: "#6b7280",
                        fontWeight: 500,
                      }}
                    >
                      Halaman {page} dari 3
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={
                      !form.ketidaksesuaian ||
                      !form.subKetidaksesuaian ||
                      !form.quickAction
                    }
                    style={{
                      background: "#2563eb",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "12px 24px",
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Selanjutnya →
                  </button>
                </div>
              </>
            </div>
          )}

          {/* PAGE 3: Evidence, Deskripsi dan Submit */}
          {page === 3 && (
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <>
                <div style={{ marginBottom: 6 }}>
                  <label
                    style={{
                      fontWeight: 600,
                      color: "#222",
                      marginBottom: 4,
                      display: "block",
                      textAlign: "center",
                    }}
                  >
                    Deskripsi Temuan
                  </label>
                  <textarea
                    name="deskripsiTemuan"
                    value={form.deskripsiTemuan}
                    onChange={handleChange}
                    required
                    placeholder="Jelaskan detail temuan hazard"
                    style={{
                      width: "100%",
                      borderRadius: 8,
                      padding: 8,
                      fontSize: 15,
                      resize: "vertical",
                      minHeight: "120px",
                    }}
                  />
                </div>

                <div style={{ marginBottom: 6 }}>
                  <label
                    style={{
                      fontWeight: 600,
                      color: "#222",
                      marginBottom: 4,
                      display: "block",
                      textAlign: "center",
                    }}
                  >
                    Foto Evidence
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleEvidence}
                    required
                    style={{ display: "none" }}
                  />
                  {evidencePreview ? (
                    <div style={{ textAlign: "center" }}>
                      {selectedTake5?.bukti_url && !evidence && (
                        <div
                          style={{
                            background: "#f0f9ff",
                            border: "1px solid #0ea5e9",
                            borderRadius: "8px",
                            padding: "8px",
                            marginBottom: "8px",
                            fontSize: "12px",
                            color: "#0369a1",
                          }}
                        >
                          📸 Foto dari Take 5 tersedia. Silakan upload foto baru
                          untuk Hazard Report.
                        </div>
                      )}
                      <img
                        src={evidencePreview}
                        alt="Preview"
                        onClick={handleClickPreview}
                        style={{
                          maxWidth: "100%",
                          maxHeight: 150,
                          borderRadius: 8,
                          border: "2px solid #e5e7eb",
                          cursor: "pointer",
                        }}
                        title="Klik untuk ganti foto"
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleClickCamera}
                      style={{
                        width: "100%",
                        background: "#f3f4f6",
                        border: "2px dashed #d1d5db",
                        borderRadius: 8,
                        padding: "16px",
                        fontSize: 15,
                        color: "#6b7280",
                        cursor: "pointer",
                      }}
                    >
                      📷 Klik untuk mengambil foto
                    </button>
                  )}
                </div>

                {/* Tombol Navigasi - Halaman 3 */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "auto",
                    gap: 16,
                  }}
                >
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={page === 1}
                    style={{
                      background: page === 1 ? "#f3f4f6" : "#6b7280",
                      color: page === 1 ? "#9ca3af" : "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "12px 24px",
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: page === 1 ? "not-allowed" : "pointer",
                      opacity: page === 1 ? 0.5 : 1,
                    }}
                  >
                    ← Kembali
                  </button>

                  <div style={{ flex: 1, textAlign: "center" }}>
                    <span
                      style={{
                        fontSize: 14,
                        color: "#6b7280",
                        fontWeight: 500,
                      }}
                    >
                      Halaman {page} dari 3
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={
                      submitting ||
                      (!evidence && !selectedTake5?.bukti_url) ||
                      !form.deskripsiTemuan
                    }
                    style={{
                      background:
                        submitting ||
                        (!evidence && !selectedTake5?.bukti_url) ||
                        !form.deskripsiTemuan
                          ? "#9ca3af"
                          : "#22c55e",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "12px 24px",
                      fontSize: 16,
                      fontWeight: 600,
                      cursor:
                        submitting ||
                        (!evidence && !selectedTake5?.bukti_url) ||
                        !form.deskripsiTemuan
                          ? "not-allowed"
                          : "pointer",
                      opacity:
                        submitting ||
                        (!evidence && !selectedTake5?.bukti_url) ||
                        !form.deskripsiTemuan
                          ? 0.5
                          : 1,
                    }}
                  >
                    {submitting ? "Menyimpan..." : "Simpan Hazard Report"}
                  </button>
                </div>
              </>
            </div>
          )}

          {submitError && (
            <div
              style={{
                color: "#ef4444",
                fontWeight: 500,
                fontSize: 15,
                textAlign: "center",
              }}
            >
              {submitError}
            </div>
          )}
          {submitSuccess && (
            <div
              style={{
                color: "#22c55e",
                fontWeight: 500,
                fontSize: 15,
                textAlign: "center",
              }}
            >
              Hazard Report berhasil disimpan!
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default HazardFormDesktop;
