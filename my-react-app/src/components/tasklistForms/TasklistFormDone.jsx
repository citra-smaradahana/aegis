import React, { useState } from "react";
import { supabase } from "../../supabaseClient";

function TasklistFormDone({ item, onClose, onRefresh, onSuccess }) {
  const [catatan, setCatatan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsgs, setErrorMsgs] = useState(""); // Menampung pesan error untuk ditampilkan

  const [selected, setSelected] = useState(null); // null, 'terima', 'tolak'
  const [alasan, setAlasan] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Memindahkan early return ke bawah pemanggilan hooks
  if (!item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    // The original code had `if (readOnly) return;` here, but `readOnly` is no longer in props.
    // Assuming `item` contains the necessary info or `readOnly` is handled elsewhere.
    // For now, I'll remove the `readOnly` check as it's not defined in the new props.
    setError("");

    if (!selected) {
      setError("Pilih Terima atau Tolak.");
      return;
    }

    if (selected === "tolak" && !alasan.trim()) {
      setError("Alasan penolakan wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      if (selected === "terima") {
        const { error } = await supabase
          .from("hazard_report")
          .update({
            status: "Closed",
            date_closed: new Date().toISOString(),
          })
          .eq("id", item.id);
        if (error) throw error;
      } else if (selected === "tolak") {
        const { error } = await supabase
          .from("hazard_report")
          .update({
            status: "Reject at Done",
            alasan_penolakan_done: alasan,
          })
          .eq("id", item.id);
        if (error) throw error;
      }

      if (onRefresh) onRefresh();
      if (onClose) onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Error updating hazard:", err);
      setError("Gagal menyimpan data. Silakan coba lagi.");
    } finally {
      setLoading(false);
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
              <div>{item.lokasi || "-"}</div>
              <div
                style={{
                  fontWeight: 700,
                  textAlign: "right",
                  color: "#9ca3af",
                }}
              >
                Nama Pelapor:
              </div>
              <div>{item.pelapor_nama || "-"}</div>
              <div
                style={{
                  fontWeight: 700,
                  textAlign: "right",
                  color: "#9ca3af",
                }}
              >
                NRP Pelapor:
              </div>
              <div>{item.pelapor_nrp || "-"}</div>
              <div
                style={{
                  fontWeight: 700,
                  textAlign: "right",
                  color: "#9ca3af",
                }}
              >
                PIC:
              </div>
              <div>{item.pic || "-"}</div>
              <div
                style={{
                  fontWeight: 700,
                  textAlign: "right",
                  color: "#9ca3af",
                }}
              >
                Evaluator:
              </div>
              <div>{item.evaluator_nama || "-"}</div>
              <div
                style={{
                  fontWeight: 700,
                  textAlign: "right",
                  color: "#9ca3af",
                }}
              >
                Deskripsi Temuan:
              </div>
              <div>{item.deskripsi_temuan || "-"}</div>
              <div
                style={{
                  fontWeight: 700,
                  textAlign: "right",
                  color: "#9ca3af",
                }}
              >
                Quick Action:
              </div>
              <div>{item.quick_action || "-"}</div>
              <div
                style={{
                  fontWeight: 700,
                  textAlign: "right",
                  color: "#9ca3af",
                }}
              >
                Ketidaksesuaian:
              </div>
              <div>{item.ketidaksesuaian || "-"}</div>
              <div
                style={{
                  fontWeight: 700,
                  textAlign: "right",
                  color: "#9ca3af",
                }}
              >
                Sub Ketidaksesuaian:
              </div>
              <div>{item.sub_ketidaksesuaian || "-"}</div>
              <div
                style={{
                  fontWeight: 700,
                  textAlign: "right",
                  color: "#9ca3af",
                }}
              >
                Keterangan Lokasi:
              </div>
              <div>{item.keterangan_lokasi || "-"}</div>
              <div
                style={{
                  fontWeight: 700,
                  textAlign: "right",
                  color: "#9ca3af",
                }}
              >
                Detail Lokasi:
              </div>
              <div>{item.detail_lokasi || "-"}</div>
              <div
                style={{
                  fontWeight: 700,
                  textAlign: "right",
                  color: "#9ca3af",
                }}
              >
                Action Plan:
              </div>
              <div>{item.action_plan || "-"}</div>
              <div
                style={{
                  fontWeight: 700,
                  textAlign: "right",
                  color: "#9ca3af",
                }}
              >
                Due Date:
              </div>
              <div>{item.due_date || "-"}</div>
            </div>

            {/* Evidence Temuan */}
            {item.evidence && (
              <div style={{ marginTop: 24 }}>
                <h4
                  style={{
                    marginBottom: 12,
                    color: "#60a5fa",
                    fontWeight: 600,
                  }}
                >
                  Evidence Temuan
                </h4>
                <img
                  src={item.evidence}
                  alt="Evidence Temuan"
                  style={{
                    maxWidth: "200px",
                    borderRadius: 8,
                    border: "1px solid #374151",
                    cursor: "pointer",
                  }}
                />
              </div>
            )}

            {/* Alasan Penolakan Done (jika ada) */}
            {item.alasan_penolakan_done && (
              <div style={{ marginTop: 24 }}>
                <h4
                  style={{
                    marginBottom: 12,
                    color: "#ef4444",
                    fontWeight: 600,
                  }}
                >
                  Alasan Penolakan
                </h4>
                <div
                  style={{
                    background: "#1f2937",
                    padding: 12,
                    borderRadius: 6,
                    color: "#ef4444",
                    border: "1px solid #ef4444",
                  }}
                >
                  {item.alasan_penolakan_done}
                </div>
              </div>
            )}
          </div>

          {/* Kanan: Form Evaluasi */}
          <div
            style={{
              flex: 1,
              paddingLeft: 24,
              color: "#e5e7eb",
              height: "100vh",
              overflow: "hidden",
            }}
          >
            <h3 style={{ marginBottom: 24, color: "#60a5fa", fontWeight: 600 }}>
              Evaluasi Hazard Report
            </h3>

            {/* Deskripsi Penyelesaian */}
            {item.deskripsi_penyelesaian && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "160px 1fr",
                  rowGap: 12,
                  columnGap: 12,
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    textAlign: "right",
                    color: "#9ca3af",
                  }}
                >
                  Deskripsi Penyelesaian:
                </div>
                <div>{item.deskripsi_penyelesaian}</div>
              </div>
            )}

            {/* Evidence Perbaikan */}
            {item.evidence_perbaikan && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "160px 1fr",
                  rowGap: 12,
                  columnGap: 12,
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    textAlign: "right",
                    color: "#9ca3af",
                  }}
                >
                  Evidence Perbaikan:
                </div>
                <img
                  src={item.evidence_perbaikan}
                  alt="Evidence Perbaikan"
                  style={{
                    maxWidth: "200px",
                    borderRadius: 8,
                    border: "1px solid #374151",
                    cursor: "pointer",
                  }}
                />
              </div>
            )}

