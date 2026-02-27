import React from "react";
import MobileHeader from "../MobileHeader";
import MobileBottomNavigation from "../MobileBottomNavigation";
import PTOHistory from "./PTOHistory";

function PTORiwayatMobile({
  user,
  onBack,
  onNavigate,
  tasklistTodoCount = 0,
  onSwitchToInput,
}) {
  const contentStyle = {
    position: "fixed",
    inset: 0,
    background: "#f8fafc",
    display: "flex",
    flexDirection: "column",
    paddingTop: "60px",
  };
  const scrollContentStyle = {
    flex: 1,
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    paddingBottom: "calc(70px + env(safe-area-inset-bottom))",
  };
  const cardStyle = {
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 10px 24px rgba(0,0,0,0.05)",
    padding: 16,
    margin: "16px auto",
    width: "90%",
    maxWidth: 360,
  };

  return (
    <div style={contentStyle}>
      <MobileHeader user={user} onBack={onBack} title="PTO" showBack={true} />

      <div
        style={{
          width: "100%",
          padding: "16px",
          background: "#fff",
          borderBottom: "1px solid #e5e7eb",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          zIndex: 10,
          display: "flex",
          gap: 10,
        }}
      >
        <button
          onClick={() => onSwitchToInput && onSwitchToInput()}
          style={{
            flex: 1,
            padding: 8,
            borderRadius: 8,
            background: "#f3f4f6",
            color: "#4b5563",
            border: "none",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          Input
        </button>
        <button
          onClick={() => {}}
          style={{
            flex: 1,
            padding: 8,
            borderRadius: 8,
            background: "#2563eb",
            color: "#fff",
            border: "none",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          Riwayat
        </button>
      </div>

      <div style={scrollContentStyle}>
        <div style={{ padding: 16 }}>
          <PTOHistory user={user} />
        </div>
        <div style={{ height: 80 }} /> {/* Spacer for bottom navigation */}
        <MobileBottomNavigation
          activeTab="home"
          tasklistTodoCount={tasklistTodoCount}
          onNavigate={(tab) => {
            if (tab === "home") onBack && onBack();
            else if (tab === "profile") onNavigate && onNavigate("profile");
            else if (tab === "tasklist") onNavigate && onNavigate("tasklist");
          }}
        />
      </div>
    </div>
  );
}

export default PTORiwayatMobile;
