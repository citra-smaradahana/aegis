import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../supabaseClient";
import Cropper from "react-easy-crop";
import getCroppedImg from "../Dropzone/cropImageUtil";
import {
  getLocationOptions,
  allowsCustomInput,
  shouldUseLocationSelector,
} from "../../config/siteLocations";
import LocationDetailSelector from "../LocationDetailSelector";

const SITE_OPTIONS = [
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

function getToday() {
  const today = new Date();
  return today.toISOString().slice(0, 10);
}

const Take5FormDesktop = ({ user, onRedirectHazard }) => {
  const [site, setSite] = useState(user.site || "");
  const [detailLokasi, setDetailLokasi] = useState("");
  const [, setLocationOptions] = useState([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [potensiBahaya, setPotensiBahaya] = useState("");
  const [q1, setQ1] = useState(null);
  const [q2, setQ2] = useState(null);
  const [q3, setQ3] = useState(null);
  const [q4, setQ4] = useState(null);
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

  // Validasi form
  const isFormValid =
    site &&
    detailLokasi.trim() &&
    potensiBahaya.trim() &&
    q1 !== null &&
    q2 !== null &&
    q3 !== null &&
    q4 !== null &&
    kondisiKerja &&
    !(
      kondisiKerja === "perbaikan" &&
      (!buktiPerbaikan || !deskripsiPerbaikan.trim())
    ) &&
    !(
      kondisiKerja === "stop" &&
      (!buktiPerbaikan || !deskripsiKondisi.trim())
    ) &&
    !(kondisiKerja === "aman" && !deskripsiKondisi.trim()) &&
    !(kondisiKerja === "aman" && !buktiPerbaikan);

  // Debug validasi form
  console.log("Form validation debug:", {
    site,
    detailLokasi: detailLokasi.trim(),
    potensiBahaya: potensiBahaya.trim(),
    q1,
    q2,
    q3,
    q4,
    kondisiKerja,
    buktiPerbaikan,
    deskripsiPerbaikan: deskripsiPerbaikan.trim(),
    deskripsiKondisi: deskripsiKondisi.trim(),
    isFormValid,
  });

  // Cek apakah ada jawaban "Tidak" pada pertanyaan
  const hasNegativeAnswer =
    q1 === false || q2 === false || q3 === false || q4 === false;

  // Tombol "Ya" pada kondisi kerja tidak bisa diklik jika ada jawaban "Tidak"
  const isAmanButtonDisabled = hasNegativeAnswer;

  // Otomatis ubah kondisi kerja jika ada jawaban "Tidak" dan kondisi kerja adalah "aman"
  useEffect(() => {
    if (hasNegativeAnswer && kondisiKerja === "aman") {
      setKondisiKerja("");
    }
  }, [hasNegativeAnswer, kondisiKerja]);

  // Update location options when site changes
  useEffect(() => {
    if (site) {
      const options = getLocationOptions(site);
      setLocationOptions(options);
      // Reset detail lokasi when site changes
      setDetailLokasi("");
      setShowCustomInput(false);
    } else {
      setLocationOptions([]);
      setDetailLokasi("");
      setShowCustomInput(false);
    }
  }, [site]);

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

  const handleBuktiClick = () => {
    // Trigger file input click
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = handleBuktiChange;
    fileInput.click();
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
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

      // Log data yang akan dikirim untuk debugging
      const take5Data = {
        user_id: user.id,
        tanggal: getToday(),
        site: site,
        detail_lokasi: detailLokasi,
        judul_pekerjaan: "Take 5 Assessment", // Field required di database
        potensi_bahaya: potensiBahaya,
        q1: q1,
        q2: q2,
        q3: q3,
        q4: q4,
        aman: kondisiKerja,
        status: status,
        pelapor_nama: user.nama || "Unknown", // Nama pelapor dari user login
        nrp: user.nrp || "", // NRP dari user login
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
          setPotensiBahaya("");
          setQ1(null);
          setQ2(null);
          setQ3(null);
          setQ4(null);
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
    padding: 16,
    maxWidth: 1100,
    width: "100%",
    margin: "0 auto",
    height: "auto",
  };

  const headerStyle = {
    textAlign: "center",
    marginBottom: 16,
    marginTop: 0,
    padding: 0,
  };

  const formStyle = {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 24,
    alignItems: "start",
  };

  const fieldMargin = {
    marginTop: 0,
    marginBottom: 0,
  };

  const sectionStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  };

  const leftTopSection = {
    ...sectionStyle,
    gridArea: "1 / 1 / 2 / 2",
  };

  const rightTopSection = {
    ...sectionStyle,
    gridArea: "1 / 2 / 2 / 3",
  };

  const leftBottomSection = {
    ...sectionStyle,
    gridArea: "2 / 1 / 3 / 2",
  };

  const rightBottomSection = {
    ...sectionStyle,
    gridArea: "2 / 2 / 3 / 3",
  };

  const labelStyle = {
    fontWeight: 600,
    color: "#e5e7eb",
    marginBottom: 8,
    display: "block",
    fontSize: 16,
  };

  const inputStyle = {
    width: "100%",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    border: "1px solid #334155",
    background: "#0b1220",
    color: "#e5e7eb",
  };

  const questionBtnGroupStyle = {
    display: "flex",
    gap: 16,
    marginTop: 8,
  };

  const radioBtnStyle = (active, color, readOnly) => ({
    flex: 1,
    padding: "12px 24px",
    borderRadius: 8,
    border: "2px solid",
    fontSize: 16,
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
    width: "calc(50% - 12px)", // batasi selebar tombol submit
    alignSelf: "flex-start",
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

        <form onSubmit={handleSubmit} style={formStyle}>
          {/* SISI KIRI ATAS: Tanggal, Lokasi Kerja, Detail Lokasi, Potensi Bahaya */}
          <div style={leftTopSection}>
            <div style={fieldMargin}>
              <label style={labelStyle}>Tanggal</label>
              <input
                value={getToday()}
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
              <select
                value={site}
                onChange={(e) => setSite(e.target.value)}
                required
                style={inputStyle}
              >
                <option value="">Pilih Lokasi</option>
                {SITE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div style={fieldMargin}>
              <label style={labelStyle}>Detail Lokasi</label>
              {/* Hanya dropdown pada desktop; tanpa input bebas */}
              <LocationDetailSelector
                site={site}
                value={detailLokasi}
                onChange={handleDetailLokasiChange}
                placeholder="Pilih Detail Lokasi"
                style={inputStyle}
                required
              />
            </div>

            <div style={fieldMargin}>
              <label style={labelStyle}>Potensi Bahaya</label>
              <input
                type="text"
                value={potensiBahaya}
                onChange={(e) => setPotensiBahaya(e.target.value)}
                required
                placeholder="Contoh: Listrik, Ketinggian, dll"
                style={inputStyle}
              />
            </div>
          </div>

          {/* SISI KANAN ATAS: 4 Pertanyaan */}
          <div style={rightTopSection}>
            <div style={fieldMargin}>
              <label style={labelStyle}>
                Apakah Saya mengerti pekerjaan yang akan saya lakukan?
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
                    boxShadow: q1 === false ? "0 0 0 2px #fef3c7" : "none",
                  }}
                >
                  Tidak
                </button>
              </div>
            </div>

            <div style={fieldMargin}>
              <label style={labelStyle}>
                Apakah Saya memiliki kompetensi untuk melakukan pekerjaan ini?
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
                    boxShadow: q2 === false ? "0 0 0 2px #fef3c7" : "none",
                  }}
                >
                  Tidak
                </button>
              </div>
            </div>

            <div style={fieldMargin}>
              <label style={labelStyle}>
                Apakah Saya memiliki izin untuk melakukan pekerjaan ini?
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
                    boxShadow: q3 === false ? "0 0 0 2px #fef3c7" : "none",
                  }}
                >
                  Tidak
                </button>
              </div>
            </div>

            <div style={fieldMargin}>
              <label style={labelStyle}>
                Apakah Saya memiliki peralatan yang tepat untuk pekerjaan ini?
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
                    boxShadow: q4 === false ? "0 0 0 2px #fef3c7" : "none",
                  }}
                >
                  Tidak
                </button>
              </div>
            </div>
          </div>

          {/* Aman atau Perbaikan */}
          {/* SISI KIRI BAWAH: Kondisi Kerja */}
          <div
            style={{
              ...leftBottomSection,
              gridColumn: "1 / -1",
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
                    ...kondisiKerjaBtnStyle(kondisiKerja === "aman", "#22c55e"),
                    opacity: isAmanButtonDisabled ? 0.5 : 1,
                    cursor: isAmanButtonDisabled ? "not-allowed" : "pointer",
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
                    borderColor: isAmanButtonDisabled ? "#d1d5db" : "#22c55e",
                  }}
                >
                  Ya
                </button>
                <button
                  type="button"
                  onClick={() => setKondisiKerja("perbaikan")}
                  style={kondisiKerjaBtnStyle(
                    kondisiKerja === "perbaikan",
                    "#f59e0b"
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
                    "#ef4444"
                  )}
                >
                  STOP pekerjaan, lalu minta bantuan untuk perbaikan
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                width: "100%",
              }}
            >
              <button
                type="submit"
                disabled={!isFormValid || loading}
                style={{
                  ...submitButtonStyle,
                  background: !isFormValid || loading ? "#9ca3af" : "#2563eb",
                  cursor: !isFormValid || loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Menyimpan..." : "Simpan Take 5"}
              </button>
            </div>
          </div>

          {/* SISI KANAN BAWAH: Bukti Perbaikan + Deskripsi (sejajar kiri-kanan) */}
          <div style={rightBottomSection}>
            {kondisiKerja && (
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
                      : kondisiKerja === "perbaikan"
                        ? "Bukti Perbaikan (Foto)"
                        : "Bukti Kondisi (Foto)"}
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
                      {/* Hint removed as requested */}
                    </div>
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBuktiChange}
                      required={
                        kondisiKerja === "perbaikan" || kondisiKerja === "stop"
                      }
                      style={inputStyle}
                    />
                  )}
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
                      kondisiKerja === "perbaikan" || kondisiKerja === "stop"
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
    </div>
  );
};

export default Take5FormDesktop;
