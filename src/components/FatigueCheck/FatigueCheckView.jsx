import React, { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { supabase } from "../../supabaseClient";
import { sessionManager } from "../../utils/sessionManager";
import { downloadPdfFromElement } from "../../utils/downloadPdfFromElement";
import FatigueCheckPrint from "./FatigueCheckPrint";
import MobileHeader from "../MobileHeader";
import "./FatigueCheck.css";

const FatigueCheckView = ({ reportId, user: userProp, onBack, embedded }) => {
  const sessionUser = userProp || sessionManager.getSession();
  const printRef = useRef();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (reportId) fetchReport();
    else {
      setLoading(false);
      setError("ID laporan tidak ditemukan.");
    }
  }, [reportId]);

  const fetchReport = async () => {
    if (!reportId) return;
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from("fatigue_checks")
        .select("*")
        .eq("id", reportId)
        .single();

      if (err) throw err;
      setReport(data);
    } catch (e) {
      console.error("Gagal fetch fatigue check:", e);
      setError(e.message || "Gagal memuat laporan.");
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Fatigue_Check_${report?.date}_${report?.site}`,
    pageStyle: `
      @page {
        size: A4 landscape;
        margin: 5mm;
      }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .fatigue-check-print-container { width: 100% !important; }
      }
    `,
  });

  const handleDownloadPdf = async () => {
    if (!printRef?.current) return;
    try {
      setIsDownloadingPdf(true);
      const filename = `Fatigue_Check_${report?.date}_${report?.site || "report"}`;
      await downloadPdfFromElement(printRef, filename, { orientation: "landscape" });
    } catch (err) {
      console.error("Gagal download PDF:", err);
      alert("Gagal mengunduh PDF.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const btnPrimary = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 20px",
    borderRadius: 12,
    fontWeight: 600,
    color: "#fff",
    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
    border: "none",
    cursor: "pointer",
  };
  const btnOutline = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 20px",
    borderRadius: 12,
    fontWeight: 600,
    color: "#4f46e5",
    background: "#fff",
    border: "2px solid #a5b4fc",
    cursor: "pointer",
  };

  if (loading) return <div style={{ padding: 24, textAlign: "center" }}>Memuat...</div>;
  if (error || !report)
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <p style={{ color: "#ef4444", marginBottom: 16 }}>{error || "Laporan tidak ditemukan."}</p>
        <button onClick={onBack} style={btnOutline}>← Kembali</button>
      </div>
    );

  const checks = Array.isArray(report.checks) ? report.checks : [];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: embedded ? "100%" : "auto",
        minHeight: "100vh",
        paddingBottom: isMobile && !embedded ? "calc(70px + env(safe-area-inset-bottom))" : 0,
      }}
    >
      {isMobile && !embedded && (
        <MobileHeader user={sessionUser} onBack={onBack} title="Fatigue Check Report" />
      )}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: isMobile ? 16 : 24,
          paddingTop: isMobile && !embedded ? 76 : undefined,
        }}
      >
        {/* Header: judul + tombol Cetak & PDF */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 48,
          }}
        >
          {!isMobile && (
            <h1 style={{ margin: 0, color: "#1e293b", fontWeight: 700, fontSize: 22 }}>
              Fatigue Check Report
            </h1>
          )}
          <div style={{ display: "flex", gap: 12, marginLeft: !isMobile ? "auto" : 0 }}>
            {!isMobile && (
              <button onClick={handlePrint} style={btnOutline}>
                🖨️ Cetak
              </button>
            )}
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              style={{ ...btnPrimary, opacity: isDownloadingPdf ? 0.7 : 1 }}
            >
              {isDownloadingPdf ? "..." : "📥 PDF"}
            </button>
          </div>
        </div>

        <div className="fatigue-check-section" style={{ marginBottom: 24 }}>
          <div className="fatigue-check-section-header">Data Umum</div>
          <div style={{ padding: 24, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, color: "#0f172a" }}>
            <div><strong>Hari / Tanggal:</strong> {report.date}</div>
            <div><strong>Shift:</strong> {report.shift || "-"}</div>
            <div><strong>Site:</strong> {report.site || "-"}</div>
            <div><strong>Lokasi:</strong> {report.location || "-"}</div>
            <div><strong>Inspector:</strong> {report.inspector_name || "-"} ({report.inspector_jabatan || "-"})</div>
          </div>
        </div>

        <div className="fatigue-check-section">
          <div className="fatigue-check-section-header">Pengecekan Pekerja</div>
          <div style={{ padding: 24 }}>
            {checks.map((c, idx) => (
              <div key={idx} className="fatigue-check-card fatigue-check-view-card">
                <div className="fatigue-check-card-header">
                  <span className="fatigue-check-card-title">Pengecekan #{idx + 1}</span>
                </div>
                <div className="fc-view-grid">
                  <div className="fc-view-row fc-view-row-nama">
                    <span className="fc-view-label">Nama</span>
                    <span className="fc-view-value">{c.nama || "-"}</span>
                  </div>
                  <div className="fc-view-row">
                    <span className="fc-view-label">NIK/NRP</span>
                    <span className="fc-view-value">{c.nrp || "-"}</span>
                  </div>
                  <div className="fc-view-row">
                    <span className="fc-view-label">Jabatan</span>
                    <span className="fc-view-value">{c.jabatan || "-"}</span>
                  </div>
                  <div className="fc-view-row">
                    <span className="fc-view-label">Hari Kerja</span>
                    <span className="fc-view-value">{c.hari_kerja || "-"}</span>
                  </div>
                  <div className="fc-view-row">
                    <span className="fc-view-label">Jam Tidur 1x24</span>
                    <span className="fc-view-value">{c.jam_tidur || "-"}</span>
                  </div>
                  <div className="fc-view-row">
                    <span className="fc-view-label">Jam Periksa</span>
                    <span className="fc-view-value">{c.jam_periksa || "-"}</span>
                  </div>
                </div>
                <div className="fc-view-divider" />
                <div className="fc-view-grid fc-view-grid-compact">
                  <div className="fc-view-row">
                    <span className="fc-view-label">Sobriety 1</span>
                    <span className="fc-view-value">{c.soberity_1 ? "Unfit" : "-"}</span>
                  </div>
                  <div className="fc-view-row">
                    <span className="fc-view-label">Sobriety 2</span>
                    <span className="fc-view-value">{c.soberity_2 ? "Unfit" : "-"}</span>
                  </div>
                  <div className="fc-view-row">
                    <span className="fc-view-label">Sobriety 3</span>
                    <span className="fc-view-value">{c.soberity_3 ? "Unfit" : "-"}</span>
                  </div>
                  <div className="fc-view-row">
                    <span className="fc-view-label">Sobriety 4</span>
                    <span className="fc-view-value">{c.soberity_4 ? "Unfit" : "-"}</span>
                  </div>
                </div>
                <div className="fc-view-grid fc-view-grid-compact">
                  <div className="fc-view-row">
                    <span className="fc-view-label">Kontak Radio</span>
                    <span className="fc-view-value">{c.kontak_radio || "-"}</span>
                  </div>
                  <div className="fc-view-row">
                    <span className="fc-view-label">Tatap Muka</span>
                    <span className="fc-view-value">{c.kontak_tatap_muka || "-"}</span>
                  </div>
                  <div className="fc-view-row">
                    <span className="fc-view-label">Tekanan Darah</span>
                    <span className="fc-view-value">{c.tekanan_darah || "-"}</span>
                  </div>
                  <div className="fc-view-row">
                    <span className="fc-view-label">Tempat Tinggal</span>
                    <span className="fc-view-value">{c.mess_luar_mess || "-"}</span>
                  </div>
                </div>
                <div className="fc-view-divider" />
                <div className="fc-view-row fc-view-row-kriteria">
                  <span className="fc-view-label">Kriteria</span>
                  <span className="fc-view-value">
                    {c.fit ? "Fit" : c.unfit ? "Unfit" : "-"}
                    {c.unfit && c.tindakan_unfit && ` • Tindakan: ${c.tindakan_unfit}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hidden print area */}
      <div style={{ position: "absolute", left: -9999, top: 0, width: "297mm" }}>
        <FatigueCheckPrint ref={printRef} report={report} />
      </div>

    </div>
  );
};

export default FatigueCheckView;
