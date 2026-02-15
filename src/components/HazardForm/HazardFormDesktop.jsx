import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../../supabaseClient";
import Cropper from "react-easy-crop";
import getCroppedImg from "../Dropzone/cropImageUtil";
import {
  allowsCustomInput,
  shouldUseLocationSelector,
} from "../../config/siteLocations";
import { SUB_OPTIONS, matchPotensiBahayaToKetidaksesuaian } from "../../config/hazardKetidaksesuaianOptions";
import { fetchKetidaksesuaianSubOptions } from "../../utils/masterDataHelpers";
import PendingReportsList from "./PendingReportsList";
import { getNowWITAISO } from "../../utils/dateTimeHelpers";
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
  const [subOptionsMap, setSubOptionsMap] = useState(null);
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

      let ketidaksesuaian = "";
      let subKetidaksesuaian = "";
      let deskripsiTemuan = selectedReport.deskripsi || selectedReport.deskripsi_kondisi || "Temuan dari observasi";
      let quickAction =
        selectedReport.sumber_laporan === "Take5"
          ? "STOP pekerjaan sesuai Take 5"
          : "Tindak lanjut PTO";

      if (selectedReport.sumber_laporan === "Take5" && selectedReport.potensi_bahaya) {
        const opts = subOptionsMap || SUB_OPTIONS;
        const matched = matchPotensiBahayaToKetidaksesuaian(selectedReport.potensi_bahaya, opts);
        ketidaksesuaian = matched.ketidaksesuaian || "";
        subKetidaksesuaian = matched.subKetidaksesuaian || "";
      }

      setForm((prev) => ({
        ...prev,
        lokasi: selectedReport.site || selectedReport.lokasi,
        detailLokasi: selectedReport.detail_lokasi,
        pic:
          selectedReport.sumber_laporan === "PTO"
            ? selectedReport.nrp_pic || ""
            : "", // Prefill PIC hanya dari PTO, bukan Take 5
        ketidaksesuaian,
        subKetidaksesuaian,
        quickAction,
        deskripsiTemuan,
      }));

      // Auto-fill evidence preview jika ada foto temuan dari PTO/Take5
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

  // Fetch ketidaksesuaian sub options dari DB (termasuk yg ditambah di Pengaturan)
  useEffect(() => {
    let cancelled = false;
    fetchKetidaksesuaianSubOptions().then((opts) => {
      if (!cancelled) setSubOptionsMap(opts && Object.keys(opts).length > 0 ? opts : null);
    });
    return () => { cancelled = true; };
  }, []);

  const getSubOptions = (kategori) => {
    const opts = subOptionsMap || SUB_OPTIONS;
    const arr = opts[kategori] || [];
    return [...arr].sort((a, b) => a.localeCompare(b, "id"));
  };
  const ketidaksesuaianOptions = [...new Set([...(Object.keys(subOptionsMap || SUB_OPTIONS)), ...Object.keys(SUB_OPTIONS)])].sort((a, b) => a.localeCompare(b, "id"));

  // Reset detail lokasi when lokasi changes
  useEffect(() => {
    if (!selectedReport) setForm((prev) => ({ ...prev, detailLokasi: "" }));
    setShowCustomInput(false);
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
        created_at: getNowWITAISO(),
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

      // Jika dari Take 5: update status, potensi_bahaya, deskripsi_kondisi (hazard_id diisi trigger)
      if (selectedReport?.sumber_laporan === "Take5" && selectedReport?.id) {
        const take5Update = {
          status: "done",
          potensi_bahaya: form.ketidaksesuaian
            ? [form.ketidaksesuaian, form.subKetidaksesuaian].filter(Boolean).join(" - ")
            : null,
          deskripsi_kondisi: form.deskripsiTemuan || null,
        };
        const { error: updateError } = await supabase
          .from("take_5")
          .update(take5Update)
          .eq("id", selectedReport.id);

        if (updateError) {
          console.error("Error updating Take 5:", updateError);
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
                    {ketidaksesuaianOptions.map((k) => (
                      <option key={k} value={k}>{k}</option>
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
                    Sub Ketidaksesuaian
                  </label>
                  {getSubOptions(form.ketidaksesuaian).length > 0 ? (
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
                      {getSubOptions(form.ketidaksesuaian).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
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
