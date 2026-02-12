import React, { useState, useEffect } from "react";
import MobileHeader from "../MobileHeader";
import MobileBottomNavigation from "../MobileBottomNavigation";

function FitToWorkValidationFormNew({
  validation,
  user,
  onUpdate,
  onClose,
  onBack,
  isMobile = false,
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
  const validasiTahap2Options = ["Fit", "Not Fit"];

  useEffect(() => {
    if (validation) {
      setFormData({
        validasi_tahap1: validation.validasi_tahap1 || "",
        validasi_tahap2: "", // Reset untuk validasi Level 2 yang baru
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
    if (userJabatan === "Plant Leading Hand") {
      // Plant Leading Hand hanya bisa validasi Mekanik dan Operator Plant
      return [
        "Mekanik",
        "Operator Plant",
      ].includes(validation.jabatan);
    } else if (userJabatan === "Field Leading Hand") {
      // Field Leading Hand hanya bisa validasi Crew Blasting, Operator MMU, Quality Control
      return [
        "Blaster", // Crew Blasting
        "Crew Blasting", // Jika ada variasi nama
        "Operator MMU",
        "Quality Controller",
        "Quality Control", // Jika ada variasi nama
      ].includes(validation.jabatan);
    } else if (userJabatan === "Asst. Penanggung Jawab Operasional") {
      return ["Blaster", "Field Leading Hand", "Plant Leading Hand"].includes(validation.jabatan);
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
    } else if (userJabatan === "SHERQ Officer") {
      // SHERQ Officer can validate anyone who has completed Level 1 or is Admin
      const canValidate =
        validation.workflow_status === "Level1_Review" ||
        validation.jabatan === "Admin";
      console.log("SHERQ Officer validation check:", canValidate);
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

        // Update status_fatigue DAN status berdasarkan validasi_tahap2
        // Pastikan kedua kolom sinkron agar tampilan di form Fit To Work juga terupdate
        if (formData.validasi_tahap2 === "Fit") {
          updatedValidation.status_fatigue = "Fit To Work";
          updatedValidation.status = "Fit To Work"; // Update kolom status juga
        } else {
          updatedValidation.status_fatigue = "Not Fit To Work";
          updatedValidation.status = "Not Fit To Work"; // Update kolom status juga
        }
        
        console.log("Level 2 validation - Updated status:", {
          status_fatigue: updatedValidation.status_fatigue,
          status: updatedValidation.status,
          validasi_tahap2: formData.validasi_tahap2
        });
      } else {
        console.log("ERROR: Neither Level 1 nor Level 2 validation is allowed");
        throw new Error(
          "Anda tidak memiliki izin untuk melakukan validasi ini"
        );
      }

      console.log("Final updatedValidation:", updatedValidation);

      const result = await onUpdate(updatedValidation);

      if (result && result.error) {
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
          backgroundColor: "#1f2937",
          border: "1px solid #374151",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
        }}
      >
        <h3
          style={{
            margin: "0 0 20px 0",
            color: "#e5e7eb",
            fontWeight: 600,
            fontSize: "18px",
          }}
        >
          Data Fit To Work
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          <div>
            <label
              style={{
                color: "#9ca3af",
                fontSize: "12px",
                fontWeight: "600",
                display: "block",
                marginBottom: "4px",
              }}
            >
              Nama
            </label>
            <div style={{ color: "#e5e7eb", fontSize: "14px" }}>
              {validation.nama}
            </div>
          </div>
          <div>
            <label
              style={{
                color: "#9ca3af",
                fontSize: "12px",
                fontWeight: "600",
                display: "block",
                marginBottom: "4px",
              }}
            >
              NRP
            </label>
            <div style={{ color: "#e5e7eb", fontSize: "14px" }}>
              {validation.nrp}
            </div>
          </div>
          <div>
            <label
              style={{
                color: "#9ca3af",
                fontSize: "12px",
                fontWeight: "600",
                display: "block",
                marginBottom: "4px",
              }}
            >
              Jabatan
            </label>
            <div style={{ color: "#e5e7eb", fontSize: "14px" }}>
              {validation.jabatan}
            </div>
          </div>
          <div>
            <label
              style={{
                color: "#9ca3af",
                fontSize: "12px",
                fontWeight: "600",
                display: "block",
                marginBottom: "4px",
              }}
            >
              Site
            </label>
            <div style={{ color: "#e5e7eb", fontSize: "14px" }}>
              {validation.site}
            </div>
          </div>
          <div>
            <label
              style={{
                color: "#9ca3af",
                fontSize: "12px",
                fontWeight: "600",
                display: "block",
                marginBottom: "4px",
              }}
            >
              Status Fatigue
            </label>
            <div
              style={{
                color:
                  validation.status_fatigue === "Fit" ||
                  validation.status_fatigue === "Fit To Work"
                    ? "#10b981"
                    : "#ef4444",
                fontWeight: "600",
                fontSize: "14px",
              }}
            >
              {validation.status_fatigue}
            </div>
          </div>
          <div>
            <label
              style={{
                color: "#9ca3af",
                fontSize: "12px",
                fontWeight: "600",
                display: "block",
                marginBottom: "4px",
              }}
            >
              Workflow Status
            </label>
            <div
              style={{
                color:
                  validation.workflow_status === "Closed"
                    ? "#10b981"
                    : "#f59e0b",
                fontWeight: "600",
                fontSize: "14px",
              }}
            >
              {validation.workflow_status.replace("_", " ")}
            </div>
          </div>
        </div>

        {/* Fit To Work Questions */}
        <div style={{ marginTop: "20px" }}>
          <h4
            style={{
              margin: "0 0 16px 0",
              color: "#e5e7eb",
              fontWeight: 600,
              fontSize: "16px",
            }}
          >
            Jawaban Fit To Work:
          </h4>
          <div style={{ fontSize: "14px", lineHeight: "1.5" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "12px",
                alignItems: "center",
                marginBottom: "8px",
                padding: "8px 12px",
                backgroundColor: "#111827",
                borderRadius: "6px",
                border: "1px solid #374151",
              }}
            >
              <div style={{ color: "#e5e7eb", fontSize: "13px" }}>
                Q1: Tidak mengkonsumsi obat yang mempengaruhi kerja
              </div>
              <div
                style={{
                  color: validation.tidak_mengkonsumsi_obat
                    ? "#10b981"
                    : "#ef4444",
                  fontWeight: "600",
                  fontSize: "13px",
                }}
              >
                {validation.tidak_mengkonsumsi_obat ? "Ya" : "Tidak"}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "12px",
                alignItems: "center",
                marginBottom: "8px",
                padding: "8px 12px",
                backgroundColor: "#111827",
                borderRadius: "6px",
                border: "1px solid #374151",
              }}
            >
              <div style={{ color: "#e5e7eb", fontSize: "13px" }}>
                Q2: Tidak ada masalah pribadi/keluarga
              </div>
              <div
                style={{
                  color: validation.tidak_ada_masalah_pribadi
                    ? "#10b981"
                    : "#ef4444",
                  fontWeight: "600",
                  fontSize: "13px",
                }}
              >
                {validation.tidak_ada_masalah_pribadi ? "Ya" : "Tidak"}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "12px",
                alignItems: "center",
                marginBottom: "8px",
                padding: "8px 12px",
                backgroundColor: "#111827",
                borderRadius: "6px",
                border: "1px solid #374151",
              }}
            >
              <div style={{ color: "#e5e7eb", fontSize: "13px" }}>
                Q3: Siap bekerja dengan aman
              </div>
              <div
                style={{
                  color: validation.siap_bekerja ? "#10b981" : "#ef4444",
                  fontWeight: "600",
                  fontSize: "13px",
                }}
              >
                {validation.siap_bekerja ? "Ya" : "Tidak"}
              </div>
            </div>

            {validation.catatan_obat && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "12px",
                  backgroundColor: "#111827",
                  borderRadius: "6px",
                  border: "1px solid #374151",
                }}
              >
                <div
                  style={{
                    color: "#e5e7eb",
                    fontWeight: "600",
                    marginBottom: "8px",
                    fontSize: "13px",
                  }}
                >
                  Catatan Obat:
                </div>
                <div
                  style={{
                    color: "#9ca3af",
                    fontSize: "13px",
                    lineHeight: "1.4",
                  }}
                >
                  {validation.catatan_obat}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detail Status Fatigue */}
        {validation.status_fatigue === "Not Fit To Work" && (
          <div style={{ marginTop: "20px" }}>
            <h4
              style={{
                margin: "0 0 16px 0",
                color: "#e5e7eb",
                fontWeight: 600,
                fontSize: "16px",
              }}
            >
              Detail Status Not Fit To Work:
            </h4>
            <div
              style={{
                padding: "16px",
                backgroundColor: "#7f1d1d",
                borderRadius: "8px",
                border: "1px solid #dc2626",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "16px",
                  marginBottom: "12px",
                }}
              >
                <div>
                  <label
                    style={{
                      color: "#fecaca",
                      fontSize: "12px",
                      fontWeight: "600",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Jam Tidur
                  </label>
                  <div
                    style={{
                      color: "#fecaca",
                      fontSize: "14px",
                      fontWeight: "600",
                    }}
                  >
                    {validation.jam_tidur || "Tidak diisi"}
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      color: "#fecaca",
                      fontSize: "12px",
                      fontWeight: "600",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Jam Bangun
                  </label>
                  <div
                    style={{
                      color: "#fecaca",
                      fontSize: "14px",
                      fontWeight: "600",
                    }}
                  >
                    {validation.jam_bangun || "Tidak diisi"}
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      color: "#fecaca",
                      fontSize: "12px",
                      fontWeight: "600",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Total Jam Tidur
                  </label>
                  <div
                    style={{
                      color: "#fecaca",
                      fontSize: "14px",
                      fontWeight: "600",
                    }}
                  >
                    {(() => {
                      if (!validation.jam_tidur || !validation.jam_bangun) {
                        return "Tidak dapat dihitung";
                      }

                      try {
                        const jamTidur = new Date(
                          `2000-01-01T${validation.jam_tidur}`
                        );
                        const jamBangun = new Date(
                          `2000-01-01T${validation.jam_bangun}`
                        );

                        // Jika jam bangun lebih kecil dari jam tidur, berarti tidur sampai hari berikutnya
                        if (jamBangun < jamTidur) {
                          jamBangun.setDate(jamBangun.getDate() + 1);
                        }

                        const diffMs = jamBangun - jamTidur;
                        const diffHours = diffMs / (1000 * 60 * 60);

                        return `${diffHours.toFixed(1)} jam`;
                      } catch (error) {
                        return "Format waktu tidak valid";
                      }
                    })()}
                  </div>
                </div>
              </div>

              <div>
                <label
                  style={{
                    color: "#fecaca",
                    fontSize: "12px",
                    fontWeight: "600",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Penjelasan Singkat
                </label>
                <div
                  style={{
                    color: "#fecaca",
                    fontSize: "13px",
                    lineHeight: "1.4",
                  }}
                >
                  {(() => {
                    const reasons = [];

                    // Calculate total jam tidur
                    let totalJamTidur = null;
                    if (validation.jam_tidur && validation.jam_bangun) {
                      try {
                        const jamTidur = new Date(
                          `2000-01-01T${validation.jam_tidur}`
                        );
                        const jamBangun = new Date(
                          `2000-01-01T${validation.jam_bangun}`
                        );

                        if (jamBangun < jamTidur) {
                          jamBangun.setDate(jamBangun.getDate() + 1);
                        }

                        const diffMs = jamBangun - jamTidur;
                        totalJamTidur = diffMs / (1000 * 60 * 60);
                      } catch (error) {
                        totalJamTidur = null;
                      }
                    }

                    // Check jam tidur
                    if (totalJamTidur && totalJamTidur < 6) {
                      reasons.push(
                        `Karyawan memiliki jam tidur kurang dari 6 jam (${totalJamTidur.toFixed(1)} jam)`
                      );
                    }

                    // Check obat
                    if (!validation.tidak_mengkonsumsi_obat) {
                      reasons.push(
                        "Karyawan mengkonsumsi obat yang mempengaruhi kerja"
                      );
                    }

                    // Check masalah pribadi
                    if (!validation.tidak_ada_masalah_pribadi) {
                      reasons.push(
                        "Karyawan memiliki masalah pribadi/keluarga"
                      );
                    }

                    // Check kesiapan kerja
                    if (!validation.siap_bekerja) {
                      reasons.push("Karyawan tidak siap bekerja dengan aman");
                    }

                    if (reasons.length === 0) {
                      return "Status Not Fit To Work ditentukan berdasarkan evaluasi fatigue dan kondisi kesehatan karyawan. Sebaiknya berikan istirahat sejenak untuk memastikan kesiapan kerja yang optimal.";
                    }

                    return (
                      reasons.join(". ") +
                      ". Sebaiknya berikan istirahat sejenak untuk memenuhi persyaratan keselamatan kerja."
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderLevel1Form = () => {
    if (!canEditLevel1()) return null;

    return (
      <div
        style={{
          backgroundColor: "#1f2937",
          border: "1px solid #374151",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
        }}
      >
        <h3
          style={{
            margin: "0 0 20px 0",
            color: "#e5e7eb",
            fontWeight: 600,
            fontSize: "18px",
          }}
        >
          Validasi Tahap 1 - {user.jabatan}
        </h3>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "600",
              color: "#e5e7eb",
              fontSize: "14px",
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
              padding: "12px",
              border: "1px solid #374151",
              borderRadius: "8px",
              fontSize: "14px",
              backgroundColor: "#111827",
              color: "#e5e7eb",
              outline: "none",
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

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "600",
              color: "#e5e7eb",
              fontSize: "14px",
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
              padding: "12px",
              border: "1px solid #374151",
              borderRadius: "8px",
              fontSize: "14px",
              minHeight: "80px",
              resize: "vertical",
              backgroundColor: "#111827",
              color: "#e5e7eb",
              outline: "none",
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
          backgroundColor: "#1f2937",
          border: "1px solid #374151",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
        }}
      >
        {/* Laporan Validasi Tahap 1 */}
        {validation.workflow_status === "Level1_Review" && (
          <div style={{ marginBottom: "24px" }}>
            <h4
              style={{
                margin: "0 0 16px 0",
                color: "#e5e7eb",
                fontWeight: 600,
                fontSize: "16px",
              }}
            >
              Laporan Validasi Tahap 1
            </h4>
            <div
              style={{
                backgroundColor: "#111827",
                border: "1px solid #374151",
                borderRadius: "8px",
                padding: "16px",
              }}
            >
              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    color: "#9ca3af",
                    fontSize: "12px",
                    fontWeight: "600",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Validator
                </label>
                <div style={{ color: "#e5e7eb", fontSize: "14px" }}>
                  {validation.reviewer_tahap1_nama || "Tidak diisi"} (
                  {validation.reviewer_tahap1_jabatan || "Tidak diisi"})
                </div>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    color: "#9ca3af",
                    fontSize: "12px",
                    fontWeight: "600",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Tindakan yang Dilakukan
                </label>
                <div style={{ color: "#e5e7eb", fontSize: "14px" }}>
                  {validation.validasi_tahap1 || "Tidak diisi"}
                </div>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    color: "#9ca3af",
                    fontSize: "12px",
                    fontWeight: "600",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Catatan
                </label>
                <div style={{ color: "#e5e7eb", fontSize: "14px" }}>
                  {validation.catatan_tahap1 || "Tidak ada catatan"}
                </div>
              </div>

              <div>
                <label
                  style={{
                    color: "#9ca3af",
                    fontSize: "12px",
                    fontWeight: "600",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Tanggal Validasi
                </label>
                <div style={{ color: "#e5e7eb", fontSize: "14px" }}>
                  {validation.reviewed_tahap1_at
                    ? new Date(validation.reviewed_tahap1_at).toLocaleString(
                        "id-ID",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )
                    : "Tidak diisi"}
                </div>
              </div>
            </div>
          </div>
        )}

        <h3
          style={{
            margin: "0 0 20px 0",
            color: "#e5e7eb",
            fontWeight: 600,
            fontSize: "18px",
          }}
        >
          Validasi Tahap 2 - {user.jabatan}
        </h3>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "600",
              color: "#e5e7eb",
              fontSize: "14px",
            }}
          >
            Rekomendasi Final: *
          </label>
          <div style={{ display: "flex", gap: "16px" }}>
            {/* Tombol Fit To Work */}
            <button
              type="button"
              onClick={() => handleInputChange("validasi_tahap2", "Fit")}
              style={{
                padding: "12px 24px",
                backgroundColor:
                  formData.validasi_tahap2 === "Fit"
                    ? "#10b981"
                    : "rgba(0,0,0,0)",
                color: formData.validasi_tahap2 === "Fit" ? "white" : "#10b981",
                border: "2px solid #10b981",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s ease",
                minWidth: "140px",
                outline: "none",
              }}
            >
              Fit To Work
            </button>

            {/* Tombol Not Fit To Work */}
            <button
              type="button"
              onClick={() => handleInputChange("validasi_tahap2", "Not Fit")}
              style={{
                padding: "12px 24px",
                backgroundColor:
                  formData.validasi_tahap2 === "Not Fit"
                    ? "#ef4444"
                    : "rgba(0,0,0,0)",
                color:
                  formData.validasi_tahap2 === "Not Fit" ? "white" : "#ef4444",
                border: "2px solid #ef4444",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s ease",
                minWidth: "140px",
                outline: "none",
              }}
            >
              Not Fit To Work
            </button>
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "600",
              color: "#e5e7eb",
              fontSize: "14px",
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
              padding: "12px",
              border: "1px solid #374151",
              borderRadius: "8px",
              fontSize: "14px",
              minHeight: "80px",
              resize: "vertical",
              backgroundColor: "#111827",
              color: "#e5e7eb",
              outline: "none",
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
    <div
      style={{
        padding: isMobile ? "0" : "20px",
        maxWidth: "1400px",
        margin: "0 auto",
        height: isMobile ? "100vh" : "100vh",
        overflow: "auto",
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
      {/* Header */}
      {!isMobile && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            paddingBottom: "15px",
            borderBottom: "1px solid #374151",
            position: "relative",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "#60a5fa",
              textAlign: "center",
              flex: 1,
              fontWeight: 600,
              fontSize: "24px",
            }}
          >
            Validasi Fit To Work
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#9ca3af",
              fontSize: "24px",
              cursor: "pointer",
              padding: "0",
              width: "30px",
              height: "30px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>
      )}

      <div
        style={{
          padding: isMobile ? "20px" : "0",
          marginTop: isMobile ? 60 : 0, // Space untuk mobile header
        }}
      >
        <form onSubmit={handleSubmit}>
          {/* Two Column Layout */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: "24px",
              alignItems: "start",
            }}
          >
            {/* Left Column */}
            <div>
              {/* Fit To Work Data */}
              {renderFitToWorkData()}
            </div>

            {/* Right Column */}
            <div>
              {/* Level 1 Form */}
              {renderLevel1Form()}

              {/* Level 2 Form */}
              {renderLevel2Form()}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                backgroundColor: "#7f1d1d",
                color: "#fecaca",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "20px",
                border: "1px solid #dc2626",
              }}
            >
              {error}
            </div>
          )}

          {/* Submit Button */}
          {(canEditLevel1() || canEditLevel2()) && (
            <div style={{ textAlign: "center", marginTop: "24px" }}>
              <button
                type="submit"
                disabled={loading || !isFormValid()}
                style={{
                  padding: "12px 32px",
                  backgroundColor:
                    loading || !isFormValid() ? "#374151" : "#60a5fa",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: loading || !isFormValid() ? "not-allowed" : "pointer",
                  fontSize: "16px",
                  fontWeight: "600",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!loading && isFormValid()) {
                    e.target.style.backgroundColor = "#3b82f6";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading && isFormValid()) {
                    e.target.style.backgroundColor = "#60a5fa";
                  }
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
                backgroundColor: "#374151",
                color: "#9ca3af",
                padding: "16px",
                borderRadius: "8px",
                textAlign: "center",
                border: "1px solid #4b5563",
                marginTop: "24px",
              }}
            >
              Anda tidak memiliki akses untuk melakukan validasi pada data ini.
            </div>
          )}
        </form>
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

export default FitToWorkValidationFormNew;
