import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../Dropzone/cropImageUtil';

function TasklistFormProgressMobile({ hazard, onClose, onSuccess, readOnly, embedded }) {
  const [form, setForm] = useState({
    deskripsi_penyelesaian: '',
  });
  const [evidence, setEvidence] = useState(null);
  const [evidencePreview, setEvidencePreview] = useState(null);
  const [showCrop, setShowCrop] = useState(false);
  const [rawImage, setRawImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showImagePopup, setShowImagePopup] = useState(false);
  const fileInputRef = React.useRef();

  // Prefill form jika ada data hazard
  useEffect(() => {
    if (hazard) {
      setForm({
        deskripsi_penyelesaian: hazard.deskripsi_penyelesaian || '',
      });
      if (hazard.evidence_perbaikan) {
        setEvidencePreview(hazard.evidence_perbaikan);
      }
    }
  }, [hazard]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Cropper logic
  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleEvidence = e => {
    if (readOnly) return;
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
    if (readOnly) return;
    setError(null);

    if (!form.deskripsi_penyelesaian || !evidence) {
      setError('Deskripsi penyelesaian dan evidence perbaikan wajib diisi.');
      return;
    }

    setSubmitting(true);
    let evidenceUrl = null;

    try {
      evidenceUrl = await uploadEvidence();

      const { error: updateError } = await supabase
        .from('hazard_report')
        .update({
          deskripsi_penyelesaian: form.deskripsi_penyelesaian,
          evidence_perbaikan: evidenceUrl,
          status: 'Done',
        })
        .eq('id', hazard.id);

      if (updateError) throw updateError;

      onSuccess && onSuccess();
      onClose && onClose();
    } catch (err) {
      console.error('Error updating hazard report:', err);
      setError('Gagal menyimpan progress. Silakan coba lagi.');
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
  const evidenceHazard = hazard?.evidence || '-';

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
            width: 280,
            height: 280,
            background: '#fff',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <Cropper
            image={rawImage}
            crop={crop}
            zoom={zoom}
            aspect={4 / 3}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{ containerStyle: { width: '100%', height: '100%' } }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 20,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              gap: 20,
            }}
          >
            <button
              onClick={handleCropCancel}
              style={{
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: 40,
                height: 40,
                fontSize: 18,
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
            <button
              onClick={handleCropSave}
              style={{
                background: '#22c55e',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: 40,
                height: 40,
                fontSize: 18,
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              ✓
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            Update Progress
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

        {/* Deskripsi Penyelesaian */}
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
            Deskripsi Penyelesaian *
          </label>
          <textarea
            name="deskripsi_penyelesaian"
            value={form.deskripsi_penyelesaian}
            onChange={handleChange}
            required
            placeholder="Jelaskan detail penyelesaian yang telah dilakukan..."
            style={{
              width: '100%',
              minHeight: '120px',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: 16,
              resize: 'vertical',
              fontFamily: 'inherit',
              background: readOnly ? '#f3f4f6' : undefined,
              color: readOnly ? '#9ca3af' : undefined,
            }}
            readOnly={readOnly}
            disabled={readOnly}
          />
        </div>

        {/* Evidence Penyelesaian */}
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
            Evidence Penyelesaian *
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleEvidence}
            style={{ display: 'none' }}
            disabled={readOnly}
          />

          {evidencePreview ? (
            <div style={{ textAlign: 'center' }}>
              <img
                src={evidencePreview}
                alt="Evidence Preview"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  maxWidth: '100%',
                  maxHeight: '200px',
                  borderRadius: '8px',
                  border: '2px solid #e5e7eb',
                  cursor: readOnly ? 'not-allowed' : 'pointer',
                }}
              />
              <div
                style={{
                  fontSize: 12,
                  color: '#6b7280',
                  marginTop: 4,
                  textAlign: 'center',
                }}
              >
                Tap untuk ganti foto
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%',
                background: '#f3f4f6',
                border: '2px dashed #d1d5db',
                borderRadius: '8px',
                padding: '20px',
                fontSize: 16,
                color: '#6b7280',
                cursor: readOnly ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              disabled={readOnly}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Klik untuk mengambil foto
            </button>
          )}
        </div>

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
            readOnly || submitting || !form.deskripsi_penyelesaian || !evidence
          }
          style={{
            width: '100%',
            padding: '16px',
            background:
              readOnly ||
              submitting ||
              !form.deskripsi_penyelesaian ||
              !evidence
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
              !form.deskripsi_penyelesaian ||
              !evidence
                ? 'not-allowed'
                : 'pointer',
            opacity:
              readOnly ||
              submitting ||
              !form.deskripsi_penyelesaian ||
              !evidence
                ? 0.6
                : 1,
          }}
        >
          {readOnly
            ? 'Read Only'
            : submitting
              ? 'Menyimpan...'
              : 'Update Progress'}
        </button>
      </div>
    </div>
  );
}

export default TasklistFormProgressMobile;
