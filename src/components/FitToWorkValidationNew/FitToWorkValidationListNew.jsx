import React, { useState } from "react";
import FitToWorkValidationFormNew from "./FitToWorkValidationFormNew";

function FitToWorkValidationListNew({
  validations,
  usersNotFilled = [],
  usersMarkedOff = [],
  onValidationSelect,
  onMarkUserOff,
  onUnmarkUserOff,
  canReviseOff = false,
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
          boxSizing: "border-box",
        }}
      >
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

  // Pisahkan Pending (perlu tindakan) - Selesai diganti dengan Belum Isi FTW (usersNotFilled)
  const pendingStatuses = ["Pending", "Level1_Review", "Level1 Review", "Level2_Review"];
  const pendingList = (validations || []).filter((v) =>
    pendingStatuses.includes(v.workflow_status)
  );

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
        alignItems: "flex-start",
        justifyContent: "center",
        padding: isMobile ? "0" : "0 80px 0 24px",
        overflow: isMobile ? "visible" : "auto",
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
          height: isMobile ? "auto" : "auto",
          minHeight: isMobile ? "auto" : "calc(100vh - 100px)",
        }}
      >
        {!isMobile && (
          <div
            style={{
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

        {/* Filter Section - center */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginBottom: "28px",
            marginTop: isMobile ? "16px" : 0,
            flexWrap: "wrap",
            justifyContent: "center",
            padding: isMobile ? "0 0 16px 0" : "0",
          }}
        >
          <select
            value={filterStatus}
            onChange={(e) => onFilterChange(e.target.value)}
            style={{
              padding: "8px 12px",
              border: isMobile ? "1px solid #d1d5db" : "1px solid #374151",
              borderRadius: "6px",
              backgroundColor: isMobile ? "white" : "#1f2937",
              color: isMobile ? "#374151" : "#e5e7eb",
              fontSize: "14px",
              outline: "none",
              width: isMobile ? "100%" : "auto",
            }}
          >
            <option value="all">Semua Status</option>
            <option value="Pending">Pending</option>
            <option value="Level1_Review">Level 1 Review</option>
            <option value="Level2_Review">Level 2 Review</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        {/* Section: Perlu Tindakan (Pending) */}
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

        {/* Section: Belum Isi Fit To Work Hari Ini (karyawan yang belum isi FTW / belum di-off) */}
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

        {/* Section: Sudah Ditandai Off Hari Ini (hanya PJO, Asst PJO, SHERQ - untuk revisi) */}
        {canReviseOff && (
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
              <span style={{ color: "#6b7280" }}>📴</span> Sudah Ditandai Off Hari Ini ({usersMarkedOff.length})
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

        {/* Empty placeholder when no pending, no users not filled, and no users marked off (when can revise) */}
        {validations && validations.length === 0 && (!usersNotFilled || usersNotFilled.length === 0) && (!canReviseOff || !usersMarkedOff || usersMarkedOff.length === 0) && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "300px",
              color: "#9ca3af",
              textAlign: "center",
              padding: "40px",
              backgroundColor: "#1f2937",
              borderRadius: "12px",
              border: "2px dashed #374151",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.5 }}>📋</div>
            <h3 style={{ margin: 0, marginBottom: "8px", color: "#e5e7eb", fontSize: "20px", fontWeight: "600" }}>
              Tidak ada validasi
            </h3>
            <p style={{ margin: 0, color: "#9ca3af", fontSize: "14px" }}>
              Semua validasi Fit To Work telah selesai diproses
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default FitToWorkValidationListNew;
