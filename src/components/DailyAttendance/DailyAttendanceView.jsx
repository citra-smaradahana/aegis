import React, { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { supabase } from "../../supabaseClient";
import { sessionManager } from "../../utils/sessionManager";
import { downloadPdfFromElement } from "../../utils/downloadPdfFromElement";
import DailyAttendancePrint from "./DailyAttendancePrint";
import "./DailyAttendance.css";

/**
 * Halaman View & Approval Laporan Harian
 * Menampilkan preview dan tombol Approve untuk PJO/Asst PJO.
 */
const DailyAttendanceView = ({ meetingId, user: userProp, onBack, embedded }) => {
  const sessionUser = userProp || sessionManager.getSession();
  const printRef = useRef();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meeting, setMeeting] = useState(null);
  const [approving, setApproving] = useState(false);
  const [showApprovedModal, setShowApprovedModal] = useState(false);
  const [approvalErrorMsg, setApprovalErrorMsg] = useState(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth <= 768
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isPJOOrAsst =
    sessionUser?.jabatan === "Penanggung Jawab Operasional" ||
    sessionUser?.jabatan === "Asst. Penanggung Jawab Operasional";

  useEffect(() => {
    if (meetingId) {
      fetchMeeting();
    } else {
      setLoading(false);
      setError("ID laporan tidak ditemukan. Silakan pilih dari daftar.");
    }
  }, [meetingId]);

  const fetchMeeting = async () => {
    if (!meetingId) return;
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from("safety_meetings")
        .select("*")
        .eq("id", meetingId)
        .single();

      if (err) throw err;
      let meetingData = { ...data };

      if (data.creator_id) {
        try {
          const { data: creator } = await supabase
            .from("users")
            .select("nama, jabatan")
            .eq("id", data.creator_id)
            .maybeSingle();
          meetingData.creator_name = creator?.nama || "";
          meetingData.creator_jabatan = creator?.jabatan || "";
        } catch (_) {
          meetingData.creator_name = "";
          meetingData.creator_jabatan = "";
        }
      }
      if (data.approver_id) {
        try {
          const { data: approver } = await supabase
            .from("users")
            .select("nama, jabatan")
            .eq("id", data.approver_id)
            .maybeSingle();
          meetingData.approver_name = approver?.nama || data.approver_name || "";
          meetingData.approver_jabatan = approver?.jabatan || "";
        } catch (_) {
          meetingData.approver_jabatan = meetingData.approver_jabatan || "";
        }
      }
      setMeeting(meetingData);
    } catch (e) {
      console.error("Gagal fetch meeting:", e);
      setError(e.message || "Gagal memuat laporan.");
      setMeeting(null);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!sessionUser?.id || !meeting || meeting.status !== "Pending") return;
    if (!isPJOOrAsst) {
      setApprovalErrorMsg("Hanya PJO atau Asst PJO yang dapat melakukan approval.");
      return;
    }
    try {
      setApproving(true);
      const { error: err } = await supabase
        .from("safety_meetings")
        .update({
          status: "Approved",
          approver_id: sessionUser.id,
          approver_name: sessionUser.nama || "",
          updated_at: new Date().toISOString(),
        })
        .eq("id", meetingId);

      if (err) throw err;
      setShowApprovedModal(true);
      setMeeting((prev) =>
        prev
          ? {
              ...prev,
              status: "Approved",
              approver_id: sessionUser.id,
              approver_name: sessionUser.nama || "",
              approver_jabatan: sessionUser.jabatan || "",
            }
          : null
      );
    } catch (e) {
      console.error("Gagal approve:", e);
      setApprovalErrorMsg(`Gagal menyetujui: ${e.message}`);
    } finally {
      setApproving(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Daily_Attendance_${meeting?.date}_${meeting?.site}`,
  });

  const handleDownloadPdf = async () => {
    if (!printRef?.current) return;
    try {
      setIsDownloadingPdf(true);
      const filename = `Daily_Attendance_${meeting?.date}_${meeting?.site || "report"}`;
      await downloadPdfFromElement(printRef, filename);
    } catch (err) {
      console.error("Gagal download PDF:", err);
      alert("Gagal mengunduh PDF. Silakan coba lagi.");
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
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    border: "none",
    boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)",
    cursor: "pointer",
    transition: "all 0.2s ease",
  };
  const btnSuccess = {
    ...btnPrimary,
    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    boxShadow: "0 4px 14px rgba(34, 197, 94, 0.4)",
  };
  const btnOutline = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 20px",
    borderRadius: 12,
    fontWeight: 600,
    color: "#2563eb",
    background: "#fff",
    border: "2px solid #93c5fd",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    cursor: "pointer",
    transition: "all 0.2s ease",
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-400 font-medium">
        Memuat laporan...
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="p-8">
        <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-6 text-center">
          <p className="text-red-200 mb-4">{error || "Laporan tidak ditemukan."}</p>
          <button
            onClick={() => onBack && onBack()}
            style={btnOutline}
          >
            ← Kembali
          </button>
        </div>
      </div>
    );
  }

  // Mengetahui = approver (PJO/Asst PJO) saja, bukan pembuat. Approver dari dropdown saat buat laporan atau yang menyetujui.
  const approverDisplay = meeting.approver_name || "(Menunggu Ttd)";

  const printData = {
    date: meeting.date,
    timeStart: meeting.time_start || "",
    timeEnd: meeting.time_end || "",
    duration: meeting.duration || "",
    place: meeting.location || "",
    meetingType: meeting.meeting_type || "Briefing",
    topic: meeting.topic || "",
    agenda: meeting.agenda || "",
    site: meeting.site || "",
    department: meeting.department || "",
    area: meeting.area || meeting.site || "",
    topics: meeting.agenda_items || [],
    issues: meeting.issues || [],
    actions: meeting.actions || [],
    creatorName: meeting.creator_name || "",
    creatorJabatan: meeting.creator_jabatan || "",
    approverName: approverDisplay,
    approverJabatan: meeting.approver_jabatan || "",
    status: meeting.status || "Pending",
  };

  return (
    <div
      style={{
        width: "100%",
        height: embedded ? "100%" : "100vh",
        minHeight: embedded ? 400 : undefined,
        background: "transparent",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        overflow: "hidden",
        padding: "0 24px",
      }}
    >
      {/* Header */}
      <div
        style={{
          flexShrink: 0,
          padding: "24px 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => onBack && onBack()}
            style={btnOutline}
          >
            ← Kembali
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-200">
              Preview Laporan Harian
            </h1>
            <p className="text-sm text-gray-400">
              {meeting.topic} • {meeting.date} • {meeting.meeting_type}
              <span
                style={{
                  marginLeft: 8,
                  padding: "2px 8px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  backgroundColor:
                    meeting.status === "Approved"
                      ? "rgba(34, 197, 94, 0.2)"
                      : "rgba(245, 158, 11, 0.2)",
                  color:
                    meeting.status === "Approved" ? "#22c55e" : "#f59e0b",
                }}
              >
                {meeting.status === "Approved" ? "Disetujui" : "Pending"}
              </span>
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            onClick={isMobile ? handleDownloadPdf : handlePrint}
            disabled={isMobile && isDownloadingPdf}
            style={{
              ...btnPrimary,
              opacity: isMobile && isDownloadingPdf ? 0.7 : 1,
            }}
          >
            {isMobile
              ? isDownloadingPdf
                ? "⏳ Mengunduh..."
                : "📥 Download PDF"
              : "Cetak PDF"}
          </button>
          {isPJOOrAsst && meeting.status === "Pending" && (
            <button
              onClick={handleApprove}
              disabled={approving}
              style={{
                ...btnSuccess,
                opacity: approving ? 0.7 : 1,
                cursor: approving ? "not-allowed" : "pointer",
              }}
            >
              {approving ? "Memproses..." : "✓ Setujui"}
            </button>
          )}
        </div>
      </div>

      {/* Preview */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          background: "#1f2937",
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
        className="custom-scrollbar"
      >
        <div
          ref={printRef}
          className="daily-attendance-paper-preview"
          style={{
            background: "#fff",
            width: "210mm",
            maxWidth: "210mm",
            margin: "0 auto",
            padding: 0,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <DailyAttendancePrint
            data={printData}
            attendanceData={meeting.attendance_list || []}
          />
        </div>
      </div>

      {/* Modal Pop-up: Laporan berhasil disetujui */}
      {showApprovedModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setShowApprovedModal(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 24,
              maxWidth: 360,
              width: "100%",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: 18,
                color: "#16a34a",
                marginBottom: 12,
              }}
            >
              ✓ Laporan berhasil disetujui!
            </div>
            <p style={{ color: "#4b5563", fontSize: 14, marginBottom: 20 }}>
              Status laporan telah diperbarui menjadi Disetujui.
            </p>
            <button
              type="button"
              onClick={() => setShowApprovedModal(false)}
              style={{
                width: "100%",
                padding: "12px",
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Baik
            </button>
          </div>
        </div>
      )}

      {/* Modal Pop-up: Error approval */}
      {approvalErrorMsg && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setApprovalErrorMsg(null)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 24,
              maxWidth: 360,
              width: "100%",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: 18,
                color: "#dc2626",
                marginBottom: 12,
              }}
            >
              Gagal
            </div>
            <p style={{ color: "#4b5563", fontSize: 14, marginBottom: 20 }}>
              {approvalErrorMsg}
            </p>
            <button
              type="button"
              onClick={() => setApprovalErrorMsg(null)}
              style={{
                width: "100%",
                padding: "12px",
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Baik
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyAttendanceView;
