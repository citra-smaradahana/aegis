import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../../supabaseClient";
import Cropper from "react-easy-crop";
import getCroppedImg from "../Dropzone/cropImageUtil";
import {
  getLocationOptions,
  allowsCustomInput,
} from "../../config/siteLocations";
import PendingTake5List from "./PendingTake5List";
import MobileSiteSelector from "../MobileSiteSelector";
import LocationDetailSelector from "../LocationDetailSelector";
import PICSelector from "../PICSelector";

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

function HazardFormMobile({ user, onBack }) {
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
  const [take5Pending, setTake5Pending] = useState([]);
  const [selectedTake5, setSelectedTake5] = useState(null);
  const [selectedTake5Id, setSelectedTake5Id] = useState(null);
  const [picOptions, setPicOptions] = useState([]);
  const [locationOptions, setLocationOptions] = useState([]);
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

  // Evaluator state
  const [evaluatorOptions, setEvaluatorOptions] = useState([]);
  const [evaluatorNama, setEvaluatorNama] = useState("");
  const [submittedToMultipleEvaluators, setSubmittedToMultipleEvaluators] =
    useState(false);

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
        keteranganLokasi: "", // blank, isi manual
        ketidaksesuaian: "", // blank, isi manual
        subKetidaksesuaian: "", // blank, isi manual
        quickAction: "STOP pekerjaan sesuai Take 5",
        deskripsiTemuan:
          selectedTake5.deskripsi_kondisi ||
          `Kondisi kerja tidak aman berdasarkan Take 5 tanggal ${selectedTake5.tanggal}. ${selectedTake5.aman}`,
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

  // Fetch Evaluator options by lokasi (tetap jalankan tapi tidak tampilkan di form)
  useEffect(() => {
    async function fetchEvaluator() {
      if (!form.lokasi) {
        setEvaluatorOptions([]);
        setEvaluatorNama("");
        return;
      }
      const { data, error } = await supabase
        .from("users")
        .select("nama")
        .eq("site", form.lokasi)
        .eq("role", "evaluator");
      if (!error && data && data.length > 0) {
        setEvaluatorOptions(data.map((u) => u.nama).filter(Boolean));
        setEvaluatorNama(data[0].nama);
      } else {
        setEvaluatorOptions([]);
        setEvaluatorNama("");
      }
    }
    fetchEvaluator();
  }, [form.lokasi]);

  // Evidence preview
  useEffect(() => {
    if (evidence) {
      const url = URL.createObjectURL(evidence);
      setEvidencePreview(url);
      return () => URL.revokeObjectURL(url);
    } else if (!selectedTake5?.bukti_url) {
      setEvidencePreview(null);
    }
  }, [evidence, selectedTake5]);

  // Handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "lokasi") {
      setForm((prev) => ({ ...prev, pic: "" }));
      setEvaluatorNama("");
    }
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

  // Fungsi validasi untuk setiap halaman
  const isPage1Valid = () => {
    return (
      form.lokasi && form.detailLokasi && form.keteranganLokasi && form.pic
    );
  };

  const isPage2Valid = () => {
    return form.ketidaksesuaian && form.subKetidaksesuaian && form.quickAction;
  };

  const isPage3Valid = () => {
    return form.deskripsiTemuan && (evidence || selectedTake5?.bukti_url);
  };

  const isFormValid = () => {
    return isPage1Valid() && isPage2Valid() && isPage3Valid();
  };

  // Fungsi untuk menampilkan pesan error field
  const getFieldError = (fieldName) => {
    if (!form[fieldName] || form[fieldName].trim() === "") {
      return "Field ini wajib diisi";
    }
    return null;
  };

  // Fungsi untuk menampilkan border merah pada field yang kosong
  const getFieldBorderStyle = (fieldName) => {
    const hasError = getFieldError(fieldName);
    return {
      border: hasError ? "1px solid #ef4444" : "1px solid #d1d5db",
      backgroundColor: hasError ? "#fef2f2" : "#fff",
    };
  };

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
    setSelectedTake5Id(take5?.id || null);

    // Auto-fill form dengan data Take 5
    setForm({
      ...form,
      lokasi: take5.site,
      detailLokasi: take5.detail_lokasi,
      keteranganLokasi: "", // blank, isi manual
      ketidaksesuaian: "", // blank, isi manual
      subKetidaksesuaian: "", // blank, isi manual
      quickAction: "STOP pekerjaan sesuai Take 5",
      deskripsiTemuan:
        take5.deskripsi_kondisi ||
        `Kondisi kerja tidak aman berdasarkan Take 5 tanggal ${take5.tanggal}. ${take5.aman}`,
    });

    // Jika ada foto dari Take 5, set sebagai evidence preview
    if (take5.bukti_url) {
      setEvidencePreview(take5.bukti_url);
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
      let evidenceUrl = "";
      if (evidence) {
        evidenceUrl = await uploadEvidence();
      } else if (selectedTake5?.bukti_url) {
        evidenceUrl = selectedTake5.bukti_url;
      }

      // Jika ada multiple evaluator, buat hazard report untuk setiap evaluator
      if (evaluatorOptions.length > 1) {
        const hazardPromises = evaluatorOptions.map((evaluatorNama) =>
          supabase.from("hazard_report").insert({
            user_id: user.id,
            user_perusahaan: user.perusahaan,
            pelapor_nama: user.nama,
            pelapor_nrp: user.nrp,
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
            action_plan: null,
            due_date: null,
            evaluator_nama: evaluatorNama,
            take_5_id: selectedTake5Id || null,
          })
        );

        const results = await Promise.all(hazardPromises);
        const errors = results.filter((result) => result.error);

        if (errors.length > 0) {
          throw new Error(`Gagal membuat ${errors.length} hazard report`);
        }

        console.log(
          `Berhasil membuat ${evaluatorOptions.length} hazard report untuk evaluator:`,
          evaluatorOptions
        );
        setSubmittedToMultipleEvaluators(true);
      } else {
        // Jika hanya satu evaluator, buat hazard report seperti biasa
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
          action_plan: null,
          due_date: null,
          evaluator_nama: evaluatorNama,
          take_5_id: selectedTake5Id || null,
        };

        console.log("Hazard data to insert:", hazardData);

        const { data: hazardDataResult, error } = await supabase
          .from("hazard_report")
          .insert(hazardData);

        console.log("Hazard Report insert result:", {
          hazardDataResult,
          error,
        });

        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }
        setSubmittedToMultipleEvaluators(false);
      }

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
      setSubmittedToMultipleEvaluators(false);

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
            width: 280,
            height: 280,
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
        height: "700px", // pastikan tidak bisa scroll
        background: "#f3f4f6",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "0px",
        overflow: "hidden", // cegah scroll
      }}
    >
      <div
        style={{
          background: "#fff",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          boxShadow: "0 2px 16px #0001",
          paddingTop: 6,
          paddingRight: 6,
          paddingBottom: 0,
          paddingLeft: 6,
          width: "100%",
          maxWidth: 425, // fit untuk mobile 425px
          marginBottom: 0,
          height: "100%", // card selalu setinggi viewport
        }}
      >
        {/* Card Header */}
        <div
          style={{
            background: "#fff",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            padding: "8px 0 4px 0",
            marginBottom: 0,
            textAlign: "center",
            position: "relative",
          }}
        >
          {/* Back Button */}
          {onBack && (
            <button
              onClick={onBack}
              style={{
                position: "absolute",
                left: "16px",
                top: "16px",
                background: "none",
                border: "none",
                color: "#3b82f6",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "8px",
                zIndex: 20,
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          )}
          <h2
            style={{
              margin: 0,
              fontWeight: 800,
              fontSize: 18,
              color: "#2563eb",
              letterSpacing: 1,
              textAlign: "center",
              lineHeight: 1.1,
            }}
          >
            Hazard Report
          </h2>
        </div>

        {/* Progress indicator */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 8,
            gap: 6,
          }}
        >
          {[1, 2, 3].map((p) => (
            <div
              key={p}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: page >= p ? "#2563eb" : "#e5e7eb",
              }}
            />
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 2, // lebih rapat
            flex: 1,
            overflow: "hidden",
          }}
        >
          {/* Pending Take 5 List - dipindah ke dalam form */}
          <div
            style={{
              width: "90%",
              marginLeft: "auto",
              marginRight: "auto",
              marginTop: 8,
            }}
          >
            <PendingTake5List
              user={user}
              onSelectTake5={handleSelectTake5}
              selectedTake5Id={selectedTake5Id}
            />
          </div>

          {/* PAGE 1 */}
          {page === 1 && (
            <>
              <div
                style={{
                  marginBottom: 4,
                  width: "90%",
                  marginLeft: "auto",
                  marginRight: "auto",
                  marginTop: 8,
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    color: "#222",
                    marginBottom: 2,
                    display: "block",
                    fontSize: 14,
                  }}
                >
                  Lokasi (Site)
                </label>
                <MobileSiteSelector
                  value={form.lokasi}
                  onChange={handleChange}
                  placeholder="Pilih Lokasi"
                  disabled={!!selectedTake5}
                  style={getFieldBorderStyle("lokasi")}
                  required
                />
                {getFieldError("lokasi") && (
                  <div
                    style={{
                      color: "#ef4444",
                      fontSize: 11,
                      marginTop: 2,
                      marginLeft: 4,
                    }}
                  >
                    {getFieldError("lokasi")}
                  </div>
                )}
              </div>

              <div
                style={{
                  marginBottom: 4,
                  width: "90%",
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    color: "#222",
                    marginBottom: 2,
                    display: "block",
                    fontSize: 14,
                  }}
                >
                  Detail Lokasi
                </label>
                {allowsCustomInput(form.lokasi) ? (
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
                      padding: 4,
                      fontSize: 13,
                      backgroundColor: !!selectedTake5 ? "#f3f4f6" : "#fff",
                      color: !!selectedTake5 ? "#9ca3af" : "#000",
                      ...getFieldBorderStyle("detailLokasi"),
                    }}
                  />
                ) : (
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
                      style={getFieldBorderStyle("detailLokasi")}
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
                          padding: 4,
                          fontSize: 13,
                          marginTop: 8,
                          ...getFieldBorderStyle("detailLokasi"),
                        }}
                      />
                    )}
                  </>
                )}
                {getFieldError("detailLokasi") && (
                  <div
                    style={{
                      color: "#ef4444",
                      fontSize: 11,
                      marginTop: 2,
                      marginLeft: 4,
                    }}
                  >
                    {getFieldError("detailLokasi")}
                  </div>
                )}
              </div>

              <div
                style={{
                  marginBottom: 4,
                  width: "90%",
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    color: "#222",
                    marginBottom: 2,
                    display: "block",
                    fontSize: 14,
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
                    padding: 4,
                    fontSize: 13,
                    resize: "vertical",
                    minHeight: 60,
                    ...getFieldBorderStyle("keteranganLokasi"),
                  }}
                />
                {getFieldError("keteranganLokasi") && (
                  <div
                    style={{
                      color: "#ef4444",
                      fontSize: 11,
                      marginTop: 2,
                      marginLeft: 4,
                    }}
                  >
                    {getFieldError("keteranganLokasi")}
                  </div>
                )}
              </div>

              <div
                style={{
                  marginBottom: 4,
                  width: "90%",
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    color: "#222",
                    marginBottom: 2,
                    display: "block",
                    fontSize: 14,
                  }}
                >
                  PIC (Person In Charge)
                </label>
                <PICSelector
                  value={form.pic}
                  onChange={handleChange}
                  placeholder="Pilih PIC"
                  site={form.lokasi}
                  style={getFieldBorderStyle("pic")}
                  required
                  currentUser={user}
                />
                {picOptions.length === 0 && form.lokasi && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "#ef4444",
                      marginTop: 2,
                      textAlign: "center",
                    }}
                  >
                    Tidak ada PIC lain di lokasi ini
                  </div>
                )}
                {getFieldError("pic") && (
                  <div
                    style={{
                      color: "#ef4444",
                      fontSize: 11,
                      marginTop: 2,
                      marginLeft: 4,
                    }}
                  >
                    {getFieldError("pic")}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleNext}
                disabled={!isPage1Valid()}
                style={{
                  background: isPage1Valid() ? "#2563eb" : "#9ca3af",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 0",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isPage1Valid() ? "pointer" : "not-allowed",
                  marginTop: 8,
                  width: "60%",
                  alignSelf: "center",
                  opacity: isPage1Valid() ? 1 : 0.6,
                }}
              >
                Lanjutkan
              </button>
            </>
          )}

          {/* PAGE 2 */}
          {page === 2 && (
            <>
              <div
                style={{
                  marginBottom: 4,
                  width: "90%",
                  marginLeft: "auto",
                  marginRight: "auto",
                  marginTop: 8,
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    color: "#222",
                    marginBottom: 2,
                    display: "block",
                    fontSize: 14,
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
                    padding: 4,
                    fontSize: 13,
                    ...getFieldBorderStyle("ketidaksesuaian"),
                  }}
                >
                  <option value="">Pilih Ketidaksesuaian</option>
                  <option value="Safety">Safety</option>
                  <option value="Quality">Quality</option>
                  <option value="Environment">Environment</option>
                  <option value="Health">Health</option>
                </select>
                {getFieldError("ketidaksesuaian") && (
                  <div
                    style={{
                      color: "#ef4444",
                      fontSize: 11,
                      marginTop: 2,
                      marginLeft: 4,
                    }}
                  >
                    {getFieldError("ketidaksesuaian")}
                  </div>
                )}
              </div>

              <div
                style={{
                  marginBottom: 4,
                  width: "90%",
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    color: "#222",
                    marginBottom: 2,
                    display: "block",
                    fontSize: 14,
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
                    padding: 4,
                    fontSize: 13,
                    ...getFieldBorderStyle("subKetidaksesuaian"),
                  }}
                />
                {getFieldError("subKetidaksesuaian") && (
                  <div
                    style={{
                      color: "#ef4444",
                      fontSize: 11,
                      marginTop: 2,
                      marginLeft: 4,
                    }}
                  >
                    {getFieldError("subKetidaksesuaian")}
                  </div>
                )}
              </div>

              <div
                style={{
                  marginBottom: 4,
                  width: "90%",
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    color: "#222",
                    marginBottom: 2,
                    display: "block",
                    fontSize: 14,
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
                    padding: 4,
                    fontSize: 13,
                    resize: "vertical",
                    minHeight: 60,
                    ...getFieldBorderStyle("quickAction"),
                  }}
                />
                {getFieldError("quickAction") && (
                  <div
                    style={{
                      color: "#ef4444",
                      fontSize: 11,
                      marginTop: 2,
                      marginLeft: 4,
                    }}
                  >
                    {getFieldError("quickAction")}
                  </div>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  width: "90%",
                  margin: "0 auto",
                }}
              >
                <button
                  type="button"
                  onClick={handleBack}
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
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!isPage2Valid()}
                  style={{
                    background: isPage2Valid() ? "#2563eb" : "#9ca3af",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 0",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: isPage2Valid() ? "pointer" : "not-allowed",
                    flex: 1,
                    opacity: isPage2Valid() ? 1 : 0.6,
                  }}
                >
                  Lanjutkan
                </button>
              </div>
            </>
          )}

          {/* PAGE 3 */}
          {page === 3 && (
            <>
              <div
                style={{
                  marginBottom: 4,
                  width: "90%",
                  marginLeft: "auto",
                  marginRight: "auto",
                  marginTop: 8,
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    color: "#222",
                    marginBottom: 2,
                    display: "block",
                    fontSize: 14,
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
                    padding: 4,
                    fontSize: 13,
                    resize: "vertical",
                    minHeight: 60,
                    ...getFieldBorderStyle("deskripsiTemuan"),
                  }}
                />
                {getFieldError("deskripsiTemuan") && (
                  <div
                    style={{
                      color: "#ef4444",
                      fontSize: 11,
                      marginTop: 2,
                      marginLeft: 4,
                    }}
                  >
                    {getFieldError("deskripsiTemuan")}
                  </div>
                )}
              </div>

              <div
                style={{
                  marginBottom: 4,
                  width: "90%",
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    color: "#222",
                    marginBottom: 2,
                    display: "block",
                    fontSize: 14,
                  }}
                >
                  Foto Evidence
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleEvidence}
                  name="evidence"
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
                          padding: "6px",
                          marginBottom: "6px",
                          fontSize: "11px",
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
                      padding: "12px",
                      fontSize: 13,
                      color: "#6b7280",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    Klik untuk mengambil foto
                  </button>
                )}
              </div>

              {submitError && (
                <div
                  style={{
                    color: "#ef4444",
                    fontWeight: 500,
                    fontSize: 13,
                    textAlign: "center",
                    width: "90%",
                    margin: "0 auto",
                  }}
                >
                  {submitError}
                </div>
              )}
              {submitSuccess && (
                <div
                  style={{
                    background: "#10b981",
                    color: "#fff",
                    padding: "8px",
                    borderRadius: "8px",
                    marginBottom: "8px",
                    textAlign: "center",
                    fontSize: 13,
                    width: "90%",
                    margin: "0 auto",
                  }}
                >
                  {submittedToMultipleEvaluators ? (
                    <div>
                      <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                        Hazard Report berhasil dikirim!
                      </div>
                      <div style={{ fontSize: "12px" }}>
                        Laporan telah dikirim ke {evaluatorOptions.length}{" "}
                        evaluator untuk mempercepat proses evaluasi.
                      </div>
                    </div>
                  ) : (
                    "Hazard Report berhasil dikirim!"
                  )}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  width: "90%",
                  margin: "0 auto",
                }}
              >
                <button
                  type="button"
                  onClick={handleBack}
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
                <button
                  type="submit"
                  disabled={submitting || !isPage3Valid()}
                  style={{
                    background:
                      submitting || !isPage3Valid() ? "#9ca3af" : "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 0",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor:
                      submitting || !isPage3Valid() ? "not-allowed" : "pointer",
                    flex: 1,
                    opacity: submitting || !isPage3Valid() ? 0.6 : 1,
                  }}
                >
                  {submitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

export default HazardFormMobile;
