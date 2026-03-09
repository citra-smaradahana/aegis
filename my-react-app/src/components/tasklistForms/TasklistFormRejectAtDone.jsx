import React, { useState } from "react";
import { supabase } from "../../supabaseClient";
import Cropper from "react-easy-crop";
import getCroppedImg from "../Dropzone/cropImageUtil";
import { FiX, FiCheck } from "react-icons/fi";

function TasklistFormRejectAtDone({ hazard, onSuccess, readOnly, onClose }) {
  const [desc, setDesc] = useState("");
  const [evidence, setEvidence] = useState(null);
  const [evidencePreview, setEvidencePreview] = useState(null);
  const [showCrop, setShowCrop] = useState(false);
  const [rawImage, setRawImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!hazard) {
    return (
      <div style={{ color: "#ef4444", padding: 32 }}>
        Data hazard tidak ditemukan.
      </div>
    );
  }

  // Cropper logic
  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleEvidence = (e) => {
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
    setError("");
    if (!desc || !evidence) {
      setError(
        "Deskripsi perbaikan dan evidence perbaikan revisi wajib diisi."
      );
      return;
    }
    setLoading(true);
    let evidenceUrl = null;
    try {
      evidenceUrl = await uploadEvidence();
    } catch (err) {
      setError("Gagal upload evidence: " + err.message);
      setLoading(false);
      return;
    }
    const { error } = await supabase
      .from("hazard_report")
      .update({
        deskripsi_penyelesaian: desc,
        evidence_perbaikan: evidenceUrl,
        status: "Done",
        alasan_penolakan_done: null, // Hapus alasan penolakan
      })
      .eq("id", hazard.id);
    setLoading(false);
    if (error) {
      setError("Gagal update hazard report: " + error.message);
    } else {
      if (onSuccess) onSuccess();
    }
  };

  // Crop modal
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
            width: 320,
            height: 320,
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
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 24,
              display: "flex",
              justifyContent: "center",
              gap: 32,
              pointerEvents: "none",
            }}
          >
            <button
              onClick={handleCropCancel}
              style={{
                background: "#ef4444",
                border: "none",
                width: 40,
                height: 40,
                borderRadius: "50%",
                fontSize: 22,
                color: "#fff",
                cursor: "pointer",
                boxShadow: "0 2px 8px #0002",
                pointerEvents: "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Batal"
            >
              <FiX size={22} />
            </button>
            <button
              onClick={handleCropSave}
              style={{
                background: "#10b981",
                border: "none",
                width: 40,
                height: 40,
                borderRadius: "50%",
                fontSize: 22,
                color: "#fff",
                cursor: "pointer",
                boxShadow: "0 2px 8px #0002",
                pointerEvents: "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
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

            {/* Evidence Temuan dan Evidence Perbaikan */}
            <div style={{ marginTop: 24 }}>
              <h4
                style={{
                  marginBottom: 12,
                  color: "#60a5fa",
                  fontWeight: 600,
                }}
              >
                Evidence
              </h4>
              <div
                style={{ display: "flex", gap: 16, alignItems: "flex-start" }}
              >
                {/* Evidence Temuan */}
                {hazard.evidence && (
                  <div>
                    <div
                      style={{
                        color: "#9ca3af",
                        fontSize: 14,
                        fontWeight: 600,
                        marginBottom: 8,
                      }}
                    >
                      Evidence Temuan:
                    </div>
                    <img
                      src={hazard.evidence}
                      alt="Evidence Temuan"
                      style={{
                        maxWidth: "180px",
                        borderRadius: 8,
                        border: "1px solid #374151",
                        cursor: "pointer",
                      }}
                    />
                  </div>
                )}

                {/* Evidence Perbaikan */}
                {hazard.evidence_perbaikan && (
                  <div>
                    <div
                      style={{
                        color: "#ef4444",
                        fontSize: 14,
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
                        maxWidth: "180px",
                        borderRadius: 8,
                        border: "1px solid #374151",
                        cursor: "pointer",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Kanan: Form Reject at Done */}
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
              Reject at Done Form
            </h3>

            {/* Progress Sebelumnya */}
            {(hazard.deskripsi_penyelesaian ||
              hazard.alasan_penolakan_done) && (
              <div style={{ marginBottom: 24 }}>
                <h4
                  style={{
                    marginBottom: 16,
                    color: "#60a5fa",
                    fontWeight: 600,
                  }}
                >
                  Progress Sebelumnya
                </h4>

                {/* Deskripsi Penyelesaian */}
                {hazard.deskripsi_penyelesaian && (
                  <div style={{ marginBottom: 16 }}>
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
                        Deskripsi Penyelesaian:
                      </div>
                      <div
                        style={{
                          color: "#ef4444",
                        }}
                      >
                        {hazard.deskripsi_penyelesaian}
                      </div>
                    </div>
                  </div>
                )}

                {/* Alasan Penolakan */}
                {hazard.alasan_penolakan_done && (
                  <div style={{ marginBottom: 16 }}>
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
                        Alasan Penolakan:
                      </div>
                      <div
                        style={{
                          color: "#ef4444",
                        }}
                      >
                        {hazard.alasan_penolakan_done}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Form Revisi */}
            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <h4
                style={{
                  marginBottom: 16,
                  color: "#60a5fa",
                  fontWeight: 600,
                }}
              >
                Form Revisi Progress
              </h4>

              {readOnly && (
                <div
                  style={{
                    color: "#9ca3af",
                    marginBottom: 16,
                    fontStyle: "italic",
                  }}
                >
                  Anda tidak memiliki akses untuk revisi pada status ini.
                </div>
              )}

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
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
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

              <div>
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
                        maxWidth: "120px",
                        borderRadius: 8,
                        border: "1px solid #374151",
                        cursor: "pointer",
                      }}
                    />
                  </div>
                ) : null}
                <div style={{ display: "flex", gap: 8, marginTop: evidencePreview ? 8 : 0 }}>
                  <button
                    type="button"
                    onClick={() => document.getElementById("evidence-camera-input").click()}
                    style={{
                      flex: 1,
                      padding: "12px",
                      background: "#1f2937",
                      border: "2px dashed #374151",
                      borderRadius: 8,
                      color: "#9ca3af",
                      cursor: readOnly ? "default" : "pointer",
                      fontSize: 14,
                    }}
                    disabled={readOnly}
                  >
                    📷 Kamera
                  </button>
                  <button
                    type="button"
                    onClick={() => document.getElementById("evidence-gallery-input").click()}
                    style={{
                      flex: 1,
                      padding: "12px",
                      background: "#1f2937",
                      border: "2px dashed #374151",
                      borderRadius: 8,
                      color: "#9ca3af",
                      cursor: readOnly ? "default" : "pointer",
                      fontSize: 14,
                    }}
                    disabled={readOnly}
                  >
                    🖼️ Galeri
                  </button>
                </div>
                <input
                  id="evidence-camera-input"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleEvidence}
                  style={{ display: "none" }}
                  disabled={readOnly}
                />
                <input
                  id="evidence-gallery-input"
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
                  disabled={loading}
                  style={{
                    background: loading ? "#6b7280" : "#60a5fa",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "12px 24px",
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    marginTop: 16,
                  }}
                >
                  {loading ? "Menyimpan..." : "Submit Revisi Progress"}
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TasklistFormRejectAtDone;
