import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import MobileHeader from "../MobileHeader";
import MobileBottomNavigation from "../MobileBottomNavigation";

function TasklistPageMobile({ user, onBack, onNavigate }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("todo"); // "todo", "monitoring", "riwayat"
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);

  // Fetch tasks untuk user berdasarkan tab aktif
  const fetchTasks = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      let hazardReports = [];

      if (activeTab === "todo") {
        // Fetch hazard reports yang perlu ditangani user
        const { data: hazardData, error: hazardError } = await supabase
          .from("hazard_report")
          .select("*")
          .eq("lokasi", user.site)
          .in("status", ["open", "progress"])
          .order("created_at", { ascending: false });

        if (hazardError) throw hazardError;
        hazardReports = hazardData || [];
      } else if (activeTab === "monitoring") {
        // Fetch data untuk monitoring (status yang sedang berjalan, bukan closed)
        const { data: hazardData, error: hazardError } = await supabase
          .from("hazard_report")
          .select("*")
          .eq("lokasi", user.site)
          .not("status", "ilike", "closed")
          .order("created_at", { ascending: false });

        if (hazardError) throw hazardError;
        hazardReports = hazardData || [];
      } else if (activeTab === "riwayat") {
        // Fetch data yang sudah selesai
        const { data: hazardData, error: hazardError } = await supabase
          .from("hazard_report")
          .select("*")
          .eq("lokasi", user.site)
          .in("status", ["done", "closed"])
          .order("created_at", { ascending: false });

        if (hazardError) throw hazardError;
        hazardReports = hazardData || [];
      }

      // Mapping hazard reports menjadi tasks
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

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  const handleCloseTaskDetail = () => {
    setSelectedTask(null);
    setShowTaskDetail(false);
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
        {/* Tab Navigation */}
        <div
          style={{
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

        <div
          style={{
            marginBottom: 20,
            textAlign: "center",
          }}
        >
          <h2
            style={{
              margin: 0,
              marginBottom: 8,
              color: "#1f2937",
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            {activeTab === "todo" && "Daftar Tugas"}
            {activeTab === "monitoring" && "Monitoring Tugas"}
            {activeTab === "riwayat" && "Riwayat Tugas"}
          </h2>
          <p
            style={{
              margin: 0,
              color: "#6b7280",
              fontSize: 14,
            }}
          >
            {activeTab === "todo" &&
              `${tasks.length} tugas yang perlu ditangani`}
            {activeTab === "monitoring" &&
              `${tasks.length} tugas dalam monitoring`}
            {activeTab === "riwayat" &&
              `${tasks.length} tugas yang telah selesai`}
          </p>
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

      {/* Task Detail Modal */}
      {showTaskDetail && selectedTask && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={handleCloseTaskDetail}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "20px",
              maxWidth: "90vw",
              maxHeight: "80vh",
              overflow: "auto",
              width: "100%",
            }}
            onClick={(e) => e.stopPropagation()}
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

            {/* Modal Content */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
                  Deskripsi
                </label>
                <div style={{ color: "#1f2937", fontSize: 16 }}>
                  {selectedTask.description}
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
        </div>
      )}
    </div>
  );
}

export default TasklistPageMobile;
