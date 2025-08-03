import React, { useState, useEffect } from "react";
import Dropzone from "./components/Dropzone/Dropzone";
import UploadKaryawan from "./components/Dropzone/UploadKaryawan";
import HazardForm from "./components/HazardForm/index.jsx";
import Login from "./components/Login";
import FitToWorkForm from "./components/FitToWorkForm";
import FitToWorkValidationNew from "./components/FitToWorkValidationNew";
import Take5Form from "./components/Take5Form/index.jsx";
import MonitoringPage from "./components/MonitoringPage";
import "./App.css";
import { supabase } from "./supabaseClient";
import TasklistForm from "./components/tasklistForms/index.jsx";
import Profile from "./components/Profile/index.jsx";
import UserManagement from "./components/UserManagement/index.jsx";
import { sessionManager, setupSessionAutoExtend } from "./utils/sessionManager";

const allMenuItems = [
  "Home",
  "Fit To Work",
  "Validasi Fit To Work",
  "Take 5",
  "Hazard Report",
  "Tasklist",
  "PTO",
  "Monitoring",
  "Manajemen User",
];

// Sub-menu untuk Fit To Work
const fitToWorkSubMenus = ["Form Fit To Work", "Validasi Fit To Work"];

// Sub-menu untuk Monitoring
const monitoringSubMenus = ["Statistik Fit To Work", "Take 5", "Hazard", "PTO"];

function getMenuByRole(role, user) {
  if (role === "user") {
    return allMenuItems.filter(
      (item) =>
        item !== "Monitoring" &&
        item !== "Manajemen User" &&
        item !== "Validasi Fit To Work"
    );
  }
  if (role === "evaluator") {
    const userJabatan = user?.jabatan;
    const canValidate =
      userJabatan &&
      [
        "SHERQ Officer",
        "Penanggung Jawab Operasional",
        "Asst. Penanggung Jawab Operasional",
      ].includes(userJabatan);

    return allMenuItems.filter(
      (item) =>
        item !== "Manajemen User" &&
        (item !== "Validasi Fit To Work" || canValidate)
    );
  }
  return allMenuItems; // admin
}

// Function untuk mendapatkan sub-menu berdasarkan role dan device
function getFitToWorkSubMenus(role, isMobile, user) {
  console.log("=== DEBUG MENU ACCESS ===");
  console.log("getFitToWorkSubMenus - Role:", role);
  console.log("getFitToWorkSubMenus - User:", user);
  console.log("getFitToWorkSubMenus - User Jabatan:", user?.jabatan);
  console.log("getFitToWorkSubMenus - Is Mobile:", isMobile);

  if (isMobile) {
    // Mobile: hanya Form Fit To Work
    console.log("Mobile device - returning Form Fit To Work only");
    return ["Form Fit To Work"];
  } else {
    // Desktop: semua sub-menu
    const userJabatan = user?.jabatan;

    // Check berdasarkan jabatan yang bisa melakukan validasi (TIDAK PERLU ROLE)
    const canValidate =
      userJabatan &&
      [
        "SHERQ Officer",
        "Penanggung Jawab Operasional",
        "Asst. Penanggung Jawab Operasional",
      ].includes(userJabatan);

    console.log(
      "getFitToWorkSubMenus - Can Validate (by jabatan):",
      canValidate
    );
    console.log("getFitToWorkSubMenus - User Jabatan in list:", userJabatan);
    console.log("getFitToWorkSubMenus - Validator list:", [
      "SHERQ Officer",
      "Penanggung Jawab Operasional",
      "Asst. Penanggung Jawab Operasional",
    ]);

    if (canValidate) {
      console.log(
        "getFitToWorkSubMenus - Returning full menu (Form + Validasi) - based on jabatan only"
      );
      return fitToWorkSubMenus; // Form + Validasi
    } else {
      console.log(
        "getFitToWorkSubMenus - Returning form only - jabatan not in validator list"
      );
      return ["Form Fit To Work"]; // Hanya Form
    }
  }
}

// Function untuk mendapatkan sub-menu monitoring berdasarkan role dan device
function getMonitoringSubMenus(role, isMobile, user) {
  console.log("=== DEBUG MONITORING MENU ACCESS ===");
  console.log("getMonitoringSubMenus - Role:", role);
  console.log("getMonitoringSubMenus - User:", user);
  console.log("getMonitoringSubMenus - Is Mobile:", isMobile);

  if (isMobile) {
    // Mobile: hanya statistik fit to work
    console.log("Mobile device - returning Statistik Fit To Work only");
    return ["Statistik Fit To Work"];
  } else {
    // Desktop: semua sub-menu monitoring
    console.log("Desktop device - returning all monitoring sub-menus");
    return monitoringSubMenus;
  }
}

const dummyFoto =
  "https://ui-avatars.com/api/?name=User&background=ddd&color=555";

