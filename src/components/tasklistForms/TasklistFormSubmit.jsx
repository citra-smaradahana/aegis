import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';

function TasklistFormSubmit({ hazard, onSuccess, readOnly, onClose }) {
  if (!hazard) {
    return (
      <div style={{ color: '#ef4444', padding: 32 }}>
        Data hazard tidak ditemukan.
      </div>
    );
  }
  const [actionPlan, setActionPlan] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const minDueDate = hazard.created_at
    ? new Date(hazard.created_at).toISOString().slice(0, 10)
    : undefined;

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!actionPlan || !dueDate) {
      setError('Action plan dan due date wajib diisi.');
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from('hazard_report')
      .update({
        action_plan: actionPlan,
        due_date: dueDate,
        status: 'Open',
      })
      .eq('id', hazard.id);
    setLoading(false);
    if (error) {
      setError('Gagal update hazard report: ' + error.message);
    } else {
      if (onSuccess) onSuccess();
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
        maxWidth: 1100,
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
          color: '#232946',
        }}
      >
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
          <div style={{ fontWeight: 700, textAlign: 'right' }}>Evidence:</div>
          <div>
            {hazard.evidence && (
              <img
                src={hazard.evidence}
                alt="evidence"
                style={{ maxWidth: 180, borderRadius: 8, marginTop: 4 }}
              />
            )}
          </div>
        </div>
      </div>
      {/* Kanan: Form action plan */}
      <form
        onSubmit={handleSubmit}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          color: '#232946',
        }}
      >
        <h3 style={{ marginBottom: 16 }}>Action Plan</h3>
        {readOnly && (
          <div style={{ color: '#888', marginBottom: 8, fontStyle: 'italic' }}>
            Anda tidak memiliki akses untuk mengisi action plan pada status ini.
          </div>
        )}
        <div>
          <label>Action Plan</label>
          <input
            type="text"
            value={actionPlan}
            onChange={e => setActionPlan(e.target.value)}
            required
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
        <div>
          <label>Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            required
            style={{
              width: '100%',
              padding: 8,
              borderRadius: 6,
              border: '1px solid #ccc',
              background: readOnly ? '#f3f4f6' : '#fff',
              color: readOnly ? '#888' : '#232946',
            }}
            min={minDueDate}
            disabled={readOnly}
          />
        </div>
        {error && (
          <div style={{ color: '#ef4444', marginBottom: 8 }}>{error}</div>
        )}
        <button
          type="submit"
          disabled={loading || readOnly}
          style={{
            marginTop: 24,
            background: readOnly ? '#888' : '#232946',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '12px 0',
            fontWeight: 600,
            fontSize: 16,
            cursor: readOnly ? 'not-allowed' : 'pointer',
            opacity: readOnly ? 0.7 : 1,
          }}
        >
          {loading ? 'Menyimpan...' : 'Submit'}
        </button>
      </form>
    </div>
  );
}

export default TasklistFormSubmit;
