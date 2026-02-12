import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import FitToWorkValidationListNew from "./FitToWorkValidationListNew";
import FitToWorkValidationFormNew from "./FitToWorkValidationFormNew";
import MobileHeader from "../MobileHeader";
import MobileBottomNavigation from "../MobileBottomNavigation";

function FitToWorkValidationNew({ user, onBack }) {
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

      let query = supabase
        .from("fit_to_work")
        .select("*")
        .eq("site", userSite) // Site-based filtering
        .eq("status_fatigue", "Not Fit To Work"); // Only show Not Fit To Work entries

      // Apply workflow status filter if not "all" (termasuk value "" dari dropdown Semua Status)
      if (filterStatus && filterStatus !== "all") {
        query = query.eq("workflow_status", filterStatus);
        console.log(
          "fetchValidations - Applied workflow status filter:",
          filterStatus
        );
      }

      // Filter berdasarkan jabatan validator dan workflow status yang bisa diakses
      if (userJabatan === "Plant Leading Hand") {
        // Plant Leading Hand hanya bisa melihat status Pending untuk Mekanik dan Operator Plant
        query = query
          .in("jabatan", [
            "Mekanik",
            "Operator Plant",
          ])
          .eq("workflow_status", "Pending");
        console.log("fetchValidations - Plant Leading Hand filter applied");
      } else if (userJabatan === "Field Leading Hand") {
        // Field Leading Hand hanya bisa melihat status Pending untuk Crew Blasting, Operator MMU, Quality Control
        query = query
          .in("jabatan", [
            "Blaster", // Crew Blasting
            "Crew Blasting", // Jika ada variasi nama
            "Operator MMU",
            "Quality Controller",
            "Quality Control", // Jika ada variasi nama
          ])
          .eq("workflow_status", "Pending");
        console.log("fetchValidations - Field Leading Hand filter applied");
      } else if (userJabatan === "Asst. Penanggung Jawab Operasional") {
        // Asst. PJO hanya bisa melihat status Pending untuk jabatan tertentu
        query = query
          .in("jabatan", ["Blaster", "Field Leading Hand", "Plant Leading Hand"])
          .eq("workflow_status", "Pending");
        console.log("fetchValidations - Asst. PJO filter applied");
      } else if (userJabatan === "Penanggung Jawab Operasional") {
        // PJO bisa melihat status Level1_Review dan Pending untuk jabatan yang divalidasi PJO
        query = query
          .in("jabatan", [
            "Asst. Penanggung Jawab Operasional",
            "SHERQ Officer",
            "Technical Service",
            "Field Leading Hand",
            "Plant Leading Hand",
          ])
          .in("workflow_status", ["Pending", "Level1_Review", "Level1 Review"]);
        console.log("fetchValidations - PJO filter applied");
      } else if (userJabatan === "SHE") {
        // SHE bisa melihat status Level1_Review dan Pending untuk semua jabatan
        query = query.in("workflow_status", [
          "Pending",
          "Level1_Review",
          "Level1 Review",
        ]);
        console.log("fetchValidations - SHE filter applied");
      } else if (userJabatan === "SHERQ Officer") {
        // SHERQ Officer bisa melihat status Level1_Review untuk semua jabatan
        // Debug: Check for both possible values
        query = query.in("workflow_status", ["Level1_Review", "Level1 Review"]);
        console.log(
          "fetchValidations - SHERQ Officer filter applied (checking both Level1_Review and Level1 Review)"
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

    // Force refresh data
    fetchValidations();

    // Clear any cached data
    setValidations([]);

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
            }
            // Handle other navigation if needed
          }}
        />
      )}
    </div>
  );
}

export default FitToWorkValidationNew;
