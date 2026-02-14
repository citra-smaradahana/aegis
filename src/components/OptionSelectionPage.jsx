import React from "react";
import MobileBackGesture from "./MobileBackGesture";

/**
 * Full-page option selector - sama style dengan SiteSelectionPage (Pilih Lokasi)
 * Untuk Hazard Report mobile & PTO mobile - Site, Detail Lokasi, Alasan Observasi, Prosedur
 */
const OptionSelectionPage = ({
  title,
  options = [],
  selectedValue,
  onSelect,
  onBack,
  confirmButtonText = "Pilih",
}) => {
  const handleSelect = (value) => {
    onSelect(value);
  };

  return (
    <MobileBackGesture onBack={onBack}>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#f8f9fa",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header - biru seperti Pilih Lokasi */}
        <div
          style={{
            backgroundColor: "#1e40af",
            color: "white",
            padding: "16px",
            textAlign: "center",
            position: "sticky",
            top: 0,
            zIndex: 1001,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <button
              onClick={onBack}
              style={{
                background: "none",
                border: "none",
                color: "white",
                fontSize: "20px",
                cursor: "pointer",
                padding: "4px",
              }}
              className="back-button-no-hover"
            >
              ←
            </button>
            <h2 style={{ margin: 0, flex: 1 }}>{title}</h2>
            <div style={{ width: "20px" }}></div>
          </div>
        </div>

        {/* Option List */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px",
          }}
        >
          <div
            style={{
              display: "grid",
              gap: "12px",
            }}
          >
            {options.map((opt) => (
              <div
                key={opt}
                onClick={() => handleSelect(opt)}
                className="clickable"
                style={{
                  backgroundColor: "#ffffff",
                  padding: "16px",
                  borderRadius: "12px",
                  border:
                    selectedValue === opt
                      ? "2px solid #3b82f6"
                      : "1px solid #e5e7eb",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow:
                    selectedValue === opt
                      ? "0 4px 12px rgba(59, 130, 246, 0.15)"
                      : "0 1px 3px rgba(0, 0, 0, 0.1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    selectedValue === opt
                      ? "0 4px 12px rgba(59, 130, 246, 0.15)"
                      : "0 1px 3px rgba(0, 0, 0, 0.1)";
                }}
              >
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: "500",
                    color: "#1f2937",
                  }}
                >
                  {opt}
                </span>
                {selectedValue === opt && (
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      backgroundColor: "#3b82f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: "#ffffff",
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "16px",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <button
            onClick={() => selectedValue && handleSelect(selectedValue)}
            disabled={!selectedValue}
            className="clickable"
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: selectedValue ? "#3b82f6" : "#9ca3af",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: selectedValue ? "pointer" : "not-allowed",
              transition: "background-color 0.2s ease",
            }}
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </MobileBackGesture>
  );
};

export default OptionSelectionPage;
