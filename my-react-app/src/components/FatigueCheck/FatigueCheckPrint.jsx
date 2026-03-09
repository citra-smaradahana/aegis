import React from "react";
import { getEsignPath } from "../../config/esignMapping";
import "./FatigueCheck.css";

const USERS_PER_PAGE = 5;

/**
 * Template cetak PDF - sesuai form asli F-KMB-SHE-BSIB-014-001
 * Max 5 user per halaman agar box tanda tangan tidak terpotong.
 * Jika > 5, buat halaman baru dengan form lengkap yang sama.
 */
const FatigueCheckPrint = React.forwardRef(({ report }, ref) => {
  const r = report || {};
  const allChecks = Array.isArray(r.checks) ? r.checks : [];

  // Chunk: 5 user per halaman (agar tanda tangan tidak terpotong)
  const pages = [];
  for (let i = 0; i < allChecks.length; i += USERS_PER_PAGE) {
    pages.push(allChecks.slice(i, i + USERS_PER_PAGE));
  }
  if (pages.length === 0) pages.push([]);

  const renderPage = (pageChecks, pageIndex, isLast) => (
    <div
      key={pageIndex}
      className="fc-print-page"
      style={{ pageBreakAfter: isLast ? "auto" : "always" }}
    >
        {/* Header Table */}
        <table className="fc-header-table">
          <tbody>
            <tr>
              <td className="fc-header-logo-cell" rowSpan={2}>
                <img src="/kmb.png" alt="Logo KMB" className="fc-logo" />
              </td>
              <td className="fc-header-title-cell" colSpan={3}>
                <div className="fc-title-main">FORMULIR</div>
                <div className="fc-title-sub-blue">FORM</div>
                <div className="fc-title-main">
                  PEMERIKSAAN KELELAHAN (FATIGUE CHECK)
                </div>
                <div className="fc-title-sub-blue">
                  FATIGUE INSPECTION (FATIGUE CHECK)
                </div>
              </td>
            </tr>
            <tr>
              <td className="fc-header-info-cell">
                No. Dokumen{" "}
                <span className="fc-italic-blue">(Document No.)</span> :
                F-KMB-SHE-BSIB-014-001
              </td>
              <td className="fc-header-info-cell">
                No. Revisi{" "}
                <span className="fc-italic-blue">(Revision No.)</span> : 01
              </td>
              <td className="fc-header-info-cell">
                Tanggal Efektif{" "}
                <span className="fc-italic-blue">(Effective Date)</span> :
                16/09/2025
              </td>
            </tr>
          </tbody>
        </table>

        {/* Info Fields */}
        <div className="fc-info-section">
          <div className="fc-info-row">
            <div className="fc-info-item">
              Hari / Tanggal{" "}
              <span className="fc-italic-blue">(Day / Date)</span> :{" "}
              {r.date || "...................................."}
            </div>
            <div className="fc-info-item">
              Site : {r.site || "...................................."}
              {pages.length > 1 && (
                <span style={{ marginLeft: 8, fontWeight: 600 }}>
                  | Halaman {pageIndex + 1} dari {pages.length}
                </span>
              )}
            </div>
          </div>
          <div className="fc-info-row">
            <div className="fc-info-item">
              Shift Kerja <span className="fc-italic-blue">(Work Shift)</span> :{" "}
              {r.shift || "...................................."}
            </div>
            <div className="fc-info-item">
              Lokasi Pemeriksaan{" "}
              <span className="fc-italic-blue">(Inspection Location)</span> :{" "}
              {r.location || "...................................."}
            </div>
          </div>
        </div>

        {/* Main Table */}
        <table className="fc-main-table">
          <thead>
            <tr>
              <th rowSpan={2} className="fc-th">
                Nama Pekerja
                <br />
                <span className="fc-th-sub">Worker's Name</span>
              </th>
              <th rowSpan={2} className="fc-th">
                NIK
                <br />
                <span className="fc-th-sub">Employee ID</span>
              </th>
              <th rowSpan={2} className="fc-th">
                Jabatan / Pekerjaan
                <br />
                <span className="fc-th-small">
                  (Operator MMU / Forklift / Mekanik)
                </span>
                <br />
                <span className="fc-th-sub">
                  Position / Job
                  <br />
                  (MMU Operator / Forklift Operator / Mechanic)
                </span>
              </th>
              <th rowSpan={2} className="fc-th">
                Hari Kerja
                <br />
                <span className="fc-th-sub">Workday</span>
              </th>
              <th rowSpan={2} className="fc-th">
                Jumlah Jam Tidur 1x24 (Di Rumah / Mess)
                <br />
                <span className="fc-th-sub">
                  Total Sleep Hours (in 24h, at Home / Mess)
                </span>
              </th>
              <th rowSpan={2} className="fc-th">
                Jam Periksa / Inspeksi / Sidak / Check / Spot Check Time
              </th>
              <th colSpan={4} className="fc-th">
                Hasil Pemeriksaan Soberity Test (Jika Unfit beri tanda x)
                <br />
                <span className="fc-th-sub">
                  Soberity Test Result (Mark "x" if Unfit)
                </span>
              </th>
              <th colSpan={2} className="fc-th">
                Pelaksanaan Kontak Positif
                <br />
                <span className="fc-th-sub">
                  Positive Contact Implementation
                </span>
              </th>
              <th rowSpan={2} className="fc-th">
                Hasil Pengukuran Tekanan Darah
                <br />
                <span className="fc-th-sub">
                  Blood Pressure Measurement Results
                </span>
              </th>
              <th colSpan={2} className="fc-th">
                Kriteria Fit / Unfit
                <br />
                <span className="fc-th-sub">Fit / Unfit Criteria</span>
              </th>
              <th rowSpan={2} className="fc-th">
                Mess / Luar Mess
                <br />
                <span className="fc-th-sub">Mess / Outside Mess</span>
              </th>
              <th rowSpan={2} className="fc-th">
                Jika Unfit tindakan yang diambil
                <br />
                <span className="fc-th-sub">Actions Taken if Unfit</span>
              </th>
            </tr>
            <tr>
              <th className="fc-th-num">1</th>
              <th className="fc-th-num">2</th>
              <th className="fc-th-num">3</th>
              <th className="fc-th-num">4</th>
              <th className="fc-th-sub-col">
                Melalui Radio (Jam)
                <br />
                <span className="fc-th-sub">Through Radio (Time)</span>
              </th>
              <th className="fc-th-sub-col">
                Tatap Muka & Bicara (Jam)
                <br />
                <span className="fc-th-sub">Face-to-Face (hrs)</span>
              </th>
              <th className="fc-th-sub-col">Fit</th>
              <th className="fc-th-sub-col">Unfit</th>
            </tr>
          </thead>
          <tbody>
            {pageChecks.map((c, i) => (
              <tr key={i}>
                <td className="fc-td fc-td-nama">{c.nama}</td>
                <td className="fc-td">{c.nrp}</td>
                <td className="fc-td fc-td-nama">{c.jabatan}</td>
                <td className="fc-td">{c.hari_kerja}</td>
                <td className="fc-td">{c.jam_tidur}</td>
                <td className="fc-td">{c.jam_periksa}</td>
                <td className="fc-td-center">{c.soberity_1 ? "X" : ""}</td>
                <td className="fc-td-center">{c.soberity_2 ? "X" : ""}</td>
                <td className="fc-td-center">{c.soberity_3 ? "X" : ""}</td>
                <td className="fc-td-center">{c.soberity_4 ? "X" : ""}</td>
                <td className="fc-td">{c.kontak_radio}</td>
                <td className="fc-td">{c.kontak_tatap_muka}</td>
                <td className="fc-td">{c.tekanan_darah}</td>
                <td className="fc-td-center">{c.fit ? "✓" : ""}</td>
                <td className="fc-td-center">{c.unfit ? "✓" : ""}</td>
                <td className="fc-td">{c.mess_luar_mess}</td>
                <td className="fc-td">{c.tindakan_unfit}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div className="fc-footer">
          <div className="fc-footer-left">
            <div className="fc-footer-title">
              Keterangan Hasil Pemeriksaan (Soberity Test)
              <br />
              <span className="fc-footer-sub">
                Remarks on Soberity Test Results
              </span>
            </div>
            <ol className="fc-footer-list">
              <li>
                Berjalan Sempoyongan (UNFIT)
                <br />
                <span className="fc-footer-sub">
                  (Staggering while walking (UNFIT))
                </span>
              </li>
              <li>
                Menurunkan 1 (satu) kaki sebelum 10 detik (UNFIT)
                <br />
                <span className="fc-footer-sub">
                  (Lowering one foot before 10 seconds (UNFIT))
                </span>
              </li>
              <li>
                Tidak bisa memutar dengan 1 (satu) kaki (UNFIT)
                <br />
                <span className="fc-footer-sub">
                  (Unable to rotate on one foot (UNFIT))
                </span>
              </li>
              <li>
                Kurang tanggap instruksi yang sederhana (UNFIT)
                <br />
                <span className="fc-footer-sub">
                  (Slow or unresponsive to simple instructions (UNFIT))
                </span>
              </li>
            </ol>
            {/* Signatures - Inspektor */}
            <div className="fc-signature-table">
              <div className="fc-sig-col">
                <div className="fc-sig-header">
                  Nama Inspektor
                  <br />
                  <span className="fc-italic-blue">Inspector Name</span>
                </div>
                <div className="fc-sig-value">
                  {r.inspector_name || "......................"}
                </div>
              </div>
              <div className="fc-sig-col">
                <div className="fc-sig-header">
                  Tanda Tangan
                  <br />
                  <span className="fc-italic-blue">Signature</span>
                </div>
                <div className="fc-sig-value fc-sig-value-esign">
                  {getEsignPath(r.inspector_name) ? (
                    <img
                      src={getEsignPath(r.inspector_name)}
                      alt="Tanda tangan inspektor"
                      className="fc-esign-img"
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="fc-footer-right">
            <div className="fc-footer-title">
              Beberapa TINDAKAN YANG DAPAT DILAKUKAN JIKA UNFIT{" "}
              <span className="fc-footer-sub-blue">
                (Possible Actions to Take if Unfit)
              </span>
            </div>
            <div className="fc-footer-cols">
              <ol className="fc-footer-list">
                <li>
                  Minum Kafein/Kopi Pahit
                  <br />
                  <span className="fc-footer-sub">
                    Drink caffeine / black coffee
                  </span>
                </li>
                <li>
                  Minum air putih
                  <br />
                  <span className="fc-footer-sub">Drink mineral water</span>
                </li>
                <li>
                  Melakukan perenggangan badan / Olahraga ringan
                  <br />
                  <span className="fc-footer-sub">
                    Do stretching or light exercise
                  </span>
                </li>
                <li>
                  Istirahat tenang (tanpa tidur) 5-15 menit
                  <br />
                  <span className="fc-footer-sub">
                    Quiet rest (without sleeping) for 5-15 minutes
                  </span>
                </li>
                <li>
                  Tidur sejenak 15-30 menit (napping)
                  <br />
                  <span className="fc-footer-sub">
                    Take a short nap (15-30 minutes)
                  </span>
                </li>
              </ol>
              <ol className="fc-footer-list" start="6">
                <li>
                  Tidur &gt; 1 Jam{" "}
                  <span className="fc-footer-sub">
                    (Sleep for more than 1 hour)
                  </span>
                </li>
                <li>
                  Dipulangkan ke rumah / Mess{" "}
                  <span className="fc-footer-sub">
                    (Sent home / back to the mess)
                  </span>
                </li>
                <li>
                  Cuci muka dengan air dingin{" "}
                  <span className="fc-footer-sub">
                    (Wash face with cold water)
                  </span>
                </li>
                <li>
                  Lainnya, sebutkan{" "}
                  <span className="fc-footer-sub">
                    (Others (please specify))
                  </span>
                </li>
              </ol>
            </div>
          </div>
        </div>
    </div>
  );

  return (
    <div className="fatigue-check-print-container" ref={ref}>
      {pages.map((pageChecks, idx) =>
        renderPage(pageChecks, idx, idx === pages.length - 1)
      )}
    </div>
  );
});

FatigueCheckPrint.displayName = "FatigueCheckPrint";
export default FatigueCheckPrint;
