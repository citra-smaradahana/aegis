import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import UserForm from "./UserForm";
import "./UserManagement.css";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [siteFilter, setSiteFilter] = useState("");
  const [jabatanFilter, setJabatanFilter] = useState("");
  const [forceUpdate, setForceUpdate] = useState(0); // Force re-render

  // Fetch users dari Supabase
  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      console.log("Fetching users from Supabase...");

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("nama");

      if (error) {
        console.error("Error fetching users:", error);
        setError("Gagal memuat data user: " + error.message);
      } else {
        console.log("Users fetched successfully:", data);
        setUsers(data || []);
      }
    } catch (e) {
      console.error("Error in fetchUsers:", e);
      setError("Gagal memuat data user.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Monitor state changes (reduced for production)
  // useEffect(() => {
  //   console.log("=== STATE CHANGE DETECTED ===");
  //   console.log("Users state updated:", users);
  //   console.log("Force update count:", forceUpdate);
  // }, [users, forceUpdate]);

  // Filter, search, dan sort dengan null check yang lebih ketat
  const filteredUsers = users
    .filter((u) => u && typeof u === "object") // Pastikan u ada dan adalah object
    .filter(
      (u) =>
        (!siteFilter || (u.site && u.site === siteFilter)) &&
        (!jabatanFilter || (u.jabatan && u.jabatan === jabatanFilter)) &&
        ((u.nama && u.nama.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (u.nrp && u.nrp.toLowerCase().includes(searchTerm.toLowerCase())))
    )
    .sort((a, b) => {
      // Handle null values in sorting
      const namaA = a && a.nama ? a.nama : "";
      const namaB = b && b.nama ? b.nama : "";
      return namaA.localeCompare(namaB);
    });

  // Debug logging (reduced for production)
  // console.log("Users array:", users);
  // console.log("Filtered users:", filteredUsers);
  // console.log("Site filter:", siteFilter);
  // console.log("Jabatan filter:", jabatanFilter);
  // console.log("Search term:", searchTerm);

  // Unique site & jabatan untuk filter dengan null check yang lebih ketat
  const siteOptions = [
    ...new Set(users.filter((u) => u && u.site).map((u) => u.site)),
  ];
  const jabatanOptions = [
    ...new Set(users.filter((u) => u && u.jabatan).map((u) => u.jabatan)),
  ];

  // Handler untuk Add User
  const handleAddUser = async (userData) => {
    try {
      setLoading(true);
      setError("");

      console.log("Adding user to Supabase:", userData);

      const { data, error } = await supabase
        .from("users")
        .insert([userData])
        .select();

      if (error) {
        console.error("Error adding user:", error);
        setError("Gagal menambah user: " + error.message);
        return;
      }

      console.log("User added successfully:", data);
      setUsers((prev) => [...prev, data[0]]);
      setShowForm(false);
    } catch (e) {
      console.error("Error in handleAddUser:", e);
      setError("Terjadi kesalahan saat menambah user");
    } finally {
      setLoading(false);
    }
  };

  // Handler untuk Update User dengan validasi yang lebih ketat
  const handleUpdateUser = async (userData) => {
    try {
      setLoading(true);
      setError("");

      // console.log("=== UPDATE USER DEBUG ===");
      // console.log("Received userData:", userData);
      // console.log("User ID:", userData.id);

      // Hanya ambil field yang perlu diupdate dan pastikan tidak null/undefined
      const updateData = {};

      // Ambil semua field yang ada di userData (kecuali id)
      Object.keys(userData).forEach((key) => {
        if (
          key !== "id" &&
          userData[key] !== undefined &&
          userData[key] !== null
        ) {
          if (typeof userData[key] === "string") {
            updateData[key] = userData[key].trim();
          } else {
            updateData[key] = userData[key];
          }
        }
      });

      // console.log("Processed updateData:", updateData);

      // Pastikan ada field yang akan diupdate
      if (Object.keys(updateData).length === 0) {
        // console.log("No fields to update");
        setEditingUser(null);
        setSelectedUser(null);
        return;
      }

      // Hapus updated_at karena kolom tidak ada di database
      // updateData.updated_at = new Date().toISOString();

      // console.log("Sending update to Supabase with data:", updateData);
      // console.log("User ID to update:", userData.id);

      // Test koneksi Supabase terlebih dahulu
      // console.log("Testing Supabase connection...");
      const { data: testData, error: testError } = await supabase
        .from("users")
        .select("id")
        .limit(1);

      if (testError) {
        console.error("Supabase connection test failed:", testError);
        setError("Gagal terhubung ke database: " + testError.message);
        return;
      }

      // console.log("Supabase connection test successful:", testData);

      // Update ke Supabase
      // console.log("=== SENDING UPDATE TO SUPABASE ===");
      // console.log("Table: users");
      // console.log("Update data:", updateData);
      // console.log("User ID:", userData.id);

      const { data, error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", userData.id)
        .select();

      // console.log("=== SUPABASE RESPONSE ===");
      // console.log("Response data:", data);
      // console.log("Response error:", error);
      // console.log("Response data length:", data ? data.length : 0);

      if (error) {
        console.error("Error updating user:", error);
        console.error("Error details:", error.details);
        console.error("Error hint:", error.hint);
        setError("Gagal mengupdate user: " + error.message);
        return;
      }

      // console.log("User updated successfully:", data);
      // console.log("Response data length:", data ? data.length : 0);

      // SIMPLE APPROACH: Update state langsung tanpa optimistic update
      // console.log("=== SIMPLE STATE UPDATE ===");
      // console.log("Current users before update:", users);

      const updatedUsers = users.map((u) => {
        if (u.id === userData.id) {
          const updatedUser = { ...u, ...updateData };
          // console.log("Updated user in state:", updatedUser);
          return updatedUser;
        }
        return u;
      });

      // console.log("Updated users array:", updatedUsers);

      // Update state dengan setTimeout untuk memastikan async update
      setTimeout(() => {
        setUsers(updatedUsers);
        setForceUpdate((prev) => prev + 1);
        // console.log("State updated with setTimeout");
      }, 100);

      setEditingUser(null);
      setSelectedUser(null);

      // console.log("Update completed successfully!");
    } catch (e) {
      console.error("Error in handleUpdateUser:", e);
      setError("Terjadi kesalahan saat mengupdate user");
    } finally {
      setLoading(false);
    }
  };

  // Handler untuk Delete User
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus user ini?")) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      console.log("Deleting user from Supabase:", userId);

      const { error } = await supabase.from("users").delete().eq("id", userId);

      if (error) {
        console.error("Error deleting user:", error);
        setError("Gagal menghapus user: " + error.message);
        return;
      }

      console.log("User deleted successfully");
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setEditingUser(null);
      setSelectedUser(null);
    } catch (e) {
      console.error("Error in handleDeleteUser:", e);
      setError("Terjadi kesalahan saat menghapus user");
    } finally {
      setLoading(false);
    }
  };

  // Error boundary untuk mencegah crash
  if (error && error.includes("crash")) {
    return (
      <div style={{ padding: "20px", color: "red" }}>
        <h3>Terjadi kesalahan</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Refresh Halaman
        </button>
      </div>
    );
  }

  // Tambahan safety check untuk users array
  if (!Array.isArray(users)) {
    console.error("Users is not an array:", users);
    return (
      <div style={{ padding: "20px", color: "red" }}>
        <h3>Terjadi kesalahan</h3>
        <p>Data users tidak valid. Silakan refresh halaman.</p>
        <button onClick={() => window.location.reload()}>
          Refresh Halaman
        </button>
      </div>
    );
  }

  // Jika sedang edit user atau tambah user, tampilkan form saja
  if (editingUser || showForm) {
    return (
      <UserForm
        user={editingUser}
        onSubmit={editingUser ? handleUpdateUser : handleAddUser}
        onClose={() => {
          setEditingUser(null);
          setShowForm(false);
        }}
        loading={loading}
      />
    );
  }

  // Jika tidak sedang edit/tambah, tampilkan halaman management user
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
      key={`user-management-${forceUpdate}`}
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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
              width: "100%",
            }}
          >
            <h2
              style={{
                margin: 0,
                color: "#60a5fa",
                fontWeight: 600,
                fontSize: "24px",
              }}
            >
              Management User
            </h2>
            <button
              onClick={() => setShowForm(true)}
              style={{
                background: "#60a5fa",
                color: "#ffffff",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
              }}
            >
              + Tambah User
            </button>
          </div>
          <div
            style={{
              display: "flex",
              gap: "16px",
              marginBottom: "24px",
              flexWrap: "wrap",
            }}
          >
            <input
              type="text"
              placeholder="Cari user berdasarkan nama, NRP"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid #374151",
                borderRadius: "6px",
                backgroundColor: "#1f2937",
                color: "#e5e7eb",
                fontSize: "14px",
                outline: "none",
                minWidth: "200px",
              }}
            />
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid #374151",
                borderRadius: "6px",
                backgroundColor: "#1f2937",
                color: "#e5e7eb",
                fontSize: "14px",
                outline: "none",
              }}
            >
              <option value="">Semua Site</option>
              {siteOptions.map((site) => (
                <option key={site} value={site}>
                  {site}
                </option>
              ))}
            </select>
            <select
              value={jabatanFilter}
              onChange={(e) => setJabatanFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid #374151",
                borderRadius: "6px",
                backgroundColor: "#1f2937",
                color: "#e5e7eb",
                fontSize: "14px",
                outline: "none",
              }}
            >
              <option value="">Semua Jabatan</option>
              {jabatanOptions.map((jab) => (
                <option key={jab} value={jab}>
                  {jab}
                </option>
              ))}
            </select>
          </div>
          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px",
                color: "#9ca3af",
              }}
            >
              Loading...
            </div>
          ) : error ? (
            <div
              style={{
                padding: "16px",
                backgroundColor: "#dc2626",
                color: "#ffffff",
                borderRadius: "8px",
                marginBottom: "16px",
              }}
            >
              {error}
            </div>
          ) : (
            <div>
              <p
                style={{
                  marginBottom: "16px",
                  color: "#9ca3af",
                  fontSize: "14px",
                }}
              >
                Total users: {users.length} | Filtered users:{" "}
                {filteredUsers.length}
              </p>
              <div
                style={{
                  backgroundColor: "#1f2937",
                  borderRadius: "12px",
                  border: "1px solid #374151",
                  overflow: "hidden",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    color: "#e5e7eb",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        backgroundColor: "#374151",
                        borderBottom: "1px solid #4b5563",
                      }}
                    >
                      <th
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontWeight: "600",
                          color: "#e5e7eb",
                          fontSize: "14px",
                        }}
                      >
                        Nama
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontWeight: "600",
                          color: "#e5e7eb",
                          fontSize: "14px",
                        }}
                      >
                        NRP
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontWeight: "600",
                          color: "#e5e7eb",
                          fontSize: "14px",
                        }}
                      >
                        Email
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontWeight: "600",
                          color: "#e5e7eb",
                          fontSize: "14px",
                        }}
                      >
                        Jabatan
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontWeight: "600",
                          color: "#e5e7eb",
                          fontSize: "14px",
                        }}
                      >
                        Site
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontWeight: "600",
                          color: "#e5e7eb",
                          fontSize: "14px",
                        }}
                      >
                        Role
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontWeight: "600",
                          color: "#e5e7eb",
                          fontSize: "14px",
                        }}
                      >
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td
                          colSpan="7"
                          style={{
                            textAlign: "center",
                            padding: "40px",
                            color: "#9ca3af",
                            fontSize: "16px",
                          }}
                        >
                          {users.length === 0
                            ? "Tidak ada data users"
                            : "Tidak ada data yang sesuai dengan filter"}
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr
                          key={u.id}
                          style={{
                            borderBottom: "1px solid #374151",
                            backgroundColor:
                              editingUser && editingUser.id === u.id
                                ? "#1e40af"
                                : "transparent",
                          }}
                        >
                          <td
                            style={{
                              padding: "12px 16px",
                              color: "#e5e7eb",
                              fontSize: "14px",
                            }}
                          >
                            {u.nama || "-"}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              color: "#e5e7eb",
                              fontSize: "14px",
                            }}
                          >
                            {u.nrp || "-"}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              color: "#e5e7eb",
                              fontSize: "14px",
                            }}
                          >
                            {u.email || "-"}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              color: "#e5e7eb",
                              fontSize: "14px",
                            }}
                          >
                            {u.jabatan || "-"}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              color: "#e5e7eb",
                              fontSize: "14px",
                            }}
                          >
                            {u.site || "-"}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              color: "#e5e7eb",
                              fontSize: "14px",
                            }}
                          >
                            {u.role || "-"}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                            }}
                          >
                            <button
                              onClick={() => {
                                setEditingUser(u);
                              }}
                              style={{
                                backgroundColor: "#60a5fa",
                                color: "white",
                                padding: "8px 16px",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "12px",
                                marginRight: "8px",
                                width: "70px",
                                height: "36px",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: "600",
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              style={{
                                backgroundColor: "#dc2626",
                                color: "white",
                                padding: "8px 16px",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "12px",
                                width: "70px",
                                height: "36px",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: "600",
                              }}
                            >
                              Hapus
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserManagement;
