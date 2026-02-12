import React, { useState } from "react";
import { supabase } from "../../supabaseClient";

function TasklistFormOpen({ hazard, onProgress, onReject, readOnly, onClose }) {
  const [selected, setSelected] = useState(null); // 'terima' atau 'tolak'
  const [alasan, setAlasan] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!hazard) {
    return (
      <div style={{ color: "#ef4444", padding: 32 }}>
        Data hazard tidak ditemukan.
      </div>
    );
  }

  const handleSubmit = async () => {
    setError("");
    if (selected === "terima") {
      setLoading(true);
      const { error } = await supabase
        .from("hazard_report")
        .update({ status: "Progress" })
        .eq("id", hazard.id);
      setLoading(false);
      if (!error) {
        if (onProgress) onProgress();
        if (onClose) onClose(); // Tutup card setelah berhasil
      }
    } else if (selected === "tolak") {
      if (!alasan) {
        setError("Alasan penolakan wajib diisi.");
        return;
      }
      setLoading(true);
      const { error } = await supabase
        .from("hazard_report")
        .update({ status: "Reject at Open", alasan_penolakan_open: alasan })
        .eq("id", hazard.id);
      setLoading(false);
      if (!error) {
        if (onReject) onReject();
        if (onClose) onClose(); // Tutup card setelah berhasil
      }
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
            </div>
            {/* Evidence temuan hazard di bawah grid */}
            {hazard.evidence && (
              <div
                style={{
                  marginTop: 24,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    textAlign: "right",
                    marginBottom: 4,
                    color: "#9ca3af",
                  }}
                >
                  Evidence:
                </div>
                <img
                  src={hazard.evidence}
                  alt="evidence temuan"
                  style={{ maxWidth: 180, borderRadius: 8, marginTop: 4 }}
                />
              </div>
            )}
          </div>

          {/* Kanan: Rencana Perbaikan (Read Only) + Form Aksi */}
          <div
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
            <h3 style={{ marginBottom: 16, color: "#60a5fa", fontWeight: 600 }}>
              Rencana Perbaikan
            </h3>

            {/* Action Plan (Read Only) */}
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontWeight: 700,
                  marginBottom: 8,
                  color: "#9ca3af",
                }}
              >
                Action Plan:
              </div>
              <div
                style={{
                  color: "#e5e7eb",
                  minHeight: 100,
                }}
              >
                {hazard.action_plan || "Tidak ada action plan"}
              </div>
            </div>

            {/* Due Date (Read Only) */}
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontWeight: 700,
                  marginBottom: 8,
                  color: "#9ca3af",
                }}
              >
                Due Date:
              </div>
              <div
                style={{
                  color: "#e5e7eb",
                }}
              >
                {hazard.due_date || "Tidak ada due date"}
              </div>
            </div>

            {/* Form Aksi - Hanya untuk Submitter/Pelapor */}
            {!readOnly && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  gap: 24,
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    marginBottom: 8,
                    color: "#e5e7eb",
                    textAlign: "center",
                  }}
                >
                  Pilih Aksi:
                </div>
                <div style={{ display: "flex", gap: 24 }}>
                  <button
                    type="button"
                    onClick={() => setSelected("terima")}
                    disabled={loading}
                    style={{
                      background:
                        selected === "terima" ? "#10b981" : "transparent",
                      color: selected === "terima" ? "#fff" : "#10b981",
                      border: "2px solid #10b981",
                      borderRadius: 8,
                      padding: "12px 32px",
                      fontWeight: 600,
                      fontSize: 16,
                      cursor: "pointer",
                      boxShadow:
                        selected === "terima" ? "0 2px 8px #10b98133" : "none",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (selected !== "terima")
                        e.currentTarget.style.background = "#10b981";
                    }}
                    onMouseLeave={(e) => {
                      if (selected !== "terima")
                        e.currentTarget.style.background = "transparent";
                    }}
                  >
                    Terima
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelected("tolak")}
                    disabled={loading}
                    style={{
                      background:
                        selected === "tolak" ? "#ef4444" : "transparent",
                      color: selected === "tolak" ? "#fff" : "#ef4444",
                      border: "2px solid #ef4444",
                      borderRadius: 8,
                      padding: "12px 32px",
                      fontWeight: 600,
                      fontSize: 16,
                      cursor: "pointer",
                      boxShadow:
                        selected === "tolak" ? "0 2px 8px #ef444433" : "none",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (selected !== "tolak")
                        e.currentTarget.style.background = "#ef4444";
                    }}
                    onMouseLeave={(e) => {
                      if (selected !== "tolak")
                        e.currentTarget.style.background = "transparent";
                    }}
                  >
                    Tolak
                  </button>
                </div>
                {selected === "tolak" && (
                  <div style={{ width: "100%", marginTop: 16 }}>
                    <label
                      style={{
                        color: "#e5e7eb",
                        marginBottom: 8,
                        display: "block",
                      }}
                    >
                      Alasan Penolakan{" "}
                      <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <textarea
                      value={alasan}
                      onChange={(e) => setAlasan(e.target.value)}
                      required
                      rows={3}
                      style={{
                        width: "100%",
                        padding: 12,
                        borderRadius: 6,
                        border: "1px solid #374151",
                        background: "#1f2937",
                        color: "#e5e7eb",
                      }}
                      placeholder="Masukkan alasan penolakan..."
                    />
                  </div>
                )}
                {error && (
                  <div
                    style={{
                      color: "#ef4444",
                      marginTop: 8,
                      textAlign: "center",
                    }}
                  >
                    {error}
                  </div>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={
                    loading || !selected || (selected === "tolak" && !alasan)
                  }
                  style={{
                    marginTop: 16,
                    background: "#60a5fa",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "12px 0",
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: selected ? "pointer" : "not-allowed",
                    width: 180,
                    opacity: selected ? 1 : 0.6,
                  }}
                >
                  {loading ? "Menyimpan..." : "Submit"}
                </button>
              </div>
            )}

            {/* Pesan untuk non-Submitter */}
            {readOnly && (
              <div
                style={{
                  color: "#9ca3af",
                  marginTop: 16,
                  fontStyle: "italic",
                  textAlign: "center",
                  padding: "20px",
                  background: "#1f2937",
                  borderRadius: 8,
                  border: "1px solid #374151",
                }}
              >
                Anda tidak memiliki akses untuk melakukan aksi pada status ini.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TasklistFormOpen;
