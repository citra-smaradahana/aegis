import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

const PTOHistory = ({ user }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("planned_task_observation")
          .select("*")
          .eq("created_by", user.id)
          .order("created_at", { ascending: false })
          .limit(20);
        if (error) throw error;
        if (!cancelled) setItems(data || []);
      } catch (e) {
        console.error("Fetch PTO history error:", e);
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (user?.id) load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "#9ca3af" }}>
        Memuat riwayat...
      </div>
    );
  }
  if (!items || items.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "#9ca3af" }}>
        Belum ada riwayat PTO.
      </div>
    );
  }

  const statusPill = (status) => {
    const closed = ["closed", "done", "completed"].includes(
      (status || "").toLowerCase(),
    );
    return {
      backgroundColor: closed ? "rgba(20,83,45,0.5)" : "rgba(113,63,18,0.5)",
      color: closed ? "#86efac" : "#fde047",
      border: closed ? "1px solid #22c55e" : "1px solid #eab308",
    };
  };

  const yesNo = (v) => (v ? "Ya" : "Tidak");

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {items.map((r) => (
          <div
            key={r.id}
            onClick={() => setSelected(r)}
            style={{
              padding: 16,
              background: "#1e1e2d",
              borderRadius: 8,
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
                marginBottom: 12,
                alignItems: "flex-start",
              }}
            >
              <div>
                <span
                  style={{
                    color: "#9ca3af",
                    fontSize: 12,
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  {new Date(r.created_at).toLocaleString("id-ID", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <h3
                  style={{
                    color: "#fff",
                    fontWeight: 500,
                    fontSize: 16,
                    margin: 0,
                  }}
                >
                  {r.site} - {r.detail_lokasi}
                </h3>
              </div>
              <span
                style={{
                  padding: "4px 12px",
                  borderRadius: 9999,
                  fontSize: 12,
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  marginLeft: 8,
                  ...statusPill(r.status),
                }}
              >
                {r.status || "Unknown"}
              </span>
            </div>
            <div style={{ display: "grid", gap: 8, fontSize: 14 }}>
              <div>
                <span
                  style={{ color: "#6b7280", display: "block", fontSize: 12 }}
                >
                  Alasan Observasi:
                </span>
                <span style={{ color: "#d1d5db" }}>
                  {r.alasan_observasi || "-"}
                </span>
              </div>
              <div>
                <span
                  style={{ color: "#6b7280", display: "block", fontSize: 12 }}
                >
                  Prosedur:
                </span>
                <span style={{ color: "#d1d5db" }}>
                  {r.nama_prosedur || r.prosedur_id || "-"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{
              background: "#1e1e2d",
              borderRadius: 12,
              padding: 24,
              width: "100%",
              maxWidth: 640,
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
                marginBottom: 20,
                borderBottom: "1px solid #374151",
                paddingBottom: 16,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 600,
                  color: "#fff",
                }}
              >
                Detail PTO
              </h2>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#9ca3af",
                  fontSize: 24,
                  cursor: "pointer",
                  padding: "0 8px",
                }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: "grid", gap: 16 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <div>
                  <label
                    style={{
                      color: "#9ca3af",
                      fontSize: 12,
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Tanggal
                  </label>
                  <div>
                    {new Date(selected.created_at).toLocaleString("id-ID")}
                  </div>
                </div>
                <div>
                  <label
                    style={{
                      color: "#9ca3af",
                      fontSize: 12,
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Status
                  </label>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 500,
                      ...statusPill(selected.status),
                    }}
                  >
                    {selected.status || "Unknown"}
                  </span>
                </div>
              </div>
              <div>
                <label
                  style={{
                    color: "#9ca3af",
                    fontSize: 12,
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Lokasi
                </label>
                <div style={{ fontWeight: 500, color: "#fff" }}>
                  {selected.site} - {selected.detail_lokasi}
                </div>
              </div>
              <div>
                <label
                  style={{
                    color: "#9ca3af",
                    fontSize: 12,
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Alasan Observasi
                </label>
                <div>{selected.alasan_observasi || "-"}</div>
              </div>
              <div>
                <label
                  style={{
                    color: "#9ca3af",
                    fontSize: 12,
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Prosedur
                </label>
                <div>
                  {selected.nama_prosedur || selected.prosedur_id || "-"}
                </div>
              </div>
              {selected.nama_observer_tambahan && (
                <div>
                  <label
                    style={{
                      color: "#9ca3af",
                      fontSize: 12,
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Observer Tambahan
                  </label>
                  <div>{selected.nama_observer_tambahan}</div>
                </div>
              )}
              <div>
                <label
                  style={{
                    color: "#9ca3af",
                    fontSize: 12,
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Observee
                </label>
                <div>{selected.nama_observee || "-"}</div>
              </div>
              <div>
                <label
                  style={{
                    color: "#9ca3af",
                    fontSize: 12,
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Pekerjaan Yang Dilakukan
                </label>
                <div style={{ whiteSpace: "pre-wrap" }}>
                  {selected.pekerjaan_yang_dilakukan || "-"}
                </div>
              </div>
              <div
                style={{
                  background: "rgba(255,255,255,0.05)",
                  padding: 16,
                  borderRadius: 8,
                }}
              >
                <h4
                  style={{ margin: "0 0 12px 0", fontSize: 14, color: "#fff" }}
                >
                  Checklist Keselamatan
                </h4>
                <div style={{ display: "grid", gap: 8, fontSize: 13 }}>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span>Langkah kerja aman</span>
                    <b
                      style={{
                        color: selected.langkah_kerja_aman
                          ? "#4ade80"
                          : "#f87171",
                      }}
                    >
                      {yesNo(selected.langkah_kerja_aman)}
                    </b>
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span>APD sesuai</span>
                    <b
                      style={{
                        color: selected.apd_sesuai ? "#4ade80" : "#f87171",
                      }}
                    >
                      {yesNo(selected.apd_sesuai)}
                    </b>
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span>Area kerja aman</span>
                    <b
                      style={{
                        color: selected.area_kerja_aman ? "#4ade80" : "#f87171",
                      }}
                    >
                      {yesNo(selected.area_kerja_aman)}
                    </b>
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span>Peralatan aman</span>
                    <b
                      style={{
                        color: selected.peralatan_aman ? "#4ade80" : "#f87171",
                      }}
                    >
                      {yesNo(selected.peralatan_aman)}
                    </b>
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span>Peduli keselamatan</span>
                    <b
                      style={{
                        color: selected.peduli_keselamatan
                          ? "#4ade80"
                          : "#f87171",
                      }}
                    >
                      {yesNo(selected.peduli_keselamatan)}
                    </b>
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span>Paham resiko & prosedur</span>
                    <b
                      style={{
                        color: selected.paham_resiko_prosedur
                          ? "#4ade80"
                          : "#f87171",
                      }}
                    >
                      {yesNo(selected.paham_resiko_prosedur)}
                    </b>
                  </div>
                </div>
              </div>
              {selected.foto_temuan && (
                <div>
                  <label
                    style={{
                      color: "#9ca3af",
                      fontSize: 12,
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    Foto Temuan
                  </label>
                  <img
                    src={selected.foto_temuan}
                    alt="Bukti PTO"
                    style={{ width: "100%", borderRadius: 8 }}
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

export default PTOHistory;
