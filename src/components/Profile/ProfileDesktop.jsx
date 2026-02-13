import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { canGiveMandate } from "../../utils/mandateHelpers";
import MandatSection from "./MandatSection";

function ProfileDesktop({ user, onClose, onLogout }) {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfileData(data);
    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = () => {
    // Logic untuk ganti password akan dibuat selanjutnya
    console.log("Change password clicked");
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  if (loading) {
    return (
      <div
        style={{
          width: "100%",
          height: "100vh",
          background: "transparent",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "0 0 0 120px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: "transparent",
            borderRadius: 18,
            boxShadow: "none",
            padding: 16,
            maxWidth: 1400,
            width: "100%",
            margin: "0 auto",
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ textAlign: "center", color: "#9ca3af" }}>
            <div style={{ fontSize: 16 }}>Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  const columnCardStyle = {
    background: "#1f2937",
    border: "1px solid #374151",
    borderRadius: 16,
    padding: 24,
    height: "fit-content",
  };

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "transparent",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "24px 24px 24px 144px",
        overflow: "auto",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <h2
          style={{
            fontWeight: 900,
            fontSize: 28,
            color: "#60a5fa",
            margin: "0 0 24px 0",
            textAlign: "center",
          }}
        >
          Profile
        </h2>

        {/* 3 Kolom: Profile | Informasi Profile | Mandat Validasi */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 24,
            alignItems: "start",
          }}
        >
          {/* Kolom 1: Profile */}
          <div style={columnCardStyle}>
            <h3 style={{ margin: "0 0 24px 0", color: "#e5e7eb", fontSize: 18 }}>
              Profile
            </h3>
            <div style={{ textAlign: "center" }}>
              {profileData?.foto ? (
                <img
                  src={profileData.foto}
                  alt="Profile"
                  style={{
                    width: "140px",
                    height: "140px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    margin: "0 auto 20px",
                    border: "3px solid #60a5fa",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "140px",
                    height: "140px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px",
                    fontSize: "56px",
                    color: "#fff",
                    fontWeight: "bold",
                  }}
                >
                  {profileData?.nama ? profileData.nama.charAt(0).toUpperCase() : "U"}
                </div>
              )}
              <h4
                style={{
                  margin: "0 0 6px 0",
                  fontSize: 20,
                  fontWeight: 600,
                  color: "#e5e7eb",
                }}
              >
                {profileData?.nama || "User Name"}
              </h4>
              <p style={{ margin: "0 0 24px 0", fontSize: 14, color: "#9ca3af" }}>
                {profileData?.jabatan || "Jabatan"}
              </p>
              <button
                onClick={handleChangePassword}
                style={{
                  background: "#374151",
                  border: "1px solid #4b5563",
                  borderRadius: "8px",
                  padding: "12px 24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontSize: 14,
                  color: "#e5e7eb",
                  fontWeight: 500,
                  margin: "0 auto 12px",
                  width: "100%",
                  maxWidth: 200,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <circle cx="12" cy="16" r="1" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Ganti Password
              </button>
              <button
                onClick={handleLogout}
                style={{
                  background: "#ef4444",
                  border: "1px solid #dc2626",
                  borderRadius: "8px",
                  padding: "12px 24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontSize: 14,
                  color: "#fff",
                  fontWeight: 500,
                  margin: "0 auto",
                  width: "100%",
                  maxWidth: 200,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16,17 21,12 16,7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </button>
            </div>
          </div>

          {/* Kolom 2: Informasi Profile */}
          <div style={columnCardStyle}>
            <h3 style={{ margin: "0 0 24px 0", color: "#e5e7eb", fontSize: 18 }}>
              Informasi Profile
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "110px 1fr",
                rowGap: 14,
                columnGap: 16,
                alignItems: "center",
              }}
            >
              <div style={{ fontWeight: 600, color: "#9ca3af", fontSize: 14 }}>Nama:</div>
              <div style={{ color: "#e5e7eb", fontSize: 14 }}>{profileData?.nama || "-"}</div>
              <div style={{ fontWeight: 600, color: "#9ca3af", fontSize: 14 }}>Jabatan:</div>
              <div style={{ color: "#e5e7eb", fontSize: 14 }}>{profileData?.jabatan || "-"}</div>
              <div style={{ fontWeight: 600, color: "#9ca3af", fontSize: 14 }}>NRP:</div>
              <div style={{ color: "#e5e7eb", fontSize: 14 }}>{profileData?.nrp || "-"}</div>
              <div style={{ fontWeight: 600, color: "#9ca3af", fontSize: 14 }}>Site:</div>
              <div style={{ color: "#e5e7eb", fontSize: 14 }}>{profileData?.site || "-"}</div>
              <div style={{ fontWeight: 600, color: "#9ca3af", fontSize: 14 }}>Email:</div>
              <div style={{ color: "#e5e7eb", fontSize: 14 }}>{profileData?.email || "-"}</div>
            </div>
            <div style={{ marginTop: 24 }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: 14, fontWeight: 600, color: "#e5e7eb" }}>
                Informasi Tambahan
              </h4>
              <div
                style={{
                  background: "#374151",
                  padding: 14,
                  borderRadius: 8,
                  border: "1px solid #4b5563",
                }}
              >
                <p style={{ margin: 0, color: "#9ca3af", fontSize: 13, lineHeight: 1.5 }}>
                  Profile ini menampilkan informasi dasar user yang terdaftar dalam sistem. Untuk mengubah informasi profile, silakan hubungi administrator.
                </p>
              </div>
            </div>
          </div>

          {/* Kolom 3: Mandat Validasi */}
          <div style={{ ...columnCardStyle, minHeight: 200 }}>
            <h3 style={{ margin: "0 0 24px 0", color: "#e5e7eb", fontSize: 18 }}>
              Mandat Validasi
            </h3>
            {canGiveMandate(user?.jabatan) ? (
              <MandatSection user={user} isMobile={false} embedded={true} />
            ) : (
              <p style={{ color: "#9ca3af", fontSize: 14 }}>
                Anda tidak memiliki wewenang untuk memberi mandat.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileDesktop;
