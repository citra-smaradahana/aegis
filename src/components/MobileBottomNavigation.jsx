import React, { useState } from "react";
import { Capacitor } from "@capacitor/core";

function MobileBottomNavigation({ activeTab = "home", onNavigate, tasklistTodoCount = 0 }) {
  const [pressed, setPressed] = useState(null);
  const isAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  const handleClick = async (id) => {
    setPressed(id);
    setTimeout(() => setPressed(null), 140);
    if (isAndroid) {
      try {
        const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (_) {}
    }
    onNavigate && onNavigate(id);
  };
  const navItems = [
    {
      id: "home",
      label: "Home",
      icon: "🏠",
    },
    {
      id: "tasklist",
      label: "Tasklist",
      icon: "📝",
    },
    {
      id: "profile",
      label: "Profile",
      icon: "👤",
    },
  ];

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "white",
        borderTop: "1px solid #e5e7eb",
        padding: "12px 0",
        zIndex: 1000,
        boxShadow: "0 -4px 12px rgba(0,0,0,0.1)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 20px",
        }}
      >
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleClick(item.id)}
            onTouchStart={() => setPressed(item.id)}
            onTouchEnd={() => setTimeout(() => setPressed(null), 120)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "8px 12px",
              borderRadius: 8,
              transition: "all 0.2s ease",
              color: activeTab === item.id ? "#3b82f6" : "#6b7280",
              fontWeight: activeTab === item.id ? 600 : 500,
              position: "relative",
              transform: pressed === item.id ? "scale(0.96)" : "scale(1)",
              backgroundColor: pressed === item.id ? "rgba(59,130,246,0.08)" : "transparent",
            }}
          >
            <div style={{ position: "relative", display: "inline-flex" }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              {item.id === "tasklist" && tasklistTodoCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -2,
                    right: -6,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    background: "#ef4444",
                  }}
                />
              )}
            </div>
            <span style={{ fontSize: 12 }}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default MobileBottomNavigation;













