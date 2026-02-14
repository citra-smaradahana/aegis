import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import FitToWorkValidationListNew from "./FitToWorkValidationListNew";
import FitToWorkValidationFormNew from "./FitToWorkValidationFormNew";
import MobileHeader from "../MobileHeader";
import MobileBottomNavigation from "../MobileBottomNavigation";

function FitToWorkValidationNew({ user, onBack, onNavigate }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [validations, setValidations] = useState([]);
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
      const userJabatan = user.jabatan;
      const userSite = user.site;

      console.log("fetchValidations - User:", user);
      console.log("fetchValidations - User Jabatan:", userJabatan);
      console.log("fetchValidations - User Site:", userSite);
      console.log("fetchValidations - filterStatus:", filterStatus);

      // Pakai initial_status_fatigue agar record yang divalidasi jadi "Fit To Work"
      // (status_fatigue berubah) tetap masuk ke Selesai/Closed
      let query = supabase
        .from("fit_to_work")
        .select("*")
        .eq("site", userSite)
        .or("initial_status_fatigue.eq.Not Fit To Work,status_fatigue.eq.Not Fit To Work") // Awal Not Fit ATAU saat ini masih Not Fit
        .order("created_at", { ascending: false })
        .limit(10000);

      // Semua validator melihat seluruh validasi (untuk memantau tahap 1 dan tahap 2).
      // Filter workflow hanya dari dropdown; tidak filter by jabatan.
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
    } catch (error) {
      console.error("Error in fetchValidations:", error);
      setError("Terjadi kesalahan saat mengambil data validasi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("=== FIT TO WORK VALIDATION NEW COMPONENT MOUNT ===");
    console.log("Component - userJabatan:", user?.jabatan);
    console.log("Component - userSite:", user?.site);
    console.log("Component - filterStatus:", filterStatus);

    // Force refresh data (all-time, no date filter)
    fetchValidations();

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

      // Refresh the validations list
      await fetchValidations();

      return { success: true, error: null };
    } catch (error) {
      console.error("Error in handleValidationUpdate:", error);
      return { error: error.message };
    }
  };

  const handleCloseForm = () => {
    setSelectedValidation(null);
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
          onClick={fetchValidations}
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
        paddingBottom: isMobile ? 80 : 0, // Space untuk bottom nav di mobile
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
          onValidationSelect={handleValidationSelect}
          filterStatus={filterStatus}
          onFilterChange={setFilterStatus}
          onBack={onBack}
          user={user}
          onUpdate={handleValidationUpdate}
          isMobile={isMobile}
        />
      </div>

      {/* Bottom Navigation untuk Mobile */}
      {isMobile && (
        <MobileBottomNavigation
          activeTab="home"
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
