import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

const FitToWorkFormMobile = ({ user, onBack }) => {
  const [jamTidur, setJamTidur] = useState("");
  const [jamBangun, setJamBangun] = useState("");
  const [jumlahJamTidur, setJumlahJamTidur] = useState("");
  const [tidakMengkonsumsiObat, setTidakMengkonsumsiObat] = useState(""); // "Ya"/"Tidak"
  const [tidakAdaMasalahPribadi, setTidakAdaMasalahPribadi] = useState(""); // "Ya"/"Tidak"
  const [catatanObat, setCatatanObat] = useState("");
  const [siapBekerja, setSiapBekerja] = useState(""); // "Ya"/"Tidak"
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sudahIsiHariIni, setSudahIsiHariIni] = useState(false);
  const [totalJamTidurAngka, setTotalJamTidurAngka] = useState(0);
  const [dataHariIni, setDataHariIni] = useState(null);

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
        .maybeSingle();

      console.log("CekSudahIsi: Query result:", { data, error });

      if (error) {
        console.error("Error fetching data:", error);
        setSudahIsiHariIni(false);
        return;
      }

      if (data) {
        console.log("CekSudahIsi: Data found, setting sudahIsiHariIni to true");
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
        setStatus(data.status_fatigue || ""); // Use status_fatigue instead of status
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
      // Determine status_fatigue and workflow_status based on form data
      const statusFatigue = status; // "Fit To Work" or "Not Fit To Work"
      const workflowStatus = status === "Fit To Work" ? "Closed" : "Pending";

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
        status_fatigue: statusFatigue, // Use new field
        workflow_status: workflowStatus, // Use new field
        // Remove old status field
      };

      console.log("Data yang akan dikirim ke database:", insertData);

      const { error } = await supabase.from("fit_to_work").insert(insertData);

      if (error) throw error;

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
    height: "100%", // card selalu setinggi viewport
    // Hapus maxHeight dan overflowY agar card tidak scroll
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
    marginRight: 0,
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

  const fitToWorkSubmitButtonStyle = {
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
    <div style={contentAreaStyle}>
      <div
        style={{
          ...fitToWorkMobileCardStyle,
          marginTop: 0,
          paddingTop: 0,
          paddingBottom: 0,
          marginBottom: 0,
        }}
      >
        <div style={cardHeaderMobileStyle}>
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
          <h2 style={titleStyle}>Fit To Work</h2>
        </div>

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
            flex: 1,
            gap: 2,
            overflow: "hidden",
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
                fontSize: 10,
                textAlign: "center",
                padding: 3,
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

          {/* Submit Button fixed di bawah card */}
          {!sudahIsiHariIni ? (
            <div
              style={{
                position: "fixed",
                left: 0,
                right: 0,
                bottom: 56,
                zIndex: 100,
                maxWidth: 360,
                margin: "0 auto",
              }}
            >
              <button
                type="submit"
                disabled={!isFormValid || loading || sudahIsiHariIni}
                style={{
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderTopLeftRadius: 12,
                  borderTopRightRadius: 12,
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                  padding: "12px 0",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  width: "100%",
                  boxShadow: "0 -2px 8px #0001",
                }}
              >
                {loading ? "Menyimpan..." : "Simpan Fit To Work"}
              </button>
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
};

export default FitToWorkFormMobile;
