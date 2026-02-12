import React, { useState } from "react";

function TasklistFormClosed({ hazard, onClose }) {
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [popupImage, setPopupImage] = useState(null);

  if (!hazard) {
    return (
      <div style={{ color: "#ef4444", padding: 32 }}>
        Data hazard tidak ditemukan.
      </div>
    );
  }

  const handleImageClick = (imageUrl) => {
    setPopupImage(imageUrl);
    setShowImagePopup(true);
  };

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
              <div>{hazard.site || "-"}</div>
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
                Evaluator:
              </div>
              <div>{hazard.evaluator_nama || "-"}</div>
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
                  onClick={() => handleImageClick(hazard.evidence)}
                />
              </div>
            )}
          </div>

          {/* Kanan: Detail Penyelesaian */}
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
              Detail Penyelesaian
            </h3>

            {/* Deskripsi Penyelesaian */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "160px 1fr",
                rowGap: 12,
                columnGap: 12,
                alignItems: "center",
                marginBottom: 12,
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
              <div>{hazard.deskripsi_penyelesaian || "-"}</div>
            </div>

            {/* Evidence Perbaikan */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "160px 1fr",
                rowGap: 12,
                columnGap: 12,
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  textAlign: "right",
                  color: "#9ca3af",
                }}
              >
                Evidence Perbaikan:
              </div>
              <div>
                {hazard.evidence_perbaikan ? (
                  <img
                    src={hazard.evidence_perbaikan}
                    alt="Evidence Perbaikan"
                    style={{
                      maxWidth: "200px",
                      borderRadius: 8,
                      border: "1px solid #374151",
                      cursor: "pointer",
                    }}
                    onClick={() => handleImageClick(hazard.evidence_perbaikan)}
                  />
                ) : (
                  "-"
                )}
              </div>
            </div>

            {/* Status Closed Info */}
            <div style={{ marginTop: 32, textAlign: "center" }}>
              <div
                style={{
                  background: "#10b981",
                  color: "#fff",
                  padding: "12px 24px",
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 16,
                }}
              >
                ✅ Hazard Report Telah Selesai
              </div>
              <div
                style={{
                  color: "#9ca3af",
                  marginTop: 8,
                  fontSize: 14,
                }}
              >
                Status: Closed
              </div>
            </div>
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
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setShowImagePopup(false)}
        >
          <img
            src={popupImage}
            alt="Preview"
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              borderRadius: 8,
            }}
          />
        </div>
      )}
    </div>
  );
}

export default TasklistFormClosed;
