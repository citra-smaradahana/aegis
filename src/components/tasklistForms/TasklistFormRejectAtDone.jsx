import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../Dropzone/cropImageUtil';
import { FiX, FiCheck } from 'react-icons/fi';

function TasklistFormRejectAtDone({ hazard, onSuccess, readOnly, onClose }) {
  const [desc, setDesc] = useState('');
  const [evidence, setEvidence] = useState(null);
  const [evidencePreview, setEvidencePreview] = useState(null);
  const [showCrop, setShowCrop] = useState(false);
  const [rawImage, setRawImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!hazard) {
    return (
      <div style={{ color: '#ef4444', padding: 32 }}>
        Data hazard tidak ditemukan.
      </div>
    );
  }

  // Cropper logic
  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleEvidence = e => {
    const file = e.target.files[0];
    if (file) {
      setRawImage(URL.createObjectURL(file));
      setShowCrop(true);
    }
  };

  const handleCropSave = async () => {
    try {
      const croppedBlob = await getCroppedImg(rawImage, croppedAreaPixels);
      setEvidence(croppedBlob);
      setEvidencePreview(URL.createObjectURL(croppedBlob));
      setShowCrop(false);
      setRawImage(null);
    } catch (err) {
      setError('Gagal crop gambar');
      setShowCrop(false);
    }
  };

  const handleCropCancel = () => {
    setShowCrop(false);
    setRawImage(null);
  };

  // Upload evidence ke bucket closing-hazard
  const uploadEvidence = async () => {
    if (!evidence) return null;
    const fileExt = evidence.type.split('/')[1];
    const fileName = `hazard_${hazard.id}_${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage
      .from('closing-hazard')
      .upload(fileName, evidence, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage
      .from('closing-hazard')
      .getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!desc || !evidence) {
      setError(
        'Deskripsi perbaikan dan evidence perbaikan revisi wajib diisi.'
      );
      return;
    }
    setLoading(true);
    let evidenceUrl = null;
    try {
      evidenceUrl = await uploadEvidence();
    } catch (err) {
      setError('Gagal upload evidence: ' + err.message);
      setLoading(false);
      return;
    }
    const { error } = await supabase
      .from('hazard_report')
      .update({
        deskripsi_penyelesaian: desc,
        evidence_perbaikan: evidenceUrl,
        status: 'Done',
      })
      .eq('id', hazard.id);
    setLoading(false);
    if (error) {
      setError('Gagal update hazard report: ' + error.message);
    } else {
      if (onSuccess) onSuccess();
    }
  };

  // Crop modal
  if (showCrop) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: 320,
            height: 320,
            background: '#fff',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <Cropper
            image={rawImage}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 24,
              display: 'flex',
              justifyContent: 'center',
              gap: 32,
              pointerEvents: 'none',
            }}
          >
            <button
              onClick={handleCropCancel}
              style={{
                background: '#ef4444',
                border: 'none',
                width: 40,
                height: 40,
                borderRadius: '50%',
                fontSize: 22,
                color: '#fff',
                cursor: 'pointer',
                boxShadow: '0 2px 8px #0002',
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Batal"
            >
              <FiX size={22} />
            </button>
            <button
              onClick={handleCropSave}
              style={{
                background: '#10b981',
                border: 'none',
                width: 40,
                height: 40,
                borderRadius: '50%',
                fontSize: 22,
                color: '#fff',
                cursor: 'pointer',
                boxShadow: '0 2px 8px #0002',
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Simpan"
            >
              <FiCheck size={22} />
            </button>
          </div>
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
        {/* Evidence temuan hazard di kiri bawah */}
        <div
          style={{
            marginTop: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div style={{ fontWeight: 700, textAlign: 'right', marginBottom: 4 }}>
            Evidence Temuan:
          </div>
          {hazard.evidence && (
            <img
              src={hazard.evidence}
              alt="evidence temuan"
              style={{ maxWidth: 180, borderRadius: 8, marginTop: 4 }}
            />
          )}
        </div>
      </div>
      {/* Kanan: Penyelesaian dan form revisi */}
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
        {/* Deskripsi penyelesaian dan evidence perbaikan (read only) di kanan atas */}
        <div style={{ width: '100%', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>
                Deskripsi Penyelesaian (Sebelumnya):
              </div>
              <div style={{ marginBottom: 12 }}>
                {hazard.deskripsi_penyelesaian}
              </div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>
                Evidence Perbaikan (Sebelumnya):
              </div>
            </div>
            {hazard.evidence_perbaikan && (
              <img
                src={hazard.evidence_perbaikan}
                alt="evidence perbaikan"
                style={{ maxWidth: 180, borderRadius: 8, marginTop: 4 }}
              />
            )}
          </div>
        </div>
        {/* Form revisi deskripsi dan evidence perbaikan */}
        <form
          onSubmit={handleSubmit}
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {readOnly && (
            <div
              style={{ color: '#888', marginBottom: 8, fontStyle: 'italic' }}
            >
              Anda tidak memiliki akses untuk revisi pada status ini.
            </div>
          )}
          <div style={{ fontWeight: 700, marginBottom: 4 }}>
            Deskripsi Penyelesaian (Revisi)
          </div>
          <textarea
            value={desc}
            onChange={e => setDesc(e.target.value)}
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
          <div style={{ fontWeight: 700, marginBottom: 4 }}>
            Evidence Perbaikan (Revisi)
          </div>
          {!evidencePreview && (
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById('evidence-perbaikan-revisi-input')
                  .click()
              }
              style={{
                background: readOnly ? '#888' : '#232946',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 18px',
                fontWeight: 600,
                cursor: readOnly ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                opacity: readOnly ? 0.7 : 1,
              }}
              disabled={readOnly}
            >
              <span role="img" aria-label="camera">
                📷
              </span>{' '}
              Ambil/Upload Foto
            </button>
          )}
          <input
            id="evidence-perbaikan-revisi-input"
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={handleEvidence}
            disabled={readOnly}
          />
          {evidencePreview && (
            <div style={{ marginTop: 8 }}>
              <img
                src={evidencePreview}
                alt="evidence preview"
                style={{
                  maxWidth: 120,
                  borderRadius: 8,
                  cursor: readOnly ? 'not-allowed' : 'pointer',
                }}
                onClick={() => {
                  if (!readOnly) {
                    setRawImage(evidencePreview);
                    setShowCrop(true);
                  }
                }}
                title={readOnly ? undefined : 'Klik untuk revisi/crop ulang'}
              />
            </div>
          )}
          {error && (
            <div style={{ color: '#ef4444', marginBottom: 8 }}>{error}</div>
          )}
          <button
            type="submit"
            disabled={loading || readOnly}
            style={{
              marginTop: 24,
              background: readOnly ? '#888' : '#10b981',
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
    </div>
  );
}

export default TasklistFormRejectAtDone;
