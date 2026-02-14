import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../supabaseClient";
import Cropper from "react-easy-crop";
import getCroppedImg from "../Dropzone/cropImageUtil";
import {
  getLocationOptions,
  allowsCustomInput,
  shouldUseLocationSelector,
  CUSTOM_INPUT_SITES,
} from "../../config/siteLocations";
import SelectModalWithSearch from "../SelectModalWithSearch";
import PICSelector from "../PICSelector";
import MobileBottomNavigation from "../MobileBottomNavigation";

function getToday() {
  const today = new Date();
  return today.toISOString().slice(0, 10);
}

const Take5FormMobile = ({ user, onRedirectHazard, onBack, onNavigate }) => {
  const [site, setSite] = useState(user.site || "");
  const [detailLokasi, setDetailLokasi] = useState("");
  const [, setLocationOptions] = useState([]);
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [siteSearchQuery, setSiteSearchQuery] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [showDetailLokasiModal, setShowDetailLokasiModal] = useState(false);
  const [detailLokasiSearchQuery, setDetailLokasiSearchQuery] = useState("");
  const [potensiBahaya, setPotensiBahaya] = useState("");
  const [q1, setQ1] = useState(null);
  const [q2, setQ2] = useState(null);
  const [q3, setQ3] = useState(null);
  const [q4, setQ4] = useState(null);
  const [aman, setAman] = useState("");
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
    aman &&
    // Validasi untuk perbaikan
    !(
      aman === "perbaikan" &&
      (!buktiPerbaikan || !deskripsiPerbaikan.trim())
    ) &&
    // Validasi untuk stop
    !(aman === "stop" && !deskripsiKondisi.trim());

  // Cek apakah ada jawaban "Tidak" pada pertanyaan
  const hasNegativeAnswer =
    q1 === false || q2 === false || q3 === false || q4 === false;

  // Tombol "Ya" pada kondisi kerja tidak bisa diklik jika ada jawaban "Tidak"
  const isAmanButtonDisabled = hasNegativeAnswer;

  // Otomatis ubah kondisi kerja jika ada jawaban "Tidak" dan kondisi kerja adalah "aman"
  useEffect(() => {
    if (hasNegativeAnswer && aman === "aman") {
      setAman("");
    }
  }, [hasNegativeAnswer, aman]);

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


  // Debug useEffect untuk monitoring state
  useEffect(() => {
    console.log("State changed - aman:", aman, "isFormValid:", isFormValid);
  }, [aman, isFormValid]);

  const onCropComplete = useCallback((_, croppedAreaPx) => {
    setCroppedAreaPixels(croppedAreaPx);
  }, []);

  const handleBuktiChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCropImageSrc(url);
      setShowCropper(true);
    }
    e.target.value = "";
  };

  const handleCropConfirm = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;
    try {
      const croppedBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      const file = new File([croppedBlob], "bukti-perbaikan.jpg", {
        type: "image/jpeg",
      });
      setBuktiPerbaikan(file);
      setBuktiPreview(URL.createObjectURL(croppedBlob));
      setShowCropper(false);
      URL.revokeObjectURL(cropImageSrc);
      setCropImageSrc(null);
    } catch (e) {
      console.error("Error cropping image:", e);
      setError("Gagal memproses gambar. Silakan coba lagi.");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    console.log("=== DEBUG TAKE 5 MOBILE ===");
    console.log("Form values:", {
      site,
      detailLokasi,
      potensiBahaya,
      q1,
      q2,
      q3,
      q4,
      aman,
      buktiPerbaikan: !!buktiPerbaikan,
      deskripsiPerbaikan,
      deskripsiKondisi,
    });
    console.log("isFormValid:", isFormValid);

    // Validasi manual untuk file bukti
    if (aman === "perbaikan" && !buktiPerbaikan) {
      setLoading(false);
      setError("Silakan upload bukti foto terlebih dahulu.");
      return;
    }

    if (aman === "stop" && !deskripsiKondisi.trim()) {
      setLoading(false);
      setError("Silakan isi deskripsi kondisi terlebih dahulu.");
      return;
    }

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
      const status = aman === "stop" ? "pending" : "closed";

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
        aman: aman,
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

      const { data, error } = await supabase.from("take_5").insert(take5Data);

      console.log("Supabase response:", { data, error });

      if (error) {
        console.error("Supabase error details:", error);
        throw error;
      }

      console.log("Take 5 berhasil disimpan!");
      setSuccess(true);

      // Jika kondisi kerja adalah "stop", redirect ke Hazard Report setelah 2 detik
      if (aman === "stop") {
        // Reset form immediately untuk STOP
        setSite(user.site || "");
        setDetailLokasi("");
        setPotensiBahaya("");
        setQ1(null);
        setQ2(null);
        setQ3(null);
        setQ4(null);
        setAman("");
        setBuktiPerbaikan(null);
        setBuktiPreview(null);
        setDeskripsiPerbaikan("");
        setDeskripsiKondisi("");

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
          setAman("");
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

  // Styles untuk mobile - header tetap di atas, konten yang scroll
  const contentAreaStyle = {
    width: "100vw",
    height: "100vh",
    maxHeight: "-webkit-fill-available",
    background: "#f3f4f6",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    overflow: "hidden",
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

  const mobileCardStyle = {
    background: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    boxShadow: "0 2px 16px #0001",
    paddingTop: 6,
    paddingRight: 6,
    paddingBottom: 100, // space agar content tidak tertutup navbar saat scroll
    paddingLeft: 6,
    width: "100%",
    maxWidth: 425,
    marginBottom: 0,
  };

  // Tambahkan style khusus untuk card header mobile agar lebih rapat
  const cardHeaderMobileStyle = {
    background: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: "8px 0 4px 0", // lebih rapat atas bawah
    marginBottom: 0,
    textAlign: "center",
  };

  const headerStyle = {
    textAlign: "center",
    marginBottom: 2, // lebih rapat
    marginTop: 0,
    padding: 0, // lebih rapat
  };

  const formStyle = {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 2, // lebih rapat
    flex: 1,
    // Hapus overflow hidden agar form bisa scroll
  };

  const fieldMargin = {
    marginBottom: 4, // lebih rapat
    width: "90%", // samakan lebar
    marginLeft: "auto",
    marginRight: "auto",
    marginTop: 8, // jarak dari judul
  };

  const labelStyle = {
    fontWeight: 600,
    color: "#222",
    marginBottom: 2,
    display: "block",
    fontSize: 14, // besarkan lagi
  };

  const inputStyle = {
    width: "100%",
    borderRadius: 8,
    padding: "12px 16px",
    fontSize: 14,
    minHeight: 44,
    boxSizing: "border-box",
    border: "1px solid #d1d5db",
  };

  const questionBtnGroupStyle = {
    display: "flex",
    gap: 4, // lebih rapat
    marginTop: 2,
    justifyContent: "center",
  };

  const radioBtnStyle = (active, color, readOnly) => ({
    flex: 1,
    minWidth: 60, // lebih kecil
    maxWidth: 90, // lebih kecil
    padding: "6px 4px", // lebih kecil
    borderRadius: 8,
    border: "2px solid",
    fontSize: 12, // lebih kecil
    fontWeight: 600,
    cursor: readOnly ? "not-allowed" : "pointer",
    background: active ? color : "#fff",
    color: active ? "#fff" : color,
    borderColor: color,
    opacity: readOnly ? 0.7 : 1,
    transition: "background 0.2s, color 0.2s",
  });

  const amanBtnGroupStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 4, // lebih rapat
    marginTop: 2,
  };

  const amanBtnStyle = (active, color) => ({
    width: "100%",
    padding: "8px 12px", // lebih kecil
    borderRadius: 8,
    border: "2px solid",
    fontSize: 12, // lebih kecil
    fontWeight: 600,
    cursor: "pointer",
    background: active ? color : "#fff",
    color: active ? "#fff" : color,
    borderColor: color,
    transition: "background 0.2s, color 0.2s",
    textAlign: "left",
    lineHeight: 1.3, // lebih rapat
  });

  const submitButtonStyle = {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "8px 0", // lebih kecil
    fontSize: 13, // lebih kecil
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 8,
    width: "60%", // tidak full width
    alignSelf: "center",
  };

  // Crop modal - react-easy-crop dengan aspect 1:1
  if (showCropper && cropImageSrc) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.9)",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            position: "relative",
            flex: 1,
            minHeight: 0,
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
        </div>
        <div
          style={{
            padding: 20,
            background: "#1f2937",
            display: "flex",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <button
            type="button"
            onClick={handleCropCancel}
            style={{
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleCropConfirm}
            style={{
              background: "#22c55e",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Simpan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={contentAreaStyle}>
      {/* Header - Orange seperti TasklistMobile */}
      {/* Header - tulisan Take 5 putih di tengah (sama Hazard Report) */}
      <div
        style={{
          flexShrink: 0,
          background: "#ea580c",
          padding: "16px 20px 16px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <div style={{ width: 44, flexShrink: 0, display: "flex", alignItems: "center" }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                background: "none",
                border: "none",
                color: "white",
                cursor: "pointer",
                padding: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          )}
        </div>
        <h2
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 600,
            color: "white",
            flex: 1,
            textAlign: "center",
          }}
        >
          Take 5
        </h2>
        <div
          style={{
            width: 44,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingRight: 8,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 600,
              color: "#ea580c",
            }}
          >
            {user?.nama?.charAt(0).toUpperCase() || "U"}
          </div>
        </div>
      </div>

      <div style={scrollContentStyle}>
        <div
          style={{
            ...mobileCardStyle,
            marginTop: 0,
            paddingTop: 0,
            // Hapus paddingBottom dan marginBottom yang memaksa height
          }}
        >
        <form onSubmit={handleSubmit} style={formStyle}>
          {/* Tanggal */}
          <div style={fieldMargin}>
            <label style={labelStyle}>Tanggal</label>
            <input
              value={getToday()}
              readOnly
              style={{
                ...inputStyle,
                background: "#f9fafb",
                color: "#222",
                border: "1px solid #d1d5db",
                cursor: "default",
              }}
            />
          </div>

          {/* Lokasi (Site) - popup dari bawah, navbar tetap terlihat (sama Hazard Report) */}
          <div style={fieldMargin}>
            <label style={labelStyle}>Lokasi (Site)</label>
            <div
              onClick={() => {
                setSiteSearchQuery("");
                setShowSiteModal(true);
              }}
              style={{
                width: "100%",
                boxSizing: "border-box",
                borderRadius: 8,
                padding: "12px 16px",
                fontSize: 14,
                border: "1px solid #d1d5db",
                backgroundColor: "#fff",
                color: site ? "#000" : "#6b7280",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>{site || "Pilih Lokasi"}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
            <SelectModalWithSearch
              title="Pilih Lokasi"
              options={CUSTOM_INPUT_SITES}
              onSelect={(val) => {
                setSite(val);
                setShowSiteModal(false);
                setSiteSearchQuery("");
              }}
              searchQuery={siteSearchQuery}
              onSearchChange={setSiteSearchQuery}
              show={showSiteModal}
              onClose={() => setShowSiteModal(false)}
            />
          </div>

          {/* Detail Lokasi - popup dari bawah, navbar tetap terlihat (sama Hazard Report) */}
          <div style={fieldMargin}>
            <label style={labelStyle}>Detail Lokasi</label>
            {shouldUseLocationSelector(site) ? (
              <>
                <div
                  onClick={() => {
                    if (site) {
                      setDetailLokasiSearchQuery("");
                      setShowDetailLokasiModal(true);
                    }
                  }}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    borderRadius: 8,
                    padding: "12px 16px",
                    fontSize: 14,
                    border: "1px solid #d1d5db",
                    backgroundColor: !site ? "#f3f4f6" : "#fff",
                    color: !site ? "#9ca3af" : "#000",
                    cursor: !site ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>
                    {detailLokasi ||
                      (!site
                        ? "Pilih lokasi terlebih dahulu"
                        : "Pilih Detail Lokasi")}
                  </span>
                  {site && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  )}
                </div>
                <SelectModalWithSearch
                  title="Pilih Detail Lokasi"
                  options={[
                    ...(getLocationOptions(site) || []),
                    ...(allowsCustomInput(site) ? ["Lainnya"] : []),
                  ]}
                  onSelect={(val) => {
                    setShowDetailLokasiModal(false);
                    setDetailLokasiSearchQuery("");
                    if (val === "Lainnya") {
                      setShowCustomInput(true);
                      setDetailLokasi("");
                    } else {
                      setShowCustomInput(false);
                      setDetailLokasi(val);
                    }
                  }}
                  searchQuery={detailLokasiSearchQuery}
                  onSearchChange={setDetailLokasiSearchQuery}
                  show={showDetailLokasiModal}
                  onClose={() => setShowDetailLokasiModal(false)}
                />
                {showCustomInput && (
                  <input
                    type="text"
                    value={detailLokasi}
                    onChange={(e) => setDetailLokasi(e.target.value)}
                    required
                    placeholder="Ketik detail lokasi lainnya..."
                    style={{
                      ...inputStyle,
                      marginTop: 8,
                    }}
                  />
                )}
              </>
            ) : (
              <input
                type="text"
                value={detailLokasi}
                onChange={(e) => setDetailLokasi(e.target.value)}
                required
                placeholder="Ketik detail lokasi..."
                style={inputStyle}
              />
            )}
          </div>

          {/* Potensi Bahaya */}
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

          {/* Pertanyaan 1 */}
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

          {/* Pertanyaan 2 */}
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

          {/* Pertanyaan 3 */}
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

          {/* Pertanyaan 4 */}
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

          {/* Aman atau Perbaikan */}
          <div style={fieldMargin}>
            <label style={labelStyle}>
              Apakah kondisi kerja aman untuk melanjutkan pekerjaan?
            </label>
            <div style={amanBtnGroupStyle}>
              <button
                type="button"
                onClick={() => {
                  console.log("Setting aman to:", "aman");
                  setAman("aman");
                }}
                disabled={isAmanButtonDisabled}
                style={{
                  ...amanBtnStyle(aman === "aman", "#22c55e"),
                  opacity: isAmanButtonDisabled ? 0.5 : 1,
                  cursor: isAmanButtonDisabled ? "not-allowed" : "pointer",
                  background: isAmanButtonDisabled
                    ? "#f3f4f6"
                    : aman === "aman"
                      ? "#22c55e"
                      : "#fff",
                  color: isAmanButtonDisabled
                    ? "#9ca3af"
                    : aman === "aman"
                      ? "#fff"
                      : "#22c55e",
                  borderColor: isAmanButtonDisabled ? "#d1d5db" : "#22c55e",
                }}
              >
                Ya
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log("Setting aman to:", "perbaikan");
                  setAman("perbaikan");
                }}
                style={amanBtnStyle(aman === "perbaikan", "#f59e0b")}
              >
                Saya perlu melakukan perbaikan terlebih dahulu, untuk
                melanjutkan pekerjaan
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log("Setting aman to:", "stop");
                  setAman("stop");
                }}
                style={amanBtnStyle(aman === "stop", "#ef4444")}
              >
                STOP pekerjaan, lalu minta bantuan untuk perbaikan
              </button>
            </div>
          </div>

          {/* Bukti Perbaikan - hanya pilih dari galeri (kompatibel PWA) */}
          {(aman === "perbaikan" || aman === "stop") && (
            <>
              <div
                style={{
                  ...fieldMargin,
                  minWidth: 0,
                  overflow: "hidden",
                }}
              >
                <label style={labelStyle}>
                  {aman === "stop"
                    ? "Bukti Kondisi (Foto)"
                    : "Bukti Perbaikan (Foto)"}
                </label>
                <p
                  style={{
                    fontSize: 11,
                    color: "#6b7280",
                    margin: "0 0 6px 0",
                  }}
                >
                  Ambil foto terlebih dahulu dengan kamera ponsel, lalu pilih dari galeri.
                </p>
                {buktiPreview ? (
                  <div
                    style={{
                      position: "relative",
                      marginTop: 0,
                      width: "100%",
                      minWidth: 0,
                      boxSizing: "border-box",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={buktiPreview}
                      alt="Preview"
                      style={{
                        width: "100%",
                        maxHeight: 200,
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                        display: "block",
                        objectFit: "contain",
                        boxSizing: "border-box",
                      }}
                    />
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        minWidth: 0,
                        marginTop: 8,
                        boxSizing: "border-box",
                      }}
                    >
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/gif"
                        onChange={handleBuktiChange}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          opacity: 0,
                          cursor: "pointer",
                          zIndex: 2,
                        }}
                      />
                      <div
                        style={{
                          ...inputStyle,
                          width: "100%",
                          padding: "10px 12px",
                          background: "#f3f4f6",
                          textAlign: "center",
                          cursor: "pointer",
                          boxSizing: "border-box",
                        }}
                      >
                        Ganti foto dari galeri
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      minWidth: 0,
                      marginTop: 0,
                      boxSizing: "border-box",
                      overflow: "hidden",
                    }}
                  >
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/gif"
                      onChange={handleBuktiChange}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        opacity: 0,
                        cursor: "pointer",
                        zIndex: 2,
                      }}
                    />
                    <div
                      style={{
                        ...inputStyle,
                        width: "100%",
                        padding: "12px",
                        background: "#f3f4f6",
                        textAlign: "center",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        boxSizing: "border-box",
                      }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                      Pilih foto dari galeri
                    </div>
                  </div>
                )}
              </div>

              <div style={fieldMargin}>
                <label style={labelStyle}>
                  {aman === "stop"
                    ? "Deskripsi Kondisi"
                    : "Deskripsi Perbaikan"}
                </label>
                <textarea
                  value={
                    aman === "stop" ? deskripsiKondisi : deskripsiPerbaikan
                  }
                  onChange={(e) =>
                    aman === "stop"
                      ? setDeskripsiKondisi(e.target.value)
                      : setDeskripsiPerbaikan(e.target.value)
                  }
                  // required (hapus ini untuk menghindari error)
                  placeholder={
                    aman === "stop"
                      ? "Jelaskan kondisi yang tidak aman dan mengapa perlu bantuan"
                      : "Jelaskan perbaikan yang telah dilakukan"
                  }
                  style={{
                    ...inputStyle,
                    minHeight: 80,
                    resize: "vertical",
                  }}
                />
              </div>
            </>
          )}

          {/* Error Message */}
          {error && (
            <div
              style={{
                color: "#b91c1c",
                fontWeight: 700,
                background: "#fee2e2",
                borderRadius: 8,
                padding: 6,
                border: "1.5px solid #b91c1c",
                fontSize: 13,
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
                padding: 6,
                border: "1.5px solid #22c55e",
                fontSize: 13,
              }}
            >
              {aman === "stop"
                ? "Data Take 5 berhasil disimpan! Akan dialihkan ke Hazard Report..."
                : "Data Take 5 berhasil disimpan! Status: Closed"}
            </div>
          )}

          {/* Submit Button - di bawah stop/perbaikan, mengalir dengan form */}
          <div
            style={{
              width: "90%",
              marginLeft: "auto",
              marginRight: "auto",
              marginTop: 20,
              marginBottom: 24,
            }}
          >
            <button
              type="submit"
              disabled={!isFormValid || loading}
              style={{
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "14px 0",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                width: "100%",
                boxShadow: "0 2px 8px rgba(37,99,235,0.3)",
              }}
            >
              {loading ? "Menyimpan..." : "Simpan Take 5"}
            </button>
          </div>
        </form>
        </div>
      </div>

      {/* Bottom Navigation */}
      <MobileBottomNavigation
        activeTab="take5"
        onNavigate={(tab) => {
          if (tab === "home") {
            onBack && onBack();
          } else if (tab === "profile") {
            onNavigate && onNavigate("profile");
          } else if (tab === "tasklist") {
            onNavigate && onNavigate("tasklist");
          }
          // take5 tab tidak perlu handling karena sudah di halaman take5
        }}
      />
    </div>
  );
};

export default Take5FormMobile;
