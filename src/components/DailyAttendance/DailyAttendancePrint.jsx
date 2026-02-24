import React from "react";
import "./DailyAttendancePrint.css";
import aegisLogo from "../../assets/aegis.png";
import kmbLogo from "../../assets/kmb.png";

/**
 * Komponen Template Cetak PDF
 * Halaman 1: Daftar Hadir Pertemuan (Tabel Fit To Work)
 * Halaman 2: Formulir Komunikasi & Konsultasi K3 (Notulen)
 */
const toYaTidak = (val) => {
  if (val === true || val === "true" || val === 1) return "Ya";
  if (val === false || val === "false" || val === 0) return "Tidak";
  return "Ya";
};

const DailyAttendancePrint = React.forwardRef(
  ({ data, attendanceData }, ref) => {
    // Data dummy default jika kosong
    const {
      date = "",
      timeStart = "",
      timeEnd = "",
      duration = "",
      place = "",
      meetingType = "Briefing", // Rapat, Pelatihan, Briefing, Sosialisasi, Lain-lain
      topic = "",
      agenda = "",
      site = "",
      department = "",
      area = "",
      topics = [], // Array of { content, presenter, attachment, notes }
      issues = [], // Array of { content, submittedBy }
      actions = [], // Array of { content, pic, due, status }
      images = [], // Array of image URLs untuk lampiran
      creatorName = "",
      creatorJabatan = "",
      approverName = "",
      approverJabatan = "",
      status = "Pending",
    } = data || {};

    // Render Checkbox Helper
    const Checkbox = ({ checked, label }) => (
      <div className="checkbox-item">
        <div className={`checkbox-box ${checked ? "checked" : ""}`}></div>
        <span>{label}</span>
      </div>
    );

    return (
      <div className="daily-attendance-print-container" ref={ref}>
        {/* ==========================================================================
          HALAMAN 1: DAFTAR HADIR PERTEMUAN
         ========================================================================== */}
        <div className="print-page">
          {/* ISO HEADER */}
          <div className="iso-header">
            <div className="iso-logo">
              <img src={kmbLogo} alt="Logo KMB" />
            </div>
            <div className="iso-info">
              <div className="iso-title">
                <div className="iso-form-label">FORMULIR</div>
                <div className="iso-form-name">DAFTAR HADIR PERTEMUAN</div>
                <div className="iso-form-name-en">MEETING ATTENDANCE LIST</div>
              </div>
              <div className="iso-meta">
                <div className="iso-meta-col">
                  <span className="meta-label">No. Dokumen / Document No:</span>
                  <br />
                  <span className="meta-value">F-KMB-SHE-BSIB-008-003</span>
                </div>
                <div className="iso-meta-col">
                  <span className="meta-label">Revisi / Revision:</span>
                  <br />
                  <span className="meta-value">01</span>
                </div>
                <div className="iso-meta-col">
                  <span className="meta-label">
                    Tanggal Efektif / Effective Date:
                  </span>
                  <br />
                  <span className="meta-value">16/09/2025</span>
                </div>
              </div>
            </div>
          </div>

          {/* INFO PERTEMUAN */}
          <div className="attendance-info-grid">
            <div className="info-row">
              <div className="info-label">
                Area / Site
                <br />
                <span className="th-blue">Area / Site</span>
              </div>
              <div className="info-value">: {area || site}</div>
              <div className="info-label">
                Hari / Tanggal
                <br />
                <span className="th-blue">Day / Date</span>
              </div>
              <div className="info-value">: {date}</div>
            </div>
            <div className="info-row">
              <div className="info-label">
                Tempat
                <br />
                <span className="th-blue">Place</span>
              </div>
              <div className="info-value">: {place}</div>
              <div className="info-label">
                Pukul
                <br />
                <span className="th-blue">Time</span>
              </div>
              <div className="info-value">
                : {timeStart} - {timeEnd}
              </div>
            </div>
            <div className="info-row">
              <div className="info-label">
                Jenis Pertemuan
                <br />
                <span className="th-blue">Meeting Type</span>
              </div>
              <div className="info-value">
                <div className="checkbox-group">
                  <Checkbox checked={meetingType === "Rapat"} label="Rapat" />
                  <Checkbox
                    checked={meetingType === "Pelatihan"}
                    label="Pelatihan"
                  />
                  <Checkbox
                    checked={meetingType === "Briefing"}
                    label="Briefing"
                  />
                  <Checkbox
                    checked={meetingType === "Sosialisasi"}
                    label="Sosialisasi"
                  />
                  <Checkbox
                    checked={
                      ![
                        "Rapat",
                        "Pelatihan",
                        "Briefing",
                        "Sosialisasi",
                      ].includes(meetingType)
                    }
                    label="Lain-lain"
                  />
                </div>
              </div>
            </div>
            <div className="info-row info-row-agenda">
              <div className="info-label">
                Agenda / Tema
                <br />
                <span className="th-blue">Agenda / Theme</span>
              </div>
              <div className="info-value">: {agenda || topic}</div>
            </div>
          </div>

          {/* TABEL ABSENSI */}
          <table className="attendance-table">
            <thead>
              <tr>
                <th rowSpan="2" className="col-no">
                  No.
                </th>
                <th rowSpan="2" className="col-nama">
                  Nama<span className="th-blue">(Name)</span>
                </th>
                <th rowSpan="2" className="col-jabatan">
                  Jabatan<span className="th-blue">(Position)</span>
                </th>
                <th rowSpan="2" className="col-nik">
                  NIK<span className="th-blue">(Employee ID)</span>
                </th>
                <th rowSpan="2" className="col-hari">
                  Hari Kerja Setelah Off
                  <span className="th-blue">(Day Work After Off Day)</span>
                </th>
                <th colSpan="2" className="col-tidur">
                  Kecukupan Istirahat
                  <span className="th-blue">(Adequate Rest)</span>
                </th>
                <th colSpan="2" className="col-obat">
                  Konsentrasi Kerja
                  <span className="th-blue">(Work Concentration)</span>
                </th>
                <th className="col-siap">
                  Kesiapan Kerja<span className="th-blue">(Job Readiness)</span>
                </th>
                <th rowSpan="2" className="col-ttd">
                  Tanda Tangan<span className="th-blue">(Signature)</span>
                </th>
              </tr>
              <tr>
                {/* Sub-header Kecukupan Istirahat */}
                <th>
                  Total Jam Tidur 24 Jam
                  <br />
                  <span className="th-blue">(Total Sleep 24h)</span>
                </th>
                <th>
                  Total Jam Tidur 48 Jam
                  <br />
                  <span className="th-blue">(Total Sleep 48h)</span>
                </th>

                {/* Sub-header - Sama dengan pertanyaan Fit To Work */}
                <th>
                  Tidak mengkonsumsi obat yang mempengaruhi kerja?
                  <span className="th-blue">(No medication affecting work?)</span>
                </th>
                <th>
                  Tidak ada masalah pribadi/keluarga?
                  <span className="th-blue">(No personal/family issues?)</span>
                </th>
                <th>
                  Siap bekerja?
                  <span className="th-blue">(Ready to work?)</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {attendanceData && attendanceData.length > 0 ? (
                <>
                  {attendanceData.map((row, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td style={{ textAlign: "left" }}>{row.nama}</td>
                      <td>{row.jabatan}</td>
                      <td>{row.nrp}</td>
                      <td>{row.hari_masuk}</td>

                      {/* Total Jam Tidur 24 Jam */}
                      <td>
                        {row.sleep_today !== undefined &&
                        row.sleep_today !== null
                          ? `${parseFloat(row.sleep_today).toFixed(1)}`
                          : "-"}
                      </td>

                      {/* Total Jam Tidur 48 Jam */}
                      <td>
                        {row.sleep_48h !== undefined && row.sleep_48h !== null
                          ? `${parseFloat(row.sleep_48h).toFixed(1)}`
                          : "-"}
                      </td>

                      {/* True = Ya, False/null/undefined = Tidak. Handle string "true"/"false" dari DB */}
                      <td>{toYaTidak(row.tidak_mengkonsumsi_obat)}</td>
                      <td>{toYaTidak(row.tidak_ada_masalah_pribadi)}</td>
                      <td>{toYaTidak(row.siap_bekerja)}</td>

                      {/* Tanda Tangan */}
                      <td>HADIR</td>
                    </tr>
                  ))}
                  {/* Minimum 15 rows logic */}
                  {Array.from({
                    length: Math.max(0, 15 - attendanceData.length),
                  }).map((_, i) => (
                    <tr key={`fill-${i}`}>
                      <td>{attendanceData.length + i + 1}</td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                    </tr>
                  ))}
                </>
              ) : (
                // Empty rows filler (Full 15)
                Array.from({ length: 15 }).map((_, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="print-page-break" />

        {/* ==========================================================================
          HALAMAN 2: FORMULIR KOMUNIKASI & KONSULTASI K3
         ========================================================================== */}
        <div className="print-page">
          {/* ISO HEADER */}
          <div className="iso-header">
            <div className="iso-logo">
              <img src={kmbLogo} alt="Logo" />
            </div>
            <div className="iso-info">
              <div className="iso-title">
                <div className="iso-form-label">FORMULIR</div>
                <div className="iso-form-name">KOMUNIKASI & KONSULTASI K3</div>
                <div className="iso-form-name-en">
                  OSH COMMUNICATION & CONSULTATION
                </div>
              </div>
              <div className="iso-meta">
                <div className="iso-meta-col">
                  <span className="meta-label">No. Dokumen / Document No:</span>
                  <br />
                  <span className="meta-value">F-KMB-SHE-BSIB-008-004</span>
                </div>
                <div className="iso-meta-col">
                  <span className="meta-label">Revisi / Revision:</span>
                  <br />
                  <span className="meta-value">01</span>
                </div>
                <div className="iso-meta-col">
                  <span className="meta-label">
                    Tanggal Efektif / Effective Date:
                  </span>
                  <br />
                  <span className="meta-value">16/09/2025</span>
                </div>
              </div>
            </div>
          </div>

          {/* INFO PERTEMUAN HEADER GRID */}
          <div className="p5m-header-grid">
            {/* Kolom 1 */}
            <div className="p5m-cell">
              <div>
                <span className="p5m-label">Area:</span>
                <br />
                <span className="p5m-value">{area || site}</span>
              </div>
              <div style={{ marginTop: 5 }}>
                <span className="p5m-label">Tanggal:</span>
                <span className="p5m-label-en">(Date)</span>
                <br />
                <span className="p5m-value">{date}</span>
              </div>
            </div>
            {/* Kolom 2 */}
            <div className="p5m-cell">
              <div>
                <span className="p5m-label">Departemen:</span>
                <span className="p5m-label-en">(Department)</span>
                <br />
                <span className="p5m-value">{department}</span>
              </div>
              <div style={{ marginTop: 5 }}>
                <span className="p5m-label">Jam:</span>
                <span className="p5m-label-en">(Hours)</span>
                <br />
                <span className="p5m-label">Dari:</span>{" "}
                <span className="p5m-value">{timeStart}</span>
                <br />
                <span className="p5m-label">Ke:</span>{" "}
                <span className="p5m-value">{timeEnd}</span>
              </div>
            </div>
            {/* Kolom 3 */}
            <div className="p5m-cell">
              <div>
                <span className="p5m-label">Lokasi:</span>
                <span className="p5m-label-en">(Location)</span>
                <br />
                <span className="p5m-value">{place}</span>
              </div>
              <div style={{ marginTop: 5 }}>
                <span className="p5m-label">Durasi:</span>
                <span className="p5m-label-en">(Duration)</span>
                <br />
                <span className="p5m-value">{duration} Menit</span>
              </div>
            </div>
            {/* Kolom 4 - Checklist Jenis Pertemuan */}
            <div className="p5m-cell">
              <div
                className="checkbox-group"
                style={{ flexDirection: "column", gap: 5 }}
              >
                <Checkbox checked={meetingType === "P5M"} label="P5M" />
                <Checkbox
                  checked={meetingType === "Safety Talk"}
                  label="Safety Talk"
                />
                <Checkbox
                  checked={meetingType === "Safety Committee"}
                  label="Safety Committee"
                />
                <Checkbox
                  checked={
                    !["P5M", "Safety Talk", "Safety Committee"].includes(
                      meetingType,
                    )
                  }
                  label="Other"
                />
              </div>
            </div>
          </div>

          {/* TABEL TOPIK */}
          <table className="p5m-table">
            <thead>
              <tr>
                <th style={{ width: "5%" }}>No.</th>
                <th style={{ width: "35%" }}>
                  Topik Yang Dibahas
                  <br />
                  <span className="th-blue">(Topics Discussed)</span>
                </th>
                <th style={{ width: "20%" }}>
                  Dibawakan Oleh
                  <br />
                  <span className="th-blue">(Brought By)</span>
                </th>
                <th style={{ width: "15%" }}>
                  Lampiran
                  <br />
                  <span className="th-blue">(Attachment)</span>
                </th>
                <th style={{ width: "25%" }}>
                  Catatan
                  <br />
                  <span className="th-blue">(Notes)</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {topics.length > 0 ? (
                topics.map((t, i) => (
                  <tr key={i}>
                    <td style={{ textAlign: "center" }}>{i + 1}</td>
                    <td>{t.content}</td>
                    <td>{t.presenter}</td>
                    <td style={{ textAlign: "center" }}>
                      {t.attachment ? "Ada" : "Tidak Ada"}
                    </td>
                    <td>{t.notes}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="row-spacer"></td>
                </tr>
              )}
              {/* Filler rows */}
              {Array.from({ length: Math.max(0, 5 - topics.length) }).map(
                (_, i) => (
                  <tr key={`topic-fill-${i}`}>
                    <td className="row-spacer"></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                ),
              )}
            </tbody>
          </table>

          {/* TABEL MASALAH KARYAWAN */}
          <table className="p5m-table" style={{ borderTop: "none" }}>
            <thead>
              <tr>
                <th style={{ width: "5%" }}>No.</th>
                <th style={{ width: "55%" }} colSpan="3">
                  Masalah Karyawan
                  <br />
                  <span className="th-blue">(Employee Issues)</span>
                </th>
                <th style={{ width: "40%" }}>
                  Disampaikan Oleh
                  <br />
                  <span className="th-blue">(Submitted By)</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {issues.length > 0 ? (
                issues.map((item, i) => (
                  <tr key={i}>
                    <td style={{ textAlign: "center" }}>{i + 1}</td>
                    <td colSpan="3">{item.content}</td>
                    <td>{item.submittedBy}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="row-spacer"></td>
                </tr>
              )}
              {/* Filler rows */}
              {Array.from({ length: Math.max(0, 3 - issues.length) }).map(
                (_, i) => (
                  <tr key={`issue-fill-${i}`}>
                    <td className="row-spacer"></td>
                    <td colSpan="3"></td>
                    <td></td>
                  </tr>
                ),
              )}
            </tbody>
          </table>

          {/* TABEL TINDAKAN PERBAIKAN */}
          <table className="p5m-table" style={{ borderTop: "none" }}>
            <thead>
              <tr>
                <th style={{ width: "5%" }}>No.</th>
                <th style={{ width: "35%" }}>
                  Tindakan Perbaikan Yang Akan Dilakukan
                  <br />
                  <span className="th-blue">
                    (Corrective Actions to Be Taken)
                  </span>
                </th>
                <th style={{ width: "20%" }}>
                  Oleh Siapa
                  <br />
                  <span className="th-blue">(By Whom)</span>
                </th>
                <th style={{ width: "15%" }}>
                  Kapan
                  <br />
                  <span className="th-blue">(When)</span>
                </th>
                <th style={{ width: "25%" }}>
                  Catatan
                  <br />
                  <span className="th-blue">(Notes)</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {actions.length > 0 ? (
                actions.map((act, i) => (
                  <tr key={i}>
                    <td style={{ textAlign: "center" }}>{i + 1}</td>
                    <td>{act.content}</td>
                    <td>{act.pic}</td>
                    <td>{act.due}</td>
                    <td>{act.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="row-spacer"></td>
                </tr>
              )}
              {/* Filler rows */}
              {Array.from({ length: Math.max(0, 3 - actions.length) }).map(
                (_, i) => (
                  <tr key={`action-fill-${i}`}>
                    <td className="row-spacer"></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                ),
              )}
            </tbody>
          </table>

          {/* LAMPIRAN - Gambar di bagian bawah */}
          {images && images.length > 0 && (
            <div style={{ marginTop: 24, pageBreakInside: "avoid" }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#1f2937",
                  marginBottom: 12,
                  borderBottom: "1px solid #d1d5db",
                  paddingBottom: 4,
                }}
              >
                Lampiran
                <span className="th-blue" style={{ fontWeight: 400, color: "#6b7280", marginLeft: 4 }}>
                  (Attachment)
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                {images.map((url, idx) => (
                  <div
                    key={idx}
                    style={{
                      flex: "1 1 120px",
                      minWidth: 100,
                      maxWidth: 180,
                      border: "1px solid #e5e7eb",
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={url}
                      alt={`Lampiran ${idx + 1}`}
                      style={{
                        width: "100%",
                        height: 120,
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FOOTER TANDA TANGAN */}
          <div className="footer-signature">
            <div className="sig-box">
              <span className="sig-label">
                Dicatat Oleh:
                <br />
                <span className="p5m-label-en">(Posted By)</span>
              </span>
              {creatorName && (
                <div className="sig-stamp">
                  {status === "Approved" ? "Disetujui" : "Approve"}
                </div>
              )}
              <div className="sig-name">
                {creatorName || "(...................)"}
              </div>
              {creatorName && creatorJabatan && (
                <div className="sig-jabatan">{creatorJabatan}</div>
              )}
            </div>
            <div className="sig-box">
              <span className="sig-label">
                Mengetahui:
                <br />
                <span className="p5m-label-en">(Know)</span>
              </span>
              {approverName && status === "Approved" && (
                <div className="sig-stamp">Disetujui</div>
              )}
              <div className="sig-name">
                {approverName || "(...................)"}
              </div>
              {approverName && approverJabatan && (
                <div className="sig-jabatan">{approverJabatan}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

export default DailyAttendancePrint;
