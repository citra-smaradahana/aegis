import React, { useState, useEffect, useRef, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { supabase } from "./supabaseClient";
import { sessionManager, setupSessionAutoExtend } from "./utils/sessionManager";
import { fetchValidationCountForUser } from "./utils/fitToWorkValidationCount";
import { userNeedsToFillFTWToday } from "./utils/fitToWorkAbsentHelpers";
import { fetchTasklistTodoCountForUser } from "./utils/tasklistTodoCount";
import { fetchAllowedMenusForUser } from "./utils/menuAccessHelpers";
import {
  registerPushNotifications,
  unregisterPushNotifications,
} from "./utils/pushNotificationHelpers";
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
import AdminSettings from "./components/AdminSettings";
import Profile from "./components/Profile";
import Home from "./components/Home";
import FitToWorkValidationNew from "./components/FitToWorkValidationNew";
import DailyAttendanceList from "./components/DailyAttendance";
import DailyAttendanceForm from "./components/DailyAttendance/DailyAttendanceForm";
import DailyAttendanceView from "./components/DailyAttendance/DailyAttendanceView";
import FatigueCheckList from "./components/FatigueCheck";
import FatigueCheckForm from "./components/FatigueCheck/FatigueCheckForm";
import Take5StatusUpdater from "./components/TasklistPage/Take5StatusUpdater";
import PTOForm from "./components/PTOForm";
import VersionCheck from "./components/VersionCheck";
import aegisLogo from "./assets/aegis.png";
import kmbLogo from "./assets/kmb.png";

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState("login");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const sessionAutoExtendSetup = useRef(false);
  const backHandlerRef = useRef(null);
  const setBackHandler = useCallback((fn) => {
    backHandlerRef.current = fn;
  }, []);

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

  // Hardware back button (Android) - berperilaku seperti tombol back di dalam app
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android")
      return;
    const listener = CapacitorApp.addListener("backButton", () => {
      if (currentPage === "site-selection") {
        setCurrentPage("login");
        return;
      }
      if (currentPage === "login") {
        CapacitorApp.exitApp();
        return;
      }
      if (currentPage === "main-app") {
        const handler = backHandlerRef.current;
        if (handler) handler();
        else handleBackToMain();
      }
    });
    return () => listener.remove();
  }, [currentPage]);

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
    const userId = user?.id;
    if (userId) {
      unregisterPushNotifications(userId);
    }
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
  };

  const handleBackToMain = () => {
    setCurrentPage("main-app");
    setActiveMenu("dashboard");
  };

  // Main App Component with Navigation
  const MainApp = ({ setBackHandler }) => {
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showNotificationPanel, setShowNotificationPanel] = useState(false);
    const [selectedMeetingId, setSelectedMeetingId] = useState(null);
    const selectedMeetingIdRef = useRef(null);
    const [validationCount, setValidationCount] = useState(0);
    const [ftwNeedsFill, setFtwNeedsFill] = useState(false);
    const [tasklistTodoCount, setTasklistTodoCount] = useState(0);
    const [allowedMenus, setAllowedMenus] = useState(null);
    const canAccessMonitoring =
      user?.role === "evaluator" || user?.role === "admin";

    const reportPtoJabatan = [
      "SHERQ Officer",
      "Field Leading Hand",
      "Plant Leading Hand",
      "Technical Service",
      "Asst. Penanggung Jawab Operasional",
      "Penanggung Jawab Operasional",
    ];
    const validatorJabatan = [
      "Field Leading Hand",
      "Plant Leading Hand",
      "Asst. Penanggung Jawab Operasional",
      "Penanggung Jawab Operasional",
      "SHE",
      "SHERQ Officer",
    ];

    const canAccessFitToWorkValidation = () => {
      if (!user) return false;
      if (allowedMenus) return allowedMenus.includes("fit-to-work-validation");
      if (
        user?.jabatan === "Administrator" ||
        user?.jabatan === "Admin Site Project"
      )
        return true;
      return validatorJabatan.includes((user?.jabatan || "").trim());
    };
    const canAccessReport = () => {
      if (!user) return false;
      if (allowedMenus) return allowedMenus.includes("daily-attendance");
      if (
        user?.jabatan === "Administrator" ||
        user?.jabatan === "Admin Site Project"
      )
        return true;
      return reportPtoJabatan.includes((user?.jabatan || "").trim());
    };
    const canAccessPTO = () => {
      if (!user) return false;
      if (allowedMenus) return allowedMenus.includes("pto");
      if (
        user?.jabatan === "Administrator" ||
        user?.jabatan === "Admin Site Project"
      )
        return true;
      return reportPtoJabatan.includes((user?.jabatan || "").trim());
    };
    const canAccessFatigueCheck = () => {
      if (!user) return false;
      if (allowedMenus) return allowedMenus.includes("fatigue-check");
      if (
        user?.jabatan === "Administrator" ||
        user?.jabatan === "Admin Site Project"
      )
        return true;
      return reportPtoJabatan.includes((user?.jabatan || "").trim());
    };

    useEffect(() => {
      let cancelled = false;
      if (!user?.id) {
        setAllowedMenus(null);
        return;
      }
      fetchAllowedMenusForUser(user).then((menus) => {
        if (!cancelled) setAllowedMenus(menus);
      });
      return () => {
        cancelled = true;
      };
    }, [user?.id, user?.jabatan, user?.site]);

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
      return () => {
        cancelled = true;
      };
    }, [user?.id, user?.jabatan, user?.site, activeMenu]);

    // Fetch apakah user wajib isi Fit To Work hari ini (untuk badge menu)
    useEffect(() => {
      if (!user?.id || !user?.nrp || !user?.site) {
        setFtwNeedsFill(false);
        return;
      }
      let cancelled = false;
      userNeedsToFillFTWToday(user).then((needs) => {
        if (!cancelled) setFtwNeedsFill(!!needs);
      });
      return () => {
        cancelled = true;
      };
    }, [user?.id, user?.nrp, user?.site, activeMenu]);

    // Fetch jumlah To Do di Tasklist untuk user (untuk badge bottom nav)
    useEffect(() => {
      if (!user?.id || !user?.site) {
        setTasklistTodoCount(0);
        return;
      }
      let cancelled = false;
      fetchTasklistTodoCountForUser(user).then((count) => {
        if (!cancelled) setTasklistTodoCount(count);
      });
      return () => {
        cancelled = true;
      };
    }, [user?.id, user?.site, user?.nama, activeMenu]);

    // Daftar push notification (hanya di native Android/iOS)
    useEffect(() => {
      if (user?.id) {
        registerPushNotifications(user.id);
      }
    }, [user?.id]);

    // Daftar handler tombol back hardware (Android)
    useEffect(() => {
      if (!setBackHandler) return;
      setBackHandler(() => {
        if (activeMenu === "daily-attendance-view") {
          selectedMeetingIdRef.current = null;
          setSelectedMeetingId(null);
          handleMenuChange("daily-attendance");
        } else if (activeMenu === "daily-attendance-new") {
          handleMenuChange("daily-attendance");
        } else if (activeMenu === "fatigue-check-new") {
          handleMenuChange("fatigue-check");
        } else if (activeMenu === "dashboard") {
          CapacitorApp.exitApp();
        } else {
          handleBackToMain();
        }
      });
      return () => setBackHandler(null);
    }, [activeMenu, setBackHandler]);

    const renderContent = () => {
      switch (activeMenu) {
        case "dashboard":
          return (
            <Home
              user={user}
              onNavigate={handleMenuChange}
              validationCount={validationCount}
              ftwNeedsFill={ftwNeedsFill}
              tasklistTodoCount={tasklistTodoCount}
            />
          );
        case "fit-to-work":
          return (
            <FitToWorkForm
              user={user}
              onBack={handleBackToMain}
              onNavigate={handleMenuChange}
              tasklistTodoCount={tasklistTodoCount}
            />
          );
        case "fit-to-work-validation":
          if (!canAccessFitToWorkValidation()) {
            return (
              <Home
                user={user}
                onNavigate={handleMenuChange}
                validationCount={validationCount}
                ftwNeedsFill={ftwNeedsFill}
                tasklistTodoCount={tasklistTodoCount}
              />
            );
          }
          return (
            <FitToWorkValidationNew
              user={user}
              onBack={handleBackToMain}
              onNavigate={handleMenuChange}
              tasklistTodoCount={tasklistTodoCount}
            />
          );
        case "daily-attendance":
          if (!canAccessReport()) {
            return (
              <Home
                user={user}
                onNavigate={handleMenuChange}
                validationCount={validationCount}
                ftwNeedsFill={ftwNeedsFill}
                tasklistTodoCount={tasklistTodoCount}
              />
            );
          }
          return (
            <DailyAttendanceList
              user={user}
              tasklistTodoCount={tasklistTodoCount}
              onNavigate={(menu) => {
                if (menu.startsWith("daily-attendance-view:")) {
                  const id = menu.replace("daily-attendance-view:", "");
                  selectedMeetingIdRef.current = id;
                  setSelectedMeetingId(id);
                  handleMenuChange("daily-attendance-view");
                } else {
                  handleMenuChange(menu);
                }
              }}
            />
          );
        case "daily-attendance-view":
          if (!canAccessReport()) {
            return (
              <Home
                user={user}
                onNavigate={handleMenuChange}
                validationCount={validationCount}
                ftwNeedsFill={ftwNeedsFill}
                tasklistTodoCount={tasklistTodoCount}
              />
            );
          }
          return (
            <DailyAttendanceView
              meetingId={selectedMeetingId || selectedMeetingIdRef.current}
              user={user}
              onBack={() => {
                selectedMeetingIdRef.current = null;
                setSelectedMeetingId(null);
                handleMenuChange("daily-attendance");
              }}
            />
          );
        case "daily-attendance-new":
          if (!canAccessReport()) {
            return (
              <Home
                user={user}
                onNavigate={handleMenuChange}
                validationCount={validationCount}
                ftwNeedsFill={ftwNeedsFill}
                tasklistTodoCount={tasklistTodoCount}
              />
            );
          }
          return (
            <DailyAttendanceForm
              user={user}
              onBack={() => handleMenuChange("daily-attendance")}
              onNavigate={handleMenuChange}
              tasklistTodoCount={tasklistTodoCount}
            />
          );
        case "fatigue-check":
          if (!canAccessFatigueCheck()) {
            return (
              <Home
                user={user}
                onNavigate={handleMenuChange}
                validationCount={validationCount}
                ftwNeedsFill={ftwNeedsFill}
                tasklistTodoCount={tasklistTodoCount}
              />
            );
          }
          return (
            <FatigueCheckList
              user={user}
              onNavigate={handleMenuChange}
              tasklistTodoCount={tasklistTodoCount}
            />
          );
        case "fatigue-check-new":
          if (!canAccessFatigueCheck()) {
            return (
              <Home
                user={user}
                onNavigate={handleMenuChange}
                validationCount={validationCount}
                ftwNeedsFill={ftwNeedsFill}
                tasklistTodoCount={tasklistTodoCount}
              />
            );
          }
          return (
            <FatigueCheckForm
              user={user}
              onBack={() => handleMenuChange("fatigue-check")}
              onNavigate={handleMenuChange}
              tasklistTodoCount={tasklistTodoCount}
            />
          );
        case "take-5":
          return (
            <Take5Form
              user={user}
              onBack={handleBackToMain}
              onNavigate={handleMenuChange}
              tasklistTodoCount={tasklistTodoCount}
            />
          );
        case "hazard":
          return (
            <HazardForm
              user={user}
              onBack={handleBackToMain}
              onNavigate={handleMenuChange}
              tasklistTodoCount={tasklistTodoCount}
            />
          );
        case "tasklist":
          return (
            <TasklistPage
              user={user}
              onBack={handleBackToMain}
              onNavigate={handleMenuChange}
              tasklistTodoCount={tasklistTodoCount}
            />
          );
        case "pto":
          if (!canAccessPTO()) {
            return (
              <Home
                user={user}
                onNavigate={handleMenuChange}
                validationCount={validationCount}
                ftwNeedsFill={ftwNeedsFill}
                tasklistTodoCount={tasklistTodoCount}
              />
            );
          }
          return (
            <PTOForm
              user={user}
              onBack={handleBackToMain}
              onNavigate={handleMenuChange}
              tasklistTodoCount={tasklistTodoCount}
            />
          );
        case "monitoring":
          return canAccessMonitoring ? (
            <MonitoringPage user={user} onLogout={handleLogout} />
          ) : (
            <Home
              user={user}
              onNavigate={handleMenuChange}
              validationCount={validationCount}
              ftwNeedsFill={ftwNeedsFill}
              tasklistTodoCount={tasklistTodoCount}
            />
          );
        case "campaign":
          if (user?.jabatan !== "Administrator") {
            return (
              <Home
                user={user}
                onNavigate={handleMenuChange}
                validationCount={validationCount}
                ftwNeedsFill={ftwNeedsFill}
                tasklistTodoCount={tasklistTodoCount}
              />
            );
          }
          return <Campaign user={user} onBack={handleBackToMain} />;
        case "pengaturan":
          if (user?.jabatan !== "Administrator") {
            return (
              <Home
                user={user}
                onNavigate={handleMenuChange}
                validationCount={validationCount}
                ftwNeedsFill={ftwNeedsFill}
                tasklistTodoCount={tasklistTodoCount}
              />
            );
          }
          return <AdminSettings user={user} onBack={handleBackToMain} />;
        case "user-management":
          if (user?.jabatan !== "Administrator") {
            return (
              <Home
                user={user}
                onNavigate={handleMenuChange}
                validationCount={validationCount}
                ftwNeedsFill={ftwNeedsFill}
                tasklistTodoCount={tasklistTodoCount}
              />
            );
          }
          return <UserManagement user={user} onBack={handleBackToMain} />;
        case "profile":
          return (
            <Profile
              user={user}
              onBack={handleBackToMain}
              onLogout={handleLogout}
              onNavigate={handleMenuChange}
              tasklistTodoCount={tasklistTodoCount}
            />
          );
        default:
          return canAccessMonitoring ? (
            <MonitoringPage user={user} onLogout={handleLogout} />
          ) : (
            <Home
              user={user}
              onNavigate={handleMenuChange}
              validationCount={validationCount}
              ftwNeedsFill={ftwNeedsFill}
              tasklistTodoCount={tasklistTodoCount}
            />
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
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    position: "relative",
                    flexWrap: "wrap",
                  }}
                >
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
                        background: showNotificationPanel
                          ? "rgba(0,0,0,0.2)"
                          : "transparent",
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
                  <span style={{ fontWeight: 600, fontSize: 14 }}>
                    Notifikasi
                  </span>
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
                      <div
                        style={{ flex: 1, minWidth: 0, wordWrap: "break-word" }}
                      >
                        <div style={{ fontWeight: 600 }}>
                          {validationCount} validasi Fit To Work perlu
                          ditindaklanjuti
                        </div>
                        <div
                          style={{ fontSize: 11, opacity: 0.9, marginTop: 4 }}
                        >
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
                  {
                    key: "fit-to-work",
                    label: "Fit To Work",
                    badge: ftwNeedsFill,
                  },
                  ...(canAccessFitToWorkValidation()
                    ? [
                        {
                          key: "fit-to-work-validation",
                          label: "Validasi Fit To Work",
                          badgeCount: validationCount,
                        },
                      ]
                    : []),
                  ...(canAccessReport()
                    ? [
                        {
                          key: "daily-attendance",
                          label: "Daily Attendance Record",
                        },
                      ]
                    : []),
                  ...(canAccessFatigueCheck()
                    ? [
                        {
                          key: "fatigue-check",
                          label: "Fatigue Check Report",
                        },
                      ]
                    : []),
                  { key: "take-5", label: "Take 5" },
                  { key: "hazard", label: "Hazard Report" },
                  { key: "tasklist", label: "Tasklist" },
                  ...(canAccessPTO() ? [{ key: "pto", label: "PTO" }] : []),
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
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span
                        style={{
                          background: "#f59e0b",
                          color: "#000",
                          fontSize: 10,
                          fontWeight: 700,
                          minWidth: 18,
                          height: 18,
                          borderRadius: 9,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "0 4px",
                        }}
                      >
                        !
                      </span>
                    )}
                    {item.badgeCount > 0 && (
                      <span
                        style={{
                          background: "#ef4444",
                          color: "#fff",
                          fontSize: 11,
                          fontWeight: 700,
                          minWidth: 20,
                          height: 20,
                          borderRadius: 10,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "0 5px",
                        }}
                      >
                        {item.badgeCount > 99 ? "99+" : item.badgeCount}
                      </span>
                    )}
                  </button>
                ))}

                {/* Menu Monitoring - untuk evaluator dan admin (dengan tab di dalam) */}
                {(user?.role === "evaluator" || user?.role === "admin") && (
                  <button
                    onClick={() => handleMenuChange("monitoring")}
                    style={{
                      textAlign: "left",
                      width: "100%",
                      padding: "8px 10px",
                      background:
                        activeMenu === "monitoring"
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
                )}

                {/* Menu Campaign dan Pengaturan hanya untuk Administrator */}
                {user?.jabatan === "Administrator" && (
                  <>
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
                    <button
                      onClick={() => handleMenuChange("pengaturan")}
                      style={{
                        textAlign: "left",
                        width: "100%",
                        padding: "8px 10px",
                        background:
                          activeMenu === "pengaturan"
                            ? "rgba(0,0,0,0.15)"
                            : "transparent",
                        color: "#ffffff",
                        border: "1px solid rgba(255,255,255,0.3)",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      Pengaturan
                    </button>
                  </>
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
      <VersionCheck />
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

      {currentPage === "main-app" && (
        <MainApp setBackHandler={setBackHandler} />
      )}
    </div>
  );
}

export default App;
