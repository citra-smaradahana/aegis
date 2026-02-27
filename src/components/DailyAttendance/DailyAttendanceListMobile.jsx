import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { sessionManager } from "../../utils/sessionManager";
import DailyAttendanceView from "./DailyAttendanceView";
import MobileHeader from "../MobileHeader";
import MobileBottomNavigation from "../MobileBottomNavigation";
import "./DailyAttendance.css";

/**
 * Versi Mobile: Daftar Riwayat Laporan Harian (Daily Attendance)
 * Layout mobile dengan MobileHeader, card ringan, dan BottomNav
 */
const DailyAttendanceListMobile = ({ user: userProp, onNavigate, tasklistTodoCount = 0 }) => {
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
        .limit(20);

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

  const handleBack = () => {
    if (viewMeetingId) {
      setViewMeetingId(null);
      fetchMeetings();
    } else {
      onNavigate && onNavigate("dashboard");
    }
  };

  const renderMeetingCard = (meeting) => (
    <div
      key={meeting.id}
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 16,
        cursor: "pointer",
        transition: "all 0.2s ease",
        position: "relative",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
      onClick={() => setViewMeetingId(meeting.id)}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 10,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <span
          style={{
            backgroundColor: "rgba(59, 130, 246, 0.2)",
            color: "#2563eb",
            padding: "4px 10px",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          {meeting.meeting_type}
        </span>
        <span style={{ color: "#6b7280", fontSize: 12, fontWeight: 500 }}>
          {meeting.date}
        </span>
        <span
          style={{
            backgroundColor:
              meeting.status === "Pending"
                ? "rgba(245, 158, 11, 0.2)"
                : "rgba(34, 197, 94, 0.2)",
            color: meeting.status === "Pending" ? "#d97706" : "#16a34a",
            padding: "4px 10px",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {meeting.status === "Pending" ? "Pending" : "Disetujui"}
        </span>
      </div>

      <h3
        style={{
          margin: "0 0 12px 0",
          fontSize: 15,
          fontWeight: 600,
          color: "#1f2937",
          lineHeight: 1.4,
        }}
      >
        {meeting.topic}
      </h3>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          fontSize: 12,
          color: "#6b7280",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            backgroundColor: "#f9fafb",
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
          }}
        >
          <span>📍</span>
          <span>{meeting.location}</span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            backgroundColor: "#f9fafb",
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
          }}
        >
          <span>👤</span>
          <span>{meeting.presenter}</span>
        </div>
        {meeting.approver_name && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              backgroundColor: "#f9fafb",
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
            }}
          >
            <span>✓</span>
            <span>{meeting.approver_name}</span>
          </div>
        )}
      </div>
    </div>
  );

  // Modal view - full screen di mobile
  if (viewMeetingId) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          background: "#1e293b",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
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
    );
  }

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "#f8fafc",
        paddingBottom: "calc(70px + env(safe-area-inset-bottom))",
        boxSizing: "border-box",
      }}
    >
      <MobileHeader
        user={sessionUser}
        onBack={() => onNavigate && onNavigate("dashboard")}
        title="Laporan Harian"
        showBack={true}
      />

      <div
        style={{
          padding: "72px 20px 20px",
          maxWidth: 600,
          margin: "0 auto",
        }}
      >
        {/* Tombol Buat Laporan Baru */}
        <button
          onClick={() => onNavigate && onNavigate("daily-attendance-new")}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "14px 20px",
            borderRadius: 12,
            fontWeight: 600,
            color: "#fff",
            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            border: "none",
            boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)",
            cursor: "pointer",
            marginBottom: 20,
          }}
        >
          <span style={{ fontSize: 20 }}>+</span>
          Buat Laporan Baru
        </button>

        {/* Daftar Laporan */}
        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              color: "#6b7280",
              fontSize: 14,
            }}
          >
            Memuat data...
          </div>
        ) : meetings.length === 0 ? (
          <div
            style={{
              padding: 32,
              backgroundColor: "#fff",
              borderRadius: 12,
              border: "1px dashed #d1d5db",
              color: "#6b7280",
              fontSize: 14,
              textAlign: "center",
            }}
          >
            {!sessionUser?.site
              ? "Site tidak terdeteksi. Pastikan Anda sudah memilih site."
              : "Belum ada laporan untuk site ini. Silakan buat baru."}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {isPJOOrAsst && pendingReports.length > 0 && (
              <div>
                <h3
                  style={{
                    margin: "0 0 12px 0",
                    padding: 0,
                    color: "#d97706",
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  Pending ({pendingReports.length})
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {pendingReports.map((m) => renderMeetingCard(m))}
                </div>
              </div>
            )}

            <div>
              <h3
                style={{
                  margin: "0 0 12px 0",
                  padding: 0,
                  color: "#2563eb",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                {isPJOOrAsst && pendingReports.length > 0
                  ? "Laporan Lainnya"
                  : "Daftar Laporan"}
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {(isPJOOrAsst && pendingReports.length > 0
                  ? otherReports
                  : meetings
                ).map((m) => renderMeetingCard(m))}
              </div>
            </div>
          </div>
        )}
      </div>

      <MobileBottomNavigation
        activeTab={null}
        tasklistTodoCount={tasklistTodoCount}
        onNavigate={(tab) => {
          if (tab === "home") onNavigate && onNavigate("dashboard");
          else if (tab === "tasklist") onNavigate && onNavigate("tasklist");
          else if (tab === "profile") onNavigate && onNavigate("profile");
        }}
      />
    </div>
  );
};

export default DailyAttendanceListMobile;