{/* readOnly check removed as standard usage */
              <div
                style={{
                  color: "#9ca3af",
                  marginBottom: 16,
                  fontStyle: "italic",
                }}
              >
                Anda tidak memiliki akses untuk melakukan evaluasi pada status
                ini.
              </div>
}

            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <div>
                <label
                  style={{
                    color: "#e5e7eb",
                    marginBottom: 12,
                    display: "block",
                    fontWeight: 600,
                  }}
                >
                  Pilih Keputusan*
                </label>
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setSelected("terima")}
                    disabled={false}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      borderRadius: 8,
                      border: "2px solid",
                      background:
                        selected === "terima" ? "#10b981" : "transparent",
                      borderColor:
                        selected === "terima" ? "#10b981" : "#374151",
                      color: selected === "terima" ? "#fff" : "#e5e7eb",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    ✓ Terima
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelected("tolak")}
                    disabled={false}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      borderRadius: 8,
                      border: "2px solid",
                      background:
                        selected === "tolak" ? "#ef4444" : "transparent",
                      borderColor: selected === "tolak" ? "#ef4444" : "#374151",
                      color: selected === "tolak" ? "#fff" : "#e5e7eb",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    ✕ Tolak
                  </button>
                </div>
              </div>

              {/* Alasan Penolakan - hanya muncul jika pilih Tolak */}
              {selected === "tolak" && (
                <div>
                  <label
                    style={{
                      color: "#e5e7eb",
                      marginBottom: 8,
                      display: "block",
                      fontWeight: 600,
                    }}
                  >
                    Alasan Penolakan*
                  </label>
                  <textarea
                    value={alasan}
                    onChange={(e) => setAlasan(e.target.value)}
                    disabled={false}
                    placeholder="Jelaskan alasan penolakan..."
                    style={{
                      width: "100%",
                      minHeight: 120,
                      padding: 12,
                      borderRadius: 8,
                      border: "1px solid #374151",
                      background: "#1f2937",
                      color: "#e5e7eb",
                      resize: "vertical",
                      fontFamily: "inherit",
                    }}
                  />
                </div>
              )}

              {error && (
                <div style={{ color: "#ef4444", fontSize: 14 }}>{error}</div>
              )}

/* readOnly checks removed */
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: loading ? "#6b7280" : "#60a5fa",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "12px 24px",
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    marginTop: 16,
                  }}
                >
                  {loading ? "Menyimpan..." : "Submit Evaluasi"}
                </button>
/* end readOnly checked */
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TasklistFormDone;
