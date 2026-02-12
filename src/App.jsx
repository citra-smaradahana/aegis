import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Login from "./components/Login";
import MonitoringPage from "./components/MonitoringPage";
import SiteSelectionPage from "./components/SiteSelectionPage";
import OfflineStatus from "./components/OfflineStatus";
import FitToWorkForm from "./components/FitToWorkForm";
import Take5Form from "./components/Take5Form";
import HazardForm from "./components/HazardForm";
import TasklistPage from "./components/TasklistPage";
import UserManagement from "./components/UserManagement";
import Profile from "./components/Profile";
import Home from "./components/Home";
import FitToWorkValidationNew from "./components/FitToWorkValidationNew";
import Take5StatusUpdater from "./components/TasklistPage/Take5StatusUpdater";
import PTOForm from "./components/PTOForm";
import aegisLogo from "./assets/aegis.png";
import kmbLogo from "./assets/kmb.png";

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState("login");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [isMonitoringOpen, setIsMonitoringOpen] = useState(false);
  const [monitoringAnimationKey, setMonitoringAnimationKey] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Handle responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    // Langsung masuk ke main app setelah login
    setCurrentPage("main-app");
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage("login");
    setActiveMenu("dashboard");
  };

  const handleSiteSelection = (selectedSite) => {
    setUser((prev) => ({ ...prev, site: selectedSite }));
    setCurrentPage("main-app");
  };

  const handleMenuChange = (menu) => {
    setActiveMenu(menu);
    // Tutup sub menu monitoring jika menu yang dipilih bukan monitoring
    if (!menu.startsWith("monitoring-") && menu !== "monitoring") {
      setIsMonitoringOpen(false);
    }
  };

  const toggleMonitoring = () => {
    setIsMonitoringOpen(!isMonitoringOpen);
    if (!isMonitoringOpen) {
      // Reset animation key when opening
      setMonitoringAnimationKey((prev) => prev + 1);
    }
  };

  const handleBackToMain = () => {
    setCurrentPage("main-app");
    setActiveMenu("dashboard");
  };

  // Main App Component with Navigation
  const MainApp = () => {
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const renderContent = () => {
      switch (activeMenu) {
        case "dashboard":
          return <Home user={user} onNavigate={handleMenuChange} />;
        case "fit-to-work":
          return (
            <FitToWorkForm
              user={user}
              onBack={handleBackToMain}
              onNavigate={handleMenuChange}
            />
          );
        case "fit-to-work-validation":
          return (
            <FitToWorkValidationNew
              user={user}
              onBack={handleBackToMain}
              onNavigate={handleMenuChange}
            />
          );
        case "take-5":
          return (
            <Take5Form
              user={user}
              onBack={handleBackToMain}
              onNavigate={handleMenuChange}
            />
          );
        case "hazard":
          return <HazardForm user={user} onBack={handleBackToMain} />;
        case "tasklist":
          return (
            <TasklistPage
              user={user}
              onBack={handleBackToMain}
              onNavigate={handleMenuChange}
            />
          );
        case "pto":
          return <PTOForm user={user} onBack={handleBackToMain} />;
        case "monitoring-fit-to-work":
          return (
            <MonitoringPage
              user={user}
              onLogout={handleLogout}
              subMenu="Statistik Fit To Work"
            />
          );
        case "monitoring-take-5":
          return (
            <MonitoringPage
              user={user}
              onLogout={handleLogout}
              subMenu="Take 5"
            />
          );
        case "monitoring-hazard":
          return (
            <MonitoringPage
              user={user}
              onLogout={handleLogout}
              subMenu="Hazard"
            />
          );
        case "user-management":
          return <UserManagement user={user} onBack={handleBackToMain} />;
        case "profile":
          return (
            <Profile
              user={user}
              onBack={handleBackToMain}
              onLogout={handleLogout}
              onNavigate={handleMenuChange}
            />
          );
        default:
          return <MonitoringPage user={user} onLogout={handleLogout} />;
      }
    };

    return (
      <>
        {/* Background component untuk update status Take 5 */}
        <Take5StatusUpdater />

        {/* Sidebar - hanya tampil di desktop, disembunyikan via App.css di mobile */}
        {!isMobile && (
          <aside
            className="sidebar"
            style={{
              position: "fixed",
              left: 0,
              top: 0,
              bottom: 0,
              width: 240,
              background: "#ea580c",
              color: "#fff",
              padding: "8px 12px 12px 12px",
              boxShadow: "2px 0 8px rgba(0,0,0,0.15)",
              overflowY: "hidden",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                padding: "0 8px 8px 8px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <img
                  src={aegisLogo}
                  alt="AEGIS"
                  style={{
                    height: 72,
                    width: "auto",
                    filter:
                      "drop-shadow(0 0 2px rgba(255,255,255,0.9)) drop-shadow(0 0 6px rgba(255,255,255,0.45))",
                  }}
                />
                <img
                  src={kmbLogo}
                  alt="KMB"
                  style={{
                    height: 46,
                    width: "auto",
                    filter:
                      "drop-shadow(0 0 2px rgba(255,255,255,0.9)) drop-shadow(0 0 6px rgba(255,255,255,0.45))",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
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
                        width: 72,
                        height: 72,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "2px solid rgba(255,255,255,0.2)",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: "50%",
                        background: "#374151",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        border: "2px solid rgba(255,255,255,0.2)",
                      }}
                    >
                      {initials}
                    </div>
                  );
                })()}
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontWeight: 700 }}>
                    {user?.nama || user?.user}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>
                    {user?.jabatan || "-"}
                  </div>
                </div>
                {/* Modern minimal icons */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    title="Profile"
                    onClick={() => setActiveMenu("profile")}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      border: "1px solid rgba(255,255,255,0.35)",
                      background: "transparent",
                      color: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    👤
                  </button>
                  <button
                    title="Notifikasi"
                    onClick={() => setActiveMenu("dashboard")}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      border: "1px solid rgba(255,255,255,0.35)",
                      background: "transparent",
                      color: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    🔔
                  </button>
                  <button
                    title="Logout"
                    onClick={() => setShowLogoutConfirm(true)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      border: "1px solid rgba(255,255,255,0.35)",
                      background: "transparent",
                      color: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    ⎋
                  </button>
                </div>
              </div>
            </div>
            <nav
              style={{
                marginTop: 12,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {[
                { key: "dashboard", label: "Home" },
                { key: "fit-to-work", label: "Fit To Work" },
                {
                  key: "fit-to-work-validation",
                  label: "Validasi Fit To Work",
                },
                { key: "take-5", label: "Take 5" },
                { key: "hazard", label: "Hazard Report" },
                { key: "tasklist", label: "Tasklist" },
                { key: "pto", label: "PTO" },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleMenuChange(item.key)}
                  style={{
                    textAlign: "left",
                    width: "100%",
                    padding: "8px 10px",
                    background:
                      activeMenu === item.key
                        ? "rgba(0,0,0,0.15)"
                        : "transparent",
                    color: "#ffffff",
                    border: "1px solid rgba(255,255,255,0.3)",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  {item.label}
                </button>
              ))}

              <button
                onClick={() => {
                  toggleMonitoring();
                  // Set active menu ke monitoring jika dibuka
                  if (!isMonitoringOpen) {
                    setActiveMenu("monitoring");
                  }
                }}
                style={{
                  textAlign: "left",
                  width: "100%",
                  padding: "8px 10px",
                  background: isMonitoringOpen
                    ? "rgba(0,0,0,0.15)"
                    : "transparent",
                  color: "#ffffff",
                  border: "1px solid rgba(255,255,255,0.3)",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Monitoring
              </button>

              <div
                key={monitoringAnimationKey}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  marginLeft: 8,
                  marginRight: 8,
                  marginTop: 6,
                  marginBottom: 10,
                  overflow: "hidden",
                  opacity: isMonitoringOpen ? 1 : 0,
                  maxHeight: isMonitoringOpen ? "240px" : "0px",
                  transition: "all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                  transform: isMonitoringOpen ? "scaleY(1)" : "scaleY(0)",
                  transformOrigin: "top",
                  padding: 8,
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: 8,
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)",
                }}
              >
                <button
                  onClick={() => handleMenuChange("monitoring-fit-to-work")}
                  style={{
                    textAlign: "left",
                    width: "100%",
                    padding: "8px 12px",
                    background:
                      activeMenu === "monitoring-fit-to-work"
                        ? "rgba(0,0,0,0.2)"
                        : "transparent",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "500",
                    opacity: isMonitoringOpen ? 1 : 0,
                    transform: isMonitoringOpen
                      ? "translateX(0)"
                      : "translateX(-30px)",
                    transition:
                      "all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.8s",
                    boxShadow:
                      activeMenu === "monitoring-fit-to-work"
                        ? "0 2px 8px rgba(0,0,0,0.2)"
                        : "none",
                  }}
                >
                  Fit To Work Monitoring
                </button>
                <button
                  onClick={() => handleMenuChange("monitoring-take-5")}
                  style={{
                    textAlign: "left",
                    width: "100%",
                    padding: "8px 12px",
                    background:
                      activeMenu === "monitoring-take-5"
                        ? "rgba(0,0,0,0.2)"
                        : "transparent",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "500",
                    opacity: isMonitoringOpen ? 1 : 0,
                    transform: isMonitoringOpen
                      ? "translateX(0)"
                      : "translateX(-30px)",
                    transition:
                      "all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) 1.6s",
                    boxShadow:
                      activeMenu === "monitoring-take-5"
                        ? "0 2px 8px rgba(0,0,0,0.2)"
                        : "none",
                  }}
                >
                  Take 5 Monitoring
                </button>
                <button
                  onClick={() => handleMenuChange("monitoring-hazard")}
                  style={{
                    textAlign: "left",
                    width: "100%",
                    padding: "8px 12px",
                    background:
                      activeMenu === "monitoring-hazard"
                        ? "rgba(0,0,0,0.2)"
                        : "transparent",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "500",
                    opacity: isMonitoringOpen ? 1 : 0,
                    transform: isMonitoringOpen
                      ? "translateX(0)"
                      : "translateX(-30px)",
                    transition:
                      "all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) 2.4s",
                    boxShadow:
                      activeMenu === "monitoring-hazard"
                        ? "0 2px 8px rgba(0,0,0,0.2)"
                        : "none",
                  }}
                >
                  Hazard Monitoring
                </button>
                <button
                  onClick={() => handleMenuChange("monitoring-pto")}
                  style={{
                    textAlign: "left",
                    width: "100%",
                    padding: "8px 12px",
                    background:
                      activeMenu === "monitoring-pto"
                        ? "rgba(0,0,0,0.2)"
                        : "transparent",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "500",
                    opacity: isMonitoringOpen ? 1 : 0,
                    transform: isMonitoringOpen
                      ? "translateX(0)"
                      : "translateX(-30px)",
                    transition:
                      "all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) 3.2s",
                    boxShadow:
                      activeMenu === "monitoring-pto"
                        ? "0 2px 8px rgba(0,0,0,0.2)"
                        : "none",
                  }}
                >
                  PTO Monitoring
                </button>
              </div>

              {/* Menu Management User hanya untuk admin */}
              {(user?.role === "admin" || user?.jabatan === "Admin") && (
                <button
                  onClick={() => handleMenuChange("user-management")}
                  style={{
                    textAlign: "left",
                    width: "100%",
                    padding: "8px 10px",
                    background:
                      activeMenu === "user-management"
                        ? "rgba(0,0,0,0.15)"
                        : "transparent",
                    color: "#ffffff",
                    border: "1px solid rgba(255,255,255,0.3)",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Management User
                </button>
              )}
            </nav>
            {/* Removed bottom logout button */}
          </aside>
        )}

        {/* Konten utama */}
        <main
          className="main-modern"
          style={{
            marginLeft: isMobile ? 0 : 240,
            width: isMobile ? "100vw" : "calc(100vw - 240px)",
          }}
        >
          {/* Main Content */}
          <div style={{ padding: 0, maxWidth: "100%", margin: "0 auto" }}>
            {renderContent()}
          </div>
          {showLogoutConfirm && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.55)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2000,
              }}
            >
              <div
                style={{
                  background: "#ffffff",
                  width: 360,
                  borderRadius: 12,
                  boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
                  border: "1px solid #e5e7eb",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: 16,
                    borderBottom: "1px solid #eee",
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  Konfirmasi
                </div>
                <div style={{ padding: 16, color: "#374151" }}>
                  Anda yakin ingin keluar?
                </div>
                <div
                  style={{
                    padding: 16,
                    display: "flex",
                    gap: 8,
                    justifyContent: "flex-end",
                    background: "#f9fafb",
                    borderTop: "1px solid #eee",
                  }}
                >
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                      background: "#ffffff",
                      color: "#111827",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Tidak
                  </button>
                  <button
                    onClick={() => {
                      setShowLogoutConfirm(false);
                      handleLogout();
                    }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "none",
                      background: "#ef4444",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    Ya, Keluar
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </>
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        fontFamily: "Poppins, system-ui, Avenir, Helvetica, Arial, sans-serif",
      }}
    >
      {/* Offline Status Indicator */}
      {!isOnline && <OfflineStatus />}

      {/* Main Content */}
      {currentPage === "login" && <Login onLogin={handleLogin} />}

      {currentPage === "site-selection" && (
        <SiteSelectionPage
          user={user}
          onSiteSelect={handleSiteSelection}
          onBack={() => setCurrentPage("login")}
        />
      )}

      {currentPage === "main-app" && <MainApp />}
    </div>
  );
}

export default App;
