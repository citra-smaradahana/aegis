import React, { useState } from 'react';

function TasklistFormClosedMobile({ hazard, onClose }) {
  const [showImagePopup, setShowImagePopup] = useState(false);

  // Helper untuk ambil field hazard
  const lokasi = hazard?.lokasi || '-';
  const detailLokasi = hazard?.detail_lokasi || '-';
  const keteranganLokasi = hazard?.keterangan_lokasi || '-';
  const ketidaksesuaian = hazard?.ketidaksesuaian || '-';
  const subKetidaksesuaian = hazard?.sub_ketidaksesuaian || '-';
  const quickAction = hazard?.quick_action || '-';
  const temuan = hazard?.deskripsi_temuan || hazard?.temuan || '-';
  const evidenceHazard = hazard?.evidence || '-';

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
            Status Closed
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
          paddingBottom: '80px', // Tambah padding bottom agar bisa di-scroll
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
        {evidenceHazard && evidenceHazard !== '-' && (
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
                src={evidenceHazard}
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

        {/* Progress Sebelumnya (Read Only) */}
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
              📝 Progress Sebelumnya
            </h3>
            <div style={{ fontSize: 15, color: '#374151', marginTop: 8 }}>
              <div>
                <strong>Deskripsi Penyelesaian:</strong>
              </div>
              <div style={{ marginTop: 4, lineHeight: 1.5 }}>
                {hazard.deskripsi_penyelesaian}
              </div>
              {hazard?.evidence_perbaikan && (
                <div style={{ marginTop: 12 }}>
                  <strong>Evidence Penyelesaian:</strong>
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
                        cursor: 'pointer',
                      }}
                      onClick={() => setShowImagePopup(true)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Closed Info */}
        <div
          style={{
            background: '#10b981',
            borderRadius: '8px',
            marginBottom: '16px',
            padding: '16px',
            textAlign: 'center',
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16, color: '#fff' }}>
            ✅ Status Closed
          </h3>
          <p style={{ margin: '8px 0 0 0', fontSize: 14, color: '#d1fae5' }}>
            Hazard report telah selesai dan ditutup
          </p>
        </div>
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
              src={evidenceHazard}
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

      {/* Fixed Close Button */}
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
          onClick={onClose}
          style={{
            width: '100%',
            padding: '16px',
            background: '#6b7280',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Tutup
        </button>
      </div>
    </div>
  );
}

export default TasklistFormClosedMobile;
