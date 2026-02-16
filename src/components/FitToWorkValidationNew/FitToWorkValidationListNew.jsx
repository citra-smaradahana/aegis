import React, { useState } from "react";
import FitToWorkValidationFormNew from "./FitToWorkValidationFormNew";
import { getTodayWITA } from "../../utils/dateTimeHelpers";

function FitToWorkValidationListNew({
  validations,
  usersNotFilled = [],
  usersMarkedOff = [],
  onValidationSelect,
  onMarkUserOff,
  onUnmarkUserOff,
  canReviseOff = false,
  canMarkUserOff = false,
  filterStatus,
  onFilterChange,
  onBack,
  user,
  onUpdate,
  isMobile = false,
  tasklistTodoCount = 0,
}) {
  const [selectedValidation, setSelectedValidation] = useState(null);
  const [currentPage, setCurrentPage] = useState("list"); // "list" atau "form"
  const [confirmOffUser, setConfirmOffUser] = useState(null); // { user, action: 'off'|'on' } untuk popup konfirmasi

  // Tab: action | changes | outstanding | absent (absent hanya untuk canReviseOff)
  const [activeTab, setActiveTab] = useState("action");

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "#ff9800"; // Orange
      case "Level1_Review":
        return "#2196f3"; // Blue
      case "Level2_Review":
        return "#9c27b0"; // Purple
      case "Closed":
        return "#4caf50"; // Green
      default:
        return "#757575"; // Grey
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending":
        return "⏳";
      case "Level1_Review":
        return "👁️";
      case "Level2_Review":
        return "🔍";
      case "Closed":
        return "✅";
      default:
        return "❓";
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

  const formatTime = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  /** Derive penyebab Not Fit To Work dari data form (jam tidur, obat, masalah pribadi, siap bekerja) */
  const getPenyebabNotFit = (v) => {
    const causes = [];
    const jam = v.total_jam_tidur != null ? Number(v.total_jam_tidur) : null;
    if (jam != null && jam < 6) {
      causes.push(`Jam tidur ${jam.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} jam sehingga tidak mencapai minimum 6 jam`);
    }
    if (v.tidak_mengkonsumsi_obat === false || v.tidak_mengkonsumsi_obat === null) {
      causes.push(v.catatan_obat ? `Mengkonsumsi obat: ${v.catatan_obat}` : "Mengkonsumsi obat");
    }
    if (v.tidak_ada_masalah_pribadi === false || v.tidak_ada_masalah_pribadi === null) {
      causes.push("Ada masalah pribadi/keluarga");
    }
    if (v.siap_bekerja === false || v.siap_bekerja === null) {
      causes.push("Tidak siap untuk bekerja");
    }
    return causes.length > 0 ? causes.join("; ") : (v.alasan_not_fit_user || "—");
  };

  const getProgressPercentage = (status) => {
    switch (status) {
      case "Pending":
        return 25;
      case "Level1_Review":
        return 50;
      case "Level2_Review":
        return 75;
      case "Closed":
        return 100;
      default:
        return 0;
    }
  };

  const handleValidationClick = (validation) => {
    setSelectedValidation(validation);
    setCurrentPage("form");
  };

  const handleBackToList = () => {
    setCurrentPage("list");
    setSelectedValidation(null);
  };

  const handleUpdateSuccess = async (updatedValidation) => {
    try {
      // Call the actual update function
      const result = await onUpdate(updatedValidation);

      if (result && result.error) {
        throw new Error(result.error);
      }

      // If successful, go back to list and refresh data
      handleBackToList();
      // Note: The parent component will handle refreshing the data
    } catch (error) {
      console.error("Error in handleUpdateSuccess:", error);
      // You might want to show an error message here
    }
  };

  console.log(
    "FitToWorkValidationListNew - Rendering with validations:",
    validations
  );
  console.log("FitToWorkValidationListNew - filterStatus:", filterStatus);

  // Data untuk tab (dipakai di mode list dan mode form mobile)
  const pendingStatuses = ["Pending", "Level1_Review", "Level1 Review", "Level2_Review"];
  const pendingList = (validations || []).filter((v) =>
    pendingStatuses.includes(v.workflow_status)
  );

  const todayStr = getTodayWITA();
  const notFitBecameFitList = (validations || []).filter((v) => {
    const tanggalMatch = (v.tanggal || (v.created_at || "").slice(0, 10)) === todayStr;
    const wasNotFit = (v.initial_status_fatigue || "").toLowerCase().includes("not fit");
    const nowFit = (v.status_fatigue || "").toLowerCase().includes("fit to work");
    const isClosed = (v.workflow_status || "") === "Closed";
    return tanggalMatch && wasNotFit && nowFit && isClosed;
  });

  // Render form popup
  if (currentPage === "form" && selectedValidation) {
    return (
      <div
        style={{
          width: "100%",
          maxWidth: "100vw",
          minHeight: "100vh",
          background: isMobile ? "#f8fafc" : "transparent",
          padding: isMobile ? "0" : "0 80px 0 24px",
          overflowY: "auto",
          overflowX: "hidden",
          paddingBottom: 80,
          paddingTop: isMobile ? 74 : 0,
          boxSizing: "border-box",
        }}
      >
        {isMobile && (
          <div
            style={{
              position: "fixed",
              top: 60,
              left: 0,
              right: 0,
              zIndex: 150,
              background: "#f8fafc",
              padding: "8px 20px 10px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "4px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <button
                onClick={() => {
                  setActiveTab("action");
                  handleBackToList();
                }}
                style={{
                  flex: 1,
                  padding: "12px 8px",
                  border: "none",
                  borderRadius: "8px",
                  background: activeTab === "action" ? "#3b82f6" : "transparent",
                  color: activeTab === "action" ? "white" : "#6b7280",
                  fontWeight: activeTab === "action" ? 600 : 500,
                  fontSize: "11px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span style={{ fontSize: "20px" }}>⏳</span>
                <span>Action</span>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>{pendingList.length}</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab("changes");
                  handleBackToList();
                }}
                style={{
                  flex: 1,
                  padding: "12px 8px",
                  border: "none",
                  borderRadius: "8px",
                  background: activeTab === "changes" ? "#3b82f6" : "transparent",
                  color: activeTab === "changes" ? "white" : "#6b7280",
                  fontWeight: activeTab === "changes" ? 600 : 500,
                  fontSize: "11px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span style={{ fontSize: "20px" }}>✅</span>
                <span>Changes</span>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>{notFitBecameFitList.length}</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab("outstanding");
                  handleBackToList();
                }}
                style={{
                  flex: 1,
                  padding: "12px 8px",
                  border: "none",
                  borderRadius: "8px",
                  background: activeTab === "outstanding" ? "#3b82f6" : "transparent",
                  color: activeTab === "outstanding" ? "white" : "#6b7280",
                  fontWeight: activeTab === "outstanding" ? 600 : 500,
                  fontSize: "11px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span style={{ fontSize: "20px" }}>📋</span>
                <span>Outstanding</span>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>{usersNotFilled.length}</span>
              </button>
              {canReviseOff && (
                <button
                  onClick={() => {
                    setActiveTab("absent");
                    handleBackToList();
                  }}
                  style={{
                    flex: 1,
                    padding: "12px 8px",
                    border: "none",
                    borderRadius: "8px",
                    background: activeTab === "absent" ? "#3b82f6" : "transparent",
                    color: activeTab === "absent" ? "white" : "#6b7280",
                    fontWeight: activeTab === "absent" ? 600 : 500,
                    fontSize: "11px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span style={{ fontSize: "20px" }}>📴</span>
                  <span>Absent</span>
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>{usersMarkedOff.length}</span>
                </button>
              )}
            </div>
          </div>
        )}
        <FitToWorkValidationFormNew
          validation={selectedValidation}
          user={user}
          onUpdate={onUpdate}
          onClose={handleBackToList}
          onBack={handleBackToList}
          isMobile={isMobile}
          tasklistTodoCount={tasklistTodoCount}
        />
      </div>
    );
  }

  const renderValidationCard = (validation, index) => (
    <div
      key={validation.id || index}
      style={{
        background: isMobile ? "white" : "#1f2937",
        border: isMobile ? "1px solid #e5e7eb" : "1px solid #374151",
        borderRadius: "12px",
        padding: isMobile ? "16px" : "20px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        position: "relative",
        boxShadow: isMobile ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 25px rgba(0, 0, 0, 0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
      onClick={() => handleValidationClick(validation)}
    >
      {/* Header Row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div>
            <h3
              style={{
                margin: 0,
                color: isMobile ? "#1f2937" : "#e5e7eb",
                fontSize: "18px",
                fontWeight: "600",
                marginBottom: "4px",
              }}
            >
              {validation.nama}
            </h3>
            <p
              style={{
                margin: 0,
                color: isMobile ? "#6b7280" : "#9ca3af",
                fontSize: "14px",
              }}
            >
              {validation.jabatan}
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ color: "#9ca3af", fontSize: "12px" }}>NRP: {validation.nrp}</div>
            <div style={{ color: "#9ca3af", fontSize: "12px" }}>Site: {validation.site}</div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 12px",
            backgroundColor: getStatusColor(validation.workflow_status) + "20",
            borderRadius: "20px",
            border: `1px solid ${getStatusColor(validation.workflow_status)}`,
          }}
        >
          <span style={{ fontSize: "14px" }}>{getStatusIcon(validation.workflow_status)}</span>
          <span
            style={{
              color: getStatusColor(validation.workflow_status),
              fontSize: "12px",
              fontWeight: "600",
            }}
          >
            {validation.workflow_status}
          </span>
        </div>
      </div>
      {/* Progress Bar */}
      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            width: "100%",
            height: "6px",
            backgroundColor: "#374151",
            borderRadius: "3px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${getProgressPercentage(validation.workflow_status)}%`,
              height: "100%",
              backgroundColor: getStatusColor(validation.workflow_status),
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>
      {/* Penyebab Not Fit To Work - dari data form */}
      {(validation.initial_status_fatigue || validation.status_fatigue || "").toLowerCase().includes("not fit") && (
        <div
          style={{
            marginBottom: "12px",
            padding: "12px",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            borderRadius: "8px",
            border: "1px solid rgba(239, 68, 68, 0.3)",
          }}
        >
          <div style={{ color: "#9ca3af", fontSize: "11px", fontWeight: "600", marginBottom: "4px" }}>
            Penyebab Not Fit To Work
          </div>
          <div style={{ color: isMobile ? "#374151" : "#e5e7eb", fontSize: "13px" }}>
            {getPenyebabNotFit(validation)}
          </div>
        </div>
      )}
      {/* Details Row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: "24px" }}>
          <div>
            <label style={{ color: "#9ca3af", fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "4px" }}>Status Fatigue</label>
            <div
              style={{
                color: (validation.status_fatigue || validation.fatigue_status) === "Not Fit To Work" ? "#ef4444" : "#10b981",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              {validation.status_fatigue || validation.fatigue_status}
            </div>
          </div>
          <div>
            <label style={{ color: "#9ca3af", fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "4px" }}>Tanggal</label>
            <div style={{ color: "#e5e7eb", fontSize: "14px" }}>{formatDate(validation.created_at)}</div>
          </div>
        </div>
        <div style={{ color: "#9ca3af", fontSize: "12px", opacity: 0.7, display: "flex", alignItems: "center", gap: "4px" }}>
          Klik untuk detail →
        </div>
      </div>
    </div>
  );

  // Render list view
  return (
    <div
      style={{
        width: "100%",
        height: isMobile ? "auto" : "100vh",
        background: "transparent",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "flex-start",
        padding: isMobile ? "0" : "0 80px 0 24px",
        overflow: isMobile ? "visible" : "hidden",
      }}
    >
      <div
        style={{
          background: "transparent",
          borderRadius: 18,
          boxShadow: "none",
          padding: isMobile ? "0" : "24px 16px",
          maxWidth: 900,
          width: "100%",
          margin: "0 auto",
          flex: isMobile ? "none" : 1,
          display: "flex",
          flexDirection: "column",
          minHeight: isMobile ? "auto" : 0,
        }}
      >
        {!isMobile && (
          <div
            style={{
              flexShrink: 0,
              background: "transparent",
              border: "none",
              borderRadius: 18,
              padding: "24px 0",
              marginBottom: 20,
              textAlign: "center",
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
              Validasi Fit To Work
            </h2>
          </div>
        )}

        {/* Tab Navigation - Action | Changes | Outstanding | Absent (sticky di mobile) */}
        <div
          style={{
            display: "flex",
            flexShrink: 0,
            backgroundColor: isMobile ? "white" : "#1f2937",
            borderRadius: "12px",
            padding: "4px",
            marginBottom: "20px",
            boxShadow: isMobile ? "0 1px 3px rgba(0,0,0,0.1)" : "0 1px 3px rgba(0,0,0,0.3)",
            ...(isMobile && {
              position: "sticky",
              top: 60,
              zIndex: 100,
            }),
          }}
        >
          {/* Mobile: Icon atas, Text tengah, Jumlah bawah */}
          {isMobile ? (
            <>
              <button
                onClick={() => setActiveTab("action")}
                style={{
                  flex: 1,
                  padding: "12px 8px",
                  border: "none",
                  borderRadius: "8px",
                  background: activeTab === "action" ? "#3b82f6" : "transparent",
                  color: activeTab === "action" ? "white" : "#6b7280",
                  fontWeight: activeTab === "action" ? 600 : 500,
                  fontSize: "11px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span style={{ fontSize: "20px" }}>⏳</span>
                <span>Action</span>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>{pendingList.length}</span>
              </button>
              <button
                onClick={() => setActiveTab("changes")}
                style={{
                  flex: 1,
                  padding: "12px 8px",
                  border: "none",
                  borderRadius: "8px",
                  background: activeTab === "changes" ? "#3b82f6" : "transparent",
                  color: activeTab === "changes" ? "white" : "#6b7280",
                  fontWeight: activeTab === "changes" ? 600 : 500,
                  fontSize: "11px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span style={{ fontSize: "20px" }}>✅</span>
                <span>Changes</span>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>{notFitBecameFitList.length}</span>
              </button>
              <button
                onClick={() => setActiveTab("outstanding")}
                style={{
                  flex: 1,
                  padding: "12px 8px",
                  border: "none",
                  borderRadius: "8px",
                  background: activeTab === "outstanding" ? "#3b82f6" : "transparent",
                  color: activeTab === "outstanding" ? "white" : "#6b7280",
                  fontWeight: activeTab === "outstanding" ? 600 : 500,
                  fontSize: "11px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span style={{ fontSize: "20px" }}>📋</span>
                <span>Outstanding</span>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>{usersNotFilled.length}</span>
              </button>
              {canReviseOff && (
                <button
                  onClick={() => setActiveTab("absent")}
                  style={{
                    flex: 1,
                    padding: "12px 8px",
                    border: "none",
                    borderRadius: "8px",
                    background: activeTab === "absent" ? "#3b82f6" : "transparent",
                    color: activeTab === "absent" ? "white" : "#6b7280",
                    fontWeight: activeTab === "absent" ? 600 : 500,
                    fontSize: "11px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span style={{ fontSize: "20px" }}>📴</span>
                  <span>Absent</span>
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>{usersMarkedOff.length}</span>
                </button>
              )}
            </>
          ) : (
            /* Desktop: horizontal layout */
            <>
              <button
                onClick={() => setActiveTab("action")}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  border: "none",
                  borderRadius: "8px",
                  background: activeTab === "action" ? "#3b82f6" : "transparent",
                  color: activeTab === "action" ? "white" : "#9ca3af",
                  fontWeight: activeTab === "action" ? 600 : 500,
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                ⏳ Action ({pendingList.length})
              </button>
              <button
                onClick={() => setActiveTab("changes")}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  border: "none",
                  borderRadius: "8px",
                  background: activeTab === "changes" ? "#3b82f6" : "transparent",
                  color: activeTab === "changes" ? "white" : "#9ca3af",
                  fontWeight: activeTab === "changes" ? 600 : 500,
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                ✅ Changes ({notFitBecameFitList.length})
              </button>
              <button
                onClick={() => setActiveTab("outstanding")}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  border: "none",
                  borderRadius: "8px",
                  background: activeTab === "outstanding" ? "#3b82f6" : "transparent",
                  color: activeTab === "outstanding" ? "white" : "#9ca3af",
                  fontWeight: activeTab === "outstanding" ? 600 : 500,
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                📋 Outstanding ({usersNotFilled.length})
              </button>
              {canReviseOff && (
                <button
                  onClick={() => setActiveTab("absent")}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    border: "none",
                    borderRadius: "8px",
                    background: activeTab === "absent" ? "#3b82f6" : "transparent",
                    color: activeTab === "absent" ? "white" : "#9ca3af",
                    fontWeight: activeTab === "absent" ? 600 : 500,
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  📴 Absent ({usersMarkedOff.length})
                </button>
              )}
            </>
          )}
        </div>

        {/* Content container - scrollable di desktop, full scroll di mobile */}
        <div
          style={{
            flex: isMobile ? "none" : 1,
            minHeight: isMobile ? "auto" : 0,
            overflowY: isMobile ? "visible" : "auto",
            overflowX: "hidden",
            WebkitOverflowScrolling: "touch",
          }}
        >
        {/* Section: Action - Perlu Tindakan (Pending) */}
        {activeTab === "action" && (
          <div style={{ marginBottom: "32px" }}>
            <h3
              style={{
                margin: "0 0 12px 0",
                color: isMobile ? "#1f2937" : "#e5e7eb",
                fontSize: "16px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ color: "#ff9800" }}>⏳</span> Perlu Tindakan ({pendingList.length})
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {pendingList.length > 0 ? (
                pendingList.map((validation, index) => renderValidationCard(validation, index))
              ) : (
                <div
                  style={{
                    padding: "20px",
                    backgroundColor: isMobile ? "#f3f4f6" : "#1f2937",
                    borderRadius: "12px",
                    border: isMobile ? "1px dashed #9ca3af" : "1px dashed #374151",
                    color: isMobile ? "#374151" : "#d1d5db",
                    fontSize: "14px",
                    textAlign: "center",
                    fontWeight: "500",
                  }}
                >
                  Tidak ada validasi yang perlu ditindaklanjuti
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section: Changes - Not Fit To Work → Fit To Work (hari ini, sudah divalidasi) */}
        {activeTab === "changes" && (
          <div style={{ marginBottom: "32px" }}>
            <h3
              style={{
                margin: "0 0 12px 0",
                color: isMobile ? "#1f2937" : "#e5e7eb",
                fontSize: "16px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ color: "#10b981" }}>✅</span> Not Fit To Work → Fit To Work Hari Ini ({notFitBecameFitList.length})
            </h3>
            <p
              style={{
                margin: "0 0 12px 0",
                color: isMobile ? "#4b5563" : "#9ca3af",
                fontSize: "13px",
                fontWeight: "500",
              }}
            >
              Karyawan yang awalnya Not Fit To Work pada hari ini dan telah divalidasi menjadi Fit To Work.
            </p>
            {notFitBecameFitList.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {notFitBecameFitList.map((v) => (
                <div
                  key={v.id}
                  style={{
                    background: isMobile ? "white" : "#1f2937",
                    border: isMobile ? "1px solid #e5e7eb" : "1px solid #374151",
                    borderRadius: "12px",
                    padding: isMobile ? "16px" : "20px",
                    boxShadow: isMobile ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <div style={{ color: isMobile ? "#1f2937" : "#e5e7eb", fontSize: "16px", fontWeight: "600", marginBottom: "4px" }}>
                        {v.nama}
                      </div>
                      <div style={{ color: isMobile ? "#6b7280" : "#9ca3af", fontSize: "14px" }}>
                        {v.jabatan} • NRP: {v.nrp} • {v.site}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      marginBottom: "12px",
                      padding: "12px",
                      backgroundColor: "rgba(239, 68, 68, 0.08)",
                      borderRadius: "8px",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                    }}
                  >
                    <div style={{ color: "#9ca3af", fontWeight: "600", marginBottom: "4px", fontSize: "12px" }}>
                      Penyebab Not Fit To Work
                    </div>
                    <div style={{ color: isMobile ? "#374151" : "#e5e7eb", fontSize: "13px" }}>
                      {getPenyebabNotFit(v)}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px", fontSize: "13px" }}>
                    <div>
                      <div style={{ color: "#9ca3af", fontWeight: "600", marginBottom: "4px" }}>Catatan Tahap 1</div>
                      <div style={{ color: isMobile ? "#374151" : "#e5e7eb" }}>{v.catatan_tahap1 || "—"}</div>
                    </div>
                    <div>
                      <div style={{ color: "#9ca3af", fontWeight: "600", marginBottom: "4px" }}>Catatan Tahap 2</div>
                      <div style={{ color: isMobile ? "#374151" : "#e5e7eb" }}>{v.catatan_tahap2 || "—"}</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginTop: "12px", paddingTop: "12px", borderTop: isMobile ? "1px solid #e5e7eb" : "1px solid #374151", fontSize: "12px" }}>
                    <div>
                      <div style={{ color: "#9ca3af", marginBottom: "2px" }}>Jam Pembuatan</div>
                      <div style={{ color: isMobile ? "#374151" : "#e5e7eb", fontWeight: "500" }}>{formatTime(v.created_at)}</div>
                    </div>
                    <div>
                      <div style={{ color: "#9ca3af", marginBottom: "2px" }}>Jam Validasi Tahap 1</div>
                      <div style={{ color: isMobile ? "#374151" : "#e5e7eb", fontWeight: "500" }}>{formatTime(v.reviewed_tahap1_at)}</div>
                    </div>
                    <div>
                      <div style={{ color: "#9ca3af", marginBottom: "2px" }}>Jam Validasi Tahap 2</div>
                      <div style={{ color: isMobile ? "#374151" : "#e5e7eb", fontWeight: "500" }}>{formatTime(v.reviewed_tahap2_at)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: "20px",
                backgroundColor: isMobile ? "#f3f4f6" : "#1f2937",
                borderRadius: "12px",
                border: isMobile ? "1px dashed #9ca3af" : "1px dashed #374151",
                color: isMobile ? "#374151" : "#d1d5db",
                fontSize: "14px",
                textAlign: "center",
                fontWeight: "500",
              }}
            >
              Tidak ada data. Karyawan yang awalnya Not Fit To Work dan sudah divalidasi menjadi Fit To Work akan muncul di sini.
            </div>
          )}
          </div>
        )}

        {/* Section: Outstanding - Belum Isi Fit To Work Hari Ini */}
        {activeTab === "outstanding" && (
        <div>
          <h3
            style={{
              margin: "0 0 12px 0",
              color: isMobile ? "#1f2937" : "#e5e7eb",
              fontSize: "16px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ color: "#f59e0b" }}>📋</span> Belum Isi Fit To Work Hari Ini ({usersNotFilled.length})
          </h3>
          <p
            style={{
              margin: "0 0 12px 0",
              color: isMobile ? "#4b5563" : "#9ca3af",
              fontSize: "13px",
              fontWeight: "500",
            }}
          >
            Karyawan yang wajib mengisi Fit To Work. Tandai Off jika tidak hadir.
          </p>
          {usersNotFilled.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {usersNotFilled.map((u) => (
                <div
                  key={u.id}
                  style={{
                    background: isMobile ? "white" : "#1f2937",
                    border: isMobile ? "1px solid #e5e7eb" : "1px solid #374151",
                    borderRadius: "12px",
                    padding: isMobile ? "16px" : "20px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "12px",
                    boxShadow: isMobile ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  <div>
                    <div
                      style={{
                        color: isMobile ? "#1f2937" : "#e5e7eb",
                        fontSize: "16px",
                        fontWeight: "600",
                        marginBottom: "4px",
                      }}
                    >
                      {u.nama}
                    </div>
                    <div
                      style={{
                        color: isMobile ? "#6b7280" : "#9ca3af",
                        fontSize: "14px",
                      }}
                    >
                      {u.jabatan} • NRP: {u.nrp} • {u.site}
                    </div>
                  </div>
                  {canMarkUserOff && (
                    <button
                      type="button"
                      onClick={() => setConfirmOffUser({ user: u, action: "off" })}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        border: "1px solid #f59e0b",
                        background: "#f59e0b20",
                        color: "#f59e0b",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Tandai Off / Tidak Hadir
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: "20px",
                backgroundColor: isMobile ? "#f3f4f6" : "#1f2937",
                borderRadius: "12px",
                border: isMobile ? "1px dashed #9ca3af" : "1px dashed #374151",
                color: isMobile ? "#374151" : "#d1d5db",
                fontSize: "14px",
                textAlign: "center",
                fontWeight: "500",
              }}
            >
              Semua karyawan sudah mengisi Fit To Work atau telah ditandai off hari ini
            </div>
          )}
        </div>
        )}

        {/* Section: Absent - Sudah Ditandai Off Hari Ini (hanya PJO, Asst PJO, SHERQ) */}
        {canReviseOff && activeTab === "absent" && (
          <div>
            <h3
              style={{
                margin: "24px 0 12px 0",
                color: isMobile ? "#1f2937" : "#e5e7eb",
                fontSize: "16px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ color: "#6b7280" }}>📴</span> Absent – Sudah Ditandai Off Hari Ini ({usersMarkedOff.length})
            </h3>
            <p
              style={{
                margin: "0 0 12px 0",
                color: isMobile ? "#4b5563" : "#9ca3af",
                fontSize: "13px",
                fontWeight: "500",
              }}
            >
              Karyawan yang sudah ditandai tidak hadir. Klik Tandai On / Hadir untuk merevisi jika salah tandai.
            </p>
            {usersMarkedOff.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {usersMarkedOff.map((u) => (
                  <div
                    key={u.id}
                    style={{
                      background: isMobile ? "white" : "#1f2937",
                      border: isMobile ? "1px solid #e5e7eb" : "1px solid #374151",
                      borderRadius: "12px",
                      padding: isMobile ? "16px" : "20px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: "12px",
                      boxShadow: isMobile ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color: isMobile ? "#1f2937" : "#e5e7eb",
                          fontSize: "16px",
                          fontWeight: "600",
                          marginBottom: "4px",
                        }}
                      >
                        {u.nama}
                      </div>
                      <div
                        style={{
                          color: isMobile ? "#6b7280" : "#9ca3af",
                          fontSize: "14px",
                        }}
                      >
                        {u.jabatan} • NRP: {u.nrp} • {u.site}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfirmOffUser({ user: u, action: "on" })}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        border: "1px solid #10b981",
                        background: "#10b98120",
                        color: "#10b981",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Tandai On / Hadir
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: "20px",
                  backgroundColor: isMobile ? "#f3f4f6" : "#1f2937",
                  borderRadius: "12px",
                  border: isMobile ? "1px dashed #9ca3af" : "1px dashed #374151",
                  color: isMobile ? "#374151" : "#d1d5db",
                  fontSize: "14px",
                  textAlign: "center",
                  fontWeight: "500",
                }}
            >
              Tidak ada karyawan yang ditandai off hari ini
            </div>
            )}
          </div>
        )}

        </div>
        {/* End content container */}

        {/* Popup Konfirmasi Off/On User */}
        {confirmOffUser && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "16px",
            }}
            onClick={() => setConfirmOffUser(null)}
          >
            <div
              style={{
                background: isMobile ? "#fff" : "#1f2937",
                borderRadius: "12px",
                padding: "24px",
                maxWidth: "400px",
                width: "100%",
                border: isMobile ? "none" : "1px solid #374151",
                boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3
                style={{
                  margin: "0 0 12px 0",
                  color: isMobile ? "#1f2937" : "#e5e7eb",
                  fontSize: "18px",
                  fontWeight: "600",
                }}
              >
                Konfirmasi
              </h3>
              <p
                style={{
                  margin: "0 0 20px 0",
                  color: isMobile ? "#4b5563" : "#9ca3af",
                  fontSize: "14px",
                  lineHeight: 1.5,
                }}
              >
                {confirmOffUser.action === "off"
                  ? `Apakah Anda yakin akan menandai ${confirmOffUser.user.nama} (${confirmOffUser.user.nrp}) sebagai tidak hadir (off) hari ini?`
                  : `Apakah Anda yakin akan menandai ${confirmOffUser.user.nama} (${confirmOffUser.user.nrp}) sebagai hadir (on)?`}
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={() => setConfirmOffUser(null)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "1px solid #6b7280",
                    background: "transparent",
                    color: isMobile ? "#374151" : "#9ca3af",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirmOffUser.action === "off") {
                      onMarkUserOff?.(confirmOffUser.user);
                    } else {
                      onUnmarkUserOff?.(confirmOffUser.user);
                    }
                    setConfirmOffUser(null);
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "none",
                    background: confirmOffUser.action === "off" ? "#f59e0b" : "#10b981",
                    color: "#fff",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Ya, Konfirmasi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FitToWorkValidationListNew;
