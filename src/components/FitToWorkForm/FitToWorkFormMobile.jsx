import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import MobileHeader from "../MobileHeader";
import MobileBottomNavigation from "../MobileBottomNavigation";

const FitToWorkFormMobile = ({ user, onBack, onNavigate }) => {
  const [jamTidur, setJamTidur] = useState("");
  const [jamBangun, setJamBangun] = useState("");
  const [jumlahJamTidur, setJumlahJamTidur] = useState("");
  const [tidakMengkonsumsiObat, setTidakMengkonsumsiObat] = useState(""); // "Ya"/"Tidak"
  const [tidakAdaMasalahPribadi, setTidakAdaMasalahPribadi] = useState(""); // "Ya"/"Tidak"
  const [catatanObat, setCatatanObat] = useState("");
  const [siapBekerja, setSiapBekerja] = useState(""); // "Ya"/"Tidak"
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sudahIsiHariIni, setSudahIsiHariIni] = useState(false);
  const [totalJamTidurAngka, setTotalJamTidurAngka] = useState(0);
  const [dataHariIni, setDataHariIni] = useState(null);

  // Get today's date in WITA (Waktu Indonesia Tengah)
  // This ensures users can fill Fit To Work again after 00:00 WITA
  // instead of waiting 24 hours from their last submission
  const getTodayWITA = () => {
    const now = new Date();
    // Convert to WITA (UTC+8) by adding 8 hours to UTC
    const witaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const todayWITA = witaTime.toISOString().split("T")[0];

    // Debug logging
    console.log("Current local time:", now.toISOString());
    console.log("WITA time:", witaTime.toISOString());
    console.log("Today WITA date:", todayWITA);

    return todayWITA;
  };

  const today = getTodayWITA();

  // Debug: Log state changes
  useEffect(() => {
    console.log("State sudahIsiHariIni changed to:", sudahIsiHariIni);
    console.log("Today WITA:", today);
  }, [sudahIsiHariIni, today]);

  const cekSudahIsi = async () => {
    try {
      console.log(
        "CekSudahIsi: Checking for user.nrp:",
        user.nrp,
        "tanggal:",
        today
      );
      const { data, error } = await supabase
        .from("fit_to_work")
        .select("*")
        .eq("nrp", user.nrp)
        .eq("tanggal", today)
        .order("updated_at", { ascending: false }) // Ambil data terbaru berdasarkan updated_at
        .maybeSingle();

      console.log("CekSudahIsi: Query result:", { data, error });
      console.log("Current local time:", new Date().toISOString());
      console.log("Today WITA date:", today);

      if (error) {
        console.error("Error fetching data:", error);
        setSudahIsiHariIni(false);
        return;
      }

      if (data) {
        console.log("CekSudahIsi: Data found, setting sudahIsiHariIni to true");
        console.log("Found data:", {
          id: data.id,
          status: data.status,
          status_fatigue: data.status_fatigue,
          workflow_status: data.workflow_status,
          updated_at: data.updated_at,
        });
        setSudahIsiHariIni(true);
        setDataHariIni(data);
        // Set form values dengan data yang sudah ada
        setJamTidur(data.jam_tidur || "");
        setJamBangun(data.jam_bangun || "");
        setJumlahJamTidur(
          data.total_jam_tidur ? `${Math.floor(data.total_jam_tidur)} jam` : ""
        );
        setTotalJamTidurAngka(data.total_jam_tidur || 0);
        setTidakMengkonsumsiObat(data.tidak_mengkonsumsi_obat ? "Ya" : "Tidak");
        setCatatanObat(data.catatan_obat || "");
        setTidakAdaMasalahPribadi(
          data.tidak_ada_masalah_pribadi ? "Ya" : "Tidak"
        );
        setSiapBekerja(data.siap_bekerja ? "Ya" : "Tidak");
        // Ambil status dari kolom yang tersedia di DB
        // Prioritaskan status_fatigue jika ada, fallback ke status lama
        const finalStatus = data.status_fatigue || data.status || "";
        console.log("Setting status to:", finalStatus, "from:", {
          status_fatigue: data.status_fatigue,
          status: data.status,
        });
        setStatus(finalStatus);
      } else {
        console.log(
          "CekSudahIsi: No data found, setting sudahIsiHariIni to false"
        );
        setSudahIsiHariIni(false);
        setDataHariIni(null);
      }
    } catch (err) {
      console.error("Error in cekSudahIsi:", err);
      setSudahIsiHariIni(false);
      setDataHariIni(null);
    }
  };

  // Cek apakah sudah isi hari ini
  useEffect(() => {
    console.log(
      "Mobile useEffect triggered - user.nrp:",
      user?.nrp,
      "today WITA:",
      today
    );
    if (user) cekSudahIsi();
  }, [user, today]);

  // Auto-refresh data setiap 5 detik untuk mendapatkan update dari validasi
  useEffect(() => {
    if (!user) return;

    const refreshInterval = setInterval(() => {
      console.log("Auto-refreshing Fit To Work data (mobile)...");
      cekSudahIsi();
    }, 5000); // Refresh setiap 5 detik

    // Refresh saat window/tab mendapat focus (user kembali ke halaman)
    const handleFocus = () => {
      console.log("Window focused - refreshing Fit To Work data (mobile)...");
      cekSudahIsi();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener("focus", handleFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.nrp, today]); // Hanya depend pada nrp dan today, bukan seluruh user object

  // Hitung total jam tidur
  useEffect(() => {
    if (jamTidur && jamBangun) {
      const [tidurH, tidurM] = jamTidur.split(":").map(Number);
      const [bangunH, bangunM] = jamBangun.split(":").map(Number);
      let tidur = tidurH * 60 + tidurM;
      let bangun = bangunH * 60 + bangunM;
      if (bangun <= tidur) bangun += 24 * 60;
      const diff = bangun - tidur;
      const jam = Math.floor(diff / 60);
      const menit = diff % 60;
      setJumlahJamTidur(
        diff > 0 ? `${jam} jam${menit > 0 ? ` ${menit} menit` : ""}` : ""
      );
      setTotalJamTidurAngka(diff > 0 ? diff / 60 : 0);
    } else {
      setJumlahJamTidur("");
      setTotalJamTidurAngka(0);
    }
  }, [jamTidur, jamBangun]);

  // Logika status Fit To Work
  useEffect(() => {
    if (
      totalJamTidurAngka >= 6 &&
      tidakMengkonsumsiObat === "Ya" &&
      tidakAdaMasalahPribadi === "Ya" &&
      siapBekerja === "Ya"
    ) {
      setStatus("Fit To Work");
    } else {
      setStatus("Not Fit To Work");
    }
  }, [
    totalJamTidurAngka,
    tidakMengkonsumsiObat,
    tidakAdaMasalahPribadi,
    siapBekerja,
  ]);

  // Validasi form
  const isFormValid =
    jamTidur &&
    jamBangun &&
    tidakMengkonsumsiObat &&
    tidakAdaMasalahPribadi &&
    siapBekerja &&
    (tidakMengkonsumsiObat === "Ya" ||
      (tidakMengkonsumsiObat === "Tidak" && catatanObat));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Tentukan nilai status
      const computedStatus =
        status === "Fit To Work" ? "Fit To Work" : "Not Fit To Work";

      // Deteksi jabatan yang memerlukan validasi workflow (Not Fit To Work → divalidasi PJO atau Leading Hand)
      const role = (user?.jabatan || "").toLowerCase();
      const rolesNeedValidation = [
        "mekanik",
        "crew",
        "crew blasting",
        "crew blaster", // alternatif penulisan
        "operator plant",
        "operator mmu",
        "quality control",
        "quality controller", // alternatif penulisan
        // Jabatan yang Not Fit To Work-nya divalidasi oleh Penanggung Jawab Operasional
        "asst. penanggung jawab operasional",
        "sherq officer",
        "technical service",
        "field leading hand",
        "plant leading hand",
      ];

      const requiresValidation =
        computedStatus === "Not Fit To Work" &&
        rolesNeedValidation.some((r) => role.includes(r));

      // Tentukan workflow_status berdasarkan kebutuhan validasi
      // Jika Not Fit To Work + jabatan tertentu → Pending (butuh validasi)
      // Jika Fit To Work atau jabatan tidak butuh validasi → Closed (langsung selesai)
      const workflowStatus = requiresValidation ? "Pending" : "Closed";

      const insertData = {
        nama: user.nama,
        jabatan: user.jabatan,
        nrp: user.nrp,
        site: user.site,
        tanggal: today,
        jam_tidur: jamTidur,
        jam_bangun: jamBangun,
        total_jam_tidur: totalJamTidurAngka,
        tidak_mengkonsumsi_obat: tidakMengkonsumsiObat === "Ya",
        catatan_obat: catatanObat,
        tidak_ada_masalah_pribadi: tidakAdaMasalahPribadi === "Ya",
        siap_bekerja: siapBekerja === "Ya",
        status: computedStatus,
        status_fatigue: computedStatus, // Gunakan format lengkap agar konsisten
        initial_status_fatigue: computedStatus, // Status saat pengisian pertama (tidak diubah saat validasi)
        workflow_status: workflowStatus, // Set workflow_status untuk validasi
      };

      console.log("Data yang akan dikirim ke database:", insertData);
      console.log(
        "Validation required:",
        requiresValidation,
        "| Workflow Status:",
        workflowStatus
      );

      const { error } = await supabase.from("fit_to_work").insert(insertData);

      if (error) throw error;

      console.log("Fit To Work data saved successfully");
      if (requiresValidation) {
        console.log(
          "Record memerlukan validasi - Leading Hand akan melihat di halaman Validasi Fit To Work"
        );
      }

      setSudahIsiHariIni(true);
      // Refresh data setelah submit berhasil
      console.log("Submit berhasil, refreshing data...");
      await cekSudahIsi();
    } catch (err) {
      console.error("Error submitting fit to work:", err);
      setError("Gagal menyimpan data Fit To Work. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  // Styles untuk mobile
  const contentAreaStyle = {
    width: "100vw",
    height: "700px", // pastikan tidak bisa scroll
    background: "#f3f4f6",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: "0px",
    overflow: "hidden", // cegah scroll
  };

  const fitToWorkMobileCardStyle = {
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
    maxWidth: 410, // fit untuk mobile L 425px
    marginBottom: 0,
    // Hapus height: 100% agar card bisa menyesuaikan konten dan tidak memaksa scroll
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

  const _headerStyle = {
    textAlign: "center",
    marginBottom: 2, // lebih rapat
    marginTop: 0,
    padding: 0, // lebih rapat
  };

  const titleStyle = {
    fontWeight: 900,
    fontSize: 18, // besarkan lagi
    color: "#2563eb",
    margin: 0,
    lineHeight: 1.1, // lebih rapat
  };

  const fieldStyle = {
    width: "90%", // samakan lebar
    marginBottom: 4, // lebih rapat
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
    padding: 4, // lebih kecil
    fontSize: 13, // besarkan lagi
    border: "1px solid #d1d5db",
  };

  const readOnlyInputStyle = {
    ...inputStyle,
    background: "#f9fafb",
    color: "#6b7280",
  };

  const timeContainerStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    width: "100%",
    marginBottom: 8,
  };

  const timeFieldStyle = {
    flex: 1,
    minWidth: 0,
    width: "90%", // samakan lebar dengan field lain
    marginLeft: "auto",
    marginRight: "auto",
  };

  const buttonGroupStyle = {
    display: "flex",
    gap: 4, // lebih rapat
    marginTop: 2,
    justifyContent: "center",
  };

  const buttonStyle = (isSelected) => ({
    minWidth: 60, // lebih kecil
    maxWidth: 90, // lebih kecil
    padding: "6px 4px", // lebih kecil
    borderRadius: 8,
    border: "2px solid",
    fontSize: 12, // lebih kecil
    fontWeight: 600,
    cursor: "pointer",
    background: isSelected ? "#2563eb" : "#fff",
    color: isSelected ? "#fff" : "#2563eb",
    borderColor: "#2563eb",
    flex: 1,
  });

  const _fitToWorkSubmitButtonStyle = {
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

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "#f8fafc",
        overflowY: "auto",
        paddingBottom: 150, // Space untuk bottom nav dan submit button
      }}
    >
      {/* Mobile Header */}
      <MobileHeader
        user={user}
        onBack={onBack}
        title="Fit To Work"
        showBack={true}
      />

      <div
        style={{
          marginTop: 60, // Space untuk mobile header
          padding: "20px",
        }}
      >
        <div
          style={{
            ...fitToWorkMobileCardStyle,
            marginTop: 0,
            paddingTop: 0,
            paddingBottom: 0,
            marginBottom: 0,
          }}
        >
          {sudahIsiHariIni && (
            <div
              style={{
                color: "#2563eb",
                fontWeight: 700,
                marginBottom: 8,
                background: "#dbeafe",
                borderRadius: 8,
                padding: 0,
                border: "1.5px solid #2563eb",
                textAlign: "center",
                width: "90%",
                fontSize: 10,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              Anda sudah mengisi Fit To Work hari ini. Silakan isi kembali
              besok.
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            {/* Tanggal */}
            <div style={fieldStyle}>
              <label style={labelStyle}>Tanggal</label>
              <input
                type="text"
                value={today}
                readOnly
                style={readOnlyInputStyle}
              />
            </div>

            {/* Jam Tidur & Jam Bangun */}
            <div style={timeContainerStyle}>
              <div style={timeFieldStyle}>
                <label style={labelStyle}>Jam Tidur</label>
                <input
                  type="time"
                  value={jamTidur}
                  onChange={(e) => setJamTidur(e.target.value)}
                  step="300"
                  style={sudahIsiHariIni ? readOnlyInputStyle : inputStyle}
                  disabled={sudahIsiHariIni}
                />
              </div>
              <div style={timeFieldStyle}>
                <label style={labelStyle}>Jam Bangun</label>
                <input
                  type="time"
                  value={jamBangun}
                  onChange={(e) => setJamBangun(e.target.value)}
                  step="300"
                  style={sudahIsiHariIni ? readOnlyInputStyle : inputStyle}
                  disabled={sudahIsiHariIni}
                />
              </div>
            </div>

            {/* Total Jam Tidur */}
            <div style={fieldStyle}>
              <label style={labelStyle}>Total Jam Tidur</label>
              <input
                type="text"
                value={jumlahJamTidur}
                readOnly
                style={readOnlyInputStyle}
              />
            </div>

            {/* Status Fit To Work/Not Fit To Work di bawah Total Jam Tidur */}
            {sudahIsiHariIni && status && (
              <div style={{ margin: "8px 0 0 0" }}>
                <div
                  style={{
                    color: status === "Fit To Work" ? "#22c55e" : "#ef4444",
                    background: status === "Fit To Work" ? "#dcfce7" : "#fee2e2",
                    border:
                      status === "Fit To Work"
                        ? "2px solid #22c55e"
                        : "2px solid #ef4444",
                    borderRadius: 10,
                    fontWeight: 900,
                    fontSize: 10,
                    textAlign: "center",
                    padding: 3,
                    letterSpacing: 1,
                  }}
                >
                  Status: {status}
                </div>
                {dataHariIni?.initial_status_fatigue &&
                  dataHariIni.initial_status_fatigue !== (dataHariIni?.status_fatigue || status) && (
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 11,
                      color: "#64748b",
                      textAlign: "center",
                    }}
                  >
                    Status awal: {dataHariIni.initial_status_fatigue} → Saat ini: {dataHariIni?.status_fatigue || status}
                  </div>
                )}
              </div>
            )}

            {/* Konsumsi Obat */}
            <div style={fieldStyle}>
              <label style={labelStyle}>
                Apakah Anda tidak mengkonsumsi obat yang dapat mempengaruhi
                kemampuan bekerja?
              </label>
              <div style={buttonGroupStyle}>
                <button
                  type="button"
                  onClick={() => setTidakMengkonsumsiObat("Ya")}
                  style={buttonStyle(tidakMengkonsumsiObat === "Ya")}
                  disabled={sudahIsiHariIni}
                >
                  Ya
                </button>
                <button
                  type="button"
                  onClick={() => setTidakMengkonsumsiObat("Tidak")}
                  style={buttonStyle(tidakMengkonsumsiObat === "Tidak")}
                  disabled={sudahIsiHariIni}
                >
                  Tidak
                </button>
              </div>
            </div>

            {/* Catatan Obat */}
            {(tidakMengkonsumsiObat === "Tidak" ||
              (sudahIsiHariIni && dataHariIni?.catatan_obat)) && (
              <div style={fieldStyle}>
                <label style={labelStyle}>Catatan Obat</label>
                <input
                  type="text"
                  value={catatanObat}
                  onChange={(e) => setCatatanObat(e.target.value)}
                  placeholder="Masukkan catatan obat"
                  style={sudahIsiHariIni ? readOnlyInputStyle : inputStyle}
                  disabled={sudahIsiHariIni}
                />
              </div>
            )}

            {/* Masalah Pribadi */}
            <div style={fieldStyle}>
              <label style={labelStyle}>
                Apakah Anda tidak memiliki masalah pribadi/keluarga yang
                berpotensi mengganggu konsentrasi kerja?
              </label>
              <div style={buttonGroupStyle}>
                <button
                  type="button"
                  onClick={() => setTidakAdaMasalahPribadi("Ya")}
                  style={buttonStyle(tidakAdaMasalahPribadi === "Ya")}
                  disabled={sudahIsiHariIni}
                >
                  Ya
                </button>
                <button
                  type="button"
                  onClick={() => setTidakAdaMasalahPribadi("Tidak")}
                  style={buttonStyle(tidakAdaMasalahPribadi === "Tidak")}
                  disabled={sudahIsiHariIni}
                >
                  Tidak
                </button>
              </div>
            </div>

            {/* Siap Bekerja */}
            <div style={fieldStyle}>
              <label style={labelStyle}>
                Saya menyatakan bahwa saya dalam kondisi sehat dan siap untuk
                bekerja dengan aman.
              </label>
              <div style={buttonGroupStyle}>
                <button
                  type="button"
                  onClick={() => setSiapBekerja("Ya")}
                  style={buttonStyle(siapBekerja === "Ya")}
                  disabled={sudahIsiHariIni}
                >
                  Ya
                </button>
                <button
                  type="button"
                  onClick={() => setSiapBekerja("Tidak")}
                  style={buttonStyle(siapBekerja === "Tidak")}
                  disabled={sudahIsiHariIni}
                >
                  Tidak
                </button>
              </div>
            </div>

            {/* Catatan Validator - tampil bila ada catatan dari perbaikan Not Fit To Work */}
            {sudahIsiHariIni &&
              dataHariIni &&
              (dataHariIni.catatan_tahap1 || dataHariIni.catatan_tahap2) && (
              <div
                style={{
                  marginTop: 16,
                  padding: 14,
                  backgroundColor: "#f1f5f9",
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: "#334155",
                    marginBottom: 12,
                  }}
                >
                  Catatan Validator
                </div>
                {dataHariIni.catatan_tahap1 && (
                  <div style={{ marginBottom: 12 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#64748b",
                        marginBottom: 4,
                      }}
                    >
                      Catatan Tahap 1
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "#475569",
                        lineHeight: 1.5,
                      }}
                    >
                      {dataHariIni.catatan_tahap1}
                    </div>
                    {(dataHariIni.reviewer_tahap1_nama ||
                      dataHariIni.reviewed_tahap1_at) && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "#94a3b8",
                          marginTop: 4,
                        }}
                      >
                        {dataHariIni.reviewer_tahap1_nama}
                        {dataHariIni.reviewer_tahap1_jabatan
                          ? ` (${dataHariIni.reviewer_tahap1_jabatan})`
                          : ""}
                        {dataHariIni.reviewed_tahap1_at &&
                          ` · ${new Date(
                            dataHariIni.reviewed_tahap1_at
                          ).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`}
                      </div>
                    )}
                  </div>
                )}
                {dataHariIni.catatan_tahap2 && (
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#64748b",
                        marginBottom: 4,
                      }}
                    >
                      Catatan Tahap 2
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "#475569",
                        lineHeight: 1.5,
                      }}
                    >
                      {dataHariIni.catatan_tahap2}
                    </div>
                    {(dataHariIni.reviewer_tahap2_nama ||
                      dataHariIni.reviewed_tahap2_at) && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "#94a3b8",
                          marginTop: 4,
                        }}
                      >
                        {dataHariIni.reviewer_tahap2_nama}
                        {dataHariIni.reviewer_tahap2_jabatan
                          ? ` (${dataHariIni.reviewer_tahap2_jabatan})`
                          : ""}
                        {dataHariIni.reviewed_tahap2_at &&
                          ` · ${new Date(
                            dataHariIni.reviewed_tahap2_at
                          ).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div
                style={{
                  color: "#b91c1c",
                  fontWeight: 700,
                  marginTop: 6,
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

            {/* Submit Button fixed di atas navbar */}
            {!sudahIsiHariIni ? (
              <div
                style={{
                  position: "fixed",
                  left: 0,
                  right: 0,
                  bottom: 100,
                  zIndex: 1001,
                  maxWidth: 360,
                  margin: "0 auto",
                  padding: "0 20px",
                }}
              >
                <button
                  type="submit"
                  disabled={!isFormValid || loading || sudahIsiHariIni}
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
                    boxShadow: "0 -2px 12px rgba(0,0,0,0.15)",
                  }}
                >
                  {loading ? "Menyimpan..." : "Simpan Fit To Work"}
                </button>
              </div>
            ) : null}
          </form>
        </div>
      </div>

      {/* Bottom Navigation */}
      <MobileBottomNavigation
        activeTab="home"
        onNavigate={(tab) => {
          if (tab === "home") {
            onBack && onBack();
          } else if (tab === "tasklist" || tab === "profile") {
            onNavigate && onNavigate(tab);
          }
        }}
      />
    </div>
  );
};

export default FitToWorkFormMobile;
