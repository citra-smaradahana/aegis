import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

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
  const [, setDataHariIni] = useState(null);

  // Get today's date in WITA (Waktu Indonesia Tengah)
  // This ensures users can fill Fit To Work again after 00:00 WITA
  // instead of waiting 24 hours from their last submission
  const getTodayWITA = () => {
    const now = new Date();
    // WITA is UTC+8
    const witaOffset = 8 * 60; // 8 hours in minutes
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const wita = new Date(utc + witaOffset * 60000);
    return wita.toISOString().split("T")[0];
  };

  const today = getTodayWITA();

  const cekSudahIsi = async () => {
    try {
      const { data, error } = await supabase
        .from("fit_to_work")
        .select("*")
        .eq("nrp", user.nrp)
        .eq("tanggal", today)
        .maybeSingle();

      if (error) {
        console.error("Error fetching data:", error);
        setSudahIsiHariIni(false);
        return;
      }

      if (data) {
        console.log("Desktop: Data found, setting sudahIsiHariIni to true");
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
        setStatus(data.status_fatigue || ""); // Use status_fatigue instead of status
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
      // Determine status_fatigue and workflow_status based on form data
      const statusFatigue = status; // "Fit To Work" or "Not Fit To Work"
      const workflowStatus = status === "Fit To Work" ? "Closed" : "Pending";

      const { error } = await supabase.from("fit_to_work").insert({
        nama: user.nama,
        jabatan: user.jabatan,
        nrp: user.nrp,
        site: user.site,
        tanggal: today,
        jam_tidur: jamTidur,
        jam_bangun: jamBangun,
        total_jam_tidur: totalJamTidurAngka, // KIRIM ANGKA
        tidak_mengkonsumsi_obat: konsumsiObat === "Ya",
        tidak_ada_masalah_pribadi: masalahPribadi === "Ya",
        siap_bekerja: siapBekerja === "Ya",
        catatan_obat: jenisObat,
        status_fatigue: statusFatigue, // Use new field
        workflow_status: workflowStatus, // Use new field
        // Remove old status field
      });

      if (error) throw error;

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

  // Styles untuk desktop
  const contentAreaStyle = {
    width: "100vw",
    minHeight: "100vh",
    background: "#f3f4f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 0",
  };

  const fitToWorkCardStyle = {
    background: "#fff",
    borderRadius: 18,
    boxShadow: "0 4px 24px #2563eb33",
    padding: 36,
    maxWidth: 800,
    width: "100%",
    margin: "40px auto",
    height: "auto",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
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
    color: "#2563eb",
    margin: 0,
  };

  const fieldStyle = {
    width: "100%",
    marginBottom: 16,
  };

  const labelStyle = {
    fontWeight: 600,
    color: "#222",
    marginBottom: 8,
    display: "block",
    fontSize: 16,
  };

  const inputStyle = {
    width: "100%",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    border: "1px solid #d1d5db",
  };

  const readOnlyInputStyle = {
    ...inputStyle,
    background: "#f9fafb",
    color: "#6b7280",
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
    background: isSelected ? "#2563eb" : "#fff",
    color: isSelected ? "#fff" : "#2563eb",
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
    width: "100%",
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
              fontSize: 16,
            }}
          >
            Anda sudah mengisi Fit To Work hari ini. Silakan isi kembali besok.
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
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

          {/* Status Fit To Work/Not Fit To Work di bawah Total Jam Tidur */}
          {sudahIsiHariIni && status && (
            <div
              style={{
                margin: "8px 0 0 0",
                color: status === "Fit To Work" ? "#22c55e" : "#ef4444",
                background: status === "Fit To Work" ? "#dcfce7" : "#fee2e2",
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

          {/* Error Message */}
          {error && (
            <div
              style={{
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

          {/* Success Message */}
          {success && (
            <div
              style={{
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

          {/* Submit Button */}
          {!sudahIsiHariIni && (
            <button
              type="submit"
              disabled={!isFormValid || loading || sudahIsiHariIni}
              style={fitToWorkSubmitButtonStyle}
            >
              {loading ? "Menyimpan..." : "Simpan Fit To Work"}
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default FitToWorkFormDesktop;
