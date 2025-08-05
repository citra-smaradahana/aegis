import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

function TasklistFormRejectAtOpenMobile({
  hazard,
  onClose,
  onSuccess,
  readOnly,
}) {
  const [form, setForm] = useState({
    action_plan: "",
    due_date: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Prefill form jika ada data hazard
  useEffect(() => {
    if (hazard) {
      setForm({
        action_plan: "", // Blank agar user isi dari awal
        due_date: "", // Blank agar user isi dari awal
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

    // Validasi due date tidak boleh back date
    const selectedDate = new Date(form.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set jam ke 00:00:00 untuk perbandingan tanggal saja

    if (selectedDate < today) {
      setError("Due date tidak boleh tanggal masa lalu.");
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

      const { error: updateError } = await supabase
        .from("hazard_report")
        .update(updateData)
        .eq("id", hazard.id);

      if (updateError) throw updateError;

      onSuccess && onSuccess();
      onClose && onClose();
    } catch (err) {
      console.error("Error updating hazard report:", err);
      setError("Gagal menyimpan perbaikan action plan. Silakan coba lagi.");
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
              color: "#dc2626",
            }}
          >
            Perbaikan Action Plan
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
          paddingBottom: "120px", // Tambah padding bottom agar bisa di-scroll
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
              marginBottom: "16px",
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
                  maxHeight: "150px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  cursor: "pointer",
                }}
              />
            </div>
          </div>
        )}

        {/* Action Plan & Due Date (Read Only) */}
        <div
          style={{
            background: "#fff",
            borderRadius: "8px",
            marginBottom: "16px",
            boxShadow: "0 1px 4px #0001",
            padding: "16px",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 15, color: "#8b5cf6" }}>
            📋 Action Plan
          </h3>
          <div style={{ fontSize: 15, color: "#374151", marginTop: 8 }}>
            <div>
              <strong>Action Plan:</strong>
            </div>
            <div style={{ marginTop: 4, lineHeight: 1.5 }}>
              {hazard?.action_plan || "-"}
            </div>
            <div style={{ marginTop: 12 }}>
              <strong>Due Date:</strong>{" "}
              {hazard?.due_date
                ? new Date(hazard.due_date).toLocaleDateString("id-ID")
                : "-"}
            </div>
          </div>
        </div>

        {/* Alasan Penolakan (Read Only) */}
        <div
          style={{
            background: "#fff",
            borderRadius: "8px",
            marginBottom: "20px",
            boxShadow: "0 1px 4px #0001",
            padding: "16px",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 15, color: "#dc2626" }}>
            ❌ Alasan Penolakan
          </h3>
          <div style={{ fontSize: 15, color: "#374151", marginTop: 8 }}>
            <div>
              <strong>Alasan:</strong>
            </div>
            <div style={{ marginTop: 4, lineHeight: 1.5 }}>
              {hazard?.alasan_penolakan_open || "-"}
            </div>
          </div>
        </div>

        {/* Perbaikan Action Plan */}
        {!readOnly && (
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
              Perbaikan Action Plan *
            </label>
            <textarea
              name="action_plan"
              value={form.action_plan}
              onChange={handleChange}
              required
              placeholder="Jelaskan perbaikan action plan yang akan dilakukan..."
              style={{
                width: "100%",
                minHeight: "120px",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: 16,
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </div>
        )}

        {/* Perbaikan Due Date */}
        {!readOnly && (
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
              Due Date Baru *
            </label>
            <input
              type="date"
              name="due_date"
              value={form.due_date}
              onChange={handleChange}
              required
              min={new Date().toISOString().slice(0, 10)} // Set min date to today
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: 16,
                fontFamily: "inherit",
              }}
            />
          </div>
        )}

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
                : "#10b981",
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
          {readOnly
            ? "Read Only"
            : submitting
            ? "Menyimpan..."
            : "Submit Perbaikan"}
        </button>
      </div>
    </div>
  );
}

export default TasklistFormRejectAtOpenMobile;
