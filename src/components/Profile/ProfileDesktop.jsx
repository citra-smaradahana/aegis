import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

function ProfileDesktop({ user, onClose, onLogout }) {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfileData(data);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = () => {
    // Logic untuk ganti password akan dibuat selanjutnya
    console.log('Change password clicked');
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 16, color: '#6b7280' }}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: 32,
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 24px #2563eb33',
        padding: 32,
        maxWidth: 1000,
        margin: '40px auto',
        color: '#232946',
        position: 'relative',
      }}
    >
      {/* Tombol close kanan atas */}
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'transparent',
            border: 'none',
            fontSize: 24,
            color: '#888',
            cursor: 'pointer',
            zIndex: 10,
          }}
          title="Tutup"
        >
          ×
        </button>
      )}

      {/* Kiri: Profile Photo dan Info */}
      <div
        style={{
          flex: 1,
          borderRight: '1px solid #e5e7eb',
          paddingRight: 32,
          textAlign: 'center',
        }}
      >
        <h3 style={{ marginBottom: 24 }}>Profile</h3>

        {/* Profile Photo */}
        {profileData?.foto ? (
          <img
            src={profileData.foto}
            alt="Profile"
            style={{
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              objectFit: 'cover',
              margin: '0 auto 24px',
              border: '3px solid #e5e7eb',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            }}
          />
        ) : (
          <div
            style={{
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '60px',
              color: '#fff',
              fontWeight: 'bold',
            }}
          >
            {profileData?.nama ? profileData.nama.charAt(0).toUpperCase() : 'U'}
          </div>
        )}

        <h4
          style={{
            margin: '0 0 8px 0',
            fontSize: 24,
            fontWeight: 600,
            color: '#1f2937',
          }}
        >
          {profileData?.nama || 'User Name'}
        </h4>
        <p
          style={{
            margin: '0 0 32px 0',
            fontSize: 16,
            color: '#6b7280',
          }}
        >
          {profileData?.jabatan || 'Jabatan'}
        </p>

        {/* Change Password Button */}
        <button
          onClick={handleChangePassword}
          style={{
            background: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: 14,
            color: '#374151',
            fontWeight: 500,
            margin: '0 auto 12px auto',
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
            background: '#ef4444',
            border: '1px solid #dc2626',
            borderRadius: '8px',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: 14,
            color: '#ffffff',
            fontWeight: 500,
            margin: '0 auto',
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
        <h3 style={{ marginBottom: 24 }}>Informasi Profile</h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '120px 1fr',
            rowGap: 16,
            columnGap: 16,
            alignItems: 'center',
          }}
        >
          <div style={{ fontWeight: 700, textAlign: 'right' }}>Nama:</div>
          <div>{profileData?.nama || '-'}</div>

          <div style={{ fontWeight: 700, textAlign: 'right' }}>Jabatan:</div>
          <div>{profileData?.jabatan || '-'}</div>

          <div style={{ fontWeight: 700, textAlign: 'right' }}>NRP:</div>
          <div>{profileData?.nrp || '-'}</div>

          <div style={{ fontWeight: 700, textAlign: 'right' }}>Site:</div>
          <div>{profileData?.site || '-'}</div>

          <div style={{ fontWeight: 700, textAlign: 'right' }}>Email:</div>
          <div>{profileData?.email || '-'}</div>
        </div>

        {/* Additional Info Section */}
        <div style={{ marginTop: 32 }}>
          <h4
            style={{
              margin: '0 0 16px 0',
              fontSize: 16,
              fontWeight: 600,
              color: '#374151',
            }}
          >
            Informasi Tambahan
          </h4>
          <div
            style={{
              background: '#f8fafc',
              padding: 16,
              borderRadius: 8,
              border: '1px solid #e2e8f0',
            }}
          >
            <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>
              Profile ini menampilkan informasi dasar user yang terdaftar dalam
              sistem. Untuk mengubah informasi profile, silakan hubungi
              administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileDesktop;
