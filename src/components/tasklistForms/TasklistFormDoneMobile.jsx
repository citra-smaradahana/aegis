import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';

function TasklistFormDoneMobile({ hazard, onClose, onSuccess, readOnly }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [approveSelected, setApproveSelected] = useState(null); // null, 'ya', 'tidak'
  const [alasanPenolakan, setAlasanPenolakan] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    if (readOnly) return;
    if (!approveSelected) {
      setError('Pilih Ya atau Tidak untuk melanjutkan.');
      return;
    }
    if (approveSelected === 'tidak' && !alasanPenolakan) {
      setError('Alasan penolakan wajib diisi.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let updateData = {};

      if (approveSelected === 'ya') {
        updateData = {
          status: 'Closed',
        };
      } else {
        updateData = {
          alasan_penolakan_done: alasanPenolakan,
          status: 'Reject at Done',
        };
      }

      const { error: updateError } = await supabase
        .from('hazard_report')
        .update(updateData)
        .eq('id', hazard.id);

      if (updateError) throw updateError;

      onSuccess && onSuccess();
      onClose && onClose();
    } catch (err) {
      console.error('Error updating hazard report:', err);
      setError('Gagal menyimpan evaluasi. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper untuk ambil field hazard
  const lokasi = hazard?.lokasi || '-';
  const detailLokasi = hazard?.detail_lokasi || '-';
  const keteranganLokasi = hazard?.keterangan_lokasi || '-';
  const ketidaksesuaian = hazard?.ketidaksesuaian || '-';
  const subKetidaksesuaian = hazard?.sub_ketidaksesuaian || '-';
  const quickAction = hazard?.quick_action || '-';
  const temuan = hazard?.deskripsi_temuan || hazard?.temuan || '-';
  const evidence = hazard?.evidence || '-';

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#f3f4f6',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: '#fff',
          padding: '16px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 600,
              color: '#1f2937',
            }}
          >
            Evaluasi Hazard Report
          </h2>
          <p
            style={{
              margin: '4px 0 0 0',
              fontSize: 14,
              color: '#6b7280',
            }}
          >
            Hazard #{hazard?.id}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 24,
            color: '#6b7280',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          ×
        </button>
      </div>

      {/* Detail Hazard Report (Read Only) */}
      <div
        style={{
          flex: 1,
          padding: '16px',
          overflowY: 'auto',
          paddingBottom: '120px', // Tambah padding bottom agar bisa di-scroll
        }}
      >
        {/* Lokasi */}
        <div
          style={{
            background: '#fff',
            borderRadius: '8px',
            marginBottom: '16px',
            boxShadow: '0 1px 4px #0001',
            padding: '16px',
          }}
        >
          <h3 style={{ margin: 0, fontSize: 15, color: '#2563eb' }}>
            📍 Lokasi
          </h3>
          <div style={{ fontSize: 15, color: '#374151', marginTop: 8 }}>
            <div>
              <strong>Lokasi:</strong> {lokasi}
            </div>
            <div>
              <strong>Detail Lokasi:</strong> {detailLokasi}
            </div>
            <div>
              <strong>Keterangan Lokasi:</strong> {keteranganLokasi}
            </div>
          </div>
        </div>

        {/* Ketidaksesuaian */}
        <div
          style={{
            background: '#fff',
            borderRadius: '8px',
            marginBottom: '16px',
            boxShadow: '0 1px 4px #0001',
            padding: '16px',
          }}
        >
          <h3 style={{ margin: 0, fontSize: 15, color: '#f59e42' }}>
            ⚠️ Ketidaksesuaian
          </h3>
          <div style={{ fontSize: 15, color: '#374151', marginTop: 8 }}>
            <div>
              <strong>Ketidaksesuaian:</strong> {ketidaksesuaian}
            </div>
            {subKetidaksesuaian && (
              <div>
                <strong>Sub Ketidaksesuaian:</strong> {subKetidaksesuaian}
              </div>
            )}
            {quickAction && (
              <div>
                <strong>Quick Action:</strong> {quickAction}
              </div>
            )}
          </div>
        </div>

        {/* Temuan */}
        <div
          style={{
            background: '#fff',
            borderRadius: '8px',
            marginBottom: '16px',
            boxShadow: '0 1px 4px #0001',
            padding: '16px',
          }}
        >
          <h3 style={{ margin: 0, fontSize: 15, color: '#ef4444' }}>
            🔍 Temuan
          </h3>
          <div style={{ fontSize: 15, color: '#374151', marginTop: 8 }}>
            <div>
              <strong>Deskripsi Temuan:</strong>
            </div>
            <div style={{ marginTop: 4, lineHeight: 1.5 }}>{temuan}</div>
          </div>
        </div>

        {/* Evidence */}
        {evidence && evidence !== '-' && (
          <div
            style={{
              background: '#fff',
              borderRadius: '8px',
              marginBottom: '16px',
              boxShadow: '0 1px 4px #0001',
              padding: '16px',
            }}
          >
            <h3 style={{ margin: 0, fontSize: 15, color: '#10b981' }}>
              📷 Evidence
            </h3>
            <div style={{ marginTop: 8 }}>
              <img
                src={evidence}
                alt="Evidence"
                style={{
                  width: '100%',
                  maxHeight: '150px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  cursor: 'pointer',
                }}
              />
            </div>
          </div>
        )}

        {/* Action Plan & Due Date (Read Only) */}
        <div
          style={{
            background: '#fff',
            borderRadius: '8px',
            marginBottom: '16px',
            boxShadow: '0 1px 4px #0001',
            padding: '16px',
          }}
        >
          <h3 style={{ margin: 0, fontSize: 15, color: '#8b5cf6' }}>
            📋 Action Plan
          </h3>
          <div style={{ fontSize: 15, color: '#374151', marginTop: 8 }}>
            <div>
              <strong>Action Plan:</strong>
            </div>
            <div style={{ marginTop: 4, lineHeight: 1.5 }}>
              {hazard?.action_plan || '-'}
            </div>
            <div style={{ marginTop: 12 }}>
              <strong>Due Date:</strong>{' '}
              {hazard?.due_date
                ? new Date(hazard.due_date).toLocaleDateString('id-ID')
                : '-'}
            </div>
          </div>
        </div>

        {/* Deskripsi Penyelesaian (Read Only) */}
        {hazard?.deskripsi_penyelesaian && (
          <div
            style={{
              background: '#fff',
              borderRadius: '8px',
              marginBottom: '16px',
              boxShadow: '0 1px 4px #0001',
              padding: '16px',
            }}
          >
            <h3 style={{ margin: 0, fontSize: 15, color: '#059669' }}>
              📝 Deskripsi Penyelesaian
            </h3>
            <div style={{ fontSize: 15, color: '#374151', marginTop: 8 }}>
              <div style={{ lineHeight: 1.5 }}>
                {hazard.deskripsi_penyelesaian}
              </div>
            </div>
          </div>
        )}

        {/* Evidence Penyelesaian (Read Only) */}
        {hazard?.evidence_perbaikan && (
          <div
            style={{
              background: '#fff',
              borderRadius: '8px',
              marginBottom: '20px',
              boxShadow: '0 1px 4px #0001',
              padding: '16px',
            }}
          >
            <h3 style={{ margin: 0, fontSize: 15, color: '#059669' }}>
              📷 Evidence Penyelesaian
            </h3>
            <div style={{ marginTop: 8 }}>
              <img
                src={hazard.evidence_perbaikan}
                alt="Evidence Penyelesaian"
                style={{
                  width: '100%',
                  maxHeight: '150px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                }}
              />
            </div>
          </div>
        )}

        {/* Approve/Reject Buttons */}
        {!readOnly && (
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '12px',
                fontSize: 16,
              }}
            >
              Apakah penyelesaian sudah sesuai? *
            </label>

            {/* Button Container - 2 columns */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}
            >
              {/* Approve Button */}
              <button
                type="button"
                onClick={() => setApproveSelected('ya')}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: approveSelected === 'ya' ? '#10b981' : '#f3f4f6',
                  color: approveSelected === 'ya' ? '#fff' : '#374151',
                  border: '2px solid',
                  borderColor: approveSelected === 'ya' ? '#10b981' : '#d1d5db',
                  borderRadius: '8px',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Ya
              </button>

              {/* Reject Button */}
              <button
                type="button"
                onClick={() => setApproveSelected('tidak')}
                style={{
                  width: '100%',
                  padding: '16px',
                  background:
                    approveSelected === 'tidak' ? '#ef4444' : '#f3f4f6',
                  color: approveSelected === 'tidak' ? '#fff' : '#374151',
                  border: '2px solid',
                  borderColor:
                    approveSelected === 'tidak' ? '#ef4444' : '#d1d5db',
                  borderRadius: '8px',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Tidak
              </button>
            </div>
          </div>
        )}

        {/* Alasan Penolakan (jika pilih Tidak) */}
        {!readOnly && approveSelected === 'tidak' && (
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '8px',
                fontSize: 16,
              }}
            >
              Alasan Penolakan *
            </label>
            <textarea
              value={alasanPenolakan}
              onChange={e => setAlasanPenolakan(e.target.value)}
              required
              placeholder="Jelaskan alasan mengapa penyelesaian tidak sesuai..."
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: 16,
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Fixed Submit Button */}
      <div
        style={{
          background: '#fff',
          padding: '16px',
          borderTop: '1px solid #e5e7eb',
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 56, // asumsi navbar tinggi 56px
          zIndex: 100,
        }}
      >
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={
            readOnly ||
            submitting ||
            !approveSelected ||
            (approveSelected === 'tidak' && !alasanPenolakan)
          }
          style={{
            width: '100%',
            padding: '16px',
            background:
              readOnly ||
              submitting ||
              !approveSelected ||
              (approveSelected === 'tidak' && !alasanPenolakan)
                ? '#9ca3af'
                : '#10b981',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: 16,
            fontWeight: 600,
            cursor:
              readOnly ||
              submitting ||
              !approveSelected ||
              (approveSelected === 'tidak' && !alasanPenolakan)
                ? 'not-allowed'
                : 'pointer',
            opacity:
              readOnly ||
              submitting ||
              !approveSelected ||
              (approveSelected === 'tidak' && !alasanPenolakan)
                ? 0.6
                : 1,
          }}
        >
          {readOnly ? 'Read Only' : submitting ? 'Menyimpan...' : 'Submit'}
        </button>
      </div>
    </div>
  );
}

export default TasklistFormDoneMobile;
