import React from "react";

function PTOFormMobile({ user, onBack }) {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#f3f4f6",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          padding: 24,
          borderRadius: 16,
          textAlign: "center",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h2 style={{ marginBottom: 16, color: "#1f2937" }}>
          Planned Task Observation (PTO)
        </h2>
        <p style={{ marginBottom: 24, color: "#6b7280" }}>
          Versi mobile sedang dalam pengembangan.
        </p>
        <button
          onClick={onBack}
          style={{
            padding: "12px 24px",
            backgroundColor: "#60a5fa",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Kembali
        </button>
      </div>
    </div>
  );
}

export default PTOFormMobile;
