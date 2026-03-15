import React, { useEffect, useRef } from "react";

/**
 * Modal dengan search untuk memilih beberapa opsi dari daftar (Multi-select).
 * @param {string} title - Judul modal
 * @param {string[]} options - Daftar opsi (string)
 * @param {string[]} selectedOptions - Daftar opsi yang sedang dipilih
 * @param {Function} onToggleOption - Callback saat opsi di-toggle (dicentang/hapus)
 * @param {string} searchQuery - Nilai search
 * @param {Function} onSearchChange - Callback saat search berubah
 * @param {boolean} show - Tampilkan modal
 * @param {Function} onClose - Callback saat tutup
 * @param {string} placeholder - Placeholder input search
 */
const MultiSelectModalWithSearch = ({
  title = "Pilih",
  options = [],
  selectedOptions = [],
  onToggleOption,
  searchQuery = "",
  onSearchChange,
  show = false,
  onClose,
  placeholder = "Ketik untuk mencari...",
}) => {
  const rootRef = useRef(null);

  useEffect(() => {
    if (!show) return;
    const onCloseByBack = () => onClose && onClose();
    const onCloseEvent = () => onClose && onClose();
    // Tandai modal terbuka untuk handler back global
    if (rootRef.current) {
      rootRef.current.setAttribute("data-modal", "multi-select-modal");
      rootRef.current.setAttribute("data-open", "true");
    }
    window.addEventListener("close-multi-select-modal", onCloseEvent);
    // Push dummy history agar tombol back menutup modal lebih dulu (web)
    try {
      window.history.pushState({ modal: "multi-select" }, "");
      const popListener = () => onCloseByBack();
      window.addEventListener("popstate", popListener, { once: true });
      // Cleanup
      return () => {
        window.removeEventListener("popstate", popListener);
        window.removeEventListener("close-multi-select-modal", onCloseEvent);
        if (rootRef.current) rootRef.current.setAttribute("data-open", "false");
      };
    } catch (_) {
      return () => {
        window.removeEventListener("close-multi-select-modal", onCloseEvent);
        if (rootRef.current) rootRef.current.setAttribute("data-open", "false");
      };
    }
  }, [show, onClose]);

  if (!show) return null;

  const filtered = options.filter((opt) =>
    (opt || "").toLowerCase().includes((searchQuery || "").toLowerCase())
  );

  return (
    <div
      ref={rootRef}
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
          display: "flex",
          flexDirection: "column",
          background: "#fff",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          padding: "16px 16px 24px 16px",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>{title}</div>
          <button 
            type="button" 
            onClick={onClose} 
            style={{ 
              background: "none", 
              border: "none", 
              fontSize: 14, 
              color: "#2563eb", 
              fontWeight: 600,
              padding: "4px 8px"
            }}
          >
            Selesai
          </button>
        </div>
        
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
            flexShrink: 0,
          }}
        />
        
        <div style={{ maxHeight: 280, overflowY: "auto" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 16, color: "#374151", fontSize: 14, fontWeight: 500 }}>Tidak ada hasil</div>
          ) : (
            filtered.map((opt) => (
              <label
                key={opt}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "12px 0",
                  borderBottom: "1px solid #e5e7eb",
                  cursor: "pointer",
                  fontSize: 15,
                  color: "#111827",
                  fontWeight: 500,
                  WebkitTapHighlightColor: "transparent"
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedOptions.includes(opt)}
                  onChange={() => {
                    onToggleOption && onToggleOption(opt);
                  }}
                  style={{
                    marginTop: "2px",
                    width: "18px",
                    height: "18px",
                    cursor: "pointer",
                  }}
                />
                <span style={{ lineHeight: "1.4", flex: 1 }}>{opt}</span>
              </label>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiSelectModalWithSearch;
