import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../supabaseClient";
import Cropper from "react-easy-crop";
import getCroppedImg from "../Dropzone/cropImageUtil";
import {
  allowsCustomInput,
  shouldUseLocationSelector,
  getLocationOptions,
  getLocationOptionsAsync
} from "../../config/siteLocations";
import LocationDetailSelector from "../LocationDetailSelector";
import { fetchSites } from "../../utils/masterDataHelpers";
import { getTodayWITA } from "../../utils/dateTimeHelpers";
import Take5History from "./Take5History";

const SITE_OPTIONS_FALLBACK = [
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

const JUDUL_PEKERJAAN_OPTIONS = [
  "Pengoperasian Kendaraaan & Unit",
  "Loading Aksesoris Blasting",
  "Pengawalan Bahan Peledak",
  "Pembagian Aksesoris",
  "Charging",
  "Priming",
  "Stemming",
  "Tie Up",
  "Firing",
  "Post Blast",
  "Pembuatan EP",
  "Transfer EP ke BIN",
  "Loading AN ke BIN",
  "Preventive Maintenance",
  "Perbaikan Unit & Peralatan",
  "Stock Opname Gudang",
  "Administrasi Office",
  "Yang lain:",
];

const POTENSI_BAHAYA_OPTIONS = [
  "Jatuh dari ketinggian",
  "Kejatuhan benda",
  "Bahaya Line of fire",
  "Tersandung, Terpeleset",
  "Mengangkat dengan manual",
  "Pengangkatan dengan crane",
  "Gangguan kesehatan, debu",
  "Ruang terbatas",
  "Terbakar / meledak",
  "Tersetrum",
  "Alat Terperosok lumpur",
  "Melintasi kabel listrik",
  "Jari terjepit, kaki tertimpa",
  "Tersangkut benda berputar",
  "Tenggelam",
  "Interaksi alat berat",
  "Tekanan, hidrolik, pneumatic",
  "Tertimbun reruntuhan",
  "Tidak kompeten",
  "Cuaca, petir, angina, hujan",
  "Tergigit / tersengat binatang",
  "Limbah tercecer, tumpah",
  "Terpapar bahan kimia",
  "Bising, pencahayaan kurang",
];

const Take5FormDesktop = ({ user, onRedirectHazard }) => {
  const [site, setSite] = useState(user.site || "");
  const [detailLokasi, setDetailLokasi] = useState("");
  const [siteOptions, setSiteOptions] = useState([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [potensiBahaya, setPotensiBahaya] = useState([]); // Changed to array
  const [potensiBahayaLainnya, setPotensiBahayaLainnya] = useState(""); // New state for custom bahaya
  const [resikoTinggi, setResikoTinggi] = useState(null);
  const [kontrolBahaya, setKontrolBahaya] = useState("");
  const [q1, setQ1] = useState(null);
  const [q2, setQ2] = useState(null);
  const [q3, setQ3] = useState(null);
  const [q4, setQ4] = useState(null);
  const [q5, setQ5] = useState(null);
  const [kondisiKerja, setKondisiKerja] = useState("");
  const [buktiPerbaikan, setBuktiPerbaikan] = useState(null);
  const [buktiPreview, setBuktiPreview] = useState(null);
  const [deskripsiPerbaikan, setDeskripsiPerbaikan] = useState("");
  const [deskripsiKondisi, setDeskripsiKondisi] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [activeTab, setActiveTab] = useState("input");
  const [judulPekerjaan, setJudulPekerjaan] = useState("");
  const [judulPekerjaanCustom, setJudulPekerjaanCustom] = useState("");
  const [isJudulOpen, setIsJudulOpen] = useState(false);
  const judulDropdownRef = React.useRef(null);
  const [isSiteOpen, setIsSiteOpen] = useState(false);
  const siteDropdownRef = React.useRef(null);
  const [isDetailLokasiOpen, setIsDetailLokasiOpen] = useState(false);
  const detailLokasiDropdownRef = React.useRef(null);
  const [locationOptions, setLocationOptions] = useState([]);
  const [searchBahaya, setSearchBahaya] = useState("");
  const [isBahayaOpen, setIsBahayaOpen] = useState(false);
  const bahayaDropdownRef = React.useRef(null);

  // Validasi form
  const isFormValid =
    !!site &&
    !!detailLokasi.trim() &&
    !!judulPekerjaan.trim() &&
    (judulPekerjaan !== "Yang lain:" || !!judulPekerjaanCustom.trim()) &&
    (potensiBahaya.length > 0 || !!potensiBahayaLainnya.trim()) && // Updated validation for potensiBahaya
    resikoTinggi !== null &&
    !!kontrolBahaya.trim() &&
    q1 !== null &&
    q2 !== null &&
    q3 !== null &&
    q4 !== null &&
    q5 !== null &&
    !!kondisiKerja &&
    !(kondisiKerja === "perbaikan" && !deskripsiPerbaikan.trim()) &&
    !(kondisiKerja === "stop" && !deskripsiKondisi.trim());

  // Debug validasi form
  console.log("Form validation debug:", {
    site,
    detailLokasi: detailLokasi.trim(),
    potensiBahaya, // Changed to array
    potensiBahayaLainnya: potensiBahayaLainnya.trim(), // New debug field
    q1,
    q2,
    q3,
    q4,
    q5,
    kondisiKerja,
    buktiPerbaikan,
    deskripsiPerbaikan: deskripsiPerbaikan.trim(),
    deskripsiKondisi: deskripsiKondisi.trim(),
    isFormValid,
  });

  // Cek apakah ada jawaban "Tidak" pada pertanyaan
  const hasNegativeAnswer =
    q1 === false || q2 === false || q3 === false || q4 === false || q5 === false;

  // Tombol "Ya" pada kondisi kerja tidak bisa diklik jika ada jawaban "Tidak"
  const isAmanButtonDisabled = hasNegativeAnswer;

  // Otomatis ubah kondisi kerja jika ada jawaban "Tidak" dan kondisi kerja adalah "aman"
  useEffect(() => {
    if (hasNegativeAnswer && kondisiKerja === "aman") {
      setKondisiKerja("");
    }
  }, [hasNegativeAnswer, kondisiKerja]);

  // Fetch location options dari DB
  useEffect(() => {
    if (!site) {
      setLocationOptions(getLocationOptions(site));
      return;
    }
    let cancelled = false;
    getLocationOptionsAsync(site).then((opts) => {
      if (!cancelled) setLocationOptions(opts || getLocationOptions(site));
    });
    return () => { cancelled = true; };
  }, [site]);

  // Fetch site options dari DB, fallback ke config
  useEffect(() => {
    let cancelled = false;
    fetchSites().then((arr) => {
      if (!cancelled)
        setSiteOptions(
          Array.isArray(arr) && arr.length > 0 ? arr : SITE_OPTIONS_FALLBACK,
        );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Reset detail lokasi when site changes
  useEffect(() => {
    setDetailLokasi("");
    setShowCustomInput(false);
  }, [site]);

  // Handle click outside for dropdown bahaya & judul
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bahayaDropdownRef.current && !bahayaDropdownRef.current.contains(event.target)) {
        setIsBahayaOpen(false);
      }
      if (judulDropdownRef.current && !judulDropdownRef.current.contains(event.target)) {
        setIsJudulOpen(false);
      }
      if (siteDropdownRef.current && !siteDropdownRef.current.contains(event.target)) {
        setIsSiteOpen(false);
      }
      if (detailLokasiDropdownRef.current && !detailLokasiDropdownRef.current.contains(event.target)) {
        setIsDetailLokasiOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle detail lokasi change
  const handleDetailLokasiChange = (e) => {
    const value = e.target.value;
    setDetailLokasi(value);

    // Show custom input if "Lainnya" is selected or if site allows custom input
    if (value === "Lainnya" || (allowsCustomInput(site) && value === "")) {
      setShowCustomInput(true);
      setDetailLokasi("");
    } else {
      setShowCustomInput(false);
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Handler untuk file input
  const handleBuktiChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCropImageSrc(ev.target.result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const buktiCameraRef = React.useRef();
  const buktiGalleryRef = React.useRef();
  const handleBuktiClick = () => buktiGalleryRef.current?.click();

  const handleCropConfirm = async () => {
    try {
      const croppedImage = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      const file = new File([croppedImage], "bukti-perbaikan.jpg", {
        type: "image/jpeg",
      });
      setBuktiPerbaikan(file);
      setBuktiPreview(URL.createObjectURL(croppedImage));
      setShowCropper(false);
      setCropImageSrc(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setCropImageSrc(null);
  };

  // Fungsi bantu untuk checkbox bahaya
  const handleBahayaToggle = (bahaya) => {
    setPotensiBahaya((prev) =>
      prev.includes(bahaya)
        ? prev.filter((item) => item !== bahaya)
        : [...prev, bahaya]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid || loading) return;

    setLoading(true);
    setError("");

    try {
      let buktiUrl = null;
      if (buktiPerbaikan) {
        const fileExt = buktiPerbaikan.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `take5-bukti/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("img-test")
          .upload(filePath, buktiPerbaikan);

        if (uploadError) {
          throw new Error("Error uploading bukti");
        }

        const { data } = supabase.storage
          .from("img-test")
          .getPublicUrl(filePath);
        buktiUrl = data.publicUrl;
      }

      // Tentukan status berdasarkan kondisi kerja
      const status = kondisiKerja === "stop" ? "pending" : "closed";

      // Gabungkan bahaya terpilih dan bahaya lainnya
      let finalBahaya = [...potensiBahaya];
      if (potensiBahayaLainnya?.trim()) {
        finalBahaya.push(potensiBahayaLainnya.trim());
      }
      const finalBahayaString = finalBahaya.join(", ");

      // Log data yang akan dikirim untuk debugging
      const selectedJudul =
        judulPekerjaan === "Yang lain:" || judulPekerjaan === "Lainnya"
          ? judulPekerjaanCustom.trim()
          : judulPekerjaan;
      const take5Data = {
        user_id: user.id,
        tanggal: getTodayWITA(),
        site: site,
        detail_lokasi: detailLokasi,
        judul_pekerjaan: selectedJudul,
        potensi_bahaya: finalBahayaString,
        q1: q1,
        q2: q2,
        q3: q3,
        q4: q4,
        q5: q5,
        aman: kondisiKerja,
        status: status,
        pelapor_nama: user.nama || "Unknown", // Nama pelapor dari user login
        nrp: user.nrp || "", // NRP dari user login
        resiko_tinggi: resikoTinggi,
        kontrol_bahaya: kontrolBahaya.trim(),
      };

      // Tambahkan field opsional hanya jika ada data
      if (deskripsiPerbaikan) {
        take5Data.bukti_perbaikan = deskripsiPerbaikan; // Sesuai nama field di database
      }
      if (buktiUrl) {
        take5Data.bukti_url = buktiUrl; // Tambahkan URL foto jika ada
      }
      if (deskripsiKondisi) {
        take5Data.deskripsi_kondisi = deskripsiKondisi; // Tambahkan deskripsi kondisi
      }

      console.log("Data yang akan dikirim ke Supabase:", take5Data);
      console.log("User data for pelapor_nama:", user);
      console.log("User nama:", user.nama);
      console.log("User nrp:", user.nrp);

      const { error } = await supabase.from("take_5").insert(take5Data);

      if (error) {
        console.error("Supabase error details:", error);
        throw error;
      }

      setSuccess(true);

      // Jika kondisi kerja adalah "stop", redirect ke Hazard Report setelah 2 detik
      if (kondisiKerja === "stop") {
        setTimeout(() => {
          onRedirectHazard();
        }, 2000);
      } else {
        // Reset form after 3 seconds untuk kondisi lain (aman dan perbaikan)
        setTimeout(() => {
          setSuccess(false);
          setSite(user.site || "");
          setDetailLokasi("");
          setJudulPekerjaan("");
          setJudulPekerjaanCustom("");
          setPotensiBahaya([]);
          setPotensiBahayaLainnya("");
          setResikoTinggi(null);
          setKontrolBahaya("");
          setQ1(null);
          setQ2(null);
          setQ3(null);
          setQ4(null);
          setQ5(null);
          setKondisiKerja("");
          setBuktiPerbaikan(null);
          setBuktiPreview(null);
          setDeskripsiPerbaikan("");
          setDeskripsiKondisi("");
        }, 3000);
      }
    } catch (err) {
      console.error("Error submitting take 5:", err);
      setError("Gagal menyimpan data Take 5. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  // Styles untuk desktop - geser sedikit ke kiri agar seimbang
  const contentAreaStyle = {
    width: "100%",
    height: "100vh",
    background: "transparent",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "0 80px 0 24px",
    overflow: "hidden",
  };

  const desktopCardStyle = {
    background: "transparent",
    borderRadius: 18,
    boxShadow: "none",
    padding: 12, // Dikurangi agar lebih ringkas
    maxWidth: 1300,
    width: "100%",
    margin: "0 auto",
    height: "auto",
  };

  const scrollAreaStyle = {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    paddingRight: 4,
    paddingBottom: 20,
    maxHeight: "calc(100vh - 200px)",
    scrollBehavior: "smooth",
    WebkitOverflowScrolling: "touch",
    scrollbarWidth: "none", // Firefox: transparent/hidden scrollbar
    msOverflowStyle: "none", // IE/Edge: transparent/hidden scrollbar
    // Note: Chrome/Safari using ::-webkit-scrollbar is handled via global css or inline style block if needed, but none works for hiding natively in some setups.
  };

  // Footer bar removed to make button inline with the form

  const headerStyle = {
    textAlign: "center",
    marginBottom: 16,
    marginTop: 0,
    padding: 0,
  };

  const formStyle = {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 16, // Dikurangi dari 24 agar tidak terlalu lebar
    alignItems: "start",
  };

  const fieldMargin = {
    marginTop: 0,
    marginBottom: 0,
  };

  const sectionStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 12, // Dikurangi dari 16
  };

  const leftTopSection = {
    ...sectionStyle,
    gridArea: "1 / 1 / 3 / 2",
  };

  const rightTopSection = {
    ...sectionStyle,
    gridArea: "1 / 2 / 3 / 3",
  };

  const leftBottomSection = {
    ...sectionStyle,
    gridArea: "1 / 3 / 2 / 4",
  };

  const rightBottomSection = {
    ...sectionStyle,
    gridArea: "2 / 3 / 3 / 4",
  };

  const labelStyle = {
    fontWeight: 600,
    color: "#e5e7eb",
    marginBottom: 6,
    display: "block",
    fontSize: 15, // Dikecilkan dari 16
  };

  const inputStyle = {
    width: "100%",
    borderRadius: 8,
    padding: 10, // Dikurangi dari 12
    fontSize: 15, // Dikecilkan dari 16
    border: "1px solid #334155",
    background: "#0b1220",
    color: "#e5e7eb",
  };

  const questionBtnGroupStyle = {
    display: "flex",
    gap: 12, // Dikurangi dari 16
    marginTop: 6,
  };

  const radioBtnStyle = (active, color, readOnly) => ({
    flex: 1,
    padding: "10px 16px", // Dikurangi dari 12px 24px
    borderRadius: 8,
    border: "2px solid",
    fontSize: 15,
    fontWeight: 600,
    cursor: readOnly ? "not-allowed" : "pointer",
    background: active ? color : "transparent",
    color: active ? "#fff" : color,
    borderColor: color,
    opacity: readOnly ? 0.7 : 1,
    transition: "background 0.2s, color 0.2s",
  });

  const kondisiKerjaBtnGroupStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginTop: 8,
    width: "100%",
    alignSelf: "stretch",
  };

  const kondisiKerjaBtnStyle = (active, color) => ({
    width: "100%",
    padding: "14px 24px",
    borderRadius: 8,
    border: "2px solid",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    background: active ? color : "transparent",
    color: active ? "#fff" : color,
    borderColor: color,
    transition: "background 0.2s, color 0.2s",
    textAlign: "left",
    lineHeight: 1.4,
  });

  const submitButtonStyle = {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "14px 28px",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    width: 320,
    boxShadow: "0 6px 20px rgba(37,99,235,0.35)",
  };

  // Crop modal
  if (showCropper) {
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
            image={cropImageSrc}
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
              onClick={handleCropConfirm}
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
    <div style={contentAreaStyle}>
      <div style={desktopCardStyle}>
        <div style={headerStyle}>
          <h2
            style={{
              margin: 0,
              fontWeight: 800,
              fontSize: 28,
              color: "#60a5fa",
              letterSpacing: 1,
              textAlign: "center",
            }}
          >
            Take 5
          </h2>
        </div>

        {/* Tab Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "24px",
            gap: "16px",
          }}
        >
          <button
            onClick={() => setActiveTab("input")}
            style={{
              padding: "8px 24px",
              borderRadius: "8px",
              background:
                activeTab === "input" ? "#3b82f6" : "rgba(255, 255, 255, 0.1)",
              color: "white",
              border: "none",
              cursor: "pointer",
              fontWeight: "600",
              transition: "all 0.2s",
            }}
          >
            Input
          </button>
          <button
            onClick={() => setActiveTab("history")}
            style={{
              padding: "8px 24px",
              borderRadius: "8px",
              background:
                activeTab === "history"
                  ? "#3b82f6"
                  : "rgba(255, 255, 255, 0.1)",
              color: "white",
              border: "none",
              cursor: "pointer",
              fontWeight: "600",
              transition: "all 0.2s",
            }}
          >
            Riwayat
          </button>
        </div>

        {activeTab === "input" ? (
          <>
            <div style={scrollAreaStyle} className="hide-scrollbar">
              <style>{
                `.hide-scrollbar::-webkit-scrollbar { display: none; }`
              }</style>
              <form id="take5-form" onSubmit={handleSubmit} style={formStyle}>
                {/* SISI KIRI ATAS: Tanggal, Lokasi Kerja, Detail Lokasi, Potensi Bahaya */}
                <div style={leftTopSection}>
                  <div style={fieldMargin}>
                    <label style={labelStyle}>Tanggal</label>
                    <input
                      value={getTodayWITA()}
                      readOnly
                      style={{
                        ...inputStyle,
                        background: "#0b1220",
                        border: "1px solid #334155",
                        color: "#e5e7eb",
                      }}
                    />
                  </div>

                  <div style={fieldMargin}>
                    <label style={labelStyle}>Lokasi Kerja</label>
                    <div ref={siteDropdownRef} style={{ position: "relative" }}>
                      <div
                        onClick={() => setIsSiteOpen(!isSiteOpen)}
                        style={{
                          ...inputStyle,
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                      >
                        <span style={{ color: site ? "#e5e7eb" : "#9ca3af" }}>
                          {site || "Pilih Lokasi Kerja"}
                        </span>
                      </div>

                      {isSiteOpen && (
                        <div
                          className="hide-scrollbar"
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            zIndex: 10,
                            background: "#0b1220",
                            border: "1px solid #334155",
                            borderRadius: "8px",
                            padding: "8px 0",
                            marginTop: "4px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.5)",
                            maxHeight: "220px",
                            overflowY: "auto",
                            scrollbarWidth: "none",
                            msOverflowStyle: "none",
                          }}
                        >
                          {(siteOptions.length > 0 ? siteOptions : SITE_OPTIONS_FALLBACK).map((s) => (
                            <div
                              key={s}
                              onClick={() => {
                                setSite(s);
                                setIsSiteOpen(false);
                              }}
                              style={{
                                padding: "10px 16px",
                                cursor: "pointer",
                                fontSize: "14px",
                                color: site === s ? "#3b82f6" : "#e5e7eb",
                                background: site === s ? "rgba(59, 130, 246, 0.1)" : "transparent",
                              }}
                              onMouseEnter={(e) => {
                                if (site !== s) e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                              }}
                              onMouseLeave={(e) => {
                                if (site !== s) e.currentTarget.style.background = "transparent";
                              }}
                            >
                              {s}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={fieldMargin}>
                    <label style={labelStyle}>Detail Lokasi</label>
                    <div ref={detailLokasiDropdownRef} style={{ position: "relative" }}>
                      <div
                        onClick={() => setIsDetailLokasiOpen(!isDetailLokasiOpen)}
                        style={{
                          ...inputStyle,
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                      >
                        <span style={{ color: detailLokasi && !showCustomInput ? "#e5e7eb" : "#9ca3af" }}>
                          {(!showCustomInput && detailLokasi) || "Pilih Detail Lokasi"}
                        </span>
                      </div>

                      {isDetailLokasiOpen && (
                        <div
                          className="hide-scrollbar"
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            zIndex: 10,
                            background: "#0b1220",
                            border: "1px solid #334155",
                            borderRadius: "8px",
                            padding: "8px 0",
                            marginTop: "4px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.5)",
                            maxHeight: "220px",
                            overflowY: "auto",
                            scrollbarWidth: "none",
                            msOverflowStyle: "none",
                          }}
                        >
                          {locationOptions.length === 0 ? (
                            <div style={{ padding: "10px 16px", color: "#9ca3af", fontSize: "14px" }}>Pilih Lokasi Kerja terlebih dahulu</div>
                          ) : (
                            locationOptions.map((loc) => (
                              <div
                                key={loc}
                                onClick={() => {
                                  handleDetailLokasiChange({ target: { value: loc } });
                                  setIsDetailLokasiOpen(false);
                                }}
                                style={{
                                  padding: "10px 16px",
                                  cursor: "pointer",
                                  fontSize: "14px",
                                  color: detailLokasi === loc ? "#3b82f6" : "#e5e7eb",
                                  background: detailLokasi === loc ? "rgba(59, 130, 246, 0.1)" : "transparent",
                                }}
                                onMouseEnter={(e) => {
                                  if (detailLokasi !== loc) e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                                }}
                                onMouseLeave={(e) => {
                                  if (detailLokasi !== loc) e.currentTarget.style.background = "transparent";
                                }}
                              >
                                {loc}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    {/* Input manual untuk Detail Lokasi jika diperlukan */}
                    {showCustomInput && (
                      <input
                        type="text"
                        value={detailLokasi}
                        onChange={(e) => setDetailLokasi(e.target.value)}
                        required
                        placeholder="Ketik detail lokasi..."
                        style={{ ...inputStyle, marginTop: 8 }}
                      />
                    )}
                  </div>

                  <div style={fieldMargin}>
                    <label style={labelStyle}>Judul Pekerjaan</label>
                    <div ref={judulDropdownRef} style={{ position: "relative" }}>
                      <div
                        onClick={() => setIsJudulOpen(!isJudulOpen)}
                        style={{
                          ...inputStyle,
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                      >
                        <span style={{ color: judulPekerjaan ? "#e5e7eb" : "#9ca3af" }}>
                          {judulPekerjaan || "Pilih Judul Pekerjaan"}
                        </span>
                      </div>

                      {isJudulOpen && (
                        <div
                          className="hide-scrollbar"
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            zIndex: 10,
                            background: "#0b1220",
                            border: "1px solid #334155",
                            borderRadius: "8px",
                            padding: "8px 0",
                            marginTop: "4px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.5)",
                            maxHeight: "220px",
                            overflowY: "auto",
                            scrollbarWidth: "none",
                            msOverflowStyle: "none",
                          }}
                        >
                          {JUDUL_PEKERJAAN_OPTIONS.map((name) => (
                            <div
                              key={name}
                              onClick={() => {
                                setJudulPekerjaan(name);
                                setIsJudulOpen(false);
                              }}
                              style={{
                                padding: "10px 16px",
                                cursor: "pointer",
                                fontSize: "14px",
                                color: judulPekerjaan === name ? "#3b82f6" : "#e5e7eb",
                                background: judulPekerjaan === name ? "rgba(59, 130, 246, 0.1)" : "transparent",
                              }}
                              onMouseEnter={(e) => {
                                if (judulPekerjaan !== name) {
                                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (judulPekerjaan !== name) {
                                  e.currentTarget.style.background = "transparent";
                                }
                              }}
                            >
                              {name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {judulPekerjaan === "Yang lain:" && (
                      <input
                        type="text"
                        value={judulPekerjaanCustom}
                        onChange={(e) =>
                          setJudulPekerjaanCustom(e.target.value)
                        }
                        required
                        placeholder="Tulis judul pekerjaan..."
                        style={{ ...inputStyle, marginTop: 8 }}
                      />
                    )}
                  </div>

                  {/* Resiko Tinggi */}
                  <div style={fieldMargin}>
                    <label style={labelStyle}>
                      Apakah pekerjaan Saya termasuk resiko tinggi?
                    </label>
                    <div style={questionBtnGroupStyle}>
                      <button
                        type="button"
                        onClick={() => setResikoTinggi(true)}
                        style={radioBtnStyle(resikoTinggi === true, "#ef4444", false)}
                      >
                        Ya
                      </button>
                      <button
                        type="button"
                        onClick={() => setResikoTinggi(false)}
                        style={radioBtnStyle(resikoTinggi === false, "#22c55e", false)}
                      >
                        Tidak
                      </button>
                    </div>
                  </div>

                  <div style={fieldMargin}>
                    <label style={labelStyle}>Potensi Bahaya</label>
                    <div ref={bahayaDropdownRef} style={{ position: "relative" }}>
                      <div
                        onClick={() => setIsBahayaOpen(!isBahayaOpen)}
                        style={{
                          ...inputStyle,
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                      >
                        <span style={{ color: potensiBahaya.length ? "#e5e7eb" : "#9ca3af" }}>
                          {potensiBahaya.length 
                            ? `${potensiBahaya.length} bahaya dipilih` 
                            : "Pilih potensi bahaya..."}
                        </span>
                      </div>

                      {isBahayaOpen && (
                        <div
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            zIndex: 10,
                            background: "#0b1220",
                            border: "1px solid #334155",
                            borderRadius: "8px",
                            padding: "12px",
                            marginTop: "4px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.5)"
                          }}
                        >
                          <input 
                            type="text"
                            placeholder="Cari potensi bahaya..."
                            value={searchBahaya}
                            onChange={(e) => setSearchBahaya(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              ...inputStyle,
                              marginBottom: "12px",
                              padding: "8px 12px",
                            }}
                          />
                          <div 
                            className="hide-scrollbar"
                            style={{ 
                              display: "flex", 
                              flexDirection: "column", 
                              gap: "12px", 
                              maxHeight: "145px", 
                              overflowY: "auto",
                              scrollbarWidth: "none",
                              msOverflowStyle: "none",
                            }}
                          >
                            {POTENSI_BAHAYA_OPTIONS.filter((bahaya) =>
                              bahaya.toLowerCase().includes(searchBahaya.toLowerCase())
                            ).length > 0 ? (
                              POTENSI_BAHAYA_OPTIONS.filter((bahaya) =>
                                bahaya.toLowerCase().includes(searchBahaya.toLowerCase())
                              ).map((bahaya) => (
                                <label
                                  key={bahaya}
                                  style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "8px",
                                    fontSize: "14px",
                                    color: "#e5e7eb",
                                    cursor: "pointer",
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <input
                                    type="checkbox"
                                    checked={potensiBahaya.includes(bahaya)}
                                    onChange={() => handleBahayaToggle(bahaya)}
                                    style={{
                                      marginTop: "2px",
                                      width: "16px",
                                      height: "16px",
                                      cursor: "pointer",
                                    }}
                                  />
                                  <span style={{ lineHeight: "1.3" }}>{bahaya}</span>
                                </label>
                              ))
                            ) : (
                              <span style={{ color: "#9ca3af", fontSize: "14px" }}>Pencarian tidak ditemukan</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <label style={{ ...labelStyle, fontSize: "14px", marginTop: "8px" }}>
                      Lainnya (Jika ada)
                    </label>
                    <input
                      type="text"
                      value={potensiBahayaLainnya}
                      onChange={(e) => setPotensiBahayaLainnya(e.target.value)}
                      placeholder="Ketikan potensi bahaya lainnya..."
                      style={inputStyle}
                    />

                    <label style={{ ...labelStyle, fontSize: "14px", marginTop: "12px" }}>
                      Bagaimana saya mengontrol potensi bahaya tersebut?
                    </label>
                    <textarea
                      value={kontrolBahaya}
                      onChange={(e) => setKontrolBahaya(e.target.value)}
                      placeholder="Deskripsikan kontrol bahaya di sini..."
                      rows={3}
                      style={{...inputStyle, resize: "none"}}
                    />
                  </div>
                </div>

                {/* SISI KANAN ATAS: 4 Pertanyaan */}
                <div style={rightTopSection}>
                  <div style={fieldMargin}>
                    <label style={labelStyle}>
                      Apakah saya sehat secara fisik untuk melakukan pekerjaan ini?
                    </label>
                    <div style={questionBtnGroupStyle}>
                      <button
                        type="button"
                        onClick={() => setQ1(true)}
                        style={radioBtnStyle(q1 === true, "#22c55e", false)}
                      >
                        Ya
                      </button>
                      <button
                        type="button"
                        onClick={() => setQ1(false)}
                        style={{
                          ...radioBtnStyle(q1 === false, "#ef4444", false),
                          borderWidth: q1 === false ? "3px" : "2px",
                          boxShadow:
                            q1 === false ? "0 0 0 2px #fef3c7" : "none",
                        }}
                      >
                        Tidak
                      </button>
                    </div>
                  </div>

                  <div style={fieldMargin}>
                    <label style={labelStyle}>
                      Apakah saya mengerti pekerjaan yang akan saya lakukan, memahami langkah pekerjaan yang benar?
                    </label>
                    <div style={questionBtnGroupStyle}>
                      <button
                        type="button"
                        onClick={() => setQ2(true)}
                        style={radioBtnStyle(q2 === true, "#22c55e", false)}
                      >
                        Ya
                      </button>
                      <button
                        type="button"
                        onClick={() => setQ2(false)}
                        style={{
                          ...radioBtnStyle(q2 === false, "#ef4444", false),
                          borderWidth: q2 === false ? "3px" : "2px",
                          boxShadow:
                            q2 === false ? "0 0 0 2px #fef3c7" : "none",
                        }}
                      >
                        Tidak
                      </button>
                    </div>
                  </div>

                  <div style={fieldMargin}>
                    <label style={labelStyle}>
                      Apakah saya mengerti potensi bahaya yang akan terjadi saat melakukan pekerjaan yang benar?
                    </label>
                    <div style={questionBtnGroupStyle}>
                      <button
                        type="button"
                        onClick={() => setQ3(true)}
                        style={radioBtnStyle(q3 === true, "#22c55e", false)}
                      >
                        Ya
                      </button>
                      <button
                        type="button"
                        onClick={() => setQ3(false)}
                        style={{
                          ...radioBtnStyle(q3 === false, "#ef4444", false),
                          borderWidth: q3 === false ? "3px" : "2px",
                          boxShadow:
                            q3 === false ? "0 0 0 2px #fef3c7" : "none",
                        }}
                      >
                        Tidak
                      </button>
                    </div>
                  </div>

                  <div style={fieldMargin}>
                    <label style={labelStyle}>
                      Apakah saya memiliki peralatan yang benar untuk melakukan pekerjaan ini?
                    </label>
                    <div style={questionBtnGroupStyle}>
                      <button
                        type="button"
                        onClick={() => setQ4(true)}
                        style={radioBtnStyle(q4 === true, "#22c55e", false)}
                      >
                        Ya
                      </button>
                      <button
                        type="button"
                        onClick={() => setQ4(false)}
                        style={{
                          ...radioBtnStyle(q4 === false, "#ef4444", false),
                          borderWidth: q4 === false ? "3px" : "2px",
                          boxShadow:
                            q4 === false ? "0 0 0 2px #fef3c7" : "none",
                        }}
                      >
                        Tidak
                      </button>
                    </div>
                  </div>

                  <div style={fieldMargin}>
                    <label style={labelStyle}>
                      Apakah saya memiliki APD yang benar untuk melakukan pekerjaan ini?
                    </label>
                    <div style={questionBtnGroupStyle}>
                      <button
                        type="button"
                        onClick={() => setQ5(true)}
                        style={radioBtnStyle(q5 === true, "#22c55e", false)}
                      >
                        Ya
                      </button>
                      <button
                        type="button"
                        onClick={() => setQ5(false)}
                        style={{
                          ...radioBtnStyle(q5 === false, "#ef4444", false),
                          borderWidth: q5 === false ? "3px" : "2px",
                          boxShadow:
                            q5 === false ? "0 0 0 2px #fef3c7" : "none",
                        }}
                      >
                        Tidak
                      </button>
                    </div>
                  </div>
                </div>

                {/* SISI KIRI BAWAH: Kondisi Kerja */}
                <div
                  style={{
                    ...leftBottomSection,
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                  }}
                >
                  <div style={fieldMargin}>
                    <label style={labelStyle}>
                      Apakah kondisi kerja aman untuk melanjutkan pekerjaan?
                    </label>
                    <div style={kondisiKerjaBtnGroupStyle}>
                      <button
                        type="button"
                        onClick={() => setKondisiKerja("aman")}
                        disabled={isAmanButtonDisabled}
                        style={{
                          ...kondisiKerjaBtnStyle(
                            kondisiKerja === "aman",
                            "#22c55e",
                          ),
                          opacity: isAmanButtonDisabled ? 0.5 : 1,
                          cursor: isAmanButtonDisabled
                            ? "not-allowed"
                            : "pointer",
                          background: isAmanButtonDisabled
                            ? "#f3f4f6"
                            : kondisiKerja === "aman"
                              ? "#22c55e"
                              : "transparent",
                          color: isAmanButtonDisabled
                            ? "#9ca3af"
                            : kondisiKerja === "aman"
                              ? "#fff"
                              : "#22c55e",
                          borderColor: isAmanButtonDisabled
                            ? "#d1d5db"
                            : "#22c55e",
                        }}
                      >
                        Ya
                      </button>
                      <button
                        type="button"
                        onClick={() => setKondisiKerja("perbaikan")}
                        style={kondisiKerjaBtnStyle(
                          kondisiKerja === "perbaikan",
                          "#f59e0b",
                        )}
                      >
                        Saya perlu melakukan perbaikan terlebih dahulu, untuk
                        melanjutkan pekerjaan
                      </button>
                      <button
                        type="button"
                        onClick={() => setKondisiKerja("stop")}
                        style={kondisiKerjaBtnStyle(
                          kondisiKerja === "stop",
                          "#ef4444",
                        )}
                      >
                        STOP pekerjaan, lalu minta bantuan untuk perbaikan
                      </button>
                    </div>
                    
                  </div>
                </div>

                {/* SISI KANAN BAWAH: Bukti/Deskripsi */}
                <div style={{ ...rightBottomSection, marginTop: 8 }}>
                  {(kondisiKerja === "perbaikan" ||
                    kondisiKerja === "stop") && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 16,
                      }}
                    >
                      <div style={fieldMargin}>
                        <label style={labelStyle}>
                          {kondisiKerja === "stop"
                            ? "Bukti Kondisi (Foto)"
                            : "Bukti Perbaikan (Foto)"}
                        </label>
                        {buktiPreview ? (
                          <div style={{ textAlign: "center" }}>
                            <img
                              src={buktiPreview}
                              alt="Preview"
                              onClick={handleBuktiClick}
                              style={{
                                maxWidth: "100%",
                                maxHeight: 200,
                                borderRadius: 8,
                                border: "2px solid #e5e7eb",
                                cursor: "pointer",
                              }}
                              title="Klik untuk ganti foto"
                            />
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              type="button"
                              onClick={() => buktiCameraRef.current?.click()}
                              style={{
                                flex: 1,
                                padding: "12px",
                                background: "#f3f4f6",
                                border: "2px dashed #d1d5db",
                                borderRadius: 8,
                                color: "#6b7280",
                                cursor: "pointer",
                                fontSize: 14,
                              }}
                            >
                              📷 Kamera
                            </button>
                            <button
                              type="button"
                              onClick={() => buktiGalleryRef.current?.click()}
                              style={{
                                flex: 1,
                                padding: "12px",
                                background: "#f3f4f6",
                                border: "2px dashed #d1d5db",
                                borderRadius: 8,
                                color: "#6b7280",
                                cursor: "pointer",
                                fontSize: 14,
                              }}
                            >
                              🖼️ Galeri
                            </button>
                          </div>
                        )}
                        <input
                          ref={buktiCameraRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleBuktiChange}
                          style={{ display: "none" }}
                        />
                        <input
                          ref={buktiGalleryRef}
                          type="file"
                          accept="image/*"
                          onChange={handleBuktiChange}
                          style={{ display: "none" }}
                        />
                      </div>

                      <div style={fieldMargin}>
                        <label style={labelStyle}>
                          {kondisiKerja === "stop"
                            ? "Deskripsi Kondisi"
                            : kondisiKerja === "perbaikan"
                              ? "Deskripsi Perbaikan"
                              : "Deskripsi Kondisi"}
                        </label>
                        <textarea
                          value={
                            kondisiKerja === "stop"
                              ? deskripsiKondisi
                              : kondisiKerja === "perbaikan"
                                ? deskripsiPerbaikan
                                : deskripsiKondisi
                          }
                          onChange={(e) =>
                            kondisiKerja === "stop"
                              ? setDeskripsiKondisi(e.target.value)
                              : kondisiKerja === "perbaikan"
                                ? setDeskripsiPerbaikan(e.target.value)
                                : setDeskripsiKondisi(e.target.value)
                          }
                          required={
                            kondisiKerja === "perbaikan" ||
                            kondisiKerja === "stop"
                          }
                          placeholder={
                            kondisiKerja === "stop"
                              ? "Jelaskan kondisi yang tidak aman dan mengapa perlu bantuan"
                              : kondisiKerja === "perbaikan"
                                ? "Jelaskan perbaikan yang telah dilakukan"
                                : "Jelaskan kondisi kerja saat ini"
                          }
                          style={{
                            ...inputStyle,
                            minHeight: 200,
                            resize: "vertical",
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {/* Submit Button ada di dalam grid rightBottomSection agar sejajar dan didorong oleh Bukti */}
                  <div style={{
                    display: "flex",
                    justifyContent: "flex-start",
                    width: "100%",
                    marginTop: 16,
                  }}>
                    <button
                      type="submit"
                      disabled={!isFormValid || loading}
                      style={{
                        ...submitButtonStyle,
                        width: "100%",
                        background: !isFormValid || loading ? "#9ca3af" : "#2563eb",
                        cursor: !isFormValid || loading ? "not-allowed" : "pointer",
                      }}
                    >
                      {loading ? "Menyimpan..." : "Simpan Take 5"}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div
                    style={{
                      color: "#b91c1c",
                      fontWeight: 700,
                      background: "#fee2e2",
                      borderRadius: 8,
                      padding: 12,
                      border: "1.5px solid #b91c1c",
                      fontSize: 16,
                    }}
                  >
                    {error}
                  </div>
                )}

                {/* Success Message */}
                {success && (
                  <div
                    style={{
                      color: "#16a34a",
                      fontWeight: 700,
                      background: "#dcfce7",
                      borderRadius: 8,
                      padding: 12,
                      border: "1.5px solid #22c55e",
                      fontSize: 16,
                    }}
                  >
                    {kondisiKerja === "stop"
                      ? "Data Take 5 berhasil disimpan! Akan dialihkan ke Hazard Report..."
                      : "Data Take 5 berhasil disimpan! Status: Closed"}
                  </div>
                )}
              </form>
            </div>
            {/* Footer Bar Removed */}
          </>
        ) : (
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", maxHeight: "calc(100vh - 120px)", paddingRight: "8px", paddingBottom: "20px" }} className="hide-scrollbar">
            <Take5History user={user} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Take5FormDesktop;