function App() {
  const [user, setUser] = useState(null); // user login
  const [activeMenu, setActiveMenu] = useState("Home");
  const [activeSubMenu, setActiveSubMenu] = useState("Form Fit To Work");
  const [isMobile, setIsMobile] = useState(false);
  const userRole = (user?.role || "").toLowerCase();
  const userNama = user?.nama || "";
  const menuItems = getMenuByRole(userRole, user);
  const fitToWorkSubMenus = getFitToWorkSubMenus(userRole, isMobile, user);
  const monitoringSubMenus = getMonitoringSubMenus(userRole, isMobile, user);
  const [taskNotif, setTaskNotif] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Debug logs untuk user data
  console.log("App - User data:", user);
  console.log("App - User role:", userRole);
  console.log("App - User jabatan:", user?.jabatan);
  console.log("App - User site:", user?.site);
  console.log("App - User nama:", userNama);
  console.log("App - Fit To Work Sub Menus:", fitToWorkSubMenus);

  // Session management
  useEffect(() => {
    // Check for existing session on app load
    const savedUser = sessionManager.getSession();
    if (savedUser && !user) {
      setUser(savedUser);
    }

    // Setup session auto-extend
    setupSessionAutoExtend();
  }, []);

  // Save session when user changes
  useEffect(() => {
    if (user) {
      sessionManager.saveSession(user);
    }
  }, [user]);

  // Fungsi untuk redirect ke Hazard Report setelah Take 5 STOP
  const handleRedirectToHazard = () => {
    setActiveMenu("Hazard Report");
  };

  // Fungsi untuk fetch notifikasi berdasarkan role
  const fetchNotifications = async () => {
    try {
      console.log("=== FETCH NOTIFICATIONS - KODE TERBARU ===");
      const newNotifications = [];

      // Pastikan userJabatan dan userSite didefinisikan di awal
      const userJabatan = user?.jabatan;
      const userSite = user?.site;

      console.log("fetchNotifications - userJabatan:", userJabatan);
      console.log("fetchNotifications - userSite:", userSite);
      console.log("fetchNotifications - userNama:", userNama);

      // 1. Take 5 Pending untuk user yang membuat Take 5
      console.log("fetchNotifications - Querying Take 5 with new parameters");
      const { data: take5Data } = await supabase
        .from("take_5")
        .select("id, nama, detail_lokasi, aman, created_at")
        .eq("nama", userNama)
        .eq("aman", "stop")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      console.log("fetchNotifications - Take 5 data:", take5Data);

      if (take5Data && take5Data.length > 0) {
        take5Data.forEach((take5) => {
          newNotifications.push({
            id: `take5_${take5.id}`,
            type: "take5_pending",
            title: "Take 5 Pending",
            message: `Take 5 #${take5.id} di ${take5.detail_lokasi} memerlukan pembuatan Hazard Report`,
            data: take5,
            timestamp: take5.created_at,
            priority: "high",
            clickable: true,
          });
        });
      }

      // 2. Tasklist To Do berdasarkan role user
      let tasklistQuery = supabase
        .from("hazard_report")
        .select(
          "id, pelapor_nama, lokasi, status, pic, evaluator_nama, created_at"
        );

      if (userRole === "pic" || userRole === "admin") {
        // PIC melihat tasklist dengan status Submit, Progress, Reject at Open, Reject at Done
        const { data: picTasks } = await tasklistQuery
          .in("status", [
            "Submit",
            "Progress",
            "Reject at Open",
            "Reject at Done",
          ])
          .eq("pic", userNama) // Hanya task yang ditugaskan ke user ini
          .order("created_at", { ascending: false });

        if (picTasks && picTasks.length > 0) {
          picTasks.forEach((task) => {
            newNotifications.push({
              id: `task_${task.id}`,
              type: "tasklist_todo",
              title: `To Do: ${task.status}`,
              message: `Hazard #${task.id} dari ${task.pelapor_nama} memerlukan tindakan Anda`,
              data: task,
              timestamp: task.created_at,
              priority: "high",
              clickable: true,
            });
          });
        }
      }

      if (userRole === "evaluator" || userRole === "admin") {
        // Evaluator melihat tasklist dengan status Done
        const { data: evalTasks } = await tasklistQuery
          .eq("status", "Done")
          .eq("evaluator_nama", userNama) // Hanya task yang ditugaskan ke evaluator ini
          .order("created_at", { ascending: false });

        if (evalTasks && evalTasks.length > 0) {
          evalTasks.forEach((task) => {
            newNotifications.push({
              id: `eval_${task.id}`,
              type: "tasklist_todo",
              title: "To Do: Evaluasi",
              message: `Hazard #${task.id} siap untuk evaluasi Anda`,
              data: task,
              timestamp: task.created_at,
              priority: "high",
              clickable: true,
            });
          });
        }
      }

      // 3. Hazard Report untuk PIC (hanya notifikasi, tidak clickable)
      if (
        userRole === "pic" ||
        userRole === "admin" ||
        userRole === "evaluator"
      ) {
        const { data: hazardData } = await supabase
          .from("hazard_report")
          .select("id, pelapor_nama, lokasi, ketidaksesuaian, created_at")
          .eq("status", "Submit")
          .order("created_at", { ascending: false });

        if (hazardData && hazardData.length > 0) {
          hazardData.forEach((hazard) => {
            newNotifications.push({
              id: `hazard_${hazard.id}`,
              type: "hazard_report",
              title: "Hazard Report Baru",
              message: `Hazard #${hazard.id} dari ${hazard.pelapor_nama} di ${hazard.lokasi}`,
              data: hazard,
              timestamp: hazard.created_at,
              priority: "medium",
              clickable: false,
            });
          });
        }
      }

      // Fit To Work Validation Pending (TIDAK PERLU ROLE)
      if (
        userJabatan &&
        [
          "Leading Hand",
          "Asst. Penanggung Jawab Operasional",
          "Penanggung Jawab Operasional",
          "SHE",
          "SHERQ Officer",
        ].includes(userJabatan)
      ) {
        console.log(
          "fetchNotifications - Adding Fit To Work Validation notification for jabatan:",
          userJabatan
        );

        let validationQuery = supabase
          .from("fit_to_work")
          .select("*")
          .eq("site", userSite)
          .eq("status_fatigue", "Not Fit To Work");

        // Filter berdasarkan jabatan validator dan workflow_status yang bisa diakses
        if (userJabatan === "Leading Hand") {
          // Leading Hand hanya bisa melihat status Pending
          validationQuery = validationQuery
            .in("jabatan", [
              "Crew",
              "Mekanik",
              "QC",
              "Operator MMU",
              "Operator Plant",
            ])
            .eq("workflow_status", "Pending");
        } else if (userJabatan === "Asst. Penanggung Jawab Operasional") {
          // Asst. PJO hanya bisa melihat status Pending
          validationQuery = validationQuery
            .in("jabatan", ["Blaster", "Leading Hand"])
            .eq("workflow_status", "Pending");
        } else if (userJabatan === "Penanggung Jawab Operasional") {
          // PJO bisa melihat status Pending dan Level1_Review untuk jabatan tertentu
          validationQuery = validationQuery
            .in("jabatan", [
              "Asst. Penanggung Jawab Operasional",
              "SHERQ Officer",
              "Technical Service",
            ])
            .in("workflow_status", ["Pending", "Level1_Review"]);
        } else if (userJabatan === "SHE") {
          // SHE bisa melihat status Level1_Review dan Admin yang masih Pending
          validationQuery = validationQuery.or(
            `workflow_status.eq.Level1_Review,and(jabatan.eq.Admin,workflow_status.eq.Pending)`
          );
        }

        const { data: validationData, error: validationError } =
          await validationQuery;

        if (!validationError && validationData && validationData.length > 0) {
          let pendingCount = 0;

          if (userJabatan === "SHE") {
            // SHE melihat validasi yang sudah di-review Level 1 (Level1_Review)
            pendingCount = validationData.filter(
              (v) => v.workflow_status === "Level1_Review"
            ).length;
          } else {
            // Jabatan lain melihat validasi yang masih Pending
            pendingCount = validationData.filter(
              (v) => v.workflow_status === "Pending"
            ).length;
          }

          if (pendingCount > 0) {
            newNotifications.push({
              id: `fit_to_work_validation_${userJabatan}`,
              type: "fit_to_work_validation",
              title: "Validasi Fit To Work",
              message: `${pendingCount} validasi Fit To Work menunggu review`,
              priority: "high",
              clickable: true,
              timestamp: new Date().toISOString(),
            });
          }
        }
      }

      setNotifications(newNotifications);
      setNotificationCount(newNotifications.length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Fungsi untuk handle notifikasi
  const handleNotificationClick = () => {
    setShowNotificationModal(true);
  };

  const handleNotificationItemClick = (notification) => {
    if (!notification.clickable) return;

    // Add visual feedback
    const notificationElement = document.querySelector(
      `[data-notification-id="${notification.id}"]`
    );
    if (notificationElement) {
      notificationElement.style.transform = "scale(0.95)";
      setTimeout(() => {
        notificationElement.style.transform = "scale(1)";
      }, 150);
    }

    // Handle different notification types
    if (notification.type === "take5_pending") {
      // Redirect to Hazard Report
      setActiveMenu("Hazard Report");
      closeNotificationModal();
    } else if (notification.type === "tasklist_todo") {
      // Redirect to Tasklist
      setActiveMenu("Tasklist");
      closeNotificationModal();
    } else if (notification.type === "fit_to_work_validation") {
      // Redirect to Fit To Work Validation
      setActiveMenu("Fit To Work");
      setActiveSubMenu("Validasi Fit To Work");
      closeNotificationModal();
    }
  };

  const closeNotificationModal = () => {
    // Tambahkan animasi fade out sebelum menutup
    const modal = document.querySelector(".notification-popup");
    if (modal) {
      modal.style.animation = "slideUp 0.3s ease-out";
      setTimeout(() => {
        setShowNotificationModal(false);
      }, 300);
    } else {
      setShowNotificationModal(false);
    }
  };

  const openLogoutModal = () => {
    setShowLogoutModal(true);
  };

  const closeLogoutModal = () => {
    // Tambahkan animasi fade out sebelum menutup
    const modal = document.querySelector(".logout-popup");
    if (modal) {
      modal.style.animation = "fadeOut 0.3s ease-out";
      setTimeout(() => {
        setShowLogoutModal(false);
      }, 300);
    } else {
      setShowLogoutModal(false);
    }
  };

  const handleLogout = () => {
    closeLogoutModal();
    sessionManager.clearSession();
    setUser(null);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "take5_pending":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        );
      case "tasklist_todo":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
          </svg>
        );
      case "fit_to_work_validation":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="m13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        );
    }
  };

  useEffect(() => {
    if (!user) return;
    async function fetchTaskNotif() {
      let query = supabase.from("tasklist").select("id");
      if (userRole === "evaluator") {
        query = query.eq("evaluator_nama", user.nama).eq("status", "Progress");
      } else {
        query = query.eq("pic_nama", user.nama).eq("status", "Open");
      }
      const { data } = await query;
      setTaskNotif(data && data.length > 0);
    }
    fetchTaskNotif();
  }, [user, userRole]);

  // Fetch notifikasi setiap kali user berubah atau setiap 30 detik
  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    // Set interval untuk update notifikasi setiap 30 detik
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, [user, userRole]);

  // Keyboard support untuk logout modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && showLogoutModal) {
        closeLogoutModal();
      }
    };

    if (showLogoutModal) {
      document.addEventListener("keydown", handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [showLogoutModal]);

  // Device detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Update sub-menu when device or role changes
  useEffect(() => {
    // Skip this effect if Monitoring is active
    if (activeMenu === "Monitoring") {
      console.log("App - Skipping sub-menu update for Monitoring");
      return;
    }

    const availableSubMenus = getFitToWorkSubMenus(userRole, isMobile, user);
    if (!availableSubMenus.includes(activeSubMenu)) {
      console.log("App - Updating sub-menu to:", availableSubMenus[0]);
      setActiveSubMenu(availableSubMenus[0]);
    }
  }, [userRole, isMobile, activeSubMenu, user, activeMenu]);

  // Function untuk handle menu click
  const handleMenuClick = (menuName) => {
    console.log("App - handleMenuClick called with:", menuName);
    console.log("App - Current activeMenu:", activeMenu);
    console.log("App - Current activeSubMenu:", activeSubMenu);

    setActiveMenu(menuName);

    // Set default sub-menu for Monitoring
    if (menuName === "Monitoring") {
      console.log("App - Setting default sub-menu for Monitoring");
      setActiveSubMenu("Statistik Fit To Work");
    }

    console.log("App - After setState - activeMenu will be:", menuName);
    console.log(
      "App - After setState - activeSubMenu will be:",
      menuName === "Monitoring" ? "Statistik Fit To Work" : activeSubMenu
    );
  };

  // Function untuk handle sub-menu click
  const handleSubMenuClick = (subMenuName) => {
    console.log("App - handleSubMenuClick called with:", subMenuName);
    console.log("App - Current activeSubMenu:", activeSubMenu);
    setActiveSubMenu(subMenuName);
    console.log("App - After setState - activeSubMenu will be:", subMenuName);
  };

  useEffect(() => {
    console.log("App - useEffect - activeMenu changed to:", activeMenu);
    console.log("App - useEffect - activeSubMenu changed to:", activeSubMenu);
  }, [activeMenu, activeSubMenu]);

  if (!user) {
    return (
      <Login
        onLogin={(user) => {
          setUser(user);
          setActiveMenu("Home");
        }}
      />
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        minWidth: "100vw",
        width: "100vw",
        height: "100vh",
        background: "rgb(255, 255, 255)",
        position: "relative",
        overflow: "hidden",
        overflowX: "hidden",
      }}
    >
      {/* Background pattern overlay untuk menu area */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      {/* Mobile Header (Logo + Profile) */}
      <div
        className="mobile-header mobile-only"
        style={{
          display: "none",
          flexDirection: "column",
          alignItems: "center",
          padding: "0 0 8px 0",
          background: "#fff",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        {/* Card Logo */}
        <div
          className="mobile-logo-card"
          style={{
            width: "100%",
            background: "linear-gradient(135deg, #254188 0%, #ff6b35 100%)",
            borderRadius: "0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px 0 12px 0",
            marginBottom: 12,
            boxShadow: "0 4px 20px rgba(37, 65, 136, 0.4)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background pattern overlay */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                "radial-gradient(circle at 70% 30%, rgba(255,255,255,0.15) 0%, transparent 60%)",
              pointerEvents: "none",
            }}
          />
          <span
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: "#ffffff",
              letterSpacing: 2,
              textShadow: "0 2px 8px rgba(0,0,0,0.3)",
              position: "relative",
              zIndex: 1,
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
            }}
          >
            Aegis
          </span>
        </div>
        {/* Card Profile */}
        <div
          className="mobile-profile-card"
          style={{
            width: "calc(100% - 48px)",
            margin: "0 24px",
            background: "linear-gradient(135deg, #254188 0%, #ff6b35 100%)",
            borderRadius: 16,
            boxShadow: "0 8px 32px rgba(37, 65, 136, 0.3)",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            padding: "16px 20px",
            marginBottom: 16,
            gap: 16,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background pattern overlay */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)",
              pointerEvents: "none",
            }}
          />
          <img
            src={user.foto || dummyFoto}
            alt="Profile"
            className="profile-pic"
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              marginRight: 0,
              objectFit: "cover",
              background: "rgba(255,255,255,0.2)",
              border: "3px solid rgba(255,255,255,0.3)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              flex: 1,
              position: "relative",
              zIndex: 1,
            }}
          >
            <div
              className="profile-name"
              style={{
                fontWeight: 700,
                fontSize: 18,
                marginBottom: 2,
                textAlign: "left",
                color: "#ffffff",
                textShadow: "0 1px 3px rgba(0,0,0,0.3)",
              }}
            >
              {user.nama}
            </div>
            <div
              className="profile-jabatan"
              style={{
                fontWeight: 700,
                fontSize: 14,
                color: "rgba(255,255,255,0.9)",
                textAlign: "left",
                textShadow: "0 1px 2px rgba(0,0,0,0.2)",
              }}
            >
              {user.jabatan}
            </div>
            <div
              className="profile-site"
              style={{
                fontWeight: 600,
                fontSize: 12,
                color: "rgba(255,255,255,0.8)",
                textAlign: "left",
                marginTop: 2,
                textShadow: "0 1px 2px rgba(0,0,0,0.2)",
              }}
            >
              {user.site || "Site tidak tersedia"}
            </div>
          </div>

          {/* Notification Bell */}
          <button
            onClick={handleNotificationClick}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: "8px",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.9)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="m13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {/* Notification Badge */}
            {notificationCount > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  background: "#ef4444",
                  color: "#fff",
                  borderRadius: "50%",
                  width: "18px",
                  height: "18px",
                  fontSize: "10px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid rgba(255,255,255,0.3)",
                }}
              >
                {notificationCount > 9 ? "9+" : notificationCount}
              </div>
            )}
          </button>
        </div>
      </div>
      {/* Mobile Main Menu (List Layout) */}
      <div
        className="mobile-main-menu-list mobile-only"
        style={{
          display: "none",
          flexDirection: "column",
          margin: "16px 16px 0 16px",
          gap: 8,
          background: "transparent",
          borderRadius: "16px",
          padding: "16px",
          boxShadow: "none",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Menu Item: Fit To Work */}
        <button
          className="mobile-menu-list-item menu-item-blue"
          onClick={() => {
            handleMenuClick("Fit To Work");
            handleSubMenuClick("Form Fit To Work");
          }}
        >
          <div className="menu-item-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
            </svg>
          </div>
          <span className="menu-item-text">Fit To Work</span>
          <div className="menu-item-arrow">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </button>

        {/* Menu Item: Validasi - Only show for specific roles */}
        {user?.jabatan &&
          [
            "SHERQ Officer",
            "Penanggung Jawab Operasional",
            "Asst. Penanggung Jawab Operasional",
          ].includes(user.jabatan) && (
            <button
              className="mobile-menu-list-item menu-item-cyan"
              onClick={() => setActiveMenu("Validasi Fit To Work")}
            >
              <div className="menu-item-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="menu-item-text">Validasi Fit To Work</span>
              <div className="menu-item-arrow">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </button>
          )}

        {/* Menu Item: Take 5 */}
        <button
          className="mobile-menu-list-item menu-item-green"
          onClick={() => setActiveMenu("Take 5")}
        >
          <div className="menu-item-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </div>
          <span className="menu-item-text">Take 5</span>
          <div className="menu-item-arrow">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </button>

        {/* Menu Item: Hazard */}
        <button
          className="mobile-menu-list-item menu-item-orange"
          onClick={() => setActiveMenu("Hazard Report")}
        >
          <div className="menu-item-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L1 21h22L12 2zm0 3.17L19.83 19H4.17L12 5.17zM11 16h2v2h-2zm0-6h2v4h-2z" />
            </svg>
          </div>
          <span className="menu-item-text">Hazard Report</span>
          <div className="menu-item-arrow">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </button>

        {/* Menu Item: PTO */}
        <button
          className="mobile-menu-list-item menu-item-purple"
          onClick={() => setActiveMenu("PTO")}
        >
          <div className="menu-item-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
            </svg>
          </div>
          <span className="menu-item-text">PTO</span>
          <div className="menu-item-arrow">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </button>
      </div>
      {/* Mobile Pop Up Content */}
      {[
        "Fit To Work",
        "Validasi Fit To Work",
        "Take 5",
        "Hazard Report",
        "PTO",
      ].includes(activeMenu) && (
        <div
          className="mobile-popup-content mobile-only"
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            top: 72, // tinggi logo card (ubah jika perlu)
            bottom: 60, // tinggi bottom bar
            background: "#fff",
            zIndex: 200,
            overflowY: "auto",
            borderRadius: "16px 16px 0 0",
            boxShadow: "0 -2px 16px #0002",
            padding: "0px 0 0 0",
          }}
        >
          {activeMenu === "Fit To Work" && (
            <>
              {activeSubMenu === "Form Fit To Work" && (
                <FitToWorkForm
                  user={user}
                  onBack={() => setActiveMenu("Home")}
                />
              )}
              {activeSubMenu === "Validasi Fit To Work" && (
                <FitToWorkValidationNew
                  user={user}
                  onBack={() => setActiveMenu("Home")}
                />
              )}
            </>
          )}
          {activeMenu === "Validasi Fit To Work" && (
            <FitToWorkValidationNew
              user={user}
              onBack={() => setActiveMenu("Home")}
            />
          )}
          {activeMenu === "Take 5" && (
            <Take5Form
              user={user}
              onRedirectHazard={handleRedirectToHazard}
              onBack={() => setActiveMenu("Home")}
            />
          )}
          {activeMenu === "Hazard Report" && (
            <HazardForm user={user} onBack={() => setActiveMenu("Home")} />
          )}
          {activeMenu === "PTO" && (
            <div style={{ padding: 24 }}>PTO Content</div>
          )}
        </div>
      )}
      {/* Mobile Pop Up Tasklist */}
      {activeMenu === "Tasklist" && (
        <div
          className="mobile-popup-content mobile-only"
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            top: 72, // tinggi logo card
            bottom: 60, // tinggi bottom bar
            background: "#fff",
            zIndex: 200,
            overflowY: "auto",
            borderRadius: "16px 16px 0 0",
            boxShadow: "0 -2px 16px #0002",
            padding: "16px 0 0 0",
          }}
        >
          <TasklistDemo user={user} onBack={() => setActiveMenu("Home")} />
        </div>
      )}
      {/* Mobile Pop Up Profile */}
      {activeMenu === "Profile" && (
        <div
          className="mobile-popup-content mobile-only"
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            top: 72, // tinggi logo card
            bottom: 60, // tinggi bottom bar
            background: "#fff",
            zIndex: 200,
            overflowY: "auto",
            borderRadius: "16px 16px 0 0",
            boxShadow: "0 -2px 16px #0002",
          }}
        >
          <Profile
            user={user}
            onClose={() => setActiveMenu("Home")}
            onBack={() => setActiveMenu("Home")}
            onLogout={handleLogout}
          />
        </div>
      )}
      {/* Mobile Pop Up Monitoring - DISABLED */}
      {/* {activeMenu === "Monitoring" && isMobile && (
        <div
          className="mobile-popup-content mobile-only"
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            top: 72, // tinggi logo card
            bottom: 60, // tinggi bottom bar
            background: "#fff",
            zIndex: 200,
            overflowY: "auto",
            borderRadius: "16px 16px 0 0",
            boxShadow: "0 -2px 16px #0002",
            padding: "16px 0 0 0",
          }}
        >
          <MonitoringPage user={user} subMenu="Statistik Fit To Work" />
        </div>
      )} */}
      {activeMenu === "Monitoring" && !isMobile && (
        <>
          {console.log(
            "App - Desktop Monitoring rendered - activeSubMenu:",
            activeSubMenu
          )}
          {activeSubMenu === "Statistik Fit To Work" && (
            <div
              className="monitoring-mobile"
              style={{
                width: "100%",
                height: "100vh",
                margin: "0",
                display: "block",
                padding: "20px 20px 20px 250px",
                boxSizing: "border-box",
                background: "#fff",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                overflow: "auto",
              }}
            >
              {console.log(
                "App - Rendering MonitoringPage for Statistik Fit To Work"
              )}
              <MonitoringPage user={user} subMenu={activeSubMenu} />
            </div>
          )}
          {activeSubMenu === "Take 5" && (
            <div
              className="monitoring-mobile"
              style={{
                width: "100%",
                height: "100vh",
                margin: "0",
                display: "block",
                padding: "20px 20px 20px 250px",
                boxSizing: "border-box",
                background: "#fff",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                overflow: "auto",
              }}
            >
              <MonitoringPage user={user} subMenu={activeSubMenu} />
            </div>
          )}
          {activeSubMenu === "Hazard" && (
            <div
              className="monitoring-mobile"
              style={{
                width: "100%",
                height: "100vh",
                margin: "0",
                display: "block",
                padding: "20px 20px 20px 250px",
                boxSizing: "border-box",
                background: "#fff",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                overflow: "auto",
              }}
            >
              <MonitoringPage user={user} subMenu={activeSubMenu} />
            </div>
          )}
          {activeSubMenu === "PTO" && (
            <div
              style={{
                width: "100%",
                padding: "20px",
                textAlign: "center",
                color: "#666",
              }}
            >
              <h2>Monitoring PTO</h2>
              <p>Fitur monitoring PTO akan segera hadir...</p>
            </div>
          )}
        </>
      )}
      {/* Mobile Bottom Bar */}
      <div
        className="mobile-bottom-bar mobile-only"
        style={{
          display: "none",
          justifyContent: "space-around",
          alignItems: "center",
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100vw",
          height: 60,
          background: "#fff",
          boxShadow: "0 -2px 8px #0001",
          zIndex: 300, // Lebih tinggi dari Profile (200)
        }}
      >
        <button
          onClick={() => handleMenuClick("Home")}
          style={{
            background: "none",
            border: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            color: activeMenu === "Home" ? "#2563eb" : "#6b7280",
            fontSize: 10,
            fontWeight: 600,
            flex: 1,
            padding: "8px 0",
            transition: "color 0.2s ease",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          <span style={{ marginTop: 2 }}>Home</span>
        </button>
        <button
          onClick={() => handleMenuClick("Tasklist")}
          style={{
            background: "none",
            border: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            color: activeMenu === "Tasklist" ? "#2563eb" : "#6b7280",
            fontSize: 12,
            fontWeight: 600,
            flex: 1,
            padding: "8px 0",
            transition: "color 0.2s ease",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
          </svg>
          <span style={{ marginTop: 2 }}>Tasklist</span>
        </button>
        <button
          onClick={() => handleMenuClick("Profile")}
          style={{
            background: "none",
            border: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            color: activeMenu === "Profile" ? "#2563eb" : "#6b7280",
            fontSize: 12,
            fontWeight: 600,
            flex: 1,
            padding: "8px 0",
            transition: "color 0.2s ease",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
          <span style={{ marginTop: 2 }}>Profile</span>
        </button>
      </div>
      {/* Mobile menu CSS (inline for demo) */}
      <style>{`
        .mobile-only { display: none; }
        @media (max-width: 768px) {
          .mobile-only { display: flex !important; }
          .mobile-popup-content.mobile-only { display: block !important; }
          .mobile-header { flex-direction: column; }
          .mobile-main-menu-grid { flex-direction: column; }
          .mobile-bottom-bar { justify-content: space-around; align-items: center; }
          aside, .sidebar { display: none !important; }
          main { padding-left: 0 !important; }
          /* Hide Monitoring on mobile */
          .monitoring-mobile { display: none !important; }
        }
      `}</style>
      {/* Sidebar */}
      <aside
        style={{
          width: 240,
          background: "rgba(30,41,59,0.98)",
          color: "#fff",
          padding: "36px 0",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          minHeight: "100vh",
          boxShadow: "2px 0 16px #0002",
          position: "fixed",
          left: 0,
          top: 0,
          height: "100vh",
          zIndex: 10,
        }}
      >
        <div>
          {/* Foto dan Jabatan */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <img
              src={user.foto || dummyFoto}
              alt="Foto Karyawan"
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid #fff",
                marginBottom: 8,
                boxShadow: "0 2px 8px #6366f133",
                cursor: "pointer",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
              onClick={() => handleMenuClick("Profile")}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = "0 4px 16px #6366f166";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 2px 8px #6366f133";
              }}
              title="Klik untuk membuka Profile"
            />
            <div
              style={{
                fontWeight: "bold",
                fontSize: 16,
                textAlign: "center",
                marginBottom: 4,
                color: "#e0e7ff",
              }}
            >
              {user.nama || "Nama Tidak Diketahui"}
            </div>
            <div
              style={{
                fontSize: 14,
                textAlign: "center",
                marginBottom: 16,
                color: "#94a3b8",
                fontWeight: "500",
              }}
            >
              {user.jabatan || "Jabatan Tidak Diketahui"}
            </div>

            {/* 3 Icon: Notifikasi, Profil, Logout */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 16,
                marginBottom: 24,
              }}
            >
              {/* Icon Notifikasi */}
              <button
                onClick={handleNotificationClick}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  borderRadius: "50%",
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#fff",
                  transition: "all 0.2s ease",
                  position: "relative",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                  e.currentTarget.style.transform = "scale(1.1)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
                title="Notifikasi"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="m13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {notificationCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: -2,
                      right: -2,
                      background: "#ef4444",
                      color: "#fff",
                      borderRadius: "50%",
                      width: 18,
                      height: 18,
                      fontSize: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      border: "2px solid #1e293b",
                    }}
                  >
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                )}
              </button>

              {/* Icon Profil */}
              <button
                onClick={() => handleMenuClick("Profile")}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  borderRadius: "50%",
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#fff",
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                  e.currentTarget.style.transform = "scale(1.1)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
                title="Profil"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </button>

              {/* Icon Logout */}
              <button
                onClick={openLogoutModal}
                style={{
                  background: "rgba(239,68,68,0.2)",
                  border: "none",
                  borderRadius: "50%",
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#fca5a5",
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "rgba(239,68,68,0.3)";
                  e.currentTarget.style.transform = "scale(1.1)";
                  e.currentTarget.style.color = "#fecaca";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "rgba(239,68,68,0.2)";
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.color = "#fca5a5";
                }}
                title="Logout"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16,17 21,12 16,7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          </div>
          {menuItems.map((item) => (
            <div key={item}>
              <button
                style={{
                  background: activeMenu === item ? "#334155" : "none",
                  border: "none",
                  color: "#fff",
                  textAlign: "left",
                  padding: "14px 36px",
                  fontSize: 17,
                  cursor: "pointer",
                  width: "100%",
                  borderRadius: 0,
                  transition: "background 0.2s, font-weight 0.2s",
                  fontWeight: activeMenu === item ? "bold" : "normal",
                  position: "relative",
                  letterSpacing: "0.5px",
                }}
                onClick={() => handleMenuClick(item)}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "#334155")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background =
                    activeMenu === item ? "#334155" : "none")
                }
              >
                {item}
                {item === "Tasklist" && taskNotif && (
                  <span
                    style={{
                      display: "inline-block",
                      marginLeft: 8,
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: "#ef4444",
                      verticalAlign: "middle",
                      position: "absolute",
                      right: 24,
                      top: "50%",
                      transform: "translateY(-50%)",
                      boxShadow: "0 0 0 2px #fff",
                    }}
                  />
                )}
              </button>

              {/* Sub-menu untuk Fit To Work */}
              {item === "Fit To Work" &&
                activeMenu === "Fit To Work" &&
                !isMobile && (
                  <div style={{ background: "#1e293b" }}>
                    {fitToWorkSubMenus.map((subItem) => (
                      <button
                        key={subItem}
                        style={{
                          background:
                            activeSubMenu === subItem ? "#475569" : "none",
                          border: "none",
                          color: "#cbd5e1",
                          textAlign: "left",
                          padding: "10px 36px 10px 60px",
                          fontSize: 15,
                          cursor: "pointer",
                          width: "100%",
                          borderRadius: 0,
                          transition: "background 0.2s, color 0.2s",
                          fontWeight:
                            activeSubMenu === subItem ? "600" : "normal",
                          letterSpacing: "0.3px",
                        }}
                        onClick={() => handleSubMenuClick(subItem)}
                        onMouseOver={(e) => {
                          if (activeSubMenu !== subItem) {
                            e.currentTarget.style.background = "#374151";
                            e.currentTarget.style.color = "#e2e8f0";
                          }
                        }}
                        onMouseOut={(e) => {
                          if (activeSubMenu !== subItem) {
                            e.currentTarget.style.background = "none";
                            e.currentTarget.style.color = "#cbd5e1";
                          }
                        }}
                      >
                        {subItem}
                      </button>
                    ))}
                  </div>
                )}
              {item === "Monitoring" &&
                activeMenu === "Monitoring" &&
                !isMobile && (
                  <div style={{ background: "#1e293b" }}>
                    {monitoringSubMenus.map((subItem) => (
                      <button
                        key={subItem}
                        style={{
                          background:
                            activeSubMenu === subItem ? "#475569" : "none",
                          border: "none",
                          color: "#cbd5e1",
                          textAlign: "left",
                          padding: "10px 36px 10px 60px",
                          fontSize: 15,
                          cursor: "pointer",
                          width: "100%",
                          borderRadius: 0,
                          transition: "background 0.2s, color 0.2s",
                          fontWeight:
                            activeSubMenu === subItem ? "600" : "normal",
                          letterSpacing: "0.3px",
                        }}
                        onClick={() => handleSubMenuClick(subItem)}
                        onMouseOver={(e) => {
                          if (activeSubMenu !== subItem) {
                            e.currentTarget.style.background = "#374151";
                            e.currentTarget.style.color = "#e2e8f0";
                          }
                        }}
                        onMouseOut={(e) => {
                          if (activeSubMenu !== subItem) {
                            e.currentTarget.style.background = "none";
                            e.currentTarget.style.color = "#cbd5e1";
                          }
                        }}
                      >
                        {subItem}
                      </button>
                    ))}
                  </div>
                )}
            </div>
          ))}
        </div>
      </aside>
      {/* Main Content */}
      <main
        className={`main-modern ${
          activeMenu === "Monitoring" ? "monitoring-page" : ""
        }`}
        style={{
          flex: 1,
          height: "100vh",
          paddingLeft: 240,
          display: activeMenu === "Monitoring" ? "block" : "flex",
          alignItems: activeMenu === "Monitoring" ? "stretch" : "center",
          justifyContent: activeMenu === "Monitoring" ? "flex-start" : "center",
          background: activeMenu === "Fit To Work" ? "transparent" : "none",
          overflow:
            activeMenu === "Monitoring"
              ? "auto"
              : activeMenu === "Fit To Work"
              ? "visible"
              : "hidden",
        }}
      >
        {activeMenu === "Tasklist" && <TasklistDemo user={user} />}
        {activeMenu === "Hazard Report" && <HazardForm user={user} />}
        {activeMenu === "Fit To Work" && (
          <>
            {activeSubMenu === "Form Fit To Work" && (
              <FitToWorkForm user={user} />
            )}
            {activeSubMenu === "Validasi Fit To Work" && (
              <FitToWorkValidationNew user={user} />
            )}
          </>
        )}
        {activeMenu === "Validasi Fit To Work" && (
          <FitToWorkValidationNew user={user} />
        )}
        {activeMenu === "Take 5" && (
          <div
            style={{
              width: "100vw",
              minHeight: "100vh",
              background: "#f3f4f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px 0",
            }}
          >
            <Take5Form
              user={user}
              onRedirectHazard={() => setActiveMenu("Hazard Report")}
            />
          </div>
        )}
        {activeMenu === "Monitoring" && !isMobile && (
          <>
            {console.log(
              "App - Desktop Monitoring rendered - activeSubMenu:",
              activeSubMenu
            )}
            {activeSubMenu === "Statistik Fit To Work" && (
              <div
                className="monitoring-mobile"
                style={{
                  width: "100%",
                  height: "100vh",
                  margin: "0",
                  display: "block",
                  padding: "20px 20px 20px 250px",
                  boxSizing: "border-box",
                  background: "#fff",
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  overflow: "auto",
                }}
              >
                {console.log(
                  "App - Rendering MonitoringPage for Statistik Fit To Work"
                )}
                <MonitoringPage user={user} subMenu={activeSubMenu} />
              </div>
            )}
            {activeSubMenu === "Take 5" && (
              <div
                style={{
                  width: "100%",
                  padding: "20px",
                  textAlign: "center",
                  color: "#666",
                }}
              >
                <h2>Monitoring Take 5</h2>
                <p>Fitur monitoring Take 5 akan segera hadir...</p>
              </div>
            )}
            {activeSubMenu === "Hazard" && (
              <div
                style={{
                  width: "100%",
                  padding: "20px",
                  textAlign: "center",
                  color: "#666",
                }}
              >
                <h2>Monitoring Hazard</h2>
                <p>Fitur monitoring Hazard akan segera hadir...</p>
              </div>
            )}
            {activeSubMenu === "PTO" && (
              <div
                style={{
                  width: "100%",
                  padding: "20px",
                  textAlign: "center",
                  color: "#666",
                }}
              >
                <h2>Monitoring PTO</h2>
                <p>Fitur monitoring PTO akan segera hadir...</p>
              </div>
            )}
          </>
        )}
        {activeMenu === "Manajemen User" && <UserManagement user={user} />}
        {activeMenu === "Profile" && (
          <Profile
            user={user}
            onClose={() => setActiveMenu("Home")}
            onBack={() => setActiveMenu("Home")}
            onLogout={handleLogout}
          />
        )}

        {/* Notification Popup */}
        {showNotificationModal && (
          <div
            className="notification-popup"
            style={{
              position: "fixed",
              top: "140px", // Posisi di bawah card profile
              right: "16px",
              left: "16px",
              maxHeight: "60vh", // Tinggi maksimal 60% dari viewport
              background: "#fff",
              borderRadius: "16px",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              border: "1px solid #e5e7eb",
              zIndex: 2000,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              animation: "slideDown 0.3s ease-out",
            }}
          >
            {/* Header */}
            <div
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "#fff",
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderRadius: "16px 16px 0 0",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                  Notifikasi
                </h3>
                <p style={{ margin: "4px 0 0 0", fontSize: 12, opacity: 0.9 }}>
                  {notifications.length} notifikasi baru
                </p>
              </div>
              <button
                onClick={closeNotificationModal}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  borderRadius: "50%",
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#fff",
                  fontSize: "16px",
                }}
              >
                Ã—
              </button>
            </div>

            {/* Content - Scrollable Area */}
            <div
              className="notification-scroll"
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "12px",
                maxHeight: "calc(60vh - 60px)", // Kurangi tinggi header
              }}
            >
              {notifications.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    color: "#6b7280",
                  }}
                >
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    style={{ marginBottom: "12px", opacity: 0.5 }}
                  >
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <path d="m13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  <p style={{ margin: 0, fontSize: "14px" }}>
                    Tidak ada notifikasi baru
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    data-notification-id={notification.id}
                    style={{
                      padding: "12px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "12px",
                      marginBottom: "8px",
                      background: notification.clickable
                        ? notification.priority === "high"
                          ? "#fef7f0"
                          : "#f0f9ff"
                        : notification.priority === "high"
                        ? "#fef2f2"
                        : "#f9fafb",
                      borderLeft: `3px solid ${
                        notification.priority === "high" ? "#ef4444" : "#3b82f6"
                      }`,
                      borderRight: notification.clickable
                        ? "2px solid #10b981"
                        : "1px solid #e5e7eb",
                      transition: "all 0.2s ease",
                      cursor: notification.clickable ? "pointer" : "default",
                      opacity: notification.clickable ? 1 : 0.8,
                    }}
                    onClick={() => handleNotificationItemClick(notification)}
                    onMouseEnter={(e) => {
                      if (notification.clickable) {
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow =
                          "0 4px 12px rgba(0,0,0,0.1)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (notification.clickable) {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          color:
                            notification.priority === "high"
                              ? "#ef4444"
                              : "#3b82f6",
                          marginTop: "1px",
                          flexShrink: 0,
                        }}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4
                          style={{
                            margin: "0 0 3px 0",
                            fontSize: "13px",
                            fontWeight: "600",
                            color: "#1f2937",
                            lineHeight: "1.3",
                          }}
                        >
                          {notification.title}
                        </h4>
                        <p
                          style={{
                            margin: "0 0 6px 0",
                            fontSize: "12px",
                            color: "#6b7280",
                            lineHeight: "1.4",
                            wordBreak: "break-word",
                          }}
                        >
                          {notification.message}
                        </p>
                        <div
                          style={{
                            fontSize: "10px",
                            color: "#9ca3af",
                          }}
                        >
                          {new Date(notification.timestamp).toLocaleString(
                            "id-ID",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </div>
                        {notification.clickable && (
                          <div
                            style={{
                              fontSize: "10px",
                              color: "#10b981",
                              fontWeight: "600",
                              marginTop: "4px",
                            }}
                          >
                            Klik untuk aksi
                          </div>
                        )}
                      </div>
                      {/* Arrow indicator - hanya untuk notifikasi yang bisa diklik */}
                      {notification.clickable && (
                        <div
                          style={{
                            color: "#9ca3af",
                            marginLeft: "8px",
                            flexShrink: 0,
                          }}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="9,18 15,12 9,6" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Logout Confirmation Modal */}
        {showLogoutModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 3000,
              animation: "fadeIn 0.3s ease-out",
            }}
            onClick={closeLogoutModal}
          >
            <div
              className="logout-popup"
              style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "32px",
                maxWidth: "400px",
                width: "90%",
                textAlign: "center",
                boxShadow:
                  "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                animation: "fadeIn 0.3s ease-out",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Icon */}
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                  boxShadow: "0 8px 16px rgba(239, 68, 68, 0.3)",
                }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16,17 21,12 16,7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>

              {/* Title */}
              <h2
                style={{
                  margin: "0 0 12px 0",
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#1f2937",
                }}
              >
                Konfirmasi Logout
              </h2>

              {/* Message */}
              <p
                style={{
                  margin: "0 0 32px 0",
                  fontSize: "16px",
                  color: "#6b7280",
                  lineHeight: "1.5",
                }}
              >
                Apakah Anda yakin ingin keluar dari aplikasi?
                <br />
                <span style={{ fontSize: "14px", color: "#9ca3af" }}>
                  Semua data yang belum disimpan akan hilang.
                </span>
              </p>

              {/* Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "center",
                }}
              >
                <button
                  onClick={closeLogoutModal}
                  style={{
                    background: "#f3f4f6",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    padding: "12px 24px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    minWidth: "100px",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#e5e7eb";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "#f3f4f6";
                  }}
                >
                  Batal
                </button>
                <button
                  onClick={handleLogout}
                  style={{
                    background:
                      "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                    border: "none",
                    borderRadius: "8px",
                    padding: "12px 24px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#fff",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    minWidth: "100px",
                    boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 16px rgba(239, 68, 68, 0.4)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(239, 68, 68, 0.3)";
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

// Tambahkan komponen demo untuk menampilkan alur form tasklist
function TasklistDemo({ user, onBack }) {
  const [hazards, setHazards] = React.useState([]);
  const [selectedHazard, setSelectedHazard] = React.useState(null);
  const [status, setStatus] = React.useState(null);
  const [mainPage, setMainPage] = React.useState(1);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);
  const [activeTab, setActiveTab] = React.useState("todo"); // todo, monitoring, riwayat
  const pageSize = 5;

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  React.useEffect(() => {
    async function fetchHazards() {
      const { data } = await supabase
        .from("hazard_report")
        .select("*")
        .order("created_at", { ascending: false });
      setHazards(data || []);

      // Debug: log data hazard jika ada yang Submit
      if (data) {
        const submitData = data.filter((h) => h.status === "Submit");
        if (submitData.length > 0) {
          console.log("Submit hazards found:", submitData.length);
        }
      }
    }
    fetchHazards();
    const interval = setInterval(fetchHazards, 5000);
    return () => clearInterval(interval);
  }, []);

  // Reset pagination when tab changes
  React.useEffect(() => {
    setMainPage(1);
  }, [activeTab]);

  // Definisikan helper di dalam komponen agar tidak undefined
  const userNama = user?.nama;
  const isPIC = (hz) => hz.pic && hz.pic === userNama;
  const isPelapor = (hz) => hz.pelapor_nama && hz.pelapor_nama === userNama;
  const isEvaluator = (hz) =>
    hz.evaluator_nama && hz.evaluator_nama === userNama;
  const isRelated = (hz) => isPIC(hz) || isPelapor(hz) || isEvaluator(hz);

  // Helper function untuk warna status
  const getStatusColor = (status) => {
    switch (status) {
      case "Submit":
        return "#f59e0b";
      case "Open":
        return "#3b82f6";
      case "Progress":
        return "#8b5cf6";
      case "Done":
        return "#10b981";
      case "Closed":
        return "#6b7280";
      case "Reject at Open":
        return "#ef4444";
      case "Reject at Done":
        return "#dc2626";
      default:
        return "#6b7280";
    }
  };

  // Filtering table utama: hanya hazard yang perlu aksi user
  const getReadOnly = (status, hz) => {
    // Tab "monitoring" dan "riwayat" selalu read-only
    if (activeTab === "monitoring" || activeTab === "riwayat") {
      return true;
    }

    // Tab "todo": logic berdasarkan status dan role di hazard_report
    if (
      status === "Submit" ||
      status === "Reject at Open" ||
      status === "Progress" ||
      status === "Reject at Done"
    ) {
      // Hanya PIC yang bisa aksi
      return !isPIC(hz);
    }
    if (status === "Open") {
      // Hanya Pelapor yang bisa aksi
      return !isPelapor(hz);
    }
    if (status === "Done") {
      // Hanya Evaluator yang bisa aksi
      return !isEvaluator(hz);
    }
    return true;
  };

  // Table utama: hanya hazard yang statusnya belum Closed dan user terkait
  const mainHazards = hazards.filter(
    (hz) => hz.status !== "Closed" && isRelated(hz)
  );
  const mainHazardsPageCount = Math.ceil(mainHazards.length / pageSize);
  const mainHazardsToShow = mainHazards.slice(
    (mainPage - 1) * pageSize,
    mainPage * pageSize
  );

  // Table riwayat: hanya status Closed, user terkait (tapi hanya PIC/pelapor, evaluator hanya jika dia juga PIC/pelapor)
  const riwayatHazards = hazards.filter(
    (hz) => hz.status === "Closed" && (isPIC(hz) || isPelapor(hz))
  );

  // Data berdasarkan tab yang aktif dan role user
  const getTabData = () => {
    const userRole = (user?.role || "").toLowerCase();

    // Debug: log semua hazard dan user info
    // Debug: log hazard dengan status Submit untuk troubleshooting
    const submitHazards = hazards.filter((hz) => hz.status === "Submit");
    if (submitHazards.length > 0) {
      console.log("=== TASKLIST DEBUG ===");
      console.log("User Role:", userRole, "| User:", userNama);
      console.log("Submit Hazards:", submitHazards.length);
    }

    switch (activeTab) {
      case "todo": {
        // Logic berdasarkan role yang wajib mengerjakan tasklist
        const todoData = hazards.filter((hz) => {
          // Status "Submit": hanya PIC yang bisa aksi
          if (hz.status === "Submit" && isPIC(hz)) {
            return true;
          }
          // Status "Open": hanya Pelapor yang bisa aksi
          if (hz.status === "Open" && isPelapor(hz)) {
            return true;
          }
          // Status "Progress": hanya PIC yang bisa aksi
          if (hz.status === "Progress" && isPIC(hz)) {
            return true;
          }
          // Status "Reject at Open": hanya PIC yang bisa aksi
          if (hz.status === "Reject at Open" && isPIC(hz)) {
            return true;
          }
          // Status "Reject at Done": hanya PIC yang bisa aksi
          if (hz.status === "Reject at Done" && isPIC(hz)) {
            return true;
          }
          // Status "Done": hanya Evaluator yang bisa aksi
          if (hz.status === "Done" && isEvaluator(hz)) {
            return true;
          }
          return false;
        });
        console.log("To Do Data (Role-based Action Required):", todoData);
        return todoData;
      }

      case "monitoring": {
        // Logic berdasarkan role di hazard_report, bukan role di users
        const monitoringData = hazards.filter((hz) => {
          // Jika user terlibat (sebagai pelapor, PIC, atau evaluator) dan status bukan Closed
          if (isRelated(hz) && hz.status !== "Closed") {
            return true;
          }
          return false;
        });
        console.log("Monitoring Data (All Read-Only):", monitoringData);
        return monitoringData;
      }

      case "riwayat": {
        // Riwayat: status Closed untuk semua user yang terlibat di hazard_report
        return hazards.filter((hz) => hz.status === "Closed" && isRelated(hz));
      }

      default: {
        return [];
      }
    }
  };

  const currentTabData = getTabData();
  const currentTabPageCount = Math.ceil(currentTabData.length / pageSize);
  const currentTabDataToShow = currentTabData.slice(
    (mainPage - 1) * pageSize,
    mainPage * pageSize
  );

  if (!selectedHazard) {
    // Mobile view
    if (isMobile) {
      return (
        <div style={{ padding: "16px" }}>
          <div style={{ position: "relative", marginBottom: 8 }}>
            <h3
              style={{
                color: "#232946",
                fontWeight: 700,
                fontSize: 20,
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              Tasklist
            </h3>
          </div>
          <div
            style={{
              textAlign: "center",
              fontSize: 12,
              color: "#6b7280",
              marginBottom: 16,
              fontWeight: 500,
            }}
          >
            Role: {(user?.role || "").toUpperCase()}
          </div>

          {/* Tab Navigation */}
          <div
            style={{
              display: "flex",
              background: "#f3f4f6",
              borderRadius: 12,
              padding: 4,
              marginBottom: 20,
            }}
          >
            <button
              onClick={() => {
                setActiveTab("todo");
                setMainPage(1);
              }}
              style={{
                flex: 1,
                background: activeTab === "todo" ? "#2563eb" : "transparent",
                color: activeTab === "todo" ? "#fff" : "#6b7280",
                border: "none",
                borderRadius: 8,
                padding: "12px 8px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              To Do
            </button>
            <button
              onClick={() => {
                setActiveTab("monitoring");
                setMainPage(1);
              }}
              style={{
                flex: 1,
                background:
                  activeTab === "monitoring" ? "#2563eb" : "transparent",
                color: activeTab === "monitoring" ? "#fff" : "#6b7280",
                border: "none",
                borderRadius: 8,
                padding: "12px 8px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Monitoring
            </button>
            <button
              onClick={() => {
                setActiveTab("riwayat");
                setMainPage(1);
              }}
              style={{
                flex: 1,
                background: activeTab === "riwayat" ? "#2563eb" : "transparent",
                color: activeTab === "riwayat" ? "#fff" : "#6b7280",
                border: "none",
                borderRadius: 8,
                padding: "12px 8px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Riwayat
            </button>
          </div>

          {currentTabData.length === 0 ? (
            <div style={{ textAlign: "center", marginTop: 64 }}>
              <div style={{ fontSize: 60, opacity: 0.15, marginBottom: 8 }}>
                {activeTab === "todo"
                  ? "ðŸ“‹"
                  : activeTab === "monitoring"
                  ? "ðŸ“Š"
                  : "ðŸ“š"}
              </div>
              <div style={{ color: "#888", fontWeight: 600, marginTop: 12 }}>
                {activeTab === "todo"
                  ? "Tidak ada tugas yang perlu dikerjakan"
                  : activeTab === "monitoring"
                  ? "Tidak ada tugas dalam monitoring"
                  : "Tidak ada riwayat tugas"}
              </div>
            </div>
          ) : (
            <div>
              {currentTabDataToShow.map((hz) => (
                <div
                  key={hz.id}
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    boxShadow: "0 1px 4px #0001",
                    margin: "0 0 16px 0",
                    padding: 16,
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        color: "#22c55e",
                        fontSize: 14,
                      }}
                    >
                      #{hz.id}
                    </span>
                    <span
                      style={{
                        background: getStatusColor(hz.status),
                        color: "#fff",
                        borderRadius: 8,
                        padding: "4px 8px",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {hz.status}
                    </span>
                  </div>

                  <div
                    style={{
                      color: "#232946",
                      fontWeight: 600,
                      fontSize: 16,
                      marginBottom: 8,
                    }}
                  >
                    {hz.lokasi} - {hz.detail_lokasi}
                  </div>

                  <div
                    style={{ color: "#666", fontSize: 14, marginBottom: 12 }}
                  >
                    {hz.deskripsi_temuan?.substring(0, 100)}...
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ fontSize: 12, color: "#888" }}>
                      Pelapor:{" "}
                      <span style={{ color: "#232946", fontWeight: 600 }}>
                        {hz.pelapor_nama}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#888" }}>
                      PIC:{" "}
                      <span style={{ color: "#232946", fontWeight: 600 }}>
                        {hz.pic}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#888" }}>
                      Due Date:{" "}
                      <span style={{ color: "#232946", fontWeight: 600 }}>
                        {hz.due_date
                          ? new Date(hz.due_date).toLocaleDateString("id-ID")
                          : "-"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedHazard(hz);
                      setStatus(hz.status);
                    }}
                    style={{
                      width: "100%",
                      background: "#2563eb",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "12px",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Lihat Detail
                  </button>
                </div>
              ))}

              {/* Pagination for mobile */}
              {currentTabPageCount > 1 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 8,
                    marginTop: 20,
                  }}
                >
                  <button
                    onClick={() => setMainPage((p) => Math.max(1, p - 1))}
                    disabled={mainPage === 1}
                    style={{
                      background: mainPage === 1 ? "#e5e7eb" : "#2563eb",
                      color: mainPage === 1 ? "#9ca3af" : "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "8px 12px",
                      fontSize: 14,
                      cursor: mainPage === 1 ? "not-allowed" : "pointer",
                    }}
                  >
                    â†
                  </button>
                  <span
                    style={{
                      padding: "8px 12px",
                      fontSize: 14,
                      color: "#6b7280",
                    }}
                  >
                    {mainPage} / {currentTabPageCount}
                  </span>
                  <button
                    onClick={() =>
                      setMainPage((p) => Math.min(currentTabPageCount, p + 1))
                    }
                    disabled={mainPage === currentTabPageCount}
                    style={{
                      background:
                        mainPage === currentTabPageCount
                          ? "#e5e7eb"
                          : "#2563eb",
                      color:
                        mainPage === currentTabPageCount ? "#9ca3af" : "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "8px 12px",
                      fontSize: 14,
                      cursor:
                        mainPage === currentTabPageCount
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    â†’
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // Desktop view (existing code)
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
        <h3
          style={{
            color: "#232946",
            fontWeight: 800,
            fontSize: 28,
            marginBottom: 16,
          }}
        >
          Daftar Hazard Report
        </h3>
        <div style={{ width: 1100, margin: "0 auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 16,
              background: "#fff",
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 2px 16px #0001",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#232946",
                  color: "#fff",
                  fontWeight: 700,
                }}
              >
                <th
                  style={{
                    border: "1px solid #ccc",
                    padding: 12,
                    maxWidth: 60,
                  }}
                >
                  No
                </th>
                <th
                  style={{
                    border: "1px solid #ccc",
                    padding: 12,
                    maxWidth: 160,
                  }}
                >
                  Site
                </th>
                <th
                  style={{
                    border: "1px solid #ccc",
                    padding: 12,
                    maxWidth: 160,
                  }}
                >
                  Nama Pelapor
                </th>
                <th
                  style={{
                    border: "1px solid #ccc",
                    padding: 12,
                    maxWidth: 160,
                  }}
                >
                  NRP Pelapor
                </th>
                <th
                  style={{
                    border: "1px solid #ccc",
                    padding: 12,
                    maxWidth: 160,
                  }}
                >
                  PIC
                </th>
                <th
                  style={{
                    border: "1px solid #ccc",
                    padding: 12,
                    maxWidth: 120,
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    border: "1px solid #ccc",
                    padding: 12,
                    maxWidth: 120,
                  }}
                >
                  Due Date
                </th>
                <th
                  style={{
                    border: "1px solid #ccc",
                    padding: 12,
                    maxWidth: 100,
                  }}
                >
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {mainHazardsToShow.length > 0 ? (
                mainHazardsToShow.map((hz, idx) => (
                  <tr
                    key={hz.id}
                    style={{
                      background: idx % 2 === 0 ? "#f3f4f6" : "#fff",
                      color: "#232946",
                    }}
                  >
                    <td
                      style={{
                        border: "1px solid #ccc",
                        padding: 12,
                        color: "#232946",
                        maxWidth: 60,
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {(mainPage - 1) * pageSize + idx + 1}
                    </td>
                    <td
                      style={{
                        border: "1px solid #ccc",
                        padding: 12,
                        color: "#232946",
                        maxWidth: 160,
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {hz.lokasi || "-"}
                    </td>
                    <td
                      style={{
                        border: "1px solid #ccc",
                        padding: 12,
                        color: "#232946",
                        maxWidth: 160,
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {hz.pelapor_nama?.length > 15
                        ? hz.pelapor_nama.slice(0, 13) + "..."
                        : hz.pelapor_nama || "-"}
                    </td>
                    <td
                      style={{
                        border: "1px solid #ccc",
                        padding: 12,
                        color: "#232946",
                        maxWidth: 160,
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {hz.pelapor_nrp || "-"}
                    </td>
                    <td
                      style={{
                        border: "1px solid #ccc",
                        padding: 12,
                        color: "#232946",
                        maxWidth: 160,
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {hz.pic?.length > 15
                        ? hz.pic.slice(0, 13) + "..."
                        : hz.pic || "-"}
                    </td>
                    <td
                      style={{
                        border: "1px solid #ccc",
                        padding: 12,
                        color: "#232946",
                        maxWidth: 120,
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          color:
                            hz.status === "Done"
                              ? "#10b981"
                              : hz.status === "Closed"
                              ? "#6366f1"
                              : "#232946",
                          background: "#fff",
                          borderRadius: 8,
                          padding: "4px 12px",
                          border: `1.5px solid ${
                            hz.status === "Done"
                              ? "#10b981"
                              : hz.status === "Closed"
                              ? "#6366f1"
                              : "#232946"
                          }`,
                        }}
                      >
                        {hz.status || "-"}
                      </span>
                    </td>
                    <td
                      style={{
                        border: "1px solid #ccc",
                        padding: 12,
                        color: "#232946",
                        maxWidth: 120,
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {hz.due_date || "-"}
                    </td>
                    <td
                      style={{
                        border: "1px solid #ccc",
                        padding: 12,
                        maxWidth: 100,
                      }}
                    >
                      <button
                        style={{
                          background: "#232946",
                          color: "#fff",
                          border: "none",
                          borderRadius: 8,
                          padding: "8px 18px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          setSelectedHazard(hz);
                          setStatus(hz.status || "Submit");
                        }}
                      >
                        Lihat
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    style={{
                      padding: "40px 20px",
                      textAlign: "center",
                      color: "#888",
                      fontStyle: "italic",
                      fontSize: "16px",
                    }}
                  >
                    Belum ada tasklist
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Navigasi halaman untuk mainHazards */}
        {mainHazardsPageCount > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              margin: "16px 0",
            }}
          >
            {Array.from({ length: mainHazardsPageCount }, (_, i) => (
              <button
                key={i}
                onClick={() => setMainPage(i + 1)}
                style={{
                  minWidth: 32,
                  height: 32,
                  borderRadius: 6,
                  border: "1px solid #ccc",
                  background: mainPage === i + 1 ? "#232946" : "#fff",
                  color: mainPage === i + 1 ? "#fff" : "#232946",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}

        {/* Table Riwayat - selalu tampilkan */}
        <div style={{ width: 1100, margin: "40px auto 0 auto" }}>
          <h3
            style={{
              color: "#232946",
              fontWeight: 800,
              fontSize: 28,
              marginBottom: 16,
            }}
          >
            Riwayat Hazard Report
          </h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 16,
              background: "#fff",
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 2px 16px #0001",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#232946",
                  color: "#fff",
                  fontWeight: 700,
                }}
              >
                <th
                  style={{
                    border: "1px solid #ccc",
                    padding: 12,
                    maxWidth: 60,
                  }}
                >
                  No
                </th>
                <th
                  style={{
                    border: "1px solid #ccc",
                    padding: 12,
                    maxWidth: 160,
                  }}
                >
                  Site
                </th>
                <th
                  style={{
                    border: "1px solid #ccc",
                    padding: 12,
                    maxWidth: 160,
                  }}
                >
                  Nama Pelapor
                </th>
                <th
                  style={{
                    border: "1px solid #ccc",
                    padding: 12,
                    maxWidth: 160,
                  }}
                >
                  NRP Pelapor
                </th>
                <th
                  style={{
                    border: "1px solid #ccc",
                    padding: 12,
                    maxWidth: 160,
                  }}
                >
                  PIC
                </th>
                <th
                  style={{
                    border: "1px solid #ccc",
                    padding: 12,
                    maxWidth: 120,
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    border: "1px solid #ccc",
                    padding: 12,
                    maxWidth: 120,
                  }}
                >
                  Due Date
                </th>
                <th
                  style={{
                    border: "1px solid #ccc",
                    padding: 12,
                    maxWidth: 100,
                  }}
                >
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {riwayatHazards.length > 0 ? (
                riwayatHazards.map((hz, idx) => (
                  <tr
                    key={hz.id}
                    style={{
                      background: idx % 2 === 0 ? "#f3f4f6" : "#fff",
                      color: "#232946",
                    }}
                  >
                    <td
                      style={{
                        border: "1px solid #ccc",
                        padding: 12,
                        color: "#232946",
                        maxWidth: 60,
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {idx + 1}
                    </td>
                    <td
                      style={{
                        border: "1px solid #ccc",
                        padding: 12,
                        color: "#232946",
                        maxWidth: 160,
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {hz.lokasi || "-"}
                    </td>
                    <td
                      style={{
                        border: "1px solid #ccc",
                        padding: 12,
                        color: "#232946",
                        maxWidth: 160,
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {hz.pelapor_nama?.length > 15
                        ? hz.pelapor_nama.slice(0, 13) + "..."
                        : hz.pelapor_nama || "-"}
                    </td>
                    <td
                      style={{
                        border: "1px solid #ccc",
                        padding: 12,
                        color: "#232946",
                        maxWidth: 160,
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {hz.pelapor_nrp || "-"}
                    </td>
                    <td
                      style={{
                        border: "1px solid #ccc",
                        padding: 12,
                        color: "#232946",
                        maxWidth: 160,
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {hz.pic?.length > 15
                        ? hz.pic.slice(0, 13) + "..."
                        : hz.pic || "-"}
                    </td>
                    <td
                      style={{
                        border: "1px solid #ccc",
                        padding: 12,
                        color: "#232946",
                        maxWidth: 120,
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          color: "#6366f1",
                          background: "#fff",
                          borderRadius: 8,
                          padding: "4px 12px",
                          border: "1.5px solid #6366f1",
                        }}
                      >
                        {hz.status || "-"}
                      </span>
                    </td>
                    <td
                      style={{
                        border: "1px solid #ccc",
                        padding: 12,
                        color: "#232946",
                        maxWidth: 120,
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {hz.due_date || "-"}
                    </td>
                    <td
                      style={{
                        border: "1px solid #ccc",
                        padding: 12,
                        maxWidth: 100,
                      }}
                    >
                      <button
                        style={{
                          background: "#232946",
                          color: "#fff",
                          border: "none",
                          borderRadius: 8,
                          padding: "8px 18px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          setSelectedHazard(hz);
                          setStatus(hz.status || "Submit");
                        }}
                      >
                        Lihat
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    style={{
                      padding: "40px 20px",
                      textAlign: "center",
                      color: "#888",
                      fontStyle: "italic",
                      fontSize: "16px",
                    }}
                  >
                    Belum ada data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Render form sesuai status hazard yang dipilih
  const handleCloseCard = () => {
    setSelectedHazard(null);
    setStatus(null);
  };

  // Mobile wrapper untuk form
  if (isMobile && selectedHazard) {
    return (
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          top: 72,
          bottom: 60,
          background: "#fff",
          zIndex: 300,
          overflowY: "auto",
        }}
      >
        <TasklistForm
          user={user}
          status={status}
          hazard={selectedHazard}
          readOnly={getReadOnly(status, selectedHazard)}
          onSuccess={handleCloseCard}
          onClose={handleCloseCard}
        />
      </div>
    );
  }

  // Desktop form rendering
  if (status === "Submit") {
    return (
      <TasklistForm
        user={user}
        status="Submit"
        hazard={selectedHazard}
        readOnly={getReadOnly("Submit", selectedHazard)}
        onSuccess={handleCloseCard}
        onClose={handleCloseCard}
      />
    );
  }
  if (status === "Open") {
    return (
      <TasklistForm
        user={user}
        status="Open"
        hazard={selectedHazard}
        readOnly={getReadOnly("Open", selectedHazard)}
        onSuccess={handleCloseCard}
        onClose={handleCloseCard}
      />
    );
  }
  if (status === "Reject at Open") {
    return (
      <TasklistForm
        user={user}
        status="Reject at Open"
        hazard={selectedHazard}
        readOnly={getReadOnly("Reject at Open", selectedHazard)}
        onSuccess={handleCloseCard}
        onClose={handleCloseCard}
      />
    );
  }
  if (status === "Progress") {
    return (
      <TasklistForm
        user={user}
        status="Progress"
        hazard={selectedHazard}
        readOnly={getReadOnly("Progress", selectedHazard)}
        onSuccess={handleCloseCard}
        onClose={handleCloseCard}
      />
    );
  }
  if (status === "Done") {
    return (
      <TasklistForm
        user={user}
        status="Done"
        hazard={selectedHazard}
        readOnly={getReadOnly("Done", selectedHazard)}
        onSuccess={handleCloseCard}
        onClose={handleCloseCard}
      />
    );
  }
  if (status === "Reject at Done") {
    return (
      <TasklistForm
        user={user}
        status="Reject at Done"
        hazard={selectedHazard}
        readOnly={getReadOnly("Reject at Done", selectedHazard)}
        onSuccess={handleCloseCard}
        onClose={handleCloseCard}
      />
    );
  }
  if (status === "Closed") {
    return (
      <TasklistForm
        user={user}
        status="Done"
        hazard={selectedHazard}
        readOnly={getReadOnly("Done", selectedHazard)}
        onSuccess={handleCloseCard}
        onClose={handleCloseCard}
      />
    );
  }
  return null;
}
// Trigger deployment - 08/02/2025 07:14:36

// Trigger Vercel deployment - 2025-08-02 07:30:03

// New deployment trigger
