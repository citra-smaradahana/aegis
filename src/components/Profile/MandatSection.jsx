import React, { useState, useEffect } from "react";
import {
  canGiveMandate,
  fetchMandateRecipients,
  fetchMandatesGivenByUser,
  createMandate,
  deactivateMandate,
  MANDATE_CONFIG,
} from "../../utils/mandateHelpers";

// Modal popup Penerima Mandat - muncul dari atas navbar (bottom sheet)
function PenerimaMandatModal({
  show,
  onClose,
  recipients,
  searchQuery,
  onSearchChange,
  onSelect,
}) {
  if (!show) return null;
  const filtered = recipients.filter((r) =>
    `${r.nama || ""} ${r.jabatan || ""}`.toLowerCase().includes((searchQuery || "").toLowerCase())
  );
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 70,
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 1100,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: 16, borderBottom: "1px solid #e5e7eb", flexShrink: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>Penerima Mandat</div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Ketik untuk mencari..."
            autoComplete="off"
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              fontSize: 16,
              boxSizing: "border-box",
            }}
          />
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {filtered.map((r) => (
            <div
              key={r.id}
              onClick={() => onSelect(r.id)}
              style={{
                padding: "14px 16px",
                fontSize: 16,
                color: "#1f2937",
                cursor: "pointer",
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              {r.nama} ({r.jabatan})
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: 24, textAlign: "center", color: "#6b7280", fontSize: 14 }}>
              Tidak ada yang sesuai
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MandatSection({ user, isMobile = false, embedded = false }) {
  const [recipients, setRecipients] = useState([]);
  const [mandates, setMandates] = useState([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState("");
  const [activeFrom, setActiveFrom] = useState("");
  const [activeUntil, setActiveUntil] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPenerimaModal, setShowPenerimaModal] = useState(false);
  const [penerimaSearchQuery, setPenerimaSearchQuery] = useState("");

  const config = user?.jabatan ? MANDATE_CONFIG[user.jabatan] : null;
  const showSection = canGiveMandate(user?.jabatan);

  useEffect(() => {
    if (!showSection || !user) return;
    loadRecipients();
    loadMandates();
  }, [showSection, user?.id, user?.site, user?.jabatan]);

  const loadRecipients = async () => {
    const data = await fetchMandateRecipients(user);
    setRecipients(data);
  };

  const loadMandates = async () => {
    const data = await fetchMandatesGivenByUser(user);
    setMandates(data);
  };

  const setDefaultDates = () => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    setActiveFrom(today.toISOString().split("T")[0]);
    setActiveUntil(nextWeek.toISOString().split("T")[0]);
  };

  useEffect(() => {
    if (showSection && !activeFrom) setDefaultDates();
  }, [showSection]);

  const handleCreateMandate = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!selectedRecipientId || !activeFrom || !activeUntil) {
      setError("Pilih penerima dan periode mandat.");
      return;
    }
    if (new Date(activeUntil) < new Date(activeFrom)) {
      setError("Tanggal selesai harus setelah tanggal mulai.");
      return;
    }

    setLoading(true);
    try {
      // Deactivate any existing mandate of same type (UNIQUE constraint)
      const existing = mandates.find((m) => m.is_active);
      if (existing) {
        await deactivateMandate(existing.id);
      }

      const { error: err } = await createMandate({
        site: user.site,
        mandate_type: config.mandateType,
        delegated_by_user_id: user.id,
        delegated_to_user_id: selectedRecipientId,
        active_from: activeFrom,
        active_until: activeUntil,
        is_active: true,
      });
      if (err) throw err;
      setSuccess("Mandat berhasil dibuat.");
      setSelectedRecipientId("");
      setDefaultDates();
      loadMandates();
      loadRecipients();
    } catch (err) {
      setError(err?.message || "Gagal membuat mandat.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (mandateId) => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const { error: err } = await deactivateMandate(mandateId);
      if (err) throw err;
      setSuccess("Mandat berhasil dinonaktifkan.");
      loadMandates();
    } catch (err) {
      setError(err?.message || "Gagal menonaktifkan mandat.");
    } finally {
      setLoading(false);
    }
  };

  const getMandateLabel = () => {
    if (!config) return "";
    const labels = {
      PLH_TO_FLH: "Plant Leading Hand → Field Leading Hand",
      SHERQ_TO_ASST_PJO_OR_PJO: "SHERQ Officer → Asst. PJO / PJO",
      PJO_TO_ASST_PJO: "PJO → Asst. PJO",
    };
    return labels[config.mandateType] || config.mandateType;
  };

  if (!showSection) return null;

  const baseTextColor = isMobile ? "#374151" : "#e5e7eb";
  const baseLabelColor = isMobile ? "#6b7280" : "#9ca3af";
  const cardBg = isMobile ? "#fff" : "#1f2937";
  const cardBorder = isMobile ? "#e5e7eb" : "#374151";
  const inputBg = isMobile ? "#f9fafb" : "#111827";

  return (
    <div
      style={{
        ...(embedded ? {} : { marginTop: 32, padding: 24, background: cardBg, borderRadius: 12, border: `1px solid ${cardBorder}` }),
      }}
    >
      {!embedded && (
        <h4
          style={{
            margin: "0 0 16px 0",
            fontSize: 18,
            fontWeight: 600,
            color: baseTextColor,
          }}
        >
          Mandat Validasi Fit To Work
        </h4>
      )}
      <p
        style={{
          margin: "0 0 20px 0",
          fontSize: 14,
          color: baseLabelColor,
          lineHeight: 1.5,
        }}
      >
        {getMandateLabel()}. Berikan mandat kepada rekan di site yang sama apabila Anda tidak onsite.
      </p>

      <form onSubmit={handleCreateMandate} style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile || embedded ? "1fr" : "1fr 1fr 1fr auto",
            gap: 16,
            alignItems: "end",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: 12,
                fontWeight: 600,
                color: baseLabelColor,
              }}
            >
              Penerima Mandat
            </label>
            {isMobile ? (
              <>
                <div
                  onClick={() => setShowPenerimaModal(true)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setShowPenerimaModal(true)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: `1px solid ${cardBorder}`,
                    borderRadius: 8,
                    background: inputBg,
                    color: selectedRecipientId ? baseTextColor : baseLabelColor,
                    fontSize: 14,
                    cursor: "pointer",
                    minHeight: 40,
                  }}
                >
                  {(() => {
                    const r = recipients.find((x) => x.id === selectedRecipientId);
                    return r ? `${r.nama} (${r.jabatan})` : "Pilih penerima...";
                  })()}
                </div>
                {showPenerimaModal && (
                  <PenerimaMandatModal
                    show={showPenerimaModal}
                    onClose={() => {
                      setShowPenerimaModal(false);
                      setPenerimaSearchQuery("");
                    }}
                    recipients={recipients}
                    searchQuery={penerimaSearchQuery}
                    onSearchChange={setPenerimaSearchQuery}
                    onSelect={(id) => {
                      setSelectedRecipientId(id || "");
                      setShowPenerimaModal(false);
                      setPenerimaSearchQuery("");
                    }}
                  />
                )}
              </>
            ) : (
              <select
                value={selectedRecipientId}
                onChange={(e) => setSelectedRecipientId(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: `1px solid ${cardBorder}`,
                  borderRadius: 8,
                  background: inputBg,
                  color: baseTextColor,
                  fontSize: 14,
                }}
              >
                <option value="">Pilih penerima...</option>
                {recipients.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nama} ({r.jabatan})
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: 12,
                fontWeight: 600,
                color: baseLabelColor,
              }}
            >
              Mulai
            </label>
            <input
              type="date"
              value={activeFrom}
              onChange={(e) => setActiveFrom(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                border: `1px solid ${cardBorder}`,
                borderRadius: 8,
                background: inputBg,
                color: baseTextColor,
                fontSize: 14,
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: 12,
                fontWeight: 600,
                color: baseLabelColor,
              }}
            >
              Selesai
            </label>
            <input
              type="date"
              value={activeUntil}
              onChange={(e) => setActiveUntil(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                border: `1px solid ${cardBorder}`,
                borderRadius: 8,
                background: inputBg,
                color: baseTextColor,
                fontSize: 14,
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading || recipients.length === 0}
            style={{
              padding: "10px 20px",
              background: loading ? "#6b7280" : "#60a5fa",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Memproses..." : "Aktifkan Mandat"}
          </button>
        </div>
      </form>

      {error && (
        <div
          style={{
            padding: 12,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            color: "#dc2626",
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          style={{
            padding: 12,
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: 8,
            color: "#16a34a",
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          {success}
        </div>
      )}

      <div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: baseLabelColor,
            marginBottom: 8,
          }}
        >
          Mandat Aktif
        </div>
        {mandates.filter((m) => m.is_active).length === 0 ? (
          <div
            style={{
              padding: 16,
              background: inputBg,
              borderRadius: 8,
              border: `1px dashed ${cardBorder}`,
              color: baseLabelColor,
              fontSize: 14,
              fontStyle: "italic",
            }}
          >
            Belum ada mandat aktif
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {mandates
              .filter((m) => m.is_active)
              .map((m) => {
                const to = m.delegated_to;
                const toName = Array.isArray(to) ? to[0]?.nama : to?.nama;
                const toJabatan = Array.isArray(to) ? to[0]?.jabatan : to?.jabatan;
                return (
                  <div
                    key={m.id}
                    style={{
                      padding: 12,
                      background: inputBg,
                      borderRadius: 8,
                      border: `1px solid ${cardBorder}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: baseTextColor, fontSize: 14 }}>
                        {toName || "-"} ({toJabatan || "-"})
                      </div>
                      <div style={{ fontSize: 12, color: baseLabelColor }}>
                        {m.active_from} s/d {m.active_until}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeactivate(m.id)}
                      disabled={loading}
                      style={{
                        padding: "6px 12px",
                        background: "#ef4444",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: loading ? "not-allowed" : "pointer",
                      }}
                    >
                      Nonaktifkan
                    </button>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MandatSection;
