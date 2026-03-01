import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

// Ganti versi ini sesuai dengan versi di package.json saat build
const CURRENT_VERSION = '1.0.0'; 

const VersionCheck = () => {
  const [showModal, setShowModal] = useState(false);
  const [isForceUpdate, setIsForceUpdate] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [storeUrl, setStoreUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkVersion();
  }, []);

  const checkVersion = async () => {
    try {
      // Hanya cek jika di platform native (Android/iOS) atau jika ingin memaksa di web juga
      const platform = Capacitor.getPlatform(); // 'web', 'ios', 'android'
      
      // Kita gunakan 'android' sebagai default key jika di web untuk testing, 
      // atau sesuaikan dengan kebutuhan
      const platformKey = platform === 'ios' ? 'ios' : 'android';

      const { data, error } = await supabase
        .from('app_versions')
        .select('*')
        .eq('platform', platformKey)
        .single();

      if (error) {
        // Jika tabel belum ada atau error lain, abaikan saja (jangan block user)
        console.log('Version check skipped or failed:', error.message);
        setLoading(false);
        return;
      }

      if (data) {
        const latestVersion = data.latest_version;
        const forceUpdate = data.force_update;
        
        if (compareVersions(latestVersion, CURRENT_VERSION) > 0) {
          // Ada update baru
          setUpdateMessage(data.message || 'Pembaruan tersedia. Silakan update aplikasi Anda.');
          setStoreUrl(data.store_url || '');
          setIsForceUpdate(forceUpdate);
          setShowModal(true);
        }
      }
    } catch (err) {
      console.error('Error checking version:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi pembanding versi sederhana (semver)
  // Mengembalikan 1 jika v1 > v2, -1 jika v1 < v2, 0 jika sama
  const compareVersions = (v1, v2) => {
    if (!v1 || !v2) return 0;
    
    const v1Parts = v1.split('.').map(Number);
    const v2Parts = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const val1 = v1Parts[i] || 0;
      const val2 = v2Parts[i] || 0;
      
      if (val1 > val2) return 1;
      if (val1 < val2) return -1;
    }
    return 0;
  };

  const handleUpdate = () => {
    if (storeUrl) {
      window.open(storeUrl, '_system');
    }
  };

  const handleClose = () => {
    if (!isForceUpdate) {
      setShowModal(false);
    }
  };

  if (!showModal) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      zIndex: 9999, // Pastikan di atas segalanya
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '320px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>
          🚀
        </div>
        <h3 style={{ 
          margin: '0 0 12px 0', 
          fontSize: '20px', 
          fontWeight: 'bold',
          color: '#1f2937'
        }}>
          Update Tersedia
        </h3>
        <p style={{ 
          margin: '0 0 24px 0', 
          fontSize: '15px', 
          color: '#4b5563',
          lineHeight: '1.5'
        }}>
          {updateMessage}
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button 
            onClick={handleUpdate}
            style={{
              backgroundColor: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            Update Sekarang
          </button>
          
          {!isForceUpdate && (
            <button 
              onClick={handleClose}
              style={{
                backgroundColor: 'transparent',
                color: '#6b7280',
                border: 'none',
                padding: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Nanti saja
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VersionCheck;
