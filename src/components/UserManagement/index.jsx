import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import UserForm from './UserForm';
import './UserManagement.css';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [siteFilter, setSiteFilter] = useState('');
  const [jabatanFilter, setJabatanFilter] = useState('');
  const [forceUpdate, setForceUpdate] = useState(0); // Force re-render

  // Fetch users dari Supabase
  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching users from Supabase...');

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('nama');

      if (error) {
        console.error('Error fetching users:', error);
        setError('Gagal memuat data user: ' + error.message);
      } else {
        console.log('Users fetched successfully:', data);
        setUsers(data || []);
      }
    } catch (e) {
      console.error('Error in fetchUsers:', e);
      setError('Gagal memuat data user.');
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
    .filter(u => u && typeof u === 'object') // Pastikan u ada dan adalah object
    .filter(
      u =>
        (!siteFilter || (u.site && u.site === siteFilter)) &&
        (!jabatanFilter || (u.jabatan && u.jabatan === jabatanFilter)) &&
        ((u.nama && u.nama.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (u.nrp && u.nrp.toLowerCase().includes(searchTerm.toLowerCase())))
    )
    .sort((a, b) => {
      // Handle null values in sorting
      const namaA = a && a.nama ? a.nama : '';
      const namaB = b && b.nama ? b.nama : '';
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
    ...new Set(users.filter(u => u && u.site).map(u => u.site)),
  ];
  const jabatanOptions = [
    ...new Set(users.filter(u => u && u.jabatan).map(u => u.jabatan)),
  ];

  // Handler untuk Add User
  const handleAddUser = async userData => {
    try {
      setLoading(true);
      setError('');

      console.log('Adding user to Supabase:', userData);

      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select();

      if (error) {
        console.error('Error adding user:', error);
        setError('Gagal menambah user: ' + error.message);
        return;
      }

      console.log('User added successfully:', data);
      setUsers(prev => [...prev, data[0]]);
      setShowForm(false);
    } catch (e) {
      console.error('Error in handleAddUser:', e);
      setError('Terjadi kesalahan saat menambah user');
    } finally {
      setLoading(false);
    }
  };

  // Handler untuk Update User dengan validasi yang lebih ketat
  const handleUpdateUser = async userData => {
    try {
      setLoading(true);
      setError('');

      // console.log("=== UPDATE USER DEBUG ===");
      // console.log("Received userData:", userData);
      // console.log("User ID:", userData.id);

      // Hanya ambil field yang perlu diupdate dan pastikan tidak null/undefined
      const updateData = {};

      // Ambil semua field yang ada di userData (kecuali id)
      Object.keys(userData).forEach(key => {
        if (
          key !== 'id' &&
          userData[key] !== undefined &&
          userData[key] !== null
        ) {
          if (typeof userData[key] === 'string') {
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
        .from('users')
        .select('id')
        .limit(1);

      if (testError) {
        console.error('Supabase connection test failed:', testError);
        setError('Gagal terhubung ke database: ' + testError.message);
        return;
      }

      // console.log("Supabase connection test successful:", testData);

      // Update ke Supabase
      // console.log("=== SENDING UPDATE TO SUPABASE ===");
      // console.log("Table: users");
      // console.log("Update data:", updateData);
      // console.log("User ID:", userData.id);

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userData.id)
        .select();

      // console.log("=== SUPABASE RESPONSE ===");
      // console.log("Response data:", data);
      // console.log("Response error:", error);
      // console.log("Response data length:", data ? data.length : 0);

      if (error) {
        console.error('Error updating user:', error);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        setError('Gagal mengupdate user: ' + error.message);
        return;
      }

      // console.log("User updated successfully:", data);
      // console.log("Response data length:", data ? data.length : 0);

      // SIMPLE APPROACH: Update state langsung tanpa optimistic update
      // console.log("=== SIMPLE STATE UPDATE ===");
      // console.log("Current users before update:", users);

      const updatedUsers = users.map(u => {
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
        setForceUpdate(prev => prev + 1);
        // console.log("State updated with setTimeout");
      }, 100);

      setEditingUser(null);
      setSelectedUser(null);

      // console.log("Update completed successfully!");
    } catch (e) {
      console.error('Error in handleUpdateUser:', e);
      setError('Terjadi kesalahan saat mengupdate user');
    } finally {
      setLoading(false);
    }
  };

  // Handler untuk Delete User
  const handleDeleteUser = async userId => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus user ini?')) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      console.log('Deleting user from Supabase:', userId);

      const { error } = await supabase.from('users').delete().eq('id', userId);

      if (error) {
        console.error('Error deleting user:', error);
        setError('Gagal menghapus user: ' + error.message);
        return;
      }

      console.log('User deleted successfully');
      setUsers(prev => prev.filter(u => u.id !== userId));
      setEditingUser(null);
      setSelectedUser(null);
    } catch (e) {
      console.error('Error in handleDeleteUser:', e);
      setError('Terjadi kesalahan saat menghapus user');
    } finally {
      setLoading(false);
    }
  };

  // Error boundary untuk mencegah crash
  if (error && error.includes('crash')) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
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
    console.error('Users is not an array:', users);
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h3>Terjadi kesalahan</h3>
        <p>Data users tidak valid. Silakan refresh halaman.</p>
        <button onClick={() => window.location.reload()}>
          Refresh Halaman
        </button>
      </div>
    );
  }

  return (
    <div
      className="user-management-list-container"
      key={`user-management-${forceUpdate}`}
    >
      <div className="user-management-header">
        <h2>Manajemen User</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="add-user-btn" onClick={() => setShowForm(true)}>
            + Tambah User
          </button>
        </div>
      </div>
      <div className="user-management-filters">
        <input
          type="text"
          placeholder="Cari user berdasarkan nama, NRP"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select
          value={siteFilter}
          onChange={e => setSiteFilter(e.target.value)}
        >
          <option value="">Semua Site</option>
          {siteOptions.map(site => (
            <option key={site} value={site}>
              {site}
            </option>
          ))}
        </select>
        <select
          value={jabatanFilter}
          onChange={e => setJabatanFilter(e.target.value)}
        >
          <option value="">Semua Jabatan</option>
          {jabatanOptions.map(jab => (
            <option key={jab} value={jab}>
              {jab}
            </option>
          ))}
        </select>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div>
          <p style={{ marginBottom: '10px', color: '#666' }}>
            Total users: {users.length} | Filtered users: {filteredUsers.length}
          </p>
          <table className="user-management-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>NRP</th>
                <th>Email</th>
                <th>Jabatan</th>
                <th>Site</th>
                <th>Role</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    style={{
                      textAlign: 'center',
                      padding: '20px',
                      color: '#666',
                    }}
                  >
                    {users.length === 0
                      ? 'Tidak ada data users'
                      : 'Tidak ada data yang sesuai dengan filter'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr
                    key={u.id}
                    className={
                      editingUser && editingUser.id === u.id ? 'editing' : ''
                    }
                  >
                    <td>{u.nama || '-'}</td>
                    <td>{u.nrp || '-'}</td>
                    <td>{u.email || '-'}</td>
                    <td>{u.jabatan || '-'}</td>
                    <td>{u.site || '-'}</td>
                    <td>{u.role || '-'}</td>
                    <td>
                      <button
                        onClick={() => {
                          // console.log("Edit button clicked for user:", u);
                          setEditingUser(u);
                        }}
                        className="edit-btn"
                        style={{
                          backgroundColor: '#007bff',
                          color: 'white',
                          padding: '8px 16px',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          marginRight: '8px',
                          width: '70px',
                          height: '36px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="delete-btn"
                        style={{
                          backgroundColor: '#dc3545',
                          color: 'white',
                          padding: '8px 16px',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          width: '70px',
                          height: '36px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
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
      )}

      {/* Modal untuk Tambah User */}
      {showForm && (
        <UserForm
          onSubmit={handleAddUser}
          onClose={() => setShowForm(false)}
          loading={loading}
        />
      )}

      {/* Modal untuk Edit User */}
      {editingUser && (
        <div>
          {/* {console.log("Rendering UserForm modal with user:", editingUser)} */}
          <UserForm
            user={editingUser}
            onSubmit={handleUpdateUser}
            onClose={() => {
              // console.log("Closing edit modal");
              setEditingUser(null);
            }}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
}

export default UserManagement;
