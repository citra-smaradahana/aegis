import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

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
        }}
      >
        <div
          style={{
            background: "transparent",
            border: "none",
            borderRadius: 16,
            padding: 24,
            color: "#e5e7eb",
            position: "relative",
            height: "100vh",
            width: "100%",
            alignItems: "flex-start",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
          }}
        >
          {/* Profile Content */}
          <div
            style={{
              background: "transparent",
              borderRadius: 18,
              boxShadow: "none",
              padding: 16,
              maxWidth: 1100,
              width: "100%",
              margin: "0 auto",
              height: "auto",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              color: "#e5e7eb",
            }}
          >
            {/* Header */}
            <div
              style={{
                textAlign: "center",
                marginBottom: 16,
                marginTop: 0,
                padding: 0,
              }}
            >
              <h2
                style={{
                  fontWeight: 900,
                  fontSize: 28,
                  color: "#60a5fa",
                  margin: 0,
                }}
              >
                Profile
              </h2>
            </div>

            {/* Profile Content Card */}
            <div
              style={{
                display: "flex",
                gap: 32,
                background: "transparent",
                borderRadius: 16,
                border: "none",
                padding: 32,
                width: "100%",
                color: "#e5e7eb",
                position: "relative",
              }}
            >
              {/* Kiri: Profile Photo dan Info */}
              <div
                style={{
                  flex: 1,
                  borderRight: "none",
                  paddingRight: 32,
                  textAlign: "center",
                }}
              >
                <h3 style={{ marginBottom: 24, color: "#e5e7eb" }}>Profile</h3>

                {/* Profile Photo */}
                {profileData?.foto ? (
                  <img
                    src={profileData.foto}
                    alt="Profile"
                    style={{
                      width: "150px",
                      height: "150px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      margin: "0 auto 24px",
                      border: "3px solid #60a5fa",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "150px",
                      height: "150px",
                      borderRadius: "50%",
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 24px",
                      fontSize: "60px",
                      color: "#fff",
                      fontWeight: "bold",
                    }}
                  >
                    {profileData?.nama
                      ? profileData.nama.charAt(0).toUpperCase()
                      : "U"}
                  </div>
                )}

                <h4
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: 24,
                    fontWeight: 600,
                    color: "#e5e7eb",
                  }}
                >
                  {profileData?.nama || "User Name"}
                </h4>
                <p
                  style={{
                    margin: "0 0 32px 0",
                    fontSize: 16,
                    color: "#9ca3af",
                  }}
                >
                  {profileData?.jabatan || "Jabatan"}
                </p>

                {/* Change Password Button */}
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
                    margin: "0 auto 12px auto",
                    width: "200px",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <circle cx="12" cy="16" r="1" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Ganti Password
                </button>

                {/* Logout Button */}
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
                    color: "#ffffff",
                    fontWeight: 500,
                    margin: "0 auto",
                    width: "200px",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16,17 21,12 16,7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Logout
                </button>
              </div>

              {/* Kanan: Profile Information */}
              <div style={{ flex: 1, paddingLeft: 32 }}>
                <h3 style={{ marginBottom: 24, color: "#e5e7eb" }}>
                  Informasi Profile
                </h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "120px 1fr",
                    rowGap: 16,
                    columnGap: 16,
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      textAlign: "right",
                      color: "#9ca3af",
                    }}
                  >
                    Nama:
                  </div>
                  <div style={{ color: "#e5e7eb" }}>
                    {profileData?.nama || "-"}
                  </div>

                  <div
                    style={{
                      fontWeight: 700,
                      textAlign: "right",
                      color: "#9ca3af",
                    }}
                  >
                    Jabatan:
                  </div>
                  <div style={{ color: "#e5e7eb" }}>
                    {profileData?.jabatan || "-"}
                  </div>

                  <div
                    style={{
                      fontWeight: 700,
                      textAlign: "right",
                      color: "#9ca3af",
                    }}
                  >
                    NRP:
                  </div>
                  <div style={{ color: "#e5e7eb" }}>
                    {profileData?.nrp || "-"}
                  </div>

                  <div
                    style={{
                      fontWeight: 700,
                      textAlign: "right",
                      color: "#9ca3af",
                    }}
                  >
                    Site:
                  </div>
                  <div style={{ color: "#e5e7eb" }}>
                    {profileData?.site || "-"}
                  </div>

                  <div
                    style={{
                      fontWeight: 700,
                      textAlign: "right",
                      color: "#9ca3af",
                    }}
                  >
                    Email:
                  </div>
                  <div style={{ color: "#e5e7eb" }}>
                    {profileData?.email || "-"}
                  </div>
                </div>

                {/* Additional Info Section */}
                <div style={{ marginTop: 32 }}>
                  <h4
                    style={{
                      margin: "0 0 16px 0",
                      fontSize: 16,
                      fontWeight: 600,
                      color: "#e5e7eb",
                    }}
                  >
                    Informasi Tambahan
                  </h4>
                  <div
                    style={{
                      background: "#374151",
                      padding: 16,
                      borderRadius: 8,
                      border: "1px solid #4b5563",
                    }}
                  >
                    <p style={{ margin: 0, color: "#9ca3af", fontSize: 14 }}>
                      Profile ini menampilkan informasi dasar user yang
                      terdaftar dalam sistem. Untuk mengubah informasi profile,
                      silakan hubungi administrator.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileDesktop;
