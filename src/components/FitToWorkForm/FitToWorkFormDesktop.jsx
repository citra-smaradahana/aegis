import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { getTodayWITA } from "../../utils/dateTimeHelpers";

const FitToWorkFormDesktop = ({ user }) => {
  const [jamTidur, setJamTidur] = useState("");
  const [jamBangun, setJamBangun] = useState("");
  const [jumlahJamTidur, setJumlahJamTidur] = useState("");
  const [totalJamTidurAngka, setTotalJamTidurAngka] = useState(0); // TAMBAHKAN INI
  const [konsumsiObat, setKonsumsiObat] = useState(""); // "Ya"/"Tidak"
  const [jenisObat, setJenisObat] = useState("");
  const [masalahPribadi, setMasalahPribadi] = useState(""); // "Ya"/"Tidak"
  const [siapBekerja, setSiapBekerja] = useState(""); // "Ya"/"Tidak"
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sudahIsiHariIni, setSudahIsiHariIni] = useState(false);
  const [dataHariIni, setDataHariIni] = useState(null);

  const today = getTodayWITA();

  const cekSudahIsi = async () => {
    try {
      console.log("Checking Fit To Work for user:", user.nrp, "date:", today);

      const { data, error } = await supabase
        .from("fit_to_work")
        .select("*")
        .eq("nrp", user.nrp)
        .eq("tanggal", today)
        .order("updated_at", { ascending: false }) // Ambil data terbaru berdasarkan updated_at
        .maybeSingle();

      console.log("Query result:", { data, error });

      if (error) {
        console.error("Error fetching data:", error);
        setSudahIsiHariIni(false);
        return;
      }

      if (data) {
        console.log("Desktop: Data found, setting sudahIsiHariIni to true");
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
        setKonsumsiObat(data.tidak_mengkonsumsi_obat ? "Ya" : "Tidak");
        setJenisObat(data.catatan_obat || "");
        setMasalahPribadi(data.tidak_ada_masalah_pribadi ? "Ya" : "Tidak");
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
        console.log("Desktop: No data found, setting sudahIsiHariIni to false");
        setSudahIsiHariIni(false);
        setDataHariIni(null);
      }
    } catch (err) {
      console.error("Error in cekSudahIsi desktop:", err);
      setSudahIsiHariIni(false);
      setDataHariIni(null);
    }
  };

  // Cek apakah sudah isi hari ini
  useEffect(() => {
    console.log(
      "Desktop useEffect triggered - user.nrp:",
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
      console.log("Auto-refreshing Fit To Work data...");
      cekSudahIsi();
    }, 5000); // Refresh setiap 5 detik

    // Refresh saat window/tab mendapat focus (user kembali ke halaman)
    const handleFocus = () => {
      console.log("Window focused - refreshing Fit To Work data...");
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
      setTotalJamTidurAngka(diff > 0 ? diff / 60 : 0); // SET ANGKA
    } else {
      setJumlahJamTidur("");
      setTotalJamTidurAngka(0); // RESET ANGKA
    }
  }, [jamTidur, jamBangun]);

  // Logika status Fit To Work
  useEffect(() => {
    if (
      totalJamTidurAngka >= 6 &&
      konsumsiObat === "Ya" &&
      masalahPribadi === "Ya" &&
      siapBekerja === "Ya"
    ) {
      setStatus("Fit To Work");
    } else {
      setStatus("Not Fit To Work");
    }
  }, [totalJamTidurAngka, konsumsiObat, masalahPribadi, siapBekerja]);

  // Validasi form
  const isFormValid =
    jamTidur &&
    jamBangun &&
    konsumsiObat &&
    masalahPribadi &&
    siapBekerja &&
    (konsumsiObat === "Ya" || (konsumsiObat === "Tidak" && jenisObat));

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

      const payload = {
        nama: user.nama,
        jabatan: user.jabatan,
        nrp: user.nrp,
        site: user.site,
        tanggal: today,
        jam_tidur: jamTidur,
        jam_bangun: jamBangun,
        total_jam_tidur: totalJamTidurAngka,
        tidak_mengkonsumsi_obat: konsumsiObat === "Ya",
        tidak_ada_masalah_pribadi: masalahPribadi === "Ya",
        siap_bekerja: siapBekerja === "Ya",
        catatan_obat: jenisObat,
        status: computedStatus,
        status_fatigue: computedStatus, // Gunakan status_fatigue juga
        initial_status_fatigue: computedStatus, // Status saat pengisian pertama (tidak diubah saat validasi)
        workflow_status: workflowStatus, // Set workflow_status untuk validasi
        alasan_not_fit_user: null,
      };

      console.log("Submitting payload to fit_to_work:", payload);
      console.log(
        "Validation required:",
        requiresValidation,
        "| Workflow Status:",
        workflowStatus
      );

      // Insert ke tabel fit_to_work (sistem validasi membaca langsung dari sini)
      const { data: insertedRows, error } = await supabase
        .from("fit_to_work")
        .insert(payload)
        .select("*")
        .limit(1);

      if (error) throw error;

      console.log("Fit To Work data saved successfully");
      if (requiresValidation) {
        console.log(
          "Record memerlukan validasi - Leading Hand akan melihat di halaman Validasi Fit To Work"
        );
      }

      setSudahIsiHariIni(true);
      // Refresh data setelah submit berhasil
      console.log("Desktop submit berhasil, refreshing data...");
      await cekSudahIsi();

      setSuccess(true);

      // Reset form after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("Error submitting fit to work:", err);
      setError("Gagal menyimpan data Fit To Work. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  // Styles untuk desktop - geser sedikit ke kiri agar lebih seimbang
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

  const fitToWorkCardStyle = {
    background: "transparent", // transparan agar menyatu dengan background biru tua
    borderRadius: 18,
    boxShadow: "none",
    padding: 16,
    maxWidth: 1100,
    width: "100%",
    margin: "0 auto",
    height: "auto",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    color: "#e5e7eb",
  };

  const headerStyle = {
    textAlign: "center",
    marginBottom: 16,
    marginTop: 0,
    padding: 0,
  };

  const titleStyle = {
    fontWeight: 900,
    fontSize: 28,
    color: "#60a5fa",
    margin: 0,
  };

  const fieldStyle = {
    width: "100%",
    marginBottom: 16,
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

  const readOnlyInputStyle = {
    ...inputStyle,
    background: "#0b1220",
    color: "#93a3b8",
  };

  const timeContainerStyle = {
    display: "flex",
    gap: 16,
    width: "100%",
    marginBottom: 16,
  };

  const timeFieldStyle = {
    flex: 1,
  };

  const buttonGroupStyle = {
    display: "flex",
    gap: 12,
    marginTop: 8,
  };

  const buttonStyle = (isSelected) => ({
    flex: 1,
    padding: "12px 24px",
    borderRadius: 8,
    border: "2px solid",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    background: isSelected ? "#2563eb" : "transparent",
    color: isSelected ? "#fff" : "#60a5fa",
    borderColor: "#2563eb",
  });

  const fitToWorkSubmitButtonStyle = {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "14px 28px",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 16,
    width: 320,
    boxShadow: "0 6px 20px rgba(37,99,235,0.35)",
  };

  // Grid container untuk membagi form menjadi 2 kolom di desktop
  const formGridStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 24,
    width: "100%",
    alignItems: "start",
  };

  const fullWidthRowStyle = { gridColumn: "1 / -1" };

  const columnStackStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  };

  return (
    <div style={contentAreaStyle}>
      <div style={fitToWorkCardStyle}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>Fit To Work</h2>
        </div>

        {sudahIsiHariIni && (
          <div
            style={{
              color: "#2563eb",
              fontWeight: 700,
              marginBottom: 16,
              background: "#dbeafe",
              borderRadius: 8,
              padding: 12,
              border: "1.5px solid #2563eb",
              textAlign: "center",
              width: "100%",
              boxSizing: "border-box",
              fontSize: 16,
            }}
          >
            Anda sudah mengisi Fit To Work hari ini. Silakan isi kembali besok.
            <br />
            <small style={{ fontSize: 12, color: "#6b7280" }}>
              Tanggal WITA: {today} | NRP: {user?.nrp}
            </small>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          <div style={formGridStyle}>
            {/* Kolom Kiri */}
            <div style={columnStackStyle}>
              {/* Field Tanggal */}
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
                    style={inputStyle}
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
                    style={inputStyle}
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

              {/* Status bila sudah isi hari ini */}
              {sudahIsiHariIni && status && (
                <div style={{ margin: "8px 0 0 0" }}>
                  <div
                    style={{
                      color: status === "Fit To Work" ? "#22c55e" : "#ef4444",
                      background:
                        status === "Fit To Work" ? "#dcfce7" : "#fee2e2",
                      border:
                        status === "Fit To Work"
                          ? "2px solid #22c55e"
                          : "2px solid #ef4444",
                      borderRadius: 10,
                      fontWeight: 900,
                      fontSize: 16,
                      textAlign: "center",
                      padding: 8,
                      letterSpacing: 1,
                    }}
                  >
                    Status: {status}
                  </div>
                  {dataHariIni?.initial_status_fatigue &&
                    dataHariIni.initial_status_fatigue !== (dataHariIni?.status_fatigue || status) && (
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 13,
                          color: "#64748b",
                          textAlign: "center",
                        }}
                      >
                        Status awal: {dataHariIni.initial_status_fatigue} → Saat ini: {dataHariIni?.status_fatigue || status}
                      </div>
                    )}
                  {dataHariIni?.alasan_not_fit_user && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: 8,
                        background: "#fef2f2",
                        borderRadius: 6,
                        fontSize: 12,
                        color: "#991b1b",
                        textAlign: "left",
                      }}
                    >
                      <strong>Alasan Not Fit saat input:</strong> {dataHariIni.alasan_not_fit_user}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Kolom Kanan */}
            <div style={columnStackStyle}>
              {/* Konsumsi Obat */}
              <div style={fieldStyle}>
                <label style={labelStyle}>
                  Apakah Anda tidak mengkonsumsi obat yang dapat mempengaruhi
                  kemampuan bekerja?
                </label>
                <div style={buttonGroupStyle}>
                  <button
                    type="button"
                    onClick={() => setKonsumsiObat("Ya")}
                    style={buttonStyle(konsumsiObat === "Ya")}
                    disabled={sudahIsiHariIni}
                  >
                    Ya
                  </button>
                  <button
                    type="button"
                    onClick={() => setKonsumsiObat("Tidak")}
                    style={buttonStyle(konsumsiObat === "Tidak")}
                    disabled={sudahIsiHariIni}
                  >
                    Tidak
                  </button>
                </div>
              </div>

              {/* Jenis Obat */}
              {konsumsiObat === "Tidak" && (
                <div style={fieldStyle}>
                  <label style={labelStyle}>Jenis Obat</label>
                  <input
                    type="text"
                    value={jenisObat}
                    onChange={(e) => setJenisObat(e.target.value)}
                    placeholder="Masukkan jenis obat"
                    style={inputStyle}
                    disabled={konsumsiObat !== "Tidak" || sudahIsiHariIni}
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
                    onClick={() => setMasalahPribadi("Ya")}
                    style={buttonStyle(masalahPribadi === "Ya")}
                    disabled={sudahIsiHariIni}
                  >
                    Ya
                  </button>
                  <button
                    type="button"
                    onClick={() => setMasalahPribadi("Tidak")}
                    style={buttonStyle(masalahPribadi === "Tidak")}
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

            </div>

            {/* Catatan Validator - tampil bila ada catatan dari perbaikan Not Fit To Work */}
            {sudahIsiHariIni &&
              dataHariIni &&
              (dataHariIni.catatan_tahap1 || dataHariIni.catatan_tahap2) && (
              <div
                style={{
                  ...fullWidthRowStyle,
                  marginTop: 16,
                  padding: 16,
                  backgroundColor: "#f1f5f9",
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 15,
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
                        fontSize: 14,
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
                          fontSize: 12,
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
                        fontSize: 14,
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
                          fontSize: 12,
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

            {/* Error / Success (Full width) */}
            {error && (
              <div
                style={{
                  ...fullWidthRowStyle,
                  color: "#b91c1c",
                  fontWeight: 700,
                  marginTop: 8,
                  background: "#fee2e2",
                  borderRadius: 8,
                  padding: 8,
                  border: "1.5px solid #b91c1c",
                  fontSize: 16,
                }}
              >
                {error}
              </div>
            )}
            {success && (
              <div
                style={{
                  ...fullWidthRowStyle,
                  color: "#16a34a",
                  fontWeight: 700,
                  marginTop: 8,
                  background: "#dcfce7",
                  borderRadius: 8,
                  padding: 8,
                  border: "1.5px solid #22c55e",
                  fontSize: 16,
                }}
              >
                Data Fit To Work berhasil disimpan!
              </div>
            )}

            {/* Tombol Submit - di tengah, full width grid dan align center */}
            {!sudahIsiHariIni && (
              <div
                style={{
                  ...fullWidthRowStyle,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <button
                  type="submit"
                  disabled={!isFormValid || loading || sudahIsiHariIni}
                  style={fitToWorkSubmitButtonStyle}
                >
                  {loading ? "Menyimpan..." : "Simpan Fit To Work"}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default FitToWorkFormDesktop;
