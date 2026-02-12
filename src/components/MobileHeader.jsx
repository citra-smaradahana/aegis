import React from "react";

function MobileHeader({ user, onBack, title, showBack = true }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 60,
        background: "#ea580c",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        zIndex: 1001,
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {showBack && onBack && (
          <button
            onClick={onBack}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
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
        <h1
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          {title}
        </h1>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {user?.nama ? user.nama.charAt(0).toUpperCase() : "U"}
        </div>
      </div>
    </div>
  );
}

export default MobileHeader;














