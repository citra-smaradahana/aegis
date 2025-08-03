import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import MobileBackGesture from "./MobileBackGesture";

const PICSelector = ({
  value,
  onChange,
  site,
  currentUser,
  placeholder = "Pilih PIC...",
}) => {
  const [showPICSelection, setShowPICSelection] = useState(false);
  const [picOptions, setPicOptions] = useState([]);

  // Fetch PIC options from users table
  useEffect(() => {
    const fetchPIC = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("nama, jabatan")
          .neq("nama", currentUser?.nama) // Filter out current user at database level
          .order("nama", { ascending: true }); // Sort alphabetically by name

        if (error) {
          console.error("Error fetching PIC options:", error);
          return;
        }

        if (data) {
          // Additional client-side filtering for robustness
          const filteredData = data.filter((user) => {
            const userName = user.nama?.trim();
            const currentUserName = currentUser?.nama?.trim();
            return userName !== currentUserName;
          });

          // Debug logging
          console.log("PICSelector - Current user:", currentUser?.nama);
          console.log("PICSelector - Current user trimmed:", currentUser?.nama?.trim());
          console.log("PICSelector - All users from site:", data);
          console.log("PICSelector - Filtered users:", filteredData);

          // Additional check - log each user being filtered
          if (data) {
            data.forEach(user => {
              const userName = user.nama?.trim();
              const currentUserName = currentUser?.nama?.trim();
              console.log(`PICSelector - Checking user: "${userName}" vs current: "${currentUserName}" - Match: ${userName === currentUserName}`);
            });
          }

          setPicOptions(filteredData);
        }
      } catch (error) {
        console.error("Error fetching PIC options:", error);
      }
    };

    if (site) {
      fetchPIC();
    }
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
  };

  const handleBack = () => {
    setShowPICSelection(false);
  };

  const PICSelectionPage = () => (
    <MobileBackGesture onBack={handleBack}>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#f5f5f5",
          zIndex: 1000,
          overflow: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: "#1e40af",
            color: "white",
            padding: "16px",
            textAlign: "center",
            position: "sticky",
            top: 0,
            zIndex: 1001,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button
              onClick={handleBack}
              style={{
                background: "none",
                border: "none",
                color: "white",
                fontSize: "20px",
                cursor: "pointer",
                padding: "4px",
              }}
              className="back-button-no-hover"
            >
              ←
            </button>
            <h2 style={{ margin: 0, flex: 1 }}>Pilih PIC</h2>
            <div style={{ width: "20px" }}></div>
          </div>
        </div>

        {/* PIC List */}
        <div style={{ padding: "16px" }}>
          {picOptions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
              Tidak ada PIC tersedia
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {picOptions.map((pic, index) => (
                <button
                  key={index}
                  onClick={() => handlePICSelect(pic.nama)}
                  style={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "16px",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#f3f4f6";
                    e.target.style.borderColor = "#d1d5db";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "white";
                    e.target.style.borderColor = "#e5e7eb";
                  }}
                >
                  <div style={{ fontWeight: "600", color: "#1f2937", marginBottom: "4px" }}>
                    {pic.nama}
                  </div>
                  <div style={{ fontSize: "14px", color: "#6b7280" }}>
                    {pic.jabatan}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </MobileBackGesture>
  );

  if (showPICSelection) {
    return <PICSelectionPage />;
  }

  return (
    <div
      onClick={() => setShowPICSelection(true)}
      style={{
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        padding: "12px 16px",
        backgroundColor: "white",
        cursor: "pointer",
        minHeight: "48px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={(e) => {
        e.target.style.borderColor = "#9ca3af";
      }}
      onMouseLeave={(e) => {
        e.target.style.borderColor = "#d1d5db";
      }}
    >
      <span style={{ color: value ? "#1f2937" : "#9ca3af" }}>
        {value || placeholder}
      </span>
      <span style={{ color: "#9ca3af", fontSize: "12px" }}>▼</span>
    </div>
  );
};

export default PICSelector;
