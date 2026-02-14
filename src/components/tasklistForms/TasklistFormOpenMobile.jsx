import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

function TasklistFormOpenMobile({ hazard, onClose, onSuccess, readOnly, embedded }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [approveSelected, setApproveSelected] = useState(null); // null, 'ya', 'tidak'
  const [alasanPenolakan, setAlasanPenolakan] = useState('');
  const [showImagePopup, setShowImagePopup] = useState(false);

  // Prefill form jika ada data hazard
  useEffect(() => {
    if (hazard) {
      // Tidak perlu prefill karena field sudah dihilangkan
    }
  }, [hazard]);

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
    // Tidak perlu validasi deskripsi_penyelesaian karena field sudah dihilangkan

    setSubmitting(true);
    setError(null);

    try {
      let updateData = {};

      if (approveSelected === 'ya') {
        updateData = {
          status: 'Progress',
        };
      } else {
        updateData = {
          alasan_penolakan_open: alasanPenolakan,
          status: 'Reject at Open',
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
      setError('Gagal menyimpan. Silakan coba lagi.');
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
        width: embedded ? '100%' : '100vw',
        height: embedded ? 'auto' : '100vh',
        background: embedded ? 'transparent' : '#f3f4f6',
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
            Submit Penyelesaian
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
          overflowY: embedded ? 'visible' : 'auto',
          paddingBottom: embedded ? '16px' : '120px',
          minHeight: 0,
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
                onClick={() => setShowImagePopup(true)}
              />
              <div
                style={{
                  fontSize: 12,
                  color: '#6b7280',
                  marginTop: 4,
                  textAlign: 'center',
                }}
              >
                Tap untuk melihat detail
              </div>
            </div>
          </div>
        )}

        {/* Action Plan & Due Date (Read Only) */}
        <div
          style={{
            background: '#fff',
            borderRadius: '8px',
            marginBottom: '20px',
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
              Apakah Action Plan dapat dilaksanakan? *
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

        {/* Deskripsi Penyelesaian (jika pilih Ya) */}
        {/* Dihilangkan sesuai permintaan, tidak perlu deskripsi penyelesaian pada status Open */}

        {/* Evidence Perbaikan (jika pilih Ya) */}
        {/* Dihilangkan sesuai permintaan, tidak perlu upload foto pada status Open */}

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
              placeholder="Jelaskan alasan mengapa Action Plan tidak dapat dilaksanakan..."
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

      {/* Image Popup */}
      {showImagePopup && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setShowImagePopup(false)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
            }}
          >
            <button
              onClick={() => setShowImagePopup(false)}
              style={{
                position: 'absolute',
                top: -40,
                right: 0,
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: 24,
                cursor: 'pointer',
                padding: '8px',
              }}
            >
              ×
            </button>
            <img
              src={evidence}
              alt="Evidence Detail"
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '90vh',
                objectFit: 'contain',
                borderRadius: '8px',
              }}
              onClick={e => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Fixed Submit Button */}
      <div
        style={{
          background: '#fff',
          padding: '16px',
          borderTop: '1px solid #e5e7eb',
          ...(embedded ? {} : { position: 'fixed', left: 0, right: 0, bottom: 56, zIndex: 100 }),
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

export default TasklistFormOpenMobile;
