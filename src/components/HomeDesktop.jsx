import React from "react";

function HomeDesktop({ user }) {
  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        width: "100%",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "#f3f4f6",
            marginBottom: 8,
          }}
        >
          Selamat datang, {user?.nama || user?.user || "Pengguna"}
        </div>
        <div
          style={{
            fontSize: 16,
            color: "#d1d5db",
            fontWeight: 500,
          }}
        >
          {user?.jabatan || "Karyawan"} - AEGIS KMB Safety Management
        </div>
      </div>
    </div>
  );
}

export default HomeDesktop;
