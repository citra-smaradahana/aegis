import React, { useState } from "react";
import FitToWorkValidationFormNew from "./FitToWorkValidationFormNew";

function FitToWorkValidationListNew({
  validations,
  onValidationSelect,
  filterStatus,
  onFilterChange,
  onBack,
  user,
  onUpdate,
  isMobile = false,
}) {
  const [selectedValidation, setSelectedValidation] = useState(null);
  const [currentPage, setCurrentPage] = useState("list"); // "list" atau "form"

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
          height: "100vh",
          background: isMobile ? "#f8fafc" : "transparent",
          padding: isMobile ? "0" : "0 0 0 120px",
          overflow: "hidden",
        }}
      >
        <FitToWorkValidationFormNew
          validation={selectedValidation}
          user={user}
          onUpdate={onUpdate}
          onClose={handleBackToList}
          onBack={handleBackToList}
          isMobile={isMobile}
        />
      </div>
    );
  }

  // Render list view
  return (
    <div
      style={{
        width: "100%",
        height: isMobile ? "auto" : "100vh",
        background: isMobile ? "transparent" : "transparent",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: isMobile ? "0" : "0 0 0 120px",
        overflow: isMobile ? "visible" : "hidden",
      }}
    >
      <div
        style={{
          background: "transparent",
          borderRadius: 18,
          boxShadow: "none",
          padding: isMobile ? "0" : 16,
          maxWidth: 1400,
          width: "100%",
          margin: "0 auto",
          height: isMobile ? "auto" : "100vh",
        }}
      >
        {!isMobile && (
          <div
            style={{
              background: "transparent",
              border: "none",
              borderRadius: 18,
              padding: 24,
              marginBottom: 24,
              display: "flex",
              justifyContent: "center",
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
              Validasi Fit To Work
            </h2>
          </div>
        )}

        {/* Filter Section */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginBottom: "24px",
            flexWrap: "wrap",
            justifyContent: isMobile ? "center" : "flex-start",
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

        {/* Content Area */}
        <div
          style={{
            background: "transparent",
            borderRadius: 12,
            padding: 0,
            minHeight: isMobile ? "auto" : "calc(100vh - 200px)",
          }}
        >
          {validations && validations.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {validations.map((validation, index) => (
                <div
                  key={validation.id || index}
                  style={{
                    background: isMobile ? "white" : "#1f2937",
                    border: isMobile
                      ? "1px solid #e5e7eb"
                      : "1px solid #374151",
                    borderRadius: "12px",
                    padding: isMobile ? "16px" : "20px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    position: "relative",
                    boxShadow: isMobile ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 25px rgba(0, 0, 0, 0.3)";
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
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                      }}
                    >
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
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        <div
                          style={{
                            color: isMobile ? "#9ca3af" : "#9ca3af",
                            fontSize: "12px",
                          }}
                        >
                          NRP: {validation.nrp}
                        </div>
                        <div
                          style={{
                            color: isMobile ? "#9ca3af" : "#9ca3af",
                            fontSize: "12px",
                          }}
                        >
                          Site: {validation.site}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "6px 12px",
                        backgroundColor:
                          getStatusColor(validation.workflow_status) + "20",
                        borderRadius: "20px",
                        border: `1px solid ${getStatusColor(validation.workflow_status)}`,
                      }}
                    >
                      <span style={{ fontSize: "14px" }}>
                        {getStatusIcon(validation.workflow_status)}
                      </span>
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
                          backgroundColor: getStatusColor(
                            validation.workflow_status
                          ),
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
                        <label
                          style={{
                            color: "#9ca3af",
                            fontSize: "12px",
                            fontWeight: "600",
                            display: "block",
                            marginBottom: "4px",
                          }}
                        >
                          Status Fatigue
                        </label>
                        <div
                          style={{
                            color:
                              validation.fatigue_status === "Not Fit To Work"
                                ? "#ef4444"
                                : "#10b981",
                            fontSize: "14px",
                            fontWeight: "600",
                          }}
                        >
                          {validation.fatigue_status}
                        </div>
                      </div>
                      <div>
                        <label
                          style={{
                            color: "#9ca3af",
                            fontSize: "12px",
                            fontWeight: "600",
                            display: "block",
                            marginBottom: "4px",
                          }}
                        >
                          Tanggal
                        </label>
                        <div
                          style={{
                            color: "#e5e7eb",
                            fontSize: "14px",
                          }}
                        >
                          {formatDate(validation.created_at)}
                        </div>
                      </div>
                    </div>

                    {/* Click indicator */}
                    <div
                      style={{
                        color: "#9ca3af",
                        fontSize: "12px",
                        opacity: 0.7,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      Klik untuk detail →
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "400px",
                color: "#9ca3af",
                textAlign: "center",
                padding: "40px",
                backgroundColor: "#1f2937",
                borderRadius: "12px",
                border: "2px dashed #374151",
              }}
            >
              <div
                style={{
                  fontSize: "48px",
                  marginBottom: "16px",
                  opacity: 0.5,
                }}
              >
                📋
              </div>
              <h3
                style={{
                  margin: 0,
                  marginBottom: "8px",
                  color: "#e5e7eb",
                  fontSize: "20px",
                  fontWeight: "600",
                }}
              >
                Tidak ada validasi yang perlu ditangani
              </h3>
              <p
                style={{
                  margin: 0,
                  color: "#9ca3af",
                  fontSize: "14px",
                }}
              >
                Semua validasi Fit To Work telah selesai diproses
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FitToWorkValidationListNew;
