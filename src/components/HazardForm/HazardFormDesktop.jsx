import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../../supabaseClient";
import Cropper from "react-easy-crop";
import getCroppedImg from "../Dropzone/cropImageUtil";
import {
  getLocationOptions,
  allowsCustomInput,
  shouldUseLocationSelector,
} from "../../config/siteLocations";
import PendingReportsList from "./PendingReportsList";
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
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [picOptions, setPicOptions] = useState([]);
  const [picDropdownOpen, setPicDropdownOpen] = useState(false);
  const [picSearchQuery, setPicSearchQuery] = useState("");
  const picInputRef = useRef();
  const picDropdownRef = useRef();
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

  // Prefill lokasi/dll jika report dipilih
  useEffect(() => {
    console.log(
      "useEffect triggered - selectedReport changed:",
      selectedReport
    );
    console.log(
      "SelectedReport full data:",
      JSON.stringify(selectedReport, null, 2)
    );

    if (selectedReport) {
      console.log("Selected Report Data:", selectedReport);
      console.log("PTO ID Check:", {
        id: selectedReport.id, // This is the PTO ID from planned_task_observation table
        sumber_laporan: selectedReport.sumber_laporan,
      });
      console.log("PIC Data:", {
        nrp_pic: selectedReport.nrp_pic,
        pic_tindak_lanjut_id: selectedReport.pic_tindak_lanjut_id,
        site: selectedReport.site,
      });
      console.log("PIC Field Value:", selectedReport.nrp_pic);
      console.log("Foto Temuan:", selectedReport.foto_temuan);

      // Debug: Check PIC autofill logic
      console.log("=== PIC AUTOFILL DEBUG ===");
      console.log("Selected Report Type:", selectedReport.sumber_laporan);
      console.log("NRP PIC Value:", selectedReport.nrp_pic);
      console.log("PIC Field Value:", selectedReport.pic);
      console.log(
        "Will PIC be filled?",
        selectedReport.sumber_laporan === "PTO" ? "YES" : "NO"
      );
      console.log(
        "PIC Value to be set:",
        selectedReport.sumber_laporan === "PTO"
          ? selectedReport.nrp_pic || ""
          : ""
      );
      console.log("=== END PIC AUTOFILL DEBUG ===");

      setForm((prev) => ({
        ...prev,
        lokasi: selectedReport.site || selectedReport.lokasi,
        detailLokasi: selectedReport.detail_lokasi,
        pic:
          selectedReport.sumber_laporan === "PTO"
            ? selectedReport.nrp_pic || ""
            : "", // Prefill PIC hanya dari PTO, bukan Take 5
      }));

      // Auto-fill evidence preview jika ada foto temuan dari PTO
      console.log("Checking foto_temuan:", selectedReport.foto_temuan);
      console.log("Current evidencePreview:", evidencePreview);

      if (selectedReport.foto_temuan) {
        const fotoUrl = selectedReport.foto_temuan;
        const isValidUrl =
          fotoUrl &&
          (typeof fotoUrl === "string") &&
          (fotoUrl.startsWith("http") || fotoUrl.includes("supabase.co"));
        if (isValidUrl) {
          setEvidencePreview(fotoUrl);
          setEvidence(null);
        } else {
          setEvidencePreview(null);
        }
      } else {
        setEvidencePreview(null);
      }
    }
  }, [selectedReport]);

  // Default lokasi dari site yang didaftarkan pekerja (masih dapat diubah)
  useEffect(() => {
    if (user?.site && !selectedReport) {
      setForm((prev) =>
        prev.lokasi === "" ? { ...prev, lokasi: user.site } : prev
      );
    }
  }, [user?.site, selectedReport]);

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
        // Filter out current user dari PIC options, urutkan abjad
        const filteredPIC = data
          .map((u) => u.nama)
          .filter(Boolean)
          .filter((nama) => nama !== user.nama) // Exclude current user
          .sort((a, b) => a.localeCompare(b, "id"));
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
      // Reset detail lokasi when lokasi changes, but not when report is selected
      if (!selectedReport) {
        setForm((prev) => ({ ...prev, detailLokasi: "" }));
      }
      setShowCustomInput(false);
    } else {
      setLocationOptions([]);
      if (!selectedReport) {
        setForm((prev) => ({ ...prev, detailLokasi: "" }));
      }
      setShowCustomInput(false);
    }
  }, [form.lokasi, selectedReport]);

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

  // Tutup dropdown PIC saat klik di luar
  useEffect(() => {
    const handler = (e) => {
      if (
        picDropdownRef.current &&
        !picDropdownRef.current.contains(e.target)
      ) {
        setPicDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
      } else if (selectedReport?.foto_temuan) {
        // Jika tidak ada foto baru tapi ada foto dari report, gunakan foto dari report
        evidenceUrl = selectedReport.foto_temuan;
      }

      // Cari evaluator berdasarkan site pelaporan
      let evaluatorNama = null;
      console.log("Searching for evaluator with site:", form.lokasi);

      if (form.lokasi) {
        // Coba dengan berbagai kemungkinan case untuk role evaluator
        let evaluatorData = null;
        let evaluatorError = null;

        // Coba "Evaluator" (capital E)
        const { data: data1, error: error1 } = await supabase
          .from("users")
          .select("nama")
          .eq("site", form.lokasi)
          .eq("role", "Evaluator")
          .limit(1);

        if (!error1 && data1 && data1.length > 0) {
          evaluatorData = data1;
          evaluatorError = error1;
          console.log("Evaluator found with role 'Evaluator'");
        } else {
          // Coba "evaluator" (lowercase)
          const { data: data2, error: error2 } = await supabase
            .from("users")
            .select("nama")
            .eq("site", form.lokasi)
            .eq("role", "evaluator")
            .limit(1);

          if (!error2 && data2 && data2.length > 0) {
            evaluatorData = data2;
            evaluatorError = error2;
            console.log("Evaluator found with role 'evaluator'");
          } else {
            // Coba dengan ilike untuk case-insensitive search
            const { data: data3, error: error3 } = await supabase
              .from("users")
              .select("nama")
              .eq("site", form.lokasi)
              .ilike("role", "%evaluator%")
              .limit(1);

            if (!error3 && data3 && data3.length > 0) {
              evaluatorData = data3;
              evaluatorError = error3;
              console.log("Evaluator found with case-insensitive search");
            } else {
              evaluatorError = error3;
              console.log("No evaluator found with any case variation");
            }
          }
        }

        console.log("Evaluator search result:", {
          evaluatorData,
          evaluatorError,
        });

        if (!evaluatorError && evaluatorData && evaluatorData.length > 0) {
          evaluatorNama = evaluatorData[0].nama;
          console.log("Evaluator found:", evaluatorNama);
        } else {
          console.log("No evaluator found for site:", form.lokasi);
        }
      } else {
        console.log("No site selected, cannot search for evaluator");
      }

      const hazardData = {
        user_id: user.id,
        user_perusahaan: user.perusahaan || null,
        pelapor_nama: user.nama,
        pelapor_nrp: user.nrp || null,
        lokasi: form.lokasi,
        detail_lokasi: form.detailLokasi,
        keterangan_lokasi: form.keteranganLokasi,
        pic: form.pic,
        ketidaksesuaian: form.ketidaksesuaian,
        sub_ketidaksesuaian: form.subKetidaksesuaian,
        quick_action: form.quickAction,
        deskripsi_temuan: form.deskripsiTemuan,
        evidence: evidenceUrl,
        created_at: new Date().toISOString(),
        status: "Submit",
        evaluator_nama: evaluatorNama,
        take_5_id:
          selectedReport?.sumber_laporan === "Take5"
            ? selectedReport?.id
            : null,
        pto_id:
          selectedReport?.sumber_laporan === "PTO" ? selectedReport?.id : null,
        sumber_laporan: selectedReport?.sumber_laporan || null,
        id_sumber_laporan: selectedReport?.id || null, // Keep for backward compatibility
      };

      console.log("Hazard data to be inserted:", hazardData);
      console.log("=== PTO LINKING DEBUG ===");
      console.log("Selected Report Type:", selectedReport?.sumber_laporan);
      console.log("Selected Report ID:", selectedReport?.id);
      console.log(
        "PTO_ID to be inserted:",
        selectedReport?.sumber_laporan === "PTO" ? selectedReport?.id : null
      );
      console.log(
        "TAKE5_ID to be inserted:",
        selectedReport?.sumber_laporan === "Take5" ? selectedReport?.id : null
      );
      console.log("==========================");
      console.log("Selected Report Details:", {
        id: selectedReport?.id, // This is the PTO/Take5 ID from source table
        sumber_laporan: selectedReport?.sumber_laporan,
        foto_temuan: selectedReport?.foto_temuan,
        pto_id:
          selectedReport?.sumber_laporan === "PTO" ? selectedReport?.id : null,
        take_5_id:
          selectedReport?.sumber_laporan === "Take5"
            ? selectedReport?.id
            : null,
      });

      const { error } = await supabase.from("hazard_report").insert(hazardData);

      if (error) throw error;

      // Take 5 status tetap "pending" sampai workflow Tasklist selesai (status "closed")
      // Status akan diupdate oleh TasklistStatusUpdater ketika hazard_report status menjadi "closed"

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
      setSelectedReport(null);
      setSelectedReportId(null);
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
        width: "100%",
        height: "100vh",
        background: "transparent",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "0 80px 0 24px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: "transparent",
          borderRadius: 18,
          boxShadow: "none",
          padding: 16,
          maxWidth: 800,
          width: "100%",
          margin: "0 auto",
          color: "#e5e7eb",
        }}
      >
        <h2
          style={{
            fontWeight: 900,
            fontSize: 28,
            color: "#60a5fa",
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
                background: page >= pageNum ? "#2563eb" : "#334155",
                color: page >= pageNum ? "#fff" : "#94a3b8",
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
                    background: page > pageNum ? "#2563eb" : "#334155",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Pending Reports List - dropdown untuk desktop */}
        <PendingReportsList
          user={user}
          onSelectReport={(report) => {
            setSelectedReport(report);
            setSelectedReportId(report?.id || null);
          }}
          selectedReportId={selectedReportId}
          variant="desktop"
        />

        {/* Page Title */}
        <div
          style={{
            textAlign: "center",
            marginBottom: 24,
            color: "#9ca3af",
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
            height: "400px",
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
                      color: "#e5e7eb",
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
                    disabled={!!selectedReport}
                    style={{
                      width: "100%",
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 15,
                      border: "1px solid #334155",
                      background: !!selectedReport ? "#1f2937" : "#0b1220",
                      color: !!selectedReport ? "#9ca3af" : "#e5e7eb",
                      cursor: !!selectedReport ? "not-allowed" : "pointer",
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
                      color: "#e5e7eb",
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
                            : "Pilih Detail Lokasi"
                        }
                        disabled={!!selectedReport || !form.lokasi}
                        style={{
                          width: "100%",
                          borderRadius: 8,
                          padding: 12,
                          fontSize: 15,
                          border: "1px solid #334155",
                          background: "#0b1220",
                          color: "#e5e7eb",
                        }}
                        required
                      />
                    </>
                  ) : (
                    <input
                      type="text"
                      name="detailLokasi"
                      value={form.detailLokasi}
                      onChange={handleChange}
                      required
                      disabled={!!selectedReport}
                      placeholder="Ketik detail lokasi..."
                      style={{
                        width: "100%",
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 15,
                        border: "1px solid #334155",
                        background: !!selectedReport ? "#1f2937" : "#0b1220",
                        color: !!selectedReport ? "#9ca3af" : "#e5e7eb",
                      }}
                    />
                  )}
                </div>

                <div style={{ marginBottom: 6 }}>
                  <label
                    style={{
                      fontWeight: 600,
                      color: "#e5e7eb",
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
                    placeholder="Jelaskan detail lokasi temuan hazard"
                    style={{
                      width: "100%",
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 15,
                      resize: "vertical",
                      border: "1px solid #334155",
                      background: "#0b1220",
                      color: "#e5e7eb",
                    }}
                  />
                </div>

                <div style={{ marginBottom: 6, position: "relative" }}>
                  <label
                    style={{
                      fontWeight: 600,
                      color: "#e5e7eb",
                      marginBottom: 4,
                      display: "block",
                      textAlign: "center",
                    }}
                  >
                    PIC (Person In Charge)
                    {selectedReport?.sumber_laporan === "PTO" && (
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#10b981",
                          marginLeft: "8px",
                        }}
                      >
                        (Auto-filled dari PTO)
                      </span>
                    )}
                  </label>
                  {selectedReport?.sumber_laporan === "PTO" || !form.lokasi ? (
                    <input
                      type="text"
                      readOnly
                      value={form.pic}
                      placeholder={
                        !form.lokasi ? "Pilih lokasi terlebih dahulu" : ""
                      }
                      style={{
                        width: "100%",
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 15,
                        border: "1px solid #334155",
                        background: !form.lokasi ? "#1f2937" : "#0b1220",
                        color: !form.lokasi ? "#9ca3af" : "#e5e7eb",
                        cursor: "not-allowed",
                        opacity:
                          selectedReport?.sumber_laporan === "PTO" ? 0.7 : 1,
                        boxSizing: "border-box",
                      }}
                    />
                  ) : (
                    <div
                      ref={picDropdownRef}
                      style={{ position: "relative" }}
                    >
                      <input
                        ref={picInputRef}
                        type="text"
                        value={
                          picDropdownOpen ? picSearchQuery : form.pic
                        }
                        onChange={(e) => {
                          setPicSearchQuery(e.target.value);
                          setPicDropdownOpen(true);
                        }}
                        onFocus={() => {
                          setPicSearchQuery(form.pic || "");
                          setPicDropdownOpen(true);
                        }}
                        placeholder="Ketik nama untuk mencari..."
                        style={{
                          width: "100%",
                          borderRadius: 8,
                          padding: 12,
                          fontSize: 15,
                          border: "1px solid #334155",
                          background: "#0b1220",
                          color: "#e5e7eb",
                          boxSizing: "border-box",
                        }}
                      />
                      {picDropdownOpen && (
                        <div
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            marginTop: 4,
                            maxHeight: 200,
                            overflowY: "auto",
                            background: "#1f2937",
                            border: "1px solid #374151",
                            borderRadius: 8,
                            zIndex: 1000,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                          }}
                        >
                          {picOptions
                            .filter((opt) =>
                              opt
                                .toLowerCase()
                                .includes(picSearchQuery.toLowerCase())
                            )
                            .map((opt) => (
                              <div
                                key={opt}
                                onClick={() => {
                                  setForm((prev) => ({
                                    ...prev,
                                    pic: opt,
                                  }));
                                  setPicDropdownOpen(false);
                                  setPicSearchQuery("");
                                }}
                                style={{
                                  padding: "10px 12px",
                                  cursor: "pointer",
                                  color: "#e5e7eb",
                                  fontSize: 15,
                                  borderBottom:
                                    "1px solid #374151",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "#374151";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "transparent";
                                }}
                              >
                                {opt}
                              </div>
                            ))}
                          {picOptions.filter((opt) =>
                            opt
                              .toLowerCase()
                              .includes(picSearchQuery.toLowerCase())
                          ).length === 0 && (
                            <div
                              style={{
                                padding: 12,
                                color: "#9ca3af",
                                fontSize: 14,
                              }}
                            >
                              Tidak ada nama yang sesuai
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
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
                        color: "#9ca3af",
                        fontWeight: 500,
                      }}
                    >
                      Halaman {page} dari 3
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!form.lokasi || !form.detailLokasi || !form.pic}
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
                      color: "#e5e7eb",
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
                      padding: 12,
                      fontSize: 15,
                      border: "1px solid #334155",
                      background: "#0b1220",
                      color: "#e5e7eb",
                    }}
                  >
                    <option value="">Pilih Ketidaksesuaian</option>
                    <option value="APD">APD</option>
                    <option value="Area Parkir">Area Parkir</option>
                    <option value="Bahaya Peledakan">Bahaya Peledakan</option>
                    <option value="Bahaya Biologi">Bahaya Biologi</option>
                    <option value="Bahaya Elektrikal">Bahaya Elektrikal</option>
                    <option value="External Issue">External Issue</option>
                    <option value="Fasilitas Mixing Plant">
                      Fasilitas Mixing Plant
                    </option>
                    <option value="Fasilitas Office">Fasilitas Office</option>
                    <option value="Fasilitas Workshop">
                      Fasilitas Workshop
                    </option>
                    <option value="Izin Kerja">Izin Kerja</option>
                    <option value="Kelayakan Bangunan">
                      Kelayakan Bangunan
                    </option>
                    <option value="Kelayakan Tools">Kelayakan Tools</option>
                    <option value="Kelengkapan Tanggap Darurat">
                      Kelengkapan Tanggap Darurat
                    </option>
                    <option value="Kondisi Fisik Pekerja">
                      Kondisi Fisik Pekerja
                    </option>
                    <option value="Kondisi Kendaraan/Unit">
                      Kondisi Kendaraan/Unit
                    </option>
                    <option value="Lingkungan Kerja">Lingkungan Kerja</option>
                    <option value="Penandaan">Penandaan</option>
                    <option value="Rambu">Rambu</option>
                    <option value="Tools Inspection">Tools Inspection</option>
                  </select>
                </div>

                <div style={{ marginBottom: 6 }}>
                  <label
                    style={{
                      fontWeight: 600,
                      color: "#e5e7eb",
                      marginBottom: 4,
                      display: "block",
                      textAlign: "center",
                    }}
                  >
                    Sub Ketidaksesuaian
                  </label>
                  {form.ketidaksesuaian === "APD" ? (
                    <select
                      name="subKetidaksesuaian"
                      value={form.subKetidaksesuaian}
                      onChange={handleChange}
                      required
                      style={{
                        width: "100%",
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 15,
                        border: "1px solid #334155",
                        background: "#0b1220",
                        color: "#e5e7eb",
                      }}
                    >
                      <option value="">Pilih Sub Ketidaksesuaian</option>
                      <option value="Cara Penggunaan APD">
                        Cara Penggunaan APD
                      </option>
                      <option value="Kesesuaian dan Kelayakan APD">
                        Kesesuaian dan Kelayakan APD
                      </option>
                      <option value="Pengawas Tidak Memastikan Kesesuaian dan Kelayakan APD Pekerja Saat Aktivitas Telah Berlangsung">
                        Pengawas Tidak Memastikan Kesesuaian dan Kelayakan APD
                        Pekerja Saat Aktivitas Telah Berlangsung
                      </option>
                      <option value="Tidak Menggunakan APD">
                        Tidak Menggunakan APD
                      </option>
                    </select>
                  ) : form.ketidaksesuaian === "Area Parkir" ? (
                    <select
                      name="subKetidaksesuaian"
                      value={form.subKetidaksesuaian}
                      onChange={handleChange}
                      required
                      style={{
                        width: "100%",
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 15,
                        border: "1px solid #334155",
                        background: "#0b1220",
                        color: "#e5e7eb",
                      }}
                    >
                      <option value="">Pilih Sub Ketidaksesuaian</option>
                      <option value="Area Parkir tidak aman dari radius unit hauler">
                        Area Parkir tidak aman dari radius unit hauler
                      </option>
                      <option value="Jarak parkir unit tidak standar">
                        Jarak parkir unit tidak standar
                      </option>
                      <option value="Kendaraan/Unit Parkir di Area yang Tidak Rata">
                        Kendaraan/Unit Parkir di Area yang Tidak Rata
                      </option>
                      <option value="Pengawas Tidak Memasang Rambu Parkir saat Aktivitas Telah Berlangsung">
                        Pengawas Tidak Memasang Rambu Parkir saat Aktivitas
                        Telah Berlangsung
                      </option>
                      <option value="Tidak Ada Area Parkir">
                        Tidak Ada Area Parkir
                      </option>
                      <option value="Tidak ada Perbaikan Area Parkir yang Tidak Rata">
                        Tidak ada Perbaikan Area Parkir yang Tidak Rata
                      </option>
                      <option value="Tidak ada Rambu Parkir">
                        Tidak ada Rambu Parkir
                      </option>
                      <option value="Tidak ada Stopper">
                        Tidak ada Stopper
                      </option>
                      <option value="Tidak tersedia pembatas antar unit">
                        Tidak tersedia pembatas antar unit
                      </option>
                    </select>
                  ) : form.ketidaksesuaian === "Bahaya Peledakan" ? (
                    <select
                      name="subKetidaksesuaian"
                      value={form.subKetidaksesuaian}
                      onChange={handleChange}
                      required
                      style={{
                        width: "100%",
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 15,
                        border: "1px solid #334155",
                        background: "#0b1220",
                        color: "#e5e7eb",
                      }}
                    >
                      <option value="">Pilih Sub Ketidaksesuaian</option>
                      <option value="Akses Menuju lokasi peledakan/gudang handak tidak layak">
                        Akses Menuju lokasi peledakan/gudang handak tidak layak
                      </option>
                      <option value="Area manuver MMU / Anfo Truck tidak memadai">
                        Area manuver MMU / Anfo Truck tidak memadai
                      </option>
                      <option value="Area penyimpanan bahan peledak pada lokasi peledakan tidak di atur dengan baik">
                        Area penyimpanan bahan peledak pada lokasi peledakan
                        tidak di atur dengan baik
                      </option>
                      <option value="Box unit pengangkut bahan peledak tidak digembok">
                        Box unit pengangkut bahan peledak tidak digembok
                      </option>
                      <option value="High/Low wall & crest area peledakan tidak aman">
                        High/Low wall & crest area peledakan tidak aman
                      </option>
                      <option value="Jarak lubang ledak terhadap jalan aktif terlalu dekat">
                        Jarak lubang ledak terhadap jalan aktif terlalu dekat
                      </option>
                      <option value="Jarak unit drilling terlalu dekat dengan MMU/ Anfo Truck">
                        Jarak unit drilling terlalu dekat dengan MMU/ Anfo Truck
                      </option>
                      <option value="Jumlah unit yang dikawal melebihi batas jumlah yang diperbolehkan">
                        Jumlah unit yang dikawal melebihi batas jumlah yang
                        diperbolehkan
                      </option>
                      <option value="Kemiringan jalan akses masuk area peledakan > 10%">
                        Kemiringan jalan akses masuk area peledakan &gt; 10%
                      </option>
                      <option value="Kondisi permukaan jalan akses peledakan tidak Keras/Kering/bergelombang/rata">
                        Kondisi permukaan jalan akses peledakan tidak
                        Keras/Kering/bergelombang/rata
                      </option>
                      <option value="Lebar jalan akses masuk area peledakan <8 meter">
                        Lebar jalan akses masuk area peledakan &lt; 8 meter
                      </option>
                      <option value="Lokasi peledakan dan pengeboran tidak diberi jarak/batas">
                        Lokasi peledakan dan pengeboran tidak diberi jarak/batas
                      </option>
                      <option value="Lokasi Teras Area Peledakan tidak memadai">
                        Lokasi Teras Area Peledakan tidak memadai
                      </option>
                      <option value="Lubang tidak di sounding sebelum melakukan pengisian">
                        Lubang tidak di sounding sebelum melakukan pengisian
                      </option>
                      <option value="Man Power yang bekerja pada area peledakan tidak memiliki lisensi/ lisensi expired">
                        Man Power yang bekerja pada area peledakan tidak
                        memiliki lisensi/ lisensi expired
                      </option>
                      <option value="Melakukan pemuatan dan pengangkutan bahan peledak tanpa Juru Ledak">
                        Melakukan pemuatan dan pengangkutan bahan peledak tanpa
                        Juru Ledak
                      </option>
                      <option value="Melakukan pemuatan dan pengangkutan bahan peledak tanpa pengawalan">
                        Melakukan pemuatan dan pengangkutan bahan peledak tanpa
                        pengawalan
                      </option>
                      <option value="Melakukan pemuatan dan pengangkutan bahan peledak tanpa pengamanan">
                        Melakukan pemuatan dan pengangkutan bahan peledak tanpa
                        pengamanan
                      </option>
                      <option value="Pengisian Bahan peledak overcharge">
                        Pengisian Bahan peledak overcharge
                      </option>
                      <option value="Tanggul lokasi peledakan tidak sesuai standar">
                        Tanggul lokasi peledakan tidak sesuai standar
                      </option>
                      <option value="Terdapat lubang collapse/Lumpur/Miring">
                        Terdapat lubang collapse/Lumpur/Miring
                      </option>
                      <option value="Terdapat Lubang Panas/Reaktif pada Area Peledakan">
                        Terdapat Lubang Panas/Reaktif pada Area Peledakan
                      </option>
                      <option value="Terdapat Material Menggantung">
                        Terdapat Material Menggantung
                      </option>
                    </select>
                  ) : form.ketidaksesuaian === "Bahaya Biologi" ? (
                    <select
                      name="subKetidaksesuaian"
                      value={form.subKetidaksesuaian}
                      onChange={handleChange}
                      required
                      style={{
                        width: "100%",
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 15,
                        border: "1px solid #334155",
                        background: "#0b1220",
                        color: "#e5e7eb",
                      }}
                    >
                      <option value="">Pilih Sub Ketidaksesuaian</option>
                      <option value="Bahaya hewan buas">
                        Bahaya hewan buas
                      </option>
                      <option value="Pengawas gagal mengidentifikasi bahaya biologis">
                        Pengawas gagal mengidentifikasi bahaya biologis
                      </option>
                      <option value="Terdapat tanamanan merambat yang lebat diarea kerja yang berpotensi menjadi sarang ular">
                        Terdapat tanamanan merambat yang lebat diarea kerja yang
                        berpotensi menjadi sarang ular
                      </option>
                      <option value="Tidak melakukan pemeliharaan rumput liar di area kerja">
                        Tidak melakukan pemeliharaan rumput liar di area kerja
                      </option>
                      <option value="Pohon kering">Pohon kering</option>
                      <option value="Serangga">Serangga</option>
                    </select>
                  ) : form.ketidaksesuaian === "Bahaya Elektrikal" ? (
                    <select
                      name="subKetidaksesuaian"
                      value={form.subKetidaksesuaian}
                      onChange={handleChange}
                      required
                      style={{
                        width: "100%",
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 15,
                        border: "1px solid #334155",
                        background: "#0b1220",
                        color: "#e5e7eb",
                      }}
                    >
                      <option value="">Pilih Sub Ketidaksesuaian</option>
                      <option value="Instalasi listrik tidak layak">
                        Instalasi listrik tidak layak
                      </option>
                      <option value="Kabel tidak layak">
                        Kabel tidak layak
                      </option>
                      <option value="Pengamanan peralatan listrik">
                        Pengamanan peralatan listrik
                      </option>
                      <option value="Pengawas tidak melakukan pengamanan peralatan listrik">
                        Pengawas tidak melakukan pengamanan peralatan listrik
                      </option>
                      <option value="Pengawas tidak memastikan kelayakan instalasi listrik saat aktivitas telah berlangsung">
                        Pengawas tidak memastikan kelayakan instalasi listrik
                        saat aktivitas telah berlangsung
                      </option>
                      <option value="Pengawas tidak mengidentifikasi potensi arus pendek saat aktivitas telah berlangsung">
                        Pengawas tidak mengidentifikasi potensi arus pendek saat
                        aktivitas telah berlangsung
                      </option>
                      <option value="Potensi arus pendek">
                        Potensi arus pendek
                      </option>
                    </select>
                  ) : form.ketidaksesuaian === "External Issue" ? (
                    <select
                      name="subKetidaksesuaian"
                      value={form.subKetidaksesuaian}
                      onChange={handleChange}
                      required
                      style={{
                        width: "100%",
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 15,
                        border: "1px solid #334155",
                        background: "#0b1220",
                        color: "#e5e7eb",
                      }}
                    >
                      <option value="">Pilih Sub Ketidaksesuaian</option>
                      <option value="External Issue">External Issue</option>
                    </select>
                  ) : form.ketidaksesuaian === "Fasilitas Mixing Plant" ? (
                    <select
                      name="subKetidaksesuaian"
                      value={form.subKetidaksesuaian}
                      onChange={handleChange}
                      required
                      style={{
                        width: "100%",
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 15,
                        border: "1px solid #334155",
                        background: "#0b1220",
                        color: "#e5e7eb",
                      }}
                    >
                      <option value="">Pilih Sub Ketidaksesuaian</option>
                      <option value="Filter rusak">Filter rusak</option>
                      <option value="Generator Rusak">Generator Rusak</option>
                      <option value="Penerangan Tidak Standar">
                        Penerangan Tidak Standar
                      </option>
                      <option value="Peralatan belum dilakukan kalibrasi">
                        Peralatan belum dilakukan kalibrasi
                      </option>
                      <option value="Tidak ada penerangan">
                        Tidak ada penerangan
                      </option>
                      <option value="Tidak dilakukan perawatan rutin peralatan">
                        Tidak dilakukan perawatan rutin peralatan
                      </option>
                    </select>
                  ) : form.ketidaksesuaian === "Fasilitas Office" ? (
                    <select
                      name="subKetidaksesuaian"
                      value={form.subKetidaksesuaian}
                      onChange={handleChange}
                      required
                      style={{
                        width: "100%",
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 15,
                        border: "1px solid #334155",
                        background: "#0b1220",
                        color: "#e5e7eb",
                      }}
                    >
                      <option value="">Pilih Sub Ketidaksesuaian</option>
                      <option value="Area Merokok tidak bersih">
                        Area Merokok tidak bersih
                      </option>
                      <option value="Pantry Tidak Bersih">
                        Pantry Tidak Bersih
                      </option>
                      <option value="Peralatan listrik belum dilakukan inspeksi berkala">
                        Peralatan listrik belum dilakukan inspeksi berkala
                      </option>
                      <option value="Penerangan Tidak standar">
                        Penerangan Tidak standar
                      </option>
                      <option value="Tidak ada penerangan">
                        Tidak ada penerangan
                      </option>
                      <option value="Toilet Rusak">Toilet Rusak</option>
                    </select>
                  ) : form.ketidaksesuaian === "Fasilitas Workshop" ? (
                    <select
                      name="subKetidaksesuaian"
                      value={form.subKetidaksesuaian}
                      onChange={handleChange}
                      required
                      style={{
                        width: "100%",
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 15,
                        border: "1px solid #334155",
                        background: "#0b1220",
                        color: "#e5e7eb",
                      }}
                    >
                      <option value="">Pilih Sub Ketidaksesuaian</option>
                      <option value="Lifting gear tidak ditagging">
                        Lifting gear tidak ditagging
                      </option>
                      <option value="Pad workshop kotor">
                        Pad workshop kotor
                      </option>
                      <option value="Penerangan Tidak standar">
                        Penerangan Tidak standar
                      </option>
                      <option value="Saluran Air / Drainase tidak ada">
                        Saluran Air / Drainase tidak ada
                      </option>
                      <option value="Saluran Air / Drainase untuk fasilitas workshop tersumbat">
                        Saluran Air / Drainase untuk fasilitas workshop
                        tersumbat
                      </option>
                      <option value="Tidak ada Penerangan">
                        Tidak ada Penerangan
                      </option>
                    </select>
                  ) : form.ketidaksesuaian === "Izin Kerja" ? (
                    <select
                      name="subKetidaksesuaian"
                      value={form.subKetidaksesuaian}
                      onChange={handleChange}
                      required
                      style={{
                        width: "100%",
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 15,
                        border: "1px solid #334155",
                        background: "#0b1220",
                        color: "#e5e7eb",
                      }}
                    >
                      <option value="">Pilih Sub Ketidaksesuaian</option>
                      <option value="Izin Bekerja Ruang Terbatas Expired">
                        Izin Bekerja Ruang Terbatas Expired
                      </option>
                      <option value="Izin Bekerja Ruang Terbatas Tidak Sesuai">
                        Izin Bekerja Ruang Terbatas Tidak Sesuai
                      </option>
                      <option value="Izin Bekerja Ruang Terbatas Tidak Tersedia">
                        Izin Bekerja Ruang Terbatas Tidak Tersedia
                      </option>
                      <option value="Izin Bekerja diketinggian Expired">
                        Izin Bekerja diketinggian Expired
                      </option>
                      <option value="Izin Bekerja diketinggian Tidak Tersedia">
                        Izin Bekerja diketinggian Tidak Tersedia
                      </option>
                      <option value="Izin Bekerja diketinggian tidak sesuai">
                        Izin Bekerja diketinggian tidak sesuai
                      </option>
                      <option value="Izin Kerja Panas Expired">
                        Izin Kerja Panas Expired
                      </option>
                      <option value="Izin Kerja Panas Tidak Tersedia">
                        Izin Kerja Panas Tidak Tersedia
                      </option>
                      <option value="Izin Kerja panas Tidak Sesuai">
                        Izin Kerja panas Tidak Sesuai
                      </option>
                    </select>
                  ) : form.ketidaksesuaian === "Kelayakan Bangunan" ? (
                    <select
                      name="subKetidaksesuaian"
                      value={form.subKetidaksesuaian}
                      onChange={handleChange}
                      required
                      style={{
                        width: "100%",
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 15,
                        border: "1px solid #334155",
                        background: "#0b1220",
                        color: "#e5e7eb",
                      }}
                    >
                      <option value="">Pilih Sub Ketidaksesuaian</option>
                      <option value="Bangunan Rusak">Bangunan Rusak</option>
                      <option value="Kelayakan Bangunan">
                        Kelayakan Bangunan
                      </option>
                    </select>
                  ) : form.ketidaksesuaian === "Kelayakan Tools" ? (
                    <select
                      name="subKetidaksesuaian"
                      value={form.subKetidaksesuaian}
                      onChange={handleChange}
                      required
                      style={{
                        width: "100%",
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 15,
                        border: "1px solid #334155",
                        background: "#0b1220",
                        color: "#e5e7eb",
                      }}
                    >
                      <option value="">Pilih Sub Ketidaksesuaian</option>
                      <option value="Kelayakan Common Tools">
                        Kelayakan Common Tools
                      </option>
                      <option value="Kelayakan Lifting Gear">
                        Kelayakan Lifting Gear
                      </option>
                      <option value="Kelayakan Small Equipment / Power Tools">
                        Kelayakan Small Equipment / Power Tools
                      </option>
                      <option value="Kelayakan Special Tools">
                        Kelayakan Special Tools
                      </option>
                      <option value="Kelayakan Supporting Tools">
                        Kelayakan Supporting Tools
                      </option>
                      <option value="Kesesuaian Penggunaan Common Tools">
                        Kesesuaian Penggunaan Common Tools
                      </option>
                      <option value="Kesesuaian Penggunaan Lifting Gear">
                        Kesesuaian Penggunaan Lifting Gear
                      </option>
                      <option value="Kesesuaian Penggunaan Small Equipment / Power Tools">
                        Kesesuaian Penggunaan Small Equipment / Power Tools
                      </option>
                      <option value="Kesesuaian Penggunaan Special Tools">
                        Kesesuaian Penggunaan Special Tools
                      </option>
                      <option value="Kesesuaian Penggunaan Supporting Tools">
                        Kesesuaian Penggunaan Supporting Tools
                      </option>
                      <option value="Pelabelan/Penandaan Lifting Gear">
                        Pelabelan/Penandaan Lifting Gear
                      </option>
                      <option value="Pelabelan/Penandaan Small Equipment / Power Tools">
                        Pelabelan/Penandaan Small Equipment / Power Tools
                      </option>
                      <option value="Pelabelan/Penandaan Special Tools">
                        Pelabelan/Penandaan Special Tools
                      </option>
                      <option value="Pelabelan/Penandaan Supporting Tools">
                        Pelabelan/Penandaan Supporting Tools
                      </option>
                    </select>
                  ) : form.ketidaksesuaian === "Kelengkapan Tanggap Darurat" ? (
                    <select
                      name="subKetidaksesuaian"
                      value={form.subKetidaksesuaian}
                      onChange={handleChange}
                      required
                      style={{
                        width: "100%",
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 15,
                        border: "1px solid #334155",
                        background: "#0b1220",
                        color: "#e5e7eb",
                      }}
                    >
                      <option value="">Pilih Sub Ketidaksesuaian</option>
                      <option value="Alat Tanggap Darurat Belum Dilakukan Inspeksi">
                        Alat Tanggap Darurat Belum Dilakukan Inspeksi
                      </option>
                      <option value="Emergency Alarm Tidak Berfungsi">
                        Emergency Alarm Tidak Berfungsi
                      </option>
                      <option value="Eye Wash">Eye Wash</option>
                      <option value="Fire Apparatus">Fire Apparatus</option>
                      <option value="Fire Suspression">Fire Suspression</option>
                      <option value="Jalur Evakuasi">Jalur Evakuasi</option>
                      <option value="Kelengkapan P3K">Kelengkapan P3K</option>
                      <option value="Pengawas Tidak Melakukan Inspeksi Alat Tanggap Darurat">
                        Pengawas Tidak Melakukan Inspeksi Alat Tanggap Darurat
                      </option>
                      <option value="Pengawas Tidak Memeriksa Kelayakan Eyewash">
                        Pengawas Tidak Memeriksa Kelayakan Eyewash
                      </option>
                      <option value="Refill APAR">Refill APAR</option>
                    </select>
                  ) : form.ketidaksesuaian === "Kondisi Fisik Pekerja" ? (
                    <select
                      name="subKetidaksesuaian"
                      value={form.subKetidaksesuaian}
                      onChange={handleChange}
                      required
                      style={{
                        width: "100%",
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 15,
                        border: "1px solid #334155",
                        background: "#0b1220",
                        color: "#e5e7eb",
                      }}
                    >
                      <option value="">Pilih Sub Ketidaksesuaian</option>
                      <option value="Cidera atau sakit yang dialami sebelumnya">
                        Cidera atau sakit yang dialami sebelumnya
                      </option>
                      <option value="Kekurangan Gula Darah">
                        Kekurangan Gula Darah
                      </option>
                      <option value="Kelelahan Karena Kurang Istirahat">
                        Kelelahan Karena Kurang Istirahat
                      </option>
                      <option value="Kelelahan karena Beban Kerja">
                        Kelelahan karena Beban Kerja
                      </option>
                      <option value="Sakit Akibat Mengkonsumsi Obat-obatan Terlarang atau minuman keras">
                        Sakit Akibat Mengkonsumsi Obat-obatan Terlarang atau
                        minuman keras
                      </option>
                      <option value="Unjuk Kerja menurun karena tingginya temperatur">
                        Unjuk Kerja menurun karena tingginya temperatur
                      </option>
                    </select>
                  ) : form.ketidaksesuaian === "Kondisi Kendaraan/Unit" ? (
                    <select
                      name="subKetidaksesuaian"
                      value={form.subKetidaksesuaian}
                      onChange={handleChange}
                      required
                      style={{
                        width: "100%",
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 15,
                        border: "1px solid #334155",
                        background: "#0b1220",
                        color: "#e5e7eb",
                      }}
                    >
                      <option value="">Pilih Sub Ketidaksesuaian</option>
                      <option value="Kelayakan Kendaraan/Unit">
                        Kelayakan Kendaraan/Unit
                      </option>
                      <option value="Mengoperasikan Kendaraan/Unit Yang Tidak Layak">
                        Mengoperasikan Kendaraan/Unit Yang Tidak Layak
                      </option>
                      <option value="Tidak Melakukan P2H">
                        Tidak Melakukan P2H
                      </option>
                    </select>
                  ) : form.ketidaksesuaian === "Lingkungan Kerja" ? (
                    <select
                      name="subKetidaksesuaian"
                      value={form.subKetidaksesuaian}
                      onChange={handleChange}
                      required
                      style={{
                        width: "100%",
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 15,
                        border: "1px solid #334155",
                        background: "#0b1220",
                        color: "#e5e7eb",
                      }}
                    >
                      <option value="">Pilih Sub Ketidaksesuaian</option>
                      <option value="Bahan Kimia yang Berbahaya">
                        Bahan Kimia yang Berbahaya
                      </option>
                      <option value="Ceceran B3">Ceceran B3</option>
                      <option value="Getaran">Getaran</option>
                      <option value="Kabut">Kabut</option>
                      <option value="Kebisingan">Kebisingan</option>
                      <option value="Lingkungan Berdebu">
                        Lingkungan Berdebu
                      </option>
                      <option value="Pencahayaan">Pencahayaan</option>
                      <option value="Pengawas Tidak Memastikan Pencahayaan yang Standard Sebelum Aktivitas Berlangsung">
                        Pengawas Tidak Memastikan Pencahayaan yang Standard
                        Sebelum Aktivitas Berlangsung
                      </option>
                      <option value="Radiasi">Radiasi</option>
                      <option value="Suhu Panas/dingin">
                        Suhu Panas/dingin
                      </option>
                      <option value="Swabakar">Swabakar</option>
                      <option value="Ventilasi Tidak Memadai">
                        Ventilasi Tidak Memadai
                      </option>
                    </select>
                  ) : form.ketidaksesuaian === "Penandaan" ? (
                    <select
                      name="subKetidaksesuaian"
                      value={form.subKetidaksesuaian}
                      onChange={handleChange}
                      required
                      style={{
                        width: "100%",
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 15,
                        border: "1px solid #334155",
                        background: "#0b1220",
                        color: "#e5e7eb",
                      }}
                    >
                      <option value="">Pilih Sub Ketidaksesuaian</option>
                      <option value="Barikade/ Safety line">
                        Barikade/ Safety line
                      </option>
                      <option value="Demarkasi">Demarkasi</option>
                      <option value="Ketidaksesuaian LOTO">
                        Ketidaksesuaian LOTO
                      </option>
                      <option value="Kode Warna">Kode Warna</option>
                      <option value="Labeling Tidak Ada">
                        Labeling Tidak Ada
                      </option>
                      <option value="Labeling Tidak Standar / Sesuai">
                        Labeling Tidak Standar / Sesuai
                      </option>
                      <option value="Pengawas Tidak Membuat Demarkasi Saat Aktivitas Telah Berlangsung">
                        Pengawas Tidak Membuat Demarkasi Saat Aktivitas Telah
                        Berlangsung
                      </option>
                      <option value="Pengawas Tidak Memasang Barikade / Safety Line saat Aktivitas Telah Berlangsung">
                        Pengawas Tidak Memasang Barikade / Safety Line saat
                        Aktivitas Telah Berlangsung
                      </option>
                      <option value="Pengawas Tidak Memberikan Kode Pewarnaan yang standar Saat Aktivitas Telah Berlangsung">
                        Pengawas Tidak Memberikan Kode Pewarnaan yang standar
                        Saat Aktivitas Telah Berlangsung
                      </option>
                      <option value="Pita Batas Radius Peledakan/ Sleepblast tidak ada">
                        Pita Batas Radius Peledakan/ Sleepblast tidak ada
                      </option>
                      <option value="Tidak Memasang LOTO">
                        Tidak Memasang LOTO
                      </option>
                    </select>
                  ) : form.ketidaksesuaian === "Tools Inspection" ? (
                    <select
                      name="subKetidaksesuaian"
                      value={form.subKetidaksesuaian}
                      onChange={handleChange}
                      required
                      style={{
                        width: "100%",
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 15,
                        border: "1px solid #334155",
                        background: "#0b1220",
                        color: "#e5e7eb",
                      }}
                    >
                      <option value="">Pilih Sub Ketidaksesuaian</option>
                      <option value="Tidak Ada Penjadwalan Tools Inspection untuk Suatu Area Pekerjaan">
                        Tidak Ada Penjadwalan Tools Inspection untuk Suatu Area
                        Pekerjaan
                      </option>
                      <option value="Tools Belum Dilakukan Inspeksi">
                        Tools Belum Dilakukan Inspeksi
                      </option>
                    </select>
                  ) : form.ketidaksesuaian === "Rambu" ? (
                    <select
                      name="subKetidaksesuaian"
                      value={form.subKetidaksesuaian}
                      onChange={handleChange}
                      required
                      style={{
                        width: "100%",
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 15,
                        border: "1px solid #334155",
                        background: "#0b1220",
                        color: "#e5e7eb",
                      }}
                    >
                      <option value="">Pilih Sub Ketidaksesuaian</option>
                      <option value="Kelayakan Rambu">Kelayakan Rambu</option>
                      <option value="Lampu Flip Flop Area Sleepblast belum Ada">
                        Lampu Flip Flop Area Sleepblast belum Ada
                      </option>
                      <option value="Pengawas Tidak Melakukan Perawatan rambu Sehingga Rambu Menjadi Tidak Layak">
                        Pengawas Tidak Melakukan Perawatan rambu Sehingga Rambu
                        Menjadi Tidak Layak
                      </option>
                      <option value="Pengawas Tidak Memasang Rambu Yang Memadai Saat Aktivitas Telah Berlangsung">
                        Pengawas Tidak Memasang Rambu Yang Memadai Saat
                        Aktivitas Telah Berlangsung
                      </option>
                      <option value="Pengawas Tidak Memasang Rambu Yang Sesuai saat Aktivitas Telah Berlangsung">
                        Pengawas Tidak Memasang Rambu Yang Sesuai saat Aktivitas
                        Telah Berlangsung
                      </option>
                      <option value="Posisi Rambu Tidak Sesuai">
                        Posisi Rambu Tidak Sesuai
                      </option>
                      <option value="Rambu Aktivitas Peledakan Tidak Terpasang">
                        Rambu Aktivitas Peledakan Tidak Terpasang
                      </option>
                      <option value="Rambu APD">Rambu APD</option>
                      <option value="Tidak Ada Rambu">Tidak Ada Rambu</option>
                      <option value="Tidak Terdapat Rambu Atau Bendera Radius Aman Manusia">
                        Tidak Terdapat Rambu Atau Bendera Radius Aman Manusia
                      </option>
                      <option value="Unit Breakdown Tanpa Alat Pengaman dan Rambu">
                        Unit Breakdown Tanpa Alat Pengaman dan Rambu
                      </option>
                    </select>
                  ) : (
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
                        padding: 12,
                        fontSize: 15,
                        border: "1px solid #334155",
                        background: "#0b1220",
                        color: "#e5e7eb",
                      }}
                    />
                  )}
                </div>

                <div style={{ marginBottom: 6 }}>
                  <label
                    style={{
                      fontWeight: 600,
                      color: "#e5e7eb",
                      marginBottom: 4,
                      display: "block",
                      textAlign: "center",
                    }}
                  >
                    Quick Action
                  </label>
                  <select
                    name="quickAction"
                    value={form.quickAction}
                    onChange={handleChange}
                    required
                    style={{
                      width: "100%",
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 15,
                      border: "1px solid #334155",
                      background: "#0b1220",
                      color: "#e5e7eb",
                    }}
                  >
                    <option value="">Pilih Quick Action</option>
                    <option value="Pekerjaan Dilakukan setelah Perbaikan Langsung">
                      Pekerjaan Dilakukan setelah Perbaikan Langsung
                    </option>
                    <option value="Stop Pekerjaan">Stop Pekerjaan</option>
                    <option value="Stop Pekerjaan Sampai Temuan Diperbaiki">
                      Stop Pekerjaan Sampai Temuan Diperbaiki
                    </option>
                  </select>
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
                        color: "#9ca3af",
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
                      color: "#e5e7eb",
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
                      padding: 12,
                      fontSize: 15,
                      resize: "vertical",
                      minHeight: "120px",
                      border: "1px solid #334155",
                      background: "#0b1220",
                      color: "#e5e7eb",
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
                    style={{ display: "none" }}
                  />
                  {evidencePreview ? (
                    <div style={{ textAlign: "center" }}>
                      {selectedReport?.foto_temuan && !evidence && (
                        <div
                          style={{
                            background: "#0b1220",
                            border: "1px solid #334155",
                            borderRadius: "8px",
                            padding: "8px",
                            marginBottom: "8px",
                            fontSize: "12px",
                            color: "#9ca3af",
                          }}
                        >
                          📸 Foto dari sumber laporan ({selectedReport.sumber_laporan}) - tidak dapat diganti
                        </div>
                      )}
                      <img
                        src={evidencePreview}
                        alt="Preview"
                        onClick={selectedReport?.foto_temuan && !evidence ? undefined : handleClickPreview}
                        onError={(e) => {
                          console.error(
                            "Image failed to load:",
                            evidencePreview
                          );
                          // Hide the broken image
                          e.target.style.display = "none";
                          setEvidencePreview(null);
                        }}
                        style={{
                          maxWidth: "100%",
                          maxHeight: 150,
                          borderRadius: 8,
                          border: "2px solid #334155",
                          cursor: selectedReport?.foto_temuan && !evidence ? "default" : "pointer",
                        }}
                        title={selectedReport?.foto_temuan && !evidence ? "Foto dari sumber" : "Klik untuk ganti foto"}
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleClickCamera}
                      style={{
                        width: "100%",
                        background: "#0b1220",
                        border: "2px dashed #334155",
                        borderRadius: 8,
                        padding: "16px",
                        fontSize: 15,
                        color: "#9ca3af",
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
                      (!evidence && !selectedReport?.foto_temuan) ||
                      !form.deskripsiTemuan
                    }
                    style={{
                      background:
                        submitting ||
                        (!evidence && !selectedReport?.foto_temuan) ||
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
                        (!evidence && !selectedReport?.foto_temuan) ||
                        !form.deskripsiTemuan
                          ? "not-allowed"
                          : "pointer",
                      opacity:
                        submitting ||
                        (!evidence && !selectedReport?.foto_temuan) ||
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
