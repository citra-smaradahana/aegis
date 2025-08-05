import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';

function TasklistFormDone({ hazard, onApprove, onReject, readOnly, onClose }) {
  const [, setShowReject] = useState(false);
  const [alasan, setAlasan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [approveSelected, setApproveSelected] = useState(null); // null, 'ya', 'tidak'

  if (!hazard) {
    return (
      <div style={{ color: '#ef4444', padding: 32 }}>
        Data hazard tidak ditemukan.
      </div>
    );
  }

  const handleApprove = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('hazard_report')
      .update({ status: 'Closed' })
      .eq('id', hazard.id);
    setLoading(false);
    if (!error) {
      if (onApprove) onApprove();
      if (onClose) onClose(); // Tutup card setelah berhasil
    }
  };

  const handleReject = async () => {
    if (!alasan.trim()) {
      setError('Alasan penolakan wajib diisi.');
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from('hazard_report')
      .update({ status: 'Reject at Done', alasan_penolakan_done: alasan })
      .eq('id', hazard.id);
    setLoading(false);
    if (!error) {
      if (onReject) onReject();
      if (onClose) onClose(); // Tutup card setelah berhasil
    }
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
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h3 style={{ marginBottom: 24 }}>Detail Hazard Report</h3>
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
            <div>{hazard.lokasi}</div>
            <div style={{ fontWeight: 700, textAlign: 'right' }}>
              Nama Pelapor:
            </div>
            <div>{hazard.pelapor_nama}</div>
            <div style={{ fontWeight: 700, textAlign: 'right' }}>
              NRP Pelapor:
            </div>
            <div>{hazard.pelapor_nrp}</div>
            <div style={{ fontWeight: 700, textAlign: 'right' }}>PIC:</div>
            <div>{hazard.pic}</div>
            <div style={{ fontWeight: 700, textAlign: 'right' }}>
              Deskripsi Temuan:
            </div>
            <div>{hazard.deskripsi_temuan}</div>
            <div style={{ fontWeight: 700, textAlign: 'right' }}>
              Quick Action:
            </div>
            <div>{hazard.quick_action}</div>
            <div style={{ fontWeight: 700, textAlign: 'right' }}>
              Ketidaksesuaian:
            </div>
            <div>{hazard.ketidaksesuaian}</div>
            <div style={{ fontWeight: 700, textAlign: 'right' }}>
              Sub Ketidaksesuaian:
            </div>
            <div>{hazard.sub_ketidaksesuaian}</div>
            <div style={{ fontWeight: 700, textAlign: 'right' }}>
              Keterangan Lokasi:
            </div>
            <div>{hazard.keterangan_lokasi}</div>
            <div style={{ fontWeight: 700, textAlign: 'right' }}>
              Detail Lokasi:
            </div>
            <div>{hazard.detail_lokasi}</div>
            <div style={{ fontWeight: 700, textAlign: 'right' }}>
              Action Plan:
            </div>
            <div>{hazard.action_plan}</div>
            <div style={{ fontWeight: 700, textAlign: 'right' }}>Due Date:</div>
            <div>{hazard.due_date}</div>
          </div>
        </div>
        {/* Evidence temuan hazard di kiri bawah, hanya jika bukan Closed */}
        {hazard.status !== 'Closed' && hazard.evidence && (
          <div
            style={{
              marginTop: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div
              style={{ fontWeight: 700, textAlign: 'right', marginBottom: 4 }}
            >
              Evidence Temuan:
            </div>
            <img
              src={hazard.evidence}
              alt="evidence temuan"
              style={{ maxWidth: 180, borderRadius: 8, marginTop: 4 }}
            />
          </div>
        )}
      </div>
      {/* Kanan: Penyelesaian dan aksi */}
      <div
        style={{
          flex: 1.2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'center',
          gap: 24,
        }}
      >
        {/* Evidence temuan di kanan atas jika status Closed */}
        {hazard.status === 'Closed' && hazard.evidence && (
          <div
            style={{
              width: '100%',
              marginBottom: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 8,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 4 }}>
              Evidence Temuan:
            </div>
            <img
              src={hazard.evidence}
              alt="evidence temuan"
              style={{ maxWidth: 180, borderRadius: 8, marginTop: 0 }}
            />
          </div>
        )}
        {/* Deskripsi penyelesaian dan evidence perbaikan di kanan atas */}
        <div style={{ width: '100%', marginBottom: 16 }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 8,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 4 }}>
              Deskripsi Penyelesaian:
            </div>
            <div style={{ marginBottom: 12 }}>
              {hazard.deskripsi_penyelesaian}
            </div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>
              Evidence Perbaikan:
            </div>
            {hazard.evidence_perbaikan && (
              <img
                src={hazard.evidence_perbaikan}
                alt="evidence perbaikan"
                style={{ maxWidth: 180, borderRadius: 8, marginTop: 0 }}
              />
            )}
          </div>
        </div>
        {/* Pilihan aksi */}
        {hazard.status !== 'Closed' ? (
          <>
            <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 24 }}>
              Apakah Anda menyetujui penyelesaian hazard ini?
            </div>
            {readOnly && (
              <div
                style={{ color: '#888', marginBottom: 8, fontStyle: 'italic' }}
              >
                Anda tidak memiliki akses untuk aksi pada status ini.
              </div>
            )}
            <div style={{ display: 'flex', gap: 24 }}>
              <button
                type="button"
                onClick={() => setApproveSelected('ya')}
                disabled={loading || readOnly}
                style={{
                  background: approveSelected === 'ya' ? '#10b981' : '#fff',
                  color: approveSelected === 'ya' ? '#fff' : '#232946',
                  border: '2px solid #10b981',
                  borderRadius: 8,
                  padding: '12px 32px',
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: readOnly ? 'not-allowed' : 'pointer',
                  boxShadow:
                    approveSelected === 'ya' ? '0 2px 8px #10b98133' : 'none',
                  transition: 'all 0.2s',
                  opacity: readOnly ? 0.7 : 1,
                }}
                onMouseEnter={e => {
                  if (!readOnly && approveSelected !== 'ya')
                    e.currentTarget.style.background = '#e6f9f3';
                }}
                onMouseLeave={e => {
                  if (!readOnly && approveSelected !== 'ya')
                    e.currentTarget.style.background = '#fff';
                }}
              >
                Ya
              </button>
              <button
                type="button"
                onClick={() => setApproveSelected('tidak')}
                disabled={loading || readOnly}
                style={{
                  background: approveSelected === 'tidak' ? '#ef4444' : '#fff',
                  color: approveSelected === 'tidak' ? '#fff' : '#232946',
                  border: '2px solid #ef4444',
                  borderRadius: 8,
                  padding: '12px 32px',
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: readOnly ? 'not-allowed' : 'pointer',
                  boxShadow:
                    approveSelected === 'tidak'
                      ? '0 2px 8px #ef444433'
                      : 'none',
                  transition: 'all 0.2s',
                  opacity: readOnly ? 0.7 : 1,
                }}
                onMouseEnter={e => {
                  if (!readOnly && approveSelected !== 'tidak')
                    e.currentTarget.style.background = '#fde8e8';
                }}
                onMouseLeave={e => {
                  if (!readOnly && approveSelected !== 'tidak')
                    e.currentTarget.style.background = '#fff';
                }}
              >
                Tidak
              </button>
            </div>
            {approveSelected === 'tidak' && (
              <div style={{ width: '100%', marginTop: 16 }}>
                <label>
                  Alasan Penolakan <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  value={alasan}
                  onChange={e => setAlasan(e.target.value)}
                  required
                  rows={3}
                  style={{
                    width: '100%',
                    padding: 8,
                    borderRadius: 6,
                    border: '1px solid #ccc',
                    background: readOnly ? '#f3f4f6' : '#fff',
                    color: readOnly ? '#888' : '#232946',
                  }}
                  disabled={readOnly}
                />
              </div>
            )}
            {error && (
              <div style={{ color: '#ef4444', marginTop: 8 }}>{error}</div>
            )}
            <button
              onClick={async () => {
                if (approveSelected === 'ya') {
                  await handleApprove();
                } else if (approveSelected === 'tidak') {
                  if (!alasan.trim()) {
                    setError('Alasan penolakan wajib diisi.');
                    return;
                  }
                  await handleReject();
                }
              }}
              disabled={
                loading ||
                !approveSelected ||
                (approveSelected === 'tidak' && !alasan.trim()) ||
                readOnly
              }
              style={{
                marginTop: 32,
                background: readOnly ? '#888' : '#232946',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '12px 0',
                fontWeight: 600,
                fontSize: 16,
                cursor: readOnly
                  ? 'not-allowed'
                  : approveSelected &&
                      (approveSelected === 'ya' ||
                        (approveSelected === 'tidak' && alasan.trim()))
                    ? 'pointer'
                    : 'not-allowed',
                width: 180,
                opacity: readOnly
                  ? 0.7
                  : approveSelected &&
                      (approveSelected === 'ya' ||
                        (approveSelected === 'tidak' && alasan.trim()))
                    ? 1
                    : 0.6,
              }}
            >
              {loading ? 'Menyimpan...' : 'Submit'}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default TasklistFormDone;
