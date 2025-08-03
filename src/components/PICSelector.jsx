import React, { useState, useEffect, useRef } from "react";
import MobileBackGesture from "./MobileBackGesture";
import { supabase } from "../supabaseClient";

const PICSelector = ({
  value,
  onChange,
  placeholder = "Pilih PIC",
  disabled = false,
  style = {},
  required = false,
  site = "",
  currentUser = null,
}) => {
  const [showPICSelection, setShowPICSelection] = useState(false);
  const [picOptions, setPicOptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const searchInputRef = useRef(null);

  // Fetch PIC options based on site
  useEffect(() => {
    const fetchPICOptions = async () => {
      if (!site) {
        setPicOptions([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("users")
          .select("nama, jabatan")
          .eq("site", site)
          .neq("nama", currentUser?.nama) // Exclude current user at database level
          .order("nama");

        if (error) {
          console.error("Error fetching PIC options:", error);
          setPicOptions([]);
        } else {
          // Filter out current user from PIC options
          const filteredData = data
            ? data.filter((user) => {
                // More robust filtering - check for exact match and trim whitespace
                const userName = user.nama?.trim();
                const currentUserName = currentUser?.nama?.trim();
                return userName !== currentUserName;
              })
            : [];

          // Debug logging
          console.log("PICSelector - Current user:", currentUser?.nama);
          console.log("PICSelector - All users from site:", data);
          console.log("PICSelector - Filtered users:", filteredData);

          setPicOptions(filteredData);
        }
      } catch (error) {
        console.error("Error fetching PIC options:", error);
        setPicOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPICOptions();
  }, [site, currentUser?.nama]);

  const handlePICSelect = (pic) => {
    // Double-check to prevent self-selection
    const userName = pic?.trim();
    const currentUserName = currentUser?.nama?.trim();

    if (userName === currentUserName) {
      console.warn("PICSelector - Attempted to select self:", userName);
      return; // Prevent self-selection
    }

    onChange({ target: { name: "pic", value: pic } });
    setShowPICSelection(false);
    setSearchTerm("");
  };

  const handleBack = () => {
    setShowPICSelection(false);
    setSearchTerm("");
  };

  // Simplified focus handling
  const handleInputFocus = (e) => {
    e.target.setAttribute("data-focused", "true");
  };

  // Focus search input when selection page opens - simplified
  useEffect(() => {
    if (showPICSelection && searchInputRef.current) {
      // Single focus attempt with delay to ensure page is rendered
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.setAttribute("data-focused", "true");
        }
      }, 100);
    }
  }, [showPICSelection]);

  // Filter PIC options based on search term
  const filteredPICOptions = picOptions.filter(
    (pic) =>
      // Filter by search term
      pic.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pic.jabatan.toLowerCase().includes(searchTerm.toLowerCase())
  );



  const PICSelectionPage = () => (
    <MobileBackGesture onBack={handleBack}>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#f8f9fa",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "16px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button
            onClick={handleBack}
            className="clickable"
            style={{
              background: "none",
              border: "none",
              fontSize: "16px",
              color: "#3b82f6",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "4px",
            }}
          >
            ← Kembali
          </button>
          <h1
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: "600",
              color: "#1f2937",
            }}
          >
            Pilih PIC
          </h1>
          <div style={{ width: "60px" }}></div>
        </div>

        {/* Search Bar */}
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "16px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                position: "absolute",
                left: "12px",
                color: "#9ca3af",
                zIndex: 1,
              }}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
                         <input
               ref={searchInputRef}
               type="text"
               placeholder="Cari nama atau jabatan PIC..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               onFocus={handleInputFocus}
               autoComplete="off"
               autoCorrect="off"
               autoCapitalize="off"
               spellCheck="false"
               inputMode="text"
               enterKeyHint="search"
               className="mobile-search-input"
               style={{
                 width: "100%",
                 padding: "12px 12px 12px 40px",
                 borderRadius: "8px",
                 border: "1px solid #d1d5db",
                 fontSize: "16px",
                 backgroundColor: "#ffffff",
                 outline: "none",
                 WebkitAppearance: "none",
                 MozAppearance: "none",
                 appearance: "none",
                 touchAction: "manipulation",
                 userSelect: "text",
                 WebkitTapHighlightColor: "transparent",
                 WebkitUserSelect: "text",
                 WebkitTouchCallout: "none",
                 WebkitOverflowScrolling: "touch",
               }}
             />
          </div>
        </div>

        {/* PIC List */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px",
          }}
        >
          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "40px",
                color: "#6b7280",
              }}
            >
              Memuat data PIC...
            </div>
          ) : filteredPICOptions.length === 0 ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "40px",
                color: "#6b7280",
                textAlign: "center",
              }}
            >
              {searchTerm
                ? "Tidak ada PIC yang sesuai dengan pencarian"
                : "Tidak ada data PIC untuk site ini"}
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "12px",
              }}
            >
              {filteredPICOptions.map((pic) => (
                <div
                  key={pic.nama}
                  onClick={() => handlePICSelect(pic.nama)}
                  className="clickable"
                  style={{
                    backgroundColor: "#ffffff",
                    padding: "16px",
                    borderRadius: "12px",
                    border:
                      value === pic.nama
                        ? "2px solid #3b82f6"
                        : "1px solid #e5e7eb",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    boxShadow:
                      value === pic.nama
                        ? "0 4px 12px rgba(59, 130, 246, 0.15)"
                        : "0 1px 3px rgba(0, 0, 0, 0.1)",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-1px)";
                    e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow =
                      value === pic.nama
                        ? "0 4px 12px rgba(59, 130, 246, 0.15)"
                        : "0 1px 3px rgba(0, 0, 0, 0.1)";
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: "500",
                        color: "#1f2937",
                        marginBottom: "4px",
                      }}
                    >
                      {pic.nama}
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#6b7280",
                      }}
                    >
                      {pic.jabatan}
                    </div>
                  </div>
                  {value === pic.nama && (
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        backgroundColor: "#3b82f6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: "#ffffff",
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "16px",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <button
            onClick={() => value && handlePICSelect(value)}
            disabled={!value}
            className="clickable"
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: value ? "#3b82f6" : "#9ca3af",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: value ? "pointer" : "not-allowed",
              transition: "background-color 0.2s ease",
            }}
          >
            Pilih PIC
          </button>
        </div>
      </div>
    </MobileBackGesture>
  );

  return (
    <>
      <div
        onClick={() => !disabled && setShowPICSelection(true)}
        className="mobile-dropdown pic-selector"
        style={{
          width: "100%",
          borderRadius: 8,
          padding: "4px 12px",
          fontSize: 14,
          backgroundColor: disabled ? "#f3f4f6" : "#ffffff",
          color: disabled ? "#9ca3af" : "#000000",
          border: "1px solid #d1d5db",
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: "32px",
          boxSizing: "border-box",
          ...style,
        }}
      >
        <span style={{ color: value ? "#000000" : "#6b7280" }}>
          {value || placeholder}
        </span>
        {!disabled && (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "#6b7280" }}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        )}
      </div>

      {showPICSelection && <PICSelectionPage />}
    </>
  );
};

export default PICSelector;
