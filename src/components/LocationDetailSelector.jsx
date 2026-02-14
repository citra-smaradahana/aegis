import React, { useState, useEffect } from "react";
import { getLocationOptions } from "../config/siteLocations";
import MobileBackGesture from "./MobileBackGesture";

const LocationDetailSelector = ({
  site,
  value,
  onChange,
  placeholder = "Pilih Detail Lokasi",
  disabled = false,
  style = {},
  required = false,
  useNativeDropdown = false, // true = selalu dropdown, tidak buka halaman lain (untuk Hazard Report mobile)
}) => {
  const [showLocationSelection, setShowLocationSelection] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // BSIB specific locations
  const bsibLocations = [
    "Office",
    "Workshop",
    "OSP",
    "PIT A",
    "PIT C",
    "PIT E",
    "Candrian",
    "HLO",
  ];

  const locationOptions =
    site === "BSIB" ? bsibLocations : getLocationOptions(site);

  // Update mobile detection on resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLocationSelect = (location) => {
    onChange({ target: { name: "detailLokasi", value: location } });
    setShowLocationSelection(false);
  };

  const handleBack = () => {
    setShowLocationSelection(false);
  };

  // Desktop dropdown for BSIB
  const renderDesktopDropdown = () => {
    if (site !== "BSIB" || isMobile) return null;

    // Debug: Log props received
    console.log("LocationDetailSelector props:", {
      site,
      value,
      disabled,
      placeholder,
    });

    return (
      <select
        value={value || ""}
        onChange={(e) =>
          onChange({ target: { name: "detailLokasi", value: e.target.value } })
        }
        disabled={disabled}
        required={required}
        style={{
          width: "100%",
          padding: "12px 16px",
          borderRadius: "8px",
          border: "1px solid #334155",
          fontSize: "14px",
          backgroundColor: disabled ? "#1f2937" : "#0b1220",
          color: disabled ? "#9ca3af" : "#e5e7eb",
          cursor: disabled ? "not-allowed" : "pointer",
          ...style,
        }}
      >
        {!value && <option value="">{placeholder}</option>}
        {locationOptions.map((location) => (
          <option key={location} value={location}>
            {location}
          </option>
        ))}
      </select>
    );
  };

  // Mobile page for BSIB
  const LocationSelectionPage = () => (
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
            Pilih Detail Lokasi
          </h1>
          <div style={{ width: "60px" }}></div>
        </div>

        {/* Location List */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px",
          }}
        >
          <div
            style={{
              display: "grid",
              gap: "12px",
            }}
          >
            {locationOptions.map((location) => (
              <div
                key={location}
                onClick={() => handleLocationSelect(location)}
                className="clickable"
                style={{
                  backgroundColor: "#ffffff",
                  padding: "16px",
                  borderRadius: "12px",
                  border:
                    value === location
                      ? "2px solid #3b82f6"
                      : "1px solid #e5e7eb",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow:
                    value === location
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
                    value === location
                      ? "0 4px 12px rgba(59, 130, 246, 0.15)"
                      : "0 1px 3px rgba(0, 0, 0, 0.1)";
                }}
              >
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: "500",
                    color: "#1f2937",
                  }}
                >
                  {location}
                </span>
                {value === location && (
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
            onClick={() => value && handleLocationSelect(value)}
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
            Pilih Detail Lokasi
          </button>
        </div>
      </div>
    </MobileBackGesture>
  );

  // Native dropdown untuk mobile (Hazard Report: tidak redirect ke halaman lain)
  const renderNativeMobileDropdown = () => {
    if (!useNativeDropdown || !isMobile) return null;
    return (
      <select
        value={value || ""}
        onChange={(e) =>
          onChange({ target: { name: "detailLokasi", value: e.target.value } })
        }
        disabled={disabled}
        required={required}
        style={{
          width: "100%",
          padding: "12px 16px",
          borderRadius: "8px",
          border: "1px solid #d1d5db",
          fontSize: "14px",
          backgroundColor: disabled ? "#f3f4f6" : "#ffffff",
          color: disabled ? "#9ca3af" : "#000000",
          cursor: disabled ? "not-allowed" : "pointer",
          ...style,
        }}
      >
        <option value="">{placeholder}</option>
        {locationOptions.map((location) => (
          <option key={location} value={location}>
            {location}
          </option>
        ))}
      </select>
    );
  };

  // Mobile dropdown untuk non-BSIB. Paksa tidak tampil di desktop
  const renderMobileDropdown = () => {
    if (!isMobile) return null; // cegah render di desktop sepenuhnya
    if (site === "BSIB") return null;
    if (useNativeDropdown) return null;

    return (
      <div
        onClick={() => !disabled && setShowLocationSelection(true)}
        className="mobile-dropdown location-selector"
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
    );
  };

  return (
    <>
      {/* Desktop dropdown for BSIB */}
      {renderDesktopDropdown()}

      {/* Mobile dropdown for non-BSIB sites */}
      {renderMobileDropdown()}

      {/* Native dropdown mobile (Hazard Report: dropdown saja, tidak redirect) */}
      {renderNativeMobileDropdown()}

      {/* Mobile page for BSIB - hanya saat mobile, tidak jika useNativeDropdown */}
      {isMobile && site === "BSIB" && !useNativeDropdown && (
        <div
          onClick={() => !disabled && setShowLocationSelection(true)}
          className="mobile-dropdown location-selector"
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
            // Sembunyikan pada mode desktop untuk memastikan tidak muncul
            // meskipun class ada di DOM
            ...(window.innerWidth > 768 ? { display: "none" } : {}),
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
      )}

      {showLocationSelection && <LocationSelectionPage />}
    </>
  );
};

export default LocationDetailSelector;
