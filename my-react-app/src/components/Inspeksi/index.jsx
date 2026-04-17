import React, { useState, useEffect } from "react";
import MobileHeader from "../MobileHeader";
import MobileBottomNavigation from "../MobileBottomNavigation";

const INSPEKSI_MENUS = [
  {
    key: "inspeksi-5r",
    label: "Inspeksi 5R",
    icon: "🏭",
    color: "#10b981",
    description: "Inspeksi Seiri, Seiton, Seisō, Seiketsu, Shitsuke",
  },
  {
    key: "audit-5r",
    label: "Audit 5R",
    icon: "📋",
    color: "#6366f1",
    description: "Evaluasi kepatuhan dan efektivitas penerapan 5R",
  },
  {
    key: "inspeksi-power-tools",
    label: "Inspeksi Power Tools",
    icon: "🔧",
    color: "#f59e0b",
    description: "Pemeriksaan kondisi dan keselamatan alat-alat bertenaga",
  },
  {
    key: "inspeksi-lifting-gear",
    label: "Inspeksi Lifting Gear",
    icon: "🏗️",
    color: "#3b82f6",
    description: "Inspeksi peralatan angkat dan perlengkapan rigging",
  },
  {
    key: "inspeksi-parkir-prosedur",
    label: "Inspeksi Parkir Prosedur",
    icon: "🅿️",
    color: "#8b5cf6",
    description: "Pemeriksaan area parkir dan kepatuhan prosedur parkir",
  },
  {
    key: "inspeksi-kendaraan",
    label: "Inspeksi Kendaraan",
    icon: "🚗",
    color: "#ef4444",
    description: "Inspeksi kondisi kendaraan operasional di site",
  },
];

// ─── DESKTOP ──────────────────────────────────────────────────────────────────
const InspeksiDesktop = ({ onNavigate }) => (
  <div
    style={{
      width: "100%",
      height: "100vh",
      background: "transparent",
      display: "flex",
      flexDirection: "column",
      padding: "24px 80px 0 24px",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        width: "100%",
        textAlign: "center",
      }}
    >
      <div style={{ marginBottom: 24, flexShrink: 0 }}>
        <h2 style={{ margin: 0, color: "#60a5fa", fontWeight: 900, fontSize: 28 }}>
          Inspeksi
        </h2>
        <p style={{ margin: "4px 0 0", color: "#9ca3af", fontSize: 14 }}>
          Pilih jenis inspeksi yang akan dilakukan
        </p>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "10px 4px 40px 0", minHeight: 0 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {INSPEKSI_MENUS.map((item) => (
            <div
              key={item.key}
              onClick={() => onNavigate(item.key)}
              style={{
                background: "#1f2937",
                border: "1px solid #374151",
                borderRadius: 12,
                padding: "16px 20px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 16,
                transition: "all 0.2s ease",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.borderColor = item.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "#374151";
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: `${item.color}22`,
                  border: `1.5px solid ${item.color}55`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#f3f4f6", marginBottom: 3 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 13, color: "#9ca3af" }}>{item.description}</div>
              </div>
              <div style={{ color: item.color, fontSize: 22, opacity: 0.7 }}>›</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ─── MOBILE ───────────────────────────────────────────────────────────────────
const InspeksiMobile = ({ user, onBack, onNavigate, tasklistTodoCount }) => {
  const [pressedItem, setPressedItem] = useState(null);

  const handleTap = (key) => {
    setPressedItem(key);
    setTimeout(() => setPressedItem(null), 150);
    onNavigate(key);
  };

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#f8fafc", paddingBottom: "calc(70px + env(safe-area-inset-bottom))" }}>
      <MobileHeader user={user} onBack={onBack} title="Inspeksi" />
      <div style={{ padding: 16, paddingTop: 70 }}>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {INSPEKSI_MENUS.map((item) => (
            <button
              key={item.key}
              onClick={() => handleTap(item.key)}
              style={{ 
                width: "100%", 
                background: "white", 
                borderRadius: 14, 
                padding: "12px 16px", 
                minHeight: 80, 
                display: "flex", 
                alignItems: "center", 
                gap: 14, 
                border: "none", 
                boxShadow: pressedItem === item.key ? "0 1px 4px rgba(0,0,0,0.08)" : "0 2px 8px rgba(0,0,0,0.07)",
                textAlign: "left", 
                cursor: "pointer",
                transform: pressedItem === item.key ? "scale(0.98)" : "scale(1)",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ background: `${item.color}12`, width: 48, height: 48, borderRadius: 10, fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {item.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.description}</div>
              </div>
              <div style={{ color: item.color, fontSize: 14, opacity: 0.6 }}>›</div>
            </button>
          ))}
        </div>
      </div>
      <MobileBottomNavigation
        activeTab={null}
        tasklistTodoCount={tasklistTodoCount}
        onNavigate={(tab) => {
          if (tab === "home") onNavigate("dashboard");
          else if (tab === "tasklist") onNavigate("tasklist");
          else if (tab === "profile") onNavigate("profile");
        }}
      />
    </div>
  );
};

// ─── ROOT ─────────────────────────────────────────────────────────────────────
function InspeksiPage({ user, onBack, onNavigate, tasklistTodoCount = 0 }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  return isMobile ? (
    <InspeksiMobile user={user} onBack={onBack} onNavigate={onNavigate} tasklistTodoCount={tasklistTodoCount} />
  ) : (
    <InspeksiDesktop onNavigate={onNavigate} />
  );
}

export default InspeksiPage;
