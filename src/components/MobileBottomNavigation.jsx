import React from "react";

function MobileBottomNavigation({ activeTab = "home", onNavigate }) {
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
            onClick={() => onNavigate && onNavigate(item.id)}
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
            }}
          >
            <div style={{ fontSize: 20 }}>{item.icon}</div>
            <span style={{ fontSize: 12 }}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default MobileBottomNavigation;














