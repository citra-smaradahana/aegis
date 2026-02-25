import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { sessionManager } from "../../utils/sessionManager";
import FatigueCheckView from "./FatigueCheckView";
import MobileHeader from "../MobileHeader";
import MobileBottomNavigation from "../MobileBottomNavigation";
import "./FatigueCheck.css";

const FatigueCheckListDesktop = ({ user: userProp, onNavigate }) => {
  const sessionUser = userProp || sessionManager.getSession();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewReportId, setViewReportId] = useState(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const userSite = (sessionUser?.site || "").trim();
      const canSeeAll =
        ["Penanggung Jawab Operasional", "Asst. Penanggung Jawab Operasional", "SHERQ Officer", "Admin Site Project"].includes(
          sessionUser?.jabatan || ""
        );

      let query = supabase
        .from("fatigue_checks")
        .select("id, date, shift, site, location, inspector_name, status, checks, created_at")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(canSeeAll ? 100 : 50);

      if (!canSeeAll) {
        if (!userSite) {
          setReports([]);
          setLoading(false);
          return;
        }
        query = query.eq("site", userSite);
      }

      const { data, error } = await query;

      if (error) {
        console.warn("Gagal fetch fatigue_checks:", error);
        setReports([]);
      } else {
        setReports(data || []);
      }
    } catch (err) {
      console.error("Error fetching fatigue reports:", err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [sessionUser?.site, sessionUser?.jabatan]);

  const renderCard = (report) => {
    const checkCount = Array.isArray(report.checks) ? report.checks.length : 0;
    return (
      <div
        key={report.id}
        style={{
          background: "#1f2937",
          border: "1px solid #374151",
          borderRadius: 12,
          padding: 20,
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.borderColor = "#60a5fa";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.borderColor = "#374151";
        }}
        onClick={() => setViewReportId(report.id)}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <span style={{ color: "#d1d5db", fontSize: 14, fontWeight: 500 }}>{report.date}</span>
          <span
            style={{
              background: "rgba(34, 197, 94, 0.25)",
              color: "#22c55e",
              padding: "4px 10px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            Closed
          </span>
        </div>
        <div style={{ color: "#f3f4f6", fontWeight: 600, marginBottom: 8, fontSize: 15 }}>
          Shift: {report.shift || "-"} | {report.location || "-"}
        </div>
        <div style={{ color: "#d1d5db", fontSize: 14, fontWeight: 500 }}>
          Inspector: {report.inspector_name || "-"} • {checkCount} pengecekan
        </div>
      </div>
    );
  };

  const canCreate = ["Field Leading Hand", "Plant Leading Hand"].includes(sessionUser?.jabatan || "");

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "transparent",
        display: "flex",
        flexDirection: "column",
        padding: "0 80px 0 24px",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto", flex: 1, display: "flex", flexDirection: "column", minHeight: 0, width: "100%" }}>
        <div style={{ marginBottom: 24, flexShrink: 0 }}>
          <h2 style={{ margin: 0, color: "#60a5fa", fontWeight: 900, fontSize: 28 }}>Fatigue Check Report</h2>
        </div>
        <div style={{ flex: 1, overflowY: "auto", paddingRight: 4, minHeight: 0 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 48, color: "#9ca3af", fontSize: 15 }}>Memuat data...</div>
          ) : reports.length === 0 ? (
            <div
              style={{
                padding: "48px 32px",
                background: "#1f2937",
                borderRadius: 16,
                border: "1px dashed #4b5563",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.6 }}>😴</div>
              <div style={{ color: "#e5e7eb", fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                {!sessionUser?.site ? "Site tidak terdeteksi" : "Belum ada laporan Fatigue Check"}
              </div>
              <div style={{ color: "#9ca3af", fontSize: 14, marginBottom: canCreate ? 20 : 0 }}>
                {!sessionUser?.site
                  ? "Pastikan Anda sudah memilih site."
                  : canCreate
                  ? "Silakan buat laporan baru untuk memulai."
                  : "Belum ada laporan untuk ditampilkan."}
              </div>
              {canCreate && sessionUser?.site && (
                <button
                  onClick={() => onNavigate && onNavigate("fatigue-check-new")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 20px",
                    borderRadius: 10,
                    fontWeight: 600,
                    color: "#fff",
                    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  + Buat Laporan Baru
                </button>
              )}
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                <h3 style={{ color: "#93c5fd", fontWeight: 700, fontSize: 16, margin: 0 }}>
                  Daftar Laporan
                </h3>
                {canCreate && (
                  <button
                    onClick={() => onNavigate && onNavigate("fatigue-check-new")}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 20px",
                      borderRadius: 10,
                      fontWeight: 600,
                      color: "#fff",
                      background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    + Buat Laporan Baru
                  </button>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {reports.map((r) => renderCard(r))}
              </div>
            </div>
          )}
        </div>
      </div>

      {viewReportId && (
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
            if (e.target === e.currentTarget) setViewReportId(null);
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              background: "#1e293b",
              borderRadius: 16,
              overflow: "hidden",
              maxWidth: 900,
              margin: "0 auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <FatigueCheckView
              reportId={viewReportId}
              user={sessionUser}
              embedded
              onBack={() => {
                setViewReportId(null);
                fetchReports();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const FatigueCheckListMobile = ({ user: userProp, onNavigate, tasklistTodoCount = 0 }) => {
  const sessionUser = userProp || sessionManager.getSession();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewReportId, setViewReportId] = useState(null);
  const [isMobile] = useState(true);

  useEffect(() => {
    fetchReports();
  }, [sessionUser?.site]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const userSite = (sessionUser?.site || "").trim();
      const canSeeAll =
        ["Penanggung Jawab Operasional", "Asst. Penanggung Jawab Operasional", "SHERQ Officer", "Admin Site Project"].includes(
          sessionUser?.jabatan || ""
        );

      let query = supabase
        .from("fatigue_checks")
        .select("id, date, shift, site, location, inspector_name, status, checks, created_at")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(canSeeAll ? 100 : 50);

      if (!canSeeAll) {
        if (!userSite) {
          setReports([]);
          setLoading(false);
          return;
        }
        query = query.eq("site", userSite);
      }

      const { data, error } = await query;

      if (error) {
        setReports([]);
      } else {
        setReports(data || []);
      }
    } catch (err) {
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const canCreate = ["Field Leading Hand", "Plant Leading Hand"].includes(sessionUser?.jabatan || "");

  const handleBack = () => {
    if (viewReportId) {
      setViewReportId(null);
      fetchReports();
    } else {
      onNavigate && onNavigate("dashboard");
    }
  };

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "#f8fafc",
        paddingBottom: "calc(70px + env(safe-area-inset-bottom))",
      }}
    >
      <MobileHeader user={sessionUser} onBack={handleBack} title="Fatigue Check Report" />
      <div style={{ padding: 16, paddingTop: 76 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 48, color: "#6b7280", fontSize: 15 }}>Memuat data...</div>
        ) : reports.length === 0 ? (
          <div
            style={{
              padding: "32px 24px",
              background: "#fff",
              borderRadius: 16,
              textAlign: "center",
              border: "1px dashed #e5e7eb",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.7 }}>😴</div>
            <div style={{ color: "#111827", fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
              Belum ada laporan Fatigue Check
            </div>
            <div style={{ color: "#6b7280", fontSize: 14, marginBottom: canCreate ? 20 : 0 }}>
              Silakan buat laporan baru untuk memulai.
            </div>
            {canCreate && (
              <button
                onClick={() => onNavigate && onNavigate("fatigue-check-new")}
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,
                  fontWeight: 600,
                  color: "#fff",
                  background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                + Buat Laporan Baru
              </button>
            )}
          </div>
        ) : (
          <div>
            {canCreate && (
              <button
                onClick={() => onNavigate && onNavigate("fatigue-check-new")}
                style={{
                  width: "100%",
                  padding: "12px 20px",
                  borderRadius: 12,
                  fontWeight: 600,
                  color: "#fff",
                  background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                  border: "none",
                  cursor: "pointer",
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                + Buat Laporan Baru
              </button>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {reports.map((r) => {
              const checkCount = Array.isArray(r.checks) ? r.checks.length : 0;
              return (
                <div
                  key={r.id}
                  onClick={() => setViewReportId(r.id)}
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    padding: 16,
                    border: "1px solid #e5e7eb",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, color: "#0f172a", fontSize: 15 }}>{r.date}</span>
                    <span
                      style={{
                        background: "#d1fae5",
                        color: "#047857",
                        padding: "2px 8px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      Closed
                    </span>
                  </div>
                  <div style={{ fontSize: 14, color: "#374151", fontWeight: 500 }}>
                    {r.shift || "-"} • {r.inspector_name || "-"} • {checkCount} pengecekan
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        )}
      </div>

      {viewReportId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "#fff",
            overflow: "auto",
          }}
        >
          <FatigueCheckView
            reportId={viewReportId}
            user={sessionUser}
            onBack={() => {
              setViewReportId(null);
              fetchReports();
            }}
          />
        </div>
      )}

      <MobileBottomNavigation
        activeTab={null}
        tasklistTodoCount={tasklistTodoCount}
        onNavigate={(tab) => {
          if (tab === "home") onNavigate("dashboard");
          else if (tab === "tasklist") onNavigate("tasklist");
        }}
      />
    </div>
  );
};

function FatigueCheckList({ user, onNavigate, tasklistTodoCount = 0 }) {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile ? (
    <FatigueCheckListMobile user={user} onNavigate={onNavigate} tasklistTodoCount={tasklistTodoCount} />
  ) : (
    <FatigueCheckListDesktop user={user} onNavigate={onNavigate} />
  );
}

export default FatigueCheckList;
