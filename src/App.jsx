import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";
import { sessionManager, setupSessionAutoExtend } from "./utils/sessionManager";
import { fetchValidationCountForUser } from "./utils/fitToWorkValidationCount";
import Login from "./components/Login";
import MonitoringPage from "./components/MonitoringPage";
import SiteSelectionPage from "./components/SiteSelectionPage";
import OfflineStatus from "./components/OfflineStatus";
import FitToWorkForm from "./components/FitToWorkForm";
import Take5Form from "./components/Take5Form";
import HazardForm from "./components/HazardForm";
import TasklistPage from "./components/TasklistPage";
import UserManagement from "./components/UserManagement";
import Campaign from "./components/Campaign";
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
  const sessionAutoExtendSetup = useRef(false);

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

  // Restore session on load (tetap login di web/PWA)
  useEffect(() => {
    const savedUser = sessionManager.getSession();
    if (savedUser) {
      setUser(savedUser);
      setCurrentPage("main-app");
      if (!sessionAutoExtendSetup.current) {
        setupSessionAutoExtend();
        sessionAutoExtendSetup.current = true;
      }
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    sessionManager.saveSession(userData);
    setCurrentPage("main-app");
    if (!sessionAutoExtendSetup.current) {
      setupSessionAutoExtend();
      sessionAutoExtendSetup.current = true;
    }
  };

  const handleLogout = () => {
    sessionManager.clearSession();
    setUser(null);
    setCurrentPage("login");
    setActiveMenu("dashboard");
  };

  const handleSiteSelection = (selectedSite) => {
    setUser((prev) => {
      const updated = { ...prev, site: selectedSite };
      sessionManager.saveSession(updated);
      return updated;
    });
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
    const [showNotificationPanel, setShowNotificationPanel] = useState(false);
    const [validationCount, setValidationCount] = useState(0);
    const canAccessMonitoring =
      user?.role === "evaluator" || user?.role === "admin";
    // Hanya jabatan validator yang boleh melihat dan mengakses Validasi Fit To Work (bukan Quality Control, Operator MMU, Crew, Blaster).
    const canAccessFitToWorkValidation = () => {
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
    };

    // Tutup panel notifikasi saat pindah menu
    useEffect(() => {
      setShowNotificationPanel(false);
    }, [activeMenu]);

    // Fetch jumlah validasi yang perlu ditindaklanjuti (untuk notifikasi)
    useEffect(() => {
      if (!user || !canAccessFitToWorkValidation()) {
        setValidationCount(0);
        return;
      }
      let cancelled = false;
      fetchValidationCountForUser(user).then((count) => {
        if (!cancelled) setValidationCount(count);
      });
      return () => { cancelled = true; };
    }, [user?.id, user?.jabatan, user?.site, activeMenu]);

    const renderContent = () => {
      switch (activeMenu) {
        case "dashboard":
          return <Home user={user} onNavigate={handleMenuChange} validationCount={validationCount} />;
        case "fit-to-work":
          return (
            <FitToWorkForm
              user={user}
              onBack={handleBackToMain}
              onNavigate={handleMenuChange}
            />
          );
        case "fit-to-work-validation":
          if (!canAccessFitToWorkValidation()) {
            return <Home user={user} onNavigate={handleMenuChange} />;
          }
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
          return (
            <HazardForm
              user={user}
              onBack={handleBackToMain}
              onNavigate={handleMenuChange}
            />
          );
        case "tasklist":
          return (
            <TasklistPage
              user={user}
              onBack={handleBackToMain}
              onNavigate={handleMenuChange}
            />
          );
        case "pto":
          return <PTOForm user={user} onBack={handleBackToMain} onNavigate={handleMenuChange} />;
        case "monitoring-fit-to-work":
          return canAccessMonitoring ? (
            <MonitoringPage
              user={user}
              onLogout={handleLogout}
              subMenu="Statistik Fit To Work"
            />
          ) : (
            <Home user={user} onNavigate={handleMenuChange} />
          );
        case "monitoring-take-5":
          return canAccessMonitoring ? (
            <MonitoringPage
              user={user}
              onLogout={handleLogout}
              subMenu="Take 5"
            />
          ) : (
            <Home user={user} onNavigate={handleMenuChange} />
          );
        case "monitoring-hazard":
          return canAccessMonitoring ? (
            <MonitoringPage
              user={user}
              onLogout={handleLogout}
              subMenu="Hazard"
            />
          ) : (
            <Home user={user} onNavigate={handleMenuChange} />
          );
        case "monitoring-pto":
          return canAccessMonitoring ? (
            <MonitoringPage
              user={user}
              onLogout={handleLogout}
              subMenu="PTO"
            />
          ) : (
            <Home user={user} onNavigate={handleMenuChange} />
          );
        case "campaign":
          if (user?.jabatan !== "Administrator") {
            return <Home user={user} onNavigate={handleMenuChange} />;
          }
          return <Campaign user={user} onBack={handleBackToMain} />;
        case "user-management":
          if (user?.jabatan !== "Administrator") {
            return <Home user={user} onNavigate={handleMenuChange} />;
          }
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
          return canAccessMonitoring ? (
            <MonitoringPage user={user} onLogout={handleLogout} />
          ) : (
            <Home user={user} onNavigate={handleMenuChange} />
          );
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
              overflow: "hidden",
              zIndex: 1000,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "0 8px 8px 8px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                textAlign: "center",
                flexShrink: 0,
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
                <div style={{ display: "flex", gap: 8, position: "relative", flexWrap: "wrap" }}>
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
                  <div style={{ position: "relative" }}>
                    <button
                      title="Notifikasi"
                      type="button"
                      onClick={() => setShowNotificationPanel((prev) => !prev)}
                      style={{
                        position: "relative",
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        border: "1px solid rgba(255,255,255,0.35)",
                        background: showNotificationPanel ? "rgba(0,0,0,0.2)" : "transparent",
                        color: "#ffffff",
                        cursor: "pointer",
                      }}
                    >
                      🔔
                      {validationCount > 0 && (
                        <span
                          style={{
                            position: "absolute",
                            top: -4,
                            right: -4,
                            minWidth: 18,
                            height: 18,
                            borderRadius: 9,
                            background: "#ef4444",
                            color: "#fff",
                            fontSize: 11,
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "0 4px",
                          }}
                        >
                          {validationCount > 99 ? "99+" : validationCount}
                        </span>
                      )}
                    </button>
                  </div>
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
            {showNotificationPanel ? (
              <div
                style={{
                  marginTop: 12,
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 0,
                  background: "rgba(0,0,0,0.12)",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.15)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "10px 12px",
                    borderBottom: "1px solid rgba(255,255,255,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Notifikasi</span>
                  <button
                    type="button"
                    onClick={() => setShowNotificationPanel(false)}
                    style={{
                      padding: "4px 8px",
                      fontSize: 12,
                      background: "rgba(255,255,255,0.2)",
                      border: "none",
                      borderRadius: 6,
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    Tutup
                  </button>
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
                  {validationCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setShowNotificationPanel(false);
                        handleMenuChange("fit-to-work-validation");
                      }}
                      style={{
                        width: "100%",
                        padding: "12px 12px",
                        textAlign: "left",
                        border: "none",
                        background: "transparent",
                        color: "#ffffff",
                        cursor: "pointer",
                        fontSize: 13,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        boxSizing: "border-box",
                      }}
                    >
                      <span style={{ fontSize: 18, flexShrink: 0 }}>✅</span>
                      <div style={{ flex: 1, minWidth: 0, wordWrap: "break-word" }}>
                        <div style={{ fontWeight: 600 }}>
                          {validationCount} validasi Fit To Work perlu ditindaklanjuti
                        </div>
                        <div style={{ fontSize: 11, opacity: 0.9, marginTop: 4 }}>
                          Klik untuk membuka halaman validasi
                        </div>
                      </div>
                    </button>
                  ) : (
                    <div
                      style={{
                        padding: "16px 12px",
                        color: "rgba(255,255,255,0.8)",
                        fontSize: 13,
                        textAlign: "center",
                      }}
                    >
                      Tidak ada notifikasi baru
                    </div>
                  )}
                </div>
              </div>
            ) : (
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
                  ...(canAccessFitToWorkValidation()
                    ? [{ key: "fit-to-work-validation", label: "Validasi Fit To Work" }]
                    : []),
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

              {/* Menu Monitoring hanya untuk role evaluator dan admin */}
              {(user?.role === "evaluator" || user?.role === "admin") && (
                <>
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
                </>
              )}

              {/* Menu Campaign hanya untuk Administrator */}
              {user?.jabatan === "Administrator" && (
                <button
                  onClick={() => handleMenuChange("campaign")}
                  style={{
                    textAlign: "left",
                    width: "100%",
                    padding: "8px 10px",
                    background:
                      activeMenu === "campaign"
                        ? "rgba(0,0,0,0.15)"
                        : "transparent",
                    color: "#ffffff",
                    border: "1px solid rgba(255,255,255,0.3)",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Campaign
                </button>
              )}
              {/* Menu Management User hanya untuk Administrator (bukan Admin Site Project) */}
              {user?.jabatan === "Administrator" && (
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
            )}
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
