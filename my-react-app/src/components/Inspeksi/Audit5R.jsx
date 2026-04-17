import React from "react";
import MobileHeader from "../MobileHeader";

const Audit5R = ({ user, onBack }) => {
  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#f8fafc" }}>
      <MobileHeader user={user} onBack={onBack} title="Audit 5R" />
      <div style={{ padding: 20, paddingTop: 100, textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>📋</div>
        <h2 style={{ color: "#1e293b", marginBottom: 10 }}>Audit 5R</h2>
        <p style={{ color: "#64748b", lineHeight: 1.5 }}>
          Halaman Audit 5R sedang dalam pengembangan.<br />
          Modul ini akan digunakan untuk evaluasi mendalam kepatuhan 5S di area kerja.
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

export default Audit5R;
