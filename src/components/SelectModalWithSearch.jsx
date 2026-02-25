import React from "react";

/**
 * Modal dengan search untuk memilih satu opsi dari daftar.
 * @param {string} title - Judul modal
 * @param {string[]} options - Daftar opsi (string)
 * @param {string} searchQuery - Nilai search
 * @param {Function} onSearchChange - Callback saat search berubah
 * @param {boolean} show - Tampilkan modal
 * @param {Function} onClose - Callback saat tutup
 * @param {Function} onSelect - Callback saat opsi dipilih (value string)
 * @param {string} placeholder - Placeholder input search
 */
const SelectModalWithSearch = ({
  title = "Pilih",
  options = [],
  searchQuery = "",
  onSearchChange,
  show = false,
  onClose,
  onSelect,
  placeholder = "Ketik untuk mencari...",
}) => {
  if (!show) return null;

  const filtered = options.filter((opt) =>
    (opt || "").toLowerCase().includes((searchQuery || "").toLowerCase())
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: "rgba(0,0,0,0.5)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxHeight: "70vh",
          background: "#fff",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          padding: 16,
          boxShadow: "0 -4px 20px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12, color: "#111827" }}>{title}</div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 8,
            border: "2px solid #374151",
            fontSize: 14,
            marginBottom: 12,
            color: "#111827",
            backgroundColor: "#fff",
          }}
        />
        <div style={{ maxHeight: 280, overflowY: "auto" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 16, color: "#374151", fontSize: 14, fontWeight: 500 }}>Tidak ada hasil</div>
          ) : (
            filtered.map((opt) => (
              <div
                key={opt}
                onClick={() => {
                  onSelect && onSelect(opt);
                }}
                style={{
                  padding: "12px 14px",
                  borderBottom: "1px solid #e5e7eb",
                  cursor: "pointer",
                  fontSize: 14,
                  color: "#111827",
                  fontWeight: 500,
                }}
              >
                {opt}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectModalWithSearch;
