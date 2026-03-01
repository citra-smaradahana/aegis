import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import MobileHeader from "../MobileHeader";
import MobileBottomNavigation from "../MobileBottomNavigation";
import TasklistForm from "../tasklistForms";

function TasklistPageMobile({ user, onBack, onNavigate, tasklistTodoCount = 0 }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("todo"); // "todo", "monitoring", "riwayat"
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [showActionForm, setShowActionForm] = useState(false);
  const [showEvidencePopup, setShowEvidencePopup] = useState(false);

  // User punya aksi pada hazard ini? (PIC, Pelapor, atau Evaluator)
  const userHasAction = (report) => {
    const currentName = (user?.nama || user?.user || "").toString().trim().toLowerCase();
    const pic = (report.pic || "").toString().trim().toLowerCase();
    const pelapor = (report.pelapor_nama || "").toString().trim().toLowerCase();
    const evaluator = (report.evaluator_nama || "").toString().trim().toLowerCase();
    const status = (report.status || "").trim();

    // PIC: Submit, Progress, Reject at Open, Reject at Done
    if (currentName === pic && ["Submit", "Progress", "Reject at Open", "Reject at Done"].includes(status)) return true;
    // Pelapor: Open (terima/tolak)
    if (currentName === pelapor && status === "Open") return true;
    // Evaluator: Done (evaluasi)
    if (currentName === evaluator && status === "Done") return true;
    return false;
  };

  // Fetch tasks untuk user berdasarkan tab aktif
  const fetchTasks = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      let hazardReports = [];

      if (activeTab === "todo") {
        // To Do: hazard non-closed di site user, FILTER hanya yang user punya aksi (PIC/Pelapor/Evaluator)
        const { data: hazardData, error: hazardError } = await supabase
          .from("hazard_report")
          .select("*")
          .eq("lokasi", user.site)
          .not("status", "ilike", "closed")
          .order("created_at", { ascending: false });

        if (hazardError) throw hazardError;
        hazardReports = (hazardData || []).filter(userHasAction);
      } else if (activeTab === "monitoring") {
        // Monitoring: hazard non-closed di site user, FILTER hanya yang user TIDAK punya aksi
        const { data: hazardData, error: hazardError } = await supabase
          .from("hazard_report")
          .select("*")
          .eq("lokasi", user.site)
          .not("status", "ilike", "closed")
          .order("created_at", { ascending: false });

        if (hazardError) throw hazardError;
        hazardReports = (hazardData || []).filter((r) => !userHasAction(r));
      } else if (activeTab === "riwayat") {
        // Riwayat: data all-time yang dibuat user sebagai pelapor, max 50, terbaru di atas
        const { data: hazardData, error: hazardError } = await supabase
          .from("hazard_report")
          .select("*")
          .eq("lokasi", user.site)
          .ilike("status", "closed")
          .order("created_at", { ascending: false })
          .limit(500); // fetch cukup untuk filter pelapor, lalu ambil 50

        if (hazardError) throw hazardError;
        const currentName = (user?.nama || user?.user || "").toString().trim().toLowerCase();
        const isPelapor = (r) => {
          const p = (r.pelapor_nama || "").toString().trim().toLowerCase();
          return !!p && p === currentName;
        };
        hazardReports = (hazardData || [])
          .filter(isPelapor)
          .slice(0, 50); // max 50 riwayat pelaporan
      }

      // Mapping hazard reports menjadi tasks (simpan raw report untuk form action)
      const allTasks = hazardReports.map((report) => ({
        id: report.id,
        type: "Hazard Report",
        title: `Hazard Report - ${report.lokasi}`,
        description:
          report.deskripsi_temuan || report.deskripsi || "Tidak ada deskripsi",
        status: report.status,
        priority: report.prioritas || "Medium",
        created_at: report.created_at,
        assignee: report.pic,
        color: getPriorityColor(report.prioritas || "Medium"),
        rawReport: report,
      }));

      setTasks(allTasks);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "#dc2626";
      case "Medium":
        return "#f59e0b";
      case "Low":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Tentukan apakah user punya aksi dan form mana yang dipakai
  const getActionFormStatus = (task) => {
    const report = task.rawReport;
    if (!report) return null;
    const currentName = (user?.nama || user?.user || "").toString().trim().toLowerCase();
    const pic = (report.pic || "").toString().trim().toLowerCase();
    const pelapor = (report.pelapor_nama || "").toString().trim().toLowerCase();
    const evaluator = (report.evaluator_nama || "").toString().trim().toLowerCase();
    const status = (report.status || "").trim();

    if (currentName === pic && status === "Submit") return "Submit";
    if (currentName === pelapor && status === "Open") return "Open";
    if (currentName === pic && status === "Reject at Open") return "Reject at Open";
    if (currentName === pic && status === "Progress") return "Progress";
    if (currentName === evaluator && status === "Done") return "Done";
    if (currentName === pic && status === "Reject at Done") return "Reject at Done";
    return null;
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    // To Do + user punya aksi -> tampilkan form action di popup
    if (activeTab === "todo" && getActionFormStatus(task)) {
      setShowActionForm(true);
      setShowTaskDetail(false);
    } else {
      setShowTaskDetail(true);
      setShowActionForm(false);
    }
  };

  const handleCloseTaskDetail = () => {
    setSelectedTask(null);
    setShowTaskDetail(false);
    setShowEvidencePopup(false);
  };

  const handleCloseActionForm = () => {
    setShowActionForm(false);
    setSelectedTask(null);
    fetchTasks();
  };

  useEffect(() => {
    fetchTasks();
  }, [user, activeTab]);

  if (loading) {
    return (
      <div
        style={{
          width: "100%",
          minHeight: "100vh",
          background: "#f8fafc",
          paddingBottom: 80,
        }}
      >
        <MobileHeader
          user={user}
          onBack={onBack}
          title="Tasklist"
          showBack={true}
        />
        <div
          style={{
            marginTop: 60,
            padding: "20px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "200px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
            <div style={{ color: "#6b7280" }}>Memuat task...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          width: "100%",
          minHeight: "100vh",
          background: "#f8fafc",
          paddingBottom: 80,
        }}
      >
        <MobileHeader
          user={user}
          onBack={onBack}
          title="Tasklist"
          showBack={true}
        />
        <div
          style={{
            marginTop: 60,
            padding: "20px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 24, marginBottom: 8 }}>❌</div>
          <div style={{ color: "#dc2626", marginBottom: 16 }}>
            Error: {error}
          </div>
          <button
            onClick={fetchTasks}
            style={{
              background: "#3b82f6",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "#f8fafc",
        paddingBottom: 80,
      }}
    >
      <MobileHeader
        user={user}
        onBack={onBack}
        title="Tasklist"
        showBack={true}
      />

      <div
        style={{
          marginTop: 60,
          padding: "20px",
        }}
      >
        {/* Tab Navigation - sticky agar tetap terlihat saat scroll */}
        <div
          style={{
            position: "sticky",
            top: 60,
            zIndex: 100,
            display: "flex",
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "4px",
            marginBottom: 20,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <button
            onClick={() => setActiveTab("todo")}
            style={{
              flex: 1,
              padding: "12px 16px",
              border: "none",
              borderRadius: "8px",
              background: activeTab === "todo" ? "#3b82f6" : "transparent",
              color: activeTab === "todo" ? "white" : "#6b7280",
              fontWeight: activeTab === "todo" ? 600 : 500,
              fontSize: 14,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            📝 To Do
          </button>
          <button
            onClick={() => setActiveTab("monitoring")}
            style={{
              flex: 1,
              padding: "12px 16px",
              border: "none",
              borderRadius: "8px",
              background:
                activeTab === "monitoring" ? "#3b82f6" : "transparent",
              color: activeTab === "monitoring" ? "white" : "#6b7280",
              fontWeight: activeTab === "monitoring" ? 600 : 500,
              fontSize: 14,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            👁️ Monitoring
          </button>
          <button
            onClick={() => setActiveTab("riwayat")}
            style={{
              flex: 1,
              padding: "12px 16px",
              border: "none",
              borderRadius: "8px",
              background: activeTab === "riwayat" ? "#3b82f6" : "transparent",
              color: activeTab === "riwayat" ? "white" : "#6b7280",
              fontWeight: activeTab === "riwayat" ? 600 : 500,
              fontSize: 14,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            📋 Riwayat
          </button>
        </div>

        {tasks.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>
              {activeTab === "todo" && "✅"}
              {activeTab === "monitoring" && "👁️"}
              {activeTab === "riwayat" && "📋"}
            </div>
            <h3
              style={{
                margin: 0,
                marginBottom: 8,
                color: "#1f2937",
                fontSize: 18,
              }}
            >
              {activeTab === "todo" && "Tidak ada tugas"}
              {activeTab === "monitoring" && "Tidak ada data monitoring"}
              {activeTab === "riwayat" && "Tidak ada riwayat"}
            </h3>
            <p
              style={{
                margin: 0,
                color: "#6b7280",
                fontSize: 14,
              }}
            >
              {activeTab === "todo" && "Semua tugas telah selesai ditangani"}
              {activeTab === "monitoring" && "Belum ada data untuk dimonitor"}
              {activeTab === "riwayat" && "Belum ada tugas yang telah selesai"}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {tasks.map((task) => (
              <div
                key={`${task.type}-${task.id}`}
                style={{
                  backgroundColor: "white",
                  borderRadius: "12px",
                  padding: "16px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  border: "1px solid #e5e7eb",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onClick={() => handleTaskClick(task)}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 8,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          backgroundColor: task.color,
                          color: "white",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {task.type}
                      </span>
                      <span
                        style={{
                          backgroundColor: task.color + "20",
                          color: task.color,
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {task.status}
                      </span>
                    </div>
                    <h3
                      style={{
                        margin: 0,
                        marginBottom: 4,
                        color: "#1f2937",
                        fontSize: 16,
                        fontWeight: 600,
                        lineHeight: 1.4,
                      }}
                    >
                      {task.title}
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        marginBottom: 8,
                        color: "#6b7280",
                        fontSize: 14,
                        lineHeight: 1.4,
                      }}
                    >
                      {task.description}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 12,
                    color: "#9ca3af",
                  }}
                >
                  <span>Ditugaskan ke: {task.assignee}</span>
                  <span>{formatDate(task.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <MobileBottomNavigation
        activeTab="tasklist"
        tasklistTodoCount={tasklistTodoCount}
        onNavigate={(tab) => {
          if (tab === "home") {
            onBack && onBack();
          } else if (tab === "profile") {
            // Navigate to profile menggunakan callback dari parent
            onNavigate && onNavigate("profile");
          }
          // tasklist tab tidak perlu handling karena sudah di halaman tasklist
        }}
      />

      {/* Action Form Popup - bottom sheet seperti PIC Hazard, dari navbar ke atas, scrollable */}
      {showActionForm && selectedTask && selectedTask.rawReport && (
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
          onClick={handleCloseActionForm}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                paddingBottom: 24,
              }}
            >
              <TasklistForm
                user={user}
                status={getActionFormStatus(selectedTask)}
                hazard={selectedTask.rawReport}
                readOnly={false}
                onClose={handleCloseActionForm}
                onSuccess={handleCloseActionForm}
                embedded={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Popup - Monitoring/Riwayat, read-only, bottom sheet seperti To Do */}
      {showTaskDetail && selectedTask && (
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
          onClick={handleCloseTaskDetail}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px",
                paddingBottom: 24,
              }}
            >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                borderBottom: "1px solid #e5e7eb",
                paddingBottom: "12px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  color: "#1f2937",
                  fontSize: 18,
                  fontWeight: 600,
                }}
              >
                Detail {selectedTask.type}
              </h3>
              <button
                onClick={handleCloseTaskDetail}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 24,
                  color: "#6b7280",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Content - sama seperti card To Do, view only */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label
                  style={{
                    color: "#6b7280",
                    fontSize: 14,
                    fontWeight: 600,
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Judul
                </label>
                <div style={{ color: "#1f2937", fontSize: 16 }}>
                  {selectedTask.title}
                </div>
              </div>

              <div>
                <label
                  style={{
                    color: "#6b7280",
                    fontSize: 14,
                    fontWeight: 600,
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Deskripsi Temuan
                </label>
                <div style={{ color: "#1f2937", fontSize: 16 }}>
                  {selectedTask.description}
                </div>
              </div>

              {/* Lokasi - sama seperti To Do */}
              {selectedTask.rawReport && (
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 8,
                    padding: 16,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ margin: 0, fontSize: 15, color: "#2563eb", fontWeight: 600, marginBottom: 8 }}>
                    📍 Lokasi
                  </div>
                  <div style={{ fontSize: 15, color: "#374151" }}>
                    <div><strong>Lokasi:</strong> {selectedTask.rawReport.lokasi || "-"}</div>
                    <div style={{ marginTop: 4 }}><strong>Detail Lokasi:</strong> {selectedTask.rawReport.detail_lokasi || "-"}</div>
                    <div style={{ marginTop: 4 }}><strong>Keterangan Lokasi:</strong> {selectedTask.rawReport.keterangan_lokasi || "-"}</div>
                  </div>
                </div>
              )}

              {/* Ketidaksesuaian - sama seperti To Do */}
              {selectedTask.rawReport && (
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 8,
                    padding: 16,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ margin: 0, fontSize: 15, color: "#f59e0b", fontWeight: 600, marginBottom: 8 }}>
                    ⚠️ Ketidaksesuaian
                  </div>
                  <div style={{ fontSize: 15, color: "#374151" }}>
                    <div><strong>Ketidaksesuaian:</strong> {selectedTask.rawReport.ketidaksesuaian || "-"}</div>
                    {(selectedTask.rawReport.sub_ketidaksesuaian || selectedTask.rawReport.quick_action) && (
                      <>
                        {selectedTask.rawReport.sub_ketidaksesuaian && (
                          <div style={{ marginTop: 4 }}><strong>Sub Ketidaksesuaian:</strong> {selectedTask.rawReport.sub_ketidaksesuaian}</div>
                        )}
                        {selectedTask.rawReport.quick_action && (
                          <div style={{ marginTop: 4 }}><strong>Quick Action:</strong> {selectedTask.rawReport.quick_action}</div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Foto Temuan - sama seperti To Do */}
              {selectedTask.rawReport?.evidence && (
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 8,
                    padding: 16,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ margin: 0, fontSize: 15, color: "#10b981", fontWeight: 600, marginBottom: 8 }}>
                    📷 Foto Temuan
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <img
                      src={selectedTask.rawReport.evidence}
                      alt="Foto Temuan"
                      style={{
                        width: "100%",
                        maxHeight: 200,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                        cursor: "pointer",
                      }}
                      onClick={() => setShowEvidencePopup(true)}
                    />
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4, textAlign: "center" }}>
                      Tap untuk melihat detail
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label
                  style={{
                    color: "#6b7280",
                    fontSize: 14,
                    fontWeight: 600,
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Status
                </label>
                <div>
                  <span
                    style={{
                      backgroundColor: selectedTask.color + "20",
                      color: selectedTask.color,
                      padding: "4px 12px",
                      borderRadius: "12px",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    {selectedTask.status}
                  </span>
                </div>
              </div>

              {/* Detail isi status - tampilkan field terkait status agar konsisten */}
              {selectedTask.rawReport && (() => {
                const r = selectedTask.rawReport;
                const status = (r.status || "").trim();
                const hasActionPlan = r.action_plan;
                const hasDueDate = r.due_date;
                const hasDeskripsi = r.deskripsi_penyelesaian;
                const hasEvidence = r.evidence_perbaikan;
                const hasAlasanOpen = r.alasan_penolakan_open;
                const hasAlasanDone = r.alasan_penolakan_done;
                const hasEvaluator = r.evaluator_nama;
                const formatDateOnly = (d) => d ? new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-";
                const showDetail = hasActionPlan || hasDueDate || hasDeskripsi || hasEvidence || hasAlasanOpen || hasAlasanDone || hasEvaluator;
                if (!showDetail) return null;
                return (
                  <div
                    style={{
                      background: "#f8fafc",
                      borderRadius: 8,
                      padding: 12,
                      marginTop: 4,
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 8 }}>
                      Detail Status
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14, color: "#1e293b" }}>
                      {hasActionPlan && (
                        <div>
                          <span style={{ fontWeight: 500, color: "#64748b" }}>Action Plan: </span>
                          <span style={{ whiteSpace: "pre-wrap" }}>{r.action_plan}</span>
                        </div>
                      )}
                      {hasDueDate && (
                        <div>
                          <span style={{ fontWeight: 500, color: "#64748b" }}>Due Date: </span>
                          {formatDateOnly(r.due_date)}
                        </div>
                      )}
                      {hasDeskripsi && ["Progress", "Done", "Reject at Done", "Closed"].includes(status) && (
                        <div>
                          <span style={{ fontWeight: 500, color: "#64748b" }}>Deskripsi Penyelesaian: </span>
                          <span style={{ whiteSpace: "pre-wrap" }}>{r.deskripsi_penyelesaian}</span>
                        </div>
                      )}
                      {hasEvidence && ["Progress", "Done", "Reject at Done", "Closed"].includes(status) && (
                        <div>
                          <span style={{ fontWeight: 500, color: "#64748b" }}>Evidence Perbaikan: </span>
                          <div style={{ marginTop: 4 }}>
                            <img
                              src={r.evidence_perbaikan}
                              alt="Evidence"
                              style={{ maxWidth: "100%", maxHeight: 150, borderRadius: 8, border: "1px solid #e2e8f0" }}
                            />
                          </div>
                        </div>
                      )}
                      {hasAlasanOpen && ["Reject at Open", "Reject at Done"].includes(status) && (
                        <div>
                          <span style={{ fontWeight: 500, color: "#64748b" }}>Alasan Penolakan (Open): </span>
                          <span style={{ whiteSpace: "pre-wrap" }}>{r.alasan_penolakan_open}</span>
                        </div>
                      )}
                      {hasAlasanDone && ["Reject at Done", "Done", "Closed"].includes(status) && (
                        <div>
                          <span style={{ fontWeight: 500, color: "#64748b" }}>Alasan Penolakan (Done): </span>
                          <span style={{ whiteSpace: "pre-wrap" }}>{r.alasan_penolakan_done}</span>
                        </div>
                      )}
                      {hasEvaluator && ["Done", "Closed"].includes(status) && (
                        <div>
                          <span style={{ fontWeight: 500, color: "#64748b" }}>Evaluator: </span>
                          {r.evaluator_nama}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div>
                <label
                  style={{
                    color: "#6b7280",
                    fontSize: 14,
                    fontWeight: 600,
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Pelapor
                </label>
                <div style={{ color: "#1f2937", fontSize: 16 }}>
                  {selectedTask.rawReport?.pelapor_nama || "-"}
                </div>
              </div>

              <div>
                <label
                  style={{
                    color: "#6b7280",
                    fontSize: 14,
                    fontWeight: 600,
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Ditugaskan ke
                </label>
                <div style={{ color: "#1f2937", fontSize: 16 }}>
                  {selectedTask.assignee}
                </div>
              </div>

              <div>
                <label
                  style={{
                    color: "#6b7280",
                    fontSize: 14,
                    fontWeight: 600,
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Tanggal Dibuat
                </label>
                <div style={{ color: "#1f2937", fontSize: 16 }}>
                  {formatDate(selectedTask.created_at)}
                </div>
              </div>
            </div>
            </div>

            {/* Popup Foto Temuan - tap untuk zoom */}
            {showEvidencePopup && selectedTask?.rawReport?.evidence && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "rgba(0,0,0,0.9)",
                  zIndex: 1200,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 20,
                }}
                onClick={() => setShowEvidencePopup(false)}
              >
                <button
                  onClick={() => setShowEvidencePopup(false)}
                  style={{
                    position: "absolute",
                    top: 20,
                    right: 20,
                    background: "none",
                    border: "none",
                    color: "#fff",
                    fontSize: 28,
                    cursor: "pointer",
                    padding: 8,
                    zIndex: 1,
                  }}
                >
                  ×
                </button>
                <img
                  src={selectedTask.rawReport.evidence}
                  alt="Foto Temuan"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "90vh",
                    objectFit: "contain",
                    borderRadius: 8,
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TasklistPageMobile;
