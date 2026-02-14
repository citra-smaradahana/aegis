import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

const PendingReportsList = ({ user, onSelectReport, selectedReportId, variant = "mobile" }) => {
  const useDropdown = variant === "desktop";
  const [pendingReports, setPendingReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchPendingReports();
  }, []);

  // Force refresh when component mounts
  useEffect(() => {
    fetchPendingReports();
  }, []);

  const fetchPendingReports = async () => {
    try {
      setLoading(true);
      console.log(
        "PendingReportsList: Fetching pending reports for user:",
        user.id
      );

      // Coba panggil function untuk mendapatkan pending reports
      const { data, error } = await supabase.rpc(
        "get_pending_reports_for_hazard"
      );

      console.log("PendingReportsList: Query result:", {
        data,
        error,
        count: data?.length,
      });

      if (error) {
        console.error("Function error:", error);
        // Fallback: coba query manual
        await fetchPendingReportsManual();
        return;
      }

      console.log("PendingReportsList: Setting data:", data);
      console.log(
        "PendingReportsList: PTO data with foto_temuan:",
        data
          ?.filter((item) => item.sumber_laporan === "PTO")
          .map((item) => ({
            id: item.id,
            foto_temuan: item.foto_temuan,
            url_length: item.foto_temuan?.length,
            url_start: item.foto_temuan?.substring(0, 50),
            url_end: item.foto_temuan?.substring(-20),
          }))
      );
      setPendingReports(data || []);
    } catch (err) {
      console.error("Error fetching pending reports:", err);
      // Fallback: coba query manual
      await fetchPendingReportsManual();
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingReportsManual = async () => {
    try {
      console.log("Trying manual query as fallback...");

      // Query PTO pending - now with separate pic column and foto temuan
      const { data: ptoData, error: ptoError } = await supabase
        .from("planned_task_observation")
        .select(
          `
          id, 
          nama_observer, 
          tanggal, 
          detail_lokasi, 
          tindakan_perbaikan, 
          site, 
          pic_tindak_lanjut_id, 
          pic,
          nrp_pic,
          foto_temuan
        `
        )
        .eq("status", "pending");

      console.log("PTO Data with PIC:", ptoData);
      console.log(
        "PTO PIC Values:",
        ptoData?.map((item) => ({
          id: item.id,
          pic: item.pic,
          nrp_pic: item.nrp_pic,
          foto_temuan: item.foto_temuan,
        }))
      );

      // Debug: Check PIC field values
      console.log("=== PTO PIC DEBUG ===");
      ptoData?.forEach((item) => {
        console.log(`PTO ID ${item.id}:`, {
          pic: item.pic,
          nrp_pic: item.nrp_pic,
          pic_tindak_lanjut_id: item.pic_tindak_lanjut_id,
          nama_observer: item.nama_observer,
        });
      });
      console.log("=== END PTO PIC DEBUG ===");

      // Get PIC names from users table for PTOs that have pic_tindak_lanjut_id
      const ptoWithPicIds =
        ptoData?.filter((item) => item.pic_tindak_lanjut_id) || [];
      let picNamesMap = {};

      if (ptoWithPicIds.length > 0) {
        const picIds = ptoWithPicIds.map((item) => item.pic_tindak_lanjut_id);
        const { data: picData, error: picError } = await supabase
          .from("users")
          .select("id, nama")
          .in("id", picIds);

        if (!picError && picData) {
          picNamesMap = picData.reduce((acc, user) => {
            acc[user.id] = user.nama;
            return acc;
          }, {});
        }

        console.log("PIC Names Map:", picNamesMap);
      }

      // Query Take 5 pending
      const { data: take5Data, error: take5Error } = await supabase
        .from("take_5")
        .select(
          "id, nama, pelapor_nama, tanggal, detail_lokasi, deskripsi_kondisi, site"
        )
        .eq("status", "pending")
        .is("hazard_id", null);

      if (ptoError || take5Error) {
        console.error("Manual query errors:", { ptoError, take5Error });
        setError("Gagal memuat data pending reports");
        return;
      }

      // Combine data
      const combinedData = [
        ...(ptoData || []).map((item) => ({
          id: item.id, // This is the PTO ID (primary key from planned_task_observation)
          sumber_laporan: "PTO",
          nama_pelapor: item.nama_observer || "Unknown",
          tanggal: item.tanggal,
          detail_lokasi: item.detail_lokasi || "Unknown",
          deskripsi: item.tindakan_perbaikan || "Tidak ada deskripsi",
          site: item.site,
          pic_tindak_lanjut_id: item.pic_tindak_lanjut_id,
          nrp_pic:
            item.pic ||
            item.nrp_pic ||
            picNamesMap[item.pic_tindak_lanjut_id] ||
            "", // Try pic, nrp_pic, then users table
          foto_temuan: item.foto_temuan || null, // Include foto temuan
        })),
        ...(take5Data || []).map((item) => ({
          id: item.id,
          sumber_laporan: "Take5",
          nama_pelapor: item.nama || item.pelapor_nama || "Unknown",
          tanggal: item.tanggal,
          detail_lokasi: item.detail_lokasi || "Unknown",
          deskripsi: item.deskripsi_kondisi || "Tidak ada deskripsi",
          site: item.site, // Add site field for Take 5
        })),
      ];

      console.log("Manual query successful:", combinedData);
      console.log("=== FINAL PTO DATA WITH PIC ===");
      combinedData
        ?.filter((item) => item.sumber_laporan === "PTO")
        .forEach((item) => {
          console.log(`PTO ${item.id}:`, {
            nama_pelapor: item.nama_pelapor,
            site: item.site,
            detail_lokasi: item.detail_lokasi,
            nrp_pic: item.nrp_pic,
            pic_tindak_lanjut_id: item.pic_tindak_lanjut_id,
          });
        });
      console.log("=== END FINAL PTO DATA ===");
      console.log(
        "Manual query PTO data with foto_temuan:",
        combinedData
          ?.filter((item) => item.sumber_laporan === "PTO")
          .map((item) => ({
            id: item.id,
            foto_temuan: item.foto_temuan,
            url_length: item.foto_temuan?.length,
            url_start: item.foto_temuan?.substring(0, 50),
            url_end: item.foto_temuan?.substring(-20),
          }))
      );
      setPendingReports(combinedData);
    } catch (err) {
      console.error("Manual query failed:", err);
      setError("Gagal memuat data pending reports");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleSelectReport = (report) => {
    onSelectReport(report);
    setShowModal(false);
    setSearchQuery("");
  };

  const handleSelectChange = (e) => {
    const selectedId = e.target.value;
    if (selectedId === "") {
      onSelectReport(null);
    } else {
      const report = pendingReports.find((r) => r.id === selectedId);
      onSelectReport(report);
    }
  };

  const getReportDisplayText = (report) => {
    if (!report) return "";
    return `[${report.sumber_laporan}] ${report.nama_pelapor} - ${formatDate(report.tanggal)} - ${report.detail_lokasi}`;
  };

  const selectedReport = pendingReports.find((r) => r.id === selectedReportId);
  const filteredReports = pendingReports.filter((report) => {
    const text = getReportDisplayText(report).toLowerCase();
    return text.includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "20px", color: "#9ca3af" }}>
        Memuat data pending reports...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "20px", color: "#ef4444" }}>
        {error}
      </div>
    );
  }

  if (pendingReports.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "20px", color: "#9ca3af" }}>
        Tidak ada pending reports
      </div>
    );
  }

  // Desktop: dropdown sederhana seperti Lokasi/PIC
  if (useDropdown) {
    return (
      <div style={{ marginBottom: 24 }}>
        <label
          style={{
            display: "block",
            marginBottom: 4,
            color: "#e5e7eb",
            fontSize: 15,
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          Pilih Sumber Laporan (Opsional)
        </label>
        <select
          value={selectedReportId || ""}
          onChange={handleSelectChange}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: 12,
            borderRadius: 8,
            border: "1px solid #334155",
            background: "#0b1220",
            color: "#e5e7eb",
            fontSize: 15,
          }}
        >
          <option value="">Pilih PTO atau Take 5 pending...</option>
          {pendingReports.map((report) => (
            <option key={report.id} value={report.id}>
              [{report.sumber_laporan}] {report.nama_pelapor} -{" "}
              {formatDate(report.tanggal)} - {report.detail_lokasi}
            </option>
          ))}
        </select>
        {selectedReportId && (
          <div style={{ marginTop: 8, fontSize: "12px", color: "#9ca3af" }}>
            Deskripsi:{" "}
            {selectedReport?.deskripsi || "Tidak ada deskripsi"}
          </div>
        )}
      </div>
    );
  }

  // Mobile: modal dengan search
  return (
    <div style={{ marginBottom: 24 }}>
      <label
        style={{
          display: "block",
          marginBottom: 2,
          color: "#222",
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        Pilih Sumber Laporan (Opsional)
      </label>
      <div
        onClick={() => {
          setSearchQuery("");
          setShowModal(true);
        }}
        style={{
          width: "100%",
          boxSizing: "border-box",
          borderRadius: 8,
          padding: "12px 16px",
          fontSize: 14,
          border: "1px solid #d1d5db",
          backgroundColor: "#fff",
          color: selectedReport ? "#000" : "#9ca3af",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>
          {selectedReport
            ? getReportDisplayText(selectedReport)
            : "Pilih PTO atau Take 5 pending..."}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
      {selectedReportId && (
        <div style={{ marginTop: 8, fontSize: "12px", color: "#6b7280" }}>
          Deskripsi:{" "}
          {selectedReport?.deskripsi || "Tidak ada deskripsi"}
        </div>
      )}

      {/* Modal dengan search - seperti PIC dan Detail Lokasi */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 70,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 1100,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: "70vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "16px",
                borderBottom: "1px solid #e5e7eb",
                flexShrink: 0,
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
                Pilih Sumber Laporan
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik untuk mencari..."
                autoComplete="off"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  fontSize: 16,
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "8px 0",
              }}
            >
              <div
                onClick={() => handleSelectReport(null)}
                style={{
                  padding: "14px 16px",
                  fontSize: 16,
                  color: "#6b7280",
                  cursor: "pointer",
                  borderBottom: "1px solid #f3f4f6",
                }}
              >
                Tidak ada (Kosongkan)
              </div>
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => handleSelectReport(report)}
                  style={{
                    padding: "14px 16px",
                    fontSize: 16,
                    color: "#1f2937",
                    cursor: "pointer",
                    borderBottom: "1px solid #f3f4f6",
                  }}
                >
                  {getReportDisplayText(report)}
                </div>
              ))}
              {filteredReports.length === 0 && (
                <div
                  style={{
                    padding: 24,
                    textAlign: "center",
                    color: "#9ca3af",
                    fontSize: 14,
                  }}
                >
                  Tidak ada yang sesuai
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingReportsList;
