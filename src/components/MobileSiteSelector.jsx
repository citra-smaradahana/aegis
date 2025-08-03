import React, { useState } from "react";
import SiteSelectionPage from "./SiteSelectionPage";

const MobileSiteSelector = ({
  value,
  onChange,
  placeholder = "Pilih Lokasi",
  disabled = false,
  style = {},
  required = false,
}) => {
  const [showSiteSelection, setShowSiteSelection] = useState(false);

  const handleSiteSelect = (site) => {
    onChange({ target: { name: "lokasi", value: site } });
    setShowSiteSelection(false);
  };

  const handleBack = () => {
    setShowSiteSelection(false);
  };

  return (
    <>
      <div
        onClick={() => !disabled && setShowSiteSelection(true)}
        className="mobile-dropdown site-selector"
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

      {showSiteSelection && (
        <SiteSelectionPage
          onSelectSite={handleSiteSelect}
          onBack={handleBack}
          selectedSite={value}
        />
      )}
    </>
  );
};

export default MobileSiteSelector;
