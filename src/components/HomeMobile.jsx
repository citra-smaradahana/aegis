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
      {/* Header dengan foto profil - sticky di mobile */}
      <div
        className="mobile-home-header"
        style={{
          position: "sticky",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: "linear-gradient(135deg, #ea580c 0%, #dc2626 100%)",
          padding: "16px 20px",
          color: "white",
          marginBottom: 24,
          boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
        }}
      >
        <div
          className="mobile-home-profile"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            maxWidth: 1200,
            margin: "0 auto",
            minHeight: 56,
          }}
        >
          {/* Foto Profil */}
          <div
            className="mobile-home-avatar"
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid rgba(255,255,255,0.3)",
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
                    fontSize: 20,
                    fontWeight: 700,
                    color: "white",
                  }}
                >
                  {initials}
                </div>
              );
            })()}
          </div>

          {/* Nama dan Jabatan - dibatasi lebar dan baris agar height konsisten */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                marginBottom: 2,
                lineHeight: 1.3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {user?.nama || user?.user || "Pengguna"}
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                opacity: 0.95,
                fontWeight: 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                lineHeight: 1.3,
              }}
            >
              {user?.jabatan || "Karyawan"}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                opacity: 0.85,
                marginTop: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
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
