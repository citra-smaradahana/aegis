import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import Cropper from "react-easy-crop";
import getCroppedImg from "../Dropzone/cropImageUtil";

function TasklistFormProgress({ hazard, onClose, onSuccess, readOnly }) {
  if (!hazard) {
    return (
      <div style={{ color: "#ef4444", padding: 32 }}>
        Data hazard tidak ditemukan.
      </div>
    );
  }

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

    // Untuk status Reject at Done, evidence tidak wajib jika sudah ada
    const isRejectAtDone = hazard.status === "Reject at Done";
    const hasExistingEvidence = hazard.evidence_perbaikan;

    if (!form.deskripsi_penyelesaian) {
      setError(
        isRejectAtDone
          ? "Deskripsi penyelesaian revisi wajib diisi."
          : "Deskripsi penyelesaian wajib diisi."
      );
      return;
    }

    if (!evidence && !hasExistingEvidence) {
      setError(
        isRejectAtDone
          ? "Evidence perbaikan revisi wajib diisi."
          : "Evidence perbaikan wajib diisi."
      );
      return;
    }

    try {
      setSubmitting(true);

      // Gunakan evidence yang sudah ada jika tidak ada evidence baru
      let evidenceUrl = hazard.evidence_perbaikan;
      if (evidence) {
        evidenceUrl = await uploadEvidence();
      }

      // Untuk status Reject at Done, update deskripsi dan evidence (jika ada yang baru)
      const updateData = {
        deskripsi_penyelesaian: form.deskripsi_penyelesaian,
        evidence_perbaikan: evidenceUrl,
        status: "Done",
      };

      // Hapus alasan penolakan jika ada
      if (isRejectAtDone) {
        updateData.alasan_penolakan_done = null;
      }

      const { error } = await supabase
        .from("hazard_report")
        .update(updateData)
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
                background: "#10b981",
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

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "transparent",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        padding: "0 0 0 120px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: "transparent",
          borderRadius: 18,
          boxShadow: "none",
          padding: 16,
          maxWidth: 1400,
          width: "100%",
          margin: "0",
          height: "100vh",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 24,
            background: "transparent",
            border: "none",
            borderRadius: 16,
            padding: 24,
            color: "#e5e7eb",
            position: "relative",
            height: "100vh",
            alignItems: "flex-start",
          }}
        >
          {/* Tombol close kanan atas */}
          {onClose && (
            <button
              onClick={onClose}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: 24,
                color: "#9ca3af",
                cursor: "pointer",
                zIndex: 10,
                padding: 0,
                width: "auto",
                height: "auto",
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
              borderRight: "1px solid #334155",
              paddingRight: 24,
              color: "#e5e7eb",
              height: "100vh",
              overflow: "hidden",
            }}
          >
            <h3 style={{ marginBottom: 24, color: "#60a5fa", fontWeight: 600 }}>
              Detail Hazard Report
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "160px 1fr",
                rowGap: 12,
                columnGap: 12,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  textAlign: "right",
                  color: "#9ca3af",
                }}
              >
                Site:
              </div>
              <div>{hazard.lokasi || "-"}</div>
              <div
                style={{
                  fontWeight: 700,
                  textAlign: "right",
                  color: "#9ca3af",
                }}
              >
                Nama Pelapor:
              </div>
              <div>{hazard.pelapor_nama || "-"}</div>
              <div
                style={{
                  fontWeight: 700,
                  textAlign: "right",
                  color: "#9ca3af",
                }}
              >
                NRP Pelapor:
              </div>
              <div>{hazard.pelapor_nrp || "-"}</div>
              <div
                style={{
                  fontWeight: 700,
                  textAlign: "right",
                  color: "#9ca3af",
                }}
              >
                PIC:
              </div>
              <div>{hazard.pic || "-"}</div>
              <div
                style={{
                  fontWeight: 700,
                  textAlign: "right",
                  color: "#9ca3af",
                }}
              >
                Deskripsi Temuan:
              </div>
              <div>{hazard.deskripsi_temuan || "-"}</div>
              <div
                style={{
                  fontWeight: 700,
                  textAlign: "right",
                  color: "#9ca3af",
                }}
              >
                Quick Action:
              </div>
              <div>{hazard.quick_action || "-"}</div>
              <div
                style={{
                  fontWeight: 700,
                  textAlign: "right",
                  color: "#9ca3af",
                }}
              >
                Ketidaksesuaian:
              </div>
              <div>{hazard.ketidaksesuaian || "-"}</div>
              <div
                style={{
                  fontWeight: 700,
                  textAlign: "right",
                  color: "#9ca3af",
                }}
              >
                Sub Ketidaksesuaian:
              </div>
              <div>{hazard.sub_ketidaksesuaian || "-"}</div>
              <div
                style={{
                  fontWeight: 700,
                  textAlign: "right",
                  color: "#9ca3af",
                }}
              >
                Keterangan Lokasi:
              </div>
              <div>{hazard.keterangan_lokasi || "-"}</div>
              <div
                style={{
                  fontWeight: 700,
                  textAlign: "right",
                  color: "#9ca3af",
                }}
              >
                Detail Lokasi:
              </div>
              <div>{hazard.detail_lokasi || "-"}</div>
              <div
                style={{
                  fontWeight: 700,
                  textAlign: "right",
                  color: "#9ca3af",
                }}
              >
                Action Plan:
              </div>
              <div>{hazard.action_plan || "-"}</div>
              <div
                style={{
                  fontWeight: 700,
                  textAlign: "right",
                  color: "#9ca3af",
                }}
              >
                Due Date:
              </div>
              <div>{hazard.due_date || "-"}</div>
            </div>

            {/* Evidence Temuan */}
            {hazard.evidence && (
              <div style={{ marginTop: 24 }}>
                <h4
                  style={{
                    marginBottom: 12,
                    color: "#60a5fa",
                    fontWeight: 600,
                  }}
                >
                  Evidence Temuan
                </h4>
                <img
                  src={hazard.evidence}
                  alt="Evidence Temuan"
                  style={{
                    maxWidth: "200px",
                    borderRadius: 8,
                    border: "1px solid #374151",
                    cursor: "pointer",
                  }}
                  onClick={() => setShowImagePopup(true)}
                />
              </div>
            )}
          </div>

          {/* Kanan: Form Progress */}
          <div
            style={{
              flex: 1,
              paddingLeft: 24,
              color: "#e5e7eb",
              height: "100vh",
              overflow: "hidden",
            }}
          >
            <h3 style={{ marginBottom: 24, color: "#60a5fa", fontWeight: 600 }}>
              Progress Hazard Report
            </h3>

            {/* Informasi Progress Sebelumnya (untuk status Reject at Done) */}
            {hazard.status === "Reject at Done" && (
              <div style={{ marginBottom: 24 }}>
                <h4
                  style={{
                    marginBottom: 16,
                    color: "#ef4444",
                    fontWeight: 600,
                  }}
                >
                  Progress Sebelumnya (Ditolak)
                </h4>

                {/* Deskripsi Penyelesaian Sebelumnya */}
                {hazard.deskripsi_penyelesaian && (
                  <div style={{ marginBottom: 16 }}>
                    <div
                      style={{
                        color: "#60a5fa",
                        fontSize: 16,
                        fontWeight: 600,
                        marginBottom: 8,
                      }}
                    >
                      Deskripsi Penyelesaian:
                    </div>
                    <div
                      style={{
                        background: "#1f2937",
                        padding: 12,
                        borderRadius: 6,
                        color: "#e5e7eb",
                        fontSize: 14,
                        border: "1px solid #ef4444",
                      }}
                    >
                      {hazard.deskripsi_penyelesaian}
                    </div>
                  </div>
                )}

                {/* Evidence Perbaikan Sebelumnya */}
                {hazard.evidence_perbaikan && (
                  <div style={{ marginBottom: 16 }}>
                    <div
                      style={{
                        color: "#60a5fa",
                        fontSize: 16,
                        fontWeight: 600,
                        marginBottom: 8,
                      }}
                    >
                      Evidence Perbaikan:
                    </div>
                    <img
                      src={hazard.evidence_perbaikan}
                      alt="Evidence Perbaikan Sebelumnya"
                      style={{
                        maxWidth: "200px",
                        borderRadius: 8,
                        border: "2px solid #ef4444",
                        cursor: "pointer",
                      }}
                      onClick={() => setShowImagePopup(true)}
                    />
                  </div>
                )}

                {/* Alasan Penolakan */}
                {hazard.alasan_penolakan_done && (
                  <div style={{ marginBottom: 16 }}>
                    <div
                      style={{
                        color: "#ef4444",
                        fontSize: 16,
                        fontWeight: 600,
                        marginBottom: 8,
                      }}
                    >
                      Alasan Penolakan:
                    </div>
                    <div
                      style={{
                        background: "#1f2937",
                        padding: 12,
                        borderRadius: 6,
                        color: "#ef4444",
                        fontSize: 14,
                        border: "2px solid #ef4444",
                      }}
                    >
                      {hazard.alasan_penolakan_done}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Deskripsi Penyelesaian dan Evidence Perbaikan (untuk status Reject at Done) */}
            {hazard.status === "Reject at Done" && (
              <div style={{ marginBottom: 24 }}>
                {/* Deskripsi Penyelesaian */}
                {hazard.deskripsi_penyelesaian && (
                  <div style={{ marginBottom: 16 }}>
                    <div
                      style={{
                        color: "#60a5fa",
                        fontSize: 16,
                        fontWeight: 600,
                        marginBottom: 8,
                      }}
                    >
                      Deskripsi Penyelesaian:
                    </div>
                    <div
                      style={{
                        background: "#1f2937",
                        padding: 12,
                        borderRadius: 6,
                        color: "#e5e7eb",
                        fontSize: 14,
                      }}
                    >
                      {hazard.deskripsi_penyelesaian}
                    </div>
                  </div>
                )}

                {/* Evidence Perbaikan */}
                {hazard.evidence_perbaikan && (
                  <div style={{ marginBottom: 16 }}>
                    <div
                      style={{
                        color: "#60a5fa",
                        fontSize: 16,
                        fontWeight: 600,
                        marginBottom: 8,
                      }}
                    >
                      Evidence Perbaikan:
                    </div>
                    <img
                      src={hazard.evidence_perbaikan}
                      alt="Evidence Perbaikan"
                      style={{
                        maxWidth: "200px",
                        borderRadius: 8,
                        border: "1px solid #374151",
                        cursor: "pointer",
                      }}
                      onClick={() => setShowImagePopup(true)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Form Revisi untuk status Reject at Done */}
            {hazard.status === "Reject at Done" && (
              <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
                <h4
                  style={{
                    marginBottom: 16,
                    color: "#60a5fa",
                    fontWeight: 600,
                  }}
                >
                  Form Revisi Progress
                </h4>

                <div>
                  <label
                    style={{
                      color: "#e5e7eb",
                      marginBottom: 8,
                      display: "block",
                      fontWeight: 600,
                    }}
                  >
                    Deskripsi Penyelesaian Revisi*
                  </label>
                  <textarea
                    name="deskripsi_penyelesaian"
                    value={form.deskripsi_penyelesaian}
                    onChange={handleChange}
                    disabled={readOnly}
                    placeholder="Jelaskan langkah-langkah penyelesaian revisi yang telah dilakukan..."
                    style={{
                      width: "100%",
                      minHeight: 100,
                      padding: 12,
                      borderRadius: 8,
                      border: "1px solid #374151",
                      background: readOnly ? "#1f2937" : "#1f2937",
                      color: readOnly ? "#9ca3af" : "#e5e7eb",
                      resize: "vertical",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                <div style={{ marginTop: 16 }}>
                  <label
                    style={{
                      color: "#e5e7eb",
                      marginBottom: 8,
                      display: "block",
                      fontWeight: 600,
                    }}
                  >
                    Evidence Perbaikan Revisi*
                  </label>
                  {evidencePreview ? (
                    <div style={{ marginBottom: 12 }}>
                      <img
                        src={evidencePreview}
                        alt="Evidence Preview"
                        style={{
                          maxWidth: "200px",
                          borderRadius: 8,
                          border: "1px solid #374151",
                          cursor: "pointer",
                        }}
                        onClick={() => setShowImagePopup(true)}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        border: "2px dashed #374151",
                        borderRadius: 8,
                        padding: 24,
                        textAlign: "center",
                        cursor: readOnly ? "default" : "pointer",
                        background: readOnly ? "#1f2937" : "#1f2937",
                        color: readOnly ? "#9ca3af" : "#9ca3af",
                      }}
                      onClick={() => !readOnly && fileInputRef.current?.click()}
                    >
                      <div style={{ fontSize: 24, marginBottom: 8 }}>📷</div>
                      <div>Klik untuk upload foto revisi</div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleEvidence}
                    style={{ display: "none" }}
                    disabled={readOnly}
                  />
                </div>

                {error && (
                  <div
                    style={{ color: "#ef4444", fontSize: 14, marginTop: 12 }}
                  >
                    {error}
                  </div>
                )}

                {!readOnly && (
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      background: submitting ? "#6b7280" : "#60a5fa",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "12px 24px",
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: submitting ? "not-allowed" : "pointer",
                      marginTop: 16,
                    }}
                  >
                    {submitting ? "Menyimpan..." : "Submit Revisi Progress"}
                  </button>
                )}
              </form>
            )}

            {readOnly && (
              <div
                style={{
                  color: "#9ca3af",
                  marginBottom: 16,
                  fontStyle: "italic",
                }}
              >
                Anda tidak memiliki akses untuk mengisi progress pada status
                ini.
              </div>
            )}

            {/* Form Progress untuk status Progress (bukan Reject at Done) */}
            {hazard.status !== "Reject at Done" && (
              <form
                onSubmit={handleSubmit}
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <div>
                  <label
                    style={{
                      color: "#e5e7eb",
                      marginBottom: 8,
                      display: "block",
                      fontWeight: 600,
                    }}
                  >
                    Deskripsi Penyelesaian*
                  </label>
                  <textarea
                    name="deskripsi_penyelesaian"
                    value={form.deskripsi_penyelesaian}
                    onChange={handleChange}
                    disabled={readOnly}
                    placeholder="Jelaskan langkah-langkah penyelesaian yang telah dilakukan..."
                    style={{
                      width: "100%",
                      minHeight: 120,
                      padding: 12,
                      borderRadius: 8,
                      border: "1px solid #374151",
                      background: readOnly ? "#1f2937" : "#1f2937",
                      color: readOnly ? "#9ca3af" : "#e5e7eb",
                      resize: "vertical",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      color: "#e5e7eb",
                      marginBottom: 8,
                      display: "block",
                      fontWeight: 600,
                    }}
                  >
                    Evidence Perbaikan*
                  </label>
                  {evidencePreview || hazard.evidence_perbaikan ? (
                    <div style={{ marginBottom: 12 }}>
                      <img
                        src={evidencePreview}
                        alt="Evidence Preview"
                        style={{
                          maxWidth: "200px",
                          borderRadius: 8,
                          border: "1px solid #374151",
                          cursor: "pointer",
                        }}
                        onClick={() => setShowImagePopup(true)}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        border: "2px dashed #374151",
                        borderRadius: 8,
                        padding: 24,
                        textAlign: "center",
                        cursor: readOnly ? "default" : "pointer",
                        background: readOnly ? "#1f2937" : "#1f2937",
                        color: readOnly ? "#9ca3af" : "#9ca3af",
                      }}
                      onClick={() => !readOnly && fileInputRef.current?.click()}
                    >
                      <div style={{ fontSize: 24, marginBottom: 8 }}>📷</div>
                      <div>Klik untuk upload foto</div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleEvidence}
                    style={{ display: "none" }}
                    disabled={readOnly}
                  />
                </div>

                {error && (
                  <div style={{ color: "#ef4444", fontSize: 14 }}>{error}</div>
                )}

                {!readOnly && (
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      background: submitting ? "#6b7280" : "#60a5fa",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "12px 24px",
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: submitting ? "not-allowed" : "pointer",
                      marginTop: 16,
                    }}
                  >
                    {submitting ? "Menyimpan..." : "Submit Progress"}
                  </button>
                )}
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Image Popup */}
      {showImagePopup && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.9)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setShowImagePopup(false)}
        >
          <img
            src={
              evidencePreview || hazard.evidence || hazard.evidence_perbaikan
            }
            alt="Full Size"
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              borderRadius: 8,
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

export default TasklistFormProgress;
