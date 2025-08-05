import React, { useState, useEffect } from 'react';
import offlineStorage from '../utils/offlineStorage';

const OfflineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingForms, setPendingForms] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingForms();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check pending forms on mount
    checkPendingForms();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkPendingForms = async () => {
    try {
      const fitToWorkForms = await offlineStorage.getPendingForms('fitToWork');
      const take5Forms = await offlineStorage.getPendingForms('take5');
      const hazardForms = await offlineStorage.getPendingForms('hazard');

      const total =
        fitToWorkForms.length + take5Forms.length + hazardForms.length;
      setPendingForms(total);
    } catch (error) {
      console.error('Error checking pending forms:', error);
    }
  };

  const syncPendingForms = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      // Sync Fit To Work forms
      const fitToWorkForms = await offlineStorage.getPendingForms('fitToWork');
      for (const form of fitToWorkForms) {
        try {
          // Here you would call your Supabase API to submit the form
          // For now, we'll just mark it as synced
          await offlineStorage.markAsSynced('fitToWork', form.id);
        } catch (error) {
          console.error('Error syncing Fit To Work form:', error);
        }
      }

      // Sync Take 5 forms
      const take5Forms = await offlineStorage.getPendingForms('take5');
      for (const form of take5Forms) {
        try {
          await offlineStorage.markAsSynced('take5', form.id);
        } catch (error) {
          console.error('Error syncing Take 5 form:', error);
        }
      }

      // Sync Hazard forms
      const hazardForms = await offlineStorage.getPendingForms('hazard');
      for (const form of hazardForms) {
        try {
          await offlineStorage.markAsSynced('hazard', form.id);
        } catch (error) {
          console.error('Error syncing Hazard form:', error);
        }
      }

      await checkPendingForms();
    } catch (error) {
      console.error('Error syncing forms:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOnline) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: '#f59e0b',
          color: 'white',
          padding: '8px 16px',
          textAlign: 'center',
          zIndex: 1000,
          fontSize: '14px',
        }}
      >
        📱 Mode Offline - Data akan disimpan lokal dan disinkronkan saat online
      </div>
    );
  }

  if (pendingForms > 0) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: '#10b981',
          color: 'white',
          padding: '8px 16px',
          textAlign: 'center',
          zIndex: 1000,
          fontSize: '14px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span>🔄 {pendingForms} form offline tersedia</span>
        <button
          onClick={syncPendingForms}
          disabled={isSyncing}
          style={{
            backgroundColor: 'white',
            color: '#10b981',
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: isSyncing ? 'not-allowed' : 'pointer',
          }}
        >
          {isSyncing ? 'Sinkronisasi...' : 'Sinkronisasi'}
        </button>
      </div>
    );
  }

  return null;
};

export default OfflineStatus;
