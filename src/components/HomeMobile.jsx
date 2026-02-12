import React from "react";
import MobileBottomNavigation from "./MobileBottomNavigation";

function HomeMobile({ user, onNavigate }) {
  const menuItems = [
    {
      key: "fit-to-work",
      label: "Fit To Work",
      icon: "👷",
      color: "#3b82f6",
      description: "Formulir kelayakan kerja",
    },
    {
      key: "fit-to-work-validation",
      label: "Validasi Fit To Work",
      icon: "✅",
      color: "#10b981",
      description: "Validasi kelayakan kerja",
    },
    {
      key: "take-5",
      label: "Take 5",
      icon: "⏰",
      color: "#f59e0b",
      description: "Pemeriksaan 5 menit",
    },
    {
      key: "hazard",
      label: "Hazard Report",
      icon: "⚠️",
      color: "#ef4444",
      description: "Laporan bahaya",
    },
    {
      key: "pto",
      label: "PTO",
      icon: "📋",
      color: "#8b5cf6",
      description: "Planned Task Observation",
    },
  ];

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "#f8fafc",
        paddingBottom: 80, // Space untuk bottom nav
      }}
    >
      {/* Header dengan foto profil */}
      <div
        className="mobile-home-header"
        style={{
          background: "linear-gradient(135deg, #ea580c 0%, #dc2626 100%)",
          padding: "24px 20px",
          color: "white",
          marginBottom: 24,
        }}
      >
        <div
          className="mobile-home-profile"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            maxWidth: 1200,
            margin: "0 auto",
          }}
        >
          {/* Foto Profil */}
          <div
            className="mobile-home-avatar"
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "3px solid rgba(255,255,255,0.3)",
              flexShrink: 0,
            }}
          >
            {(() => {
              const avatarUrl =
                user?.photo_url ||
                user?.avatar_url ||
                user?.foto_url ||
                user?.foto ||
                null;
              const initials = (user?.nama || user?.user || "?")
                .toString()
                .trim()
                .split(" ")
                .map((s) => s[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="avatar"
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: "white",
                  }}
                >
                  {initials}
                </div>
              );
            })()}
          </div>

          {/* Nama dan Jabatan */}
          <div style={{ flex: 1 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              {user?.nama || user?.user || "Pengguna"}
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: 16,
                opacity: 0.9,
                fontWeight: 500,
              }}
            >
              {user?.jabatan || "Karyawan"}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                opacity: 0.8,
                marginTop: 4,
              }}
            >
              Selamat datang di AEGIS KMB
            </p>
          </div>
        </div>
      </div>

      {/* Menu Buttons */}
      <div
        className="mobile-home-menu"
        style={{
          padding: "0 20px",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#1f2937",
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          Menu Utama
        </h2>

        <div
          className="mobile-home-menu-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
            marginBottom: 32,
          }}
        >
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className="mobile-home-menu-item"
              style={{
                background: "white",
                border: "none",
                borderRadius: 16,
                padding: "20px",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                transition: "all 0.3s ease",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 16,
                minHeight: 80,
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
              }}
            >
              <div
                className="mobile-home-menu-icon"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "12px",
                  background: `${item.color}20`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </div>
              <div className="mobile-home-menu-text" style={{ flex: 1 }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#1f2937",
                    marginBottom: 4,
                  }}
                >
                  {item.label}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    color: "#6b7280",
                    lineHeight: 1.4,
                  }}
                >
                  {item.description}
                </p>
              </div>
              <div
                style={{
                  color: item.color,
                  fontSize: 20,
                  opacity: 0.7,
                }}
              >
                →
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <MobileBottomNavigation
        activeTab="home"
        onNavigate={(tab) => {
          if (tab === "home") {
            // Already on home
          } else if (tab === "tasklist") {
            onNavigate("tasklist");
          } else if (tab === "profile") {
            onNavigate("profile");
          }
        }}
      />
    </div>
  );
}

export default HomeMobile;
