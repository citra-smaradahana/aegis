import React, { useState, useRef, useEffect } from "react";

/**
 * Field pencarian orang: bisa pilih dari list user site atau ketik manual (untuk orang di luar sistem).
 * Desktop: input + dropdown suggestions
 * Mobile: click buka modal (style sama dengan pencarian lain)
 */
const SearchablePersonField = ({
  value,
  onChange,
  userList = [],
  placeholder = "Ketik atau pilih...",
  isMobile,
  onOpenModal,
  label,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");
  const containerRef = useRef(null);

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  const filteredUsers = userList.filter(
    (u) =>
      (u.nama || "")
        .toLowerCase()
        .includes((inputValue || "").toLowerCase()) ||
      (u.jabatan || "")
        .toLowerCase()
        .includes((inputValue || "").toLowerCase())
  );

  const handleBlur = () => {
    setTimeout(() => setShowDropdown(false), 150);
  };

  const handleSelectUser = (nama) => {
    setInputValue(nama);
    onChange(nama);
    setShowDropdown(false);
  };

  const handleInputChange = (e) => {
    const v = e.target.value;
    setInputValue(v);
    onChange(v);
    setShowDropdown(true);
  };

  if (isMobile) {
    return (
      <div>
        {label && (
          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
            {label}
          </label>
        )}
        <div
          onClick={onOpenModal}
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            background: "#fff",
            fontSize: 14,
            color: value ? "#1f2937" : "#6b7280",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>{value || placeholder}</span>
          <span style={{ color: "#9ca3af", fontSize: 12 }}>▼</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {label && (
        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
          {label}
        </label>
      )}
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setShowDropdown(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border"
      />
      {showDropdown && filteredUsers.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 2,
            maxHeight: 200,
            overflowY: "auto",
            background: "#fff",
            border: "1px solid #d1d5db",
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            zIndex: 50,
          }}
        >
          {filteredUsers.map((u) => (
            <div
              key={u.id}
              onClick={() => handleSelectUser(u.nama || "")}
              style={{
                padding: "10px 14px",
                fontSize: 14,
                color: "#1f2937",
                cursor: "pointer",
                borderBottom: "1px solid #f3f4f6",
              }}
              onMouseDown={(e) => e.preventDefault()}
            >
              {u.nama}
              {u.jabatan ? ` (${u.jabatan})` : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchablePersonField;
