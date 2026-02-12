import React, { useState } from "react";
import { supabase } from "../../supabaseClient";

function TasklistFormSubmit({ hazard, onSuccess, readOnly, onClose }) {
  if (!hazard) {
    return (
      <div style={{ color: "#ef4444", padding: 32 }}>
        Data hazard tidak ditemukan.
      </div>
    );
  }
  const [actionPlan, setActionPlan] = useState(hazard.action_plan || "");
  const [dueDate, setDueDate] = useState(hazard.due_date || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const minDueDate = hazard.created_at
    ? new Date(hazard.created_at).toISOString().slice(0, 10)
    : undefined;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!actionPlan || !dueDate) {
      setError("Action plan dan due date wajib diisi.");
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("hazard_report")
      .update({
        action_plan: actionPlan,
        due_date: dueDate,
        status: "Open",
      })
      .eq("id", hazard.id);
    setLoading(false);
    if (error) {
      setError("Gagal update hazard report: " + error.message);
    } else {
      if (onSuccess) onSuccess();
    }
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "transparent",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        padding: "0 0 0 120px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: "transparent",
          borderRadius: 18,
          boxShadow: "none",
          padding: 16,
          maxWidth: 1400,
          width: "100%",
          margin: "0",
          height: "100vh",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 24,
            background: "transparent",
            border: "none",
            borderRadius: 16,
            padding: 24,
            color: "#e5e7eb",
            position: "relative",
            height: "100vh",
            alignItems: "flex-start",
          }}
        >
          {/* Tombol close kanan atas */}
          {onClose && (
            <button
              onClick={onClose}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: 24,
                color: "#9ca3af",
                cursor: "pointer",
                zIndex: 10,
                padding: 0,
                width: "auto",
                height: "auto",
              }}
              title="Tutup"
            >
              ×
            </button>
          )}
          {/* Kiri: Detail hazard report */}
          <div
            style={{
              flex: 1,
              borderRight: "1px solid #334155",
              paddingRight: 24,
              color: "#e5e7eb",
              height: "100vh",
              overflow: "hidden",
            }}
          >
            <h3 style={{ marginBottom: 24, color: "#60a5fa", fontWeight: 600 }}>
              Detail Hazard Report
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "160px 1fr",
                rowGap: 12,
                columnGap: 12,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  textAlign: "right",
                  color: "#9ca3af",
                }}
              >
                Site:
              </div>
              <div>{hazard.lokasi || "-"}</div>
              <div
                style={{
                  fontWeight: 700,
                  textAlign: "right",
                  color: "#9ca3af",
                }}
              >
                Nama Pelapor:
              </div>
              <div>{hazard.pelapor_nama || "-"}</div>
              <div
                style={{
                  fontWeight: 700,
                  textAlign: "right",
                  color: "#9ca3af",
                }}
              >
                NRP Pelapor:
              </div>
              <div>{hazard.pelapor_nrp || "-"}</div>
              <div
                style={{
                  fontWeight: 700,
                  textAlign: "right",
                  color: "#9ca3af",
                }}
              >
                PIC:
              </div>
              <div>{hazard.pic || "-"}</div>
              <div
                style={{
                  fontWeight: 700,
                  textAlign: "right",
                  color: "#9ca3af",
                }}
              >
                Deskripsi Temuan:
              </div>
              <div>{hazard.deskripsi_temuan || "-"}</div>
              <div
                style={{
                  fontWeight: 700,
                  textAlign: "right",
                  color: "#9ca3af",
                }}
              >
                Quick Action:
              </div>
              <div>{hazard.quick_action || "-"}</div>
              <div
                style={{
                  fontWeight: 700,
                  textAlign: "right",
                  color: "#9ca3af",
                }}
              >
                Ketidaksesuaian:
              </div>
              <div>{hazard.ketidaksesuaian || "-"}</div>
              <div
                style={{
                  fontWeight: 700,
                  textAlign: "right",
                  color: "#9ca3af",
                }}
              >
                Sub Ketidaksesuaian:
              </div>
              <div>{hazard.sub_ketidaksesuaian || "-"}</div>
              <div
                style={{
                  fontWeight: 700,
                  textAlign: "right",
                  color: "#9ca3af",
                }}
              >
                Keterangan Lokasi:
              </div>
              <div>{hazard.keterangan_lokasi || "-"}</div>
              <div
                style={{
                  fontWeight: 700,
                  textAlign: "right",
                  color: "#9ca3af",
                }}
              >
                Detail Lokasi:
              </div>
              <div>{hazard.detail_lokasi || "-"}</div>
              <div
                style={{
                  fontWeight: 700,
                  textAlign: "right",
                  color: "#9ca3af",
                }}
              >
                Evidence:
              </div>
              <div>
                {hazard.evidence && (
                  <img
                    src={hazard.evidence}
                    alt="evidence"
                    style={{ maxWidth: 180, borderRadius: 8, marginTop: 4 }}
                  />
                )}
                {!hazard.evidence && "-"}
              </div>
            </div>
          </div>
          {/* Kanan: Form action plan */}
          <form
            onSubmit={handleSubmit}
            style={{
              flex: 0.8,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              color: "#e5e7eb",
              height: "100vh",
              overflow: "hidden",
            }}
          >
            <h3 style={{ marginBottom: 12, color: "#60a5fa", fontWeight: 600 }}>
              Rencana Perbaikan
            </h3>
            {readOnly && (
              <div
                style={{
                  color: "#9ca3af",
                  marginBottom: 8,
                  fontStyle: "italic",
                }}
              >
                Anda tidak memiliki akses untuk mengisi action plan pada status
                ini.
              </div>
            )}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  color: "#9ca3af",
                  fontWeight: 600,
                }}
              >
                Rencana Perbaikan
              </label>
              <textarea
                value={actionPlan}
                onChange={(e) => setActionPlan(e.target.value)}
                required
                placeholder="Masukkan rencana perbaikan yang akan dilakukan..."
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #334155",
                  background: readOnly ? "#1f2937" : "#0b1220",
                  color: readOnly ? "#6b7280" : "#e5e7eb",
                  minHeight: 150,
                  resize: "vertical",
                }}
                disabled={readOnly}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  color: "#9ca3af",
                  fontWeight: 600,
                }}
              >
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #334155",
                  background: readOnly ? "#1f2937" : "#0b1220",
                  color: readOnly ? "#6b7280" : "#e5e7eb",
                }}
                min={minDueDate}
                disabled={readOnly}
              />
            </div>
            {error && (
              <div
                style={{
                  color: "#ef4444",
                  marginBottom: 8,
                  background: "#1f2937",
                  padding: 8,
                  borderRadius: 6,
                }}
              >
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading || readOnly}
              style={{
                marginTop: 16,
                background: readOnly ? "#6b7280" : "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 0",
                fontWeight: 600,
                fontSize: 14,
                cursor: readOnly ? "not-allowed" : "pointer",
                opacity: readOnly ? 0.7 : 1,
              }}
            >
              {loading ? "Menyimpan..." : "Kirim ke Open"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default TasklistFormSubmit;
