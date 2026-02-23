import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { sessionManager } from "../../utils/sessionManager";
import DailyAttendanceView from "./DailyAttendanceView";
import DailyAttendanceListMobile from "./DailyAttendanceListMobile";
import "./DailyAttendance.css";

/**
 * Halaman Utama: Daftar Riwayat Laporan Harian (Daily Attendance)
 * Menampilkan Pending Report (untuk PJO/Asst PJO) dan Semua Laporan sesuai site.
 * Klik laporan → buka modal preview & approval (tanpa navigasi).
 * Desktop: layout dengan sidebar. Mobile: layout dengan MobileHeader & BottomNav.
 */
const DailyAttendanceListDesktop = ({ user: userProp, onNavigate }) => {
  const sessionUser = userProp || sessionManager.getSession();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMeetingId, setViewMeetingId] = useState(null);

  useEffect(() => {
    fetchMeetings();
  }, [sessionUser?.site]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const userSite = (sessionUser?.site || "").trim();
      if (!userSite) {
        setMeetings([]);
        setLoading(false);
        return;
      }

      const { data: meetingsData, error } = await supabase
        .from("safety_meetings")
        .select(
          "id, date, meeting_type, topic, location, created_at, agenda_items, site, status, approver_name"
        )
        .eq("site", userSite)
        .order("date", { ascending: false })
        .limit(50);

      if (error) {
        console.warn("Gagal fetch safety_meetings:", error);
        setMeetings([]);
      } else {
        const mapped = (meetingsData || []).map((m) => ({
          id: m.id,
          date: m.date,
          meeting_type: m.meeting_type,
          topic: m.topic || "-",
          presenter: Array.isArray(m.agenda_items) && m.agenda_items[0]
            ? m.agenda_items[0].presenter || "-"
            : "-",
          location: m.location || "-",
          created_at: m.created_at,
          site: m.site || "-",
          status: m.status || "Pending",
          approver_name: m.approver_name || null,
        }));
        setMeetings(mapped);
      }
    } catch (error) {
      console.error("Error fetching meetings:", error);
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  const pendingReports = meetings.filter((m) => m.status === "Pending");
  const otherReports = meetings.filter((m) => m.status !== "Pending");
  const isPJOOrAsst =
    sessionUser?.jabatan === "Penanggung Jawab Operasional" ||
    sessionUser?.jabatan === "Asst. Penanggung Jawab Operasional";

  const renderMeetingCard = (meeting) => (
    <div
      key={meeting.id}
      style={{
        background: "#1f2937",
        border: "1px solid #374151",
        borderRadius: "12px",
        padding: "20px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.borderColor = "#60a5fa";
        e.currentTarget.style.boxShadow =
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = "#374151";
        e.currentTarget.style.boxShadow = "none";
      }}
      onClick={() => setViewMeetingId(meeting.id)}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span
            style={{
              backgroundColor: "rgba(59, 130, 246, 0.2)",
              color: "#60a5fa",
              padding: "4px 10px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "700",
              textTransform: "uppercase",
              border: "1px solid rgba(59, 130, 246, 0.3)",
            }}
          >
            {meeting.meeting_type}
          </span>
          <span className="text-gray-400 text-sm font-medium">
            {meeting.date}
          </span>
          <span
            style={{
              backgroundColor:
                meeting.status === "Pending"
                  ? "rgba(245, 158, 11, 0.2)"
                  : "rgba(34, 197, 94, 0.2)",
              color:
                meeting.status === "Pending" ? "#f59e0b" : "#22c55e",
              padding: "4px 10px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: "600",
            }}
          >
            {meeting.status === "Pending" ? "Pending" : "Approved"}
          </span>
        </div>
      </div>

      <h3 className="text-lg font-bold text-gray-200 mb-3">
        {meeting.topic}
      </h3>

      <div className="flex flex-wrap gap-4 text-sm text-gray-400">
        <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700">
          <span>📍</span>
          <span>{meeting.location}</span>
        </div>
        <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700">
          <span>👤</span>
          <span>{meeting.presenter}</span>
        </div>
        {meeting.approver_name && (
          <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700">
            <span>✓</span>
            <span>Approver: {meeting.approver_name}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "transparent",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "flex-start",
        padding: "0 80px 0 24px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: "transparent",
          borderRadius: 18,
          boxShadow: "none",
          padding: "24px 16px",
          maxWidth: 900,
          width: "100%",
          margin: "0 auto",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            flexShrink: 0,
            background: "transparent",
            border: "none",
            borderRadius: 18,
            padding: "24px 0",
            marginBottom: 20,
            textAlign: "center",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "#60a5fa",
              fontWeight: 900,
              fontSize: 28,
            }}
          >
            Daily Attendance Record
          </h2>
          <button
            onClick={() => onNavigate && onNavigate("daily-attendance-new")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 24px",
              borderRadius: 12,
              fontWeight: 600,
              color: "#fff",
              background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              border: "none",
              boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                "0 6px 20px rgba(59, 130, 246, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow =
                "0 4px 14px rgba(59, 130, 246, 0.4)";
            }}
          >
            <span style={{ fontSize: 20 }}>+</span> Buat Laporan Baru
          </button>
        </div>

        {/* Content - Scrollable */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
            paddingRight: "4px",
          }}
          className="custom-scrollbar"
        >
          {loading ? (
            <div className="text-center py-10 text-gray-400 font-medium">
              Memuat data...
            </div>
          ) : meetings.length === 0 ? (
            <div
              style={{
                padding: "40px",
                backgroundColor: "#1f2937",
                borderRadius: "12px",
                border: "1px dashed #374151",
                color: "#9ca3af",
                fontSize: "16px",
                textAlign: "center",
                fontWeight: "500",
              }}
            >
              {!sessionUser?.site
                ? "Site tidak terdeteksi. Pastikan Anda sudah memilih site."
                : "Belum ada laporan untuk site ini. Silakan buat baru."}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pending Report - untuk PJO/Asst PJO */}
              {isPJOOrAsst && pendingReports.length > 0 && (
                <div>
                  <h3
                    style={{
                      padding: "8px 0",
                      marginBottom: 12,
                      color: "#f59e0b",
                      fontWeight: 700,
                      fontSize: 16,
                    }}
                  >
                    Pending Report ({pendingReports.length})
                  </h3>
                  <div className="grid gap-4">
                    {pendingReports.map((m) => renderMeetingCard(m))}
                  </div>
                </div>
              )}

              {/* Semua Laporan / Laporan Lainnya */}
              <div>
                <h3
                  style={{
                    padding: "8px 0",
                    marginBottom: 12,
                    color: "#60a5fa",
                    fontWeight: 700,
                    fontSize: 16,
                  }}
                >
                  {isPJOOrAsst && pendingReports.length > 0
                    ? "Laporan Lainnya"
                    : "Daftar Laporan"}
                </h3>
                <div className="grid gap-4">
                  {(isPJOOrAsst && pendingReports.length > 0
                    ? otherReports
                    : meetings
                  ).map((m) => renderMeetingCard(m))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Preview & Approval */}
      {viewMeetingId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "stretch",
            justifyContent: "stretch",
            padding: 24,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewMeetingId(null);
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              background: "#1e293b",
              borderRadius: 16,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              maxWidth: 1200,
              margin: "0 auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <DailyAttendanceView
              meetingId={viewMeetingId}
              user={sessionUser}
              embedded
              onBack={() => {
                setViewMeetingId(null);
                fetchMeetings();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

function DailyAttendanceList({ user, onNavigate, tasklistTodoCount = 0 }) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth <= 768
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile ? (
    <DailyAttendanceListMobile
      user={user}
      onNavigate={onNavigate}
      tasklistTodoCount={tasklistTodoCount}
    />
  ) : (
    <DailyAttendanceListDesktop user={user} onNavigate={onNavigate} />
  );
}

export default DailyAttendanceList;
