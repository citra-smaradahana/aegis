import React, { useState } from 'react';

function TasklistFormClosed({ hazard, onClose }) {
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [popupImage, setPopupImage] = useState(null);

  if (!hazard) {
    return (
      <div style={{ color: '#ef4444', padding: 32 }}>
        Data hazard tidak ditemukan.
      </div>
    );
  }

  const handleImageClick = imageUrl => {
    setPopupImage(imageUrl);
    setShowImagePopup(true);
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: 32,
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 24px #2563eb33',
        padding: 32,
        maxWidth: 1300,
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

      {/* Kiri: Detail hazard report */}
      <div
        style={{
          flex: 1,
          borderRight: '1px solid #e5e7eb',
          paddingRight: 32,
        }}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}
        >
          <h3 style={{ margin: 0, marginRight: 16 }}>Detail Hazard Report</h3>
          <div
            style={{
              background: '#10b981',
              color: '#fff',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            ✅ CLOSED
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '160px 1fr',
            rowGap: 12,
            columnGap: 12,
            alignItems: 'center',
          }}
        >
          <div style={{ fontWeight: 700, textAlign: 'right' }}>Site:</div>
          <div>{hazard.site || '-'}</div>

          <div style={{ fontWeight: 700, textAlign: 'right' }}>Lokasi:</div>
          <div>{hazard.lokasi || '-'}</div>

          <div style={{ fontWeight: 700, textAlign: 'right' }}>
            Detail Lokasi:
          </div>
          <div>{hazard.detail_lokasi || '-'}</div>

          <div style={{ fontWeight: 700, textAlign: 'right' }}>
            Keterangan Lokasi:
          </div>
          <div>{hazard.keterangan_lokasi || '-'}</div>

          <div style={{ fontWeight: 700, textAlign: 'right' }}>
            Ketidaksesuaian:
          </div>
          <div>{hazard.ketidaksesuaian || '-'}</div>

          {hazard.sub_ketidaksesuaian && (
            <>
              <div style={{ fontWeight: 700, textAlign: 'right' }}>
                Sub Ketidaksesuaian:
              </div>
              <div>{hazard.sub_ketidaksesuaian}</div>
            </>
          )}

          {hazard.quick_action && (
            <>
              <div style={{ fontWeight: 700, textAlign: 'right' }}>
                Quick Action:
              </div>
              <div>{hazard.quick_action}</div>
            </>
          )}

          <div style={{ fontWeight: 700, textAlign: 'right' }}>Temuan:</div>
          <div style={{ lineHeight: 1.5 }}>
            {hazard.deskripsi_temuan || hazard.temuan || '-'}
          </div>

          {hazard.evidence && (
            <>
              <div style={{ fontWeight: 700, textAlign: 'right' }}>
                Evidence:
              </div>
              <div>
                <img
                  src={hazard.evidence}
                  alt="Evidence"
                  style={{
                    maxWidth: '200px',
                    maxHeight: '150px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleImageClick(hazard.evidence)}
                />
                <div
                  style={{
                    fontSize: 12,
                    color: '#6b7280',
                    marginTop: 4,
                  }}
                >
                  Klik untuk melihat detail
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Kanan: Action plan dan progress */}
      <div style={{ flex: 1, paddingLeft: 32 }}>
        <h3 style={{ marginBottom: 24 }}>Action Plan & Progress</h3>

        {/* Action Plan */}
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#8b5cf6' }}>
            📋 Action Plan
          </h4>
          <div
            style={{
              background: '#f8fafc',
              padding: 16,
              borderRadius: 8,
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ lineHeight: 1.5 }}>{hazard.action_plan || '-'}</div>
            <div style={{ marginTop: 12, fontWeight: 600 }}>
              Due Date:{' '}
              {hazard.due_date
                ? new Date(hazard.due_date).toLocaleDateString('id-ID')
                : '-'}
            </div>
          </div>
        </div>

        {/* Progress Sebelumnya */}
        {hazard.deskripsi_penyelesaian && (
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#059669' }}>
              📝 Progress Sebelumnya
            </h4>
            <div
              style={{
                background: '#f0fdf4',
                padding: 16,
                borderRadius: 8,
                border: '1px solid #bbf7d0',
              }}
            >
              <div style={{ lineHeight: 1.5, marginBottom: 12 }}>
                {hazard.deskripsi_penyelesaian}
              </div>
              {hazard.evidence_perbaikan && (
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>
                    Evidence Penyelesaian:
                  </div>
                  <img
                    src={hazard.evidence_perbaikan}
                    alt="Evidence Penyelesaian"
                    style={{
                      maxWidth: '200px',
                      maxHeight: '150px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleImageClick(hazard.evidence_perbaikan)}
                  />
                  <div
                    style={{
                      fontSize: 12,
                      color: '#6b7280',
                      marginTop: 4,
                    }}
                  >
                    Klik untuk melihat detail
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
            color: '#fff',
            padding: 16,
            borderRadius: 8,
            textAlign: 'center',
          }}
        >
          <h4 style={{ margin: '0 0 8px 0' }}>✅ Status Closed</h4>
          <p style={{ margin: 0, fontSize: 14, opacity: 0.9 }}>
            Hazard report telah selesai dan ditutup
          </p>
        </div>
      </div>

      {/* Image Popup */}
      {showImagePopup && popupImage && (
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
            padding: '40px',
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
              src={popupImage}
              alt="Detail"
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
    </div>
  );
}

export default TasklistFormClosed;
