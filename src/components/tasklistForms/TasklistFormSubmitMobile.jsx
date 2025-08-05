import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

function TasklistFormSubmitMobile({ hazard, onClose, onSuccess, readOnly }) {
  const [form, setForm] = useState({
    action_plan: "",
    due_date: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showImagePopup, setShowImagePopup] = useState(false);

  // Prefill form jika ada data hazard
  useEffect(() => {
    if (hazard) {
      setForm({
        action_plan: hazard.action_plan || "",
        due_date: hazard.due_date ? hazard.due_date.split("T")[0] : "",
      });
    }
  }, [hazard]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (readOnly) return;
    if (!form.action_plan || !form.due_date) {
      setError("Action plan dan due date wajib diisi.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const updateData = {
        action_plan: form.action_plan,
        due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
        status: "Open",
      };

      // Filter out empty values
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === "" || updateData[key] === null) {
          delete updateData[key];
        }
      });

      const { error: updateError } = await supabase
        .from("hazard_report")
        .update(updateData)
        .eq("id", hazard.id);

      if (updateError) throw updateError;

      onSuccess && onSuccess();
      onClose && onClose();
    } catch (err) {
      console.error("Error updating hazard report:", err);
      setError("Gagal menyimpan action plan. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper untuk ambil field hazard
  const lokasi = hazard?.lokasi || "-";
  const detailLokasi = hazard?.detail_lokasi || "-";
  const keteranganLokasi = hazard?.keterangan_lokasi || "-";
  const ketidaksesuaian = hazard?.ketidaksesuaian || "-";
  const subKetidaksesuaian = hazard?.sub_ketidaksesuaian || "-";
  const quickAction = hazard?.quick_action || "-";
  const temuan = hazard?.deskripsi_temuan || hazard?.temuan || "-";
  const evidence = hazard?.evidence || "-";

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#f3f4f6",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#fff",
          padding: "16px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 600,
              color: "#1f2937",
            }}
          >
            Submit Action Plan
          </h2>
          <p
            style={{
              margin: "4px 0 0 0",
              fontSize: 14,
              color: "#6b7280",
            }}
          >
            Hazard #{hazard?.id}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            fontSize: 24,
            color: "#6b7280",
            cursor: "pointer",
            padding: "4px",
          }}
        >
          ×
        </button>
      </div>

      {/* Detail Hazard Report (Read Only) */}
      <div
        style={{
          flex: 1,
          padding: "16px",
          overflowY: "auto",
          paddingBottom: "120px", // Tambah padding bottom agar due date bisa di-scroll
        }}
      >
        {/* Lokasi */}
        <div
          style={{
            background: "#fff",
            borderRadius: "8px",
            marginBottom: "16px",
            boxShadow: "0 1px 4px #0001",
            padding: "16px",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 15, color: "#2563eb" }}>
            📍 Lokasi
          </h3>
          <div style={{ fontSize: 15, color: "#374151", marginTop: 8 }}>
            <div>
              <strong>Lokasi:</strong> {lokasi}
            </div>
            <div>
              <strong>Detail Lokasi:</strong> {detailLokasi}
            </div>
            <div>
              <strong>Keterangan Lokasi:</strong> {keteranganLokasi}
            </div>
          </div>
        </div>

        {/* Ketidaksesuaian */}
        <div
          style={{
            background: "#fff",
            borderRadius: "8px",
            marginBottom: "16px",
            boxShadow: "0 1px 4px #0001",
            padding: "16px",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 15, color: "#f59e42" }}>
            ⚠️ Ketidaksesuaian
          </h3>
          <div style={{ fontSize: 15, color: "#374151", marginTop: 8 }}>
            <div>
              <strong>Ketidaksesuaian:</strong> {ketidaksesuaian}
            </div>
            {subKetidaksesuaian && (
              <div>
                <strong>Sub Ketidaksesuaian:</strong> {subKetidaksesuaian}
              </div>
            )}
            {quickAction && (
              <div>
                <strong>Quick Action:</strong> {quickAction}
              </div>
            )}
          </div>
        </div>

        {/* Temuan */}
        <div
          style={{
            background: "#fff",
            borderRadius: "8px",
            marginBottom: "16px",
            boxShadow: "0 1px 4px #0001",
            padding: "16px",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 15, color: "#ef4444" }}>
            🔍 Temuan
          </h3>
          <div style={{ fontSize: 15, color: "#374151", marginTop: 8 }}>
            <div>
              <strong>Deskripsi Temuan:</strong>
            </div>
            <div style={{ marginTop: 4, lineHeight: 1.5 }}>{temuan}</div>
          </div>
        </div>

        {/* Evidence */}
        {evidence && evidence !== "-" && (
          <div
            style={{
              background: "#fff",
              borderRadius: "8px",
              marginBottom: "24px",
              boxShadow: "0 1px 4px #0001",
              padding: "16px",
            }}
          >
            <h3 style={{ margin: 0, fontSize: 15, color: "#10b981" }}>
              📷 Evidence
            </h3>
            <div style={{ marginTop: 8 }}>
              <img
                src={evidence}
                alt="Evidence"
                style={{
                  width: "100%",
                  maxHeight: "150px", // Kurangi ukuran dari 200px ke 150px
                  objectFit: "cover",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  cursor: "pointer",
                }}
                onClick={() => setShowImagePopup(true)}
              />
              <div
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  marginTop: 4,
                  textAlign: "center",
                }}
              >
                Tap untuk melihat detail
              </div>
            </div>
          </div>
        )}

        {/* Action Plan */}
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              fontWeight: 600,
              color: "#374151",
              marginBottom: "8px",
              fontSize: 16,
            }}
          >
            Action Plan *
          </label>
          <textarea
            name="action_plan"
            value={form.action_plan}
            onChange={handleChange}
            required
            placeholder="Jelaskan rencana tindakan yang akan dilakukan..."
            style={{
              width: "100%",
              minHeight: "120px",
              padding: "12px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: 16,
              resize: "vertical",
              fontFamily: "inherit",
              background: readOnly ? "#f3f4f6" : undefined,
              color: readOnly ? "#9ca3af" : undefined,
            }}
            readOnly={readOnly}
            disabled={readOnly}
          />
        </div>

        {/* Due Date */}
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              fontWeight: 600,
              color: "#374151",
              marginBottom: "8px",
              fontSize: 16,
            }}
          >
            Due Date *
          </label>
          <input
            type="date"
            name="due_date"
            value={form.due_date}
            onChange={handleChange}
            required
            min={new Date().toISOString().split("T")[0]}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: 16,
              fontFamily: "inherit",
              background: readOnly ? "#f3f4f6" : undefined,
              color: readOnly ? "#9ca3af" : undefined,
            }}
            readOnly={readOnly}
            disabled={readOnly}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Image Popup */}
      {showImagePopup && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.9)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setShowImagePopup(false)}
        >
          <div
            style={{
              position: "relative",
              maxWidth: "90vw",
              maxHeight: "90vh",
            }}
          >
            <button
              onClick={() => setShowImagePopup(false)}
              style={{
                position: "absolute",
                top: -40,
                right: 0,
                background: "none",
                border: "none",
                color: "#fff",
                fontSize: 24,
                cursor: "pointer",
                padding: "8px",
              }}
            >
              ×
            </button>
            <img
              src={evidence}
              alt="Evidence Detail"
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "90vh",
                objectFit: "contain",
                borderRadius: "8px",
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Fixed Submit Button */}
      <div
        style={{
          background: "#fff",
          padding: "16px",
          borderTop: "1px solid #e5e7eb",
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 56, // asumsi navbar tinggi 56px
          zIndex: 100,
        }}
      >
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={
            readOnly || submitting || !form.action_plan || !form.due_date
          }
          style={{
            width: "100%",
            padding: "16px",
            background:
              readOnly || submitting || !form.action_plan || !form.due_date
                ? "#9ca3af"
                : "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: 16,
            fontWeight: 600,
            cursor:
              readOnly || submitting || !form.action_plan || !form.due_date
                ? "not-allowed"
                : "pointer",
            opacity:
              readOnly || submitting || !form.action_plan || !form.due_date
                ? 0.6
                : 1,
          }}
        >
          {readOnly ? "Read Only" : submitting ? "Menyimpan..." : "Submit"}
        </button>
      </div>
    </div>
  );
}

export default TasklistFormSubmitMobile;
