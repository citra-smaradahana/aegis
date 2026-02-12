import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import MobileBottomNavigation from "../MobileBottomNavigation";

function ProfileMobile({ user, onClose, onBack, onLogout, onNavigate }) {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
    // Tampilkan popup konfirmasi
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Gunakan callback onLogout untuk mengatur user menjadi null
      if (onLogout) {
        onLogout();
      }
    } catch (error) {
      console.error("Error logging out:", error);
      alert("Gagal logout. Silakan coba lagi.");
    }
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  if (loading) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "#f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 16, color: "#6b7280" }}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#f3f4f6",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header - Orange seperti TasklistMobile */}
      <div
        style={{
          background: "#f97316", // Orange
          padding: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 600,
              color: "white",
              textAlign: "center",
              flex: 1,
            }}
          >
            Profile
          </h2>
        </div>
        {/* User Avatar */}
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            fontWeight: "600",
            color: "#f97316",
          }}
        >
          {profileData?.nama
            ? profileData.nama.charAt(0).toUpperCase()
            : user?.nama?.charAt(0).toUpperCase() || "U"}
        </div>
      </div>

      {/* Back Button */}
      {onBack && (
        <button
          onClick={onBack}
          style={{
            position: "absolute",
            top: "16px",
            left: "16px",
            background: "none",
            border: "none",
            color: "white",
            cursor: "pointer",
            padding: "8px",
            borderRadius: "8px",
            zIndex: 20,
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
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
      )}

      {/* Profile Content */}
      <div
        style={{
          flex: 1,
          padding: "20px",
          overflowY: "auto",
          paddingBottom: "120px", // Tambah padding bottom untuk navbar bawah
        }}
      >
        {/* Profile Photo */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          {profileData?.foto ? (
            <img
              src={profileData.foto}
              alt="Profile"
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                objectFit: "cover",
                margin: "0 auto 16px",
                border: "3px solid #e5e7eb",
                boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
              }}
            />
          ) : (
            <div
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: "48px",
                color: "#fff",
                fontWeight: "bold",
              }}
            >
              {profileData?.nama
                ? profileData.nama.charAt(0).toUpperCase()
                : "U"}
            </div>
          )}
          <h3
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 600,
              color: "#1f2937",
            }}
          >
            {profileData?.nama || "User Name"}
          </h3>
        </div>

        {/* Profile Information */}
        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "20px",
            boxShadow: "0 1px 4px #0001",
          }}
        >
          <h4
            style={{
              margin: "0 0 16px 0",
              fontSize: 16,
              fontWeight: 600,
              color: "#374151",
            }}
          >
            Informasi Profile
          </h4>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {/* NRP */}
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  marginBottom: "4px",
                  fontWeight: 500,
                }}
              >
                NRP
              </div>
              <div
                style={{
                  fontSize: 16,
                  color: "#1f2937",
                  fontWeight: 500,
                }}
              >
                {profileData?.nrp || "-"}
              </div>
            </div>

            {/* Site */}
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  marginBottom: "4px",
                  fontWeight: 500,
                }}
              >
                Site
              </div>
              <div
                style={{
                  fontSize: 16,
                  color: "#1f2937",
                  fontWeight: 500,
                }}
              >
                {profileData?.site || "-"}
              </div>
            </div>

            {/* Email */}
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  marginBottom: "4px",
                  fontWeight: 500,
                }}
              >
                Email
              </div>
              <div
                style={{
                  fontSize: 16,
                  color: "#1f2937",
                  fontWeight: 500,
                }}
              >
                {profileData?.email || "-"}
              </div>
            </div>

            {/* Jabatan */}
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  marginBottom: "4px",
                  fontWeight: 500,
                }}
              >
                Jabatan
              </div>
              <div
                style={{
                  fontSize: 16,
                  color: "#1f2937",
                  fontWeight: 500,
                }}
              >
                {profileData?.jabatan || "-"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Buttons Container */}
      <div
        style={{
          background: "#fff",
          padding: "16px",
          borderTop: "1px solid #e5e7eb",
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 56, // asumsi navbar tinggi 56px
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {/* Change Password Button */}
        <button
          onClick={handleChangePassword}
          style={{
            width: "100%",
            background: "#f3f4f6",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            padding: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            cursor: "pointer",
            fontSize: 16,
            color: "#374151",
            fontWeight: 500,
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
            width: "100%",
            background: "#ef4444",
            border: "1px solid #dc2626",
            borderRadius: "8px",
            padding: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            cursor: "pointer",
            fontSize: 16,
            color: "#fff",
            fontWeight: 500,
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
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16,17 21,12 16,7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "24px",
              maxWidth: "320px",
              width: "100%",
              textAlign: "center",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: "60px",
                height: "60px",
                background: "#fef2f2",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16,17 21,12 16,7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>

            {/* Title */}
            <h3
              style={{
                margin: "0 0 8px 0",
                fontSize: "18px",
                fontWeight: "600",
                color: "#1f2937",
              }}
            >
              Keluar Aplikasi
            </h3>

            {/* Message */}
            <p
              style={{
                margin: "0 0 24px 0",
                fontSize: "14px",
                color: "#6b7280",
                lineHeight: "1.5",
              }}
            >
              Apakah yakin ingin keluar dari aplikasi?
            </p>

            {/* Buttons */}
            <div
              style={{
                display: "flex",
                gap: "12px",
              }}
            >
              <button
                onClick={cancelLogout}
                style={{
                  flex: 1,
                  background: "#f3f4f6",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151",
                  cursor: "pointer",
                }}
              >
                Batal
              </button>
              <button
                onClick={confirmLogout}
                style={{
                  flex: 1,
                  background: "#ef4444",
                  border: "1px solid #dc2626",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <MobileBottomNavigation
        activeTab="profile"
        onNavigate={(tab) => {
          if (tab === "home") {
            onBack && onBack();
          } else if (tab === "tasklist") {
            // Navigate to tasklist menggunakan callback dari parent
            onNavigate && onNavigate("tasklist");
          }
          // profile tab tidak perlu handling karena sudah di halaman profile
        }}
      />
    </div>
  );
}

export default ProfileMobile;
