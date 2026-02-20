import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import FitToWorkValidationListNew from "./FitToWorkValidationListNew";
import FitToWorkValidationFormNew from "./FitToWorkValidationFormNew";
import MobileHeader from "../MobileHeader";
import MobileBottomNavigation from "../MobileBottomNavigation";
import {
  fetchUsersNotYetFilledFTW,
  fetchUsersAttendanceForValidator,
  markUserOff,
  fetchUsersMarkedOffToday,
  unmarkUserOff,
  canReviseOffStatus,
  canMarkUserOff,
  getSubordinateJabatansForValidator,
} from "../../utils/fitToWorkAbsentHelpers";
import { fetchActiveMandatesForUser } from "../../utils/mandateHelpers";

function FitToWorkValidationNew({ user, onBack, onNavigate, tasklistTodoCount = 0 }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [validations, setValidations] = useState([]);
  const [usersNotFilled, setUsersNotFilled] = useState([]);
  const [usersMarkedOff, setUsersMarkedOff] = useState([]);
  const [usersAttendance, setUsersAttendance] = useState([]);
  const [selectedValidation, setSelectedValidation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  // Handle responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch validations berdasarkan jabatan user
  const fetchValidations = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      console.log("=== FETCH VALIDATIONS NEW - START ===");
      const userJabatan = (user.jabatan || "").trim().replace(/\s+/g, " ");
      const userSite = user.site;

      console.log("fetchValidations - User:", user);
      console.log("fetchValidations - User Jabatan:", userJabatan);
      console.log("fetchValidations - User Site:", userSite);
      console.log("fetchValidations - filterStatus:", filterStatus);

      // Dapatkan jabatan bawahan yang boleh dilihat validator (FLH tidak lihat Mekanik/Operator Plant kecuali ada mandat PLH)
      let mandates = [];
      if (userJabatan === "Field Leading Hand") {
        mandates = await fetchActiveMandatesForUser(user.id, userSite);
      }
      const subordinateJabatans = getSubordinateJabatansForValidator(
        userJabatan,
        mandates
      );

      // null = lihat semua (PJO, Asst PJO, SHERQ, Admin). [] = tidak ada akses. [...] = filter by jabatan.
      if (subordinateJabatans && subordinateJabatans.length === 0) {
        setValidations([]);
        setLoading(false);
        return;
      }

      // Pakai initial_status_fatigue agar record yang divalidasi jadi "Fit To Work"
      // (status_fatigue berubah) tetap masuk ke Selesai/Closed
      let query = supabase
        .from("fit_to_work")
        .select("*")
        .eq("site", userSite)
        .or("initial_status_fatigue.eq.Not Fit To Work,status_fatigue.eq.Not Fit To Work") // Awal Not Fit ATAU saat ini masih Not Fit
        .order("created_at", { ascending: false })
        .limit(10000);

      // Filter by jabatan: FLH hanya lihat bawahan (bukan Mekanik/Operator Plant tanpa mandat); PLH hanya lihat Mekanik & Operator Plant
      if (subordinateJabatans && subordinateJabatans.length > 0) {
        query = query.in("jabatan", subordinateJabatans);
        console.log("fetchValidations - Filter jabatan:", subordinateJabatans);
      }

      if (filterStatus && filterStatus !== "all") {
        query = query.eq("workflow_status", filterStatus);
        console.log(
          "fetchValidations - Applied workflow status filter:",
          filterStatus
        );
      }

      console.log(
        "fetchValidations - Query conditions applied for jabatan:",
        userJabatan
      );

      const { data: validationsData, error: validationsError } = await query;

      if (validationsError) {
        console.error("Error fetching validations:", validationsError);
        setError("Gagal mengambil data validasi");
        setLoading(false);
        return;
      }

      console.log("fetchValidations - Raw validations data:", validationsData);
      console.log(
        "fetchValidations - Number of validations found:",
        validationsData?.length || 0
      );

      if (!validationsData || validationsData.length === 0) {
        console.log("fetchValidations - No validations found");
        setValidations([]);
        setLoading(false);
        return;
      }

      // Debug: Log setiap validasi yang ditemukan
      validationsData.forEach((validation, index) => {
        console.log(`fetchValidations - Validation ${index + 1}:`, {
          id: validation.id,
          nama: validation.nama,
          jabatan: validation.jabatan,
          workflow_status: validation.workflow_status,
          status_fatigue: validation.status_fatigue,
        });
      });

      setValidations(validationsData);
      console.log("=== FETCH VALIDATIONS NEW - END ===");
    } catch (err) {
      console.error("Error in fetchValidations:", err);
      setError("Terjadi kesalahan saat mengambil data validasi");
    } finally {
      setLoading(false);
    }
  };

  // Fetch users yang belum isi Fit To Work hari ini (untuk section Belum Isi FTW)
  const fetchUsersNotFilled = async () => {
    if (!user) return;
    try {
      const data = await fetchUsersNotYetFilledFTW(user);
      setUsersNotFilled(data || []);
    } catch (err) {
      console.error("Error fetching users not filled:", err);
    }
  };

  // Fetch users yang sudah ditandai off hari ini (untuk revisi oleh PJO/Asst PJO/SHERQ)
  const fetchUsersMarkedOff = async () => {
    if (!user) return;
    try {
      const data = await fetchUsersMarkedOffToday(user);
      setUsersMarkedOff(data || []);
    } catch (err) {
      console.error("Error fetching users marked off:", err);
    }
  };

  const fetchUsersAttendance = async () => {
    if (!user) return;
    try {
      const data = await fetchUsersAttendanceForValidator(user);
      setUsersAttendance(data || []);
    } catch (err) {
      console.error("Error fetching users attendance summary:", err);
    }
  };

  useEffect(() => {
    console.log("=== FIT TO WORK VALIDATION NEW COMPONENT MOUNT ===");
    console.log("Component - userJabatan:", user?.jabatan);
    console.log("Component - userSite:", user?.site);
    console.log("Component - filterStatus:", filterStatus);

    // Fetch validasi (Perlu Tindakan) + users belum isi FTW (Belum Isi Hari Ini)
    const load = async () => {
      setLoading(true);
      try {
        await Promise.all([
          (async () => {
            await fetchValidations();
          })(),
          fetchUsersNotFilled(),
          fetchUsersMarkedOff(),
          fetchUsersAttendance(),
        ]);
      } finally {
        setLoading(false);
      }
    };
    load();

    console.log("=== COMPONENT MOUNT COMPLETE ===");
  }, [user, filterStatus]);

  const handleValidationSelect = (validation) => {
    setSelectedValidation(validation);
  };

  const handleValidationUpdate = async (updatedValidation) => {
    try {
      console.log(
        "handleValidationUpdate - Updating validation:",
        updatedValidation
      );

      // Pastikan status dan status_fatigue selalu sinkron
      // Jika status_fatigue diupdate, pastikan status juga diupdate
      if (updatedValidation.status_fatigue && !updatedValidation.status) {
        updatedValidation.status = updatedValidation.status_fatigue;
      }
      if (updatedValidation.status && !updatedValidation.status_fatigue) {
        updatedValidation.status_fatigue = updatedValidation.status;
      }

      console.log("handleValidationUpdate - Final update payload:", {
        id: updatedValidation.id,
        status: updatedValidation.status,
        status_fatigue: updatedValidation.status_fatigue,
        workflow_status: updatedValidation.workflow_status,
      });

      const { data, error } = await supabase
        .from("fit_to_work")
        .update(updatedValidation)
        .eq("id", updatedValidation.id)
        .select();

      if (error) {
        console.error("Error updating validation:", error);
        throw new Error(`Gagal mengupdate validasi: ${error.message}`);
      }

      console.log("handleValidationUpdate - Success:", data);
      console.log("handleValidationUpdate - Updated record:", {
        id: data[0]?.id,
        status: data[0]?.status,
        status_fatigue: data[0]?.status_fatigue,
        workflow_status: data[0]?.workflow_status,
      });

      // Refresh both lists
      await fetchValidations();
      await fetchUsersNotFilled();
      await fetchUsersMarkedOff();
      await fetchUsersAttendance();

      return { success: true, error: null };
    } catch (error) {
      console.error("Error in handleValidationUpdate:", error);
      return { error: error.message };
    }
  };

  const handleCloseForm = () => {
    setSelectedValidation(null);
  };

  const handleMarkUserOff = async (targetUser) => {
    const result = await markUserOff(targetUser.id, user);
    if (result?.error) {
      console.error("Error marking user off:", result.error);
      return;
    }
    await Promise.all([fetchUsersNotFilled(), fetchUsersMarkedOff(), fetchUsersAttendance()]);
  };

  const handleUnmarkUserOff = async (targetUser) => {
    const result = await unmarkUserOff(targetUser.id);
    if (result?.error) {
      console.error("Error unmarking user off:", result.error);
      return;
    }
    await Promise.all([fetchUsersNotFilled(), fetchUsersMarkedOff(), fetchUsersAttendance()]);
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <div>Memuat data validasi...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "20px", color: "red" }}>
        <div>Error: {error}</div>
        <button
          onClick={() => {
            setError(null);
            const load = async () => {
              setLoading(true);
              try {
                await Promise.all([
                  (async () => { await fetchValidations(); })(),
                  fetchUsersNotFilled(),
                  fetchUsersMarkedOff(),
                  fetchUsersAttendance(),
                ]);
              } finally {
                setLoading(false);
              }
            };
            load();
          }}
          style={{
            marginTop: "10px",
            padding: "8px 16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: isMobile ? "#f8fafc" : "transparent",
        paddingBottom: isMobile ? 120 : 0, // Space agar card terakhir tidak tertutup bottom nav
      }}
    >
      {/* Mobile Header */}
      {isMobile && (
        <MobileHeader
          user={user}
          onBack={onBack}
          title="Validasi Fit To Work"
          showBack={true}
        />
      )}

      <div
        style={{
          marginTop: isMobile ? 60 : 0, // Space untuk mobile header
          padding: isMobile ? "0 20px" : "0",
        }}
      >
        <FitToWorkValidationListNew
          validations={validations}
          usersNotFilled={usersNotFilled}
          usersMarkedOff={usersMarkedOff}
          usersAttendance={usersAttendance}
          onValidationSelect={handleValidationSelect}
          onMarkUserOff={handleMarkUserOff}
          onUnmarkUserOff={handleUnmarkUserOff}
          canReviseOff={canReviseOffStatus(user?.jabatan)}
          canMarkUserOff={canMarkUserOff(user?.jabatan)}
          filterStatus={filterStatus}
          onFilterChange={setFilterStatus}
          onBack={onBack}
          user={user}
          onUpdate={handleValidationUpdate}
          isMobile={isMobile}
          tasklistTodoCount={tasklistTodoCount}
        />
      </div>

      {/* Bottom Navigation untuk Mobile */}
      {isMobile && (
        <MobileBottomNavigation
          activeTab="home"
          tasklistTodoCount={tasklistTodoCount}
          onNavigate={(tab) => {
            if (tab === "home") {
              onBack && onBack();
            } else if (tab === "tasklist" || tab === "profile") {
              onNavigate && onNavigate(tab);
            }
          }}
        />
      )}
    </div>
  );
}

export default FitToWorkValidationNew;
