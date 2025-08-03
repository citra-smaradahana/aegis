import React from "react";

function FitToWorkValidationListNew({
  validations,
  onValidationSelect,
  filterStatus,
  onFilterChange,
  onBack,
}) {
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

  console.log(
    "FitToWorkValidationListNew - Rendering with validations:",
    validations
  );
  console.log("FitToWorkValidationListNew - filterStatus:", filterStatus);

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ position: "relative", marginBottom: "20px" }}>
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            style={{
              position: "absolute",
              left: "0px",
              top: "0px",
              background: "none",
              border: "none",
              color: "#3b82f6",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "8px",
              zIndex: 20,
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        )}
        <h2
          style={{ marginBottom: "20px", color: "#333", textAlign: "center" }}
        >
          Validasi Fit To Work
        </h2>
      </div>

      {/* Filter and Counter */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <label style={{ fontWeight: "bold", color: "#555" }}>
            Filter Status:
          </label>
          <select
            value={filterStatus}
            onChange={(e) => onFilterChange(e.target.value)}
            style={{
              padding: "8px 12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              backgroundColor: "white",
              fontSize: "14px",
            }}
          >
            <option value="all">Semua Status</option>
            <option value="Pending">Pending</option>
            <option value="Level1_Review">Level 1 Review</option>
            <option value="Level2_Review">Level 2 Review</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        <div
          style={{
            fontWeight: "bold",
            color: "#666",
            fontSize: "14px",
          }}
        >
          {validations.length} validasi ditemukan
        </div>
      </div>

      {/* Validations List */}
      {validations.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "#666",
            backgroundColor: "#f9f9f9",
            borderRadius: "8px",
            border: "1px solid #eee",
          }}
        >
          <div style={{ fontSize: "18px", marginBottom: "10px" }}>📋</div>
          <div>Tidak ada validasi yang perlu ditangani</div>
          <div style={{ fontSize: "12px", marginTop: "5px" }}>
            Semua data Fit To Work sudah diproses
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {validations.map((validation) => (
            <div
              key={validation.id}
              onClick={() => onValidationSelect(validation)}
              style={{
                backgroundColor: "white",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                padding: "20px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "15px",
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: "0 0 5px 0",
                      color: "#333",
                      fontSize: "18px",
                    }}
                  >
                    {validation.nama}
                  </h3>
                  <div
                    style={{
                      color: "#666",
                      fontSize: "14px",
                      marginBottom: "5px",
                    }}
                  >
                    NRP: {validation.nrp} | Jabatan: {validation.jabatan} |
                    Site: {validation.site}
                  </div>
                  <div
                    style={{
                      color: "#888",
                      fontSize: "12px",
                    }}
                  >
                    Dibuat: {formatDate(validation.created_at)}
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: getStatusColor(validation.workflow_status),
                    color: "white",
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <span>{getStatusIcon(validation.workflow_status)}</span>
                  {validation.workflow_status.replace("_", " ")}
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ marginBottom: "15px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "5px",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "#666" }}>
                    Progress Validasi
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      fontWeight: "bold",
                    }}
                  >
                    {getProgressPercentage(validation.workflow_status)}%
                  </span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "6px",
                    backgroundColor: "#e0e0e0",
                    borderRadius: "3px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${getProgressPercentage(
                        validation.workflow_status
                      )}%`,
                      height: "100%",
                      backgroundColor: getStatusColor(
                        validation.workflow_status
                      ),
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>

              {/* Reviewer Info */}
              {validation.reviewer_tahap1_nama && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "#666",
                    marginBottom: "5px",
                  }}
                >
                  <strong>Tahap 1:</strong> {validation.reviewer_tahap1_nama} (
                  {validation.reviewer_tahap1_jabatan})
                  {validation.reviewed_tahap1_at && (
                    <span> - {formatDate(validation.reviewed_tahap1_at)}</span>
                  )}
                </div>
              )}

              {validation.reviewer_tahap2_nama && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "#666",
                  }}
                >
                  <strong>Tahap 2:</strong> {validation.reviewer_tahap2_nama} (
                  {validation.reviewer_tahap2_jabatan})
                  {validation.reviewed_tahap2_at && (
                    <span> - {formatDate(validation.reviewed_tahap2_at)}</span>
                  )}
                </div>
              )}

              {/* Click hint */}
              <div
                style={{
                  fontSize: "11px",
                  color: "#999",
                  textAlign: "center",
                  marginTop: "10px",
                  paddingTop: "10px",
                  borderTop: "1px solid #f0f0f0",
                }}
              >
                Klik untuk melihat detail dan melakukan validasi
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FitToWorkValidationListNew;
