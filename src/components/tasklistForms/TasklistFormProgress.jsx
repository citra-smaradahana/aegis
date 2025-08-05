import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import Cropper from "react-easy-crop";
import getCroppedImg from "../Dropzone/cropImageUtil";

function TasklistFormProgress({ hazard, onClose, onSuccess, readOnly }) {
  const [form, setForm] = useState({
    deskripsi_penyelesaian: "",
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
        deskripsi_penyelesaian: hazard.deskripsi_penyelesaian || "",
      });
      if (hazard.evidence_perbaikan) {
        setEvidencePreview(hazard.evidence_perbaikan);
      }
    }
  }, [hazard]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Cropper logic
  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleEvidence = (e) => {
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
      setError("Gagal crop gambar");
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
    const fileExt = evidence.type.split("/")[1];
    const fileName = `hazard_${hazard.id}_${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage
      .from("closing-hazard")
      .upload(fileName, evidence, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage
      .from("closing-hazard")
      .getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (readOnly) return;
    setError(null);

    if (!form.deskripsi_penyelesaian || !evidence) {
      setError("Deskripsi penyelesaian dan evidence perbaikan wajib diisi.");
      return;
    }

    try {
      setSubmitting(true);
      const evidenceUrl = await uploadEvidence();

      const { error } = await supabase
        .from("hazard_report")
        .update({
          deskripsi_penyelesaian: form.deskripsi_penyelesaian,
          evidence_perbaikan: evidenceUrl,
          status: "Done",
        })
        .eq("id", hazard.id);

      if (error) throw error;

      onSuccess();
    } catch (err) {
      console.error("Error updating hazard:", err);
      setError("Gagal menyimpan data. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (showCrop) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.8)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <div
          style={{
            position: "relative",
            width: 400,
            height: 400,
            background: "#fff",
            borderRadius: 12,
            overflow: "hidden",
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
            style={{ containerStyle: { width: "100%", height: "100%" } }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 20,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              gap: 20,
            }}
          >
            <button
              onClick={handleCropCancel}
              style={{
                background: "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: 40,
                height: 40,
                fontSize: 18,
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
            <button
              onClick={handleCropSave}
              style={{
                background: "#22c55e",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: 40,
                height: 40,
                fontSize: 18,
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              ✓
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render read-only view
  if (readOnly) {
    return (
      <div className="modal-overlay">
        <div className="modal" style={{ maxWidth: "1200px", width: "90%" }}>
          <div className="modal-header">
            <h2>Detail Hazard Report</h2>
            <button onClick={onClose} className="close-button">
              ×
            </button>
          </div>

          <div style={{ display: "flex", gap: "24px", padding: "20px" }}>
            {/* Left Column - Detail Hazard */}
            <div style={{ flex: 1 }}>
              <h3
                style={{
                  marginBottom: "16px",
                  color: "#374151",
                  fontSize: "18px",
                }}
              >
                Detail Hazard
              </h3>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  color: "#000000",
                }}
              >
                <div>
                  <strong>Site:</strong> {hazard?.lokasi || "-"}
                </div>
                <div>
                  <strong>Nama Pelapor:</strong> {hazard?.pelapor_nama || "-"}
                </div>
                <div>
                  <strong>NRP Pelapor:</strong> {hazard?.pelapor_nrp || "-"}
                </div>
                <div>
                  <strong>PIC:</strong> {hazard?.pic || "-"}
                </div>
                <div>
                  <strong>Deskripsi Temuan:</strong>{" "}
                  {hazard?.deskripsi_temuan || "-"}
                </div>
                <div>
                  <strong>Quick Action:</strong> {hazard?.quick_action || "-"}
                </div>
                <div>
                  <strong>Ketidaksesuaian:</strong>{" "}
                  {hazard?.ketidaksesuaian || "-"}
                </div>
                <div>
                  <strong>Sub Ketidaksesuaian:</strong>{" "}
                  {hazard?.sub_ketidaksesuaian || "-"}
                </div>
                <div>
                  <strong>Keterangan Lokasi:</strong>{" "}
                  {hazard?.keterangan_lokasi || "-"}
                </div>
                <div>
                  <strong>Detail Lokasi:</strong> {hazard?.detail_lokasi || "-"}
                </div>
                <div>
                  <strong>Action Plan:</strong> {hazard?.action_plan || "-"}
                </div>
                <div>
                  <strong>Due Date:</strong> {hazard?.due_date || "-"}
                </div>
              </div>

              {/* Evidence Temuan */}
              <div style={{ marginTop: "20px" }}>
                <h4 style={{ marginBottom: "12px", color: "#374151" }}>
                  Evidence Temuan
                </h4>
                {hazard?.evidence ? (
                  <img
                    src={hazard.evidence}
                    alt="Evidence Temuan"
                    style={{
                      maxWidth: "200px",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      cursor: "pointer",
                    }}
                    onClick={() => setShowImagePopup(true)}
                  />
                ) : (
                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: "#f9fafb",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      color: "#000000",
                    }}
                  >
                    Tidak ada evidence temuan
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Progress Information */}
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: "20px", color: "#000000" }}>
                <strong>Deskripsi Penyelesaian:</strong>
                <div
                  className="read-only-content"
                  style={{
                    padding: "12px",
                    backgroundColor: "#f9fafb",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    minHeight: "80px",
                    whiteSpace: "pre-wrap",
                    marginTop: "8px",
                    color: "#000000",
                  }}
                >
                  {form.deskripsi_penyelesaian ||
                    "Tidak ada deskripsi penyelesaian"}
                </div>
              </div>

              <div style={{ color: "#000000" }}>
                <strong>Evidence Perbaikan:</strong>
                {evidencePreview ? (
                  <div
                    className="evidence-preview"
                    style={{ marginTop: "8px" }}
                  >
                    <img
                      src={evidencePreview}
                      alt="Evidence Preview"
                      onClick={() => setShowImagePopup(true)}
                      style={{
                        cursor: "pointer",
                        maxWidth: "200px",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                      }}
                    />
                  </div>
                ) : (
                  <div
                    className="read-only-content"
                    style={{
                      padding: "12px",
                      backgroundColor: "#f9fafb",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      color: "#000000",
                      marginTop: "8px",
                    }}
                  >
                    Tidak ada evidence perbaikan
                  </div>
                )}
              </div>
            </div>
          </div>

          <div
            className="form-actions"
            style={{ padding: "20px", borderTop: "1px solid #e5e7eb" }}
          >
            <button type="button" onClick={onClose} className="btn-cancel">
              Tutup
            </button>
          </div>

          {/* Image Popup */}
          {showImagePopup && (evidencePreview || hazard?.evidence) && (
            <div
              className="modal-overlay"
              onClick={() => setShowImagePopup(false)}
            >
              <div className="modal">
                <div className="modal-header">
                  <h2>Evidence Preview</h2>
                  <button
                    onClick={() => setShowImagePopup(false)}
                    className="close-button"
                  >
                    ×
                  </button>
                </div>
                <div className="modal-content">
                  <img
                    src={evidencePreview || hazard?.evidence}
                    alt="Evidence"
                    style={{ maxWidth: "100%", height: "auto" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render edit form
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: "1200px", width: "90%" }}>
        <div className="modal-header">
          <h2>Progress Hazard Report</h2>
          <button onClick={onClose} className="close-button">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", gap: "24px", padding: "20px" }}>
            {/* Left Column - Detail Hazard */}
            <div style={{ flex: 1 }}>
              <h3
                style={{
                  marginBottom: "16px",
                  color: "#374151",
                  fontSize: "18px",
                }}
              >
                Detail Hazard
              </h3>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  color: "#000000",
                }}
              >
                <div>
                  <strong>Site:</strong> {hazard?.lokasi || "-"}
                </div>
                <div>
                  <strong>Nama Pelapor:</strong> {hazard?.pelapor_nama || "-"}
                </div>
                <div>
                  <strong>NRP Pelapor:</strong> {hazard?.pelapor_nrp || "-"}
                </div>
                <div>
                  <strong>PIC:</strong> {hazard?.pic || "-"}
                </div>
                <div>
                  <strong>Deskripsi Temuan:</strong>{" "}
                  {hazard?.deskripsi_temuan || "-"}
                </div>
                <div>
                  <strong>Quick Action:</strong> {hazard?.quick_action || "-"}
                </div>
                <div>
                  <strong>Ketidaksesuaian:</strong>{" "}
                  {hazard?.ketidaksesuaian || "-"}
                </div>
                <div>
                  <strong>Sub Ketidaksesuaian:</strong>{" "}
                  {hazard?.sub_ketidaksesuaian || "-"}
                </div>
                <div>
                  <strong>Keterangan Lokasi:</strong>{" "}
                  {hazard?.keterangan_lokasi || "-"}
                </div>
                <div>
                  <strong>Detail Lokasi:</strong> {hazard?.detail_lokasi || "-"}
                </div>
                <div>
                  <strong>Action Plan:</strong> {hazard?.action_plan || "-"}
                </div>
                <div>
                  <strong>Due Date:</strong> {hazard?.due_date || "-"}
                </div>
              </div>

              {/* Evidence Temuan */}
              <div style={{ marginTop: "20px" }}>
                <h4 style={{ marginBottom: "12px", color: "#374151" }}>
                  Evidence Temuan
                </h4>
                {hazard?.evidence ? (
                  <img
                    src={hazard.evidence}
                    alt="Evidence Temuan"
                    style={{
                      maxWidth: "200px",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      cursor: "pointer",
                    }}
                    onClick={() => setShowImagePopup(true)}
                  />
                ) : (
                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: "#f9fafb",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      color: "#000000",
                    }}
                  >
                    Tidak ada evidence temuan
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Progress Information (Editable) */}
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: "20px" }}>
                <label
                  htmlFor="deskripsi_penyelesaian"
                  style={{ color: "#000000", fontWeight: "600" }}
                >
                  Deskripsi Penyelesaian *
                </label>
                <textarea
                  id="deskripsi_penyelesaian"
                  name="deskripsi_penyelesaian"
                  value={form.deskripsi_penyelesaian}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Jelaskan langkah-langkah penyelesaian yang telah dilakukan..."
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    marginTop: "8px",
                    fontSize: "14px",
                    resize: "vertical",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="evidence"
                  style={{ color: "#000000", fontWeight: "600" }}
                >
                  Evidence Perbaikan *
                </label>
                <input
                  type="file"
                  id="evidence"
                  accept="image/*"
                  onChange={handleEvidence}
                  ref={fileInputRef}
                  style={{ display: "none" }}
                />
                {evidencePreview ? (
                  <div
                    className="evidence-preview"
                    style={{ marginTop: "8px" }}
                  >
                    <img
                      src={evidencePreview}
                      alt="Evidence Preview"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        cursor: "pointer",
                        maxWidth: "200px",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        transition: "opacity 0.2s",
                      }}
                      onMouseOver={(e) => {
                        e.target.style.opacity = "0.8";
                      }}
                      onMouseOut={(e) => {
                        e.target.style.opacity = "1";
                      }}
                      title="Klik untuk mengganti foto"
                    />
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      width: "200px",
                      height: "150px",
                      border: "2px dashed #e5e7eb",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      marginTop: "8px",
                      backgroundColor: "#f9fafb",
                      transition: "border-color 0.2s, background-color 0.2s",
                    }}
                    onMouseOver={(e) => {
                      e.target.style.borderColor = "#3b82f6";
                      e.target.style.backgroundColor = "#f0f9ff";
                    }}
                    onMouseOut={(e) => {
                      e.target.style.borderColor = "#e5e7eb";
                      e.target.style.backgroundColor = "#f9fafb";
                    }}
                    title="Klik untuk upload foto"
                  >
                    <div style={{ textAlign: "center", color: "#6b7280" }}>
                      <div style={{ fontSize: "24px", marginBottom: "8px" }}>
                        📷
                      </div>
                      <div style={{ fontSize: "14px" }}>
                        Klik untuk upload foto
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div
              className="error-message"
              style={{ padding: "0 20px", color: "#ef4444" }}
            >
              {error}
            </div>
          )}

          <div
            className="form-actions"
            style={{ padding: "20px", borderTop: "1px solid #e5e7eb" }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn-cancel"
              disabled={submitting}
            >
              Batal
            </button>
            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? "Menyimpan..." : "Simpan Progress"}
            </button>
          </div>
        </form>

        {/* Image Popup */}
        {showImagePopup && (evidencePreview || hazard?.evidence) && (
          <div
            className="modal-overlay"
            onClick={() => setShowImagePopup(false)}
          >
            <div className="modal">
              <div className="modal-header">
                <h2>Evidence Preview</h2>
                <button
                  onClick={() => setShowImagePopup(false)}
                  className="close-button"
                >
                  ×
                </button>
              </div>
              <div className="modal-content">
                <img
                  src={evidencePreview || hazard?.evidence}
                  alt="Evidence"
                  style={{ maxWidth: "100%", height: "auto" }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TasklistFormProgress;
