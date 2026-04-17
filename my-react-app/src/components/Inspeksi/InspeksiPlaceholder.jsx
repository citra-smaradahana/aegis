import React from "react";
import MobileHeader from "../MobileHeader";

const InspeksiPlaceholder = ({ user, onBack, title }) => {
  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#f8fafc" }}>
      <MobileHeader user={user} onBack={onBack} title={title} />
      <div style={{ padding: 20, paddingTop: 100, textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🚧</div>
        <h2 style={{ color: "#1e293b", marginBottom: 10 }}>{title}</h2>
        <p style={{ color: "#64748b", lineHeight: 1.5 }}>
          Maaf, fitur <strong>{title}</strong> saat ini belum tersedia.<br />
          Tim pengembang sedang mempersiapkan modul ini untuk Anda.
        </p>
        <button 
          onClick={onBack}
          style={{ 
            marginTop: 30, 
            padding: "12px 24px", 
            borderRadius: 10, 
            background: "#6366f1", 
            color: "white", 
            border: "none", 
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Kembali ke Menu
        </button>
      </div>
    </div>
  );
};

export default InspeksiPlaceholder;
