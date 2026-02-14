import React from "react";

/**
 * Modal bottom-sheet dengan pencarian - popup dari bawah, navbar tetap terlihat (bottom: 70)
 * Digunakan untuk Hazard Report & Take 5 mobile - Lokasi, Detail Lokasi, dll.
 */
const SelectModalWithSearch = ({
  title,
  options,
  onSelect,
  searchQuery,
  onSearchChange,
  show,
  onClose,
  placeholder = "Ketik untuk mencari...",
}) => {
  if (!show) return null;
  const filtered = options.filter((opt) =>
    String(opt).toLowerCase().includes((searchQuery || "").toLowerCase())
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
        <div
          style={{
            padding: "16px",
            borderBottom: "1px solid #e5e7eb",
            flexShrink: 0,
          }}
        >
          <div className="mobile-popup-title" style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
            {title}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            autoComplete="off"
            className="mobile-popup-search-input"
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              fontSize: 16,
              boxSizing: "border-box",
              color: "#111827",
            }}
          />
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {filtered.map((opt) => (
            <div
              key={opt}
              onClick={() => onSelect(opt)}
              style={{
                padding: "14px 16px",
                fontSize: 16,
                color: "#1f2937",
                cursor: "pointer",
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              {opt}
            </div>
          ))}
          {filtered.length === 0 && (
            <div
              style={{
                padding: 24,
                textAlign: "center",
                color: "#6b7280",
                fontSize: 14,
              }}
            >
              Tidak ada yang sesuai
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectModalWithSearch;
