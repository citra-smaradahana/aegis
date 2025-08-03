import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

function FitToWorkValidationFormNew({
  validation,
  user,
  onUpdate,
  onClose,
  onBack,
}) {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Options for validasi_tahap1
  const validasiTahap1Options = [
    "Mengistirahatkan pekerja sementara",
    "Konsultasi masalah dengan pengawas",
    "Obat yang diminum tidak mempengaruhi kinerja",
    "Obat tidak menyebabkan kantuk",
    "Lainnya",
  ];

  // Options for validasi_tahap2
  const validasiTahap2Options = ["Ya", "Tidak"];

  useEffect(() => {
    if (validation) {
      setFormData({
        validasi_tahap1: validation.validasi_tahap1 || "",
        validasi_tahap2: validation.validasi_tahap2 || "",
        catatan_tahap1: validation.catatan_tahap1 || "",
        catatan_tahap2: validation.catatan_tahap2 || "",
      });
    }
  }, [validation]);

  const canEditLevel1 = () => {
    if (!user || !validation) return false;

    const userJabatan = user.jabatan;
    const userSite = user.site;

    // Site validation
    if (userSite !== validation.site) return false;

    // Level 1 can only edit if status is Pending
    if (validation.workflow_status !== "Pending") return false;

    // Check if user can validate this person based on jabatan hierarchy
    if (userJabatan === "Leading Hand") {
      return [
        "Crew",
        "Mekanik",
        "Quality Controller",
        "Operator MMU",
        "Operator Plant",
      ].includes(validation.jabatan);
    } else if (userJabatan === "Asst. Penanggung Jawab Operasional") {
      return ["Blaster", "Leading Hand"].includes(validation.jabatan);
    }

    return false;
  };

  const canEditLevel2 = () => {
    if (!user || !validation) return false;

    const userJabatan = user.jabatan;
    const userSite = user.site;

    console.log("=== canEditLevel2 DEBUG ===");
    console.log("User jabatan:", userJabatan);
    console.log("User site:", userSite);
    console.log("Validation jabatan:", validation.jabatan);
    console.log("Validation site:", validation.site);
    console.log("Validation workflow_status:", validation.workflow_status);

    // Site validation
    if (userSite !== validation.site) {
      console.log("Site validation failed");
      return false;
    }

    // Check if user can validate this person based on jabatan hierarchy
    if (userJabatan === "SHE") {
      // SHE can validate anyone who has completed Level 1 or is Admin
      const canValidate =
        validation.workflow_status === "Level1_Review" ||
        validation.jabatan === "Admin";
      console.log("SHE validation check:", canValidate);
      return canValidate;
    } else if (userJabatan === "Penanggung Jawab Operasional") {
      // PJO can validate Asst. PJO, SHERQ Officer, Technical Service directly from Pending
      const validJabatan = [
        "Asst. Penanggung Jawab Operasional",
        "SHERQ Officer",
        "Technical Service",
      ];
      const validWorkflow = ["Pending", "Level1_Review"];

      const canValidate =
        validJabatan.includes(validation.jabatan) &&
        validWorkflow.includes(validation.workflow_status);

      console.log("PJO validation check:");
      console.log(
        "- Valid jabatan:",
        validJabatan.includes(validation.jabatan)
      );
      console.log(
        "- Valid workflow:",
        validWorkflow.includes(validation.workflow_status)
      );
      console.log("- Final result:", canValidate);

      return canValidate;
    }

    console.log("No matching jabatan found");
    return false;
  };

  const isFormValid = () => {
    if (canEditLevel1()) {
      return formData.validasi_tahap1 && formData.validasi_tahap1.trim() !== "";
    }
    if (canEditLevel2()) {
      return formData.validasi_tahap2 && formData.validasi_tahap2.trim() !== "";
    }
    return false;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("=== SUBMIT VALIDATION DEBUG ===");
    console.log("User jabatan:", user.jabatan);
    console.log("Validation jabatan:", validation.jabatan);
    console.log("Validation workflow_status:", validation.workflow_status);
    console.log("canEditLevel1():", canEditLevel1());
    console.log("canEditLevel2():", canEditLevel2());
    console.log("Form data:", formData);

    if (!isFormValid()) {
      setError("Mohon lengkapi semua field yang diperlukan");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const now = new Date().toISOString();
      const updatedValidation = { ...validation };

      if (canEditLevel1()) {
        console.log("Processing Level 1 validation");
        // Level 1 validation
        updatedValidation.validasi_tahap1 = formData.validasi_tahap1;
        updatedValidation.catatan_tahap1 = formData.catatan_tahap1;
        updatedValidation.reviewer_tahap1_nama = user.nama;
        updatedValidation.reviewer_tahap1_jabatan = user.jabatan;
        updatedValidation.reviewed_tahap1_at = now;
        updatedValidation.workflow_status = "Level1_Review";
        updatedValidation.updated_at = now;
      } else if (canEditLevel2()) {
        console.log("Processing Level 2 validation");
        // Level 2 validation
        updatedValidation.validasi_tahap2 = formData.validasi_tahap2;
        updatedValidation.catatan_tahap2 = formData.catatan_tahap2;
        updatedValidation.reviewer_tahap2_nama = user.nama;
        updatedValidation.reviewer_tahap2_jabatan = user.jabatan;
        updatedValidation.reviewed_tahap2_at = now;
        updatedValidation.workflow_status = "Closed";
        updatedValidation.updated_at = now;

        // Update status_fatigue based on validasi_tahap2
        if (formData.validasi_tahap2 === "Ya") {
          updatedValidation.status_fatigue = "Fit To Work";
        } else {
          updatedValidation.status_fatigue = "Not Fit To Work";
        }
      } else {
        console.log("ERROR: Neither Level 1 nor Level 2 validation is allowed");
        throw new Error(
          "Anda tidak memiliki izin untuk melakukan validasi ini"
        );
      }

      console.log("Final updatedValidation:", updatedValidation);

      const result = await onUpdate(updatedValidation);

      if (result.error) {
        throw new Error(result.error);
      }

      console.log("Validation updated successfully");
      onClose();
    } catch (error) {
      console.error("Error updating validation:", error);
      setError(`Gagal mengupdate validasi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderFitToWorkData = () => {
    if (!validation) return null;

    return (
      <div
        style={{
          backgroundColor: "#f8f9fa",
          border: "1px solid #dee2e6",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <h3 style={{ margin: "0 0 15px 0", color: "#333" }}>
          Data Fit To Work
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "15px",
          }}
        >
          <div>
            <strong>Nama:</strong> {validation.nama}
          </div>
          <div>
            <strong>NRP:</strong> {validation.nrp}
          </div>
          <div>
            <strong>Jabatan:</strong> {validation.jabatan}
          </div>
          <div>
            <strong>Site:</strong> {validation.site}
          </div>
          <div>
            <strong>Status Fatigue:</strong>
            <span
              style={{
                color:
                  validation.status_fatigue === "Fit To Work"
                    ? "#28a745"
                    : "#dc3545",
                fontWeight: "bold",
              }}
            >
              {validation.status_fatigue}
            </span>
          </div>
          <div>
            <strong>Workflow Status:</strong>
            <span
              style={{
                color:
                  validation.workflow_status === "Closed"
                    ? "#28a745"
                    : "#ffc107",
                fontWeight: "bold",
              }}
            >
              {validation.workflow_status.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Fit To Work Questions */}
        <div style={{ marginTop: "15px" }}>
          <h4 style={{ margin: "0 0 10px 0", color: "#555" }}>
            Jawaban Fit To Work:
          </h4>
          <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
            <div>
              <strong>Q1:</strong> Apakah Anda tidak mengkonsumsi obat yang
              dapat mempengaruhi kemampuan bekerja?
            </div>
            <div style={{ marginLeft: "20px", color: "#666" }}>
              Jawaban: {validation.tidak_mengkonsumsi_obat ? "Ya" : "Tidak"}
            </div>

            <div style={{ marginTop: "8px" }}>
              <strong>Q2:</strong> Apakah Anda tidak memiliki masalah
              pribadi/keluarga yang berpotensi mengganggu konsentrasi kerja?
            </div>
            <div style={{ marginLeft: "20px", color: "#666" }}>
              Jawaban: {validation.tidak_ada_masalah_pribadi ? "Ya" : "Tidak"}
            </div>

            <div style={{ marginTop: "8px" }}>
              <strong>Q3:</strong> Saya menyatakan bahwa saya dalam kondisi
              sehat dan siap untuk bekerja dengan aman.
            </div>
            <div style={{ marginLeft: "20px", color: "#666" }}>
              Jawaban: {validation.siap_bekerja ? "Ya" : "Tidak"}
            </div>

            {validation.catatan_obat && (
              <div style={{ marginTop: "8px" }}>
                <strong>Catatan Obat:</strong>
                <div style={{ marginLeft: "20px", color: "#666" }}>
                  {validation.catatan_obat}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderLevel1Form = () => {
    if (!canEditLevel1()) return null;

    return (
      <div
        style={{
          backgroundColor: "white",
          border: "1px solid #dee2e6",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <h3 style={{ margin: "0 0 15px 0", color: "#333" }}>
          Validasi Tahap 1 - {user.jabatan}
        </h3>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Tindakan yang Dilakukan: *
          </label>
          <select
            value={formData.validasi_tahap1 || ""}
            onChange={(e) =>
              handleInputChange("validasi_tahap1", e.target.value)
            }
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
            }}
            required
          >
            <option value="">Pilih tindakan...</option>
            {validasiTahap1Options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Catatan Tambahan:
          </label>
          <textarea
            value={formData.catatan_tahap1 || ""}
            onChange={(e) =>
              handleInputChange("catatan_tahap1", e.target.value)
            }
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
              minHeight: "80px",
              resize: "vertical",
            }}
            placeholder="Tambahkan catatan atau penjelasan detail..."
          />
        </div>
      </div>
    );
  };

  const renderLevel2Form = () => {
    if (!canEditLevel2()) return null;

    return (
      <div
        style={{
          backgroundColor: "white",
          border: "1px solid #dee2e6",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <h3 style={{ margin: "0 0 15px 0", color: "#333" }}>
          Validasi Tahap 2 - {user.jabatan}
        </h3>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Rekomendasi Final: *
          </label>
          <div style={{ display: "flex", gap: "15px" }}>
            {validasiTahap2Options.map((option) => (
              <label
                key={option}
                style={{ display: "flex", alignItems: "center", gap: "5px" }}
              >
                <input
                  type="radio"
                  name="validasi_tahap2"
                  value={option}
                  checked={formData.validasi_tahap2 === option}
                  onChange={(e) =>
                    handleInputChange("validasi_tahap2", e.target.value)
                  }
                  required
                />
                {option}
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Catatan Tambahan:
          </label>
          <textarea
            value={formData.catatan_tahap2 || ""}
            onChange={(e) =>
              handleInputChange("catatan_tahap2", e.target.value)
            }
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
              minHeight: "80px",
              resize: "vertical",
            }}
            placeholder="Tambahkan catatan atau penjelasan detail..."
          />
        </div>
      </div>
    );
  };

  if (!validation) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <div>Data validasi tidak ditemukan</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          paddingBottom: "15px",
          borderBottom: "1px solid #dee2e6",
          position: "relative",
        }}
      >
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            style={{
              position: "absolute",
              left: "0px",
              top: "8px",
              background: "none",
              border: "none",
              color: "#3b82f6",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "8px",
              zIndex: 20,
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        )}
        <h2 style={{ margin: 0, color: "#333", textAlign: "center", flex: 1 }}>
          Validasi Fit To Work
        </h2>
        <button
          onClick={onClose}
          style={{
            padding: "8px 16px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Kembali ke List
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Fit To Work Data */}
        {renderFitToWorkData()}

        {/* Level 1 Form */}
        {renderLevel1Form()}

        {/* Level 2 Form */}
        {renderLevel2Form()}

        {/* Error Message */}
        {error && (
          <div
            style={{
              backgroundColor: "#f8d7da",
              color: "#721c24",
              padding: "10px",
              borderRadius: "4px",
              marginBottom: "15px",
              border: "1px solid #f5c6cb",
            }}
          >
            {error}
          </div>
        )}

        {/* Submit Button */}
        {(canEditLevel1() || canEditLevel2()) && (
          <div style={{ textAlign: "center" }}>
            <button
              type="submit"
              disabled={loading || !isFormValid()}
              style={{
                padding: "12px 24px",
                backgroundColor:
                  loading || !isFormValid() ? "#6c757d" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: loading || !isFormValid() ? "not-allowed" : "pointer",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              {loading ? "Menyimpan..." : "Simpan Validasi"}
            </button>
          </div>
        )}

        {/* Read-only message */}
        {!canEditLevel1() && !canEditLevel2() && (
          <div
            style={{
              backgroundColor: "#e2e3e5",
              color: "#383d41",
              padding: "15px",
              borderRadius: "4px",
              textAlign: "center",
              border: "1px solid #d6d8db",
            }}
          >
            Anda tidak memiliki akses untuk melakukan validasi pada data ini.
          </div>
        )}
      </form>
    </div>
  );
}

export default FitToWorkValidationFormNew;
