import React from "react";
import MobileBottomNavigation from "./MobileBottomNavigation";

// Hanya jabatan validator yang boleh melihat menu Validasi Fit To Work (bukan Quality Control, Operator MMU, Crew, Blaster).
function canAccessFitToWorkValidation(user) {
  if (!user) return false;
  if (user?.jabatan === "Administrator" || user?.jabatan === "Admin Site Project") return true;
  const jabatan = (user?.jabatan || "").trim();
  const validatorJabatan = [
    "Field Leading Hand",
    "Plant Leading Hand",
    "Asst. Penanggung Jawab Operasional",
    "Penanggung Jawab Operasional",
    "SHE",
    "SHERQ Officer",
  ];
  return validatorJabatan.includes(jabatan);
}

function HomeMobile({ user, onNavigate, validationCount = 0 }) {
  const allMenuItems = [
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

  const menuItems = allMenuItems.filter(
    (item) =>
      item.key !== "fit-to-work-validation" ||
      canAccessFitToWorkValidation(user)
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        maxHeight: "100dvh",
        background: "#f8fafc",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        paddingBottom: 70, // Space untuk bottom nav
        boxSizing: "border-box",
      }}
    >
      {/* Header dengan foto profil - fixed layout, tidak scroll */}
      <div
        className="mobile-home-header"
        style={{
          flexShrink: 0,
          background: "linear-gradient(135deg, #ea580c 0%, #dc2626 100%)",
          padding: "16px 20px",
          color: "white",
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

      {/* Menu Buttons - area mengisi sisa layar, scroll hanya di menu jika perlu */}
      <div
        className="mobile-home-menu"
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          padding: "16px 20px 0",
          maxWidth: 1200,
          margin: "0 auto",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
        }}
      >
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#1f2937",
            marginBottom: 16,
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          Menu Utama
        </h2>

        <div
          className="mobile-home-menu-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 14,
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            alignContent: "start",
            paddingBottom: 16,
            paddingRight: 14,
            boxSizing: "border-box",
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
                padding: "18px 20px",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                transition: "all 0.2s ease",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 16,
                minHeight: 76,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
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
              <div className="mobile-home-menu-text" style={{ flex: 1, minWidth: 0 }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#1f2937",
                    marginBottom: 4,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {item.label}
                  {item.key === "fit-to-work-validation" && validationCount > 0 && (
                    <span
                      style={{
                        background: "#ef4444",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 700,
                        minWidth: 22,
                        height: 22,
                        borderRadius: 11,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0 6px",
                      }}
                    >
                      {validationCount > 99 ? "99+" : validationCount}
                    </span>
                  )}
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
                  flexShrink: 0,
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
