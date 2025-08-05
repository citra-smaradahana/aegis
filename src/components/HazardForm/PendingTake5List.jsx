import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const PendingTake5List = ({ user, onSelectTake5, selectedTake5Id }) => {
  const [pendingTake5List, setPendingTake5List] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchPendingTake5();
  }, []);

  const fetchPendingTake5 = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('take_5')
        .select('*')
        .eq('status', 'pending')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingTake5List(data || []);
    } catch (err) {
      console.error('Error fetching pending Take 5:', err);
      setError('Gagal memuat data pending Take 5');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleSelectChange = e => {
    const selectedId = e.target.value;
    if (selectedId === '') {
      onSelectTake5(null);
    } else {
      const selectedTake5 = pendingTake5List.find(
        take5 => take5.id === selectedId
      );
      onSelectTake5(selectedTake5);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        Memuat data pending Take 5...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: '#ef4444', textAlign: 'center', padding: '20px' }}>
        {error}
      </div>
    );
  }

  if (pendingTake5List.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
        Tidak ada Take 5 pending
      </div>
    );
  }

  return (
    <div style={{ marginBottom: isMobile ? '8px' : '20px' }}>
      <h3
        style={{
          fontSize: isMobile ? '14px' : '16px',
          fontWeight: '600',
          marginBottom: isMobile ? '8px' : '12px',
          color: '#374151',
        }}
      >
        📋 Pilih Take 5 Pending untuk Hazard Report
      </h3>

      <select
        value={selectedTake5Id || ''}
        onChange={handleSelectChange}
        style={{
          width: '100%', // selalu 100% karena sudah dalam wrapper
          padding: isMobile ? '4px' : '8px',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          fontSize: isMobile ? '13px' : '15px',
          backgroundColor: '#fff',
          cursor: 'pointer',
        }}
      >
        <option value="">-- Pilih Take 5 Pending --</option>
        {pendingTake5List.map(take5 => (
          <option key={take5.id} value={take5.id}>
            {take5.site} - {take5.detail_lokasi} ({formatDate(take5.tanggal)})
          </option>
        ))}
      </select>

      {selectedTake5Id && (
        <div
          style={{
            marginTop: '8px',
            padding: isMobile ? '6px' : '12px',
            backgroundColor: '#f0f9ff',
            border: '1px solid #0ea5e9',
            borderRadius: '8px',
            fontSize: isMobile ? '11px' : '14px',
            color: '#0369a1',
            width: '100%', // selalu 100% karena sudah dalam wrapper
          }}
        >
          ✅ Take 5 terpilih. Data akan otomatis diisi ke form Hazard Report.
        </div>
      )}
    </div>
  );
};

export default PendingTake5List;
