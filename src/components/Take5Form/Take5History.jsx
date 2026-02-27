import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

const Take5History = ({ user }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from("take_5")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) throw error;
        setHistory(data || []);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchHistory();
    }
  }, [user]);

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#9ca3af" }}>
        Memuat riwayat...
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#9ca3af" }}>
        Belum ada riwayat Take 5.
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {history.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedReport(item)}
            style={{
              padding: "16px",
              background: "#1e1e2d",
              borderRadius: "8px",
              border: "1px solid #374151",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "12px",
                alignItems: "flex-start",
              }}
            >
              <div>
                <span
                  style={{
                    color: "#9ca3af",
                    fontSize: "12px",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  {new Date(item.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <h3
                  style={{
                    color: "white",
                    fontWeight: "500",
                    fontSize: "16px",
                    margin: 0,
                  }}
                >
                  {item.site} - {item.detail_lokasi}
                </h3>
              </div>
              <span
                style={{
                  padding: "4px 12px",
                  borderRadius: "9999px",
                  fontSize: "12px",
                  fontWeight: "500",
                  backgroundColor:
                    item.status === "closed" ||
                    item.status === "done" ||
                    item.status === "completed"
                      ? "rgba(20, 83, 45, 0.5)"
                      : "rgba(113, 63, 18, 0.5)",
                  color:
                    item.status === "closed" ||
                    item.status === "done" ||
                    item.status === "completed"
                      ? "#86efac"
                      : "#fde047",
                  border:
                    item.status === "closed" ||
                    item.status === "done" ||
                    item.status === "completed"
                      ? "1px solid #22c55e"
                      : "1px solid #eab308",
                  whiteSpace: "nowrap",
                  marginLeft: "8px",
                }}
              >
                {item.status || "Unknown"}
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gap: "8px",
                fontSize: "14px",
              }}
            >
              <div>
                <span
                  style={{
                    color: "#6b7280",
                    display: "block",
                    fontSize: "12px",
                  }}
                >
                  Potensi Bahaya:
                </span>
                <span style={{ color: "#d1d5db" }}>
                  {item.potensi_bahaya || "-"}
                </span>
              </div>
              <div>
                <span
                  style={{
                    color: "#6b7280",
                    display: "block",
                    fontSize: "12px",
                  }}
                >
                  Kondisi:
                </span>
                <span style={{ color: "#d1d5db" }}>
                  {item.aman === "aman"
                    ? "Aman"
                    : item.aman === "perbaikan"
                      ? "Perbaikan"
                      : item.aman === "stop"
                        ? "Stop"
                        : "-"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedReport && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setSelectedReport(null)}
        >
          <div
            style={{
              backgroundColor: "#1e1e2d",
              borderRadius: "12px",
              padding: "24px",
              width: "100%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
              position: "relative",
              border: "1px solid #374151",
              color: "#e5e7eb",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                borderBottom: "1px solid #374151",
                paddingBottom: "16px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#fff",
                }}
              >
                Detail Take 5
              </h2>
              <button
                onClick={() => setSelectedReport(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#9ca3af",
                  fontSize: "24px",
                  cursor: "pointer",
                  padding: "0 8px",
                }}
              >
                &times;
              </button>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                <div>
                  <label
                    style={{
                      color: "#9ca3af",
                      fontSize: "12px",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Tanggal
                  </label>
                  <div>
                    {new Date(selectedReport.created_at).toLocaleDateString(
                      "id-ID",
                      {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </div>
                </div>
                <div>
                  <label
                    style={{
                      color: "#9ca3af",
                      fontSize: "12px",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Status
                  </label>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "500",
                      backgroundColor:
                        selectedReport.status === "closed" ||
                        selectedReport.status === "done" ||
                        selectedReport.status === "completed"
                          ? "rgba(20, 83, 45, 0.5)"
                          : "rgba(113, 63, 18, 0.5)",
                      color:
                        selectedReport.status === "closed" ||
                        selectedReport.status === "done" ||
                        selectedReport.status === "completed"
                          ? "#86efac"
                          : "#fde047",
                      border:
                        selectedReport.status === "closed" ||
                        selectedReport.status === "done" ||
                        selectedReport.status === "completed"
                          ? "1px solid #22c55e"
                          : "1px solid #eab308",
                    }}
                  >
                    {selectedReport.status || "Unknown"}
                  </span>
                </div>
              </div>

              <div>
                <label
                  style={{
                    color: "#9ca3af",
                    fontSize: "12px",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Lokasi
                </label>
                <div style={{ fontWeight: "500", color: "#fff" }}>
                  {selectedReport.site} - {selectedReport.detail_lokasi}
                </div>
              </div>

              <div>
                <label
                  style={{
                    color: "#9ca3af",
                    fontSize: "12px",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Potensi Bahaya
                </label>
                <div>{selectedReport.potensi_bahaya || "-"}</div>
              </div>

              <div
                style={{
                  background: "rgba(255,255,255,0.05)",
                  padding: "16px",
                  borderRadius: "8px",
                }}
              >
                <h4
                  style={{
                    margin: "0 0 12px 0",
                    fontSize: "14px",
                    color: "#fff",
                  }}
                >
                  Checklist Keselamatan
                </h4>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span style={{ fontSize: "13px" }}>
                      Mengerti pekerjaan?
                    </span>
                    <span
                      style={{
                        color: selectedReport.q1 ? "#4ade80" : "#f87171",
                        fontWeight: "600",
                      }}
                    >
                      {selectedReport.q1 ? "Ya" : "Tidak"}
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span style={{ fontSize: "13px" }}>
                      Memiliki kompetensi?
                    </span>
                    <span
                      style={{
                        color: selectedReport.q2 ? "#4ade80" : "#f87171",
                        fontWeight: "600",
                      }}
                    >
                      {selectedReport.q2 ? "Ya" : "Tidak"}
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span style={{ fontSize: "13px" }}>Memiliki izin?</span>
                    <span
                      style={{
                        color: selectedReport.q3 ? "#4ade80" : "#f87171",
                        fontWeight: "600",
                      }}
                    >
                      {selectedReport.q3 ? "Ya" : "Tidak"}
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span style={{ fontSize: "13px" }}>Peralatan tepat?</span>
                    <span
                      style={{
                        color: selectedReport.q4 ? "#4ade80" : "#f87171",
                        fontWeight: "600",
                      }}
                    >
                      {selectedReport.q4 ? "Ya" : "Tidak"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label
                  style={{
                    color: "#9ca3af",
                    fontSize: "12px",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Kondisi Kerja
                </label>
                <div
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    background:
                      selectedReport.aman === "aman"
                        ? "rgba(22, 163, 74, 0.1)"
                        : selectedReport.aman === "perbaikan"
                          ? "rgba(234, 179, 8, 0.1)"
                          : "rgba(220, 38, 38, 0.1)",
                    border:
                      selectedReport.aman === "aman"
                        ? "1px solid rgba(22, 163, 74, 0.3)"
                        : selectedReport.aman === "perbaikan"
                          ? "1px solid rgba(234, 179, 8, 0.3)"
                          : "1px solid rgba(220, 38, 38, 0.3)",
                    color:
                      selectedReport.aman === "aman"
                        ? "#4ade80"
                        : selectedReport.aman === "perbaikan"
                          ? "#facc15"
                          : "#f87171",
                    fontWeight: "600",
                  }}
                >
                  {selectedReport.aman === "aman"
                    ? "Aman untuk melanjutkan pekerjaan"
                    : selectedReport.aman === "perbaikan"
                      ? "Perlu perbaikan terlebih dahulu"
                      : "STOP pekerjaan, minta bantuan"}
                </div>
              </div>

              {/* Deskripsi & Bukti jika ada */}
              {(selectedReport.deskripsi_kondisi ||
                selectedReport.deskripsi_perbaikan ||
                selectedReport.bukti_perbaikan) && (
                <div>
                  <label
                    style={{
                      color: "#9ca3af",
                      fontSize: "12px",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Deskripsi & Catatan
                  </label>
                  <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                    {selectedReport.deskripsi_kondisi ||
                      selectedReport.deskripsi_perbaikan ||
                      selectedReport.bukti_perbaikan ||
                      "-"}
                  </p>
                </div>
              )}

              {/* Tampilkan foto jika ada */}
              {selectedReport.bukti_url && (
                <div>
                  <label
                    style={{
                      color: "#9ca3af",
                      fontSize: "12px",
                      display: "block",
                      marginBottom: "8px",
                    }}
                  >
                    Bukti Foto
                  </label>
                  <img
                    src={selectedReport.bukti_url}
                    alt="Bukti Take 5"
                    style={{
                      width: "100%",
                      borderRadius: "8px",
                      border: "1px solid #374151",
                      maxHeight: "300px",
                      objectFit: "contain",
                      background: "#000",
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Take5History;
